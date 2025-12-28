/**
 * Void Ray - Window: Nexus (ES6 Module)
 */

export let nexusOpen = false;

/**
 * Checks if player is within interaction range of Nexus.
 * @returns {boolean} True if in range
 */
function isNearNexus() {
    if (typeof player === 'undefined' || typeof nexus === 'undefined') return false;

    // Nexus radius (default 300) + Interaction buffer (200)
    const interactionRange = (nexus.radius || 300) + 200;
    // Utils update:
    const dist = Utils.distEntity(player, nexus);

    return dist <= interactionRange;
}

function enterNexus() {
    // --- SECURITY CHECK ---
    // Check distance when called from profile window or externally
    if (!isNearNexus()) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('nexusNotif.accessDenied'), type: { color: '#ef4444' } }, t('nexusNotif.outOfRange'));
        Utils.playSound('playError'); // Safe Sound
        return;
    }

    nexusOpen = true;
    const overlay = document.getElementById('nexus-overlay');
    if (overlay) overlay.classList.add('open');
    switchNexusTab('market');
}

function exitNexus() {
    nexusOpen = false;
    const overlay = document.getElementById('nexus-overlay');
    if (overlay) overlay.classList.remove('open');
    hideTooltip();
}

function switchNexusTab(tabName) {
    document.querySelectorAll('.nexus-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nexus-content').forEach(c => c.classList.remove('active'));

    if (tabName === 'market') {
        const tab1 = document.querySelector('.nexus-tab:nth-child(1)');
        if (tab1) tab1.classList.add('active');

        const contentMarket = document.getElementById('tab-market');
        if (contentMarket) contentMarket.classList.add('active');

        renderMarket();
    } else {
        const tab2 = document.querySelector('.nexus-tab:nth-child(2)');
        if (tab2) tab2.classList.add('active');

        const contentUpgrades = document.getElementById('tab-upgrades');
        if (contentUpgrades) contentUpgrades.classList.add('active');

        renderUpgrades();
    }
}

function renderMarket() {
    const t = window.t || ((key) => key.split('.').pop());
    const grid = document.getElementById('market-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (collectedItems.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500 mt-10">${t('panels.noItemsToSell')}</div>`;
        return;
    }

    const grouped = {};
    collectedItems.forEach(item => {
        if (!grouped[item.name]) grouped[item.name] = { ...item, count: 0 };
        grouped[item.name].count++;
    });

    Object.values(grouped).forEach(item => {
        if (item.type.value > 0) {
            const totalVal = item.count * item.type.value;
            const div = document.createElement('div'); div.className = 'market-card';
            div.innerHTML = `<div class="text-2xl" style="color:${item.type.color}">●</div><div class="font-bold text-white">${item.name}</div><div class="text-sm text-gray-400">x${item.count}</div><div class="text-white font-mono text-lg opacity-80">${totalVal} <span class="text-xs">${t('resources.crystal')}</span></div><button class="sell-btn" data-name="${item.name}" data-value="${item.type.value}" data-count="${item.count}">${t('panels.sell')}</button>`;
            grid.appendChild(div);
        }
    });
}

function renderUpgrades() {
    const t = window.t || ((key) => key.split('.').pop());
    const pList = document.getElementById('upg-player-list');
    const eList = document.getElementById('upg-echo-list');
    if (pList) pList.innerHTML = '';
    if (eList) eList.innerHTML = '';

    const createCard = (key, data, isEcho = false) => {
        const currentLvl = playerData.upgrades[key];
        const cost = GameRules.calculateUpgradeCost(data.baseCost, currentLvl);
        const isMax = currentLvl >= data.max;

        let isDisabled = isMax || playerData.stardust < cost;
        let btnText = isMax ? 'MAX' : t('panels.upgrade');
        let btnClass = 'buy-btn';

        if (isEcho) {
            if (!echoRay) {
                isDisabled = true;
                btnText = t('nexusNotif.echoNotAvailable');
                btnClass += ' disabled-echo';
            } else if (!echoRay.attached) {
                isDisabled = true;
                btnText = t('nexusNotif.echoNotLinked');
                btnClass += ' disabled-echo';
            }
        }

        let pips = ''; for (let i = 0; i < data.max; i++) pips += `<div class="lvl-pip ${i < currentLvl ? 'filled' : ''}"></div>`;

        return `
        <div class="upgrade-item">
            <div class="upg-info">
                <h4>${data.name}</h4>
                <p>${data.desc}</p>
                <div class="upg-level">${pips}</div>
            </div>
            <button class="${btnClass}" ${isDisabled ? 'disabled' : ''} data-upgrade-key="${key}">
                ${btnText} ${(!isMax && btnText !== t('nexusNotif.echoNotAvailable') && btnText !== t('nexusNotif.echoNotLinked')) ? `<span class="cost-text">${cost} ◆</span>` : ''}
            </button>
        </div>`;
    };

    if (pList) ['playerSpeed', 'playerTurn', 'playerMagnet', 'playerCapacity'].forEach(k => pList.innerHTML += createCard(k, UPGRADES[k], false));
    if (eList) ['echoSpeed', 'echoRange', 'echoDurability', 'echoCapacity'].forEach(k => eList.innerHTML += createCard(k, UPGRADES[k], true));
}

