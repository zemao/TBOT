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
        handle: "donationAmount",
        description: "The amount of a donation from StreamLabs/Tipeee/StreamElements/ExtraLife",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        const dononationAmount = (trigger.metadata.eventData && trigger.metadata.eventData.dononationAmount) || 0;

        return dononationAmount;
    }
};

module.exports = model;
