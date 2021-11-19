"use strict";

const fs = require("fs-extra");
const logger = require("../../logwrapper");

function doesTextExistInFile(filepath, text) {
    let contents = fs.readFileSync(filepath, "utf8");
    return contents.includes(text);
}

function removeLines(filepath, lines = []) {
    let contents = fs.readFileSync(filepath, "utf8");

    return contents
        .split('\n')
        .filter(l => l != null && l.trim() !== "")
        .filter((_, index) => !lines.includes(index))
        .join('\n') + "\n";
}

function removeLinesWithText(filepath, text) {
    let contents = fs.readFileSync(filepath, "utf8");
    return contents
        .split('\n')
        .filter(l => l != null && l.trim() !== "")
        .filter(l => l !== text)
        .join('\n') + "\n";
}

function replaceLines(filepath, lineNumbers = [], replacement) {
    let contents = fs.readFileSync(filepath, "utf8");

    return contents
        .split('\n')
        .filter(l => l != null && l.trim() !== "")
        .map((l, index) => {
            return lineNumbers.includes(index) ? replacement : l;
        })
        .join('\n') + "\n";
}

function replaceLinesWithText(filepath, text, replacement) {
    let contents = fs.readFileSync(filepath, "utf8");
    return contents
        .split('\n')
        .filter(l => l != null && l.trim() !== "")
        .map(l => {
            return l === text ? replacement : l;
        })
        .join('\n') + "\n";
}

exports.run = async effect => {
    if (effect == null || effect.filepath == null)
        return;

    let text = effect.text || "";
    text = text.replace(/\\n/g, "\n").trim();

    try {
        if (effect.writeMode === "append") {
            if (effect.dontRepeat) {
                if (!doesTextExistInFile(effect.filepath, text)) {
                    fs.appendFileSync(effect.filepath, text + "\n", "utf8");
                }
            } else {
                fs.appendFileSync(effect.filepath, text + "\n", "utf8");
            }
        } else if (effect.writeMode === "delete") {

            if (effect.deleteLineMode === 'lines' || effect.deleteLineMode == null) {

                let lines = effect.lineNumbers
                    .split(",")
                    .map(l => l.trim())
                    .filter(l => !isNaN(l))
                    .map(l => parseInt(l, 10) - 1);

                fs.writeFileSync(effect.filepath, removeLines(effect.filepath, lines), 'utf8');

            } else if (effect.deleteLineMode === 'text') {
                fs.writeFileSync(effect.filepath, removeLinesWithText(effect.filepath, effect.text, effect.replacementText), 'utf8');
            }

        } else if (effect.writeMode === "replace-line") {

            if (effect.replaceLineMode === 'lineNumbers' || effect.replaceLineMode == null) {

                let lines = effect.lineNumbers
                    .split(",")
                    .map(l => l.trim())
                    .filter(l => !isNaN(l))
                    .map(l => parseInt(l, 10) - 1);

                fs.writeFileSync(effect.filepath, replaceLines(effect.filepath, lines, effect.replacementText), 'utf8');

            } else if (effect.replaceLineMode === 'text') {
                fs.writeFileSync(effect.filepath, replaceLinesWithText(effect.filepath, effect.text, effect.replacementText), 'utf8');
            }

        } else if (effect.writeMode === "delete-all") {
            fs.writeFileSync(effect.filepath, "", "utf8");
        } else {
            fs.writeFileSync(effect.filepath, text, "utf8");
        }
    } catch (err) {
        logger.warn("Failed to write to file", err);
    }

    return true;
};
