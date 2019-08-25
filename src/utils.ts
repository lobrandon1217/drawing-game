const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const ALL = LETTERS + LETTERS.toUpperCase() + "0123456789";
const COLOR_LETTERS = "0123456789ABCDEF";

/**
 * Generates a random room name.
 * @returns a 6 digit string for use in room naming.
 */
export function genRoomName(): string {
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += ALL.charAt(Math.floor(Math.random() * ALL.length));
    }
    return result;
}

/**
 * Generate a random color
 * @returns a string formatted like #HEXHEX
 */
export function genColor(): string {
    let result = "#";
    for (let i = 0; i < 6; i++) {
        result += COLOR_LETTERS.charAt(Math.floor(Math.random() * COLOR_LETTERS.length));
    }
    return result;
}