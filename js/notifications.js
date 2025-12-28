/**
 * Void Ray - Notification System (ES6 Module)
 * In-game notifications, visual effects and achievement popups.
 */

/**
 * Text Notifications - Sends info messages to chat panel
 */
export function showNotification(planet, suffix) {
    let msg = "";
    let type = "loot";
    const name = planet.name || "";

    // Category Analysis
    if (name === "ROUTE CREATED" || name.includes("AUTO")) {
        msg = `System: ${name}`;
        type = "info";
    } else if (name.includes("EVOLVED")) {
        msg = `System: ${name}`;
        type = "info";
    } else if (name.includes("ECHO SPAWNED") || name.includes("ECHO DETACHED") || name.includes("ECHO: CHARGE") || name.includes("STORAGE") || name.includes("VISION:")) {
        msg = `System: ${name}`;
        type = "info";
    } else if (name.includes("ENERGY") || name.includes("TARDIGRADE")) {
        msg = `${name} ${suffix}`;
        type = "info";
    } else if (name.includes("POISON") || name.includes("DANGER") || name.includes("ECHO POISONED") || name.includes("FULL") || name.includes("INSUFFICIENT") || name.includes("CONNECTION") || name.includes("EMPTY") || name.includes("ACCESS") || name.includes("ERROR") || name.includes("SIGNAL LOSS")) {
        msg = `WARNING: ${name} ${suffix}`;
        type = "alert";
    } else if (name.includes("LOST CARGO")) {
        msg = `Discovery: ${name} found!`;
        type = "info";
    } else if (name.includes("WORMHOLE")) { // NEW
        msg = `SPACE-TIME: ${name} ${suffix}`;
        type = "info";
    } else if (planet.type && (planet.type.id === 'common' || planet.type.id === 'rare' || planet.type.id === 'epic' || planet.type.id === 'legendary')) {
        msg = `Collected: ${name} ${suffix}`;
        type = "loot";
    } else {
        msg = `${name} ${suffix}`;
        type = "info";
    }

    // Send to Chat System
    if (typeof addChatMessage === 'function') {
        addChatMessage(msg, type, 'info');
    }
}

/**
 * 2. VISUAL EFFECTS (HUD OVERLAYS)
 */

/**
 * Flashes the screen green (Poison damage).
 */
export function showToxicEffect() {
    const el = document.getElementById('toxic-overlay');
    if (el) {
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), 1500);
    }
}

/**
 * Flashes the screen red (Physical damage).
 */
export function showDamageEffect() {
    const dmgOverlay = document.getElementById('damage-overlay');
    if (dmgOverlay) {
        dmgOverlay.classList.add('active');
        setTimeout(() => dmgOverlay.classList.remove('active'), 200);
    }
}

/**
 * Glitches and shakes the screen. (Wormhole Transition)
 */
export function triggerWormholeEffect() {
    const el = document.getElementById('glitch-overlay');
    if (el) {
        el.classList.add('active');
        // Effect duration (same as teleport animation)
        setTimeout(() => el.classList.remove('active'), 800);
    }
}

/**
 * 3. ACHIEVEMENT POPUP
 * Shows achievement notification sliding in from right.
 * @param {Object} ach - Achievement object {title, desc}
 */
export function showAchievementPopup(ach) {
    const container = document.getElementById('ui-core');
    if (!container) return;

    const popup = document.createElement('div');
    // CSS classes defined in css/hud.css file.
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <div class="ach-icon">★</div>
        <div class="ach-content">
            <div class="ach-title">ACHIEVEMENT UNLOCKED</div>
            <div class="ach-name">${ach.title}</div>
            <div class="ach-desc">${ach.desc}</div>
        </div>
    `;

    container.appendChild(popup);

    // Wait one frame to trigger animation
    requestAnimationFrame(() => {
        popup.classList.add('visible');
    });

    setTimeout(() => {
        popup.classList.remove('visible');
        setTimeout(() => popup.remove(), 600);
    }, 3000);
}

// Global exports
window.showNotification = showNotification;
window.showToxicEffect = showToxicEffect;
window.showDamageEffect = showDamageEffect;
window.showAchievementPopup = showAchievementPopup;
window.triggerWormholeEffect = triggerWormholeEffect;