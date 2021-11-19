"use strict";
(function() {
    // This handles the Groups tab

    angular
        .module("twitcherbotApp")
        .controller("viewerRolesController", function($scope, utilityService, viewerRolesService) {

            $scope.viewerRolesService = viewerRolesService;

            $scope.showAddOrEditCustomRoleModal = function(role) {

                utilityService.showModal({
                    component: "addOrEditCustomRoleModal",
                    size: "sm",
                    resolveObj: {
                        role: () => role
                    },
                    closeCallback: resp => {
                        let { action, role } = resp;

                        switch (action) {
                        case "save":
                            viewerRolesService.saveCustomRole(role);
                            break;
                        case "delete":
                            viewerRolesService.deleteCustomRole(role.id);
                            break;
                        }
                    }
                });
            };
        });
}());
