"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const effect = {
    definition: {
        id: "twitcherbot:chat-feed-alert",
        name: "Chat Feed Alert",
        description: "Display an alert in Twitchbot's chat feed",
        icon: "fad fa-comment-exclamation",
        categories: [EffectCategory.COMMON, EffectCategory.CHAT_BASED],
        dependencies: [EffectDependency.CHAT],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
    <eos-container>
        <p>Use this effect to send yourself alerts in Twitchbot's chat feed without using actual chat messages. This means the alerts are only visible to you.</p>
    </eos-container>
    <eos-container header="Alert Message" pad-top="true">
        <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40" replace-variables></textarea>
    </eos-container>

    `,
    optionsController: () => { },
    optionsValidator: effect => {
        let errors = [];
        if (effect.message == null || effect.message === "") {
            errors.push("Alert message can't be blank.");
        }
        return errors;
    },
    onTriggerEvent: async event => {

        const { effect } = event;

        renderWindow.webContents.send("chatUpdate", {
            fbEvent: "ChatAlert",
            message: effect.message
        });

        return true;
    }
};

module.exports = effect;
