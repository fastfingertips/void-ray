/**
 * Void Ray - Window: Big Map (ES6 Module)
 */

// Window state
export let mapOpen = false;

// Big Map State (Zoom and Pan Control)
const bigMapState = {
    zoom: 1,
    targetZoom: 1, // Target Zoom (For soft transition)
    panX: 0,
    targetPanX: 0, // Target Pan X
    panY: 0,
    targetPanY: 0, // Target Pan Y
    isDragging: false,
    isTracking: false, // Tracking mode
    showTargets: false // Show Target Lines Mode (NEW)
};

function openMap() {
    mapOpen = true;
    window.mapOpen = true; // Sync with window
    document.getElementById('big-map-overlay').classList.add('active');
}

function closeMap() {
    mapOpen = false;
    window.mapOpen = false; // Sync with window
    document.getElementById('big-map-overlay').classList.remove('active');
}

function toggleMap() {
    if (mapOpen) {
        closeMap();
    } else {
        openMap();
    }
}

/**
 * Focuses the map on the PLAYER'S current position.
 * Calculates Pan values based on the player's position in the world and the zoom level.
 */
window.centerMapOnPlayer = function () {
    const canvas = document.getElementById('big-map-canvas');
    if (!canvas || typeof player === 'undefined' || typeof WORLD_SIZE === 'undefined') return;

    const container = canvas.parentElement;
    const cWidth = container.clientWidth;
    const cHeight = container.clientHeight;

    const margin = MAP_CONFIG.bigmap.margin;
    // We use targetZoom in target calculations for stability
    const baseScale = Math.min((cWidth - margin * 2) / WORLD_SIZE, (cHeight - margin * 2) / WORLD_SIZE);
    const scale = baseScale * bigMapState.targetZoom;

    // Set Target Pan values
    bigMapState.targetPanX = (WORLD_SIZE / 2 - player.x) * scale;
    bigMapState.targetPanY = (WORLD_SIZE / 2 - player.y) * scale;
}

/**
 * Toggles Player Tracking Mode
 */
window.toggleMapTracking = function () {
    bigMapState.isTracking = !bigMapState.isTracking;
    updateTrackButtonState();

    if (bigMapState.isTracking) {
        // Focus immediately when tracking starts, but only set the target for animated transition
        centerMapOnPlayer();
    }
}

/**
 * Toggles Target Line Mode (NEW)
 */
window.toggleMapTargets = function () {
    bigMapState.showTargets = !bigMapState.showTargets;
    updateTargetButtonState();
}

function updateTrackButtonState() {
    const btn = document.getElementById('btn-map-track');
    if (!btn) return;

    if (bigMapState.isTracking) {
        // UPDATE: CSS variables used instead of static sky (blue) colors
        btn.classList.remove('text-white', 'bg-white/10');
        // Active state style (Theme Color)
        btn.style.color = 'var(--hud-color)';
        btn.style.borderColor = 'var(--hud-color)';
        btn.style.backgroundColor = 'var(--hud-color-dim)';
        btn.style.boxShadow = '0 0 10px var(--hud-color-dim)';
    } else {
        // Passive state style (Reset)
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.style.backgroundColor = '';
        btn.style.boxShadow = '';

        btn.classList.add('text-white', 'bg-white/10');
    }
}

function updateTargetButtonState() {
    const btn = document.getElementById('btn-map-targets');
    if (!btn) return;

    if (bigMapState.showTargets) {
        // UPDATE: CSS variables used instead of static sky (blue) colors
        btn.classList.remove('text-white', 'bg-white/10');
        // Active state style (Theme Color)
        btn.style.color = 'var(--hud-color)';
        btn.style.borderColor = 'var(--hud-color)';
        btn.style.backgroundColor = 'var(--hud-color-dim)';
        btn.style.boxShadow = '0 0 10px var(--hud-color-dim)';
    } else {
        // Passive state style (Reset)
        btn.style.color = '';
        btn.style.borderColor = '';
        btn.style.backgroundColor = '';
        btn.style.boxShadow = '';

        btn.classList.add('text-white', 'bg-white/10');
    }
}

