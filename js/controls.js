/**
 * Void Ray - Control System (ES6 Module)
 * Handles keyboard, mouse and UI button inputs.
 */

// Key states
export const keys = { w: false, a: false, s: false, d: false, " ": false, f: false, q: false, e: false, m: false, h: false, c: false, p: false, j: false, Escape: false };

// Mouse position
export const mouse = { x: 0, y: 0 };

export function initControls() {
    console.log("Controls initializing...");

    // --- MOUSE MOVEMENT TRACKING ---
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    // --- KEYBOARD INPUTS ---
    window.addEventListener('keydown', e => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput && document.activeElement === chatInput) {
            if (e.key === "Escape") chatInput.blur();
            return;
        }

        if (e.code === "Space") e.preventDefault();

        if (e.key === "Escape") keys.Escape = true;
        else if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
        else if (e.code === "Space") keys[" "] = true;
        else if (keys.hasOwnProperty(e.code)) keys[e.code] = true;

        // --- LIGHT JUMP (J KEY) ---
        // UPDATE: Toggle mechanic. If charging cancel, else start.
        if (e.key.toLowerCase() === 'j') {
            if (typeof player !== 'undefined') {
                if (player.isChargingJump) {
                    player.cancelLightJump("Manual Cancel");
                } else {
                    player.attemptLightJump();
                }
            }
            keys.j = false; // Single trigger
        }

        // --- CAMERA SWITCH (C KEY) ---
        if (e.key.toLowerCase() === 'c') {
            const t = window.t || ((key) => key.split('.').pop()); // i18n helper

            if (typeof echoRay !== 'undefined' && echoRay && !echoRay.attached) {
                // Utils update:
                const dist = Utils.distEntity(player, echoRay);
                const maxRange = player.radarRadius;

                if (dist > maxRange) {
                    showNotification({ name: t('echoNotif.connectionError'), type: { color: '#ef4444' } }, t('echoNotif.outOfRadar'));
                    Utils.playSound('playError'); // Safe Sound
                    return;
                }

                const indicator = document.getElementById('echo-vision-indicator');

                if (window.cameraTarget === player) {
                    window.cameraTarget = echoRay;
                    showNotification({ name: t('echoNotif.visionEcho'), type: { color: '#67e8f9' } }, t('echoNotif.cameraTransferred'));
                    if (indicator) indicator.classList.add('active');
                } else {
                    window.cameraTarget = player;
                    showNotification({ name: t('echoNotif.visionShip'), type: { color: '#38bdf8' } }, t('echoNotif.cameraTransferred'));
                    if (indicator) indicator.classList.remove('active');
                }
            } else if (echoRay && echoRay.attached) {
                showNotification({ name: t('echoNotif.echoAttached'), type: { color: '#ef4444' } }, t('echoNotif.detachRequired'));
                if (window.cameraTarget !== player) {
                    window.cameraTarget = player;
                    const indicator = document.getElementById('echo-vision-indicator');
                    if (indicator) indicator.classList.remove('active');
                }
            } else {
                showNotification({ name: t('echoNotif.noEcho'), type: { color: '#ef4444' } }, t('echoNotif.cannotSwitch'));
                window.cameraTarget = player;
                const indicator = document.getElementById('echo-vision-indicator');
                if (indicator) indicator.classList.remove('active');
            }
            keys.c = false;
        }

        // --- PROFILE (P KEY) ---
        if (e.key.toLowerCase() === 'p') {
            if (typeof toggleProfile === 'function') {
                toggleProfile();
            }
            keys.p = false;
        }

        if (e.key.toLowerCase() === 'h') {
            if (typeof toggleHUD === 'function') {
                toggleHUD();
            }
            keys.h = false;
        }

        if (e.key.toLowerCase() === 'q') {
            const t = window.t || ((key) => key.split('.').pop());
            if (!autopilot) {
                autopilot = true;
                aiMode = 'gather';
                addChatMessage(t('aiMessages.gatherProtocol'), "info", "general");
            } else if (aiMode === 'gather' || aiMode === 'travel' || aiMode === 'deposit') {
                aiMode = 'base';
                addChatMessage(t('aiMessages.baseRoute'), "info", "general");
            } else {
                autopilot = false;
                manualTarget = null;
                addChatMessage(t('aiMessages.disengaged'), "system", "general");
            }
            updateAIButton();
            keys.q = false;
        }

        if (e.key.toLowerCase() === 'm') {
            const chatInp = document.getElementById('chat-input');
            if (chatInp && document.activeElement === chatInp) return;

            if (typeof toggleMap === 'function') {
                toggleMap();
            }
            keys.m = false;
        }

        if (e.key.toLowerCase() === 'i') {
            inventoryOpen = !inventoryOpen;
            const invOverlay = document.getElementById('inventory-overlay');
            if (invOverlay) invOverlay.classList.toggle('open');
            if (inventoryOpen) renderInventory();
            // Hud butonunu güncelle
            if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-inv-icon', inventoryOpen);
        }
    });

    window.addEventListener('keyup', e => {
        if (e.key === "Escape") keys.Escape = false;
        else if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
        else if (e.code === "Space") keys[" "] = false;
        else if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
    });

    // --- MOUSE WHEEL ---
    window.addEventListener('wheel', e => {
        if (e.target.closest('.chat-content') ||
            e.target.closest('.profile-content') ||
            e.target.closest('.nexus-content') ||
            e.target.closest('.inv-content') ||
            e.target.closest('.stats-wireframe-content') ||
            e.target.closest('.overflow-y-auto') ||
            e.target.closest('#settings-panel')) {
            return;
        }

        if (window.cinematicMode) return;
        if (typeof mapOpen !== 'undefined' && mapOpen) return;

        e.preventDefault();
        targetZoom += e.deltaY * -MAP_CONFIG.zoom.speed;
        targetZoom = Math.min(Math.max(MAP_CONFIG.zoom.min, targetZoom), MAP_CONFIG.zoom.max);
    }, { passive: false });

    // --- CANVAS CLICKS ---
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.addEventListener('mousedown', (e) => {
            if (!echoRay) return;
            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const focusPoint = window.cameraFocus || window.cameraTarget;
            const screenX = (echoRay.x - focusPoint.x) * currentZoom + width / 2;
            const screenY = (echoRay.y - focusPoint.y) * currentZoom + height / 2;

            const dist = Utils.dist(mx, my, screenX, screenY);
            if (dist < 40 * currentZoom) {
                echoRay.energyDisplayTimer = 240;
            }
        });
    }

    // --- UI BUTTONS AND INITIALIZERS ---
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) mainMenu.classList.add('menu-hidden');

            const controlsWrapper = document.getElementById('menu-controls-wrapper');
            if (controlsWrapper) {
                controlsWrapper.classList.remove('menu-controls-visible');
                controlsWrapper.classList.add('menu-controls-hidden');
            }

            if (typeof init === 'function') init();
            if (audio) audio.init();
            startLoop();
        });
    }

    // INVENTORY BUTTON (TOGGLE)
    const btnInv = document.getElementById('btn-inv-icon');
    if (btnInv) {
        btnInv.addEventListener('click', () => {
            if (typeof toggleInventory === 'function') {
                toggleInventory();
            }
        });
    }

    // AUTO-PILOT BUTTON
    const btnAi = document.getElementById('btn-ai-toggle');
    if (btnAi) {
        btnAi.addEventListener('click', () => {
            autopilot = !autopilot;
            if (!autopilot) {
                manualTarget = null;
                aiMode = 'gather';
            } else {
                aiMode = 'gather';
            }
            updateAIButton();
        });
    }

    // STATS BUTTON (TOGGLE)
    const btnStats = document.getElementById('btn-stats-icon');
    if (btnStats) {
        btnStats.addEventListener('click', () => {
            if (typeof toggleStats === 'function') {
                toggleStats();
            }
        });
    }

    // PROFILE BUTTON (UPDATED: made more robust using addEventListener)
    const btnProfile = document.getElementById('btn-profile-icon');
    if (btnProfile) {
        // Clear old onclick (To prevent conflict)
        btnProfile.onclick = null;

        btnProfile.addEventListener('click', function (e) {
            e.preventDefault();
            if (typeof window.toggleProfile === 'function') {
                window.toggleProfile();
            } else if (typeof window.openProfile === 'function') {
                // Fallback (Manual control if no toggle)
                if (typeof profileOpen !== 'undefined' && profileOpen) {
                    window.closeProfile();
                } else {
                    window.openProfile();
                }
            } else {
                console.error("Profile functions not found! check profile.js");
            }
        });
    }

    // --- CLOSE BUTTON LISTENERS (Replacing HTML onclick) ---

    // Map close button
    const btnCloseMap = document.getElementById('btn-close-map');
    if (btnCloseMap) {
        btnCloseMap.addEventListener('click', () => {
            if (typeof closeMap === 'function') closeMap();
        });
    }

    // Context close button
    const btnCloseContext = document.getElementById('btn-close-context');
    if (btnCloseContext) {
        btnCloseContext.addEventListener('click', () => {
            if (typeof closeContext === 'function') closeContext();
        });
    }

    // Achievements close button
    const btnCloseAchievements = document.getElementById('btn-close-achievements');
    if (btnCloseAchievements) {
        btnCloseAchievements.addEventListener('click', () => {
            if (typeof closeAchievements === 'function') closeAchievements();
        });
    }

    // Storage close button
    const btnCloseStorage = document.getElementById('btn-close-storage');
    if (btnCloseStorage) {
        btnCloseStorage.addEventListener('click', () => {
            if (typeof closeStorage === 'function') closeStorage();
        });
    }

    // Inventory close button (already has id="btn-close-inv")
    const btnCloseInv = document.getElementById('btn-close-inv');
    if (btnCloseInv) {
        btnCloseInv.addEventListener('click', () => {
            if (typeof closeInventory === 'function') closeInventory();
        });
    }

    // Echo Inventory close button
    const btnCloseEchoInv = document.getElementById('btn-close-echo-inv');
    if (btnCloseEchoInv) {
        btnCloseEchoInv.addEventListener('click', () => {
            if (typeof closeEchoInventory === 'function') closeEchoInventory();
        });
    }

    // Nexus close button
    const btnCloseNexus = document.getElementById('btn-close-nexus');
    if (btnCloseNexus) {
        btnCloseNexus.addEventListener('click', () => {
            if (typeof exitNexus === 'function') exitNexus();
        });
    }

    // --- NEXUS TAB LISTENERS ---
    const nexusTabMarket = document.getElementById('nexus-tab-market');
    if (nexusTabMarket) {
        nexusTabMarket.addEventListener('click', () => {
            if (typeof switchNexusTab === 'function') switchNexusTab('market');
        });
    }

    const nexusTabUpgrades = document.getElementById('nexus-tab-upgrades');
    if (nexusTabUpgrades) {
        nexusTabUpgrades.addEventListener('click', () => {
            if (typeof switchNexusTab === 'function') switchNexusTab('upgrades');
        });
    }

    // --- ACTION BUTTON LISTENERS ---
    const btnSellAll = document.getElementById('btn-sell-all');
    if (btnSellAll) {
        btnSellAll.addEventListener('click', () => {
            if (typeof sellAll === 'function') sellAll();
        });
    }

    // --- MAP BUTTON LISTENERS ---
    const btnMapTrack = document.getElementById('btn-map-track');
    if (btnMapTrack) {
        btnMapTrack.addEventListener('click', () => {
            if (typeof toggleMapTracking === 'function') toggleMapTracking();
        });
    }

    const btnMapTargets = document.getElementById('btn-map-targets');
    if (btnMapTargets) {
        btnMapTargets.addEventListener('click', () => {
            if (typeof toggleMapTargets === 'function') toggleMapTargets();
        });
    }

    const btnMapCenter = document.getElementById('btn-map-center');
    if (btnMapCenter) {
        btnMapCenter.addEventListener('click', () => {
            if (typeof centerMapOnPlayer === 'function') centerMapOnPlayer();
        });
    }

    // --- STORAGE ACTION BUTTON LISTENERS ---
    const btnDepositAll = document.getElementById('btn-deposit-all');
    if (btnDepositAll) {
        btnDepositAll.addEventListener('click', () => {
            if (typeof depositAllToStorage === 'function') depositAllToStorage();
        });
    }

    const btnWithdrawAll = document.getElementById('btn-withdraw-all');
    if (btnWithdrawAll) {
        btnWithdrawAll.addEventListener('click', () => {
            if (typeof withdrawAllFromStorage === 'function') withdrawAllFromStorage();
        });
    }

    // --- ECHO TRANSFER BUTTON LISTENERS ---
    const btnTransferToEcho = document.getElementById('btn-transfer-to-echo');
    if (btnTransferToEcho) {
        btnTransferToEcho.addEventListener('click', () => {
            if (typeof transferAllToEcho === 'function') transferAllToEcho();
        });
    }

    const btnTransferToPlayer = document.getElementById('btn-transfer-to-player');
    if (btnTransferToPlayer) {
        btnTransferToPlayer.addEventListener('click', () => {
            if (typeof transferAllToPlayer === 'function') transferAllToPlayer();
        });
    }

    // --- PROFILE BUTTON LISTENERS ---
    const btnCloseProfile = document.getElementById('btn-close-profile');
    if (btnCloseProfile) {
        btnCloseProfile.addEventListener('click', () => {
            if (typeof closeProfile === 'function') closeProfile();
        });
    }

    // Profile Nexus Buttons (multiple)
    const statPlusBtns = document.querySelectorAll('.stat-plus');
    statPlusBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (typeof enterNexus === 'function') enterNexus();
        });
    });

    // Profile Tabs
    const tabSummary = document.getElementById('p-tab-btn-summary');
    if (tabSummary) {
        tabSummary.addEventListener('click', () => {
            if (typeof switchProfileTab === 'function') switchProfileTab('summary');
        });
    }

    const tabAchievements = document.getElementById('p-tab-btn-achievements');
    if (tabAchievements) {
        tabAchievements.addEventListener('click', () => {
            if (typeof switchProfileTab === 'function') switchProfileTab('achievements');
        });
    }

    // --- EQUIPMENT BUTTON LISTENERS ---
    const btnCloseEquipment = document.getElementById('btn-close-equipment');
    if (btnCloseEquipment) {
        btnCloseEquipment.addEventListener('click', () => {
            if (typeof closeEquipment === 'function') closeEquipment();
        });
    }

    // --- CONTROLS BUTTON LISTENERS ---
    const btnCloseControls = document.getElementById('btn-close-controls');
    if (btnCloseControls) {
        btnCloseControls.addEventListener('click', () => {
            if (typeof closeControls === 'function') closeControls();
        });
    }

    // --- CHAT TAB LISTENERS ---
    const tabGeneral = document.getElementById('tab-general');
    if (tabGeneral) {
        tabGeneral.addEventListener('click', () => {
            if (typeof switchChatTab === 'function') switchChatTab('general');
        });
    }

    const tabGroup = document.getElementById('tab-group');
    if (tabGroup) {
        tabGroup.addEventListener('click', () => {
            if (typeof switchChatTab === 'function') switchChatTab('group');
        });
    }

    const tabInfo = document.getElementById('tab-info');
    if (tabInfo) {
        tabInfo.addEventListener('click', () => {
            if (typeof switchChatTab === 'function') switchChatTab('info');
        });
    }

    // --- SETTINGS BUTTON LISTENERS ---
    const btnCloseSettings = document.getElementById('btn-close-settings');
    if (btnCloseSettings) {
        btnCloseSettings.addEventListener('click', () => {
            if (typeof closeSettings === 'function') closeSettings();
        });
    }

    // Settings Tabs
    const tabSettingsGame = document.getElementById('tab-btn-game');
    if (tabSettingsGame) {
        tabSettingsGame.addEventListener('click', () => {
            if (typeof switchSettingsTab === 'function') switchSettingsTab('game');
        });
    }

    const tabSettingsView = document.getElementById('tab-btn-view');
    if (tabSettingsView) {
        tabSettingsView.addEventListener('click', () => {
            if (typeof switchSettingsTab === 'function') switchSettingsTab('view');
        });
    }

    const tabSettingsAudio = document.getElementById('tab-btn-audio');
    if (tabSettingsAudio) {
        tabSettingsAudio.addEventListener('click', () => {
            if (typeof switchSettingsTab === 'function') switchSettingsTab('audio');
        });
    }

    const tabSettingsSave = document.getElementById('tab-btn-save');
    if (tabSettingsSave) {
        tabSettingsSave.addEventListener('click', () => {
            if (typeof switchSettingsTab === 'function') switchSettingsTab('save');
        });
    }

    const tabSettingsDev = document.getElementById('tab-btn-dev');
    if (tabSettingsDev) {
        tabSettingsDev.addEventListener('click', () => {
            if (typeof switchSettingsTab === 'function') switchSettingsTab('dev');
        });
    }

    // Settings Actions
    const btnActionExport = document.getElementById('btn-action-export');
    if (btnActionExport) {
        btnActionExport.addEventListener('click', () => {
            if (typeof actionExportSave === 'function') actionExportSave();
        });
    }

    const btnActionImport = document.getElementById('btn-action-import');
    if (btnActionImport) {
        btnActionImport.addEventListener('click', () => {
            if (typeof actionImportSave === 'function') actionImportSave();
        });
    }

    const btnActionReset = document.getElementById('btn-action-reset');
    if (btnActionReset) {
        btnActionReset.addEventListener('click', () => {
            if (typeof actionResetSave === 'function') actionResetSave();
        });
    }

    const btnDevAddResources = document.getElementById('btn-dev-add-resources');
    if (btnDevAddResources) {
        btnDevAddResources.addEventListener('click', () => {
            if (typeof devAddResources === 'function') devAddResources();
        });
    }

    const btnDevLevelUp = document.getElementById('btn-dev-levelup');
    if (btnDevLevelUp) {
        btnDevLevelUp.addEventListener('click', () => {
            if (typeof devLevelUp === 'function') devLevelUp();
        });
    }

    // --- HUD BUTTON LISTENERS ---
    const btnEquipIcon = document.getElementById('btn-equip-icon');
    if (btnEquipIcon) {
        btnEquipIcon.addEventListener('click', () => {
            if (typeof toggleEquipment === 'function') toggleEquipment();
        });
    }

    const btnChatMode = document.getElementById('btn-chat-mode');
    if (btnChatMode) {
        btnChatMode.addEventListener('click', () => {
            if (typeof cycleChatMode === 'function') cycleChatMode();
        });
    }

    const btnContextIcon = document.getElementById('btn-context-icon');
    if (btnContextIcon) {
        btnContextIcon.addEventListener('click', () => {
            if (typeof toggleContext === 'function') toggleContext();
        });
    }

    const btnControlsIcon = document.getElementById('btn-controls-icon');
    if (btnControlsIcon) {
        btnControlsIcon.addEventListener('click', () => {
            if (typeof toggleControls === 'function') toggleControls();
        });
    }

    const aiModeBtn = document.getElementById('ai-mode-btn');
    if (aiModeBtn) {
        aiModeBtn.addEventListener('click', () => {
            if (typeof cycleAIMode === 'function') cycleAIMode();
        });
    }

    // --- ECHO MENU LISTENERS ---
    const menuRoam = document.getElementById('menu-roam');
    if (menuRoam) {
        menuRoam.addEventListener('click', () => {
            if (typeof setEchoMode === 'function') setEchoMode('roam');
        });
    }

    const menuReturn = document.getElementById('menu-return');
    if (menuReturn) {
        menuReturn.addEventListener('click', () => {
            if (typeof setEchoMode === 'function') setEchoMode('return');
        });
    }

    const menuMerge = document.getElementById('menu-merge');
    if (menuMerge) {
        menuMerge.addEventListener('click', () => {
            if (typeof echoManualMerge === 'function') echoManualMerge();
        });
    }

    const menuEchoInv = document.getElementById('menu-echo-inv');
    if (menuEchoInv) {
        menuEchoInv.addEventListener('click', () => {
            if (typeof openEchoInventory === 'function') openEchoInventory();
        });
    }

    // --- MENU BUTTON LISTENERS ---
    const btnCloseMobileWarning = document.getElementById('btn-close-mobile-warning');
    if (btnCloseMobileWarning) {
        btnCloseMobileWarning.addEventListener('click', () => {
            if (typeof closeMobileWarning === 'function') closeMobileWarning();
        });
    }

    const btnResumeGame = document.getElementById('btn-resume-game');
    if (btnResumeGame) {
        btnResumeGame.addEventListener('click', () => {
            if (typeof resumeGame === 'function') resumeGame();
        });
    }

    const btnQuitGame = document.getElementById('btn-quit-game');
    if (btnQuitGame) {
        btnQuitGame.addEventListener('click', () => {
            if (typeof quitToMain === 'function') quitToMain();
        });
    }

    // --- NEXUS DELEGATION ---
    const marketGrid = document.getElementById('market-grid');
    if (marketGrid) {
        marketGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.sell-btn');
            if (btn) {
                const name = btn.getAttribute('data-name');
                const value = parseInt(btn.getAttribute('data-value'));
                const count = parseInt(btn.getAttribute('data-count'));
                if (typeof sellItem === 'function') sellItem(name, value, count);
            }
        });
    }

    const handleUpgradeClick = (e) => {
        const btn = e.target.closest('button[data-upgrade-key]');
        if (btn && !btn.disabled) {
            const key = btn.getAttribute('data-upgrade-key');
            if (typeof buyUpgrade === 'function') buyUpgrade(key);
        }
    };

    const upgPlayerList = document.getElementById('upg-player-list');
    if (upgPlayerList) upgPlayerList.addEventListener('click', handleUpgradeClick);

    const upgEchoList = document.getElementById('upg-echo-list');
    if (upgEchoList) upgEchoList.addEventListener('click', handleUpgradeClick);
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.keys = keys;
    window.mouse = mouse;
    window.initControls = initControls;
}