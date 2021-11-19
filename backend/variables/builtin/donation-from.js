// Migration: done

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = [
    "streamlabs:donation",
    "streamlabs:eldonation",
    "tipeeestream:donation",
    "streamelements:donation"
];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "donationFrom",
        description: "The name of who sent a StreamLabs/Tipeee/StreamElements/ExtraLife donation",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const from = (trigger.metadata.eventData && trigger.metadata.eventData.from) || "Unknown User";

        return from;
    }
};

module.exports = model;
