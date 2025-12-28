/**
 * Void Ray - Planet Entity (ES6 Module)
 */

export class Planet {
    constructor(x, y, type, lootContent = []) {
        // Global WORLD_SIZE, RARITY, LOOT_DB
        this.x = x !== undefined ? x : Math.random() * WORLD_SIZE;
        this.y = y !== undefined ? y : Math.random() * WORLD_SIZE;
        this.collected = false;

        if (type) {
            this.type = type;
            this.lootContent = lootContent;
        } else {
            const r = Math.random();
            if (r < 0.01) this.type = RARITY.TOXIC;
            else if (r < 0.05) this.type = RARITY.LEGENDARY;
            else if (r < 0.15) this.type = RARITY.EPIC;
            else if (r < 0.17) this.type = RARITY.TARDIGRADE;
            else if (r < 0.50) this.type = RARITY.RARE;
            else this.type = RARITY.COMMON;
            this.lootContent = [];
        }
        this.name = this.type.id === 'lost' ? "LOST CARGO" : LOOT_DB[this.type.id][Math.floor(Math.random() * LOOT_DB[this.type.id].length)];

        // GET VALUES FROM CONFIG
        const R = GAME_CONFIG.PLANETS.RADIUS;
        let baseRadius = R.BASE;

        if (this.type.id === 'legendary') baseRadius = R.LEGENDARY;
        else if (this.type.id === 'toxic') baseRadius = R.TOXIC;
        else if (this.type.id === 'lost') baseRadius = R.LOST;
        else if (this.type.id === 'tardigrade') baseRadius = R.TARDIGRADE;
        else baseRadius = R.BASE + Math.random() * R.VARIANCE;

        this.radius = baseRadius;

        // --- CLOUD / TOXIC CONFIGURATION ---
        if (this.type.id === 'toxic') {
            this.cloudPuffs = [];
            // Create random larger and smaller cloud puff pieces within the main radius
            const puffCount = 12;
            for (let i = 0; i < puffCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * (this.radius * 0.7); // Distribution close to the center

                this.cloudPuffs.push({
                    xOffset: Math.cos(angle) * dist,
                    yOffset: Math.sin(angle) * dist,
                    r: (this.radius * 0.3) + Math.random() * (this.radius * 0.4), // Puff size
                    driftSpeed: (Math.random() - 0.5) * 0.02, // Slight rotation on its own axis
                    angle: Math.random() * Math.PI * 2,
                    alpha: 0.1 + Math.random() * 0.2
                });
            }
            // For the entire cloud to slowly rotate
            this.rotation = 0;
            this.rotationSpeed = (Math.random() - 0.5) * 0.002;
        }
    }

    draw(ctx, visibility = 2) {
        if (this.collected) return;
        if (visibility === 0) return;

        // --- DEVELOPER MODE: GRAVITY FIELD AND HITBOX VISUALIZATION ---
        if (window.gameSettings && window.gameSettings.developerMode && this.type.id !== 'toxic') {
            ctx.save();

            // 1. GRAVITY FIELD (Magenta Dashed Circle)
            if (window.gameSettings.showGravityFields) {
                const magnetMult = 1 + (playerData.upgrades.playerMagnet * 0.5);
                const gravityRadius = this.radius * 4 * magnetMult;

                ctx.beginPath();
                ctx.arc(this.x, this.y, gravityRadius, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255, 0, 255, 0.3)";
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.stroke();

                ctx.fillStyle = "rgba(255, 0, 255, 0.5)";
                ctx.beginPath(); ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); ctx.fill();

                // Gravity field value
                ctx.fillStyle = "rgba(255, 0, 255, 0.8)";
                ctx.font = "10px monospace";
                ctx.textAlign = "center";
                ctx.fillText(`G: ${Math.round(gravityRadius)}`, this.x, this.y + gravityRadius + 15);
            }

            // 2. HITBOX (Red Circle)
            if (window.gameSettings.showHitboxes) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
                ctx.lineWidth = 2;
                ctx.setLineDash([]); // Solid line
                ctx.stroke();

                // Hitbox value
                ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
                ctx.font = "10px monospace";
                ctx.textAlign = "center";
                ctx.fillText(`R: ${Math.round(this.radius)}`, this.x, this.y + this.radius + 15);
            }

