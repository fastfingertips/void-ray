import Utils from './utils.js';

/**
 * Void Ray - Map and Radar Utilities
 * Common drawing functions for minimap and full map.
 */

// getPlanetVisibility function is now in GameRules.
// We can define an alias for backward compatibility or call directly from GameRules.
// Direct GameRules usage is done in game.js and ui.js.

/**
 * Draws target indicator.
 * FIX: Removed misunderstood name label feature.
 */
function drawTargetIndicator(ctx, origin, view, target, color) {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;

    const screenHalfW = (view.width / view.zoom) / 2;
    const screenHalfH = (view.height / view.zoom) / 2;

    // Only draw if offscreen
    if (Math.abs(dx) > screenHalfW || Math.abs(dy) > screenHalfH) {
        const angle = Math.atan2(dy, dx);

        // Clamp to screen edge
        const borderW = screenHalfW * 0.9;
        const borderH = screenHalfH * 0.9;

        let tx, ty;

        // Clamp to rectangular bounds - More precise corner calculation
        const absCos = Math.abs(Math.cos(angle));
        const absSin = Math.abs(Math.sin(angle));

        // If angle is closer to horizontal axis (right/left edge)
        if (borderW * absSin < borderH * absCos) {
            tx = Math.sign(Math.cos(angle)) * borderW;
            ty = tx * Math.tan(angle);
        } else {
            // If angle is closer to vertical axis (top/bottom edge)
            ty = Math.sign(Math.sin(angle)) * borderH;
            tx = ty / Math.tan(angle);
        }

        const screenX = view.width / 2 + tx * view.zoom;
        const screenY = view.height / 2 + ty * view.zoom;
        const distKM = Math.round(Math.hypot(dx, dy) / 100);

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Identity matrix (screen coordinates)
        ctx.translate(screenX, screenY);

        // Draw arrow (facing target)
        ctx.rotate(angle + Math.PI / 2);

        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;

        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(6, 6);
        ctx.lineTo(-6, 6);
        ctx.fill();

        // Text Drawing (Cancel rotation and position towards center)
        ctx.rotate(-(angle + Math.PI / 2));

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 10px monospace";

        // Text Position: "inner" side of arrow (towards center)
        const textDist = 25;
        const textX = Math.cos(angle + Math.PI) * textDist;
        const textY = Math.sin(angle + Math.PI) * textDist;

        // Distance
        ctx.fillStyle = color;
        ctx.fillText(distKM + "km", textX, textY);

        ctx.restore();
    }
}

/**
 * Minimap drawing
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} entities - Game entities
 * @param {object} state - Game state
 * @param {object} origin - CENTER coordinates of the map (Camera Focus)
 * @param {object} [refEntity] - (Optional) REFERENCE entity for radar range and angle (Player/Echo)
 */
