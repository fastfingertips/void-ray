/**
 * Void Ray - Spatial Hash (ES6 Module)
 * Grid-based spatial partitioning for O(k) collision detection.
 */

export class SpatialHash {
    /**
     * @param {number} cellSize - Size of each cell (e.g., 2000 units)
     */
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map(); // Stores object arrays with "x,y" key
    }

    /**
     * Creates the coordinate key.
     */
    getKey(x, y) {
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }

    /**
     * Adds an object (e.g., Planet) to the hash map.
     * If the object spans multiple cells, it is added to all of them.
     */
    insert(client) {
        const startX = Math.floor((client.x - client.radius) / this.cellSize);
        const endX = Math.floor((client.x + client.radius) / this.cellSize);
        const startY = Math.floor((client.y - client.radius) / this.cellSize);
        const endY = Math.floor((client.y + client.radius) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                if (!this.cells.has(key)) {
                    this.cells.set(key, []);
                }
                this.cells.get(key).push(client);
            }
        }
    }

    /**
     * Completely removes an object from the hash map.
     * (Used for collected planets)
     */
    remove(client) {
        const startX = Math.floor((client.x - client.radius) / this.cellSize);
        const endX = Math.floor((client.x + client.radius) / this.cellSize);
        const startY = Math.floor((client.y - client.radius) / this.cellSize);
        const endY = Math.floor((client.y + client.radius) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                if (this.cells.has(key)) {
                    const cell = this.cells.get(key);
                    const index = cell.indexOf(client);
                    if (index > -1) {
                        cell.splice(index, 1);
                    }
                    // Clean up memory if cell is empty
                    if (cell.length === 0) {
                        this.cells.delete(key);
                    }
                }
            }
        }
    }

    /**
     * Returns potential objects within a specific area.
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} range - Scan radius
     * @returns {Array} Unique object list (duplicates prevented using Set)
     */
    query(x, y, range) {
        const startX = Math.floor((x - range) / this.cellSize);
        const endX = Math.floor((x + range) / this.cellSize);
        const startY = Math.floor((y - range) / this.cellSize);
        const endY = Math.floor((y + range) / this.cellSize);

        const results = new Set();

        for (let ix = startX; ix <= endX; ix++) {
            for (let iy = startY; iy <= endY; iy++) {
                const key = `${ix},${iy}`;
                if (this.cells.has(key)) {
                    const cell = this.cells.get(key);
                    for (let i = 0; i < cell.length; i++) {
                        results.add(cell[i]);
                    }
                }
            }
        }

        return Array.from(results);
    }

    /**
     * Clears the entire map.
     */
    clear() {
        this.cells.clear();
    }
}

window.SpatialHash = SpatialHash;