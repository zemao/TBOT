"use strict";

const { indexOf } = require("angular-route");

(function() {
    angular
        .module("twitcherbotApp")
        .controller("gamesController", function($scope, gamesService, utilityService) {
            $scope.gamesService = gamesService;

            $scope.openEditGameSettingsModal = function(game) {
                utilityService.showModal({
                    component: "editGameSettingsModal",
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        game: () => game
                    },
                    closeCallback: resp => {
                        const action = resp.action;

                        if (action === 'save') {
                            const updatedGame = resp.game;
                            if (updatedGame == null) return;
                            gamesService.saveGame(updatedGame);
                        }

                        if (action === 'reset') {
                            gamesService.resetGameToDefault(resp.gameId);
                        }
                    }
                });
            };
        });
}());