            ctx.restore();
        }

        // --- CLOUD AREA (TOXIC) SPECIAL DRAWING ---
        if (this.type.id === 'toxic') {
            this.drawToxicCloud(ctx, visibility);
            return;
        }

        // Radar Theme (Partial View - For Others)
        if (visibility === 1) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        // Normal View (Full View)
        ctx.shadowBlur = 50; ctx.shadowColor = this.type.color;
        const grad = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.1, this.x, this.y, this.radius);
        grad.addColorStop(0, this.type.color); grad.addColorStop(1, "#020617");
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

        if (this.type.id === 'lost') { ctx.strokeStyle = this.type.color; ctx.lineWidth = 3; const pulse = Math.sin(Date.now() * 0.005) * 10; ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 20 + pulse, 0, Math.PI * 2); ctx.stroke(); }
        if (this.type.id === 'tardigrade') {
            ctx.strokeStyle = "rgba(199, 192, 174, 0.3)"; ctx.lineWidth = 2;
            const wiggle = Math.sin(Date.now() * 0.01) * 3;
            ctx.beginPath(); ctx.ellipse(this.x, this.y, this.radius + 5 + wiggle, this.radius + 5 - wiggle, 0, 0, Math.PI * 2); ctx.stroke();
        }
    }

    drawToxicCloud(ctx, visibility) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Main rotation update (Cloud slowly rotating)
        this.rotation += this.rotationSpeed;
        ctx.rotate(this.rotation);

        // Showing hitbox for toxic clouds could be useful as well
        if (window.gameSettings && window.gameSettings.developerMode && window.gameSettings.showHitboxes) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Hitbox value (We draw with inverse rotation for Toxic so it stays upright)
            ctx.rotate(-this.rotation); // Undo rotation to correct the text
            ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
            ctx.font = "10px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`R: ${Math.round(this.radius)}`, 0, this.radius + 15);

            ctx.restore();
        }

        if (visibility === 1) {
            // Radar view: Just a simple smoky circle
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(16, 185, 129, 0.1)"; // Faint green
            ctx.fill();
            ctx.strokeStyle = "rgba(16, 185, 129, 0.3)";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
        }
        else if (visibility === 2) {
            // Full View: Detailed Cloud Effect

            // 1. Outer Ring (Soft gradient to make the boundaries blurred)
            const outerGrad = ctx.createRadialGradient(0, 0, this.radius * 0.5, 0, 0, this.radius);
            outerGrad.addColorStop(0, "rgba(16, 185, 129, 0.0)");
            outerGrad.addColorStop(0.8, "rgba(16, 185, 129, 0.1)");
            outerGrad.addColorStop(1, "rgba(0,0,0,0)");

            ctx.fillStyle = outerGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // 2. Cloud Puff Particles (Puffs)
            // Each piece rotates within itself and they merge to form an amorphous structure
            this.cloudPuffs.forEach(puff => {
                ctx.save();
                ctx.translate(puff.xOffset, puff.yOffset);
                ctx.rotate(puff.angle + (Date.now() * 0.0005)); // Particles also rotate within themselves

                const puffGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, puff.r);
                puffGrad.addColorStop(0, `rgba(50, 205, 50, ${puff.alpha})`); // Center is more intense green
                puffGrad.addColorStop(0.7, `rgba(16, 185, 129, ${puff.alpha * 0.5})`);
                puffGrad.addColorStop(1, "rgba(0,0,0,0)");

                ctx.fillStyle = puffGrad;
                ctx.beginPath();
                ctx.arc(0, 0, puff.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // 3. Static Noise / Digital Interference (Inner atmosphere)
            // Small data particles flashing randomly within the cloud
            if (Math.random() < 0.3) {
                ctx.fillStyle = "#a7f3d0"; // Very light green
                const noiseCount = 3;
                for (let k = 0; k < noiseCount; k++) {
                    const nx = (Math.random() - 0.5) * this.radius * 1.5;
                    const ny = (Math.random() - 0.5) * this.radius * 1.5;
                    const s = Math.random() * 2 + 1;
                    ctx.fillRect(nx, ny, s, s);
                }
            }

            // 4. Subtle Electric Arcs (Rare)
            if (Math.random() < 0.05) {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                const startX = (Math.random() - 0.5) * this.radius;
                const startY = (Math.random() - 0.5) * this.radius;
                ctx.moveTo(startX, startY);
                ctx.lineTo(startX + (Math.random() - 0.5) * 50, startY + (Math.random() - 0.5) * 50);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

// Window export for backward compatibility
if (typeof window !== 'undefined') {
    window.Planet = Planet;
}