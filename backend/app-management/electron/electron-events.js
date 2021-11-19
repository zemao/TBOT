"use strict";

const { whenReady } = require("./events/when-ready");
const { windowsAllClosed } = require("./events/windows-all-closed");
const { willQuit } = require("./events/will-quit");
const { secondInstance } = require("./events/second-instance");

module.exports = {
    whenReady,
    windowsAllClosed,
    willQuit,
    secondInstance
};