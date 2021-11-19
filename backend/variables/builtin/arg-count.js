// Migration: info needed

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "argCount",
        description: "Returns the number of command args.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.NUMBER],
        categories: [VariableCategory.NUMBERS]
    },
    evaluator: (trigger) => {
        return trigger.metadata.userCommand ? trigger.metadata.userCommand.args.length : 0;
    }
};

module.exports = model;
