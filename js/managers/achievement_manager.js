/**
 * Void Ray - Achievement Manager (ES6 Module)
 * Tracks player stats and rewards achievements.
 */

export const AchievementManager = {
    achievements: [
        {
            id: 'first_steps',
            title: 'FIRST STEPS',
            desc: 'Collect your first resource.',
            target: 1,
            getValue: () => playerData.stats.totalResources,
            unlocked: false
        },
        {
            id: 'traveler',
            title: 'TRAVELER',
            desc: 'Travel 1000 km.',
            target: 100000, // 1 unit = 0.01 meters (game scale)
            getValue: () => playerData.stats.distance,
            format: (v) => Math.floor(v / 100) + ' km', // Display format
            unlocked: false
        },
        {
            id: 'rich',
            title: 'CRYSTAL HUNTER',
            desc: 'Earn 500 total crystals.',
            target: 500,
            getValue: () => playerData.stats.totalStardust,
            unlocked: false
        },
        {
            id: 'speeder',
            title: 'LIGHT SPEED',
            desc: 'Reach 150 km/s speed.',
            target: 15, // Physical speed (Shown x10 in HUD)
            getValue: () => playerData.stats.maxSpeed,
            format: (v) => Math.floor(v * 10) + ' km/s',
            unlocked: false
        },
        {
            id: 'hoarder',
            title: 'STORAGE CLERK',
            desc: 'Store 50 items in central storage.',
            target: 50,
            getValue: () => centralStorage.length,
            unlocked: false
        },
        {
            id: 'level_5',
            title: 'EVOLUTION',
            desc: 'Reach Level 5.',
            target: 5,
            getValue: () => player.level,
            unlocked: false
        },
        {
            id: 'echo_master',
            title: 'SWARM LEADER',
            desc: 'Complete all Echo drone upgrades.',
            target: 20, // 4 stats * 5 levels = 20 total levels
            getValue: () => {
                if (!playerData || !playerData.upgrades) return 0;
                return Object.keys(playerData.upgrades)
                    .filter(k => k.startsWith('echo'))
                    .reduce((sum, k) => sum + playerData.upgrades[k], 0);
            },
            unlocked: false
        }
    ],

    init: function () {
        console.log("AchievementManager initializing...");
        setInterval(() => this.check(), 5000);
    },

    check: function () {
        if (!playerData.stats) return;

        this.achievements.forEach(ach => {
            if (!ach.unlocked) {
                const currentVal = ach.getValue();
                if (currentVal >= ach.target) {
                    this.unlock(ach);
                }
            }
        });
    },

    unlock: function (ach) {
        ach.unlocked = true;
        if (typeof showAchievementPopup === 'function') {
            showAchievementPopup(ach);
        } else {
            console.warn("showAchievementPopup function not found (is notifications.js loaded?)");
        }

        if (typeof audio !== 'undefined' && audio) audio.playChime({ id: 'legendary' });
        if (typeof SaveManager !== 'undefined') SaveManager.save(true);
    },

    getUnlockedIds: function () {
        return this.achievements.filter(a => a.unlocked).map(a => a.id);
    },

    loadUnlockedIds: function (ids) {
        if (!Array.isArray(ids)) return;
        this.achievements.forEach(ach => {
            if (ids.includes(ach.id)) {
                ach.unlocked = true;
            }
        });
    }
};

window.AchievementManager = AchievementManager;