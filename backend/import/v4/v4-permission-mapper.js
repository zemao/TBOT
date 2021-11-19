"use strict";

const uuid = require("uuid/v1");

function mapV4RolesToMixerRoles(permissions) {
    if (permissions == null || !Array.isArray(permissions) || permissions.length === 0) return [];
    return permissions
        .map((p) => {
            switch (p) {
            case "Staff":
                return "Staff";
            case "Pro":
                return "Pro";
            case "Moderators":
                return "Mod";
            case "Subscribers":
                return "Subscriber";
            case "Channel Editors":
                return "ChannelEditor";
            case "Streamer":
                return "Owner";
            default:
                return null;
            }
        })
        .filter(r => r != null);
}

exports.mapV4Permissions = (permissionType, permissions) => {
    let restrictionData = {
        restrictions: [],
        mode: "all"
    };

    if (permissionType === "Group") {
        permissions = mapV4RolesToMixerRoles(permissions);
        let restriction = {
            id: uuid(),
            type: "twitcherbot:permissions",
            mode: "roles",
            roleIds: permissions || []
        };

        restrictionData.restrictions.push(restriction);
    } else if (permissionType === "Individual") {
        let restriction = {
            id: uuid(),
            type: "twitcherbot:permissions",
            mode: "viewer",
            username: typeof permissions === "string" ? permissions : ""
        };

        restrictionData.restrictions.push(restriction);
    }

    return restrictionData;
};