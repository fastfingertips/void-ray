/**
 * Void Ray - Window: Stats (ES6 Module)
 */

// Window state
export let statsOpen = false;

// Cache for storing DOM elements
let statsCache = {
    initialized: false,
    elements: {}
};

/**
 * Opens the statistics window and updates the data.
 */
function openStats() {
    statsOpen = true;
    window.statsOpen = true; // Sync with window
    const overlay = document.getElementById('stats-overlay');
    if (overlay) overlay.classList.add('open');

    // Make button active
    if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-stats-icon', true);

    // First render call (to establish structure)
    renderStats();
}

/**
 * Closes the statistics window.
 */
function closeStats() {
    statsOpen = false;
    window.statsOpen = false; // Sync with window
    const overlay = document.getElementById('stats-overlay');
    if (overlay) overlay.classList.remove('open');

    // Remove button activity
    if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-stats-icon', false);
}

/**
 * Toggles the statistics window open/closed.
 */
function toggleStats() {
    if (statsOpen) {
        closeStats();
    } else {
        openStats();
    }
}

/**
 * Creates the statistics structure and caches the elements.
 */
function initStatsDOM(windowEl) {
    // Fallback if t() function is missing
    const t = window.t || ((key) => key.split('.').pop());

    // Corrected class name to 'stats-header' (for Core CSS compatibility)
    let htmlContent = `
        <div class="stats-header" style="cursor: move;">
            <div class="stats-icon-box">≣</div>
            <div class="stats-title-group">
                <div class="stats-main-title">${t('stats.title')}</div>
                <div class="stats-sub-title">${t('stats.subtitle')}</div>
            </div>
            <div class="ui-close-btn" id="btn-close-stats-dynamic">✕</div>
        </div>
        
        <div class="stats-wireframe-content">
            <!-- GROUP 1: TIME AND EXPLORATION -->
            <div class="stats-group">
                <div class="stats-group-title">${t('stats.timeExploration')}</div>
                <div class="stats-row"><span class="stats-label">${t('stats.universeTime')}</span><span id="stat-game-time" class="stats-value">00:00:00</span></div>
                <div class="stats-row"><span class="stats-label">${t('stats.movingTime')}</span><span id="stat-move-time" class="stats-value">00:00:00</span></div>
                <div class="stats-row"><span class="stats-label">${t('stats.idleTime')}</span><span id="stat-idle-time" class="stats-value">00:00:00</span></div>
                <div class="stats-row"><span class="stats-label">${t('profile.distance')}</span><span id="stat-distance" class="stats-value highlight">0 km</span></div>
            </div>

            <!-- GROUP 2: ECONOMY AND STORAGE -->
            <div class="stats-group">
                <div class="stats-group-title">${t('stats.inventoryEconomy')}</div>
                <div class="stats-row"><span class="stats-label">${t('stats.earnedCrystal')}</span><span id="stat-stardust" class="stats-value gold">0 ◆</span></div>
                <div class="stats-row"><span class="stats-label">${t('stats.spentCrystal')}</span><span id="stat-spent" class="stats-value" style="opacity:0.7;">0 ◆</span></div>
                <div class="stats-row"><span class="stats-label">${t('stats.shipStorage')}</span><span id="stat-inventory" class="stats-value">0 / 0</span></div>
                <div class="stats-row"><span class="stats-label">${t('stats.centralStorage')}</span><span id="stat-storage" class="stats-value">0 ${t('stats.items')}</span></div>
            </div>

            <!-- GROUP 3: PERFORMANCE -->
            <div class="stats-group">
                <div class="stats-group-title">${t('profile.shipStatus')}</div>
                <div class="stats-row"><span class="stats-label">${t('stats.totalEnergy')}</span><span id="stat-energy" class="stats-value">0 ${t('stats.unit')}</span></div>
                <div class="stats-row"><span class="stats-label">${t('stats.autoPilotUsage')}</span><span id="stat-ai-time" class="stats-value">00:00:00</span></div>
            </div>
        </div>
    `;

    windowEl.innerHTML = htmlContent;

    // Add Event Listener (after DOM is created)
    const closeBtn = windowEl.querySelector('#btn-close-stats-dynamic');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (typeof closeStats === 'function') closeStats();
        });
    }

    // Cache the elements (Cache lookup)
    const ids = [
        'stat-game-time', 'stat-move-time', 'stat-idle-time', 'stat-distance',
        'stat-stardust', 'stat-spent', 'stat-inventory', 'stat-storage',
        'stat-energy', 'stat-ai-time'
    ];

    ids.forEach(id => {
        statsCache.elements[id] = document.getElementById(id);
    });

    statsCache.initialized = true;

    // NEW: Re-attach draggable feature since content is dynamically created
    if (typeof makeElementDraggable === 'function') {
        const header = windowEl.querySelector('.stats-header');
        if (header) {
            makeElementDraggable(windowEl, header);
        }
    }
}

/**
 * Updates the statistics data.
 */
function renderStats() {
    if (!statsOpen) return;

    const windowEl = document.querySelector('#stats-overlay .stats-window');
    if (!windowEl) return;

    // 1. STRUCTURE CHECK (Create content if it hasn't been created yet)
    if (!statsCache.initialized) {
        initStatsDOM(windowEl);
    }

    // Fallback if t() function is missing
    const t = window.t || ((key) => key.split('.').pop());

    // 2. DATA CALCULATION
    const now = Date.now();
    const gameTime = now - (window.gameStartTime || now);

    // 3. FAST UPDATE (Using cache)
    updateCachedVal('stat-game-time', formatTime(gameTime));
    updateCachedVal('stat-move-time', formatTime(playerData.stats.timeMoving));
    updateCachedVal('stat-idle-time', formatTime(playerData.stats.timeIdle));
    updateCachedVal('stat-distance', Math.floor(playerData.stats.distance / 100) + " km");

    updateCachedVal('stat-stardust', playerData.stats.totalStardust + " ◆");
    updateCachedVal('stat-spent', playerData.stats.totalSpentStardust + " ◆");
    updateCachedVal('stat-inventory', `${collectedItems.length} / ${GameRules.getPlayerCapacity()}`);
    updateCachedVal('stat-storage', centralStorage.length + " " + t('stats.items'));

    updateCachedVal('stat-energy', Math.floor(playerData.stats.totalEnergySpent) + " " + t('stats.unit'));
    updateCachedVal('stat-ai-time', formatTime(playerData.stats.timeAI));
}

// Helper Function: Update from cache
function updateCachedVal(id, val) {
    const el = statsCache.elements[id];
    if (el) {
        // Update only if value has changed to prevent unnecessary DOM writes
        if (el.innerText !== val) {
            el.innerText = val;
        }
    }
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.statsOpen = statsOpen;
    window.openStats = openStats;
    window.closeStats = closeStats;
    window.renderStats = renderStats;
    window.toggleStats = toggleStats;
}