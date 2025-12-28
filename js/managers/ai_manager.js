/**
 * Void Ray - AI Manager (ES6 Module)
 * Autopilot logic, target selection and navigation.
 */

export class AIPilotSystem {
    constructor() {
        this.active = false;      // Is autopilot active?
        this.mode = 'gather';     // Modes: 'gather', 'base', 'deposit', 'travel'
        this.manualTarget = null; // Manual target selected from map
        this.scoutTarget = null;  // Random scout target

        // Temporary variables for targeting
        this.debugTarget = null;  // For debug drawing (Target Vectors)
    }

    /**
     * Toggles the AI System.
     */
    toggle() {
        this.active = !this.active;
        const t = window.t || ((key) => key.split('.').pop());
        if (!this.active) {
            this.manualTarget = null;
            this.scoutTarget = null;
            this.mode = 'gather';
            if (typeof addChatMessage === 'function') addChatMessage(t('aiMessages.disengaged'), "system", "general");
        } else {
            if (typeof addChatMessage === 'function') addChatMessage(t('aiMessages.engaged'), "info", "general");
        }

        // Trigger global function for UI update
        if (typeof updateAIButton === 'function') updateAIButton();
    }

    /**
     * Switches to a specific mode.
     */
    setMode(newMode) {
        this.mode = newMode;
        if (!this.active) this.toggle(); // Auto-engage if mode changes

        const t = window.t || ((key) => key.split('.').pop());
        let msg = "";
        switch (newMode) {
            case 'base': msg = t('aiMessages.baseRoute'); break;
            case 'deposit': msg = t('aiMessages.depositProtocol'); break;
            case 'travel': msg = t('aiMessages.travelMode'); break;
            case 'gather': msg = t('aiMessages.gatherProtocol'); break;
        }
        if (typeof addChatMessage === 'function') addChatMessage(`${t('aiMessages.autopilot')}: ${msg}`, "info", "general");
        if (typeof updateAIButton === 'function') updateAIButton();
    }

    /**
     * Called when a target is manually set from the map.
     */
    setManualTarget(x, y) {
        this.manualTarget = { x, y };
        this.setMode('travel');
        const t = window.t || ((key) => key.split('.').pop());
        if (typeof showNotification === 'function') showNotification({ name: t('aiNotif.routeCreated'), type: { color: '#fff' } }, "");
    }

    /**
     * Finds nearest suitable resource.
     */
    findNearestResource(player) {
        if (collectedItems.length >= GameRules.getPlayerCapacity()) return null;

        let nearest = null;
        let minDist = Infinity;
        const scanRange = player.radarRadius;

        // Fetch candidates from grid system
        const candidates = (entityManager && entityManager.grid)
            ? entityManager.grid.query(player.x, player.y, scanRange)
            : planets;

        for (let p of candidates) {
            if (!p.collected && p.type.id !== 'toxic') {
                const distToMe = (p.x - player.x) ** 2 + (p.y - player.y) ** 2;

                if (distToMe < scanRange ** 2) {
                    // If Echo is closer to this resource, leave it to Echo
                    let echoIsCloser = false;
                    if (typeof echoRay !== 'undefined' && echoRay && echoRay.mode === 'roam' && echoRay.lootBag.length < GameRules.getEchoCapacity()) {
                        const distToEcho = (p.x - echoRay.x) ** 2 + (p.y - echoRay.y) ** 2;
                        if (distToEcho < distToMe) echoIsCloser = true;
                    }

                    if (!echoIsCloser && distToMe < minDist) {
                        minDist = distToMe;
                        nearest = p;
                    }
                }
            }
        }
        return nearest;
    }

    /**
     * Picks a new random scout target.
     */
    pickNewScoutTarget() {
        const margin = 5000;
        const safeSize = WORLD_SIZE - margin;
        this.scoutTarget = {
            x: Utils.random(margin, safeSize),
            y: Utils.random(margin, safeSize)
        };
    }