// --- GLOBAL UI ACTIONS ---

window.buyUpgrade = function (key) {
    // --- SECURITY CHECK ---
    if (!isNearNexus()) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('nexusNotif.connectionLost'), type: { color: '#ef4444' } }, t('nexusNotif.movedAway'));
        exitNexus();
        return;
    }

    const t = window.t || ((key) => key.split('.').pop());
    if (key.startsWith('echo')) {
        if (!echoRay) {
            showNotification({ name: t('nexusNotif.echoNotAvailable'), type: { color: '#ef4444' } }, "");
            Utils.playSound('playError');
            return;
        }
        if (!echoRay.attached) {
            showNotification({ name: t('nexusNotif.echoNotLinked'), type: { color: '#ef4444' } }, t('nexusNotif.linkToUpgrade'));
            Utils.playSound('playError');
            return;
        }
    }

    const data = UPGRADES[key]; const currentLvl = playerData.upgrades[key]; if (currentLvl >= data.max) return;
    const cost = GameRules.calculateUpgradeCost(data.baseCost, currentLvl);

    if (playerData.stardust >= cost) {
        playerData.stardust -= cost;
        playerData.upgrades[key]++;
        playerData.stats.totalSpentStardust += cost;
        Utils.playSound('playCash'); // Safe Sound
        player.updateUI();
        renderUpgrades();
        updateEchoDropdownUI();
        updateInventoryCount();
    } else {
        showNotification({ name: t('nexusNotif.insufficientCrystal'), type: { color: '#ef4444' } }, "");
        Utils.playSound('playError');
    }
};

window.sellItem = function (name, unitPrice, count) {
    // --- SECURITY CHECK ---
    if (!isNearNexus()) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('nexusNotif.connectionLost'), type: { color: '#ef4444' } }, t('nexusNotif.movedAway'));
        exitNexus();
        return;
    }

    const newItems = collectedItems.filter(i => i.name !== name);
    collectedItems.length = 0;
    newItems.forEach(i => collectedItems.push(i));

    const totalEarned = count * unitPrice;
    playerData.stardust += totalEarned;
    playerData.stats.totalStardust += totalEarned;
    Utils.playSound('playCash'); // Safe Sound
    player.updateUI();
    updateInventoryCount();
    renderMarket();
};

window.sellAll = function () {
    // --- SECURITY CHECK ---
    if (!isNearNexus()) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('nexusNotif.connectionLost'), type: { color: '#ef4444' } }, t('nexusNotif.movedAway'));
        exitNexus();
        return;
    }

    let total = 0; let toKeep = [];
    collectedItems.forEach(item => { if (item.type.value > 0) total += item.type.value; else toKeep.push(item); });
    if (total > 0) {
        collectedItems.length = 0;
        toKeep.forEach(i => collectedItems.push(i));

        playerData.stardust += total;
        playerData.stats.totalStardust += total;
        Utils.playSound('playCash'); // Safe Sound
        player.updateUI();
        updateInventoryCount();
        renderMarket();
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: `${total} ${t('nexusNotif.crystalEarned')}`, type: { color: '#fbbf24' } }, "");
    }
};

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.nexusOpen = nexusOpen;
    window.isNearNexus = isNearNexus;
    window.enterNexus = enterNexus;
    window.exitNexus = exitNexus;
    window.switchNexusTab = switchNexusTab;
    window.renderMarket = renderMarket;
    window.renderUpgrades = renderUpgrades;
}