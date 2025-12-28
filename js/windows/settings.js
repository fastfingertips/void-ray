/**
 * Void Ray - Window: Settings (ES6 Module)
 */

export let settingsOpen = false;

// Global Settings Object
if (!window.gameSettings) {
    window.gameSettings = typeof DEFAULT_GAME_SETTINGS !== 'undefined' ? Object.assign({}, DEFAULT_GAME_SETTINGS) : {};
}

// Complete missing settings
if (typeof window.gameSettings.windowOpacity === 'undefined') window.gameSettings.windowOpacity = 1.0;
if (typeof window.gameSettings.crtIntensity === 'undefined') window.gameSettings.crtIntensity = 50;
if (typeof window.gameSettings.themeColor === 'undefined') window.gameSettings.themeColor = '#94d8c3';
if (typeof window.gameSettings.themeHue === 'undefined') window.gameSettings.themeHue = 162;
if (typeof window.gameSettings.themeSat === 'undefined') window.gameSettings.themeSat = 47;
if (typeof window.gameSettings.showGrid === 'undefined') window.gameSettings.showGrid = false;
if (typeof window.gameSettings.starBrightness === 'undefined') window.gameSettings.starBrightness = 100;

// --- NEW: CAMERA TOOLTIP HELPER ---
// Called by HTML. Shows warning if adaptive mode is on, else shows normal description.
window.showCamTooltip = function (e, defaultText) {
    const t = window.t || ((key) => key.split('.').pop());
    if (window.gameSettings.adaptiveCamera) {
        // Special message informing user
        showInfoTooltip(e, t('tooltips.adaptiveCamWarning'));
    } else {
        showInfoTooltip(e, defaultText);
    }
};

