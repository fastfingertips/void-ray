/**
 * Void Ray - Particle Management System (ES6 Module)
 * Object Pool integrated for performance.
 */

export class ParticleSystem {
    constructor() {
        // List of active particles on screen
        this.activeParticles = [];

        // Object Pool: 
        // - factory: Creates new Particle
        // - initialSize: Create 50 at start
        // - maxSize: Stock max 1000 (excess will be deleted)
        // NOTE: Make sure ObjectPool class is loaded.
        if (typeof ObjectPool === 'undefined') {
            console.error("CRITICAL: ObjectPool class not found! Is js/ObjectPool.js loaded?");
            this.pool = { acquire: () => new Particle(), release: () => { } }; // Fallback
        } else {
            this.pool = new ObjectPool(() => new Particle(), 50, 1000);
        }
    }

    /**
     * Creates new particles at the specified location.
     */
    emit(x, y, color, count = 1) {
        for (let i = 0; i < count; i++) {
            // 1. Get one from the pool (creates new if none available)
            const p = this.pool.acquire();

            // 2. Initialize particle with given coordinates and color (if spawn method exists)
            if (p.spawn) p.spawn(x, y, color);
            else {
                // Fallback (if old Particle class exists)
                p.x = x; p.y = y; p.color = color;
                p.vx = (Math.random() - 0.5) * 3; p.vy = (Math.random() - 0.5) * 3;
                p.life = 1.0; p.radius = Math.random() * 5 + 3; p.growth = 0.15;
            }

            // 3. Add to active list (for Update loop)
            this.activeParticles.push(p);
        }
    }

    /**
     * Updates the physical state of all particles.
     * Returns expired particles to the pool.
     */
    update() {
        // Reverse loop (so splice doesn't mess up the array)
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.update();

            if (p.life <= 0) {
                // 1. Return to pool (reset method is called automatically)
                this.pool.release(p);

                // 2. Remove from active list
                this.activeParticles.splice(i, 1);
            }
        }
    }

    /**
     * Draws active particles to screen.
     */
    draw(ctx) {
        for (let i = 0; i < this.activeParticles.length; i++) {
            this.activeParticles[i].draw(ctx);
        }
    }

    /**
     * Returns active particle count.
     */
    get count() {
        return this.activeParticles.length;
    }

    /**
     * Resets the system.
     */
    clear() {
        // Return all active particles to the pool
        if (this.pool && this.pool.releaseAll) {
            this.pool.releaseAll(this.activeParticles);
        }
        this.activeParticles = [];
    }
}

// Window export for backward compatibility
if (typeof window !== 'undefined') {
    window.ParticleSystem = ParticleSystem;
}