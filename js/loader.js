/**
 * Void Ray - HTML Partial Loader (ES6 Module)
 * Loads HTML files from 'partials/' folder into index.html.
 */

export async function loadPartials() {
    const partials = [
        { id: 'ui-core', url: 'partials/ui-core.html' },
        { id: 'ui-menus', url: 'partials/ui-menus.html' },
        { id: 'ui-hud', url: 'partials/ui-hud.html' },
        { id: 'ui-panels', url: 'partials/ui-panels.html' },
        { id: 'ui-windows', url: 'partials/ui-windows.html' }, // New windows partial
        { id: 'ui-settings', url: 'partials/ui-settings.html' }
    ];

    console.log("Loading UI partials...");

    // Fetch all partials in parallel
    const promises = partials.map(p =>
        fetch(p.url)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load file: ${p.url}`);
                return response.text();
            })
            .then(html => {
                const container = document.getElementById(p.id);
                if (container) {
                    container.innerHTML = html;
                }
            })
    );

    try {
        await Promise.all(promises);
        console.log("All UI loaded.");

        // After partials are loaded, we're ready to start the game.
        // If there's an initialization function, we can trigger it.
        if (window.onUILoaded) {
            window.onUILoaded();
        }
    } catch (error) {
        console.error("UI loading error:", error);
        alert("An error occurred while loading the game interface. Please refresh the page.");
    }
}

// Window export for backward compatibility
if (typeof window !== 'undefined') {
    window.loadPartials = loadPartials;
}

// Run on DOMContentLoaded
window.addEventListener('DOMContentLoaded', loadPartials);