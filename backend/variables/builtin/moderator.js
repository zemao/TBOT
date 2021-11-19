// Migration: todo - Need twitch event

"use strict";
const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.EVENT] = ["mixer:messages-purged", "mixer:user-banned"];

const model = {
    definition: {
        handle: "moderator",
        description: "The name of the moderator that initated a moderation action (timeout/ban)",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let modEventData = trigger.metadata.eventData.data;
        if (modEventData.moderator) {
            return modEventData.moderator.user_name;
        }
        return "UnknownModerator";
    }
};

module.exports = model;
