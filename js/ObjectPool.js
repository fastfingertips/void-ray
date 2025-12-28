/**
 * Void Ray - Object Pool (ES6 Module)
 * Memory optimization for frequently created/destroyed objects.
 */

export class ObjectPool {
    /**
     * @param {Function} factory - Function that creates new objects
     * @param {number} initialSize - Initial pool size
     * @param {number} maxSize - Maximum pool size (0 = unlimited)
     */
    constructor(factory, initialSize = 50, maxSize = 500) {
        this.factory = factory;
        this.maxSize = maxSize;
        this.available = []; // Objects ready for use
        this.inUse = new Set(); // Objects currently in active use

        // Statistics (for debugging)
        this.stats = {
            created: 0,
            reused: 0,
            released: 0,
            expanded: 0
        };

        // Create initial pool
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.factory());
            this.stats.created++;
        }

        console.log(`ObjectPool created: ${initialSize} initial objects`);
    }

    /**
     * Get an object from pool (or create new)
     */
    acquire() {
        let obj;

        if (this.available.length > 0) {
            // Get from existing pool
            obj = this.available.pop();
            this.stats.reused++;
        } else {
            // Pool is empty, create new object
            obj = this.factory();
            this.stats.created++;
            this.stats.expanded++;
        }

        this.inUse.add(obj);
        return obj;
    }

    /**
     * Return object to pool
     */
    release(obj) {
        if (!obj) return;

        // Remove from active list
        if (!this.inUse.delete(obj)) {
            // If not taken from pool, we can warn or silently ignore.
            // Keeping check simple for performance.
            return;
        }

        // Call reset method (if exists)
        if (typeof obj.reset === 'function') {
            obj.reset();
        }

        // Return to pool (max size check)
        if (this.maxSize === 0 || this.available.length < this.maxSize) {
            this.available.push(obj);
            this.stats.released++;
        }
        // If max size exceeded, leave object to garbage collector
    }

    /**
     * Batch release
     */
    releaseAll(objects) {
        objects.forEach(obj => this.release(obj));
    }

    /**
     * Clear the pool
     */
    clear() {
        this.available = [];
        this.inUse.clear();
        console.log('ObjectPool cleared.');
    }

    /**
     * Get pool info
     */
    getInfo() {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size,
            stats: { ...this.stats }
        };
    }
}

window.ObjectPool = ObjectPool;