function initMapListeners(canvasElement, worldSize, onTargetSelected) {
    if (!canvasElement) return;

    let dragStartX = 0;
    let dragStartY = 0;
    let hasDragged = false;
    const coordsDisplay = document.getElementById('big-map-coords');

    // Zoom (Wheel) - Based on Mouse Position
    canvasElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = canvasElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // --- SOFT ZOOM SETTINGS ---
        const zoomSensitivity = 0.0008; // Lower sensitivity
        const oldZoom = bigMapState.targetZoom; // Perform calculation based on target zoom

        // Calculate new target zoom
        let newZoom = oldZoom + (e.deltaY * -zoomSensitivity * 2);
        newZoom = Math.min(Math.max(1, newZoom), 8); // Limits

        if (newZoom !== oldZoom) {
            const canvasCenterX = canvasElement.width / 2;
            const canvasCenterY = canvasElement.height / 2;
            const mouseRelX = mouseX - canvasCenterX;
            const mouseRelY = mouseY - canvasCenterY;

            const zoomFactor = newZoom / oldZoom;

            // Update Pan target to preserve mouse cursor position
            bigMapState.targetPanX = mouseRelX - (mouseRelX - bigMapState.targetPanX) * zoomFactor;
            bigMapState.targetPanY = mouseRelY - (mouseRelY - bigMapState.targetPanY) * zoomFactor;

            bigMapState.targetZoom = newZoom;

            // No need to disable tracking while zooming, the player may want to zoom focused on the ship
        }
    });

    // Start Dragging
    canvasElement.addEventListener('mousedown', (e) => {
        bigMapState.isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        hasDragged = false;

        // Stop tracking if the user pans the map manually
        if (bigMapState.isTracking) {
            bigMapState.isTracking = false;
            updateTrackButtonState();
        }
    });

    // Dragging and Coordinate Display
    window.addEventListener('mousemove', (e) => {
        // 1. Dragging Operation
        if (bigMapState.isDragging) {
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;

            // Both target and current are updated for immediate response during dragging
            bigMapState.panX += dx;
            bigMapState.panY += dy;
            bigMapState.targetPanX = bigMapState.panX;
            bigMapState.targetPanY = bigMapState.panY;

            dragStartX = e.clientX;
            dragStartY = e.clientY;
        }

        // 2. Coordinate Calculation
        if (mapOpen && coordsDisplay && e.target === canvasElement) {
            const rect = canvasElement.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const margin = MAP_CONFIG.bigmap.margin;
            const cWidth = canvasElement.width;
            const cHeight = canvasElement.height;

            // Show correct coordinates using the instantaneous zoom value (bigMapState.zoom)
            const baseScale = Math.min((cWidth - margin * 2) / worldSize, (cHeight - margin * 2) / worldSize);
            const finalScale = baseScale * bigMapState.zoom;

            const offsetX = (cWidth - worldSize * finalScale) / 2 + bigMapState.panX;
            const offsetY = (cHeight - worldSize * finalScale) / 2 + bigMapState.panY;

            const worldX = (mouseX - offsetX) / finalScale;
            const worldY = (mouseY - offsetY) / finalScale;

            if (worldX >= 0 && worldX <= worldSize && worldY >= 0 && worldY <= worldSize) {
                coordsDisplay.innerText = `${Math.floor(worldX)} : ${Math.floor(worldY)}`;
            } else {
                coordsDisplay.innerText = "- : -";
            }
        }
    });

    window.addEventListener('mouseup', (e) => {
        bigMapState.isDragging = false;

        if (!hasDragged && e.target === canvasElement) {
            // Logic for selecting target with click...
            const rect = canvasElement.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const margin = MAP_CONFIG.bigmap.margin;
            const cWidth = canvasElement.width;
            const cHeight = canvasElement.height;

            const baseScale = Math.min((cWidth - margin * 2) / worldSize, (cHeight - margin * 2) / worldSize);
            const finalScale = baseScale * bigMapState.zoom;

            const offsetX = (cWidth - worldSize * finalScale) / 2 + bigMapState.panX;
            const offsetY = (cHeight - worldSize * finalScale) / 2 + bigMapState.panY;

            const worldX = (clickX - offsetX) / finalScale;
            const worldY = (clickY - offsetY) / finalScale;

            if (worldX >= 0 && worldX <= worldSize && worldY >= 0 && worldY <= worldSize) {
                if (typeof onTargetSelected === 'function') {
                    onTargetSelected(worldX, worldY);
                }
            }
        }
    });
}

