"use strict";
(function () {
    //This handles viewer lists.

    angular
        .module("twitcherbotApp")
        .factory("viewersService", function (logger, settingsService, backendCommunicator, $q) {
            let service = {};

            // Check to see if the DB is turned on or not.
            service.isViewerDbOn = function () {
                return settingsService.getViewerDB();
            };

            service.viewers = [];
            let waitingForUpdate = false;
            service.updateViewers = function () {
                if (waitingForUpdate) return Promise.resolve();
                waitingForUpdate = true;
                return $q(resolve => {
                    backendCommunicator.fireEventAsync("getAllViewers")
                        .then(viewers => {
                            resolve(viewers);
                        });
                }).then(viewers => {
                    service.viewers = viewers;
                    waitingForUpdate = false;
                });
            };

            service.updateViewer = function (userId) {
                return $q(resolve => {
                    backendCommunicator.fireEventAsync("getViewerTwitchbotData", userId)
                        .then(viewer => {
                            resolve(viewer);
                        });
                }).then(viewer => {
                    if (viewer) {
                        let index = service.viewers.findIndex(v => v._id === viewer._id);
                        if (index >= 0) {
                            service.viewers[index] = viewer;
                        }
                    }
                });
            };

            service.updateBannedStatus = (username, shouldBeBanned) => {
                backendCommunicator.fireEvent("update-user-banned-status", { username, shouldBeBanned });
            };

            service.updateModStatus = (username, shouldBeMod) => {
                backendCommunicator.fireEvent("update-user-mod-status", { username, shouldBeMod });
            };

            service.toggleFollowOnChannel = (channelIdToFollow, shouldFollow = true) => {
                backendCommunicator.fireEvent("toggleFollowOnChannel", { channelIdToFollow, shouldFollow });
            };

            // Did user see warning alert about connecting to chat first?
            service.sawWarningAlert = true;
            return service;
        });
}());