function initSettings() {
    console.log("Settings panel initializing...");

    // --- APPLY START THEME ---
    const startColor = window.gameSettings.themeColor || '#94d8c3';
    setGameTheme(startColor, true);

    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
        const newBtn = btnSettings.cloneNode(true);
        btnSettings.parentNode.replaceChild(newBtn, btnSettings);
        newBtn.addEventListener('click', toggleSettings);
    }

    // --- ELEMENT REFERENCES ---
    const nexusToggle = document.getElementById('toggle-nexus-arrow');
    const repairToggle = document.getElementById('toggle-repair-arrow');
    const storageToggle = document.getElementById('toggle-storage-arrow');
    const echoToggle = document.getElementById('toggle-echo-arrow');
    const hudHoverToggle = document.getElementById('toggle-hud-hover');

    const shipBarsToggle = document.getElementById('toggle-ship-bars');
    const consoleToggle = document.getElementById('toggle-console');

    const adaptiveCamToggle = document.getElementById('toggle-adaptive-cam');
    const smoothCamToggle = document.getElementById('toggle-smooth-cam');

    const crtToggle = document.getElementById('toggle-crt');
    const crtIntensityWrapper = document.getElementById('crt-intensity-wrapper');
    const gridToggle = document.getElementById('toggle-grid');

    const devModeToggle = document.getElementById('toggle-dev-mode');
    const gravityToggle = document.getElementById('toggle-gravity-debug');
    const hitboxToggle = document.getElementById('toggle-hitboxes');
    const vectorToggle = document.getElementById('toggle-vectors');
    const targetVectorToggle = document.getElementById('toggle-target-vectors');
    const fpsToggle = document.getElementById('toggle-fps-counter');
    const godModeToggle = document.getElementById('toggle-god-mode');
    const hidePlayerToggle = document.getElementById('toggle-hide-player');

    // --- CAMERA CONTROLS STATE UPDATE ---
    const updateCamControlsState = () => {
        const manualCamControls = document.getElementById('manual-camera-controls');
        const camXInput = document.getElementById('cam-offset-x');
        const camYInput = document.getElementById('cam-offset-y');

        if (manualCamControls) {
            if (window.gameSettings.adaptiveCamera) {
                // Passive State
                manualCamControls.classList.add('disabled-area');
                manualCamControls.style.opacity = '0.5'; // Don't hide completely, just dim
                // IMPORTANT: We do NOT use pointer-events: none. Otherwise tooltip won't work.
                // We only disable inputs.

                if (camXInput) camXInput.disabled = true;
                if (camYInput) camYInput.disabled = true;
            } else {
                // Active State
                manualCamControls.classList.remove('disabled-area');
                manualCamControls.style.opacity = '1';

                if (camXInput) camXInput.disabled = false;
                if (camYInput) camYInput.disabled = false;
            }
        }
    };

    // Set initial state
    updateCamControlsState();

    // --- STRUCTURE FOR OPACITY CONTROL ---
    const hudSelectors = ['.hud-icon-group', '#xp-container', '#speedometer', '#minimap-wrapper', '#btn-settings', '#merge-prompt', '#echo-vision-indicator'];

    const windowDefinitions = [
        { id: '#chat-panel', targetClass: null },
        { id: '#settings-panel', targetClass: null },
        { id: '#inventory-overlay', targetClass: '.inv-window' },
        { id: '#stats-overlay', targetClass: '.stats-window' },
        { id: '#profile-overlay', targetClass: '.profile-window' },
        { id: '#context-overlay', targetClass: '.context-window' },
        { id: '#nexus-overlay', targetClass: '.nexus-window' },
        { id: '#storage-overlay', targetClass: '.nexus-window' },
        { id: '#echo-inventory-overlay', targetClass: '.nexus-window' },
        { id: '#achievements-overlay', targetClass: '.stats-window' }
    ];

    const hudElements = [];
    const windowTrackers = [];
    let windowObserver = null;

    const cacheElements = () => {
        hudElements.length = 0;
        windowTrackers.length = 0;

        hudSelectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) {
                hudElements.push(el);
                el.style.transition = 'opacity 0.3s ease';
            }
        });

        windowDefinitions.forEach(def => {
            const triggerEl = document.querySelector(def.id);
            if (triggerEl) {
                const targetEl = def.targetClass ? triggerEl.querySelector(def.targetClass) : triggerEl;
                if (targetEl) {
                    targetEl.style.transition = 'opacity 0.3s ease';
                    windowTrackers.push({ trigger: triggerEl, target: targetEl });
                }
            }
        });

        if (windowObserver) windowObserver.disconnect();

        windowObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const el = mutation.target;
                    const tracker = windowTrackers.find(t => t.trigger === el);
                    if (!tracker) return;

                    const isOpen = el.classList.contains('open') || el.classList.contains('active');
                    if (isOpen) {
                        tracker.target.style.opacity = window.gameSettings.windowOpacity;
                    } else {
                        tracker.target.style.opacity = '';
                    }
                }
            });
        });

        windowTrackers.forEach(t => {
            windowObserver.observe(t.trigger, { attributes: true, attributeFilter: ['class'] });
        });
    };

    cacheElements();

    const applyHoverLogic = (items, baseOpacity, isWindow = false) => {
        items.forEach(item => {
            const el = item.target || item;
            const trigger = item.trigger || item;

            if (isWindow) {
                const isOpen = trigger.classList.contains('open') || trigger.classList.contains('active');
                if (!isOpen) {
                    el.style.opacity = '';
                    return;
                }
            }

            if (window.gameSettings.hudHoverEffect && el.matches(':hover')) {
                el.style.opacity = '1';
            } else {
                el.style.opacity = baseOpacity;
            }

            el.onmouseenter = () => {
                if (window.gameSettings.hudHoverEffect) el.style.opacity = '1';
            };
            el.onmouseleave = () => {
                if (isWindow) {
                    const isOpen = trigger.classList.contains('open') || trigger.classList.contains('active');
                    if (isOpen) el.style.opacity = baseOpacity;
                } else {
                    el.style.opacity = baseOpacity;
                }
            };
        });
    };

    // --- THEME COLOR SELECTION ---
    const themeOpts = document.querySelectorAll('.theme-opt');
    themeOpts.forEach(opt => {
        opt.addEventListener('click', (e) => {
            const color = e.target.getAttribute('data-color');
            setGameTheme(color);
            const picker = document.getElementById('custom-theme-picker');
            if (picker) picker.value = color;
        });

        if (opt.getAttribute('data-color') === startColor) {
            opt.style.borderColor = '#fff';
            opt.style.transform = 'scale(1.2)';
            opt.style.boxShadow = `0 0 10px ${startColor}`;
        }
    });

    const customPicker = document.getElementById('custom-theme-picker');
    if (customPicker) {
        customPicker.value = startColor;
        customPicker.addEventListener('input', (e) => {
            setGameTheme(e.target.value);
            document.querySelectorAll('.theme-opt').forEach(el => {
                el.style.borderColor = 'rgba(255,255,255,0.2)';
                el.style.transform = 'scale(1)';
                el.style.boxShadow = 'none';
            });
        });
    }

    // --- TOGGLE LISTENERS ---
    if (nexusToggle) nexusToggle.addEventListener('change', (e) => window.gameSettings.showNexusArrow = e.target.checked);
    if (repairToggle) repairToggle.addEventListener('change', (e) => window.gameSettings.showRepairArrow = e.target.checked);
    if (storageToggle) storageToggle.addEventListener('change', (e) => window.gameSettings.showStorageArrow = e.target.checked);
    if (echoToggle) echoToggle.addEventListener('change', (e) => window.gameSettings.showEchoArrow = e.target.checked);

    if (hudHoverToggle) {
        hudHoverToggle.addEventListener('change', (e) => {
            window.gameSettings.hudHoverEffect = e.target.checked;
            cacheElements();
            applyHoverLogic(hudElements, window.gameSettings.hudOpacity);
            applyHoverLogic(windowTrackers, window.gameSettings.windowOpacity, true);
        });
    }

    if (shipBarsToggle) shipBarsToggle.addEventListener('change', (e) => window.gameSettings.showShipBars = e.target.checked);

    // --- CINEMATIC MODE TOGGLE ---
    const autoHideToggle = document.getElementById('toggle-auto-hide-hud');
    if (autoHideToggle) {
        autoHideToggle.addEventListener('change', (e) => {
            const t = window.t || ((key) => key.split('.').pop());
            window.gameSettings.autoHideHUD = e.target.checked;
            if (e.target.checked) {
                if (typeof initAutoHideHUD === 'function') initAutoHideHUD();
                showNotification({ name: t('notifications.cinematicOn'), type: { color: '#67e8f9' } }, t('notifications.cinematicOnDesc'));
            } else {
                if (typeof stopAutoHideHUD === 'function') stopAutoHideHUD();
                showNotification({ name: t('notifications.cinematicOff'), type: { color: '#fff' } }, "");
            }
        });
    }

    if (consoleToggle) {
        consoleToggle.addEventListener('change', (e) => {
            const t = window.t || ((key) => key.split('.').pop());
            window.gameSettings.enableConsole = e.target.checked;
            if (e.target.checked) showNotification({ name: t('notifications.consoleActive'), type: { color: '#fbbf24' } }, t('notifications.consoleActiveDesc'));
        });
    }

    const updateCRT = () => {
        const overlay = document.getElementById('crt-overlay');
        if (!overlay) return;

        if (window.gameSettings.enableCRT) {
            overlay.classList.add('active');
            overlay.style.opacity = window.gameSettings.crtIntensity / 100;
        } else {
            overlay.classList.remove('active');
            overlay.style.opacity = '';
        }
    };

    if (crtToggle) {
        crtToggle.addEventListener('change', (e) => {
            window.gameSettings.enableCRT = e.target.checked;
            if (crtIntensityWrapper) {
                crtIntensityWrapper.style.display = e.target.checked ? 'block' : 'none';
            }
            updateCRT();
        });
    }

    if (gridToggle) {
        gridToggle.addEventListener('change', (e) => {
            window.gameSettings.showGrid = e.target.checked;
        });
    }

    if (adaptiveCamToggle) {
        adaptiveCamToggle.addEventListener('change', (e) => {
            window.gameSettings.adaptiveCamera = e.target.checked;
            // Update UI status
            updateCamControlsState();
        });
    }

    if (smoothCamToggle) smoothCamToggle.addEventListener('change', (e) => window.gameSettings.smoothCameraTransitions = e.target.checked);

    if (devModeToggle) {
        devModeToggle.addEventListener('change', (e) => {
            const t = window.t || ((key) => key.split('.').pop());
            window.gameSettings.developerMode = e.target.checked;
            const devTabBtn = document.getElementById('tab-btn-dev');
            if (devTabBtn) {
                if (window.gameSettings.developerMode) {
                    devTabBtn.style.display = 'block';
                    showNotification({ name: t('notifications.devModeActive'), type: { color: '#ef4444' } }, "");
                } else {
                    devTabBtn.style.display = 'none';
                    if (devTabBtn.classList.contains('active')) {
                        switchSettingsTab('game');
                    }
                    window.gameSettings.showGravityFields = false;
                    window.gameSettings.showHitboxes = false;
                    window.gameSettings.showVectors = false;
                    window.gameSettings.showTargetVectors = false;
                    window.gameSettings.showFps = false;
                    window.gameSettings.godMode = false;
                    window.gameSettings.hidePlayer = false;

                    if (gravityToggle) gravityToggle.checked = false;
                    if (hitboxToggle) hitboxToggle.checked = false;
                    if (vectorToggle) vectorToggle.checked = false;
                    if (targetVectorToggle) targetVectorToggle.checked = false;
                    if (fpsToggle) fpsToggle.checked = false;
                    if (godModeToggle) godModeToggle.checked = false;
                    if (hidePlayerToggle) hidePlayerToggle.checked = false;

                    document.getElementById('debug-fps-panel').style.display = 'none';
                    showNotification({ name: t('notifications.devModeOff'), type: { color: '#fff' } }, "");
                }
            }
        });
    }

    if (gravityToggle) gravityToggle.addEventListener('change', (e) => window.gameSettings.showGravityFields = e.target.checked);
    if (hitboxToggle) hitboxToggle.addEventListener('change', (e) => window.gameSettings.showHitboxes = e.target.checked);
    if (vectorToggle) vectorToggle.addEventListener('change', (e) => window.gameSettings.showVectors = e.target.checked);
    if (targetVectorToggle) targetVectorToggle.addEventListener('change', (e) => window.gameSettings.showTargetVectors = e.target.checked);

    if (fpsToggle) {
        fpsToggle.addEventListener('change', (e) => {
            window.gameSettings.showFps = e.target.checked;
            document.getElementById('debug-fps-panel').style.display = e.target.checked ? 'block' : 'none';
        });
    }

    if (godModeToggle) {
        godModeToggle.addEventListener('change', (e) => {
            const t = window.t || ((key) => key.split('.').pop());
            window.gameSettings.godMode = e.target.checked;
            if (window.gameSettings.godMode) showNotification({ name: t('notifications.godModeOn'), type: { color: '#10b981' } }, "");
            else showNotification({ name: t('notifications.godModeOff'), type: { color: '#ef4444' } }, "");
        });
    }

    if (hidePlayerToggle) hidePlayerToggle.addEventListener('change', (e) => window.gameSettings.hidePlayer = e.target.checked);

    // --- SMART SLIDER MANAGEMENT ---
    const smartSliders = document.querySelectorAll('.smart-slider');

    smartSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const id = e.target.id;

            if (id === 'vol-hud-opacity') {
                const opacity = val / 100;
                window.gameSettings.hudOpacity = opacity;
                const disp = document.getElementById('val-hud-opacity');
                if (disp) disp.innerText = val + '%';

                cacheElements();
                applyHoverLogic(hudElements, opacity);
            }
            else if (id === 'vol-window-opacity') {
                const opacity = val / 100;
                window.gameSettings.windowOpacity = opacity;
                const disp = document.getElementById('val-window-opacity');
                if (disp) disp.innerText = val + '%';

                cacheElements();
                applyHoverLogic(windowTrackers, opacity, true);
            }
            else if (id === 'cam-offset-x') {
                window.gameSettings.cameraOffsetX = val;
                const disp = document.getElementById('val-cam-x');
                if (disp) disp.innerText = Math.round(val);
            }
            else if (id === 'cam-offset-y') {
                window.gameSettings.cameraOffsetY = val;
                const disp = document.getElementById('val-cam-y');
                if (disp) disp.innerText = Math.round(val);
            }
            else if (id === 'vol-music') {
                const disp = document.getElementById('val-m');
                if (disp) disp.innerText = val + '%';
                if (typeof audio !== 'undefined' && audio.updateMusicVolume) {
                    audio.updateMusicVolume(val / 100);
                }
            }
            else if (id === 'vol-sfx') {
                const disp = document.getElementById('val-s');
                if (disp) disp.innerText = val + '%';
                window.volSFX = val / 100;
            }
            else if (id === 'vol-crt-intensity') {
                window.gameSettings.crtIntensity = val;
                const disp = document.getElementById('val-crt-intensity');
                if (disp) disp.innerText = val + '%';
                updateCRT();
            }
            else if (id === 'vol-star-bright') {
                window.gameSettings.starBrightness = val;
                const disp = document.getElementById('val-star-bright');
                if (disp) disp.innerText = val + '%';
            }
        });

        slider.addEventListener('dblclick', () => {
            const defaultVal = slider.getAttribute('data-default');
            if (defaultVal !== null) {
                slider.value = defaultVal;
                slider.dispatchEvent(new Event('input'));
            }
        });

        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY) * -1;
            let step = 5;
            if (slider.id.includes('cam')) step = 10;

            let currentVal = parseFloat(slider.value);
            let newVal = currentVal + (delta * step);

            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            newVal = Math.max(min, Math.min(max, newVal));

            slider.value = newVal;
            slider.dispatchEvent(new Event('input'));
        }, { passive: false });
    });

    // --- LANGUAGE SELECTION ---
    initLanguageSelector();
}