function drawBigMap(ctx, canvas, worldSize, entities, state) {
    const container = canvas.parentElement;

    // Update if canvas size has changed (Performance optimization)
    if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    } else {
        // If size hasn't changed, just clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // --- DYNAMIC THEME COLOR ---
    let themeColor = "#94d8c3";
    if (window.gameSettings && window.gameSettings.themeColor) {
        themeColor = window.gameSettings.themeColor;
    }
    const themeRgbaLow = (typeof Utils !== 'undefined' && Utils.hexToRgba) ? Utils.hexToRgba(themeColor, 0.1) : "rgba(148, 216, 195, 0.1)";
    const themeRgbaMid = (typeof Utils !== 'undefined' && Utils.hexToRgba) ? Utils.hexToRgba(themeColor, 0.3) : "rgba(148, 216, 195, 0.3)";
    const themeRgbaHigh = (typeof Utils !== 'undefined' && Utils.hexToRgba) ? Utils.hexToRgba(themeColor, 0.5) : "rgba(148, 216, 195, 0.5)";

    // --- INTERPOLATION (SOFT ZOOM/PAN) ---
    // Bring current values closer to target values by 10% (Lerp)
    const lerpSpeed = 0.1;

    bigMapState.zoom += (bigMapState.targetZoom - bigMapState.zoom) * lerpSpeed;
    bigMapState.panX += (bigMapState.targetPanX - bigMapState.panX) * lerpSpeed;
    bigMapState.panY += (bigMapState.targetPanY - bigMapState.panY) * lerpSpeed;

    // Ignore very small differences to prevent flickering
    if (Math.abs(bigMapState.targetZoom - bigMapState.zoom) < 0.001) bigMapState.zoom = bigMapState.targetZoom;
    // Tolerance for Pan can be slightly higher
    if (Math.abs(bigMapState.targetPanX - bigMapState.panX) < 0.1) bigMapState.panX = bigMapState.targetPanX;
    if (Math.abs(bigMapState.targetPanY - bigMapState.panY) < 0.1) bigMapState.panY = bigMapState.targetPanY;

    // --- TRACKING MODE ---
    // Update target continuously if tracking is open, it tracks smoothly thanks to lerp
    if (bigMapState.isTracking) {
        centerMapOnPlayer();
    }

    const margin = MAP_CONFIG.bigmap.margin;

    const baseScale = Math.min((canvas.width - margin * 2) / worldSize, (canvas.height - margin * 2) / worldSize);
    const scale = baseScale * bigMapState.zoom;

    const offsetX = (canvas.width - worldSize * scale) / 2 + bigMapState.panX;
    const offsetY = (canvas.height - worldSize * scale) / 2 + bigMapState.panY;

    // --- ZOOM LEVEL INDICATOR ---
    ctx.save();
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = themeRgbaHigh;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4;
    // It feels more natural to show the current visual zoom rather than the target zoom
    ctx.fillText(`ZOOM: ${bigMapState.zoom.toFixed(1)}x`, canvas.width - 20, 20);
    ctx.restore();

    // --- GRID SYSTEM ---
    const GRID_STEP_MAJOR = MAP_CONFIG.grid.major;
    const GRID_STEP_MINOR = MAP_CONFIG.grid.minor;

    ctx.save();
    ctx.beginPath();
    ctx.rect(offsetX, offsetY, worldSize * scale, worldSize * scale);
    ctx.clip();

    if (bigMapState.zoom > 2) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.lineWidth = 1;

        for (let x = 0; x <= worldSize; x += GRID_STEP_MINOR) {
            const screenX = offsetX + x * scale;
            ctx.moveTo(screenX, offsetY);
            ctx.lineTo(screenX, offsetY + worldSize * scale);
        }
        for (let y = 0; y <= worldSize; y += GRID_STEP_MINOR) {
            const screenY = offsetY + y * scale;
            ctx.moveTo(offsetX, screenY);
            ctx.lineTo(offsetX + worldSize * scale, screenY);
        }
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.strokeStyle = themeRgbaLow;
    ctx.lineWidth = 1;
    ctx.fillStyle = themeRgbaMid;
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (let x = 0; x <= worldSize; x += GRID_STEP_MAJOR) {
        const screenX = offsetX + x * scale;
        ctx.moveTo(screenX, offsetY);
        ctx.lineTo(screenX, offsetY + worldSize * scale);
        if (screenX > 0 && screenX < canvas.width)
            ctx.fillText((x / 1000) + "k", screenX + 2, offsetY + 2);
    }
    for (let y = 0; y <= worldSize; y += GRID_STEP_MAJOR) {
        const screenY = offsetY + y * scale;
        ctx.moveTo(offsetX, screenY);
        ctx.lineTo(offsetX + worldSize * scale, screenY);
        if (screenY > 0 && screenY < canvas.height)
            ctx.fillText((y / 1000) + "k", offsetX + 2, screenY + 2);
    }
    ctx.stroke();

    ctx.restore();

    ctx.strokeStyle = themeRgbaMid;
    ctx.lineWidth = 2;
    ctx.strokeRect(offsetX, offsetY, worldSize * scale, worldSize * scale);

    const px = offsetX + entities.player.x * scale;
    const py = offsetY + entities.player.y * scale;

    // Distance Rings
    ctx.save();
    ctx.translate(px, py);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    const rings = MAP_CONFIG.grid.rings;
    rings.forEach(r => {
        const rScaled = r * scale;
        ctx.beginPath();
        ctx.arc(0, 0, rScaled, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillText((r / 1000) + "km", 0, -rScaled - 2);
    });
    ctx.restore();

    // Player Radar
    ctx.beginPath();
    ctx.arc(px, py, entities.player.radarRadius * scale, 0, Math.PI * 2);
    ctx.shadowBlur = 10; ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
    ctx.strokeStyle = MAP_CONFIG.colors.radarStroke;
    ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = MAP_CONFIG.colors.radarArea; ctx.fill(); ctx.shadowBlur = 0;

    // Player Scan Area
    ctx.beginPath();
    ctx.arc(px, py, entities.player.scanRadius * scale, 0, Math.PI * 2);
    ctx.shadowBlur = 15; ctx.shadowColor = MAP_CONFIG.minimap.scanColor;
    ctx.strokeStyle = "rgba(16, 185, 129, 0.8)";
    ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = MAP_CONFIG.colors.scanArea; ctx.fill(); ctx.shadowBlur = 0;

    // Echo Radar
    if (entities.echoRay) {
        const ex = offsetX + entities.echoRay.x * scale;
        const ey = offsetY + entities.echoRay.y * scale;

        ctx.beginPath(); ctx.arc(ex, ey, entities.echoRay.radarRadius * scale, 0, Math.PI * 2);
        ctx.shadowBlur = 10; ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
        ctx.strokeStyle = MAP_CONFIG.colors.radarStroke; ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = MAP_CONFIG.colors.radarArea; ctx.fill();

        ctx.beginPath(); ctx.arc(ex, ey, entities.echoRay.scanRadius * scale, 0, Math.PI * 2);
        ctx.shadowBlur = 15; ctx.shadowColor = MAP_CONFIG.minimap.scanColor;
        ctx.strokeStyle = "rgba(16, 185, 129, 0.8)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = MAP_CONFIG.colors.scanArea; ctx.fill(); ctx.shadowBlur = 0;
    }

    // Planets
    entities.planets.forEach(p => {
        if (!p.collected) {
            const visibility = GameRules.getPlanetVisibility(p, entities.player, entities.echoRay);
            if (visibility === 0) return;

            ctx.beginPath();
            if (visibility === 1) ctx.fillStyle = "rgba(255,255,255,0.3)";
            else ctx.fillStyle = p.type.color;

            const drawRadius = Math.max(1.5, 2 * scale);
            ctx.arc(offsetX + p.x * scale, offsetY + p.y * scale, drawRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // --- SAFE ZONE (NEW) ---
    // Area covering Nexus and its surroundings
    const SAFE_ZONE_R = 1500;
    const nx = offsetX + entities.nexus.x * scale;
    const ny = offsetY + entities.nexus.y * scale;

    ctx.beginPath();
    ctx.arc(nx, ny, SAFE_ZONE_R * scale, 0, Math.PI * 2);
    ctx.strokeStyle = themeRgbaMid;
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = (typeof Utils !== 'undefined' && Utils.hexToRgba) ? Utils.hexToRgba(themeColor, 0.05) : "rgba(148, 216, 195, 0.05)";
    ctx.fill();

    // Bases
    const drawBaseIcon = (entity, color, label) => {
        const bx = offsetX + entity.x * scale;
        const by = offsetY + entity.y * scale;

        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(bx, by, 10, 0, Math.PI * 2); ctx.stroke();

        if (bigMapState.zoom > 1.5) {
            ctx.fillStyle = "white";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(label, bx, by + 18);
        }
    };

    const t = window.t || ((key) => key.split('.').pop());
    drawBaseIcon(entities.nexus, MAP_CONFIG.colors.nexus, "NEXUS");
    if (entities.repairStation) drawBaseIcon(entities.repairStation, MAP_CONFIG.colors.repair, t('map.repair'));
    if (entities.storageCenter) drawBaseIcon(entities.storageCenter, MAP_CONFIG.colors.storage, t('map.storage'));

    // Wormholes (NEW)
    if (entities.wormholes) {
        entities.wormholes.forEach(w => {
            // NEW: Visibility Control (Radar Range)
            // Hidden by default, only drawn if within radar range
            let isVisible = false;

            // Is it within player radar?
            if (Utils.distEntity(entities.player, w) <= entities.player.radarRadius) {
                isVisible = true;
            }
            // Is it within Echo radar?
            else if (entities.echoRay && Utils.distEntity(entities.echoRay, w) <= entities.echoRay.radarRadius) {
                isVisible = true;
            }

            if (!isVisible) return;

            const wx = offsetX + w.x * scale;
            const wy = offsetY + w.y * scale;

            // Constant-sized visible icon
            const size = Math.max(4, 3 * scale);

            ctx.strokeStyle = GAME_CONFIG.WORMHOLE.COLOR_CORE || "#8b5cf6";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(wx, wy, size, 0, Math.PI * 2);
            ctx.stroke();

            // Center point
            ctx.fillStyle = GAME_CONFIG.WORMHOLE.COLOR_OUTER || "#c4b5fd";
            ctx.beginPath();
            ctx.arc(wx, wy, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    if (entities.echoRay) {
        ctx.fillStyle = MAP_CONFIG.colors.echo; ctx.beginPath(); ctx.arc(offsetX + entities.echoRay.x * scale, offsetY + entities.echoRay.y * scale, 4, 0, Math.PI * 2); ctx.fill();
    }

    // Player Icon
    ctx.save();
    ctx.translate(offsetX + entities.player.x * scale, offsetY + entities.player.y * scale);
    ctx.rotate(entities.player.angle + Math.PI / 2);
    ctx.fillStyle = MAP_CONFIG.colors.player;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 8); ctx.lineTo(-6, 8); ctx.fill();
    ctx.restore();

    // --- SCOUT (EXPLORATION) TARGET VISUALIZATION ---
    if (entities.player.scoutTarget) {
        const sx = offsetX + entities.player.scoutTarget.x * scale;
        const sy = offsetY + entities.player.scoutTarget.y * scale;
        const px = offsetX + entities.player.x * scale;
        const py = offsetY + entities.player.y * scale;

        // Route Line (Dashed, Turquoise)
        ctx.strokeStyle = "#67e8f9"; // Echo Rengi (Araştırma/Keşif teması)
        ctx.setLineDash([2, 8]);
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target Point
        ctx.fillStyle = "#67e8f9";
        ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();

        // Label (Visible when zoomed in)
        if (bigMapState.zoom > 0.8) {
            ctx.font = "9px monospace";
            ctx.fillStyle = "#67e8f9";
            ctx.fillText(t('map.scoutLabel'), sx + 6, sy);
        }
    }

    // Target Line (Manual Target)
    if (state.manualTarget) {
        const tx = offsetX + state.manualTarget.x * scale;
        const ty = offsetY + state.manualTarget.y * scale;

        ctx.strokeStyle = MAP_CONFIG.colors.target;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(offsetX + entities.player.x * scale, offsetY + entities.player.y * scale); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = MAP_CONFIG.colors.target;
        ctx.font = "10px monospace";
        ctx.fillText(`${t('map.targetLabel')} [${Math.floor(state.manualTarget.x / 1000)}:${Math.floor(state.manualTarget.y / 1000)}]`, tx + 10, ty);
    }

    // Echo Return Line
    if (entities.echoRay && entities.echoRay.mode === 'return') {
        const ex = offsetX + entities.echoRay.x * scale;
        const ey = offsetY + entities.echoRay.y * scale;
        const px = offsetX + entities.player.x * scale;
        const py = offsetY + entities.player.y * scale;

        ctx.strokeStyle = MAP_CONFIG.colors.echo;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -Date.now() / 20;

        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(px, py);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
    }

    // --- TARGET LINES VISUALIZATION ---
    if (bigMapState.showTargets) {
        // 1. Player Target (Dashed Line)
        if (entities.player.debugTarget) {
            const px = offsetX + entities.player.x * scale;
            const py = offsetY + entities.player.y * scale;
            const tx = offsetX + entities.player.debugTarget.x * scale;
            const ty = offsetY + entities.player.debugTarget.y * scale;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = MAP_CONFIG.colors.player;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([10, 10]);
            ctx.globalAlpha = 0.6;
            ctx.stroke();

            // Arrow Head
            const angle = Math.atan2(ty - py, tx - px);
            const headLen = 10;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI / 6), ty - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI / 6), ty - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
        }

        // 2. Echo Target (Dashed Line)
        if (entities.echoRay && entities.echoRay.debugTarget && !entities.echoRay.attached) {
            const ex = offsetX + entities.echoRay.x * scale;
            const ey = offsetY + entities.echoRay.y * scale;
            const tx = offsetX + entities.echoRay.debugTarget.x * scale;
            const ty = offsetY + entities.echoRay.debugTarget.y * scale;

            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = MAP_CONFIG.colors.echo;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([10, 10]);
            ctx.globalAlpha = 0.6;
            ctx.stroke();

            // Arrow Head
            const angle = Math.atan2(ty - ey, tx - ex);
            const headLen = 8;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI / 6), ty - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI / 6), ty - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
        }
    }
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.mapOpen = mapOpen;
    window.openMap = openMap;
    window.closeMap = closeMap;
    window.toggleMap = toggleMap;
    window.initMapListeners = initMapListeners;
    window.drawBigMap = drawBigMap;
    window.bigMapState = bigMapState;
}