"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:cheer"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "cheerTotalBits",
        description: "The total amount of bits cheered by a viewer in the channel.",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        let totalBits = trigger.metadata.eventData.totalBits || 0;
        return totalBits;
    }
};

module.exports = model;
