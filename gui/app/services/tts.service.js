"use strict";

(function () {

    angular
        .module("twitcherbotApp")
        .factory("ttsService", function (logger, $q, settingsService, backendCommunicator) {
            let service = {};

            let voices = [];

            let obtainVoices = () => {
                return new Promise(function (resolve) {
                    let voices = speechSynthesis.getVoices();
                    if (voices.length !== 0) {
                        resolve(voices);
                    } else {
                        speechSynthesis.addEventListener("voiceschanged", function () {
                            voices = speechSynthesis.getVoices();
                            resolve(voices);
                        });
                    }
                });
            };
            service.obtainVoices = () => {
                return new Promise(resolve => {
                    $q.when(obtainVoices()).then(foundVoices => {
                        voices = foundVoices;
                        resolve();
                    });
                });
            };

            service.getVoices = () => {
                return voices.map(v => {
                    return {
                        id: v.voiceURI,
                        name: v.name
                    };
                });
            };

            service.getVoiceById = (id) => {
                if (id === 'default' || id == null) {
                    id = service.getTwitchbotDefaultVoiceId();
                }
                let voices = service.getVoices();
                return voices.find(v => v.id === id);
            };

            service.getTwitchbotDefaultVoiceId = () => {
                let savedDefaultVoiceId = settingsService.getDefaultTtsVoiceId();
                if (savedDefaultVoiceId) {
                    return savedDefaultVoiceId;
                }
                return service.getOsDefaultVoiceId();
            };

            service.getOsDefaultVoiceId = () => {
                let voices = speechSynthesis.getVoices();

                let defaultVoice = voices.find(v => v.default === true);

                return defaultVoice;
            };

            service.readText = (text, voiceId) => {
                if (text == null || text.length < 1) return;

                if (voiceId === 'default' || voiceId == null) {
                    voiceId = service.getTwitchbotDefaultVoiceId();
                }
                if (voiceId == null) return;

                let speechSynthesisVoice = voices.find(v => v.voiceURI === voiceId);
                if (speechSynthesisVoice == null) return;

                let msg = new SpeechSynthesisUtterance();
                msg.voice = speechSynthesisVoice;
                msg.volume = settingsService.getTtsVoiceVolume();
                msg.rate = settingsService.getTtsVoiceRate();
                msg.text = text;
                msg.lang = 'en-US';

                speechSynthesis.speak(msg);
            };

            backendCommunicator.on("read-tts", (data) => {
                let { text, voiceId } = data;
                service.readText(text, voiceId);
            });

            backendCommunicator.on("stop-all-sounds", () => {
                speechSynthesis.cancel();
            });

            return service;
        });
}(window.angular));
