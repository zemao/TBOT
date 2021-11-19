// Migration: done

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["twitcherbot:custom-variable-set"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "createdCustomVariableData",
        description: "Data from the created custom variable.",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.createdCustomVariableData || "";
    }
};

module.exports = model;
