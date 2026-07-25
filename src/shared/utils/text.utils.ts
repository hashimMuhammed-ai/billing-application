/**
 * Normalizes multiline text input into an array of non-empty lines,
 * removing optional leading slash command if present.
 */
export function extractDataLines(rawText: string, commandHeader?: string): string[] {
    if (!rawText) return [];
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (commandHeader && lines.length > 0 && lines[0].toLowerCase().startsWith(commandHeader.toLowerCase())) {
        lines.shift();
    }

    return lines;
}