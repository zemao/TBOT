"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
const currencyDatabase = require("../database/currencyDatabase");
const CommandManager = require("../chat/commands/CommandManager");
const twitchChat = require('../chat/twitch-chat');
const moment = require("moment");
const connectionManager = require("../common/connection-manager");
const util = require("../utility");

let currencyInterval = null;

// This file manages the currency payout intervals.
// For manipulating currency check out /database/currencyDatabase.js
function processCurrencyTimer(currency) {
    let bonusObject = currency.bonus;
    let basePayout = currency.payout;

    // offline currency not set and stream is offline
    if (currency.offline == null && !connectionManager.streamerIsOnline()) {
        return;
    }

    // If we have an offline currency amount and the streamer is offline, then use that.
    if (currency.offline != null && !connectionManager.streamerIsOnline()) {
        basePayout = currency.offline;
    }


    // Add base payout to everyone.
    currencyDatabase.addCurrencyToOnlineUsers(currency.id, basePayout).then(async () => {
        // Loop through our bonuses and try to apply the currency.
        try {
            for (let bonusKey of Object.keys(bonusObject)) {
                await currencyDatabase.addCurrencyToUserGroupOnlineUsers([bonusKey], currency.id, bonusObject[bonusKey]);
            }
        } catch (err) {
            logger.error('Error while processing currency timer. Could not add bonus currency to a role.', err);
        }
    }).catch(() => {
        logger.error('Error while processing currency timer. Could not add currency to all online users.');
        return;
    });
}

// This is run when the interval fires for currencies.
function applyCurrency() {
    logger.debug("Running currency timer...");

    let currencyData = currencyDatabase.getCurrencies();

    Object.values(currencyData).forEach(currency => {
        let currentMinutes = moment().minutes();
        let intervalMod = currentMinutes % currency.interval;
        const chatConnected = twitchChat.chatIsConnected();
        if (intervalMod === 0 && currency.active && chatConnected) {
            // do payout
            logger.info(
                "Currency: Paying out " + currency.payout + " " + currency.name + "."
            );
            processCurrencyTimer(currency);
        } else if (!chatConnected) {
            logger.debug(`Currency: Not connected to chat, so ${currency.name} will not pay out.`);
        } else if (!currency.active) {
            logger.debug(`Currency: ${currency.name} is not active, so it will not pay out.`);
        } else if (intervalMod !== 0) {
            logger.debug(`Currency: ${currency.name} is not ready to pay out yet.`);
        } else {
            logger.error(`Currency: Something weird happened and ${currency.name} couldnt pay out.`);
        }
    });
}

// This will stop our currency timers.
function stopTimer() {
    logger.debug("Clearing previous currency intervals");
    if (currencyInterval != null) {
        clearInterval(currencyInterval);
        currencyInterval = null;
    }
}

// Start up our currency timers at the next full minute mark.
// Then we'll check all of our currencies each minute to see if any need to be applied.
function startTimer() {
    let currentTime = moment();
    let nextMinute = moment()
        .endOf("minute")
        .add(1, "s");
    let diff = nextMinute.diff(currentTime, "seconds");

    logger.debug(`Currency timer will start in ${diff} seconds`);

    setTimeout(() => {
        stopTimer();
        logger.debug("Starting currency timer.");
        //start timer, fire interval every minute.
        currencyInterval = setInterval(() => {
            applyCurrency();
        }, 60000);
    }, diff * 1000);
}

/**
 * Creates a command definition when given a currency name.
 * @param {*} currencyName
 */
