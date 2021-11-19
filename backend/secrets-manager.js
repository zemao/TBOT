"use strict";

const logger = require("./logwrapper");

/**
 * @typedef TwitchbotSecrets
 * @property {string} twitchClientId
 * @property {string} twitchClientSecret
 * @property {string} tipeeeStreamClientId
 * @property {string} tipeeeStreamClientSecret
 * @property {string} streamLabsClientId
 * @property {string} streamLabsClientSecret
 */

/**@type {(keyof TwitchbotSecrets)[]} */
const expectedKeys = [
    "twitchClientId",
    "twitchClientSecret",
    "tipeeeStreamClientId",
    "tipeeeStreamClientSecret",
    "streamLabsClientId",
    "streamLabsClientSecret"
];

exports.testSecrets = () => {
    let missingKeys = expectedKeys;
    try {
        /**@type {TwitchbotSecrets} */
        const secrets = require("../secrets.json") || {};

        missingKeys = expectedKeys.filter(k => secrets[k] == null);

        if (!missingKeys.length) {
            // We have no missing keys
            return true;
        }
    } catch (err) {
        if (err && err.code === "MODULE_NOT_FOUND") {
            logger.error("Unable to find secrets.json in the root directory. Please create one. Contact us in the CrowbarTools Discord if you have any questions.");
            return false;
        }
    }

    logger.error(`secrets.json is missing the following keys: ${missingKeys.join(", ")}`);
    return false;
};

/**@type {TwitchbotSecrets} */
let secrets = {};
try {
    secrets = require("../secrets.json");
} catch (error) {
    //silently fail
}

exports.secrets = secrets;