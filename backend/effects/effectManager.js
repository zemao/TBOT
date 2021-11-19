"use strict";

const { ipcMain } = require("electron");
const logger = require("../logwrapper");
let EventEmitter = require("events");
const { EffectTrigger } = require("./models/effectModels");
const frontendCommunicator = require("../common/frontend-communicator");
const cloudSync = require("../cloud-sync/cloud-sync");

class EffectManager extends EventEmitter {
    constructor() {
        super();
        this._registeredEffects = [];
    }

    registerEffect(effect) {
        // do some validation on the incoming effect
        this._registeredEffects.push(effect);

        logger.debug(`Registered Effect ${effect.definition.id}`);

        this.emit("effectRegistered", effect);
    }

    getEffectDefinitions() {
        return this._registeredEffects.map(e => e.definition);
    }

    getEffectById(id) {
        return this._registeredEffects.find(e => e.definition.id === id);
    }

    getEffectOverlayExtensions() {
        return this._registeredEffects
            .filter(e => {
                return e.overlayExtension != null &&
                    e.overlayExtension.event != null &&
                    e.overlayExtension.event.onOverlayEvent != null &&
                    e.overlayExtension.event.name != null &&
                    e.overlayExtension.event.name !== "";
            })
            .map(e => {
                return {
                    id: e.definition.id,
                    dependencies: e.overlayExtension.dependencies,
                    event: e.overlayExtension.event
                };
            });
    }

    mapEffectForFrontEnd(e) {
        if (!e) return {};
        return {
            definition: e.definition,
            optionsTemplate: e.optionsTemplate,
            optionsTemplateUrl: e.optionsTemplateUrl,
            optionsControllerRaw: e.optionsController
                ? e.optionsController.toString()
                : "() => {}",
            optionsValidatorRaw: e.optionsValidator
                ? e.optionsValidator.toString()
                : "() => {return [];}"
        };
    }

    effectSupportsInputType(effectId, inputEvent) {
        const effect = this.getEffectById(effectId);

        if (effect == null) return false;

        const effectTriggerData = effect.definition.triggers[EffectTrigger.INTERACTIVE];

        return effectTriggerData.events && effectTriggerData.events.includes(inputEvent);
    }

    clearFilePaths(effects) {
        if (effects == null) return effects;

        let keys = Object.keys(effects);

        for (let key of keys) {
            let value = effects[key];

            if (key != null && key.toLowerCase() === "filepath" || key.toLowerCase() === "file") {
                effects[key] = undefined;
            } else if (value && typeof value === "object") {
                effects[key] = this.clearFilePaths(value);
            }
        }

        return effects;
    }
}

const manager = new EffectManager();


frontendCommunicator.onAsync("getEffectsShareCode", async (effectList) => {
    logger.debug("got get effects share code request");

    effectList = manager.clearFilePaths(effectList);

    //return share code
    return await cloudSync.sync({ effects: effectList });
});

frontendCommunicator.onAsync("getAllEffectDefinitions", async () => {
    logger.debug("got get all effects request");
    let mapped = manager._registeredEffects.map(manager.mapEffectForFrontEnd);
    return mapped;
});

frontendCommunicator.onAsync("getEffectDefinitions", async (triggerData) => {
    logger.debug("got get effects def request");
    let effects = manager._registeredEffects;

    const triggerType = triggerData.triggerType,
        triggerMeta = triggerData.triggerMeta;

    let filteredEffectDefs = effects
        .map(e => e.definition)
        .filter(e => {
            if (triggerType != null) {
                if (e.triggers == null) return true;
                let supported = e.triggers[triggerType] != null && e.triggers[triggerType] !== false;
                if (!supported) return false;

                if (triggerMeta) {
                    const effectTriggerData = e.triggers[triggerType];

                    switch (triggerType) {
                    case EffectTrigger.INTERACTIVE:
                        return effectTriggerData.controls.includes(triggerMeta.triggerId);
                    case EffectTrigger.EVENT:
                        if (effectTriggerData === true) {
                            return true;
                        }
                        if (Array.isArray(effectTriggerData)) {
                            return effectTriggerData.includes(triggerMeta.triggerId);
                        }
                        return true;
                    default:
                        return true;
                    }
                } else {
                    return true;
                }
            }
            return true;
        });

    return filteredEffectDefs;
});

ipcMain.on("getEffectDefinition", (event, effectId) => {
    logger.debug("got effect request", effectId);
    event.returnValue = manager.mapEffectForFrontEnd(
        manager.getEffectById(effectId)
    );
});

module.exports = manager;