function createCurrencyCommandDefinition(currency) {
    let currencyId = currency.id,
        currencyName = currency.name,
        cleanName = currencyName.replace(/\s+/g, '-').toLowerCase(); // lowecase and replace spaces with dash.

    // Define our command.
    const commandManagement = {
        definition: {
            id: "twitcherbot:currency:" + currencyId,
            name: currencyName + " Management",
            active: true,
            trigger: "!" + cleanName,
            description: "Allows management of the \"" + currencyName + "\" currency",
            autoDeleteTrigger: false,
            scanWholeMessage: false,
            currency: {
                name: currencyName,
                id: currencyId
            },
            cooldown: {
                user: 0,
                global: 0
            },
            baseCommandDescription: "See your balance",
            options: {
                currencyBalanceMessageTemplate: {
                    type: "string",
                    title: "Currency Balance Message Template",
                    description: "How the currency balance message appears in chat.",
                    tip: "Variables: {user}, {currency}, {amount}",
                    default: `{user}'s {currency} total is {amount}`,
                    useTextArea: true
                },
                whisperCurrencyBalanceMessage: {
                    type: "boolean",
                    title: "Whisper Currency Balance Message",
                    default: false
                },
                addMessageTemplate: {
                    type: "string",
                    title: "Add Currency Message Template",
                    description: "How the !currency add message appears in chat.",
                    tip: "Variables: {user}, {currency}, {amount}",
                    default: `Added {amount} {currency} to {user}.`,
                    useTextArea: true
                },
                removeMessageTemplate: {
                    type: "string",
                    title: "Remove Currency Message Template",
                    description: "How the !currency remove message appears in chat.",
                    tip: "Variables: {user}, {currency}, {amount}",
                    default: `Removed {amount} {currency} from {user}.`,
                    useTextArea: true
                },
                addAllMessageTemplate: {
                    type: "string",
                    title: "Add All Currency Message Template",
                    description: "How the !currency addall message appears in chat.",
                    tip: "Variables: {currency}, {amount}",
                    default: `Added {amount} {currency} to everyone!`,
                    useTextArea: true
                },
                removeAllMessageTemplate: {
                    type: "string",
                    title: "Remove All Currency Message Template",
                    description: "How the !currency removeall message appears in chat.",
                    tip: "Variables: {currency}, {amount}",
                    default: `Removed {amount} {currency} from everyone!`,
                    useTextArea: true
                }
            },
            subCommands: [
                {
                    arg: "add",
                    usage: "add [@user] [amount]",
                    description: "Adds currency for a given user.",
                    restrictionData: {
                        restrictions: [
                            {
                                id: "sys-cmd-mods-only-perms",
                                type: "twitcherbot:permissions",
                                mode: "roles",
                                roleIds: [
                                    "mod",
                                    "broadcaster"
                                ]
                            }
                        ]
                    }
                },
                {
                    arg: "remove",
                    usage: "remove [@user] [amount]",
                    description: "Removes currency for a given user.",
                    restrictionData: {
                        restrictions: [
                            {
                                id: "sys-cmd-mods-only-perms",
                                type: "twitcherbot:permissions",
                                mode: "roles",
                                roleIds: [
                                    "mod",
                                    "broadcaster"
                                ]
                            }
                        ]
                    }
                },
                {
                    arg: "give",
                    usage: "give [@user] [amount]",
                    description: "Gives currency from one user to another user."
                },
                {
                    arg: "addall",
                    usage: "addall [amount]",
                    description: "Adds currency to all online users.",
                    restrictionData: {
                        restrictions: [
                            {
                                id: "sys-cmd-mods-only-perms",
                                type: "twitcherbot:permissions",
                                mode: "roles",
                                roleIds: [
                                    "mod",
                                    "broadcaster"
                                ]
                            }
                        ]
                    }
                },
                {
                    arg: "removeall",
                    usage: "removeall [amount]",
                    description: "Removes currency from all online users.",
                    restrictionData: {
                        restrictions: [
                            {
                                id: "sys-cmd-mods-only-perms",
                                type: "twitcherbot:permissions",
                                mode: "roles",
                                roleIds: [
                                    "mod",
                                    "broadcaster"
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        /**
         * When the command is triggered
         */
        onTriggerEvent: async event => {

            const twitchChat = require("../chat/twitch-chat");

            let { commandOptions } = event;
            let triggeredArg = event.userCommand.triggeredArg;
            let args = event.userCommand.args;
            let currencyName = event.command.currency.name;

            // No args, tell the user how much currency they have.
            if (args.length === 0) {
                currencyDatabase.getUserCurrencyAmount(event.userCommand.commandSender, currencyId).then(function(amount) {
                    if (!isNaN(amount)) {
                        const balanceMessage = commandOptions.currencyBalanceMessageTemplate
                            .replace("{user}", event.userCommand.commandSender)
                            .replace("{currency}", currencyName)
                            .replace("{amount}", util.commafy(amount));

                        twitchChat.sendChatMessage(balanceMessage, commandOptions.whisperCurrencyBalanceMessage ? event.userCommand.commandSender : null);
                    } else {
                        logger.log('Error while trying to show currency amount to user via chat command.');
                    }
                });
            }

            // Arguments passed, what are we even doing?!?
            switch (triggeredArg) {
            case "add": {
                // Get username and make sure our currency amount is a positive integer.
                let username = args[1].replace(/^@/, ''),
                    currencyAdjust = Math.abs(parseInt(args[2]));

                // Adjust currency, it will return true on success and false on failure.
                currencyDatabase.adjustCurrencyForUser(username, currencyId, currencyAdjust).then(function(status) {
                    if (status) {
                        const addMessageTemplate = commandOptions.addMessageTemplate
                            .replace("{user}", username)
                            .replace("{currency}", currencyName)
                            .replace("{amount}", util.commafy(currencyAdjust));
                        twitchChat.sendChatMessage(addMessageTemplate);
                    } else {
                        // Error removing currency.
                        twitchChat.sendChatMessage(
                            `Error: Could not add currency to user.`);
                        logger.error('Error adding currency for user (' + username + ') via chat command. Currency: ' + currencyId + '. Value: ' + currencyAdjust);
                    }
                });

                break;
            }
            case "remove": {
                // Get username and make sure our currency amount is a negative integer.
                let username = args[1].replace(/^@/, ''),
                    currencyAdjust = -Math.abs(parseInt(args[2]));

                // Adjust currency, it will return true on success and false on failure.
                let adjustSuccess = await currencyDatabase.adjustCurrencyForUser(username, currencyId, currencyAdjust);
                if (adjustSuccess) {
                    const removeMessageTemplate = commandOptions.removeMessageTemplate
                        .replace("{user}", username)
                        .replace("{currency}", currencyName)
                        .replace("{amount}", util.commafy(parseInt(args[2])));
                    twitchChat.sendChatMessage(removeMessageTemplate);
                } else {
                    // Error removing currency.
                    twitchChat.sendChatMessage(
                        `Error: Could not remove currency from user.`);
                    logger.error('Error removing currency for user (' + username + ') via chat command. Currency: ' + currencyId + '. Value: ' + currencyAdjust);
                }

                break;
            }
            case "give": {
                // Get username and make sure our currency amount is a positive integer.
                let username = args[1].replace(/^@/, ''),
                    currencyAdjust = Math.abs(parseInt(args[2])),
                    currencyAdjustNeg = -Math.abs(parseInt(args[2]));

                // Does this currency have transfer active?
                let currencyCheck = currencyDatabase.getCurrencies();
                if (currencyCheck[currencyId].transfer === "Disallow") {
                    twitchChat.sendChatMessage('Transfers are not allowed for this currency.');
                    logger.debug(event.userCommand.commandSender + ' tried to give currency, but transfers are turned off for it. ' + currencyId);
                    return false;
                }

                // Dont allow person to give themselves currency.
                if (event.userCommand.commandSender.toLowerCase() === username.toLowerCase()) {
                    twitchChat.sendChatMessage(
                        `${event.userCommand.commandSender}, you can't give yourself currency.`);
                    logger.debug(username + ' tried to give themselves currency.');
                    return false;
                }

                // eslint-disable-next-line no-warning-comments
                // Need to check to make sure they have enough currency before continuing.
                let userAmount = await currencyDatabase.getUserCurrencyAmount(event.userCommand.commandSender, currencyId);

                // If we get false, there was an error.
                if (userAmount === false) {
                    twitchChat.sendChatMessage('Error: Could not retrieve currency.');
                    return false;
                }

                // Check to make sure we have enough currency to give.
                if (userAmount < currencyAdjust) {
                    twitchChat.sendChatMessage('You do not have enough ' + currencyName + ' to do this action.');
                    return false;
                }

                // Okay, try to add to user first. User is not guaranteed to be in the DB because of possible typos.
                // So we check this first, then remove from the command sender if this succeeds.
                let adjustCurrencySuccess = await currencyDatabase.adjustCurrencyForUser(username, currencyId, currencyAdjust);
                if (adjustCurrencySuccess) {
                    // Subtract currency from command user now.
                    currencyDatabase.adjustCurrencyForUser(event.userCommand.commandSender, currencyId, currencyAdjustNeg).then(function(status) {
                        if (status) {
                            twitchChat.sendChatMessage('Gave ' + util.commafy(currencyAdjust) + ' ' + currencyName + ' to ' + username + '.', null);
                            return true;
                        }
                        // Error removing currency.
                        twitchChat.sendChatMessage(
                            `Error: Could not remove currency to user during give transaction.`);
                        logger.error('Error removing currency during give transaction for user (' + username + ') via chat command. Currency: ' + currencyId + '. Value: ' + currencyAdjust);
                        return false;

                    });

                } else {
                    // Error removing currency.
                    twitchChat.sendChatMessage(`Error: Could not add currency to user. Was there a typo in the username?`);
                    logger.error('Error adding currency during give transaction for user (' + username + ') via chat command. Currency: ' + currencyId + '. Value: ' + currencyAdjust);
                    return false;
                }

                break;
            }
            case "addall": {
                let currencyAdjust = Math.abs(parseInt(args[1]));
                if (isNaN(currencyAdjust)) {
                    twitchChat.sendChatMessage(
                        `Error: Could not add currency to all online users.`);
                    return;
                }
                currencyDatabase.addCurrencyToOnlineUsers(currencyId, currencyAdjust, true);

                const addAllMessageTemplate = commandOptions.addAllMessageTemplate
                    .replace("{currency}", currencyName)
                    .replace("{amount}", util.commafy(currencyAdjust));
                twitchChat.sendChatMessage(addAllMessageTemplate);

                break;
            }
            case "removeall": {
                let currencyAdjust = -Math.abs(parseInt(args[1]));
                if (isNaN(currencyAdjust)) {
                    twitchChat.sendChatMessage(
                        `Error: Could not remove currency from all online users.`);
                    return;
                }
                currencyDatabase.addCurrencyToOnlineUsers(currencyId, currencyAdjust, true);

                const removeAllMessageTemplate = commandOptions.removeAllMessageTemplate
                    .replace("{currency}", currencyName)
                    .replace("{amount}", util.commafy(parseInt(args[1])));
                twitchChat.sendChatMessage(removeAllMessageTemplate);

                break;
            }
            default: {
                // Warning: This block can't be entirely empty according to LINT.
            }
            }
        }
    };

    return commandManagement;
}

/**
 * Makes sure our currency system commands are up to date.
 * @param {*} currency - The currency object that was saved.
 * @param {*} action - Update, Create, or Delete
 */
function refreshCurrencyCommands(action = false, currency = false) {
    // If we don't get currency stop here.
    if (currency === false) {
        logger.error('Invalid currency passed to refresh currency commands.');
        return;
    }

    // Log our action for logger.
    logger.debug('Currency "' + currency.name + '" action "' + action + '" triggered. Updating currency system commands.');

    // Decide what we want to do based on the action that was passed to us.
    switch (action) {
    case "update":
        CommandManager.unregisterSystemCommand("twitcherbot:currency:" + currency.id);
        CommandManager.registerSystemCommand(
            createCurrencyCommandDefinition(currency)
        );
        break;
    case "delete":
        // Delete the system command for this currency.
        CommandManager.unregisterSystemCommand("twitcherbot:currency:" + currency.id);
        break;
    case "create":
        // Build a new system command def and register it.
        CommandManager.registerSystemCommand(
            createCurrencyCommandDefinition(currency)
        );
        break;
    default:
        logger.error('Invalid action passed to refresh currency commands.');
        return;
    }
}

/**
 * Loops through all currencies we have and passes them to refresh currency commands.
 * This lets us create all of our currency commands when the application is started.
 */
function createAllCurrencyCommands() {
    logger.log('Creating all currency commands.');
    let currencyData = currencyDatabase.getCurrencies();

    Object.values(currencyData).forEach(currency => {
        refreshCurrencyCommands('create', currency);
    });
}

// Refresh our currency commands.
ipcMain.on("refreshCurrencyCommands", (event, data) => {
    refreshCurrencyCommands(data.action, data.currency);
});

// Start up our currency timers.
// Also fired in currencyDatabase.js.
ipcMain.on("refreshCurrencyCache", () => {
    startTimer();
});

exports.startTimer = startTimer;
exports.stopTimer = stopTimer;
exports.createAllCurrencyCommands = createAllCurrencyCommands;