    /**
     * Controls the ship every game frame.
     * @param {VoidRay} player - Ship to control
     * @param {number} dt - Delta time
     */
    update(player, dt) {
        if (!this.active || !player) return;

        // If user intervenes (WASD), warn/stop AI
        if (keys.w || keys.a || keys.s || keys.d) {
            // Optional: We can disable AI or just warn.
            // For now, flashing effect in UI is handled in controls.js.
        }

        // 1. Capacity Check (If full, go to deposit)
        const cap = GameRules.getPlayerCapacity();
        if (collectedItems.length >= cap && this.mode !== 'deposit' && this.mode !== 'base') {
            this.setMode('deposit');
            const t = window.t || ((key) => key.split('.').pop());
            if (typeof showNotification === 'function') showNotification({ name: t('aiNotif.storageFullAutoTransfer'), type: { color: '#a855f7' } }, "");
        }

        // 2. Targeting Logic
        let targetX, targetY;
        let doThrust = true;

        if (this.mode === 'base') {
            // Target: Nexus
            targetX = nexus.x; targetY = nexus.y;
            if (Utils.distEntity(player, nexus) < 400) doThrust = false;
            this.scoutTarget = null;
        }
        else if (this.mode === 'deposit') {
            // Target: Storage Center
            targetX = storageCenter.x; targetY = storageCenter.y;
            if (Utils.distEntity(player, storageCenter) < 200) {
                doThrust = false;
                // Transfer to storage
                if (typeof depositToStorage === 'function') {
                    depositToStorage(collectedItems, "VOIDRAY");
                }
                this.setMode('gather');
                const t = window.t || ((key) => key.split('.').pop());
                if (typeof showNotification === 'function') showNotification({ name: t('aiNotif.autoTransferComplete'), type: { color: '#10b981' } }, "");
            }
            this.scoutTarget = null;
        }
        else if (this.mode === 'travel' && this.manualTarget) {
            // Target: User Selected Point
            targetX = this.manualTarget.x; targetY = this.manualTarget.y;
            if (Utils.dist(player.x, player.y, targetX, targetY) < 200) {
                doThrust = false;
                this.toggle();
                const t = window.t || ((key) => key.split('.').pop());
                if (typeof showNotification === 'function') showNotification({ name: t('aiNotif.targetReached'), type: { color: '#fff' } }, "");
            }
        }
        else {
            // Target: Resource Gathering (Gather)
            this.mode = 'gather'; // Set to be sure

            // Find nearest resource
            const nearest = this.findNearestResource(player);

            if (nearest) {
                targetX = nearest.x; targetY = nearest.y;
                this.scoutTarget = null;
            } else {
                // If no resource, random scout
                if (!this.scoutTarget || Utils.dist(player.x, player.y, this.scoutTarget.x, this.scoutTarget.y) < 300) {
                    this.pickNewScoutTarget();
                }
                targetX = this.scoutTarget.x;
                targetY = this.scoutTarget.y;
            }
        }

        // 3. Physical Control (Steer Ship to Target)
        if (targetX !== undefined) {
            this.debugTarget = { x: targetX, y: targetY }; // For Gizmos drawing

            // Calculate Angle
            const targetAngle = Math.atan2(targetY - player.y, targetX - player.x);

            // Smooth Turn
            let diff = targetAngle - player.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            player.angle += diff * 0.1;

            // Thrust
            if (doThrust) {
                // Accelerate if facing target
                // player.getStatBonus is defined in VoidRay.js
                const thrustBonus = (typeof player.getStatBonus === 'function') ? player.getStatBonus('thrust') : 0;
                const accel = (keys[" "] ? 0.6 : 0.2) + (thrustBonus / 200);

                if (Math.abs(diff) < 1.0) {
                    player.vx += Math.cos(player.angle) * accel;
                    player.vy += Math.sin(player.angle) * accel;
                } else {
                    // Decelerate if turning
                    player.vx *= 0.95;
                    player.vy *= 0.95;
                }
            } else {
                // Arrived at target or stopping
                player.vx *= 0.9;
                player.vy *= 0.9;
            }

            // Visual Effects (Wing movement etc)
            player.wingPhase += 0.2;
            // Roll effect (Banking based on turn)
            const targetRoll = diff * 5 * 0.6;
            player.roll += (targetRoll - player.roll) * 0.05;
        }
    }
}

// Global Access (Variable name change is important here)
window.AIManager = new AIPilotSystem();