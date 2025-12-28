/**
 * Void Ray - Particle Effects Entity (ES6 Module)
 * Compatible with Object Pool.
 */

export class Particle {
    constructor() {
        // Default values are assigned when memory is allocated.
        this.x = 0;
        this.y = 0;
        this.color = '#fff';
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.radius = 0;
        this.growth = 0;
    }

    /**
     * Used to "respawn" the object when pulled from the pool.
     */
    spawn(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;

        // Random movement vectors must be re-calculated each time
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;

        this.life = 1.0;
        this.radius = Math.random() * 5 + 3;
        this.growth = 0.15;
    }

    /**
     * Called by the release() function in ObjectPool.js.
     * Performs cleanup when the object returns to the pool.
     */
    reset() {
        this.x = -1000; // Move off-screen
        this.y = -1000;
        this.life = 0;
        this.vx = 0;
        this.vy = 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.015;
        this.radius += this.growth;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.globalAlpha = Math.max(0, this.life * 0.6);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Window export for backward compatibility
if (typeof window !== 'undefined') {
    window.Particle = Particle;
}