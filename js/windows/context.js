/**
 * Void Ray - Window: Context (ES6 Module)
 */

export var contextOpen = false;

let ctxEl = {
    overlay: null,
    speedFormula: null, speedVal: null,
    cargoFormula: null, cargoVal: null,
    sensorFormula: null, sensorVal: null,
    envStatus: null, envDetail: null,
    energyRate: null, energyState: null
};

function initContextSystem() {
    ctxEl.overlay = document.getElementById('context-overlay');
    if (!ctxEl.overlay) return;

    ctxEl.speedFormula = document.getElementById('ctx-speed-formula');
    ctxEl.speedVal = document.getElementById('ctx-speed-val');
    ctxEl.cargoFormula = document.getElementById('ctx-cargo-formula');
    ctxEl.cargoVal = document.getElementById('ctx-cargo-val');
    ctxEl.sensorFormula = document.getElementById('ctx-sensor-formula');
    ctxEl.sensorVal = document.getElementById('ctx-sensor-val');
    ctxEl.envStatus = document.getElementById('ctx-env-status');
    ctxEl.envDetail = document.getElementById('ctx-env-detail');
    ctxEl.energyRate = document.getElementById('ctx-energy-rate');
    ctxEl.energyState = document.getElementById('ctx-energy-state');
}

window.toggleContext = function () {
    if (!ctxEl.overlay) initContextSystem();
    contextOpen = !contextOpen;

    if (contextOpen) {
        ctxEl.overlay.classList.add('open');
        if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-context-icon', true);
        renderContext();
    } else {
        ctxEl.overlay.classList.remove('open');
        if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-context-icon', false);
    }
};

window.closeContext = function () {
    contextOpen = false;
    if (ctxEl.overlay) ctxEl.overlay.classList.remove('open');
    if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-context-icon', false);
};

/**
 * Updates context window data in real-time.
 * This function is called from the game loop in game.js.
 */
function renderContext() {
    if (!contextOpen || !player || !ctxEl.overlay) return;

    // 1. SPEED ANALYSIS - DETAILED
    const isBoosting = keys[" "] && player.energy > 0;
    const baseSpeed = 10;
    const boostVal = isBoosting ? 8 : 0;
    const upgradeMult = 1 + (playerData.upgrades.playerSpeed * 0.15);

    // Actual physical speed
    const rawMaxSpeed = (baseSpeed + boostVal) * upgradeMult;

    // x10 calibration for HUD (User visible value)
    const hudMaxSpeed = Math.floor(rawMaxSpeed * 10);

    let boostStyle = isBoosting ? "color:#34d399; font-weight:bold;" : "color:#64748b;";
    const t = window.t || ((key) => key.split('.').pop());
    let boostText = isBoosting ? `${t('context.active')} (+${boostVal})` : `${t('context.passive')} (+0)`;

    if (ctxEl.speedFormula) {
        ctxEl.speedFormula.innerHTML = `
            <div style="display:flex; justify-content:space-between; color:#94a3b8;">
                <span>${t('context.baseSpeed')}:</span> <span>${baseSpeed}</span>
            </div>
            <div style="display:flex; justify-content:space-between; ${boostStyle}">
                <span>${t('context.boostPower')}:</span> <span>${boostText}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#38bdf8;">
                <span>${t('context.engineUpgrade')}:</span> <span>x${upgradeMult.toFixed(2)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#a855f7; border-top:1px solid rgba(255,255,255,0.1); margin-top:2px; padding-top:2px;">
                <span>${t('context.displayCalibration')}:</span> <span>x10</span>
            </div>
            <div style="display:flex; justify-content:space-between; color:#fff; font-weight:bold; margin-top:4px;">
                <span>${t('context.resultHUD')}:</span> <span>${hudMaxSpeed} KM/S</span>
            </div>
        `;
    }
    if (ctxEl.speedVal) ctxEl.speedVal.innerText = `${hudMaxSpeed} KM/S`;

    // 2. CARGO
    const baseCap = 150;
    const addedCap = playerData.upgrades.playerCapacity * 25;
    const totalCap = baseCap + addedCap;
    const currentLoad = collectedItems.length;
    let loadColor = currentLoad >= totalCap ? "text-red-500" : "text-white";

    if (ctxEl.cargoFormula) ctxEl.cargoFormula.innerHTML = `Base [${baseCap}] + Ext [${addedCap}]`;
    if (ctxEl.cargoVal) ctxEl.cargoVal.innerHTML = `<span class="${loadColor}">${currentLoad}</span> / ${totalCap}`;

    // 3. SENSOR
    const baseRange = 4000;
    const magnetMult = 1 + (playerData.upgrades.playerMagnet * 0.1);
    const finalRange = baseRange * magnetMult;

    if (ctxEl.sensorFormula) ctxEl.sensorFormula.innerHTML = `Base [${baseRange}] x Mag [${magnetMult.toFixed(1)}]`;
    if (ctxEl.sensorVal) ctxEl.sensorVal.innerText = `${Math.floor(finalRange)} km`;

    // 4. ENVIRONMENT
    // Access global nexus variable from game.js
    // Utils update:
    const distToNexus = Utils.distEntity(player, nexus);
    const isOutOfBounds = player.x < 0 || player.x > WORLD_SIZE || player.y < 0 || player.y > WORLD_SIZE;

    if (ctxEl.envStatus) {
        if (isOutOfBounds) {
            ctxEl.envStatus.innerText = t('context.radiation');
            ctxEl.envStatus.className = "ctx-val text-red-500 blink text-sm";

            const dmg = GameRules.calculateRadiationDamage(player.outOfBoundsTimer).toFixed(2);
            ctxEl.envDetail.innerText = `${t('context.damage')}: -${dmg}/tick`;
        } else if (distToNexus < 1500) {
            ctxEl.envStatus.innerText = t('context.safe');
            ctxEl.envStatus.className = "ctx-val text-sky-400 text-sm";
            ctxEl.envDetail.innerText = t('context.nexusProtection');
        } else {
            ctxEl.envStatus.innerText = t('context.space');
            ctxEl.envStatus.className = "ctx-val text-gray-300 text-sm";
            ctxEl.envDetail.innerText = t('context.normalLevel');
        }
    }

    // 5. ENERGY
    let flowRate = 0; let stateText = t('context.waiting'); let flowClass = "text-gray-400";
    const REGEN_PER_SEC = (0.01 * 60).toFixed(2);
    const MOVE_COST_PER_SEC = (0.002 * 60).toFixed(2);
    const BOOST_COST_PER_SEC = (0.05 * 60).toFixed(2);

    if (isBoosting) {
        flowRate = -BOOST_COST_PER_SEC; stateText = t('context.overload'); flowClass = "text-red-400";
    } else if (Math.hypot(player.vx, player.vy) > 0.1) {
        let net = (parseFloat(REGEN_PER_SEC) - parseFloat(MOVE_COST_PER_SEC)).toFixed(2);
        flowRate = "+" + net; stateText = t('context.active'); flowClass = "text-yellow-400";
    } else {
        flowRate = "+" + REGEN_PER_SEC; stateText = t('context.charging'); flowClass = "text-emerald-400";
    }
    if (ctxEl.energyRate) {
        ctxEl.energyRate.innerText = `${flowRate} /s`;
        ctxEl.energyRate.className = `ctx-val ${flowClass}`;
    }
    if (ctxEl.energyState) ctxEl.energyState.innerText = stateText;
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.contextOpen = contextOpen;
    window.initContextSystem = initContextSystem;
    window.renderContext = renderContext;
}