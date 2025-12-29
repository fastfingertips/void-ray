/**
 * Void Ray - Notification System (ES6 Module)
 * In-game notifications, visual effects and achievement popups.
 */

/**
 * Text Notifications - Sends info messages to chat panel
 */
import { t } from './i18n.js';
export function showNotification(planet, suffix) {
    let msg = "";
    let type = "loot";
    const name = planet.name || "";

    // 1. DISCOVERY (Lost Cargo)
    if (planet.type && planet.type.id === 'lost') {
        msg = `${t('notifications.discovery')}${name}${t('notifications.found')}`;
        type = "info";
    }
    // 2. COLLECTED ITEMS (Loot)
    else if (planet.type && (planet.type.id === 'common' || planet.type.id === 'rare' || planet.type.id === 'epic' || planet.type.id === 'legendary')) {
        msg = `${t('notifications.collected')}${name} ${suffix}`;
        type = "loot";
    }
    // 3. WARNINGS (Based on Color: Red #ef4444 or Orange #fbbf24)
    else if (planet.type && (planet.type.color === '#ef4444' || planet.type.color === '#fbbf24')) {
        // Exclude specific Echo warnings that act as info
        if (name.includes("ECHO") && !name.includes("ERROR") && !name.includes("FULL")) {
            msg = `${t('notifications.system')}${name} ${suffix}`;
            type = "info";
        } else {
            msg = `${t('notifications.warning')}${name} ${suffix}`;
            type = "alert";
        }
    }
    // 4. WORMHOLE (Based on Wormhole Color)
    else if (planet.type && (planet.type.color === '#8b5cf6')) {
        msg = `${t('notifications.spacetime')}${name} ${suffix}`;
        type = "info";
    }
    // 5. SYSTEM / GENERAL INFO
    else {
        // Default to System prefix for standard notifications
        // Check if name is not empty
        if (name) {
            msg = `${name} ${suffix}`; // Removed 'System:' prefix to avoid redundancy with colored chat
        }
        type = "info";
    }

    // Send to Chat System
    if (typeof addChatMessage === 'function' && msg) {
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
            <div class="ach-title">${t('notifications.achievementUnlocked')}</div>
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