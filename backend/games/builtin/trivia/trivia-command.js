"use strict";

const util = require("../../../utility");
const twitchChat = require("../../../chat/twitch-chat");
const twitchListeners = require("../../../chat/chat-listeners/twitch-chat-listeners");
const commandManager = require("../../../chat/commands/CommandManager");
const gameManager = require("../../game-manager");
const currencyDatabase = require("../../../database/currencyDatabase");
const customRolesManager = require("../../../roles/custom-roles-manager");
const teamRolesManager = require("../../../roles/team-roles-manager");
const twitchRolesManager = require("../../../../shared/twitch-roles");
const logger = require("../../../logwrapper");
const moment = require("moment");
const triviaHelper = require("./trivia-helper");
const NodeCache = require("node-cache");

let fiveSecTimeoutId;
let answerTimeoutId;
let currentQuestion = null;

function clearCurrentQuestion() {
    currentQuestion = null;
    if (fiveSecTimeoutId) {
        clearTimeout(fiveSecTimeoutId);
        fiveSecTimeoutId = null;
    }
    if (answerTimeoutId) {
        clearTimeout(answerTimeoutId);
        answerTimeoutId = null;
    }
}

twitchListeners.events.on("chat-message", async data => {
    /**@type {import("../../../chat/chat-helpers").TwitchbotChatMessage} */
    const chatMessage = data;
    if (!currentQuestion) return;
    const { username, question, wager, winningsMultiplier, currencyId, chatter } = currentQuestion;
    //ensure chat is from question user
    if (username !== chatMessage.username) return;
    //grab args
    const args = chatMessage.rawText.split(" ");
    if (args.length < 1) return;
    //insure number
    const firstArg = parseInt(args[0]);
    if (isNaN(firstArg)) return;
    // outside the answer bound
    if (firstArg < 1 || firstArg > question.answers.length) return;

    const isCorrect = firstArg === question.correctIndex;

    if (isCorrect) {
        const winnings = Math.floor(wager * winningsMultiplier);

        await currencyDatabase.adjustCurrencyForUser(username, currencyId, winnings);

        const currency = currencyDatabase.getCurrencyById(currencyId);

        twitchChat.sendChatMessage(`${username}, that is correct! You have won ${util.commafy(winnings)} ${currency.name}`, null, chatter);
    } else {
        twitchChat.sendChatMessage(`Sorry ${username}, that is incorrect. Better luck next time!`, null, chatter);
    }
    clearCurrentQuestion();
});

const cooldownCache = new NodeCache({ checkperiod: 5 });

const TRIVIA_COMMAND_ID = "twitcherbot:trivia";

