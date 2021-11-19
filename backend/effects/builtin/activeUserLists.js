"use strict";
const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const logger = require('../../logwrapper');
const twitchApi = require("../../twitch-api/api");
const activeUserHandler = require("../../chat/chat-listeners/active-user-handler");

const model = {
    definition: {
        id: "twitcherbot:activeUserLists",
        name: "Manage Active Chat Users",
        description: "Add or remove users from the active chat user lists.",
        icon: "fad fa-users",
        categories: [EffectCategory.COMMON, EffectCategory.MODERATION],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    optionsTemplate: `
    <eos-container header="Action" pad-top="true">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="list-effect-type">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu celebrate-effect-dropdown">
                <li ng-click="effect.action = 'Add User'">
                    <a href>Add User</a>
                </li>
                <li ng-click="effect.action = 'Remove User'">
                    <a href>Remove User</a>
                </li>
                <li ng-click="effect.action = 'Clear List'">
                    <a href>Clear List</a>
                </li>
            </ul>
        </div>
    </eos-container>
    <eos-container header="Target" pad-top="true" ng-show="effect.action != null && effect.action !== 'Clear List'">
        <div class="input-group">
            <span class="input-group-addon" id="username-type">Username</span>
            <input ng-model="effect.username" type="text" class="form-control" id="list-username-setting" aria-describedby="list-username-type" replace-variables>
        </div>
    </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: effect => {
        let errors = [];
        if (effect.action == null || effect.action === "") {
            errors.push("Please select an action to perform.");
        }
        if (effect.username == null && effect.action !== "Clear List" || effect.username === "" && effect.action !== "Clear List") {
            errors.push("Please enter a username.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        let username = event.effect.username;
        if (username == null) {
            logger.debug("Couldn't find username for active user list effect.");
            return true;
        }

        let userId = (await twitchApi.users.getUserChatInfoByName(event.effect.username)).id;
        if (userId == null) {
            logger.debug("Couldn't get ids for username in active user list effect.");
            return true;
        }

        if (event.effect.action === "Add User") {
            await activeUserHandler.addActiveUser({
                id: userId,
                displayName: username,
                userName: username
            }, false, true);
        } else if (event.effect.action === "Remove User") {
            await activeUserHandler.removeActiveUser(userId);
        } else if (event.effect.action === "Clear List") {
            activeUserHandler.clearAllActiveUsers();
        }

        return true;
    }
};

module.exports = model;
