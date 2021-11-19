"use strict";

const electron = require("electron");
const winston = require("winston");
const dataAccess = require("./common/data-access.js");
const app = electron.app || electron.remote.app;
//const config = winston.config;
//const Sentry = require("winston-raven-sentry");
const fs = require("fs-extra");

const LOG_FOLDER = dataAccess.getPathInUserData("/logs");

let settingsfile = dataAccess.getJsonDbInUserData("/global-settings");
let rotateFileLogLevel = "info";

let debugMode = false;
try {
    debugMode = settingsfile.getData("/settings/debugMode");
} catch (err) {} //eslint-disable-line no-empty
if (debugMode === true) {
    rotateFileLogLevel = "debug";
}

//make sure log path exists
if (!fs.existsSync(LOG_FOLDER)) {
    fs.mkdirSync(LOG_FOLDER);
}

/*let sentryTransport = new Sentry({
    dsn:
    "https://c4ba7c4b47814f8e88886ca08414aad4:a960630da816494fbe756e61116812e8@sentry.io/285894",
    level: "error",
    install: false,
    tags: {
        version: app.getVersion()
    }
});*/

let rotateFileTransport = new (require("winston-daily-rotate-file"))({
    level: rotateFileLogLevel,
    filename: LOG_FOLDER + "/log",
    datePattern: "yyyy-MM-dd.",
    prepend: true,
    json: false,
    maxDays: 7,
    humanReadableUnhandledException: true,
    label: "v" + app.getVersion(),
    prettyPrint: true,
    timestamp: function() {
        return new Date().toTimeString();
    }
});

let consoleTransport = new winston.transports.Console({
    level: "silly",
    prettyPrint: true,
    colorize: true
});

let logger = new winston.Logger({
    level: "silly",
    exitOnError: false,
    transports: [consoleTransport, rotateFileTransport]
});

// uncaught exception - log the error
process.on("uncaughtException", logger.error); //eslint-disable-line no-console
process.on("unhandledRejection", error => logger.error("Unhandled promise rejection", error));

// Export
module.exports = logger;

// ### function serialize (obj, key)
// #### @obj {Object|literal} Object to serialize
// #### @key {string} **Optional** Optional key represented by obj in a larger object
// Performs simple comma-separated, `key=value` serialization for Loggly when
// logging to non-JSON inputs.
function serialize(obj, key) {
    // symbols cannot be directly casted to strings
    if (typeof key === "symbol") {
        key = key.toString();
    }
    if (typeof obj === "symbol") {
        obj = obj.toString();
    }

    if (obj === null) {
        obj = "null";
    } else if (obj === undefined) {
        obj = "undefined";
    } else if (obj === false) {
        obj = "false";
    }

    if (typeof obj !== "object") {
        return key ? key + "=" + obj : obj;
    }

    if (obj instanceof Buffer) {
        return key ? key + "=" + obj.toString("base64") : obj.toString("base64");
    }

    let msg = "",
        keys = Object.keys(obj),
        length = keys.length;

    for (let i = 0; i < length; i++) {
        if (Array.isArray(obj[keys[i]])) {
            msg += keys[i] + "=[";

            for (let j = 0, l = obj[keys[i]].length; j < l; j++) {
                msg += serialize(obj[keys[i]][j]);
                if (j < l - 1) {
                    msg += ", ";
                }
            }

            msg += "]";
        } else if (obj[keys[i]] instanceof Date) {
            msg += keys[i] + "=" + obj[keys[i]];
        } else {
            msg += serialize(obj[keys[i]], keys[i]);
        }

        if (i < length - 1) {
            msg += ", ";
        }
    }

    return msg;
}