const triviaCommand = {
    definition: {
        id: TRIVIA_COMMAND_ID,
        name: "Trivia",
        active: true,
        trigger: "!trivia",
        description: "Allows viewers to play trivia",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        hideCooldowns: true,
        subCommands: [
            {
                id: "wagerAmount",
                arg: "\\d+",
                regex: true,
                usage: "[wager]",
                description: "Triggers trivia for the given wager amount",
                hideCooldowns: true
            }
        ]
    },
    onTriggerEvent: async event => {

        const { userCommand } = event;

        const triviaSettings = gameManager.getGameSettings("twitcherbot-trivia");
        const chatter = triviaSettings.settings.chatSettings.chatter;

        if (event.userCommand.subcommandId === "wagerAmount") {

            const triggeredArg = userCommand.args[0];
            const wagerAmount = parseInt(triggeredArg);

            const username = userCommand.commandSender;

            if (currentQuestion) {
                if (currentQuestion.username === username) {
                    twitchChat.sendChatMessage(`${username}, you already have a trivia question in progress!`, null, chatter);
                    return;
                }
                twitchChat.sendChatMessage(`${username}, someone else is currently answering a question. Please wait for them to finish.`, null, chatter);
                return;
            }

            const cooldownExpireTime = cooldownCache.get(username);
            if (cooldownExpireTime && moment().isBefore(cooldownExpireTime)) {
                const timeRemainingDisplay = util.secondsForHumans(Math.abs(moment().diff(cooldownExpireTime, 'seconds')));
                twitchChat.sendChatMessage(`${username}, trivia is currently on cooldown for you. Time remaining: ${timeRemainingDisplay}`, null, chatter);
                return;
            }

            if (wagerAmount < 1) {
                twitchChat.sendChatMessage(`${username}, your wager amount must be more than 0.`, null, chatter);
                return;
            }

            const minWager = triviaSettings.settings.currencySettings.minWager;
            if (minWager != null & minWager > 0) {
                if (wagerAmount < minWager) {
                    twitchChat.sendChatMessage(`${username}, your wager amount must be at least ${minWager}.`, null, chatter);
                    return;
                }
            }
            const maxWager = triviaSettings.settings.currencySettings.maxWager;
            if (maxWager != null & maxWager > 0) {
                if (wagerAmount > maxWager) {
                    twitchChat.sendChatMessage(`${username}, your wager amount can be no more than ${maxWager}.`, null, chatter);
                    return;
                }
            }

            const currencyId = triviaSettings.settings.currencySettings.currencyId;
            let userBalance;
            try {
                userBalance = await currencyDatabase.getUserCurrencyAmount(username, currencyId);
            } catch (error) {
                logger.error(error);
                userBalance = 0;
            }

            if (userBalance < wagerAmount) {
                twitchChat.sendChatMessage(`${username}, you don't have enough to wager this amount!`, null, chatter);
                return;
            }

            const question = await triviaHelper.getQuestion(
                triviaSettings.settings.questionSettings.enabledCategories,
                triviaSettings.settings.questionSettings.enabledDifficulties,
                triviaSettings.settings.questionSettings.enabledTypes,
            );

            if (question == null) {
                twitchChat.sendChatMessage(`Sorry ${username}, there was an issue finding you a trivia question. Your wager has not been deducted.`, null, chatter);
                return;
            }

            let cooldownSecs = triviaSettings.settings.cooldownSettings.cooldown;
            if (cooldownSecs && cooldownSecs > 0) {
                const expireTime = moment().add(cooldownSecs, 'seconds');
                cooldownCache.set(username, expireTime, cooldownSecs);
            }

            try {
                await currencyDatabase.adjustCurrencyForUser(username, currencyId, -Math.abs(wagerAmount));
            } catch (error) {
                logger.error(error);
                twitchChat.sendChatMessage(`Sorry ${username}, there was an error deducting currency from your balance so trivia has been canceled.`, null, chatter);
                return;
            }

            const userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username) || [];
            const userTeamRoles = await teamRolesManager.getAllTeamRolesForViewer(username) || [];
            const userTwitchRoles = (userCommand.senderRoles || [])
                .map(r => twitchRolesManager.mapTwitchRole(r))
                .filter(r => !!r);

            const allRoles = [
                ...userTwitchRoles,
                ...userTeamRoles,
                ...userCustomRoles
            ];

            // get the users winnings multiplier
            let winningsMultiplier = 1.25;

            const multiplierSettings = triviaSettings.settings.multiplierSettings;

            let winningsMultiplierSettings;
            if (question.difficulty === "easy") {
                winningsMultiplierSettings = multiplierSettings.easyMultipliers;
            }
            if (question.difficulty === "medium") {
                winningsMultiplierSettings = multiplierSettings.mediumMultipliers;
            }
            if (question.difficulty === "hard") {
                winningsMultiplierSettings = multiplierSettings.hardMultipliers;
            }

            if (winningsMultiplierSettings) {
                winningsMultiplier = winningsMultiplierSettings.base;

                for (let role of winningsMultiplierSettings.roles) {
                    if (allRoles.some(r => r.id === role.roleId)) {
                        winningsMultiplier = role.value;
                        break;
                    }
                }
            }

            currentQuestion = {
                username: username,
                question: question,
                wager: wagerAmount,
                winningsMultiplier: winningsMultiplier,
                currencyId: currencyId,
                chatter: chatter
            };

            const answerTimeout = triviaSettings.settings.questionSettings.answerTime;

            const questionMessage = `@${username} trivia (${question.difficulty}): ${question.question} ${question.answers.map((v, i) => `${i + 1}) ${v}`).join(" ")} [Chat the correct answer # within ${answerTimeout} secs]`;

            twitchChat.sendChatMessage(questionMessage, null, chatter);

            fiveSecTimeoutId = setTimeout(() => {
                if (currentQuestion == null || currentQuestion.username !== username) return;
                twitchChat.sendChatMessage(`@${username}, 5 seconds remaining to answer...`, null, chatter);
            }, (answerTimeout - 6) * 1000);

            answerTimeoutId = setTimeout(() => {
                if (currentQuestion == null || currentQuestion.username !== username) return;
                twitchChat.sendChatMessage(`@${username} did not provide an answer in time!`, null, chatter);
                clearCurrentQuestion();
            }, answerTimeout * 1000);
        } else {
            twitchChat.sendChatMessage(`Incorrect trivia usage: ${userCommand.trigger} [wager]`, null, chatter);
        }
    }
};

function registerTriviaCommand() {
    if (!commandManager.hasSystemCommand(TRIVIA_COMMAND_ID)) {
        commandManager.registerSystemCommand(triviaCommand);
    }
}

function unregisterTriviaCommand() {
    commandManager.unregisterSystemCommand(TRIVIA_COMMAND_ID);
}

function purgeCaches() {
    cooldownCache.flushAll();
    clearCurrentQuestion();
}

exports.purgeCaches = purgeCaches;
exports.registerTriviaCommand = registerTriviaCommand;
exports.unregisterTriviaCommand = unregisterTriviaCommand;