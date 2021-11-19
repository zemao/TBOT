"use strict";
const settings = require("../settings-access").settings;
const webServer = require("../../../server/httpServer");
const util = require("../../utility");

// HTML Processor
async function htmlProcessor(effect, trigger) {
    // They have an image loaded up for this one.
    let HTML = effect.html;
    let duration = effect.length;
    let removal = effect.removal;

    // Send data back to media.js in the gui.
    let data = {
        "html": await util.populateStringWithTriggerData(HTML, trigger),
        "length": duration,
        "removal": removal,
        "enterAnimation": effect.enterAnimation,
        "exitAnimation": effect.exitAnimation,
        enterDuration: effect.enterDuration,
        exitDuration: effect.exitDuration
    };

    if (settings.useOverlayInstances()) {
        if (effect.overlayInstance != null) {
            if (settings.getOverlayInstances().includes(effect.overlayInstance)) {
                data.overlayInstance = effect.overlayInstance;
            }
        }
    }

    webServer.sendToOverlay("html", data);
}

// Export Functions
exports.show = htmlProcessor;
