"use strict";

const logger = require("../../logwrapper");

const { IncompatibilityError } = require("./import-helpers").errors;

const uuid = require("uuid/v1");

//v4 effect types are keys, supported v5 types are values
const v4EffectTypeMap = {
    "API Button": "twitcherbot:api",
    "Celebration": "twitcherbot:celebration",
    "Change Group": null, // v5 is fundamentally different here, cant import
    "Change Scene": null, // v5 is fundamentally different here, cant import
    "Chat": "twitcherbot:chat",
    "Cooldown": null, // vastly different than v5 equivalent, extremely difficult to import correctly
    "Custom Script": "twitcherbot:customscript",
    "Run Command": null, // was only available to custom scripts in v4, dont think it will even show up
    "Delay": "twitcherbot:delay",
    "Dice": "twitcherbot:dice",
    "Game Control": "twitcherbot:controlemulation",
    "HTML": "twitcherbot:html",
    "Show Event": null, // going to deprecate the v5 equivalent so not going to bother importing
    "Play Sound": "twitcherbot:playsound",
    "Random Effect": "twitcherbot:randomeffect",
    "Effect Group": "twitcherbot:run-effect-list",
    "Show Image": "twitcherbot:showImage",
    "Create Clip": "twitcherbot:clip",
    "Show Video": "twitcherbot:playvideo",
    "Clear Effects": null,
    "Write Text To File": "twitcherbot:filewriter",
    "Group List": null,
    "Scene List": null,
    "Command List": null, // v5 equivalent doesnt exist as theres a sys cmd for this now
    "Change User Scene": null,
    "Change Group Scene": null,
    "Update Button": null, // vastly different than v5 equivalent, extremely difficult to import correctly
    "Toggle Connection": "twitcherbot:toggleconnection",
    "Show Text": "twitcherbot:showtext"
};

const v4IncompatibilityReasonMap = {
    "Change Group": "V5 handles groups/scenes fundamentally different",
    "Change Scene": "V5 handles groups/scenes fundamentally different",
    "Cooldown": "V5 handles control cooldowns fundamentally different",
    "Run Command": "Impossible to import effect",
    "Show Event": "Effect is no longer supported",
    "Clear Effects": "Effect is fundementally different in V5",
    "Group List": "V5 handles groups/scenes fundamentally different",
    "Scene List": "V5 handles groups/scenes fundamentally different",
    "Command List": "Effect doesn't exist in V5 as this functionality now exists as a System Command",
    "Change User Scene": "V5 handles groups/scenes fundamentally different",
    "Change Group Scene": "V5 handles groups/scenes fundamentally different",
    "Update Button": "V5 handles control updates fundamentally different"
};

function updateReplaceVariables(effect) {
    if (effect == null) return effect;

    let keys = Object.keys(effect);

    for (let key of keys) {
        let value = effect[key];

        if (value && typeof value === "string") {
            effect[key] = value.replace(/\$\(user\)/, "$user");
        } else if (value && typeof value === "object") {
            effect[key] = updateReplaceVariables(value);
        }
    }

    return effect;
}

function mapV4Effect (v4Effect, triggerData, incompatibilityWarnings) {
    if (v4Effect == null || v4Effect.type == null) {
        throw new IncompatibilityError("v4 effect isn't formatted properly.");
    }
    const v5EffectTypeId = v4EffectTypeMap[v4Effect.type];

    // Null signifies we dont support this v4 effect
    if (v5EffectTypeId == null) {
        let reason = v4IncompatibilityReasonMap[v4Effect.type] || "Unknown effect";
        throw new IncompatibilityError(reason);
    }

    let v5Effect = v4Effect;
    v5Effect.type = v5EffectTypeId;
    v5Effect.id = uuid();

    //do any per effect type tweaks here
    if (v5Effect.type === "twitcherbot:playsound") {
        v5Effect.filepath = v5Effect.file;
    }

    if (v5Effect.type === "twitcherbot:randomeffect" || v5Effect.type === "twitcherbot:run-effect-list") {

        let mapResult = exports.mapV4EffectList(v5Effect.effectList, triggerData);

        mapResult.incompatibilityWarnings.forEach(iw => incompatibilityWarnings.push(iw));

        v5Effect.effectList = mapResult.effects;
    }

    v5Effect = updateReplaceVariables(v5Effect);

    return v5Effect;
}

exports.mapV4EffectList = (v4EffectList, triggerData) => {
    let incompatibilityWarnings = [];

    if (v4EffectList == null) return { effects: null, incompatibilityWarnings: incompatibilityWarnings};

    // v4 effect lists can be objects or arrays
    let v4Effects = Array.isArray(v4EffectList) ? v4EffectList : Object.values(v4EffectList);

    let v5EffectObj = {
        id: uuid(),
        list: []
    };

    for (let v4Effect of v4Effects) {
        if (v4Effect == null || v4Effect.type == null) continue;
        try {
            let mappedV5Effect = mapV4Effect(v4Effect, triggerData, incompatibilityWarnings);
            if (mappedV5Effect) {
                v5EffectObj.list.push(mappedV5Effect);
            }
        } catch (error) {
            let reason;
            if (error instanceof IncompatibilityError) {
                reason = error.reason;
            } else {
                logger.warn("Error during v4 effect import", error);
                reason = "An unexpected error occurred";
            }
            let message = `Could not import V4 Effect '${v4Effect.type}' in ${triggerData.type} '${triggerData.name}' because: ${reason}`;
            incompatibilityWarnings.push(message);
        }
    }

    return {
        effects: v5EffectObj,
        incompatibilityWarnings: incompatibilityWarnings
    };
};