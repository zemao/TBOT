"use strict";


const { ControlKind, InputEvent } = require('../../../interactive/constants/MixplayConstants');
const effectModels = require("../../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../../shared/effect-constants');

const effectRunner = require("../../../common/effect-runner");
const conditionManager = require("./conditions/condition-manager");
const builtinConditionTypeLoader = require("./conditions/builtin-condition-loader");
builtinConditionTypeLoader.registerConditionTypes();

const model = {
    definition: {
        id: "twitcherbot:conditional-effects",
        name: "Conditional Effects",
        description: "Conditionally run effects",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        icon: "fa fa-question-circle",
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container>

        <div ui-sortable="sortableOptions" ng-model="effect.ifs">
            <div ng-repeat="ifCondition in effect.ifs" style="margin-bottom: 15px;">
                <condition-section header="{{$index === 0 ? 'If' : 'Else If'}}" label="ifCondition.label" initially-open="$index === 0 && openFirst">
                    <condition-list condition-data="ifCondition.conditionData" trigger="trigger" trigger-meta="triggerMeta"></condition-list>
                    <div style="font-size: 15px;font-family: 'Quicksand'; color: #c0c1c2;margin-bottom:3px;">Then run the following effects:</div>
                    <effect-list effects="ifCondition.effectData" 
                        trigger="{{trigger}}"
                        trigger-meta="triggerMeta" 
                        update="effectListUpdated(effects, $index)"
                        modalId="{{modalId}}"></effect-list> 
                        
                    <div style="margin-top: 10px">
                        <button class="btn btn-danger" ng-click="deleteClauseAtIndex($index)"><i class="fa fa-trash"></i></button>
                    </div>
                </condition-section>          
            </div>
        </div>

            <button class="btn btn-link" ng-click="addIf()"><i class="fa fa-plus-circle"></i> Add <strong>{{effect.ifs.length === 0 ? 'If' : 'Else If'}}</strong> Clause</button>

            <div style="margin-top: 15px;">

                <condition-section header="Otherwise" label="effect.otherwiseLabel" draggable="false">
                    <div style="padding-bottom: 10px;padding-left: 2px;font-size: 15px;font-family: 'Quicksand'; color: #c0c1c2;">
                        <span>If none of the above conditions pass, run the following effects:</span>
                    </div>
                    <effect-list effects="effect.otherwiseEffectData" 
                        trigger="{{trigger}}" 
                        trigger-meta="triggerMeta" 
                        update="otherwiseEffectListUpdated(effects)"
                        modalId="{{modalId}}"></effect-list> 
                </condition-section>
                
            </div>
        </eos-container>
    `,
    optionsController: ($scope, utilityService) => {

        $scope.sortableOptions = {
            handle: ".dragHandle",
            stop: () => {}
        };

        $scope.openFirst = false;
        if ($scope.effect.ifs == null) {
            $scope.effect.ifs = [{
                conditionData: null,
                effectData: null
            }];
            $scope.openFirst = true;
        }

        $scope.addIf = () => {
            $scope.effect.ifs.push({
                conditionData: null,
                effectData: null
            });
        };

        $scope.deleteClauseAtIndex = $index => {
            utilityService.showConfirmationModal({
                title: "Remove Clause",
                question: `Are you sure you want to remove this ${$index === 0 ? 'IF' : 'IF ELSE'} clause?`,
                confirmLabel: "Remove",
                confirmBtnType: "btn-danger"
            }).then(confirmed => {
                if (confirmed) {
                    $scope.effect.ifs.splice($index, 1);
                }
            });
        };

        $scope.effectListUpdated = (effects, index) => {
            let ifCondition = $scope.effect.ifs[index];
            if (ifCondition) {
                ifCondition.effectData = effects;
            }
        };

        $scope.otherwiseEffectListUpdated = (effects) => {
            $scope.effect.otherwiseEffectData = effects;
        };
    },
    optionsValidator: effect => {
        let errors = [];
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(async (resolve) => {
            // What should this do when triggered.
            let { effect, trigger } = event;

            let effectsToRun = null;
            if (effect.ifs != null) {
                for (let ifCondition of effect.ifs) {
                    if (ifCondition.conditionData == null || ifCondition.effectData == null) continue;

                    let didPass = await conditionManager.runConditions(ifCondition.conditionData, trigger);
                    if (didPass) {
                        effectsToRun = ifCondition.effectData;
                        break;
                    }
                }
            }

            if (effectsToRun == null) {
                effectsToRun = effect.otherwiseEffectData;
            }

            if (effectsToRun != null) {
                let processEffectsRequest = {
                    trigger: event.trigger,
                    effects: effectsToRun
                };

                effectRunner.processEffects(processEffectsRequest)
                    .then(result => {
                        if (result != null && result.success === true) {
                            if (result.stopEffectExecution) {
                                return resolve({
                                    success: true,
                                    execution: {
                                        stop: true,
                                        bubbleStop: true
                                    }
                                });
                            }
                        }
                        resolve(true);
                    });
            } else {
                resolve(true);
            }
        });
    }
};

module.exports = model;
