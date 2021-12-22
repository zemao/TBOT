"use strict";

const webServer = require("../../../server/httpServer");
const frontendCommunicator = require("../../common/frontend-communicator");
const effectQueueRunner = require("../../effects/queues/effect-queue-runner");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The Delay effect
 */
const delay = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "twitcherbot:clear-effects",
        name: "Clear Effects",
        description: "Remove overlay effects, stop sounds, or clear effect queues",
        icon: "fa fa-minus-circle",
        categories: [EffectCategory.COMMON, EffectCategory.OVERLAY],
        dependencies: [],
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
        <eos-container>
            <p>This effect clears currently running effects. Useful, for example, if you are entering a cutscene. You can also use it to purge effect queues.</p>
        </eos-container>
        <eos-container header="Effects To Clear">
            <label class="control-fb control--checkbox"> Overlay Effects
                <input type="checkbox" ng-model="effect.overlay">
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--checkbox"> Sounds
                <input type="checkbox" ng-model="effect.sounds">
                <div class="control__indicator"></div>
            </label>
            <label class="control-fb control--checkbox"> Effect Queues
                <input type="checkbox" ng-model="effect.queues">
                <div class="control__indicator"></div>
            </label>
            <div uib-collapse="!effect.queues" style="margin: 0 0 15px 15px;">
                <div class="btn-group" uib-dropdown>
                    <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                    {{ getSelectedEffectQueueDisplay() }} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem" ng-click="effect.queueId = 'all'"><a href>All</a></li>
                        <li class="divider"></li>
                        <li role="menuitem" ng-repeat="queue in effectQueues" ng-click="effect.queueId = queue.id"><a href>{{queue.name}}</a></li>
                    </ul>
                </div>
            </div>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, effectQueuesService) => {

        $scope.effectQueues = effectQueuesService.getEffectQueues() || [];

        if ($scope.effect.queueId != null) {
            let queueStillExists = $scope.effectQueues.some(q => q.id === $scope.effect.queueId);
            if (!queueStillExists) {
                $scope.effect.queueId = "all";
            }
        } else {
            $scope.effect.queueId = "all";
        }

        $scope.getSelectedEffectQueueDisplay = () => {
            if (!$scope.effect.queues) {
                return "None";
            }

            if ($scope.effect.queueId === "all") {
                return "All";
            }

            let effectQueue = $scope.effectQueues.find(q => q.id === $scope.effect.queueId);
            if (effectQueue) {
                return effectQueue.name;
            }
            return "None";
        };
    },
    /**
   * When the effect is saved
   */
    optionsValidator: () => {
        let errors = [];
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        const effect = event.effect;

        if (effect.queues) {
            if (effect.queueId === "all") {
                effectQueueRunner.clearAllQueues();
            } else {
                if (effect.queueId) {
                    effectQueueRunner.removeQueue(effect.queueId);
                }
            }
        }

        if (effect.sounds) {
            frontendCommunicator.send("stop-all-sounds");
        }

        if (effect.overlay) {
            // trigger overlay refresh to clear any current effects
            webServer.sendToOverlay("OVERLAY:REFRESH");
        }

        return true;
    }
};

module.exports = delay;
