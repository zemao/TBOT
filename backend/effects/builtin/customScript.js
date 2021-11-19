"use strict";
const fs = require("fs-extra");
const path = require("path");

const logger = require("../../logwrapper");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const customScriptRunner = require("../../common/handlers/custom-scripts/custom-script-runner");

const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The custom var effect
 */
const fileWriter = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "twitcherbot:customscript",
        name: "Run Custom Script",
        description: "Run a custom JS script.",
        icon: "fad fa-code",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX, ControlKind.JOYSTICK],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT, InputEvent.MOVE],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
        <custom-script-settings 
            effect="effect" 
            modal-id="modalId" 
            trigger="trigger" 
            trigger-meta="triggerMeta"
            allow-startup="isStartup"
        />
    `,
    optionsController: ($scope) => {

        $scope.isStartup = $scope.trigger === "event"
            && $scope.triggerMeta != null
            && $scope.triggerMeta.triggerId === "twitcherbot:twitcherbot-started";

    },
    optionsValidator: () => {
        let errors = [];
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(resolve => {

            logger.debug("Processing script...");

            customScriptRunner
                .runScript(event.effect, event.trigger)
                .then(result => {
                    resolve(result != null ? result : true);
                })
                .catch(err => {
                    renderWindow.webContents.send('error', "Oops! There was an error processing the custom script. Error: " + err.message);
                    logger.error(err);
                    resolve(false);
                });

        });
    }
};

module.exports = fileWriter;
