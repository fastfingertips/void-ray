import Utils from '../utils.js';

/**
 * Void Ray - Nexus Entity (Main Base Station)
 * Wireframe tech-style station with rotating hexagonal layers.
 */

class Nexus {
    constructor() {
        this.x = GameRules.LOCATIONS.NEXUS.x;
        this.y = GameRules.LOCATIONS.NEXUS.y;
        this.radius = 300;
        this.rotation = 0;
        this.corePulse = 0; // For core animation
    }

    update() {
        this.rotation += 0.003; // Slow and technical rotation
        this.corePulse += 0.05;
    }

    // Helper: Polygon Drawer (For wireframe aesthetic)
    drawPoly(ctx, x, y, radius, sides) {
        if (sides < 3) return;
        ctx.beginPath();
        const a = (Math.PI * 2) / sides;
        for (let i = 0; i < sides; i++) {
            ctx.lineTo(x + radius * Math.cos(a * i), y + radius * Math.sin(a * i));
        }
        ctx.closePath();
        ctx.stroke();
    }

    draw(ctx) {
        // GET THEME COLOR
        let themeColor = "#38bdf8";
        let glowColor = "rgba(56, 189, 248, 0.8)";
        let dimColor = "rgba(56, 189, 248, 0.2)";

        if (window.gameSettings && window.gameSettings.themeColor) {
            themeColor = window.gameSettings.themeColor;

            // Create color variations
            if (typeof Utils !== 'undefined' && Utils.hexToRgba) {
                glowColor = Utils.hexToRgba(themeColor, 0.8);
                dimColor = Utils.hexToRgba(themeColor, 0.2);
            }
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. OUTER FIXED RING (Radar/Border Line)
        // Thin, dashed line - Wireframe aesthetic
        ctx.strokeStyle = dimColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // 2. OUTER ROTATING HEXAGON LAYER (Main Station Body)
        ctx.save();
        ctx.rotate(this.rotation);

        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = themeColor;

        // Main Hexagon
        this.drawPoly(ctx, 0, 0, 180, 6);

        // Inner Detail Hexagon (Thinner)
        ctx.strokeStyle = dimColor;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        this.drawPoly(ctx, 0, 0, 160, 6);

        // Corner Connections (Tech Lines)
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate((Math.PI / 3) * i);
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 2;

            // Inner-Outer connection lines
            ctx.beginPath();
            ctx.moveTo(160, 0);
            ctx.lineTo(180, 0);
            ctx.stroke();

            // Outward extending scaffold/panel (Empty rect instead of filled)
            ctx.fillStyle = dimColor;
            ctx.fillRect(180, -4, 15, 8);
            ctx.restore();
        }
        ctx.restore();

        // 3. INNER COUNTER-ROTATING SQUARE LAYER (Energy Reactor)
        ctx.save();
        ctx.rotate(-this.rotation * 1.5); // Rotates in opposite direction and slightly faster

        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = themeColor;

        // Main Square (Diamond stance)
        this.drawPoly(ctx, 0, 0, 100, 4);

        // Dots on Square Corners
        ctx.fillStyle = themeColor;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(100 * Math.cos(i * Math.PI / 2), 100 * Math.sin(i * Math.PI / 2), 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // 4. CENTER CORE (Pulsating Core)
        const pulseScale = 1 + Math.sin(this.corePulse) * 0.05;

        ctx.save();
        ctx.scale(pulseScale, pulseScale);

        // Core Background (Black, to mask lines behind)
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();

        // Core Frame (Technical Circle)
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 30;
        ctx.shadowColor = themeColor;
        ctx.stroke();

        // Inner Light Source
        ctx.fillStyle = "#e0f2fe"; // Center is always bright white/blue
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 5. DECORATIVE CROSS LINES (HUD Feel)
        ctx.strokeStyle = dimColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        // Thin crosshair lines extending in 4 directions
        ctx.moveTo(-220, 0); ctx.lineTo(-195, 0);
        ctx.moveTo(220, 0); ctx.lineTo(195, 0);
        ctx.moveTo(0, -220); ctx.lineTo(0, -195);
        ctx.moveTo(0, 220); ctx.lineTo(0, 195);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }
}

// Export for global access
window.Nexus = Nexus;