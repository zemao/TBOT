"use strict";

const { settings } = require("../../common/settings-access");
const resourceTokenManager = require("../../resourceTokenManager");
const webServer = require("../../../server/httpServer");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');
/**
 * The Celebration effect
 */
const celebration = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "twitcherbot:celebration",
        name: "Celebration",
        description: "Celebrate with firework overlay effects.",
        icon: "fad fa-birthday-cake",
        categories: [EffectCategory.FUN, EffectCategory.OVERLAY],
        dependencies: [EffectDependency.OVERLAY],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
    <eos-container header="Celebration Type">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="celebrate-effect-type">{{effect.celebration ? effect.celebration : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu celebrate-effect-dropdown">
                <li ng-repeat="celebration in celebrationTypes"
                    ng-click="effect.celebration = celebration">
                    <a href>{{celebration}}</a>
                </li>
            </ul>
        </div>
    </eos-container>

    <eos-container header="Duration" pad-top="true">
    <div class="input-group">
        <span class="input-group-addon" id="celebration-length-effect-type">Seconds</span>
        <input type="text" ng-model="effect.length" class="form-control" id="celebration-amount-setting" aria-describedby="celebration-length-effect-type" replace-variables="number">
    </div>
    </eos-container>

    <eos-container>
    <div class="effect-info alert alert-warning">
        This effect requires the Twitchbot overlay to be loaded in your broadcasting software. <a href ng-click="showOverlayInfoModal()" style="text-decoration:underline">Learn more</a>
    </div>
    </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: $scope => {
        $scope.celebrationTypes = ["Fireworks", "Confetti"];
        if ($scope.effect.length == null) {
            $scope.effect.length = 5;
        }
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.celebration == null) {
            errors.push("Please select how you'd like to celebrate.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        // What should this do when triggered.
        let effect = event.effect;

        // Get report info
        let celebrationType = effect.celebration;
        let celebrationDuration = effect.length;

        // Send data to renderer.
        let data = {
            event: "celebration",
            celebrationType: celebrationType,
            celebrationDuration: celebrationDuration
        };

        // Send to overlay.
        webServer.sendToOverlay("celebrate", data);
        return true;
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "celebrate",
            onOverlayEvent: data => {

                // Celebrate Packet
                //{"event": "celebration", "celebrationType": celebrationType, "celebrationDuration":celebrationDuration};
                let type = data.celebrationType;
                let duration = parseFloat(data.celebrationDuration) * 1000; //convert to milliseconds.

                // Get time in milliseconds to use as class name.
                let d = new Date();
                let divClass = d.getTime();

                if (type === "Fireworks") {
                    let canvas = '<canvas id="fireworks" class="' + divClass + '-fireworks celebration ' + type + '" style="display:none; z-index: 99;"></canvas>';

                    // Throw div on page and start up.
                    $('.wrapper').append(canvas);
                    $('.' + divClass + '-fireworks').fadeIn('fast');

                    let stage = fireworks(); // eslint-disable-line no-undef

                    setTimeout(function (stage) {

                        stage.removeAllChildren();
                        stage.removeAllEventListeners();
                        stage.canvas = null;
                        stage._eventListeners = null;

                        $('.' + divClass + '-fireworks').fadeOut('fast', function () {
                            $('.' + divClass + '-fireworks').remove();
                        });
                    }, duration, stage);
                }

                if (type === "Confetti") {
                    let canvas = '<canvas id="confetti" class="' + divClass + '-confetti celebration ' + type + '" style="display:none; z-index: 99;"></canvas>';

                    // Throw div on page and start up.
                    $('.wrapper').append(canvas);
                    $('.' + divClass + '-confetti').fadeIn('fast');

                    let confettiStage = confetti.create(document.getElementsByClassName(divClass + '-confetti')[0], { // eslint-disable-line no-undef
                        resize: true,
                        useWorker: true
                    });

                    let confettiParty = setInterval(function () {
                        // launch a few confetti from the left edge
                        confettiStage({ // eslint-disable-line no-undef
                            particleCount: 10,
                            angle: 60,
                            spread: 40,
                            startVelocity: 90,
                            shapes: ['circle', 'circle', 'square'],
                            scalar: 1.65,
                            origin: { x: 0, y: 0.9 }
                        });
                        // and launch a few from the right edge
                        confettiStage({ // eslint-disable-line no-undef
                            particleCount: 10,
                            angle: 120,
                            spread: 40,
                            startVelocity: 90,
                            shapes: ['circle', 'circle', 'square'],
                            scalar: 1.65,
                            origin: { x: 1, y: 0.9 }
                        });
                    }, 250);

                    setTimeout(function (confettiStage) {
                        $('.' + divClass + '-confetti').fadeOut('slow', function () {
                            $('.' + divClass + '-confetti').remove();
                            confettiStage.reset();
                            clearInterval(confettiParty);
                        });
                    }, duration, confettiStage);
                }
            }
        }
    }
};

module.exports = celebration;
