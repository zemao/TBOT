"use strict";

const chat = require("../../../../backend/chat/twitch-chat");

exports.getStatus = function(req, res) {
    let status = {
        connections: {
            chat: chat.chatIsConnected()
        }
    };
    res.json(status);
};
