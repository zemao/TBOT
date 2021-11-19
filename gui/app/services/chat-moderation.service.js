"use strict";

(function() {

    const moment = require("moment");

    angular
        .module("twitcherbotApp")
        .factory("chatModerationService", function(backendCommunicator) {
            let service = {};

            service.chatModerationData = {
                settings: {
                    bannedWordList: {
                        enabled: false
                    },
                    repetitions: {
                        enabled: false,
                        max: 10
                    },
                    emoteLimit: {
                        enabled: false,
                        max: 10
                    },
                    excessCaps: {
                        enabled: false,
                        max: 10
                    },
                    symbols: {
                        enabled: false,
                        max: 10
                    },
                    urlModeration: {
                        enabled: false,
                        viewTime: {
                            enabled: false,
                            viewTimeInHours: 0
                        },
                        outputMessage: ""
                    },
                    exemptRoles: []
                },
                bannedWords: []
            };

            service.loadChatModerationData = () => {
                let data = backendCommunicator.fireEventSync("getChatModerationData");
                if (data != null) {
                    service.chatModerationData = data;
                    if (service.chatModerationData.settings.exemptRoles == null) {
                        service.chatModerationData.settings.exemptRoles = [];
                    }
                    if (service.chatModerationData.settings.emoteLimit == null) {
                        service.chatModerationData.settings.emoteLimit = {
                            enabled: false,
                            max: 10
                        };
                    }

                    if (service.chatModerationData.settings.repetitions == null) {
                        service.chatModerationData.settings.repetitions = {
                            enabled: false,
                            max: 10
                        };
                    }

                    if (service.chatModerationData.settings.excessCaps == null) {
                        service.chatModerationData.settings.excessCaps = {
                            enabled: false,
                            max: 10
                        };
                    }

                    if (service.chatModerationData.settings.symbols == null) {
                        service.chatModerationData.settings.symbols = {
                            enabled: false,
                            max: 10
                        };
                    }
                }
            };

            service.saveChatModerationSettings = () => {
                backendCommunicator.fireEvent("chatMessageSettingsUpdate", service.chatModerationData.settings);
            };

            service.addBannedWords = (words) => {

                let normalizedWords = words
                    .filter(w => w != null && w.trim().length > 0 && w.trim().length < 360)
                    .map(w => w.trim().toLowerCase());

                let mapped = [...new Set(normalizedWords)].map(w => {
                    return {
                        text: w,
                        createdAt: moment().valueOf()
                    };
                });

                service.chatModerationData.bannedWords = service.chatModerationData.bannedWords.concat(mapped);

                backendCommunicator.fireEvent("addBannedWords", mapped);
            };

            service.removeBannedWordAtIndex = (index) => {
                let word = service.chatModerationData.bannedWords[index];
                if (word) {
                    backendCommunicator.fireEvent("removeBannedWord", word.text);
                    service.chatModerationData.bannedWords.splice(index, 1);
                }
            };

            service.removeBannedWordByText = (text) => {
                let index = service.chatModerationData.bannedWords.findIndex(w => w.text === text);
                if (index > -1) {
                    service.removeBannedWordAtIndex(index);
                }
            };

            service.removeAllBannedWords = () => {
                service.chatModerationData.bannedWords = [];
                backendCommunicator.fireEvent("removeAllBannedWords");
            };

            service.registerPermitCommand = () => {
                backendCommunicator.fireEvent("registerPermitCommand");
            };

            service.unregisterPermitCommand = () => {
                backendCommunicator.fireEvent("unregisterPermitCommand");
            };

            return service;
        });
}());
