"use strict";

const commandManager = require("../../chat/commands/CommandManager");

async function getCommandListForSync() {
    let allCommands = commandManager.getAllActiveCommands();
    let commandData = {
        'allowedCmds': []
    };

    // Filter!
    commandData.allowedCmds = allCommands
        .filter(c => c.active && !c.hidden)
        .map(c => {
            // eslint-disable-next-line no-unused-vars
            const { effects, ...strippedCommand } = c;
            return {
                ...strippedCommand,
                fallbackSubcommand: strippedCommand.fallbackSubcommand
                    && !strippedCommand.fallbackSubcommand.hidden
                    && strippedCommand.fallbackSubcommand.active ?
                    strippedCommand.fallbackSubcommand : null,
                subCommands: strippedCommand.subCommands ?
                    strippedCommand.subCommands.filter(sc => sc.active && !sc.hidden) : null
            };
        });


    if (commandData.allowedCmds.length < 1) {
        return null;
    }

    return commandData;
}

exports.getCommandListForSync = getCommandListForSync;