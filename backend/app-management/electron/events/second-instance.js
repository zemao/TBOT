"use strict";

const fileOpenHelpers = require("../../file-open-helpers");

/**
 * @param {Electron.Event} event
 * @param {string[]} argv
 */
exports.secondInstance = (_, argv) => {
    // Someone tried to run a second instance, we should focus our window.
    try {
        const { mainWindow } = require("../window-management");
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();

            fileOpenHelpers.checkForTwitchbotSetupPath(argv);
        }
    } catch (error) {
        // something has gone terribly wrong with this instance,
        // attempt restart
        const { restartApp } = require("../app-helpers");
        restartApp();
    }
};