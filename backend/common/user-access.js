"use strict";

const userDb = require("../database/userDatabase");
const accountAccess = require("../common/account-access");
const NodeCache = require('node-cache');
const twitchApi = require("../twitch-api/api");
const twitchClient = require("../twitch-api/client");
const logger = require("../logwrapper");

const followCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

async function userFollowsChannels(username, channelNames) {
    let userfollowsAllChannels = true;

    for (let channelName of channelNames) {
        let userFollowsChannel = false;

        // check cache first
        let cachedFollow = followCache.get(`${username}:${channelName}`);
        if (cachedFollow !== undefined) {
            userFollowsChannel = cachedFollow;
        } else {
            userFollowsChannel = await twitchApi.users.doesUserFollowChannel(username, channelName);

            // set cache value
            followCache.set(`${username}:${channelName}`, userFollowsChannel);
        }

        if (!userFollowsChannel) {
            userfollowsAllChannels = false;
            break;
        }
    }

    return userfollowsAllChannels;
}

function getUser(userId) {
    const client = twitchClient.getClient();
    return client.helix.users.getUserById(userId);
}

async function getUserDetails(userId) {

    const twitcherbotUserData = await userDb.getUserById(userId);

    if (!twitcherbotUserData.twitch) {
        return {
            twitcherbotData: twitcherbotUserData || {}
        };
    }

    let twitchUser;
    try {
        twitchUser = await getUser(userId);
    } catch (error) {
        // fail silently for now
    }

    if (twitchUser == null) {
        return {
            twitcherbotData: twitcherbotUserData || {}
        };
    }

    const twitchUserData = {
        id: twitchUser.id,
        username: twitchUser.name,
        displayName: twitchUser.displayName,
        iconUrl: twitchUser.logoUrl,
        creationDate: twitchUser.creationDate
    };

    const streamerData = accountAccess.getAccounts().streamer;

    const client = twitchClient.getClient();

    let isBanned;
    try {
        isBanned = await client.helix.moderation.checkUserBan(streamerData.userId, twitchUser.id);
    } catch (error) {
        logger.warn("Unable to get banned status", error);
    }

    const userRoles = await twitchApi.users.getUsersChatRoles(twitchUser.id);
    const teamRoles = await twitchApi.teams.getMatchingTeamsById(twitchUser.id);

    const userFollowsStreamerResponse = await client.helix.users.getFollows({
        user: userId,
        followedUser: streamerData.userId
    });

    const streamerFollowsUserResponse = await client.helix.users.getFollows({
        user: streamerData.userId,
        followedUser: userId
    });

    const streamerFollowsUser = streamerFollowsUserResponse.data != null &&
        streamerFollowsUserResponse.data.length === 1;
    const userFollowsStreamer = userFollowsStreamerResponse.data != null &&
        userFollowsStreamerResponse.data.length === 1;

    if (twitchUserData) {
        twitchUserData.followDate = userFollowsStreamer &&
            userFollowsStreamerResponse.data[0].followDate;
        twitchUserData.isBanned = isBanned;
        twitchUserData.userRoles = userRoles || [];
        twitchUserData.teamRoles = teamRoles || [];
    }

    const userDetails = {
        twitcherbotData: twitcherbotUserData || {},
        twitchData: twitchUserData,
        streamerFollowsUser: streamerFollowsUser,
        userFollowsStreamer: userFollowsStreamer
    };

    return userDetails;
}

exports.getUser = getUser;
exports.getUserDetails = getUserDetails;
exports.userFollowsChannels = userFollowsChannels;