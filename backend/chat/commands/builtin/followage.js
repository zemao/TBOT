"use strict";

const twitchApi = require("../../../twitch-api/api");
const moment = require("moment");
const chat = require("../../twitch-chat");
const util = require("../../../utility");

/**
 * The Uptime command
 */
const followage = {
    definition: {
        id: "twitcherbot:followage",
        name: "Follow Age",
        active: true,
        trigger: "!followage",
        description: "Displays how long the user has been following the channel.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        },
        options: {
            displayTemplate: {
                type: "string",
                title: "Output Template",
                description: "How the followage message is formatted",
                tip: "Variables: {user}, {followage}, {followdate}",
                default: `{user} followed {followage} ago on {followdate} UTC`,
                useTextArea: true
            }
        }
    },
    /**
   * When the command is triggered
   */
    onTriggerEvent: async event => {
        const commandSender = event.userCommand.commandSender;
        const commandOptions = event.commandOptions;

        let followDate = await twitchApi.users.getFollowDateForUser(commandSender);

        if (followDate === null) {
            chat.sendChatMessage(`${commandSender} is not following the channel.`);
        } else {
            let followDateMoment = moment(followDate),
                nowMoment = moment();

            let followAgeString = util.getDateDiffString(
                followDateMoment,
                nowMoment
            );

            chat.sendChatMessage(commandOptions.displayTemplate
                .replace("{user}", commandSender)
                .replace("{followage}", followAgeString)
                .replace("{followdate}", followDateMoment.format("DD MMMM YYYY HH:mm"))
            );
        }
    }
};

module.exports = followage;
