"use strict";

const uuid = require("uuid/v4");
const logger = require("../logwrapper");
const accountAccess = require("../common/account-access");
const twitchClient = require("../twitch-api/client");
const bttv = require("./third-party/bttv");
const ffz = require("./third-party/ffz");
const frontendCommunicator = require("../common/frontend-communicator");

/**
 * @typedef TwitchbotChatMessage
 * @property {string} id
 * @property {string} username
 * @property {string} profilePicUrl
 * @property {number} userId
 * @property {string[]} roles
 * @property {any[]} badges
 * @property {string} customRewardId
 * @property {string} color
 * @property {string} rawText
 * @property {import('twitch-chat-client/lib/Toolkit/EmoteTools').ParsedMessagePart[]} parts
 * @property {boolean} whisper
 * @property {boolean} action
 * @property {boolean} isCheer
 * @property {boolean} tagged
 * @property {boolean} isFounder
 * @property {boolean} isBroadcaster
 * @property {boolean} isBot
 * @property {boolean} isMod
 * @property {boolean} isSubscriber
 * @property {boolean} isVip
 * @property {boolean} isCheer
 * @property {boolean} isHighlighted
 *
 */

/**@type {import('twitch/lib/API/Badges/ChatBadgeList').ChatBadgeList} */
let badgeCache = null;
exports.cacheBadges = async () => {
    const streamer = accountAccess.getAccounts().streamer;
    const client = twitchClient.getClient();
    if (streamer.loggedIn && client) {
        badgeCache = await client.badges.getChannelBadges(streamer.userId, true);
    }
};

let streamerData = {
    color: "white",
    badges: new Map()
};
exports.setStreamerData = function (newStreamerData) {
    streamerData = newStreamerData;
};

/**@type {import('twitch/lib/API/Kraken/Channel/EmoteSetList').EmoteSetList} */
let streamerEmotes = null;

exports.cacheStreamerEmotes = async () => {
    const client = twitchClient.getClient();
    const streamer = accountAccess.getAccounts().streamer;

    if (client == null || !streamer.loggedIn) return;

    streamerEmotes = await client.kraken.users.getUserEmotes(streamer.userId);
};



/**
 * @typedef ThirdPartyEmote
 * @property {string} url
 * @property {string} code
 * @property {string} origin
 * @property {boolean} animated
 */

/**
 * @type {ThirdPartyEmote[]}
 */
let thirdPartyEmotes = [];

exports.cacheThirdPartyEmotes = async () => {
    const bttvEmotes = await bttv.getAllBttvEmotes();
    const ffzEmotes = await ffz.getAllFfzEmotes();
    thirdPartyEmotes = [
        ...bttvEmotes,
        ...ffzEmotes
    ];
};

exports.handleChatConnect = async () => {
    await exports.cacheBadges();

    await exports.cacheStreamerEmotes();

    await exports.cacheThirdPartyEmotes();

    //加入twitch获取到的所有表情，暂时不加入第三方bttv、ffz的表情
    frontendCommunicator.send("all-emotes", [
        ...Object.values(streamerEmotes && streamerEmotes._data || {})
            .flat()
            .map(e => ({
                url: `https://static-cdn.jtvnw.net/emoticons/v1/${e.id}/1.0`,
                origin: "Twitch",
                code: e.code
            }))
        //屏蔽掉第三方的表情，不加入到所有表情里面
        //     })),
        // ...thirdPartyEmotes
    ]);
};

const profilePicUrlCache = {};
async function getUserProfilePicUrl(userId) {
    if (userId == null) {
        return null;
    }

    if (profilePicUrlCache[userId]) {
        return profilePicUrlCache[userId];
    }

    const streamer = accountAccess.getAccounts().streamer;
    const client = twitchClient.getClient();
    if (streamer.loggedIn && client) {
        const user = await client.helix.users.getUserById(userId);
        if (user) {
            profilePicUrlCache[userId] = user.profilePictureUrl;
            return user.profilePictureUrl;
        }
    }
    return null;
}
exports.getUserProfilePicUrl = getUserProfilePicUrl;
exports.setUserProfilePicUrl = (userId, url) => {
    if (userId == null || url == null) return;
    profilePicUrlCache[userId] = url;
};

