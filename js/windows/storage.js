/**
 * Void Ray - Window: Storage (ES6 Module)
 */

export let storageOpen = false;

function openStorage() {
    storageOpen = true;
    const overlay = document.getElementById('storage-overlay');
    if (overlay) overlay.classList.add('open');
    renderStorageUI();
}

function closeStorage() {
    storageOpen = false;
    const overlay = document.getElementById('storage-overlay');
    if (overlay) overlay.classList.remove('open');
    hideTooltip();
}

/**
 * Renders the storage interface (Grid).
 */
function renderStorageUI() {
    if (!storageOpen) return;

    const shipListContainer = document.getElementById('storage-ship-list');
    const centerListContainer = document.getElementById('storage-center-list');
    const shipCap = document.getElementById('storage-ship-cap');
    const centerCount = document.getElementById('storage-center-count');

    // Update capacity information
    if (shipCap) shipCap.innerText = `${collectedItems.length} / ${GameRules.getPlayerCapacity()}`;
    const t = window.t || ((key) => key.split('.').pop());
    if (centerCount) centerCount.innerText = `${centralStorage.length} ${t('stats.items')}`;

    // renderGrid function comes from ui.js
    renderGrid(shipListContainer, collectedItems, GameRules.getPlayerCapacity(), (item) => {
        depositItem(item.name);
    });

    // Since central storage is unlimited, isUnlimited: true
    renderGrid(centerListContainer, centralStorage, 0, (item) => {
        withdrawItem(item.name);
    }, true);
}

/**
 * Deposits a batch of items into storage.
 * (Used by both Autopilot AI and manual buttons)
 */
function depositToStorage(sourceArray, sourceName) {
    if (sourceArray.length === 0) return;

    const count = sourceArray.length;
    // Tardigrades are not stored; they stay on the ship or get consumed. Filtering here.
    const itemsToStore = sourceArray.filter(i => i.type.id !== 'tardigrade');

    // Add items to central storage
    itemsToStore.forEach(item => centralStorage.push(item));

    // Empty the source array (operates on the original array since it's passed by reference)
    sourceArray.length = 0;

    // Safe Sound Call
    Utils.playSound('playCash');

    const t = window.t || ((key) => key.split('.').pop());
    showNotification({ name: `${sourceName}: ${count} ${t('storageNotif.itemsDeposited')}`, type: { color: '#a855f7' } }, "");

    // Update all relevant UIs
    updateInventoryCount();
    if (typeof inventoryOpen !== 'undefined' && inventoryOpen) renderInventory();
    if (typeof echoInvOpen !== 'undefined' && echoInvOpen) renderEchoInventory();
    if (storageOpen) renderStorageUI();
}

// --- GLOBAL UI ACTIONS (For buttons inside the window) ---

window.depositItem = function (name) {
    const index = collectedItems.findIndex(i => i.name === name);
    if (index !== -1) {
        const item = collectedItems.splice(index, 1)[0];
        centralStorage.push(item);
        renderStorageUI();
        updateInventoryCount();
    }
};

window.depositAllToStorage = function () {
    depositToStorage(collectedItems, "VOID RAY");
};

window.withdrawItem = function (name) {
    if (collectedItems.length >= GameRules.getPlayerCapacity()) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('storageNotif.shipFull'), type: { color: '#ef4444' } }, "");
        Utils.playSound('playError'); // Safe Sound
        return;
    }
    const index = centralStorage.findIndex(i => i.name === name);
    if (index !== -1) {
        const item = centralStorage.splice(index, 1)[0];
        collectedItems.push(item);
        renderStorageUI();
        updateInventoryCount();
    }
};

window.withdrawAllFromStorage = function () {
    const cap = GameRules.getPlayerCapacity();
    let moved = 0;

    // Withdraw until capacity is full or storage is empty
    while (centralStorage.length > 0 && collectedItems.length < cap) {
        collectedItems.push(centralStorage.pop());
        moved++;
    }

    const t = window.t || ((key) => key.split('.').pop());
    if (moved > 0) showNotification({ name: `${moved} ${t('storageNotif.itemsToShip')}`, type: { color: '#38bdf8' } }, "");
    else if (centralStorage.length > 0) {
        showNotification({ name: t('storageNotif.shipFull'), type: { color: '#ef4444' } }, "");
        Utils.playSound('playError'); // Safe Sound
    }

    renderStorageUI();
    updateInventoryCount();
};

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.storageOpen = storageOpen;
    window.openStorage = openStorage;
    window.closeStorage = closeStorage;
    window.renderStorageUI = renderStorageUI;
    window.depositToStorage = depositToStorage;
}