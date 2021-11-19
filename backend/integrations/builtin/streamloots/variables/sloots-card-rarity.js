"use strict";

const { EffectTrigger } = require("../../../../effects/models/effectModels");
const { OutputDataType } = require("../../../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.EVENT] = ["streamloots:redemption"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "slootsCardRarity",
        description: "The rarity of a StreamLoots Card.",
        triggers: triggers,
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        let rarity = trigger.metadata.eventData && trigger.metadata.eventData.rarity;

        return rarity || "";
    }
};

module.exports = model;
