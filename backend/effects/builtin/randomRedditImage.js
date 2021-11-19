"use strict";

const redditProcessor = require("../../common/handlers/redditProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;
const twitchChat = require("../../chat/twitch-chat");
const mediaProcessor = require("../../common/handlers/mediaProcessor");
const settings = require("../../common/settings-access").settings;
const logger = require("../../logwrapper");
const webServer = require("../../../server/httpServer");
const { EffectCategory } = require('../../../shared/effect-constants');

const model = {
    definition: {
        id: "twitcherbot:randomReddit",
        name: "Random Reddit Image",
        description: "Pulls a random image from a selected subreddit.",
        icon: "fab fa-reddit-alien",
        categories: [EffectCategory.FUN, EffectCategory.CHAT_BASED, EffectCategory.OVERLAY],
        dependencies: [EffectDependency.CHAT],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
    <eos-container header="Subreddit Name">
        <div class="input-group">
            <span class="input-group-addon" id="reddit-effect-type">To</span>
            <input ng-model="effect.reddit" type="text" class="form-control" id="reddit-setting" aria-describedby="chat-text-effect-type" placeholder="puppies">
        </div>
    </eos-container>

    <eos-container header="Output Location" pad-top="true" ng-if="effect.reddit !== null && effect.reddit !== 'Pick one'">
        <div class="controls-fb-inline" style="padding-bottom: 5px;">
            <label class="control-fb control--radio">Chat
                <input type="radio" ng-model="effect.show" value="chat"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Overlay
                <input type="radio" ng-model="effect.show" value="overlay"/>
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--radio">Both
                <input type="radio" ng-model="effect.show" value="both"/>
                <div class="control__indicator"></div>
            </label>
        </div>
    </eos-container>

    <div class="effect-reddit-settings" ng-if="effect.show === 'chat' || effect.show ==='both'">
        <eos-chatter-select effect="effect" title="Chatter" class="setting-padtop"></eos-chatter-select>
    </div>

    <div class="effect-reddit-settings" ng-if="effect.show === 'overlay' || effect.show ==='both'">
        <eos-overlay-position effect="effect" class="setting-padtop"></eos-overlay-position>
        <eos-enter-exit-animations effect="effect" class="setting-padtop"></eos-enter-exit-animations>
        <div class="effect-setting-container setting-padtop">
            <div class="effect-specific-title"><h4>Dimensions</h4></div>
            <div class="effect-setting-content">
                <div class="input-group">
                    <span class="input-group-addon">Width</span>
                    <input
                    type="number"
                    class="form-control"
                    aria-describeby="image-width-setting-type"
                    type="number"
                    ng-model="effect.width"
                    placeholder="px">
                    <span class="input-group-addon">Height</span>
                    <input
                    type="number"
                    class="form-control"
                    aria-describeby="image-height-setting-type"
                    type="number"
                    ng-model="effect.height"
                    placeholder="px">
                </div>
            </div>
        </div>
        <div class="effect-setting-container setting-padtop">
            <div class="effect-specific-title"><h4>Duration</h4></div>
            <div class="effect-setting-content">
                <div class="input-group">
                    <span class="input-group-addon">Seconds</span>
                    <input
                    type="text"
                    class="form-control"
                    aria-describedby="image-length-effect-type"
                    type="number"
                    ng-model="effect.length">
                </div>
            </div>
        </div>
        <eos-overlay-instance effect="effect" class="setting-padtop"></eos-overlay-instance>
    </div>

    <eos-container pad-top="true">
        <div class="effect-info alert alert-danger">
        Warning: This effect pulls random images from subreddits. Highly moderated subreddits are fairly safe, but there is always the chance of naughty pictures. Just a warning!
        </div>
    </eos-container>

    `,
    optionsController: ($scope) => {

        if ($scope.effect.show == null) {
            $scope.effect.show = "chat";
        }

    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.reddit == null) {
            errors.push("Please enter a subreddit.");
        }

        if (effect.show == null) {
            errors.push("Please select a place to show the API results.");
        }
        return errors;
    },
    onTriggerEvent: async event => {
        let chatter = event.effect.chatter;
        let subName = event.effect.reddit;
        let imageUrl = await redditProcessor.getRandomImage(subName);

        try {
            if (event.effect.show === "chat" || event.effect.show === "both") {
                // Send Chat
                logger.debug("Random Reddit: " + imageUrl);
                twitchChat.sendChatMessage("Random Reddit: " + imageUrl, null, chatter);
            }

            if (event.effect.show === "overlay" || event.effect.show === "both") {
                // Send image to overlay.
                let position = event.effect.position,
                    data = {
                        url: imageUrl,
                        imageType: "url",
                        imagePosition: position,
                        imageHeight: event.effect.height,
                        imageWidth: event.effect.width,
                        imageDuration: event.effect.length,
                        enterAnimation: event.effect.enterAnimation,
                        exitAnimation: event.effect.exitAnimation,
                        customCoords: event.effect.customCoords
                    };

                // Get random location.
                if (position === "Random") {
                    position = mediaProcessor.getRandomPresetLocation();
                }

                if (settings.useOverlayInstances()) {
                    if (event.effect.overlayInstance != null) {
                        if (
                            settings
                                .getOverlayInstances()
                                .includes(event.effect.overlayInstance)
                        ) {
                            data.overlayInstance = event.effect.overlayInstance;
                        }
                    }
                }

                // Send to overlay.
                webServer.sendToOverlay("image", data);
            }
        } catch (err) {
            renderWindow.webContents.send(
                "error",
                "There was an error sending a reddit picture."
            );
        }

        return true;
    }
};

module.exports = model;
