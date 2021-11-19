"use strict";

const twitchUsers = require("../../../twitch-api/resource/users");

const customRolesManager = require("../../../roles/custom-roles-manager");
const teamRolesManager = require("../../../roles/team-roles-manager");
const twitchRolesManager = require("../../../../shared/twitch-roles");

module.exports = {
    id: "twitcherbot:viewerroles",
    name: "Viewer's Roles",
    description: "Filter to a given viewer role",
    events: [
        { eventSourceId: "twitch", eventId: "cheer" },
        { eventSourceId: "twitch", eventId: "subs-gifted" },
        { eventSourceId: "twitch", eventId: "sub" },
        { eventSourceId: "twitch", eventId: "follow" },
        { eventSourceId: "streamlabs", eventId: "follow" },
        { eventSourceId: "twitch", eventId: "raid" },
        { eventSourceId: "twitch", eventId: "host" },
        { eventSourceId: "twitch", eventId: "viewer-arrived" },
        { eventSourceId: "twitch", eventId: "chat-message" },
        { eventSourceId: "twitch", eventId: "whisper" },
        { eventSourceId: "streamloots", eventId: "purchase" },
        { eventSourceId: "streamloots", eventId: "redemption" },
        { eventSourceId: "twitcherbot", eventId: "view-time-update" }
    ],
    comparisonTypes: ["include", "doesn't include"],
    valueType: "preset",
    presetValues: viewerRolesService => {
        return viewerRolesService
            .getCustomRoles()
            .concat(viewerRolesService.getTwitchRoles())
            .concat(viewerRolesService.getTeamRoles())
            .map(r => ({value: r.id, display: r.name}));

    },
    valueIsStillValid: (filterSettings, viewerRolesService) => {
        let allRoles = viewerRolesService
            .getCustomRoles()
            .concat(viewerRolesService.getTeamRoles())
            .concat(viewerRolesService.getTwitchRoles());

        let role = allRoles.find(r => r.id === filterSettings.value);

        return role != null && role.name != null;
    },
    getSelectedValueDisplay: (filterSettings, viewerRolesService) => {
        let allRoles = viewerRolesService.getCustomRoles()
            .concat(viewerRolesService.getTeamRoles())
            .concat(viewerRolesService.getTwitchRoles());

        let role = allRoles.find(r => r.id === filterSettings.value);

        if (role) {
            return role.name;
        }

        return filterSettings.value;
    },
    predicate: async (filterSettings, eventData) => {

        let { comparisonType, value } = filterSettings;
        let { eventMeta } = eventData;

        let username = eventMeta.username;
        if (username == null || username === "") {
            return false;
        }

        /** @type{string[]} */
        let twitchUserRoles = eventMeta.twitchUserRoles;
        if (twitchUserRoles == null) {
            twitchUserRoles = await twitchUsers.getUsersChatRoles(username);
        }

        const userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username) || [];
        const userTeamRoles = await teamRolesManager.getAllTeamRolesForViewer(username) || [];
        const userTwitchRoles = (twitchUserRoles || [])
            .map(twitchRolesManager.mapTwitchRole);

        const allRoles = [
            ...userTwitchRoles,
            ...userTeamRoles,
            ...userCustomRoles
        ].filter(r => r != null);

        const hasRole = allRoles.some(r => r.id === value);

        switch (comparisonType) {
        case "include":
            return hasRole;
        case "doesn't include":
            return !hasRole;
        default:
            return false;
        }
    }
};