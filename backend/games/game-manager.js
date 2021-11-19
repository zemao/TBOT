"use strict";

const profileManager = require("../common/profile-manager");
const frontendCommunicator = require("../common/frontend-communicator");

let getGameDb = () => profileManager.getJsonDbInProfile("/games");

/**
 * @typedef {"string" | "number" | "boolean" | "enum" | "filepath" | "currency-select" | "chatter-select" | "editable-list" | "role-percentages" | "role-numbers"} SettingType
 */

/**
 * @typedef {Object} SettingDefinition - A setting
 * @property {SettingType} type - The type of setting, which determines the UI
 * @property {string} [title] - Human readable title
 * @property {string} [description] - Human readable description
 * @property {string} [tip] - Human readable tip, this is rendered below the field in smaller muted text
 * @property {any} [default] - The default value that is initially set
 * @property {number} [sortRank] - A rank to tell the UI how to order settings
 * @property {boolean} [showBottomHr] - Display a line under the setting
 * @property {Object} [validation] - Various validation properties
 * @property {boolean} [validation.required] - Whether or not a value is required before the user can save
 * @property {number} [validation.min] - The min number value, if type is number
 * @property {number} [validation.max] - The max number value, if type is number
 */

/**
 * @typedef {Object} SettingCategoryDefinition - A setting category which holds a dictionary of settings
 * @property {string} title - Human readable title
 * @property {string} [description] - Human readable description
 * @property {number} [sortRank] - A rank to tell the UI how to order settings
 * @property {Object.<string, SettingDefinition>} settings - the settings dictionary
 */

/**
 * @typedef {Object} GameSettings - all settings data saved for the game
 * @property {boolean} active - If the game has been enabled by the user
 * @property {Object.<string, Object.<string, any>>} settings - Dictionary of dictionaries contained game settings saved by the user
 */

/**
 * @callback GameFn
 * @param {GameSettings} gameSettings
 * @returns {void}
 */

/**
  * @typedef TwitchbotGame - A game in Twitchbot
  * @property {string} id - Unique id for the game
  * @property {string} name - Human readable name for the game
  * @property {string} subtitle - Very short tagline for the game, shows up in the games tab
  * @property {string} description - Verbose description of the game, shown when clicking edit on the game
  * @property {string} icon - Font Awesome 5 icon to use for the game, ie 'fa-dice-three'
  * @property {Object.<string, SettingCategoryDefinition>} settingCategories - Definitions of setting categories and the settings within them
  * @property {GameFn} onLoad - Called when the game is enabled, either on app load or if the user enables the game later. You can register a system command here or set up any required game state.
  * @property {GameFn} onUnload - Called when the game was previously active but has since been disabled. You should unregister any system commands here and clear out any game state.
  * @property {GameFn} onSettingsUpdate - Called whenever the settings from settingCategories are updated by the user.
  */


/**
 * @type {Object.<string, GameSettings>}
 */
let allGamesSettings = {};

/**@type {TwitchbotGame[]} */
const registeredGames = [];

/**
 * Register a Twitchbot game
 * @param {TwitchbotGame} game - The game to register with the system
 * @returns {void}
 */
function registerGame(game) {
    if (game == null) return;

    if (registeredGames.some(g => g.id === game.id)) return;

    game.active = false;

    let gameSettings = allGamesSettings[game.id];
    if (gameSettings) {
        game.active = gameSettings.active;
    } else {
        gameSettings = { active: false };
    }

    if (gameSettings.active && game.onLoad) {
        game.onLoad(gameSettings);
    }

    registeredGames.push(game);
}

function buildGameSettings(game, savedSettings) {
    let settingsData = {
        active: game.active,
        settings: {}
    };

    if (savedSettings != null) {
        settingsData = savedSettings;
    }

    if (game.settingCategories) {
        for (let categoryId of Object.keys(game.settingCategories)) {
            if (settingsData.settings[categoryId] == null) {
                settingsData.settings[categoryId] = {};
            }
            for (let settingId of Object.keys(game.settingCategories[categoryId].settings)) {
                if (settingsData.settings[categoryId][settingId] === undefined) {
                    settingsData.settings[categoryId][settingId] = game.settingCategories[categoryId].settings[settingId].default;
                }
            }
        }
    }
    return settingsData;
}

