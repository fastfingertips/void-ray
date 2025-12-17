/**
 * Void Ray - Window: Achievements (ES6 Module)
 * Deprecated: Redirects to Profile window.
 */

export function openAchievements() {
    if (typeof openProfile === 'function') {
        openProfile('achievements');
    }
}

function closeAchievements() {
    if (typeof closeProfile === 'function') {
        closeProfile();
    }
}

// renderAchievementsList fonksiyonu artık profile.js içinde 'renderAchievements' olarak tanımlı.
// Eski kodda doğrudan çağrılma ihtimaline karşı:
function renderAchievementsList() {
    console.warn("renderAchievementsList deprecated. Use renderAchievements in profile.js");
    if (typeof renderAchievements === 'function') {
        renderAchievements();
    }
}