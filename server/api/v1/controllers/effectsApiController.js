"use strict";
const { EffectTrigger } = require("../../../../backend/effects/models/effectModels");
const effectsManager = require("../../../../backend/effects/effectManager");
const effectRunner = require("../../../../backend/common/effect-runner");
const presetEffectListManager = require("../../../../backend/effects/preset-lists/preset-effect-list-manager");

exports.getEffects = function(req, res) {
    let effectDefs = effectsManager.getEffectDefinitions();

    if (req.query.trigger) {
        effectDefs = effectDefs.filter(e => e.triggers == null || e.triggers[req.query.trigger]);
    }

    res.json(effectDefs);
};

exports.getEffect = function(req, res) {
    const effectId = req.params.effectId;
    const effect = effectsManager.getEffectById(effectId);
    if (effect == null) {
        res.status(404).send({
            status: "error",
            message: `Cannot find effect '${effectId}'`
        });
        return;
    }

    res.json(effect.definition);
};

exports.runEffects = async function(req, res) {
    if (req.body.effects != null) {

        const triggerData = req.body && req.body.triggerData || {};
        if (triggerData.username == null) {
            triggerData.username = "API Call";
        }

        const processEffectsRequest = {
            trigger: {
                type: EffectTrigger.API,
                metadata: triggerData
            },
            effects: req.body.effects
        };

        try {
            await effectRunner.processEffects(processEffectsRequest);
            res.status(200).send({ status: "success" });
        } catch (err) {
            res.status(500).send({ status: "error", message: err.message });
        }
    } else {
        res.status(400).send({ status: "error", message: "No effects provided." });
    }
};

exports.runPresetList = async function(req, res) {
    const presetListId = req.params.presetListId;

    if (presetListId == null) {
        return res.status(400).send({
            status: "error",
            message: `No presetListId provided`
        });
    }

    const presetList = presetEffectListManager.getPresetEffectList(presetListId);
    if (presetList == null) {
        return res.status(404).send({
            status: "error",
            message: `Cannot find preset effect list '${presetList}'`
        });
    }

    const body = req.body || {};
    const { args, username } = body;

    const processEffectsRequest = {
        trigger: {
            type: EffectTrigger.PRESET_LIST,
            metadata: {
                username,
                presetListArgs: args
            }
        },
        effects: presetList.effects
    };

    try {
        await effectRunner.processEffects(processEffectsRequest);
        res.status(200).send({ status: "success" });
    } catch (err) {
        res.status(500).send({ status: "error", message: err.message });
    }
};
