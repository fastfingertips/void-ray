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

// renderAchievementsList function is now defined as 'renderAchievements' in profile.js.
// In case it is called directly in old code:
function renderAchievementsList() {
    console.warn("renderAchievementsList deprecated. Use renderAchievements in profile.js");
    if (typeof renderAchievements === 'function') {
        renderAchievements();
    }
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.openAchievements = openAchievements;
    window.closeAchievements = closeAchievements;
    window.renderAchievementsList = renderAchievementsList;
}