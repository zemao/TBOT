"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:channel-reward-redemption"];
triggers[EffectTrigger.CHANNEL_REWARD] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "rewardMessage",
        description: "The reward message text",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return (trigger.metadata.eventData ?
            trigger.metadata.eventData.messageText :
            trigger.metadata.messageText) || "";
    }
};

module.exports = model;
