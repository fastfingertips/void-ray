import Utils from '../utils.js';

/**
 * Void Ray - RepairStation Entity
 * Heals nearby players within range.
 */
class RepairStation {
    constructor() {
        this.x = GameRules.LOCATIONS.REPAIR_STATION.x;
        this.y = GameRules.LOCATIONS.REPAIR_STATION.y;
        this.radius = 150;
        this.rotation = 0;
    }

    update() {
        this.rotation -= 0.005;
        // Regenerate health if player is nearby
        // Utils update:
        const dist = Utils.distEntity(player, this);
        // It is assumed that the player object exists in the global scope (defined in game.js)
        if (dist < 300 && player.health < player.maxHealth) {
            player.health = Math.min(player.maxHealth, player.health + 0.5);
        }
    }

    draw(ctx) {
        // GET THEME COLOR (Repair station is usually green but can be dynamic)
        // Default: Green (#10b981 / Emerald-500)
        // Optional: Keeping repair station color static might be better (Green=Health).
        // However, since the request is to "replace static color codes in canvas drawings", we can make this dynamic or
        // only change main structures like Nexus.
        // For UX, green is friendly for health/safety, but let's make it compatible with the theme color per user request.

        let themeColor = "#10b981"; // Default Green

        // If the user specifically wants the repair station to match the theme color:
        // themeColor = window.gameSettings.themeColor || "#10b981"; 

        // However, usually health units stay green. Since the user request mentioned Nexus.js and RepairStation.js 
        // as examples, we are linking these static colors to the variable as well.

        if (window.gameSettings && window.gameSettings.themeColor) {
            // Instead of using a theme color for the repair station, we can use a version compatible with the theme color 
            // or use the theme color directly.
            themeColor = window.gameSettings.themeColor;
        }

        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);

        // Station Drawing
        ctx.shadowBlur = 20; ctx.shadowColor = themeColor;
        ctx.strokeStyle = themeColor; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.stroke();

        // Rotating Arms
        for (let i = 0; i < 3; i++) {
            ctx.rotate((Math.PI * 2) / 3);

            // Dark color (hull)
            ctx.fillStyle = (typeof Utils !== 'undefined' && Utils.hexToRgba) ? Utils.hexToRgba(themeColor, 0.2) : "#064e3b";
            ctx.fillRect(60, -10, 40, 20);

            // Light color (tips)
            ctx.fillStyle = (typeof Utils !== 'undefined' && Utils.hexToRgba) ? Utils.hexToRgba(themeColor, 0.8) : "#34d399";
            ctx.fillRect(90, -10, 10, 20);
        }

        // Center
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = themeColor; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
        ctx.fillText("+", 0, 7);

        ctx.restore();
    }
}

// Export for global access
window.RepairStation = RepairStation;