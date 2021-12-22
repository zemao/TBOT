"use strict";
(function() {

    const uuidv1 = require("uuid/v1");

    angular
        .module('twitcherbotApp')
        .component("restrictionsList", {
            bindings: {
                trigger: "@",
                triggerMeta: "<",
                restrictionData: "=",
                modalId: "@"
            },
            template: `
                <div>
                    <div style="padding-bottom: 4px;padding-left: 2px;font-size: 13px;font-family: 'Quicksand'; color: #8A8B8D;">
                        <span>Only trigger when </span>

                        <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                            <div class="noselect pointer ddtext" style="font-size: 12px;">
                                <a href aria-label="Control Restrictions Options">
                                    {{$ctrl.getRestrictionModeDisplay()}}
                                    <span class="fb-arrow down ddtext"></span>
                                </a>
                            </div>
                            <ul class="dropdown-menu" style="z-index: 10000000;" uib-dropdown-menu>

                                <li ng-click="$ctrl.restrictionData.mode = 'all'">
                                    <a href style="padding-left: 10px;" aria-label="all restrictions pass">all restrictions pass</a>
                                </li>

                                <li ng-click="$ctrl.restrictionData.mode = 'any'">
                                    <a href style="padding-left: 10px;" aria-label="any restrictions pass">any restriction pass</a>
                                </li>

                                <li ng-click="$ctrl.restrictionData.mode = 'none'">
                                    <a href style="padding-left: 10px;" aria-label="no restrictions pass">no restrictions pass</a>
                                </li>
                            </ul>
                        </div>
                        <span>:</span>
                    </div>
                    <div>
                        <restriction-item ng-repeat="restriction in $ctrl.restrictionData.restrictions" 
                            restriction="restriction" 
                            restriction-definition="$ctrl.getRestrictionDefinition(restriction.type)"
                            on-delete="$ctrl.deleteRestriction(restriction.id)">
                        </restriction-item>
                    </div>
                    <div>
                        <div class="filter-bar clickable"
                            ng-show="$ctrl.canAddMoreRestrictions"
                            ng-click="$ctrl.showAddRestrictionModal()" 
                            uib-tooltip="Add Restriction" 
                            aria-label="Add Restriction"  
                            tooltip-append-to-body="true">
                                <i class="fa fa-plus"></i> 
                        </div>
                    </div>
                    <div style="margin-top: 5px;" ng-show="$ctrl.restrictionData.restrictions.length > 0">
                        <label class="control-fb control--checkbox"> Send chat message when restrictions not met 
                            <input type="checkbox" ng-model="$ctrl.restrictionData.sendFailMessage">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </div>
            `,
            controller: function(utilityService, backendCommunicator) {
                let $ctrl = this;

                let restrictionDefinitions = backendCommunicator.fireEventSync("getRestrictions")
                    .map(r => {
                        return {
                            definition: r.definition,
                            optionsTemplate: r.optionsTemplate,
                            optionsController: eval(r.optionsControllerRaw), // eslint-disable-line no-eval
                            optionsValueDisplay: eval(r.optionsValueDisplayRaw) // eslint-disable-line no-eval
                        };
                    });

                $ctrl.getRestrictionModeDisplay = function() {
                    if ($ctrl.restrictionData.mode === "any") {
                        return "any restriction passes";
                    }
                    if ($ctrl.restrictionData.mode === "none") {
                        return "no restrictions pass";
                    }
                    return "all restrictions pass";
                };

                $ctrl.canAddMoreRestrictions = true;
                function updateCanAddMoreRestrictions() {
                    /*$ctrl.canAddMoreRestrictions = restrictionDefinitions
                        .some(r => {
                            return !$ctrl.restrictionData.restrictions.some(rs => rs.type === r.definition.id);
                        });*/
                }

                $ctrl.$onInit = function() {
                    if ($ctrl.restrictionData == null) {
                        $ctrl.restrictionData = {
                            restrictions: [],
                            mode: "all",
                            sendFailMessage: true
                        };
                    }

                    if ($ctrl.restrictionData.mode == null) {
                        $ctrl.restrictionData.mode = "all";
                    }

                    if ($ctrl.restrictionData.restrictions == null) {
                        $ctrl.restrictionData.restrictions = [];
                    }

                    if ($ctrl.restrictionData.sendFailMessage == null) {
                        $ctrl.restrictionData.sendFailMessage = true;
                    }

                    updateCanAddMoreRestrictions();
                };

                $ctrl.deleteRestriction = function(restrictionId) {
                    $ctrl.restrictionData.restrictions = $ctrl.restrictionData.restrictions
                        .filter(r => r.id !== restrictionId);

                    updateCanAddMoreRestrictions();
                };

                $ctrl.getRestrictionDefinition = function(restrictionType) {
                    return restrictionDefinitions.find(r => r.definition.id === restrictionType);
                };

                $ctrl.showAddRestrictionModal = function() {

                    let options = restrictionDefinitions
                        .filter(r => !r.definition.hidden)
                        .map(r => {
                            return {
                                id: r.definition.id,
                                name: r.definition.name,
                                description: r.definition.description
                            };
                        }).sort((a, b) => {
                            let textA = a.name.toUpperCase();
                            let textB = b.name.toUpperCase();
                            return textA < textB ? -1 : textA > textB ? 1 : 0;
                        });

                    utilityService.openSelectModal(
                        {
                            label: "Add Restriction",
                            options: options,
                            saveText: "Add",
                            validationText: "Please select a restriction type."

                        },
                        (selectedId) => {
                            // just in case, remove any other restrictions of the same type
                            /*$ctrl.restrictionData.restrictions = $ctrl.restrictionData.restrictions
                                .filter(r => r.type !== selectedId);*/

                            $ctrl.restrictionData.restrictions.push({
                                id: uuidv1(),
                                type: selectedId
                            });

                            updateCanAddMoreRestrictions();
                        });
                };
            }
        });
}());