const URL_REGEX = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)/i;

/**
 * @param {TwitchbotChatMessage} twitcherbotChatMessage
 * @param {import('twitch-chat-client/lib/Toolkit/EmoteTools').ParsedMessagePart[]} parts
 */
function parseMessageParts(twitcherbotChatMessage, parts) {
    if (twitcherbotChatMessage == null || parts == null) return [];
    const { streamer, bot } = accountAccess.getAccounts();
    return parts.flatMap(p => {
        if (p.type === "text" && p.text != null) {

            if (twitcherbotChatMessage.username !== streamer.displayName &&
                (!bot.loggedIn || twitcherbotChatMessage.username !== bot.displayName)) {
                if (!twitcherbotChatMessage.whisper &&
                    !twitcherbotChatMessage.tagged &&
                    streamer.loggedIn &&
                    p.text.includes(streamer.username)) {
                    twitcherbotChatMessage.tagged = true;
                }
            }

            const subParts = [];
            for (const word of p.text.split(" ")) {
                // check for links
                if (URL_REGEX.test(word)) {
                    subParts.push({
                        type: "link",
                        text: `${word} `,
                        url: word.startsWith("http") ? word : `https://${word}`
                    });
                    continue;
                }

                // check for third party emotes
                const thirdPartyEmote = thirdPartyEmotes.find(e => e.code === word);
                if (thirdPartyEmote) {
                    subParts.push({
                        type: "third-party-emote",
                        name: thirdPartyEmote.code,
                        origin: thirdPartyEmote.origin,
                        url: thirdPartyEmote.url
                    });
                    continue;
                }

                const previous = subParts[subParts.length - 1];
                if (previous && previous.type === "text") {
                    previous.text += `${word} `;
                } else {
                    subParts.push({
                        type: "text",
                        text: `${word} `
                    });
                }
            }

            return subParts;
        }
        if (p.type === "emote") {
            p.url = `https://static-cdn.jtvnw.net/emoticons/v1/${p.id}/1.0`;
            p.origin = "Twitch";
        }
        return p;
    });
}

exports.buildTwitchbotChatMessageFromText = async (text = "") => {
    const streamer = accountAccess.getAccounts().streamer;

    const action = text.startsWith("/me");

    if (action) {
        text = text.replace("/me", "");
    }

    /**@type {TwitchbotChatMessage} */
    const streamerTwitchbotChatMessage = {
        id: uuid(),
        username: streamer.displayName,
        userId: streamer.userId,
        rawText: text,
        profilePicUrl: streamer.avatar,
        whisper: false,
        action: action,
        tagged: false,
        isBroadcaster: true,
        color: streamerData.color,
        badges: [],
        parts: [],
        roles: [
            "broadcaster"
        ]
    };

    if (streamerEmotes) {
        const words = text.split(" ");
        for (const word of words) {
            let emoteId = null;
            try {
                const foundEmote = Object.values(streamerEmotes && streamerEmotes._data || {})
                    .flat()
                    .find(e => e.code === word);
                if (foundEmote) {
                    emoteId = foundEmote.id;
                }
            } catch (err) {
                //logger.silly(`Failed to find emote id for ${word}`, err);
            }

            /**@type {import('twitch-chat-client/lib/Toolkit/EmoteTools').ParsedMessagePart} */
            let part;
            if (emoteId != null) {
                part = {
                    type: "emote",
                    url: `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/1.0`,
                    id: emoteId,
                    name: word
                };
            } else {
                part = {
                    type: "text",
                    text: `${word} `
                };
            }
            streamerTwitchbotChatMessage.parts.push(part);
        }
    } else {
        streamerTwitchbotChatMessage.parts.push({
            type: "text",
            text: text
        });
    }

    streamerTwitchbotChatMessage.parts = parseMessageParts(streamerTwitchbotChatMessage, streamerTwitchbotChatMessage.parts);

    if (badgeCache != null) {
        for (const [setName, version] of streamerData.badges.entries()) {

            const set = badgeCache.getBadgeSet(setName);
            if (set._data == null) continue;

            const setVersion = set.getVersion(version);
            if (setVersion._data == null) continue;

            try {
                streamerTwitchbotChatMessage.badges.push({
                    title: setVersion.title,
                    url: setVersion.getImageUrl(2)
                });
            } catch (err) {
                logger.debug(`Failed to find badge ${setName} v:${version}`, err);
            }
        }
    }

    return streamerTwitchbotChatMessage;
};

