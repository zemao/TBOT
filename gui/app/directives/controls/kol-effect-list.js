"use strict";
(function() {

    const uuidv1 = require("uuid/v1");

    angular
        .module('twitcherbotApp')
        .component("kolEffectList", {
            bindings: {
                trigger: "@",
                triggerMeta: "<",
                effects: "<",
                update: '&',
                modalId: "@",
                header: "@",
                headerClasses: "@",
                effectContainerClasses: "@",
                hideNumbers: "<"
            },
            template: `
            <div class="effect-list">
                <div class="flex-row-center jspacebetween effect-list-header">
                    <div style="display:flex; align-items: center;">
                        <h3 class="{{$ctrl.headerClasses}}" style="display:inline;margin:0;font-weight: 100;">EFFECTS</h3>
                        <span style="font-size: 11px; margin-left: 2px;"><tooltip text="$ctrl.header" ng-if="$ctrl.header"></tooltip></span>
                    </div>
                    

                    <div style="display:flex;align-items: center;">

                        <div style="margin-right: 17px;" ng-if="$ctrl.getSelectedQueueModeIsCustom()">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;">EFFECTS DURATION <tooltip text="'The total duration (in secs) the queue should wait after triggering this effect list before running the next one'"></tooltip></div>
                            <div style="display: flex; justify-content: flex-end; align-items: center;font-size: 12px;" class="clickable" ng-click="$ctrl.openEditQueueDurationModal()"><b>{{$ctrl.effectsData.queueDuration || 0}}</b><span>s</span><span class="muted" style="font-size: 9px; margin-left: 5px;"><i class="fa fa-edit"></i></span></div>
                        </div>

                        <div style="margin-right: 17px;" ng-if="$ctrl.validQueueSelected()">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;">QUEUE PRIORITY <tooltip text="'If an effect list has priority, it will get added in front of other lists in the queue that do not have priority.'"></tooltip></div>
                            <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                                <div class="noselect pointer ddtext" style="font-size: 12px;">{{$ctrl.getSelectedQueuePriority()}}<span class="fb-arrow down ddtext"></span></div>
                                <ul class="dropdown-menu" style="z-index: 10000000;" uib-dropdown-menu>
                                    <li ng-click="$ctrl.effectsData.queuePriority = 'high'">
                                        <a href style="padding-left: 10px;" aria-label="Yes">Yes</a>   
                                    </li>
                                    <li ng-click="$ctrl.effectsData.queuePriority = 'none'">
                                        <a href style="padding-left: 10px;" aria-label="No">No</a>   
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div style="margin-right: 20px;display: flex;flex-direction: column;align-items: flex-end;">
                        </div>
                    </div>
                </div>
                <div class="{{$ctrl.effectContainerClasses}}" style="margin-left: 15px;margin-right: 15px;padding-bottom: 15px;">
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.effectsData.list">
                        <div ng-repeat="effect in $ctrl.effectsData.list track by $index" context-menu="$ctrl.effectMenuOptions">
                            <div class="effect-bar clickable-dark"
                                ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger)"
                                ng-mouseenter="hovering = true"
                                ng-mouseleave="hovering = false">
                                    <span style="display: inline-block;text-overflow: ellipsis;overflow: hidden;line-height: 20px;white-space: nowrap;padding-right: 10px;">
                                        <span class="muted" ng-hide="$ctrl.hideNumbers === true">{{$index + 1}}. </span>
                                        {{$ctrl.getEffectNameById(effect.type)}}
                                        <span ng-if="effect.effectLabel" class="muted"> ({{effect.effectLabel}})</span>
                                    </span>
                                    <span class="flex-row-center ">
                                        <span class="dragHandle" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex" ng-class="{'hiddenHandle': !hovering}" ng-click="$event.stopPropagation()">
                                            <i class="fal fa-bars"></i>
                                        </span> 
                                        <div class="clickable" style="font-size: 20px;height: 38px;width: 35px;text-align: center;display: flex;align-items: center;justify-content: center;" uib-dropdown uib-dropdown-toggle dropdown-append-to-body="true" ng-click="$event.stopPropagation()">
                                            <span class="noselect pointer"> <i class="fa fa-ellipsis-v"></i> </span>
                                            <ul class="dropdown-menu" uib-dropdown-menu style="transform: translateY(-205px);">
                                                <li><a href ng-click="$ctrl.editLabelForEffectAtIndex($index)"><i class="fa fa-tag" style="margin-right: 10px;"></i>  {{$ctrl.getLabelButtonTextForLabel(effect.effectLabel)}}</a></li>
                                                <li><a href ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger)"><i class="fa fa-edit" style="margin-right: 10px;"></i>  Edit</a></li>
                                                <li><a href ng-click="$ctrl.duplicateEffectAtIndex($index)"><i class="fa fa-clone" style="margin-right: 10px;"></i>  Duplicate</a></li>
                                                <li><a href ng-click="$ctrl.copyEffectAtIndex($index)"><i class="fa fa-copy" style="margin-right: 10px;"></i>  Copy</a></li>
                                                <li ng-class="{'disabled': !$ctrl.hasCopiedEffects()}" ng-click="!$ctrl.hasCopiedEffects() ? $event.stopPropagation() : null"><a href ng-click="$ctrl.pasteEffectsAtIndex($index, false)"><i class="fal fa-paste" style="margin-right: 10px;"></i>  Paste After</a></li>
                                                <li><a href ng-click="$ctrl.removeEffectAtIndex($index)" style="color: #fb7373;"><i class="fa fa-trash" style="margin-right: 10px;"></i>  Delete</a></li>
                                            </ul>
                                        </div>
                                    </span> 
                            </div>
                        </div>
                    </div>
            
                    <div class="add-more-functionality" style="margin-top: 16px;margin-left: 12px;">
                        <a href class="clickable" ng-click="$ctrl.openNewEffectModal()" aria-label="Add new effect"> <i class="fa fa-plus-circle"></i>Add New Effect</a>               
                    </div>
                </div>
                
            </div>
            `,
            controller: function(utilityService, effectHelperService, objectCopyHelper, effectQueuesService,
                backendCommunicator, ngToast, $http,//下面是添加的服务
                 $scope, $timeout) {
                let ctrl = this;

                //下面添加代码
                $ctrl.activeCategory = null;
                $ctrl.categories = Object.values(EffectCategory);
    
                $ctrl.selectedEffectDef = null;
    
                $ctrl.effectDefs = [];

                $ctrl.$onInit = async function() {
                    let effectDefs = await backendCommunicator
                        .fireEventAsync("getEffectDefinitions", {
                            triggerType: $ctrl.resolve.trigger,
                            triggerMeta: $ctrl.resolve.triggerMeta
                        });
                    $ctrl.effectDefs = effectDefs
                        .sort((a, b) => {
                            let textA = a.name.toUpperCase();
                            let textB = b.name.toUpperCase();
                            return textA < textB ? -1 : textA > textB ? 1 : 0;
                        })
                        .filter(e => !e.hidden);
    
                    if ($ctrl.resolve.selectedEffectTypeId) {
                        $ctrl.selectedEffectDef = $ctrl.effectDefs.find(e => e.id === $ctrl.resolve.selectedEffectTypeId);
                    }
    
                    if (!$ctrl.selectedEffectDef) {
                        let modalId = $ctrl.resolve.modalId;
                        utilityService.addSlidingModal(
                            $ctrl.modalInstance.rendered.then(() => {
                                let modalElement = $("." + modalId).children();
                                return {
                                    element: modalElement,
                                    name: "Select New Effect",
                                    id: modalId,
                                    instance: $ctrl.modalInstance
                                };
                            })
                        );
    
                        $scope.$on("modal.closing", function() {
                            utilityService.removeSlidingModal();
                        });
                    }
    
                    $timeout(() => {
                        angular.element("#effectSearch").trigger("focus");
                    }, 50);
                };

                $ctrl.selectedEffectDef = {
                    "categories": [
                        "common",
                        "Moderation"
                    ],
                    "dependencies": [
                        "chat"
                    ],
                    "description": "Timeout a user.",
                    "icon": "fad fa-user-clock",
                    "id": "twitcherbot:modTimeout",
                    "name": "Timeout",
                    "triggers": {
                        "api": true,
                        "channel_reward": true,
                        "command": true,
                        "counter": true,
                        "custom_script": true,
                        "event": true,
                        "hotkey": true,
                        "interactive": {
                            "controls": [
                                "button",
                                "textbox"
                            ],
                            "events": [
                                "mousedown",
                                "keydown",
                                "submit"
                            ]
                        },
                        "manual": true,
                        "preset": true,
                        "startup_script": true,
                        "timer": true
                    }
                }
                $ctrl.close({
                    $value: {
                        selectedEffectDef: $ctrl.selectedEffectDef
                    }
                });
                //上面添加代码
                ctrl.effectsData = {
                    list: []
                };

                let effectDefinitions = [];

                function createEffectsData() {
                    if (ctrl.effects != null && !Array.isArray(ctrl.effects)) {
                        ctrl.effectsData = ctrl.effects;
                    }
                    if (ctrl.effectsData.list == null) {
                        ctrl.effectsData.list = [];
                    }
                    if (ctrl.effectsData.id == null) {
                        ctrl.effectsData.id = uuidv1();
                    }
                    ctrl.effectsUpdate();
                }

                ctrl.shareEffects = async () => {
                    let shareCode = await backendCommunicator.fireEventAsync("getEffectsShareCode", ctrl.effectsData.list);
                    if (shareCode == null) {
                        ngToast.create("Unable to share effects.");
                    } else {
                        utilityService.showModal({
                            component: "copyShareCodeModal",
                            size: 'sm',
                            resolveObj: {
                                shareCode: () => shareCode,
                                title: () => "Effects Share Code",
                                message: () => "Share the below code so others can import these effects."
                            }
                        });
                    }
                };

                function getSharedEffects(code) {
                    return $http.get(`https://bytebin.lucko.me/${code}`)
                        .then(resp => {
                            if (resp.status === 200) {
                                return JSON.parse(unescape(JSON.stringify(resp.data)));
                            }
                            return null;
                        }, () => {
                            return null;
                        });
                }

                ctrl.importSharedEffects = () => {
                    utilityService.openGetInputModal(
                        {
                            model: "",
                            label: "Enter Effects Share Code",
                            saveText: "Add",
                            inputPlaceholder: "Enter code",
                            validationFn: (shareCode) => {
                                return new Promise(async resolve => {
                                    if (shareCode == null || shareCode.trim().length < 1) {
                                        resolve(false);
                                    }

                                    let effectsData = await getSharedEffects(shareCode);

                                    if (effectsData == null || effectsData.effects == null) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Not a valid effects share code."

                        },
                        async (shareCode) => {
                            let effectsData = await getSharedEffects(shareCode);
                            if (effectsData.effects != null) {
                                ctrl.effectsData.list = ctrl.effectsData.list.concat(effectsData.effects);
                            }
                        });
                };

                // when the element is initialized
                ctrl.$onInit = async function() {
                        let effectDefs = await backendCommunicator
                        .fireEventAsync("getEffectDefinitions", {
                            triggerType: $ctrl.resolve.trigger,
                            triggerMeta: $ctrl.resolve.triggerMeta
                        });
                    $ctrl.effectDefs = effectDefs
                        .sort((a, b) => {
                            let textA = a.name.toUpperCase();
                            let textB = b.name.toUpperCase();
                            return textA < textB ? -1 : textA > textB ? 1 : 0;
                        })
                        .filter(e => !e.hidden);

                    if ($ctrl.resolve.selectedEffectTypeId) {
                        $ctrl.selectedEffectDef = $ctrl.effectDefs.find(e => e.id === $ctrl.resolve.selectedEffectTypeId);
                    }

                    if (!$ctrl.selectedEffectDef) {
                        let modalId = $ctrl.resolve.modalId;
                        utilityService.addSlidingModal(
                            $ctrl.modalInstance.rendered.then(() => {
                                let modalElement = $("." + modalId).children();
                                return {
                                    element: modalElement,
                                    name: "Select New Effect",
                                    id: modalId,
                                    instance: $ctrl.modalInstance
                                };
                            })
                        );

                        $scope.$on("modal.closing", function() {
                            utilityService.removeSlidingModal();
                        });
                    }

                    $timeout(() => {
                        angular.element("#effectSearch").trigger("focus");
                    }, 50);

                    $ctrl.selectedEffectDef = {
                        "categories": [
                            "common",
                            "Moderation"
                        ],
                        "dependencies": [
                            "chat"
                        ],
                        "description": "Timeout a user.",
                        "icon": "fad fa-user-clock",
                        "id": "twitcherbot:modTimeout",
                        "name": "Timeout",
                        "triggers": {
                            "api": true,
                            "channel_reward": true,
                            "command": true,
                            "counter": true,
                            "custom_script": true,
                            "event": true,
                            "hotkey": true,
                            "interactive": {
                                "controls": [
                                    "button",
                                    "textbox"
                                ],
                                "events": [
                                    "mousedown",
                                    "keydown",
                                    "submit"
                                ]
                            },
                            "manual": true,
                            "preset": true,
                            "startup_script": true,
                            "timer": true
                        }
                    }
                    
                    if ($ctrl.selectedEffectDef == null) {
                        ngToast.create("Please select an effect!");
                        return;
                    }
                    $ctrl.close({
                        $value: {
                            selectedEffectDef: $ctrl.selectedEffectDef
                        }
                    });
                //上面添加
                    createEffectsData();
                    // effectDefinitions = await effectHelperService.getEffectDefinitions($scope.effect.type);
                    effectDefinitions = await effectHelperService.getAllEffectDefinitions();
                };

                ctrl.getEffectNameById = id => {
                    if (!effectDefinitions || effectDefinitions.length < 1) return "";
                    return effectDefinitions.find(e => e.id === id).name;
                };

                ctrl.$onChanges = function() {
                    createEffectsData();
                };

                ctrl.effectsUpdate = function() {
                    ctrl.update({ effects: ctrl.effectsData });
                };

                ctrl.effectTypeChanged = function(effectType, index) {
                    ctrl.effectsData.list[index].type = effectType.id;
                };
                ctrl.testEffects = function() {
                    ipcRenderer.send('runEffectsManually', ctrl.effectsData);
                };

                ctrl.getLabelButtonTextForLabel = function(labelModel) {
                    if (labelModel == null || labelModel.length === 0) {
                        return "Add Label";
                    }
                    return "Edit Label";
                };

                ctrl.editLabelForEffectAtIndex = function(index) {
                    let effect = ctrl.effectsData.list[index];
                    let label = effect.effectLabel;
                    utilityService.openGetInputModal(
                        {
                            model: label,
                            label: ctrl.getLabelButtonTextForLabel(label),
                            saveText: "Save Label"
                        },
                        (newLabel) => {
                            if (newLabel == null || newLabel.length === 0) {
                                effect.effectLabel = null;
                            } else {
                                effect.effectLabel = newLabel;
                            }
                        });
                };

                ctrl.duplicateEffectAtIndex = function(index) {
                    let effect = JSON.parse(angular.toJson(ctrl.effectsData.list[index]));
                    effect.id = uuidv1();
                    ctrl.effectsData.list.splice(index + 1, 0, effect);
                    ctrl.effectsUpdate();
                };

                ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.removeEffectAtIndex = function(index) {
                    ctrl.effectsData.list.splice(index, 1);
                    ctrl.effectsUpdate();
                };

                ctrl.removeAllEffects = function() {
                    ctrl.effectsData.list = [];
                    ctrl.effectsUpdate();
                };

                ctrl.hasCopiedEffects = function() {
                    return objectCopyHelper.hasCopiedEffects();
                };

                ctrl.pasteEffects = async function(append = false) {
                    if (objectCopyHelper.hasCopiedEffects()) {
                        if (append) {
                            ctrl.effectsData.list = ctrl.effectsData.list.concat(
                                await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta)
                            );
                        } else {
                            ctrl.effectsData.list = await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta);
                        }
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.pasteEffectsAtIndex = async function(index, above) {
                    if (objectCopyHelper.hasCopiedEffects()) {
                        if (!above) {
                            index++;
                        }
                        let copiedEffects = await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta);
                        ctrl.effectsData.list.splice(index, 0, ...copiedEffects);
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.copyEffectAtIndex = function(index) {
                    objectCopyHelper.copyEffects([ctrl.effectsData.list[index]]);
                };

                ctrl.copyEffects = function() {
                    objectCopyHelper.copyEffects(ctrl.effectsData.list);
                };

                ctrl.addEffect = function() {
                    let newEffect = {
                        id: uuidv1(),
                        type: "Nothing"
                    };

                    ctrl.openEditEffectModal(newEffect, null, ctrl.trigger);
                };

                ctrl.openNewEffectModal = function() {
                    utilityService.showModal({
                        component: "addNewEffectModal",
                        backdrop: true,
                        windowClass: "no-padding-modal",
                        resolveObj: {
                            trigger: () => ctrl.trigger,
                            triggerMeta: () => ctrl.triggerMeta
                        },
                        closeCallback: resp => {
                            if (resp == null) return;
                            let { selectedEffectDef } = resp;

                            let newEffect = {
                                id: uuidv1(),
                                type: selectedEffectDef.id
                            };

                            ctrl.openEditEffectModal(newEffect, null, ctrl.trigger);
                        }
                    });
                };

                ctrl.openEditEffectModal = function(effect, index, trigger) {
                    utilityService.showEditEffectModal(effect, index, trigger, response => {
                        if (response.action === "add") {
                            ctrl.effectsData.list.push(response.effect);
                        } else if (response.action === "update") {
                            ctrl.effectsData.list[response.index] = response.effect;
                        } else if (response.action === "delete") {
                            ctrl.removeEffectAtIndex(response.index);
                        }
                        ctrl.effectsUpdate();
                    }, ctrl.triggerMeta);
                };

                ctrl.effectMenuOptions = [
                    {
                        html: `<a href ><i class="fa fa-tag" style="margin-right: 10px;"></i> Edit Tag</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.editLabelForEffectAtIndex($index);
                        }
                    },
                    {
                        html: `<a href ><i class="fa fa-edit" style="margin-right: 10px;"></i> Edit</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            const effect = $itemScope.effect;
                            ctrl.openEditEffectModal(effect, $index, ctrl.trigger);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-clone" style="margin-right: 10px;"></i> Duplicate</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.duplicateEffectAtIndex($index);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-copy" style="margin-right: 10px;"></i> Copy</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.copyEffectAtIndex($index);
                        }
                    },
                    {
                        html: `<a href ><i class="far fa-paste" style="margin-right: 10px;"></i> Paste After</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            if (ctrl.hasCopiedEffects()) {
                                ctrl.pasteEffectsAtIndex($index, false);
                            }
                        }
                    },
                    {
                        html: `<a href style="color: #fb7373;"><i class="fa fa-trash" style="margin-right: 10px;"></i> Delete</a>`,
                        click: function ($itemScope) {
                            const $index = $itemScope.$index;
                            ctrl.removeEffectAtIndex($index);
                        }
                    }
                ];

                //effect queue

                ctrl.eqs = effectQueuesService;

                ctrl.getSelectedEffectQueueName = () => {
                    const unsetDisplay = "Not set";
                    if (ctrl.effectsData.queue == null) return unsetDisplay;
                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    if (queue == null) return unsetDisplay;
                    return queue.name;
                };

                ctrl.getSelectedQueuePriority = () => {
                    const priority = ctrl.effectsData.queuePriority;
                    return priority === 'high' ? 'Yes' : 'No';
                };

                ctrl.getSelectedQueueModeIsCustom = () => {
                    if (ctrl.effectsData.queue == null) return false;
                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    if (queue == null) return false;
                    return queue.mode === "custom";
                };

                ctrl.toggleQueueSelection = (queueId) => {
                    if (ctrl.effectsData.queue !== queueId) {
                        ctrl.effectsData.queue = queueId;
                    } else {
                        ctrl.effectsData.queue = null;
                    }
                };

                ctrl.validQueueSelected = () => {
                    if (ctrl.effectsData.queue == null) return false;
                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    return queue != null;
                };

                ctrl.showAddEditEffectQueueModal = (queueId) => {
                    effectQueuesService.showAddEditEffectQueueModal(queueId)
                        .then(id => {
                            ctrl.effectsData.queue = id;
                        });
                };

                ctrl.showDeleteEffectQueueModal = (queueId) => {
                    effectQueuesService.showDeleteEffectQueueModal(queueId)
                        .then(confirmed => {
                            if (confirmed) {
                                ctrl.effectsData.queue = undefined;
                            }
                        });
                };

                ctrl.openEditQueueDurationModal = () => {
                    utilityService.openGetInputModal(
                        {
                            model: ctrl.effectsData.queueDuration || 0,
                            label: "Edit Effects Duration",
                            saveText: "Save",
                            inputPlaceholder: "Enter secs",
                            validationFn: (value) => {
                                return new Promise(resolve => {
                                    if (value == null || value < 0) {
                                        return resolve(false);
                                    }
                                    resolve(true);
                                });
                            },
                            validationText: "Value must be greater than 0."

                        },
                        (newDuration) => {
                            ctrl.effectsData.queueDuration = newDuration;
                        }
                    );
                };

            }
        });
}());
