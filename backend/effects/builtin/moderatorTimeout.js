"use strict";

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger, EffectDependency } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const logger = require('../../logwrapper');
const twitchChat = require("../../chat/twitch-chat");

const model = {
    definition: {
        id: "twitcherbot:modTimeout",
        name: "Timeout",
        description: "Timeout a user.",
        icon: "fad fa-user-clock",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [EffectDependency.CHAT],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
    <eos-container header="Target" pad-top="true">
        <div class="input-group">
            <span class="input-group-addon" id="username-type">Username</span>
            <input ng-model="effect.username" type="text" class="form-control" id="list-username-setting" aria-describedby="list-username-type" replace-variables menu-position="below">
        </div>
    </eos-container>
    <eos-container header="Time" pad-top="true">
        <div class="input-group">
            <span class="input-group-addon" id="time-type">Time (Seconds)</span>
            <input ng-model="effect.time" type="text" class="form-control" id="list-username-setting" aria-describedby="list-time-type" placeholder="Seconds" replace-variables="number">
        </div>
    </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        let errors = [];
        if (effect.username == null && effect.username !== "") {
            errors.push("Please enter a username.");
        }
        if (effect.time == null && (effect.time !== "" || effect.time < 0)) {
            errors.push("Please enter an amount of time.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        let time = event.effect.time;
        if (time) {
            //try to remove previous mixer style data
            time = time
                .replace("s", "")
                .replace("m", "")
                .replace("h", "")
                .replace("d", "");
        }
        await twitchChat.timeoutUser(event.effect.username, event.effect.time);
        logger.debug(event.effect.username + " was timed out for " + event.effect.time + "s via the timeout effect.");
        return true;
    }
};

module.exports = model;