function setGameTheme(colorHex, silent = false) {
    if (!colorHex) return;

    // 1. Update Global Settings
    window.gameSettings.themeColor = colorHex;

    // 2. Update CSS Variables
    document.documentElement.style.setProperty('--hud-color', colorHex);
    document.documentElement.style.setProperty('--ray-color', colorHex);

    if (typeof Utils !== 'undefined' && Utils.hexToRgba) {
        const dimColor = Utils.hexToRgba(colorHex, 0.3);
        document.documentElement.style.setProperty('--hud-color-dim', dimColor);
    }

    // 3. Save Hue AND Saturation to Global Settings
    if (typeof Utils !== 'undefined' && Utils.hexToHSL) {
        const hsl = Utils.hexToHSL(colorHex);
        window.gameSettings.themeHue = hsl.h;
        window.gameSettings.themeSat = hsl.s;
    }

    // 4. UI Update
    const opts = document.querySelectorAll('.theme-opt');
    if (opts.length > 0) {
        opts.forEach(el => {
            const isActive = el.getAttribute('data-color') === colorHex;
            el.style.borderColor = isActive ? '#fff' : 'rgba(255,255,255,0.2)';
            el.style.transform = isActive ? 'scale(1.2)' : 'scale(1)';
            el.style.boxShadow = isActive ? `0 0 10px ${colorHex}` : 'none';
        });
    }

    if (!silent) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('notifications.themeUpdated'), type: { color: colorHex } }, "");
    }
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    if (!panel) return;
    settingsOpen = !settingsOpen;
    if (settingsOpen) {
        panel.classList.add('open');
        if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-settings', true);
    } else {
        panel.classList.remove('open');
        if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-settings', false);
    }
}

function openSettings() {
    settingsOpen = true;
    const panel = document.getElementById('settings-panel');
    if (panel) {
        panel.classList.add('open');
        if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-settings', true);
    }
}

function closeSettings() {
    settingsOpen = false;
    const panel = document.getElementById('settings-panel');
    if (panel) {
        panel.classList.remove('open');
        if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-settings', false);
    }
}

function switchSettingsTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-content').forEach(c => c.classList.remove('active'));

    const btnId = 'tab-btn-' + tabName;
    const contentId = 'set-tab-' + tabName;

    const btn = document.getElementById(btnId);
    const content = document.getElementById(contentId);

    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
}

// --- SAVE MANAGEMENT BUTTON ACTIONS ---

window.actionExportSave = function () {
    if (typeof SaveManager === 'undefined') return;
    SaveManager.exportSave();
};

window.actionImportSave = function () {
    if (typeof SaveManager === 'undefined') return;
    const t = window.t || ((key) => key.split('.').pop());
    const code = prompt(t('general.enterSaveCode'));
    if (code) {
        const result = SaveManager.importSave(code);
        if (result && result.startsWith("HATA")) {
            showNotification({ name: t('notifications.importError'), type: { color: '#ef4444' } }, t('notifications.importErrorDesc'));
        }
    }
};

window.actionResetSave = function () {
    if (typeof SaveManager === 'undefined') return;
    const t = window.t || ((key) => key.split('.').pop());
    if (confirm(t('general.deleteConfirm'))) {
        SaveManager.resetSave();
        location.reload();
    }
};

// --- DEVELOPER FUNCTIONS ---
window.devAddResources = function () {
    if (typeof playerData !== 'undefined') {
        const t = window.t || ((key) => key.split('.').pop());
        playerData.stardust += 1000;
        playerData.stats.totalStardust += 1000;
        if (typeof audio !== 'undefined' && audio) audio.playCash();
        if (typeof player !== 'undefined' && player.updateUI) player.updateUI();
        if (typeof updateInventoryCount === 'function') updateInventoryCount();
        if (typeof renderMarket === 'function') renderMarket();
        if (typeof renderUpgrades === 'function') renderUpgrades();
        showNotification({ name: t('notifications.devAddResources'), type: { color: '#fbbf24' } }, "");
    }
};

window.devLevelUp = function () {
    if (typeof player !== 'undefined') {
        player.gainXp(player.maxXp);
    }
};

// --- LANGUAGE SELECTION FUNCTIONS ---

/**
 * Updates all language selector buttons based on current language
 * @param {string} lang - Current language code
 */
function updateLanguageButtons(lang) {
    // Settings panel buttons
    const settingsTr = document.getElementById('lang-btn-tr');
    const settingsEn = document.getElementById('lang-btn-en');

    // Menu buttons
    const menuTr = document.getElementById('menu-lang-tr');
    const menuEn = document.getElementById('menu-lang-en');

    // Update settings panel buttons using active class
    if (settingsTr && settingsEn) {
        if (lang === 'tr') {
            settingsTr.classList.add('active');
            settingsEn.classList.remove('active');
        } else {
            settingsEn.classList.add('active');
            settingsTr.classList.remove('active');
        }
    }

    // Update menu buttons using active class
    if (menuTr && menuEn) {
        if (lang === 'tr') {
            menuTr.classList.add('active');
            menuEn.classList.remove('active');
        } else {
            menuEn.classList.add('active');
            menuTr.classList.remove('active');
        }
    }
}

/**
 * Changes the game language and updates UI
 * @param {string} lang - Language code ('tr' or 'en')
 */
function changeLanguage(lang) {
    if (typeof window.i18n !== 'undefined' && typeof window.i18n.setLanguage === 'function') {
        const success = window.i18n.setLanguage(lang);
        if (success) {
            // Update button states
            updateLanguageButtons(lang);

            // Update dynamic UI elements
            updateDynamicTexts(lang);

            // Show notification
            const langName = lang === 'tr' ? 'Türkçe' : 'English';
            showNotification({ name: window.i18n.t('notifications.languageChanged'), type: { color: '#38bdf8' } }, langName);
        }
    }
}

/**
 * Updates dynamic UI texts that are not using data-i18n
 * @param {string} lang - Language code
 */
