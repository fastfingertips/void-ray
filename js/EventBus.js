/**
 * Void Ray - Event Bus (ES6 Module)
 * Pub/Sub pattern for decoupled communication.
 */

export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => cb(data));
    }
}

// Global EventBus instance
if (typeof window !== 'undefined') {
    window.EventBus = EventBus;
    window.eventBus = new EventBus();
}