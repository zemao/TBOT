"use strict";

(function() {

    angular
        .module("twitcherbotApp")
        .factory("streamInfoService", function($q, backendCommunicator) {
            let service = {};

            service.streamInfo = {
                isLive: false,
                viewers: 0,
                startedAt: null
            };

            $q.when(backendCommunicator.fireEventAsync("get-stream-info"))
                .then((streamInfo) => {
                    service.streamInfo.isLive = streamInfo.isLive;
                    service.streamInfo.viewers = streamInfo.viewers;
                    service.streamInfo.startedAt = streamInfo.startedAt;
                });

            backendCommunicator.on("stream-info-update", (streamInfo) => {
                service.streamInfo.isLive = streamInfo.isLive;
                service.streamInfo.viewers = streamInfo.viewers;
                service.streamInfo.startedAt = streamInfo.startedAt;
            });

            return service;
        });
}());