function updateDynamicTexts(lang) {
    if (typeof window.i18n === 'undefined' || typeof window.i18n.t !== 'function') return;

    const t = window.i18n.t;

    // ==================== MENU ====================
    const btnContinue = document.getElementById('btn-continue');
    const btnStart = document.getElementById('btn-start');

    if (btnContinue && btnContinue.style.display !== 'none') {
        btnContinue.innerText = t('menu.continue');
    }

    // Check if save exists
    if (typeof SaveManager !== 'undefined' && SaveManager.hasSave()) {
        if (btnStart) btnStart.innerText = t('menu.newGame');
    } else {
        if (btnStart) btnStart.innerText = t('menu.startGame');
    }

    // ==================== SAVE INFO SECTION ====================
    // Update stat labels
    document.querySelectorAll('#save-info-section .stat-label').forEach((label, index) => {
        const keys = ['saveInfo.level', 'saveInfo.health', 'saveInfo.energy', 'saveInfo.inventory', 'saveInfo.storage', 'saveInfo.achievement'];
        if (keys[index]) {
            label.innerText = t(keys[index]);
        }
    });

    // Save info detail labels (Play Time, Last Save, Location)
    const saveInfoDetails = document.querySelectorAll('#save-info-section [style*="justify-content: space-between"] > span:first-child');
    const saveDetailKeys = ['saveInfo.playTime', 'saveInfo.lastSave', 'saveInfo.location'];
    saveInfoDetails.forEach((span, index) => {
        if (saveDetailKeys[index]) {
            // Keep SVG, update text
            const svg = span.querySelector('svg');
            const text = t(saveDetailKeys[index]);
            if (svg) {
                span.innerHTML = '';
                span.appendChild(svg);
                span.appendChild(document.createTextNode(' ' + text));
            } else {
                span.innerText = text;
            }
        }
    });

    // Saved cycle title
    const savedCycleContainer = document.querySelector('#save-info-section > div:first-child');
    if (savedCycleContainer) {
        const svg = savedCycleContainer.querySelector('svg');
        if (svg) {
            const text = t('menu.savedCycle');
            savedCycleContainer.innerHTML = '';
            savedCycleContainer.appendChild(svg);
            savedCycleContainer.appendChild(document.createTextNode(' ' + text));
        }
    }

    // ==================== SETTINGS PANEL ====================
    // Settings panel title
    const settingsTitle = document.querySelector('#settings-panel h3');
    if (settingsTitle) settingsTitle.innerText = t('settings.title');

    // Settings tabs
    const tabGame = document.getElementById('tab-btn-game');
    const tabView = document.getElementById('tab-btn-view');
    const tabAudio = document.getElementById('tab-btn-audio');
    const tabSave = document.getElementById('tab-btn-save');

    if (tabGame) tabGame.innerText = t('settings.tabs.game');
    if (tabView) tabView.innerText = t('settings.tabs.view');
    if (tabAudio) tabAudio.innerText = t('settings.tabs.audio');
    if (tabSave) tabSave.innerText = t('settings.tabs.save');

    // ==================== SETTINGS TAB: GAME ====================
    // Section headers in game tab
    const gameTabSections = document.querySelectorAll('#set-tab-game .mb-2.text-xs.font-bold');
    const gameSectionKeys = ['settings.navArrows', 'settings.system', 'settings.language'];
    gameTabSections.forEach((section, index) => {
        if (gameSectionKeys[index]) {
            section.innerText = t(gameSectionKeys[index]);
        }
    });

    // Toggle labels in game tab
    const gameToggleLabels = document.querySelectorAll('#set-tab-game .toggle-row > span:first-child');
    const gameToggleKeys = ['settings.nexus', 'settings.repairStation', 'settings.storageCenter', 'settings.echo', 'settings.enableConsole', 'settings.devMode'];
    gameToggleLabels.forEach((label, index) => {
        if (gameToggleKeys[index]) {
            label.innerText = t(gameToggleKeys[index]);
        }
    });

    // ==================== SETTINGS TAB: VIEW ====================
    // Section headers in view tab
    const viewTabSections = document.querySelectorAll('#set-tab-view .mb-2.text-xs.font-bold');
    const viewSectionKeys = ['settings.themeColor', 'settings.atmosphere', 'settings.interfaceWindows', 'settings.cameraPosition', 'settings.effects'];
    viewTabSections.forEach((section, index) => {
        if (viewSectionKeys[index]) {
            section.innerText = t(viewSectionKeys[index]);
        }
    });

    // Toggle labels in view tab
    const viewToggleLabels = document.querySelectorAll('#set-tab-view .toggle-row > span:first-child');
    const viewToggleKeys = ['settings.spaceGrid', 'settings.hoverEffect', 'settings.shipBars', 'settings.cinematicMode', 'settings.adaptiveMode', 'settings.smoothTransition', 'settings.crtEffect'];
    viewToggleLabels.forEach((label, index) => {
        if (viewToggleKeys[index]) {
            label.innerText = t(viewToggleKeys[index]);
        }
    });

    // Slider labels in view tab
    const viewSliderLabels = document.querySelectorAll('#set-tab-view .flex.justify-between > span:first-child');
    const viewSliderKeys = ['settings.starBrightness', 'settings.hudOpacity', 'settings.windowOpacity', 'settings.horizontalX', 'settings.verticalY', 'settings.intensity'];
    viewSliderLabels.forEach((label, index) => {
        if (viewSliderKeys[index]) {
            label.innerText = t(viewSliderKeys[index]);
        }
    });

    // Default hint text
    const defaultHints = document.querySelectorAll('#set-tab-view .text-\\[9px\\], #set-tab-audio .text-\\[9px\\]');
    defaultHints.forEach(hint => {
        hint.innerText = t('settings.defaultHint');
    });

    // ==================== SETTINGS TAB: AUDIO ====================
    // Section header
    const audioSectionHeader = document.querySelector('#set-tab-audio .mb-2.text-xs.font-bold');
    if (audioSectionHeader) audioSectionHeader.innerText = t('settings.soundLevel');

    // Slider labels
    const audioSliderLabels = document.querySelectorAll('#set-tab-audio .flex.justify-between > span:first-child');
    const audioSliderKeys = ['settings.music', 'settings.atmosphere2'];
    audioSliderLabels.forEach((label, index) => {
        if (audioSliderKeys[index]) {
            label.innerText = t(audioSliderKeys[index]);
        }
    });

    // ==================== SETTINGS TAB: SAVE ====================
    // Section header
    const saveSectionHeader = document.querySelector('#set-tab-save .mb-2.text-xs.font-bold');
    if (saveSectionHeader) saveSectionHeader.innerText = t('settings.saveOperations');

    // Description
    const saveDesc = document.querySelector('#set-tab-save .text-xs.text-gray-400.mb-4');
    if (saveDesc) saveDesc.innerText = t('settings.saveDesc');

    // Buttons
    const btnExport = document.querySelector('#btn-action-export span');
    const btnImport = document.querySelector('#btn-action-import span');
    const btnReset = document.querySelector('#btn-action-reset span');

    if (btnExport) btnExport.innerText = t('settings.export');
    if (btnImport) btnImport.innerText = t('settings.import');
    if (btnReset) btnReset.innerText = t('settings.deleteAll');

    // ==================== SETTINGS TAB: DEV ====================
    // Section headers
    const devSectionHeaders = document.querySelectorAll('#set-tab-dev .text-xs.text-red-400.font-bold');
    const devSectionKeys = ['settings.visualDebug', 'settings.performanceGameplay'];
    devSectionHeaders.forEach((header, index) => {
        if (devSectionKeys[index]) {
            header.innerText = t(devSectionKeys[index]);
        }
    });

    // Toggle labels
    const devToggleLabels = document.querySelectorAll('#set-tab-dev .toggle-row > span:first-child');
    const devToggleKeys = ['settings.gravityFields', 'settings.hitboxes', 'settings.showVectors', 'settings.targetVectors', 'settings.hidePlayer', 'settings.perfMonitor', 'settings.godMode'];
    devToggleLabels.forEach((label, index) => {
        if (devToggleKeys[index]) {
            label.innerText = t(devToggleKeys[index]);
        }
    });

    // Dev buttons
    const devCrystalBtn = document.getElementById('btn-dev-add-resources');
    const devLevelBtn = document.getElementById('btn-dev-levelup');
    if (devCrystalBtn) devCrystalBtn.innerText = t('settings.addCrystal');
    if (devLevelBtn) devLevelBtn.innerText = t('settings.levelUp');

    // Dev warning
    const devWarning = document.querySelector('#set-tab-dev .p-2.border.border-red-900\\/30');
    if (devWarning) devWarning.innerText = t('settings.devWarning');

    // ==================== PAUSE OVERLAY ====================
    const pauseTitle = document.querySelector('#pause-overlay .pause-title');
    const pauseHeader = document.querySelector('#pause-overlay .modal-header');
    const btnResume = document.getElementById('btn-resume-game');
    const btnQuit = document.getElementById('btn-quit-game');

    if (pauseTitle) pauseTitle.innerText = t('pause.waitingMode');
    if (pauseHeader) pauseHeader.innerText = t('pause.systemPaused');
    if (btnResume) btnResume.innerText = t('pause.resume');
    if (btnQuit) btnQuit.innerText = t('pause.quit');

    // ==================== DEATH SCREEN ====================
    const deathTitle = document.querySelector('#death-screen .death-title');
    const deathSub = document.querySelector('#death-screen .death-sub');
    const deathHeader = document.querySelector('#death-screen .modal-header');

    if (deathTitle) deathTitle.innerText = t('death.disconnected');
    if (deathSub) deathSub.innerText = t('death.criticalDamage');
    if (deathHeader) deathHeader.innerText = t('death.signalLost');

    // ==================== MOBILE WARNING ====================
    const mobileTitle = document.querySelector('#mobile-warning h2');
    const mobileDesc = document.querySelector('#mobile-warning .modal-content p');
    const mobileBtn = document.getElementById('btn-close-mobile-warning');
    const mobileHeader = document.querySelector('#mobile-warning .modal-header');

    if (mobileTitle) mobileTitle.innerText = t('warnings.mobileDetected');
    if (mobileDesc) mobileDesc.innerText = t('warnings.mobileDesc');
    if (mobileBtn) mobileBtn.innerText = t('warnings.continueAnyway');
    if (mobileHeader) mobileHeader.innerText = t('warnings.systemWarning');

    // ==================== CONTROL KEYS ====================
    const keyDescriptions = document.querySelectorAll('.controls-grid-classic .key-row span:last-child');
    const controlKeys = ['controls.navigation', 'controls.thrust', 'controls.interaction', 'controls.echoLink',
        'controls.autoPilot', 'controls.camera', 'controls.cargo', 'controls.radar',
        'controls.hud', 'controls.lightJump', 'controls.systemMenu'];

    keyDescriptions.forEach((desc, index) => {
        if (controlKeys[index]) {
            desc.innerText = t(controlKeys[index]);
        }
    });

    // ==================== DEV FOOTER ====================
    const devLabel = document.querySelector('.dev-footer .dev-label');
    const sourceLink = document.querySelector('.dev-footer .github-link-btn span');
    const supportLink = document.querySelectorAll('.dev-footer .github-link-btn span')[1];
    const updateLabel = document.querySelector('#update-container .dev-label');

    if (devLabel) devLabel.innerText = t('menu.developer');
    if (sourceLink) sourceLink.innerText = t('menu.source');
    if (supportLink) supportLink.innerText = t('menu.support');
    if (updateLabel) updateLabel.innerText = t('menu.update');

    // ==================== HUD ====================
    // Speed label
    const speedLabel = document.querySelector('.speed-label');
    if (speedLabel) speedLabel.innerText = t('hud.speed');

    // Tutorial box
    const tutLabel = document.querySelector('.tut-label');
    if (tutLabel) tutLabel.innerText = t('hud.tutorial');

    // Echo vision indicator
    const visionText = document.querySelector('.vision-text');
    const visionSub = document.querySelector('.vision-sub');
    if (visionText) visionText.innerText = t('hud.echoVision');
    if (visionSub) visionSub.innerText = t('hud.signalStrength');

    // Echo dropdown items
    const echoName = document.querySelector('.echo-p-name');
    const menuRoam = document.getElementById('menu-roam');
    const menuReturn = document.getElementById('menu-return');
    const menuMerge = document.getElementById('menu-merge');
    const menuEchoInv = document.getElementById('menu-echo-inv');
    const aiModeBtn = document.getElementById('ai-mode-btn');

    if (echoName) echoName.innerText = t('hud.echoName');
    if (menuRoam) menuRoam.innerText = t('hud.echoFree');
    if (menuReturn) menuReturn.innerText = t('hud.echoReturn');
    if (menuMerge) menuMerge.innerText = t('hud.echoMerge');
    if (menuEchoInv) menuEchoInv.innerText = t('hud.echoInventory');
    if (aiModeBtn) aiModeBtn.innerText = t('ai.collect');

    // ==================== STORAGE PANEL ====================
    const storageTitle = document.querySelector('#storage-overlay .nexus-logo-text');
    const storageDesc = document.querySelector('#storage-overlay .nexus-header span');
    const shipCargoLabel = document.querySelector('#storage-overlay h3[style*="hud-color"]');
    const centerStorageLabel = document.querySelector('#storage-overlay h3[style*="color-storage"]');
    const btnDepositAll = document.getElementById('btn-deposit-all');
    const btnWithdrawAll = document.getElementById('btn-withdraw-all');

    if (storageTitle) storageTitle.innerText = t('panels.storageTitle');
    if (storageDesc) storageDesc.innerText = t('panels.storageDesc');
    if (shipCargoLabel) shipCargoLabel.innerText = t('panels.shipCargo');
    if (centerStorageLabel) centerStorageLabel.innerText = t('panels.centralStorage');
    if (btnDepositAll) btnDepositAll.innerText = t('panels.depositAll');
    if (btnWithdrawAll) btnWithdrawAll.innerText = t('panels.withdrawAll');

    // ==================== ECHO INVENTORY PANEL ====================
    const echoInterfaceTitle = document.querySelector('#echo-inventory-overlay .nexus-logo-text');
    const echoSyncDesc = document.querySelector('#echo-inventory-overlay .nexus-header span');
    const echoPlayerCargoLabel = document.querySelector('#echo-inventory-overlay h3[style*="hud-color"]');
    const echoStorageLabel = document.querySelector('#echo-inventory-overlay h3[style*="echo-color"]');
    const btnTransferToEcho = document.getElementById('btn-transfer-to-echo');
    const btnTransferToPlayer = document.getElementById('btn-transfer-to-player');

    if (echoInterfaceTitle) echoInterfaceTitle.innerText = t('panels.echoInterface');
    if (echoSyncDesc) echoSyncDesc.innerText = t('panels.echoSyncStorage');
    if (echoPlayerCargoLabel) echoPlayerCargoLabel.innerText = t('panels.shipCargo');
    if (echoStorageLabel) echoStorageLabel.innerText = t('panels.echoStorage');
    if (btnTransferToEcho) btnTransferToEcho.innerText = t('panels.transferAll');
    if (btnTransferToPlayer) btnTransferToPlayer.innerText = t('panels.withdrawAll');

    // ==================== INVENTORY PANEL ====================
    const invTitle = document.querySelector('#inventory-overlay h2');
    if (invTitle) invTitle.innerText = t('panels.inventory');

    // ==================== NEXUS PANEL ====================
    const nexusTitle = document.querySelector('#nexus-overlay .nexus-logo-text');
    const nexusDesc = document.querySelector('#nexus-overlay .nexus-header > div:first-child span');
    const nexusTabMarket = document.getElementById('nexus-tab-market');
    const nexusTabUpgrades = document.getElementById('nexus-tab-upgrades');
    const marketDescEl = document.querySelector('#tab-market > .flex > p');
    const btnSellAll = document.getElementById('btn-sell-all');
    const voidRayColTitle = document.querySelector('#tab-upgrades .upgrade-col-title[style*="hud-color"]');
    const echoRayColTitle = document.querySelector('#tab-upgrades .upgrade-col-title[style*="echo-color"]');

    if (nexusTitle) nexusTitle.innerText = t('panels.nexusTitle');
    if (nexusDesc) nexusDesc.innerText = t('panels.nexusDesc');
    if (nexusTabMarket) nexusTabMarket.innerText = t('panels.market');
    if (nexusTabUpgrades) nexusTabUpgrades.innerText = t('panels.hangar');
    if (marketDescEl) marketDescEl.innerText = t('panels.marketDesc');
    if (btnSellAll) btnSellAll.innerText = t('panels.sellAll');
    if (voidRayColTitle) voidRayColTitle.innerText = t('panels.voidRay');
    if (echoRayColTitle) echoRayColTitle.innerText = t('panels.echoRay');

    // ==================== ACHIEVEMENTS PANEL ====================
    const achTitle = document.querySelector('#achievements-overlay h2');
    if (achTitle) achTitle.innerText = t('panels.achievements');

    // ==================== CONTEXT PANEL ====================
    const contextTitle = document.querySelector('#context-overlay h2');
    const ctxSpeedLabel = document.querySelector('#context-overlay .ctx-lbl[style*="hud-text"]');
    const ctxCargoLabel = document.querySelectorAll('#context-overlay .ctx-lbl')[1];
    const ctxSensorLabel = document.querySelectorAll('#context-overlay .ctx-lbl')[2];
    const ctxEnergyLabel = document.querySelectorAll('#context-overlay .ctx-lbl')[3];
    const ctxEnvLabel = document.querySelector('#context-overlay .ctx-lbl.text-red-300');
    const ctxEnvDetail = document.getElementById('ctx-env-detail');

    if (contextTitle) contextTitle.innerText = t('panels.contexts');
    if (ctxSpeedLabel) ctxSpeedLabel.innerText = t('panels.maxSpeed');
    if (ctxCargoLabel) ctxCargoLabel.innerText = t('panels.cargo');
    if (ctxSensorLabel) ctxSensorLabel.innerText = t('panels.sensor');
    if (ctxEnergyLabel) ctxEnergyLabel.innerText = t('panels.energyFlow');
    if (ctxEnvLabel) ctxEnvLabel.innerText = t('panels.envStatus');
    if (ctxEnvDetail && ctxEnvDetail.innerText.includes('Analysis') || ctxEnvDetail && ctxEnvDetail.innerText.includes('Analyzing')) {
        ctxEnvDetail.innerText = t('panels.analyzing');
    }

    // ==================== PROFILE WINDOW ====================
    const profileCharLabel = document.querySelector('.p-rpg-title');
    const profileRankText = document.getElementById('profile-rank-text');
    const profileLevelLabel = document.querySelectorAll('.p-rpg-lvl-box .lbl')[0];
    const profileCurrentXpLabel = document.querySelectorAll('.p-rpg-lvl-box .lbl')[1];
    const profileRequiredXpLabel = document.querySelectorAll('.p-rpg-lvl-box .lbl')[2];
    const profileShipStatusLabel = document.querySelectorAll('.p-rpg-section-title')[0];
    const profileStatusLabel = document.querySelectorAll('.p-rpg-section-title')[1];
    const profileAttrsLabel = document.querySelectorAll('.p-rpg-section-title')[2];

    if (profileCharLabel) profileCharLabel.innerText = t('profile.character');
    if (profileRankText) profileRankText.innerText = t('profile.novicePilot');
    if (profileLevelLabel) profileLevelLabel.innerText = t('profile.level');
    if (profileCurrentXpLabel) profileCurrentXpLabel.innerText = t('profile.currentXp');
    if (profileRequiredXpLabel) profileRequiredXpLabel.innerText = t('profile.requiredXp');
    if (profileShipStatusLabel) profileShipStatusLabel.innerText = t('profile.shipStatus');
    if (profileStatusLabel) profileStatusLabel.innerText = t('profile.status');
    if (profileAttrsLabel) profileAttrsLabel.innerText = t('profile.attributes');

    // Profile stat names
    const profileStatNames = document.querySelectorAll('.p-rpg-stat-row .stat-name');
    const profileStatKeys = ['profile.engine', 'profile.maneuver', 'profile.magnet', 'profile.cargo'];
    profileStatNames.forEach((name, index) => {
        if (profileStatKeys[index]) name.innerText = t(profileStatKeys[index]);
    });

    // Profile val names
    const profileValNames = document.querySelectorAll('.p-rpg-val-row .val-name');
    const profileValKeys = ['profile.hull', 'profile.energy', 'profile.damage', 'profile.shield'];
    profileValNames.forEach((name, index) => {
        if (profileValKeys[index]) name.innerText = t(profileValKeys[index]);
    });

    // Profile attributes
    const profileAttrItems = document.querySelectorAll('.p-attr-item > span:first-child');
    const profileAttrKeys = ['profile.speed', 'profile.echoSpeed', 'profile.distance', 'profile.collected', 'profile.crystal', 'profile.playTime'];
    profileAttrItems.forEach((item, index) => {
        if (profileAttrKeys[index]) item.innerText = t(profileAttrKeys[index]);
    });

    // Profile tabs
    const profileTabStatus = document.getElementById('p-tab-btn-summary');
    const profileTabMissions = document.getElementById('p-tab-btn-achievements');
    const missionStatusLabel = document.querySelector('#p-tab-achievements .text-xs.tracking-widest');

    if (profileTabStatus) profileTabStatus.innerText = t('profile.statusTab');
    if (profileTabMissions) profileTabMissions.innerText = t('profile.missionsTab');
    if (missionStatusLabel) missionStatusLabel.innerText = t('profile.missionStatus');

    // ==================== EQUIPMENT WINDOW ====================
    const equipTitle = document.querySelector('.equip-title');
    if (equipTitle) equipTitle.innerText = t('equipment.title');

    // Equipment slot labels
    const slotLabels = document.querySelectorAll('.slot-label');
    const slotKeys = ['equipment.engine', 'equipment.shield', 'equipment.weaponL', 'equipment.weaponR', 'equipment.radar', 'equipment.hull'];
    slotLabels.forEach((label, index) => {
        if (slotKeys[index]) label.innerText = t(slotKeys[index]);
    });

    // Equipment stat names
    const estatNames = document.querySelectorAll('.estat-name');
    const estatKeys = ['equipment.attackPower', 'equipment.defense', 'equipment.speed', 'equipment.energy'];
    estatNames.forEach((name, index) => {
        if (estatKeys[index]) name.innerText = t(estatKeys[index]);
    });

    // ==================== CONTROLS WINDOW ====================
    const controlsWindowTitle = document.querySelector('.controls-title');
    if (controlsWindowTitle) controlsWindowTitle.innerText = t('controlsWindow.title');

    // Control descriptions in compact grid
    const ctrlDescriptions = document.querySelectorAll('.controls-grid-compact .ctrl-row > span:last-child');
    const ctrlKeys = [
        'controlsWindow.navigation', 'controlsWindow.boost', 'controlsWindow.autoPilot', 'controlsWindow.camera',
        'controlsWindow.interaction', 'controlsWindow.echoLink', 'controlsWindow.cargoInventory', 'controlsWindow.bigMap',
        'controlsWindow.hideUI', 'controlsWindow.profile'
    ];
    ctrlDescriptions.forEach((desc, index) => {
        if (ctrlKeys[index]) desc.innerText = t(ctrlKeys[index]);
    });

    // ==================== BIG MAP ====================
    const mapLegendTitle = document.querySelector('.big-map-info-overlay h3');
    if (mapLegendTitle) mapLegendTitle.innerText = t('map.legend');

    // Map legend items
    const legendItems = document.querySelectorAll('.big-map-info-overlay .legend-item');
    const legendKeys = ['map.you', 'map.nexus', 'map.repairStation', 'map.storageCenter', 'map.echo',
        'map.wormhole', 'map.resource', 'map.toxicZone', 'map.tardigrade', 'map.lostCargo', 'map.target'];
    legendItems.forEach((item, index) => {
        if (legendKeys[index]) {
            const dot = item.querySelector('.l-dot');
            if (dot) {
                item.innerHTML = '';
                item.appendChild(dot);
                item.appendChild(document.createTextNode(' ' + t(legendKeys[index])));
            }
        }
    });

    // Radar info tooltip titles
    const radarSystemTitle = document.querySelector('.radar-info-tooltip h4');
    if (radarSystemTitle && (radarSystemTitle.innerText.includes('RADAR') || radarSystemTitle.innerText.includes('SYSTEM'))) {
        radarSystemTitle.innerText = t('map.radarSystem');
    }

    // Map control buttons titles
    const btnMapTrack = document.getElementById('btn-map-track');
    const btnMapTargets = document.getElementById('btn-map-targets');
    const btnMapCenter = document.getElementById('btn-map-center');

    if (btnMapTrack) btnMapTrack.title = t('map.trackPlayer');
    if (btnMapTargets) btnMapTargets.title = t('map.targetVectors');
    if (btnMapCenter) btnMapCenter.title = t('map.centerFocus');

    // ==================== CHAT PANEL ====================
    const chatTabGeneral = document.getElementById('tab-general');
    const chatTabGroup = document.getElementById('tab-group');
    const chatTabInfo = document.getElementById('tab-info');
    const chatInput = document.getElementById('chat-input');

    if (chatTabGeneral) chatTabGeneral.innerText = t('chat.general');
    if (chatTabGroup) chatTabGroup.innerText = t('chat.group');
    if (chatTabInfo) chatTabInfo.innerText = t('chat.info');
    if (chatInput) chatInput.placeholder = t('chat.placeholder');

    // ==================== RADAR INFO TOOLTIP DETAILS ====================
    const radarInfoTooltip = document.querySelector('.radar-info-tooltip');
    if (radarInfoTooltip) {
        // Update all h4 titles
        const h4Elements = radarInfoTooltip.querySelectorAll('h4');
        if (h4Elements[0]) h4Elements[0].innerText = t('map.radarSystem');
        if (h4Elements[1]) h4Elements[1].innerText = t('map.mapControls');

        // Update radar legend titles
        const rTitles = radarInfoTooltip.querySelectorAll('.r-title');
        const rDescs = radarInfoTooltip.querySelectorAll('.r-desc');

        // Radar system items
        if (rTitles[0]) rTitles[0].innerText = t('map.scanArea');
        if (rDescs[0]) rDescs[0].innerText = t('map.scanAreaDesc');
        if (rTitles[1]) rTitles[1].innerText = t('map.radarArea');
        if (rDescs[1]) rDescs[1].innerText = t('map.radarAreaDesc');
        if (rTitles[2]) rTitles[2].innerText = t('map.unknownArea');
        if (rDescs[2]) rDescs[2].innerText = t('map.unknownAreaDesc');

        // Map controls items
        if (rTitles[3]) rTitles[3].innerText = t('map.autoPilot');
        if (rDescs[3]) rDescs[3].innerText = t('map.autoPilotDesc');
        if (rTitles[4]) rTitles[4].innerText = t('map.zoom');
        if (rDescs[4]) rDescs[4].innerText = t('map.zoomDesc');
        if (rTitles[5]) rTitles[5].innerText = t('map.pan');
        if (rDescs[5]) rDescs[5].innerText = t('map.panDesc');
    }

    // ==================== TUTORIAL BOX ====================
    const tutorialText = document.getElementById('tutorial-text');
    // Only translate if it shows the default starting message
    if (tutorialText) {
        const currentText = tutorialText.innerText;
        if (currentText.includes('Sistemler') || currentText.includes('Systems')) {
            tutorialText.innerText = t('hud.startingUp');
        }
        // Check for specific tutorial messages and translate them
        if (currentText.includes('[SPACE]')) {
            tutorialText.innerText = t('tutorial.holdSpace');
        }
    }

    // ==================== INVENTORY TITLE FIX ====================
    const invH2 = document.querySelector('.inv-header h2');
    if (invH2) invH2.innerText = t('panels.inventory');
}