function setGameSettingValues(settingCategories, savedSettings) {
    if (settingCategories && savedSettings) {
        for (let categoryId of Object.keys(settingCategories)) {
            for (let settingId of Object.keys(settingCategories[categoryId].settings)) {
                if (savedSettings.settings[categoryId]) {
                    settingCategories[categoryId].settings[settingId].value = savedSettings.settings[categoryId][settingId];
                }
            }
        }
    }
    return settingCategories;
}

function getGameSettingsFromValues(settingCategories, savedSettings) {
    if (settingCategories && savedSettings) {
        for (let categoryId of Object.keys(settingCategories)) {
            for (let settingId of Object.keys(settingCategories[categoryId].settings)) {
                savedSettings.settings[categoryId][settingId] = settingCategories[categoryId].settings[settingId].value;
            }
        }
    }
    return savedSettings;
}

/**
 * Gets the settings for a game
 * @param {string} gameId - The id of the game
 * @returns {GameSettings} - The game settings
 */
function getGameSettings(gameId) {
    const game = registeredGames.find(g => g.id === gameId);
    if (!game) return null;
    return buildGameSettings(game, allGamesSettings[game.id]);
}

function loadGameSettings() {
    try {
        let savedGameSettings = getGameDb().getData("/");
        if (savedGameSettings != null) {
            allGamesSettings = savedGameSettings;
        }
    } catch (error) {
        //
    }
}

function saveAllGameSettings() {
    try {
        getGameDb().push("/", allGamesSettings);
    } catch (error) {
        //
    }
}

function getGames() {
    return registeredGames.map(g => {
        return {
            id: g.id,
            name: g.name,
            subtitle: g.subtitle,
            description: g.description,
            icon: g.icon,
            active: g.active,
            settingCategories: setGameSettingValues(g.settingCategories, buildGameSettings(g, allGamesSettings[g.id]))
        };
    });
}

frontendCommunicator.onAsync('get-games', async () => {
    return getGames();
});

function updateGameSettings(gameId, settingCategories, activeStatus) {
    const game = registeredGames.find(g => g.id === gameId);

    if (game == null) return;


    let previousSettings = buildGameSettings(game, allGamesSettings[game.id]);
    let previousActiveStatus = previousSettings.active;

    let gameSettings;
    if (settingCategories == null) {
        gameSettings = {
            active: false
        };

        game.active = false;

        delete allGamesSettings[game.id];
    } else {

        gameSettings = getGameSettingsFromValues(settingCategories, previousSettings);
        gameSettings.active = activeStatus;
        game.active = activeStatus;

        allGamesSettings[game.id] = gameSettings;
    }

    saveAllGameSettings();

    if (gameSettings.active) {
        //game has been enabled, load it
        if (previousActiveStatus === false && game.onLoad) {
            game.onLoad(gameSettings);
        } else if (game.onSettingsUpdate) {
            // just trigger settings update
            game.onSettingsUpdate(gameSettings);
        }
    } else {
        //game has been disabled, unload it
        if (previousActiveStatus === true && game.onUnload) {
            game.onUnload(gameSettings);
        }
    }
}

frontendCommunicator.on('game-settings-update', (data) => {
    const { gameId, settingCategories, activeStatus } = data;

    updateGameSettings(gameId, settingCategories, activeStatus);
});

frontendCommunicator.on('reset-game-to-defaults', (gameId) => {
    const game = registeredGames.find(g => g.id === gameId);

    if (game == null) return;

    updateGameSettings(gameId, null, null);

    frontendCommunicator.send("game-settings-updated", getGames());
});

exports.loadGameSettings = loadGameSettings;
exports.registerGame = registerGame;
exports.getGameSettings = getGameSettings;