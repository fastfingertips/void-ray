/**
 * Void Ray - Window: Inventory (ES6 Module)
 */

export let inventoryOpen = false;
let currentInvPage = 1;
const TOTAL_PAGES = 3;
const SLOTS_PER_PAGE = 50;

export function updateInventoryCount() {
    const badge = document.getElementById('inv-total-badge');
    const count = collectedItems.length;
    const capacity = GameRules.getPlayerCapacity();

    if (badge) {
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';

        if (count >= capacity) {
            badge.style.background = '#ef4444';
            badge.style.color = '#fff';
        } else if (count >= capacity * 0.9) {
            badge.style.background = '#f59e0b';
            badge.style.color = '#000';
        } else {
            badge.style.background = '#fff';
            badge.style.color = '#000';
        }
    }
}

window.switchInventoryPage = function (pageNum) {
    if (pageNum < 1 || pageNum > TOTAL_PAGES) return;
    currentInvPage = pageNum;
    renderInventory();
}

function renderInventory() {
    if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-inv-icon', true);

    const gridContainer = document.getElementById('inv-grid-content');
    if (!gridContainer) return;

    const invHeader = document.querySelector('.inv-header');
    const totalCapacity = GameRules.getPlayerCapacity();
    const count = collectedItems.length;
    const startSlotIndex = (currentInvPage - 1) * SLOTS_PER_PAGE;
    const capColor = count >= totalCapacity ? '#ef4444' : (count >= totalCapacity * 0.9 ? '#f59e0b' : '#94a3b8');

    const t = window.t || ((key) => key.split('.').pop());
    if (invHeader) {
        invHeader.innerHTML = `
            <div class="inv-header-top">
                <div class="inv-title-main">${t('general.cargo')}</div>
                <div class="ui-close-btn" id="btn-dyn-close-inv">✕</div>
            </div>
            <div class="inv-info-row">
                <div class="inv-cap-text"><span style="color:${capColor}; font-weight:bold;">${count}</span> / ${totalCapacity}</div>
                <div class="inv-currency-box">
                    <span class="inv-currency-label">${t('resources.crystal')}</span>
                    <span class="inv-currency-val">${playerData.stardust}</span>
                </div>
            </div>
            `;

        // Add listener - timeout for DOM render
        setTimeout(() => {
            const closeBtn = invHeader.querySelector('#btn-dyn-close-inv');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (typeof closeInventory === 'function') closeInventory();
                });
            }
        }, 0);
    }

    // --- GRID GENERATION ---
    // We use renderGrid function from ui.js.
    renderGrid(gridContainer, collectedItems.slice(startSlotIndex, startSlotIndex + SLOTS_PER_PAGE), SLOTS_PER_PAGE, (item) => {
        // --- NEW: ITEM CLICK LOGIC ---
        if (item.category === 'equipment') {
            // If item is equipment and equipItem exists, call it
            if (typeof equipItem === 'function') {
                equipItem(item);
            } else {
                console.error("equipItem function not found! Is js/windows/equipment.js loaded?");
            }
        } else {
            const t = window.t || ((key) => key.split('.').pop());
            showNotification({ name: t('invNotif.rawMaterial'), type: { color: '#94a3b8' } }, t('invNotif.sellAtNexus'));
        }
    });

    let footer = document.getElementById('inv-footer-controls');
    if (!footer) {
        footer = document.createElement('div');
        footer.id = 'inv-footer-controls';
        footer.className = 'inv-footer';
        gridContainer.parentNode.appendChild(footer);
    }

    let footerHTML = '';
    for (let p = 1; p <= TOTAL_PAGES; p++) {
        const isActive = p === currentInvPage ? 'active' : '';
        footerHTML += `<div class="inv-page-btn ${isActive}" data-page="${p}">${p}</div>`;
    }
    footer.innerHTML = footerHTML;

    // Add listeners
    const pageBtns = footer.querySelectorAll('.inv-page-btn');
    pageBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.getAttribute('data-page'));
            if (typeof switchInventoryPage === 'function') switchInventoryPage(page);
        });
    });
}

function closeInventory() {
    inventoryOpen = false;
    window.inventoryOpen = false; // Sync with window
    document.getElementById('inventory-overlay').classList.remove('open');
    if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-inv-icon', false);
    hideTooltip();
}

function openInventory() {
    inventoryOpen = true;
    window.inventoryOpen = true; // Sync with window
    document.getElementById('inventory-overlay').classList.add('open');
    renderInventory();
}

function toggleInventory() {
    if (inventoryOpen) {
        closeInventory();
    } else {
        openInventory();
    }
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.inventoryOpen = inventoryOpen;
    window.updateInventoryCount = updateInventoryCount;
    window.renderInventory = renderInventory;
    window.closeInventory = closeInventory;
    window.openInventory = openInventory;
    window.toggleInventory = toggleInventory;
}