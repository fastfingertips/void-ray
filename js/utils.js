/**
 * Void Ray - Utility Functions (ES6 Module)
 * Contains commonly used functions for mathematical operations,
 * random number generation, color processing, and safe audio playback.
 */

// --- MATH & DISTANCE ---

/**
 * Calculates the distance between two points (x1, y1) and (x2, y2).
 * Wrapper for Math.hypot.
 */
export const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

/**
 * Calculates the distance between two entities.
 * Entities must have {x, y} properties.
 */
export const distEntity = (e1, e2) => Math.hypot(e1.x - e2.x, e1.y - e2.y);

// --- RANDOMNESS ---

/**
 * Returns a random float in the range [min, max).
 * If only one parameter is given, returns [0, min).
 */
export const random = (min, max) => {
    if (max === undefined) {
        return Math.random() * min;
    }
    return Math.random() * (max - min) + min;
};

/**
 * Returns a random integer in the range [min, max].
 */
export const randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Selects a random element from an array.
 */
export const randomChoice = (array) => {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
};

// --- COLOR OPERATIONS ---

/**
 * Converts a hex color code (e.g., #ffffff) to RGBA format.
 * Used for dynamically updating CSS variables.
 * @param {string} hex - Color in #RRGGBB format
 * @param {number} alpha - Opacity between 0.0 and 1.0
 */
export const hexToRgba = (hex, alpha) => {
    let r = 0, g = 0, b = 0;
    // 3-digit hex (#RGB)
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    }
    // 6-digit hex (#RRGGBB)
    else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    return "rgba(" + +r + "," + +g + "," + +b + "," + alpha + ")";
};

/**
 * Converts a hex color code to an HSL object.
 * Used for the ship's dynamic color.
 * @param {string} hex - Color in #RRGGBB format
 * @returns {Object} { h, s, l }
 */
export const hexToHSL = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    r /= 255; g /= 255; b /= 255;

    let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
    let h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
};

// --- SAFE AUDIO MANAGEMENT ---

/**
 * Safely plays audio by checking the existence of the global 'audio' object.
 * @param {string} methodName - Method name in audio.js (e.g., 'playToxic', 'playChime')
 * @param {...any} args - Parameters to pass to the method
 */
export const playSound = (methodName, ...args) => {
    if (typeof audio !== 'undefined' && audio && typeof audio[methodName] === 'function') {
        try {
            audio[methodName](...args);
        } catch (e) {
            console.warn(`Audio error (${methodName}):`, e);
        }
    }
};

// --- DEFAULT EXPORT ---
const Utils = {
    dist,
    distEntity,
    random,
    randomInt,
    randomChoice,
    hexToRgba,
    hexToHSL,
    playSound
};

// Export for ES6 modules
export default Utils;

// Export for non-module scripts (global access)
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}