function drawMiniMap(ctx, entities, state, origin, refEntity) {
    // If refEntity not given and origin is an entity, use it, otherwise use player
    const reference = refEntity || (origin.radarRadius ? origin : entities.player);
    // Get center coordinates from origin
    const centerPos = origin || entities.player;

    const size = MAP_CONFIG.minimap.size;
    const radius = MAP_CONFIG.minimap.radius;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.beginPath(); ctx.arc(radius, radius, radius, 0, Math.PI * 2); ctx.clip();

    ctx.fillStyle = MAP_CONFIG.minimap.bg;
    ctx.fill();

    // Scaling is done according to REFERENCE entity's radar range
    // If radarRadius is undefined (error case), use default 10000
    const safeRadarRadius = reference.radarRadius || 10000;
    const scale = radius / safeRadarRadius;
    const cx = radius, cy = radius;

    // Scan Area Circle
    const scanPixelRadius = (reference.scanRadius || 4000) * scale;
    ctx.lineWidth = 1;
    ctx.strokeStyle = MAP_CONFIG.minimap.scanColor;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(cx, cy, scanPixelRadius, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // --- DRAW OTHER ENTITIES ---

    // Player (If reference is not Player, e.g., in Echo camera)
    if (entities.player && reference !== entities.player) {
        const px = (entities.player.x - centerPos.x) * scale + cx;
        const py = (entities.player.y - centerPos.y) * scale + cy;
        // Utils update:
        if (Utils.dist(px, py, cx, cy) < radius) {
            ctx.fillStyle = MAP_CONFIG.colors.player;
            ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Echo (If reference is not Echo)
    if (entities.echoRay && reference !== entities.echoRay) {
        const ex = (entities.echoRay.x - centerPos.x) * scale + cx;
        const ey = (entities.echoRay.y - centerPos.y) * scale + cy;
        // Utils update:
        if (Utils.dist(ex, ey, cx, cy) < radius) {
            ctx.fillStyle = MAP_CONFIG.colors.echo;
            ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Bases
    const drawBase = (entity, color) => {
        const bx = (entity.x - centerPos.x) * scale + cx;
        const by = (entity.y - centerPos.y) * scale + cy;
        // Utils update:
        if (Utils.dist(bx, by, cx, cy) < radius) {
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(bx, by, 3.5, 0, Math.PI * 2); ctx.fill();
        }
    }

    drawBase(entities.nexus, MAP_CONFIG.colors.nexus);
    if (entities.repairStation) drawBase(entities.repairStation, MAP_CONFIG.colors.repair);
    if (entities.storageCenter) drawBase(entities.storageCenter, MAP_CONFIG.colors.storage);

    // Wormholes
    if (entities.wormholes) {
        entities.wormholes.forEach(w => {
            const wx = (w.x - centerPos.x) * scale + cx;
            const wy = (w.y - centerPos.y) * scale + cy;

            // Is it within radar?
            if (Utils.dist(wx, wy, cx, cy) < radius) {
                ctx.strokeStyle = GAME_CONFIG.WORMHOLE.COLOR_CORE || "#8b5cf6";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }

    // Planets
    entities.planets.forEach(p => {
        if (!p.collected) {
            let px = (p.x - centerPos.x) * scale + cx;
            let py = (p.y - centerPos.y) * scale + cy;

            // Utils update:
            if (Utils.dist(px, py, cx, cy) < radius) {
                const visibility = GameRules.getPlanetVisibility(p, entities.player, entities.echoRay);
                if (visibility === 1) ctx.fillStyle = "rgba(255,255,255,0.3)";
                else if (visibility === 2) ctx.fillStyle = p.type.color;
                else return;
                ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
            }
        }
    });

    // Target Line
    if (state.manualTarget) {
        const tx = (state.manualTarget.x - centerPos.x) * scale + cx;
        const ty = (state.manualTarget.y - centerPos.y) * scale + cy;
        // Utils update:
        const distToTarget = Utils.dist(tx, ty, cx, cy);
        const angle = Math.atan2(ty - cy, tx - cx);

        ctx.strokeStyle = MAP_CONFIG.colors.target; ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
        ctx.beginPath(); ctx.moveTo(cx, cy);
        const drawDist = Math.min(distToTarget, radius);
        ctx.lineTo(cx + Math.cos(angle) * drawDist, cy + Math.sin(angle) * drawDist);
        ctx.stroke(); ctx.setLineDash([]);
    }

    // --- CENTER ICON (ACCORDING TO REFERENCE ENTITY) ---
    ctx.translate(cx, cy);
    // Rotate according to reference entity's angle
    ctx.rotate((reference.angle || 0) + Math.PI / 2);

    // Determine color based on reference entity
    const centerColor = (reference === entities.echoRay) ? MAP_CONFIG.colors.echo : MAP_CONFIG.colors.player;
    ctx.fillStyle = centerColor;

    ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(-4, 5); ctx.lineTo(4, 5); ctx.fill();

    ctx.restore();
}

// Export for global access
window.drawTargetIndicator = drawTargetIndicator;
window.drawMiniMap = drawMiniMap;