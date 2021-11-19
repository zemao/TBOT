"use strict";
(function($) {
    // This handles the Groups tab

    angular
        .module("twitcherbotApp")
        .controller("editCommandSettingsModalController", function(
            $scope,
            $uibModalInstance,
            utilityService,
            commandsService
        ) {
            // Gets timed group cache
            $scope.getTimedGroupSettings = function() {
                return commandsService.getTimedGroupSettings();
            };

            // Close modal when you click the x
            $scope.close = function() {
                $uibModalInstance.close();
            };

            // Close modal when you hit cancel
            $scope.dismiss = function() {
                $uibModalInstance.dismiss();
            };

            /*
            * ADD OR EDIT TIMED GROUP MODAL
            */
            $scope.showAddOrEditTimedGroupModal = function(timedGroup) {
                let editTimedGroupDefaultsModalContext = {
                    templateUrl:
            "./templates/chat/command-modals/addOrEditTimedGroupModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: (
                        $scope,
                        $uibModalInstance,
                        commandsService,
                        utilityService,
                        timedGroup
                    ) => {
                        $scope.timedGroup = {};
                        $scope.isNewGroup = true;

                        // Check to see if this is a new group or an edit.
                        if (timedGroup != null) {
                            $scope.timedGroup = timedGroup;
                            $scope.isNewGroup = false;
                        } else {
                            // This is a new group, so default active to true.
                            $scope.timedGroup = { active: true };
                        }

                        // Get all of the commands to list out in the modal.
                        $scope.allCommandIds = [];
                        let commandTriggers = {};

                        let allCommands = commandsService.getAllCommandsForType('Active');
                        for (let commandItem in allCommands) {
                            if (allCommands.hasOwnProperty(commandItem)) {
                                let command = allCommands[commandItem];
                                commandTriggers[command.commandID] = command.trigger;
                                $scope.allCommandIds.push(command.commandID);
                            }
                        }


                        $scope.getTriggerFromId = (id) => {
                            return commandTriggers[id];
                        };


                        $scope.updateCheckedArrayWithElement = function(array, element) {
                            $scope.timedGroup.commands = utilityService.getNewArrayWithToggledElement(
                                array,
                                element
                            );
                        };

                        // This checks to see if a command should be checked or not.
                        $scope.arrayContainsElement = function(commands, commandID) {
                            return utilityService.arrayContainsElement(commands, commandID);
                        };

                        // This saves the content in the modal.
                        $scope.save = function() {
                            if (
                                $scope.timedGroup.groupName != null &&
                $scope.timedGroup.groupName !== ""
                            ) {
                                $uibModalInstance.close({
                                    shouldDelete: false,
                                    newTimedGroup: $scope.timedGroup
                                });
                            }
                        };

                        // This deletes the timed group.
                        $scope.delete = function() {
                            $uibModalInstance.close({ shouldDelete: true });
                        };

                        // When they hit cancel or click outside the modal, we dont want to do anything
                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss();
                        };
                    },
                    closeCallback: response => {
                        let previousName = "";
                        if (timedGroup != null) {
                            previousName = timedGroup.groupName;
                        }

                        // Save or delete.
                        if (response.shouldDelete) {
                            commandsService.deleteTimedGroup(previousName, timedGroup);
                        } else {
                            commandsService.saveTimedGroup(
                                previousName,
                                response.newTimedGroup
                            );
                        }

                        // Refresh commands
                        commandsService.refreshCommands();
                    },
                    resolveObj: {
                        timedGroup: () => {
                            if (timedGroup == null) {
                                return null;
                            }
                            return $.extend(true, {}, timedGroup);
                        }
                    }
                };
                utilityService.showModal(editTimedGroupDefaultsModalContext);
            };
        });
}(window.jQuery));
