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
        handle: "cheerBitsAmount",
        description: "The amount of bits in the cheer.",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        let bits = trigger.metadata.eventData.bits || 0;
        return bits;
    }
};

module.exports = model;