/**
 * Initializes language selector buttons
 */
function initLanguageSelector() {
    // Get current language
    const currentLang = typeof window.i18n !== 'undefined' ? window.i18n.currentLanguage : 'tr';

    // Update initial button states
    updateLanguageButtons(currentLang);

    // Settings panel buttons
    const settingsTr = document.getElementById('lang-btn-tr');
    const settingsEn = document.getElementById('lang-btn-en');

    if (settingsTr) {
        settingsTr.addEventListener('click', () => changeLanguage('tr'));
    }
    if (settingsEn) {
        settingsEn.addEventListener('click', () => changeLanguage('en'));
    }

    // Menu buttons
    const menuTr = document.getElementById('menu-lang-tr');
    const menuEn = document.getElementById('menu-lang-en');

    if (menuTr) {
        menuTr.addEventListener('click', () => changeLanguage('tr'));
    }
    if (menuEn) {
        menuEn.addEventListener('click', () => changeLanguage('en'));
    }

    // Apply saved language on init
    if (currentLang !== 'tr') {
        updateDynamicTexts(currentLang);
    }
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.settingsOpen = settingsOpen;
    window.initSettings = initSettings;
    window.toggleSettings = toggleSettings;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    window.switchSettingsTab = switchSettingsTab;
    window.setGameTheme = setGameTheme;
    window.initLanguageSelector = initLanguageSelector;
    window.changeLanguage = changeLanguage;
    window.updateLanguageButtons = updateLanguageButtons;
}