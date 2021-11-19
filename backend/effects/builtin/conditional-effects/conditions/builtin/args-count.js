"use strict";

const {
    EffectTrigger
} = require("../../../../../effects/models/effectModels");

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

module.exports = {
    id: "twitcherbot:command-args-count",
    name: "Command Args Count",
    description: "Condition based on number of command args",
    triggers: triggers,
    comparisonTypes: ["is", "is not", "is less than", "is greater than"],
    leftSideValueType: "none",
    rightSideValueType: "number",
    predicate: (conditionSettings, trigger) => {

        let { comparisonType, rightSideValue } = conditionSettings;

        let args = trigger.metadata.userCommand.args || [];

        let argsCount = args.length;

        switch (comparisonType) {
        case "is":
            return argsCount === rightSideValue;
        case "is not":
            return argsCount !== rightSideValue;
        case "is less than":
            return argsCount < rightSideValue;
        case "is greater than":
            return argsCount > rightSideValue;
        default:
            return false;
        }
    }
};