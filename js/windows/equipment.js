/**
 * Void Ray - Window: Equipment (ES6 Module)
 */

export let equipmentOpen = false;

// Equipment Slot Definitions (Technical Symbols)
const EQUIPMENT_SLOTS = {
    shield: { id: 'shield', label: 'SHIELD', icon: '◊' },   // Diamond
    engine: { id: 'engine', label: 'ENGINE', icon: '▲' },    // Triangle
    weaponL: { id: 'weapon_l', label: 'WEAPON L', icon: '⌖' }, // Crosshair
    weaponR: { id: 'weapon_r', label: 'WEAPON R', icon: '⌖' }, // Crosshair
    sensor: { id: 'sensor', label: 'SENSOR', icon: '◎' },    // Bullseye
    hull: { id: 'hull', label: 'HULL', icon: '⬢' }         // Hexagon
};

function toggleEquipment() {
    if (equipmentOpen) closeEquipment();
    else openEquipment();
}

function openEquipment() {
    equipmentOpen = true;
    const overlay = document.getElementById('equipment-overlay');
    if (overlay) {
        overlay.classList.add('open');
        // NEW: Bring window to front
        const win = overlay.querySelector('.equipment-window');
        if (win && typeof bringWindowToFront === 'function') {
            bringWindowToFront(win);
        }
    }

    if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-equip-icon', true);

    renderEquipment();
}

function closeEquipment() {
    equipmentOpen = false;
    const overlay = document.getElementById('equipment-overlay');
    if (overlay) overlay.classList.remove('open');

    if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-equip-icon', false);
    hideTooltip();
}

function renderEquipment() {
    if (!equipmentOpen) return;

    // Update slots
    Object.keys(EQUIPMENT_SLOTS).forEach(key => {
        const slotData = EQUIPMENT_SLOTS[key];
        const wrapperEl = document.getElementById(`slot-${slotData.id}`);

        if (wrapperEl) {
            const oldSlotEl = wrapperEl.querySelector('.equip-slot');

            if (oldSlotEl) {
                const newSlotEl = oldSlotEl.cloneNode(true);
                oldSlotEl.parentNode.replaceChild(newSlotEl, oldSlotEl);

                const iconEl = newSlotEl.querySelector('.slot-icon');
                const item = playerData.equipment ? playerData.equipment[key] : null;

                if (item) {
                    newSlotEl.classList.add('filled');
                    if (iconEl) iconEl.innerText = item.icon || slotData.icon;

                    if (item.type && item.type.color) {
                        const color = item.type.color;
                        newSlotEl.style.borderColor = color;
                        newSlotEl.style.boxShadow = `0 0 15px ${color}`;

                        if (typeof Utils !== 'undefined' && Utils.hexToRgba) {
                            newSlotEl.style.background = Utils.hexToRgba(color, 0.15);
                        }

                        if (iconEl) {
                            iconEl.style.color = "#fff";
                            iconEl.style.textShadow = `0 0 10px ${color}`;
                        }
                    }

                    newSlotEl.onmouseenter = (e) => showTooltip(e, item);
                    newSlotEl.onclick = () => unequipItem(key);

                } else {
                    newSlotEl.classList.remove('filled');

                    newSlotEl.style.borderColor = '';
                    newSlotEl.style.boxShadow = '';
                    newSlotEl.style.background = '';

                    if (iconEl) {
                        iconEl.innerText = slotData.icon;
                        iconEl.style.color = '';
                        iconEl.style.textShadow = '';
                    }

                    const t = window.t || ((key) => key.split('.').pop());
                    newSlotEl.onmouseenter = (e) => showInfoTooltip(e, `${slotData.label}: ${t('equipNotif.slotEmpty')}`);
                    newSlotEl.onclick = null;
                }

                newSlotEl.onmouseleave = hideTooltip;
            }
        }
    });

    updateEquipmentStats();
}

function updateEquipmentStats() {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    let totalSpeed = 0;
    let totalHull = 0;

    if (playerData.equipment) {
        Object.values(playerData.equipment).forEach(item => {
            if (item && item.stats) {
                item.stats.forEach(stat => {
                    if (stat.id === 'thrust' || stat.id === 'speed') totalSpeed += stat.val;
                    if (stat.id === 'hull_hp') totalHull += stat.val;
                });
            }
        });
    }

    setVal('estat-atk', '0');
    setVal('estat-def', totalHull);
    setVal('estat-spd', Math.floor(playerData.stats.maxSpeed * 10) + ` (+${totalSpeed})`);
    setVal('estat-nrg', Math.floor(player.maxEnergy));
}

// --- ITEM MANAGEMENT ---

window.equipItem = function (item) {
    const t = window.t || ((key) => key.split('.').pop());
    if (!item || item.category !== 'equipment') {
        showNotification({ name: t('equipNotif.warning'), type: { color: '#f59e0b' } }, t('equipNotif.cannotEquip'));
        return;
    }

    let targetSlotKey = item.slot;

    if (targetSlotKey === 'weapon') {
        if (!playerData.equipment.weaponL) targetSlotKey = 'weaponL';
        else if (!playerData.equipment.weaponR) targetSlotKey = 'weaponR';
        else targetSlotKey = 'weaponL';
    }

    const invIndex = collectedItems.indexOf(item);
    if (invIndex === -1) return;
    collectedItems.splice(invIndex, 1);

    const currentItem = playerData.equipment[targetSlotKey];
    if (currentItem) {
        collectedItems.push(currentItem);
    }

    playerData.equipment[targetSlotKey] = item;

    Utils.playSound('playChime', { id: 'rare' });
    showNotification({ name: t('equipNotif.systemUpdated'), type: { color: '#10b981' } }, item.name + " " + t('equipNotif.equipped'));

    if (typeof renderInventory === 'function') renderInventory();
    if (typeof updateInventoryCount === 'function') updateInventoryCount();

    if (equipmentOpen) renderEquipment();
};

window.unequipItem = function (slotKey) {
    const item = playerData.equipment[slotKey];
    if (!item) return;

    if (GameRules.isInventoryFull(collectedItems.length)) {
        const t = window.t || ((key) => key.split('.').pop());
        showNotification({ name: t('equipNotif.error'), type: { color: '#ef4444' } }, t('equipNotif.inventoryFull'));
        Utils.playSound('playError');
        return;
    }

    playerData.equipment[slotKey] = null;
    collectedItems.push(item);

    Utils.playSound('playChime', { id: 'common' });

    if (typeof renderInventory === 'function') renderInventory();
    if (typeof updateInventoryCount === 'function') updateInventoryCount();
    renderEquipment();
};

window.openEquipment = openEquipment;
window.closeEquipment = closeEquipment;
window.toggleEquipment = toggleEquipment;
window.renderEquipment = renderEquipment;
window.equipmentOpen = equipmentOpen;