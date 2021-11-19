"use strict";

const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const frontendCommunicator = require("../../common/frontend-communicator");

const commandAccess = require("../../chat/commands/command-access");
const countersManager = require("../../counters/counter-manager");
const effectQueueManager = require("../../effects/queues/effect-queue-manager");
const eventsAccess = require("../../events/events-access");
const timerAccess = require("../../timers/timer-access");
const presetEffectListManager = require("../../effects/preset-lists/preset-effect-list-manager");
const customRolesManager = require("../../roles/custom-roles-manager");
const { escapeRegExp } = require("../../utility");

function findAndReplaceCurrency(data, currency) {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
        if (value && typeof value === "string") {
            if (value.includes("$currency[")) {
                data[key] = data[key].replace(/\$currency\[\w+\b/gm, `$currency[${currency.name}`);
            }
            if (value.includes("$topCurrency[")) {
                data[key] = data[key].replace(/\$topCurrency\[\w+\b/gm, `$topCurrency[${currency.name}`);
            }
            if (value.includes("$topCurrencyUser[")) {
                data[key] = data[key].replace(/\$topCurrencyUser\[\w+\b/gm, `$topCurrencyUser[${currency.name}`);
            }
        } else if (value && typeof value === "object") {

            // check for currency effect
            if (value.type === "twitcherbot:currency") {
                value.currency = currency.id;
            // check for currency restriction
            } else if (value.type === "twitcherbot:channelcurrency") {
                value.selectedCurrency = currency.id;
            }

            // recurse
            findAndReplaceCurrency(value, currency);
        }
    }
}

function replaceQuestionAnswers(data, questions) {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
        if (value && typeof value === "string") {

            for (const question of questions) {
                if (value.includes(question.replaceToken)) {
                    const regex = new RegExp(escapeRegExp(question.replaceToken), 'gm');
                    data[key] = data[key].replace(regex, question.answer);
                }
            }

        } else if (value && typeof value === "object") {
            // recurse
            replaceQuestionAnswers(value, questions);
        }
    }
}

function replaceCurrency(components, currency) {
    // loop through every component type (command, event, etc)
    for (const componentArray of Object.values(components)) {
        // loop through each component
        for (const component of componentArray) {
            findAndReplaceCurrency(component, currency);
        }
    }
}

function importSetup(setup, selectedCurrency) {
    if (setup == null || setup.components == null) return false;

    if (setup.requireCurrency) {
        replaceCurrency(setup.components, selectedCurrency);
    }

    if (setup.importQuestions) {
        replaceQuestionAnswers(setup.components, setup.importQuestions);
    }

    // commands
    const commands = setup.components.commands || [];
    for (const command of commands) {
        commandAccess.saveImportedCustomCommand(command);
    }
    commandAccess.triggerUiRefresh();

    // counters
    const counters = setup.components.counters || [];
    for (const counter of counters) {
        countersManager.saveCounter(counter);
        countersManager.updateCounterValue(counter.name, counter.value);
    }
    countersManager.triggerUiRefresh();

    // currencies
    const currencies = setup.components.currencies || [];
    for (const currency of currencies) {
        frontendCommunicator.send("import-currency", currency);
    }

    // effect queues
    const effectQueues = setup.components.effectQueues || [];
    for (const queue of effectQueues) {
        effectQueueManager.saveEffectQueue(queue);
    }
    effectQueueManager.triggerUiRefresh();

    // events
    const events = setup.components.events || [];
    for (const event of events) {
        eventsAccess.saveNewEventToMainEvents(event);
    }
    eventsAccess.triggerUiRefresh();

    // events sets
    const eventGroups = setup.components.eventGroups || [];
    for (const eventGroup of eventGroups) {
        eventsAccess.saveGroupFromImport(eventGroup);
    }
    eventsAccess.triggerUiRefresh();

    // hotkeys
    const hotkeys = setup.components.hotkeys || [];
    const hotkeyDb = profileManager.getJsonDbInProfile("/hotkeys");
    try {
        const hotkeyData = hotkeyDb.getData("/");
        let currentHotkeys = [];
        if (hotkeyData != null && hotkeyData.length > 0) {
            currentHotkeys = hotkeyData;
        }
        for (const hotkey of hotkeys) {
            const index = currentHotkeys.findIndex(h => h.id === hotkey.id);
            if (index < 0) {
                currentHotkeys.push(hotkey);
            } else {
                currentHotkeys[index] = hotkey;
            }
        }
        hotkeyDb.push("/", currentHotkeys);
    } catch (err) {
        logger.error(err);
    }
    frontendCommunicator.send("import-hotkeys-update");

    // preset effect lists
    const presetEffectLists = setup.components.presetEffectLists || [];
    for (const presetLists of presetEffectLists) {
        presetEffectListManager.savePresetEffectList(presetLists);
    }
    presetEffectListManager.triggerUiRefresh();

    // timers
    const timers = setup.components.timers || [];
    for (const timer of timers) {
        timerAccess.saveTimer(timer);
    }

    // viewer roles
    const roles = setup.components.viewerRoles || [];
    for (const role of roles) {
        customRolesManager.saveCustomRole(role);
    }
    customRolesManager.triggerUiRefresh();

    return true;
}

function removeSetupComponents(components) {
    Object.entries(components)
        .forEach(([componentType, componentList]) => {
            componentList.forEach(({id, name}) => {
                switch (componentType) {
                case "commands":
                    commandAccess.deleteCustomCommand(id);
                    break;
                case "counters":
                    countersManager.deleteCounter(id);
                    break;
                case "currencies":
                    frontendCommunicator.send("remove-currency", { id, name });
                    break;
                case "effectQueues":
                    effectQueueManager.deleteEffectQueue(id);
                    break;
                case "events":
                    eventsAccess.removeEventFromMainEvents(id);
                    break;
                case "eventGroups":
                    eventsAccess.deleteGroup(id);
                    break;
                case "hotkeys":
                    frontendCommunicator.send("remove-hotkey", id);
                    break;
                case "presetEffectLists":
                    presetEffectListManager.deletePresetEffectList(id);
                    break;
                case "timers":
                    timerAccess.deleteTimer(id);
                    break;
                case "viewerRoles":
                    customRolesManager.deleteCustomRole(id);
                    break;
                default:
                    // do nothing
                }
            });
            if (componentType === "commands") {
                commandAccess.triggerUiRefresh();
            } else if (componentType === "counters") {
                countersManager.triggerUiRefresh();
            } else if (componentType === "effectQueues") {
                effectQueueManager.triggerUiRefresh();
            } else if (componentType === "events") {
                eventsAccess.triggerUiRefresh();
            } else if (componentType === "eventGroups") {
                eventsAccess.triggerUiRefresh();
            } else if (componentType === "presetEffectLists") {
                presetEffectListManager.triggerUiRefresh();
            } else if (componentType === "viewerRoles") {
                customRolesManager.triggerUiRefresh();
            }
        });
    return true;
}

function setupListeners() {
    frontendCommunicator.onAsync("import-setup", async ({setup, selectedCurrency}) => {
        return importSetup(setup, selectedCurrency);
    });

    frontendCommunicator.onAsync("remove-setup-components", async ({components}) => {
        return removeSetupComponents(components);
    });
}

exports.setupListeners = setupListeners;