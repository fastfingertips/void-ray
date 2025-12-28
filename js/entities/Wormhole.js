import Utils from '../utils.js';

/**
 * Void Ray - Wormhole Entity
 * Spiral structures that teleport the player to random locations.
 */
class Wormhole {
    constructor(x, y) {
        // Create at random location if no position is provided
        if (x === undefined || y === undefined) {
            const margin = GAME_CONFIG.WORMHOLE.TELEPORT_SAFE_DISTANCE;
            // Random position within safe map boundaries
            this.x = Utils.random(margin, WORLD_SIZE - margin);
            this.y = Utils.random(margin, WORLD_SIZE - margin);
        } else {
            this.x = x;
            this.y = y;
        }

        this.radius = GAME_CONFIG.WORMHOLE.RADIUS;
        this.angle = 0;

        // Randomness for animation
        this.spinSpeed = GAME_CONFIG.WORMHOLE.SPIN_SPEED * (Math.random() > 0.5 ? 1 : -1);
        this.pulsePhase = Math.random() * Math.PI * 2;

        // For nested spirals
        this.spirals = [
            { offset: 0, speed: 1.0, color: GAME_CONFIG.WORMHOLE.COLOR_CORE },
            { offset: Math.PI / 3, speed: 0.7, color: GAME_CONFIG.WORMHOLE.COLOR_OUTER },
            { offset: Math.PI, speed: 0.5, color: "rgba(255,255,255,0.2)" }
        ];
    }

    update() {
        this.angle += this.spinSpeed;
        this.pulsePhase += 0.05;
    }

    draw(ctx, visibility = 2) {
        // Visibility control (Compatible with radar system)
        if (visibility === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // --- DEVELOPER MODE: GRAVITY FIELD VISUALIZATION ---
        if (window.gameSettings && window.gameSettings.developerMode && window.gameSettings.showGravityFields) {
            // Get gravity radius from config (Default 3500)
            const gravityRadius = GAME_CONFIG.WORMHOLE.GRAVITY_RADIUS || 3500;

            ctx.beginPath();
            ctx.arc(0, 0, gravityRadius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(139, 92, 246, 0.3)"; // Violet/Purple (Wormhole theme)
            ctx.lineWidth = 1;
            ctx.setLineDash([10, 10]); // Dashed line
            ctx.stroke();

            // Gravity field value and label
            ctx.fillStyle = "rgba(139, 92, 246, 0.8)";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`W-GRAVITY: ${gravityRadius}`, 0, gravityRadius + 15);

            ctx.setLineDash([]); // Reset line style
        }

        // 1. RADAR VIEW (Simple Icon)
        if (visibility === 1) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = GAME_CONFIG.WORMHOLE.COLOR_CORE;
            ctx.globalAlpha = 0.5;
            ctx.fill();

            // Spinning ring effect
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 1.5);
            ctx.strokeStyle = GAME_CONFIG.WORMHOLE.COLOR_OUTER;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
            return;
        }

        // 2. FULL VIEW (Detailed Spiral)

        // Pulsating (Breathing) effect
        const scale = 1 + Math.sin(this.pulsePhase) * 0.05;
        ctx.scale(scale, scale);

        // Outer Glow
        ctx.shadowBlur = 40 + Math.sin(this.pulsePhase) * 20;
        ctx.shadowColor = GAME_CONFIG.WORMHOLE.COLOR_CORE;

        // Draw Spirals
        this.spirals.forEach(spiral => {
            ctx.save();
            ctx.rotate(this.angle * spiral.speed + spiral.offset);

            ctx.beginPath();
            // Spiral math: r = a + b * theta
            const laps = 3;
            const points = 50;
            const maxAngle = Math.PI * 2 * laps;

            for (let i = 0; i <= points; i++) {
                const theta = (i / points) * maxAngle;
                const r = (i / points) * this.radius; // Radius increases progressively
                const x = r * Math.cos(theta);
                const y = r * Math.sin(theta);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }

            ctx.strokeStyle = spiral.color;
            // Line effect that thickens as it approaches the center
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
            ctx.stroke();
            ctx.restore();
        });

        // Black Hole at the Center (Event Horizon)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = "#000";
        ctx.shadowBlur = 0; // Center does not cast shadow, it absorbs
        ctx.fill();

        // Thin white ring around center (Photon sphere)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.22, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#fff";
        ctx.stroke();

        ctx.restore();
    }
}

// Export for global access
window.Wormhole = Wormhole;