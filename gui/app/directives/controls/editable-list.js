"use strict";

const deepmerge = require("deepmerge");

(function() {
    angular
        .module('twitcherbotApp')
        .component("editableList", {
            bindings: {
                model: "=",
                settings: "<",
                onUpdate: '&'
            },
            template: `
                <div>
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.model">
                        <div ng-repeat="item in $ctrl.model track by $index" class="list-item selectable" ng-click="$ctrl.editItem($index)">
                            <span ng-show="$ctrl.settings.sortable" class="dragHandle" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex">
                                <i class="fal fa-bars" aria-hidden="true"></i>
                            </span> 
                            <div uib-tooltip="Click to edit"  style="font-weight: 400;" aria-label="{{item + ' (Click to edit)'}}">{{item}}</div>
                            <span class="clickable" style="color: #fb7373;" ng-click="$ctrl.removeItem($index);$event.stopPropagation();" aria-label="Remove item">
                                <i class="fad fa-trash-alt" aria-hidden="true"></i>
                            </span>
                        </div>
                        <p class="muted" ng-show="$ctrl.model.length < 1">{{$ctrl.settings.noneAddedText}}</p>
                    </div>
                    <div style="margin: 5px 0 10px 0px;">
                        <button class="filter-bar" ng-click="$ctrl.addItem()" uib-tooltip="{{$ctrl.settings.addLabel}}" tooltip-append-to-body="true" aria-label="{{$ctrl.settings.addLabel}}">
                            <i class="far fa-plus"></i> 
                        </button>               
                    </div>         
                </div>
            `,
            controller: function(utilityService) {

                const $ctrl = this;

                $ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {}
                };

                const defaultSettings = {
                    sortable: false,
                    addLabel: "Add",
                    editLabel: "Edit",
                    validationText: "Text cannot be empty",
                    noneAddedText: "None saved"
                };


                $ctrl.$onInit = () => {
                    if ($ctrl.settings == null) {
                        $ctrl.settings = defaultSettings;
                    } else {
                        $ctrl.settings = deepmerge(defaultSettings, $ctrl.settings);
                    }

                    if ($ctrl.model == null) {
                        $ctrl.model = [];
                    }
                };

                function openGetInputModal(model, isNew = true, cb) {
                    utilityService.openGetInputModal(
                        {
                            model: model,
                            label: isNew ? $ctrl.settings.addLabel : $ctrl.settings.editLabel,
                            useTextArea: $ctrl.settings.useTextArea,
                            saveText: "Save",
                            validationFn: (value) => {
                                return new Promise(resolve => {
                                    if (value == null || value.trim().length < 1) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: $ctrl.settings.validationText
                        },
                        cb);
                }

                $ctrl.editItem = (index) => {
                    openGetInputModal($ctrl.model[index], false, (newItem) => {
                        $ctrl.model[index] = newItem;
                    });
                };

                $ctrl.addItem = () => {
                    openGetInputModal("", true, (newItem) => {
                        $ctrl.model.push(newItem);
                    });
                };

                $ctrl.removeItem = (index) => {
                    $ctrl.model.splice(index, 1);
                };

            }
        });
}());
