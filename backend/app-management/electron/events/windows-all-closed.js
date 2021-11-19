"use strict";

const { app } = require("electron");

exports.windowsAllClosed = async () => {

    const { settings } = require("../../../common/settings-access");
    const { startBackup } = require("../../../backupManager");

    // Unregister all shortcuts.
    const hotkeyManager = require("../../../hotkeys/hotkey-manager");
    hotkeyManager.unregisterAllHotkeys();

    // Stop the chat moderation service
    const chatModerationManager = require("../../../chat/moderation/chat-moderation-manager");
    chatModerationManager.stopService();

    // Persist custom variables
    if (settings.getPersistCustomVariables()) {
        const customVariableManager = require("../../../common/custom-variable-manager");
        customVariableManager.persistVariablesToFile();
    }

    // Set all users to offline
    const userDatabase = require("../../../database/userDatabase");
    await userDatabase.setAllUsersOffline();

    // Remove eventsub subscriptions
    const eventsubClient = require('../../../twitch-api/eventsub/eventsub-client');
    await eventsubClient.deleteListeners();

    if (settings.backupOnExit()) {
        // Make a backup
        startBackup(false, app.quit);
    } else {
        app.quit();
    }
};