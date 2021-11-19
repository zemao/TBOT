"use strict";

const effectRunner = require("../../common/effect-runner");
const { TriggerType } = require("../../common/EffectType");

exports.execute = function(command, userCommand, twitcherbotChatMessage, manual = false) {

    let effects = command.effects;
    if (command.subCommands && command.subCommands.length > 0 && userCommand.subcommandId != null) {
        if (userCommand.subcommandId === "fallback-subcommand" && command.fallbackSubcommand) {
            effects = command.fallbackSubcommand.effects;
        } else {
            const subcommand = command.subCommands.find(sc => sc.id === userCommand.subcommandId);
            if (subcommand) {
                effects = subcommand.effects;
            }
        }
    }

    let processEffectsRequest = {
        trigger: {
            type: manual ? TriggerType.MANUAL : TriggerType.COMMAND,
            metadata: {
                username: userCommand.commandSender,
                command: command,
                userCommand: userCommand,
                chatMessage: twitcherbotChatMessage
            }
        },
        effects: effects
    };
    return effectRunner.processEffects(processEffectsRequest).catch(reason => {
        console.log("error when running effects: " + reason);
    });
};
