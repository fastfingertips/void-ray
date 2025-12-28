/**
 * Void Ray - Window: Echo Inventory (ES6 Module)
 */

// Window state
export let echoInvOpen = false;

function updateEchoDropdownUI() {
    document.querySelectorAll('.echo-menu-item').forEach(el => el.classList.remove('active-mode'));

    const rateDisp = document.getElementById('echo-rate-disp');
    if (rateDisp) {
        const t = window.t || ((key) => key.split('.').pop());
        let rateText = t('hud.collectRateNormal') || "Normal";
        if (playerData.upgrades.echoSpeed >= 2) rateText = t('hud.collectRateFast') || "Fast";
        if (playerData.upgrades.echoSpeed >= 4) rateText = t('hud.collectRateTurbo') || "Turbo";
        rateDisp.innerText = t('hud.collectRate') + ": " + rateText;
    }

    if (!echoRay) return;

    if (echoRay.attached) document.getElementById('menu-merge').classList.add('active-mode');
    else if (echoRay.mode === 'return') document.getElementById('menu-return').classList.add('active-mode');
    else if (echoRay.mode === 'recharge') { /* Recharge */ }
    else if (echoRay.mode === 'deposit_storage') { /* Storage */ }
    else document.getElementById('menu-roam').classList.add('active-mode');
}

function openEchoInventory() {
    if (!echoRay) return;

    if (!echoRay.attached) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('echoNotif.noConnection'), type: { color: '#ef4444' } }, t('echoNotif.linkToAccess'));
        Utils.playSound('playError');
        return;
    }

    echoInvOpen = true;
    document.getElementById('echo-inventory-overlay').classList.add('open');
    renderEchoInventory();
}

function closeEchoInventory() {
    echoInvOpen = false;
    document.getElementById('echo-inventory-overlay').classList.remove('open');
    hideTooltip();
}

function renderEchoInventory() {
    if (!echoRay || !echoInvOpen) return;

    const playerContainer = document.getElementById('echo-player-grid');
    const echoContainer = document.getElementById('echo-storage-grid');
    const playerCapLabel = document.getElementById('echo-player-cap');
    const echoCapLabel = document.getElementById('echo-storage-cap');

    const pCap = GameRules.getPlayerCapacity();
    const eCap = GameRules.getEchoCapacity();

    if (playerCapLabel) playerCapLabel.innerText = `${collectedItems.length} / ${pCap}`;
    if (echoCapLabel) echoCapLabel.innerText = `${echoRay.lootBag.length} / ${eCap}`;

    // renderGrid -> ui.js
    renderGrid(playerContainer, collectedItems, pCap, (item) => {
        transferToEcho(item);
    });

    renderGrid(echoContainer, echoRay.lootBag, eCap, (item) => {
        transferToPlayer(item);
    });
}

// Global Transfer Functions (for Echo)
window.transferToEcho = function (item) {
    if (!echoRay) return;
    if (echoRay.lootBag.length >= GameRules.getEchoCapacity()) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('echoNotif.echoFull'), type: { color: '#ef4444' } }, "");
        Utils.playSound('playError');
        return;
    }
    const idx = collectedItems.indexOf(item);
    if (idx > -1) {
        collectedItems.splice(idx, 1);
        echoRay.lootBag.push(item);
        renderEchoInventory();
        updateInventoryCount();
    }
}

window.transferToPlayer = function (item) {
    if (collectedItems.length >= GameRules.getPlayerCapacity()) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('echoNotif.shipFull'), type: { color: '#ef4444' } }, "");
        Utils.playSound('playError');
        return;
    }
    const idx = echoRay.lootBag.indexOf(item);
    if (idx > -1) {
        echoRay.lootBag.splice(idx, 1);

        if (item.type.id === 'tardigrade') {
            const t = window.t || ((key) => key.split('.').pop());
            player.energy = Math.min(player.energy + 50, player.maxEnergy);
            const xp = GameRules.calculatePlanetXp(item.type);
            player.gainXp(xp);
            showNotification({ name: t('echoNotif.tardigradeUsed'), type: { color: '#C7C0AE' } }, "");
        } else {
            collectedItems.push(item);
        }

        renderEchoInventory();
        updateInventoryCount();
    }
}

window.transferAllToEcho = function () {
    if (!echoRay) return;
    const eCap = GameRules.getEchoCapacity();
    let movedCount = 0;

    while (echoRay.lootBag.length < eCap && collectedItems.length > 0) {
        const item = collectedItems.shift();
        echoRay.lootBag.push(item);
        movedCount++;
    }

    const t = window.t || ((key) => key.split('.').pop());
    if (movedCount > 0) {
        showNotification({ name: `${movedCount} ${t('echoNotif.itemsTransferred')}`, type: { color: '#67e8f9' } }, "");
        Utils.playSound('playCash');
    } else {
        if (collectedItems.length > 0) {
            showNotification({ name: t('echoNotif.echoFull'), type: { color: '#ef4444' } }, "");
            Utils.playSound('playError');
        }
        else {
            showNotification({ name: t('echoNotif.shipEmpty'), type: { color: '#ef4444' } }, "");
            Utils.playSound('playError');
        }
    }

    renderEchoInventory();
    updateInventoryCount();
};

window.transferAllToPlayer = function () {
    if (!echoRay) return;
    const pCap = GameRules.getPlayerCapacity();
    let movedCount = 0;

    while (echoRay.lootBag.length > 0) {
        const nextItem = echoRay.lootBag[0];
        if (nextItem.type.id !== 'tardigrade' && collectedItems.length >= pCap) {
            const t = window.t || ((key) => key.split('.').pop());
            showNotification({ name: t('echoNotif.shipFull'), type: { color: '#ef4444' } }, "");
            Utils.playSound('playError');
            break;
        }

        const item = echoRay.lootBag.shift();

        if (item.type.id === 'tardigrade') {
            const t = window.t || ((key) => key.split('.').pop());
            player.energy = Math.min(player.energy + 50, player.maxEnergy);
            const xp = GameRules.calculatePlanetXp(item.type);
            player.gainXp(xp);
            showNotification({ name: t('echoNotif.tardigradeUsed'), type: { color: '#C7C0AE' } }, "");
        } else {
            collectedItems.push(item);
            movedCount++;
        }
    }

    if (movedCount > 0) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: `${movedCount} ${t('echoNotif.itemsReceived')}`, type: { color: '#38bdf8' } }, "");
        Utils.playSound('playCash');
    }

    renderEchoInventory();
    updateInventoryCount();
};

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.echoInvOpen = echoInvOpen;
    window.updateEchoDropdownUI = updateEchoDropdownUI;
    window.openEchoInventory = openEchoInventory;
    window.closeEchoInventory = closeEchoInventory;
    window.renderEchoInventory = renderEchoInventory;
}