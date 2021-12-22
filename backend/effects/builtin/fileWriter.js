"use strict";
const fileWriterProcessor = require("../../common/handlers/fileWriterProcessor");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

/**
 * The File Writer effect
 */
const fileWriter = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "twitcherbot:filewriter",
        name: "Write To File",
        description: "Write or delete some text in a file.",
        icon: "fa fa-file-o",
        categories: [EffectCategory.ADVANCED],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
        <eos-container header="File">
            <file-chooser model="effect.filepath" options="{ filters: [ {name:'Text',extensions:['txt']} ]}"></file-chooser>
        </eos-container>

        <eos-container header="Write Mode" pad-top="true">
            <div class="controls-fb" style="padding-bottom: 5px;">
                <label class="control-fb control--radio">Replace   <tooltip text="'Replaces existing text with new text in the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="replace"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Append <tooltip text="'Appends a new line with the given text to the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="append"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Delete Line(s) <tooltip text="'Deletes a specific line(s) in the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="delete"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Replace Line(s) <tooltip text="'Replace a specific line in the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="replace-line"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Clear File <tooltip text="'Clears all text from the file.'"></tooltip>
                    <input type="radio" ng-model="effect.writeMode" value="delete-all"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Append Options" pad-top="true" ng-if="effect.writeMode === 'append'">
            <label class="control-fb control--checkbox"> Don't Repeat <tooltip text="'Do not append a new line if the given text already exists in the file.'"></tooltip>
                <input type="checkbox" ng-model="effect.dontRepeat">
                <div class="control__indicator"></div>
            </label>
        </eos-container>

        <eos-container header="Delete Line(s) Options" pad-top="true" ng-if="effect.writeMode === 'delete'">
            <div class="controls-fb" style="padding-bottom: 5px;">
                <label class="control-fb control--radio">Delete by line numbers(s) <tooltip text="'Deletes line(s) at the specificed number(s)'"></tooltip>
                    <input type="radio" ng-model="effect.deleteLineMode" value="lines"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Delete by text <tooltip text="'Deletes lines that equal the given text'"></tooltip>
                    <input type="radio" ng-model="effect.deleteLineMode" value="text"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Replace Line(s) Options" pad-top="true" ng-if="effect.writeMode === 'replace-line'">
            <div class="controls-fb" style="padding-bottom: 5px;">
                <label class="control-fb control--radio">Replace by line number(s) <tooltip text="'Replace line(s) at the specificed number(s)'"></tooltip>
                    <input type="radio" ng-model="effect.replaceLineMode" value="lineNumbers"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Replace by text <tooltip text="'Replace lines that equal the given text'"></tooltip>
                    <input type="radio" ng-model="effect.replaceLineMode" value="text"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Text" pad-top="true" ng-if="effect.writeMode === 'replace' || effect.writeMode === 'append' || (effect.writeMode === 'delete' && effect.deleteLineMode === 'text') || (effect.writeMode === 'replace-line' && effect.replaceLineMode === 'text')">
            <input ng-model="effect.text" type="text" class="form-control" id="chat-text-setting" placeholder="Enter text" replace-variables>
        </eos-container>

        <eos-container header="Line Number(s)" pad-top="true" ng-if="(effect.writeMode === 'delete' && effect.deleteLineMode === 'lines') || (effect.writeMode === 'replace-line' && effect.replaceLineMode === 'lineNumbers')">
            <p class="muted">Enter a line number or list of line numbers (separated by commas) to {{effect.writeMode === 'delete' ? 'delete' : 'replace'}}.</p>
            <input ng-model="effect.lineNumbers" type="text" class="form-control" id="chat-line-numbers-setting" placeholder="Enter line number(s)" replace-variables="number">
        </eos-container>

        <eos-container header="Replacement Text" pad-top="true" ng-if="effect.writeMode === 'replace-line'">
            <input ng-model="effect.replacementText" type="text" class="form-control" id="chat-text-setting" placeholder="Enter text" replace-variables>
        </eos-container>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope) => {
        if ($scope.effect.writeMode == null) {
            $scope.effect.writeMode = "replace";
        }

        if ($scope.effect.deleteLineMode == null) {
            $scope.effect.deleteLineMode = "lines";
        }

        if ($scope.effect.replaceLineMode == null) {
            $scope.effect.replaceLineMode = "lineNumbers";
        }
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.filepath == null || effect.filepath === "") {
            errors.push("Please select a text file to write to.");
        }
        if (effect.writeMode === 'delete' && (effect.deleteLineMode === 'lines' && (effect.lineNumbers == null || effect.lineNumbers === ""))) {
            errors.push("Please set the line number to be deleted.");
        }
        if (effect.writeMode === 'delete' && (effect.deleteLineMode === 'text' && (effect.text == null || effect.text === ""))) {
            errors.push("Please set the line text to be deleted.");
        }
        if (effect.writeMode === 'replace-line' && (effect.replaceLineMode === 'lines' && (effect.lineNumbers == null || effect.lineNumbers === ""))) {
            errors.push("Please set the line number to be replaced.");
        }
        if (effect.writeMode === 'replace-line' && (effect.replaceLineMode === 'text' && (effect.text == null || effect.text === ""))) {
            errors.push("Please set the line text to be replaced.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        await fileWriterProcessor.run(event.effect, event.trigger);
        return true;
    }
};

module.exports = fileWriter;
