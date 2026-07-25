"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDataLines = extractDataLines;
function extractDataLines(rawText, commandHeader) {
    if (!rawText)
        return [];
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    if (commandHeader && lines.length > 0 && lines[0].toLowerCase().startsWith(commandHeader.toLowerCase())) {
        lines.shift();
    }
    return lines;
}
//# sourceMappingURL=text.utils.js.map