/**
 * @arg {import('twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage').TwitchPrivateMessage} msg
 * @returns {TwitchbotChatMessage}
*/
exports.buildTwitchbotChatMessage = async (msg, msgText, whisper = false, action = false) => {

    /**@type {TwitchbotChatMessage} */
    const twitcherbotChatMessage = {
        id: msg.tags.get("id"),
        username: msg.userInfo.displayName,
        userId: msg.userInfo.userId,
        customRewardId: msg.tags.get("custom-reward-id"),
        isHighlighted: msg.tags.get("msg-id") === "highlighted-message",
        rawText: msgText,
        whisper: whisper,
        action: action,
        tagged: false,
        isCheer: msg.isCheer,
        badges: [],
        parts: [],
        roles: []
    };

    const profilePicUrl = await getUserProfilePicUrl(twitcherbotChatMessage.userId);
    twitcherbotChatMessage.profilePicUrl = profilePicUrl;

    const { streamer, bot } = accountAccess.getAccounts();

    /**
     * this is a hack to override the message param for actions.
     * Action message params normally have some weird control characters and an "ACTION" prefix (look up CTCP for IRC).
     * The twitch library we use has a bug where it doesnt take this into account in msg.parseEmotes()
     * So here we are overriding the internal message param with the raw text before we call parseEmotes
     */
    if (action && msg._params && msg._params.length > 1) {
        msg._params[1].value = msgText;
        msg.parseParams();
    }

    const messageParts = parseMessageParts(twitcherbotChatMessage, msg
        .parseEmotes());

    twitcherbotChatMessage.parts = messageParts;

    if (badgeCache != null) {
        for (const [setName, version] of msg.userInfo.badges.entries()) {

            const set = badgeCache.getBadgeSet(setName);
            if (set._data == null) continue;

            const setVersion = set.getVersion(version);
            if (setVersion._data == null) continue;

            try {
                twitcherbotChatMessage.badges.push({
                    title: setVersion.title,
                    url: setVersion.getImageUrl(2)
                });
            } catch (err) {
                logger.debug(`Failed to find badge ${setName} v:${version}`, err);
            }
        }
    }

    twitcherbotChatMessage.isFounder = msg.userInfo.isFounder;
    twitcherbotChatMessage.isMod = msg.userInfo.isMod;
    twitcherbotChatMessage.isSubscriber = msg.userInfo.isSubscriber;
    twitcherbotChatMessage.isVip = msg.userInfo.isVip;

    if (streamer.loggedIn && twitcherbotChatMessage.username === streamer.displayName) {
        twitcherbotChatMessage.isBroadcaster = true;
        twitcherbotChatMessage.roles.push("broadcaster");
    }

    if (bot.loggedIn && twitcherbotChatMessage.username === bot.displayName) {
        twitcherbotChatMessage.isBot = true;
        twitcherbotChatMessage.roles.push("bot");
    }

    if (twitcherbotChatMessage.isFounder) {
        twitcherbotChatMessage.roles.push("founder");
        twitcherbotChatMessage.roles.push("sub");
    } else if (twitcherbotChatMessage.isSubscriber) {
        twitcherbotChatMessage.roles.push("sub");
    }

    if (twitcherbotChatMessage.isMod) {
        twitcherbotChatMessage.roles.push("mod");
    }

    if (twitcherbotChatMessage.isVip) {
        twitcherbotChatMessage.roles.push("vip");
    }

    twitcherbotChatMessage.isCheer = msg.isCheer === true;

    twitcherbotChatMessage.color = msg.userInfo.color;

    return twitcherbotChatMessage;
};