/**
 * Void Ray - Save Manager (ES6 Module)
 * Features: Base64 Encoding, Import/Export, Version Control
 */

export const SaveManager = {
    SAVE_KEY: 'void_ray_save_v1',
    AUTO_SAVE_INTERVAL: 30000, // 30 Seconds
    CURRENT_VERSION: 1.1,

    saveIntervalId: null,

    init: function () {
        console.log("SaveManager initializing...");
        this.load();

        if (this.saveIntervalId) clearInterval(this.saveIntervalId);
        this.saveIntervalId = setInterval(() => this.save(true), this.AUTO_SAVE_INTERVAL);

        window.addEventListener('beforeunload', () => this.save(true));

        window.exportSave = this.exportSave.bind(this);
        window.importSave = this.importSave.bind(this);
    },

    hasSave: function () {
        return !!localStorage.getItem(this.SAVE_KEY);
    },

    getSaveInfo: function () {
        const encoded = localStorage.getItem(this.SAVE_KEY);
        if (!encoded) return null;

        try {
            let json;
            if (encoded.trim().startsWith('{')) {
                json = encoded;
            } else {
                json = decodeURIComponent(atob(encoded).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            }

            const data = JSON.parse(json);

            // Calculate game time
            const gameTime = data.meta?.gameTime || 0;
            const hours = Math.floor(gameTime / 3600000);
            const minutes = Math.floor((gameTime % 3600000) / 60000);

            // Last save time
            const saveDate = data.meta?.timestamp ? new Date(data.meta.timestamp) : null;
            const timeSinceSave = saveDate ? Math.floor((Date.now() - saveDate.getTime()) / 60000) : 0; // in minutes

            const t = window.t || ((key) => key.split('.').pop());
            return {
                level: data.player?.level || 1,
                xp: data.player?.xp || 0,
                health: data.player?.health || 100,
                energy: data.player?.energy || 100,
                location: {
                    x: Math.round(data.player?.x || 0),
                    y: Math.round(data.player?.y || 0)
                },
                inventoryCount: data.inventory?.length || 0,
                storageCount: data.storage?.length || 0,
                hasEcho: data.echo?.active || false,
                echoInventory: data.echo?.lootBag?.length || 0,
                achievements: data.achievements?.length || 0,
                gameTime: {
                    hours,
                    minutes,
                    formatted: `${hours}${t('time.hours')} ${minutes}${t('time.minutes')}`
                },
                lastSave: {
                    date: saveDate,
                    minutesAgo: timeSinceSave,
                    formatted: timeSinceSave < 60
                        ? `${timeSinceSave} ${t('time.minutesAgo')}`
                        : timeSinceSave < 1440
                            ? `${Math.floor(timeSinceSave / 60)} ${t('time.hoursAgo')}`
                            : `${Math.floor(timeSinceSave / 1440)} ${t('time.daysAgo')}`
                },
                version: data.meta?.version || '1.0'
            };
        } catch (e) {
            console.error("Could not read save info:", e);
            return null;
        }
    },

    save: function (silent = false) {
        if (!player) return;

        const saveData = {
            meta: {
                timestamp: Date.now(),
                version: this.CURRENT_VERSION,
                gameTime: (Date.now() - (window.gameStartTime || Date.now()))
            },
            player: {
                level: player.level,
                xp: player.xp,
                health: player.health,
                energy: player.energy,
                x: Math.round(player.x),
                y: Math.round(player.y)
            },
            globalData: playerData,
            inventory: collectedItems,
            storage: centralStorage,
            echo: echoRay ? {
                active: true,
                lootBag: echoRay.lootBag,
                mode: echoRay.mode,
                x: Math.round(echoRay.x),
                y: Math.round(echoRay.y)
            } : { active: false },

            // SAVE ACHIEVEMENTS
            achievements: (typeof AchievementManager !== 'undefined') ? AchievementManager.getUnlockedIds() : [],

            // TUTORIAL SAVE (NEW)
            tutorial: (typeof TutorialManager !== 'undefined') ? TutorialManager.getExportData() : []
        };

        try {
            const json = JSON.stringify(saveData);

            const encoded = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));

            localStorage.setItem(this.SAVE_KEY, encoded);

            const t = window.t || ((key) => key.split('.').pop());
            if (!silent) showNotification({ name: t('saveNotif.progressSaved'), type: { color: '#10b981' } }, "");
            else console.log(`[AutoSave] Data size: ${(encoded.length / 1024).toFixed(2)} KB`);

        } catch (e) {
            console.error("Save failed:", e);
            const t = window.t || ((key) => key.split('.').pop());
            if (e.name === 'QuotaExceededError') {
                showNotification({ name: t('saveNotif.saveError'), type: { color: '#ef4444' } }, t('saveNotif.diskFull'));
            }
        }
    },

    load: function () {
        const encoded = localStorage.getItem(this.SAVE_KEY);
        if (!encoded) return false;

        try {
            let json;
            if (encoded.trim().startsWith('{')) {
                json = encoded;
            } else {
                json = decodeURIComponent(atob(encoded).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            }

            const data = JSON.parse(json);

            // Player
            if (data.player) {
                player.level = data.player.level || 1;
                player.xp = data.player.xp || 0;

                player.maxXp = GAME_CONFIG.PLAYER.BASE_XP;
                for (let i = 1; i < player.level; i++) {
                    player.maxXp = GameRules.calculateNextLevelXp(player.maxXp);
                    player.maxHealth += 20;
                }

                player.health = data.player.health ?? player.maxHealth;
                player.energy = data.player.energy ?? player.maxEnergy;

                if (data.player.x && data.player.y) {
                    player.x = data.player.x;
                    player.y = data.player.y;

                    if (player.tail) player.tail.forEach(t => { t.x = player.x; t.y = player.y; });
                    if (window.cameraFocus) {
                        window.cameraFocus.x = player.x;
                        window.cameraFocus.y = player.y;
                    }
                }
            }

            if (data.globalData) Object.assign(playerData, data.globalData);

            if (data.inventory) { collectedItems.length = 0; data.inventory.forEach(i => collectedItems.push(i)); }
            if (data.storage) { centralStorage.length = 0; data.storage.forEach(i => centralStorage.push(i)); }

            if (data.echo && data.echo.active) {
                let sx = data.echo.x ?? player.x;
                let sy = data.echo.y ?? player.y + 100;

                if (!echoRay) spawnEcho(sx, sy);
                else { echoRay.x = sx; echoRay.y = sy; }

                if (echoRay) {
                    echoRay.lootBag = data.echo.lootBag || [];
                    echoRay.mode = (data.echo.mode === 'return' || data.echo.mode === 'deposit_storage') ? 'roam' : data.echo.mode;
                }
            } else if (player.level >= 3 && !echoRay) {
                // If level is high enough but no echo in save (or inactive), give a new one
                spawnEcho(player.x, player.y + 150);
            }

            // LOAD ACHIEVEMENTS
            if (data.achievements && typeof AchievementManager !== 'undefined') {
                AchievementManager.loadUnlockedIds(data.achievements);
            }

            // LOAD TUTORIAL (NEW)
            if (data.tutorial && typeof TutorialManager !== 'undefined') {
                TutorialManager.loadProgress(data.tutorial);
            }

            player.updateUI();
            updateInventoryCount();
            if (typeof updateEchoDropdownUI === 'function') updateEchoDropdownUI();

            const t = window.t || ((key) => key.split('.').pop());
            console.log(t('saveNotif.saveLoaded'));
            return true;

        } catch (e) {
            const t = window.t || ((key) => key.split('.').pop());
            console.error(t('saveNotif.saveCorruptError'), e);
            showNotification({ name: t('saveNotif.saveCorrupt'), type: { color: '#ef4444' } }, t('saveNotif.dataNotRecovered'));
            return false;
        }
    },

    resetSave: function () {
        localStorage.removeItem(this.SAVE_KEY);
        // localStorage.removeItem('void_ray_tutorial'); // Delete if old exists
        if (typeof TutorialManager !== 'undefined') TutorialManager.reset();
        const t = window.t || ((key) => key.split('.').pop());
        console.log(t('saveNotif.saveDeleted'));
    },

    exportSave: function () {
        this.save(true);
        const data = localStorage.getItem(this.SAVE_KEY);
        const t = window.t || ((key) => key.split('.').pop());
        if (!data) return t('saveNotif.saveNotFound');

        navigator.clipboard.writeText(data).then(() => {
            showNotification({ name: t('saveNotif.saveCopied'), type: { color: '#38bdf8' } }, t('saveNotif.copyToClipboard'));
        }).catch(err => {
            console.log(t('saveNotif.saveCode'), data);
            showNotification({ name: t('saveNotif.checkConsole'), type: { color: '#fbbf24' } }, t('saveNotif.copyFromConsole'));
        });
        return t('saveNotif.saveCodeCopied');
    },

    importSave: function (encodedString) {
        if (!encodedString) return "Please provide save code as parameter: importSave('code')";

        try {
            const testJson = decodeURIComponent(atob(encodedString).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            JSON.parse(testJson);

            const t = window.t || ((key) => key.split('.').pop());
            localStorage.setItem(this.SAVE_KEY, encodedString);
            showNotification({ name: t('saveNotif.saveImported'), type: { color: '#10b981' } }, t('saveNotif.pageRefreshing'));
            setTimeout(() => location.reload(), 1500);
            return "Success.";
        } catch (e) {
            return "ERROR: Invalid save code.";
        }
    }
};

window.SaveManager = SaveManager;