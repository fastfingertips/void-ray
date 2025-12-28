/**
 * Void Ray - Console and Command System (ES6 Module)
 * Manages game via chat window commands starting with "/".
 */

export const ConsoleSystem = {
    commands: {
        'help': {
            desc: 'Shows the list of commands.',
            usage: '/help',
            devOnly: false,
            action: () => {
                let msg = "AVAILABLE COMMANDS:<br>";
                Object.keys(ConsoleSystem.commands).forEach(cmd => {
                    const info = ConsoleSystem.commands[cmd];
                    const isDev = info.devOnly;
                    const isDevActive = window.gameSettings && window.gameSettings.developerMode;

                    let color = "#fbbf24";
                    if (isDev && !isDevActive) color = "#475569";

                    msg += `<span style="color:${color}">/${cmd}</span>: <span style="color:#94a3b8">${info.desc}</span>${isDev ? " <span style='font-size:0.6em; color:#ef4444'>[DEV]</span>" : ""}<br>`;
                });
                addChatMessage(msg, 'system', 'info');
            }
        },
        'god': {
            desc: 'Toggles god mode.',
            usage: '/god',
            devOnly: true,
            action: () => {
                if (!window.gameSettings) return;
                window.gameSettings.godMode = !window.gameSettings.godMode;
                const state = window.gameSettings.godMode ? "ACTIVE" : "INACTIVE";
                const color = window.gameSettings.godMode ? "#10b981" : "#ef4444";

                const toggle = document.getElementById('toggle-god-mode');
                if (toggle) toggle.checked = window.gameSettings.godMode;

                showNotification({ name: `GOD MODE: ${state}`, type: { color: color } }, "");
                addChatMessage(`System: God mode ${state}`, 'system', 'general');
            }
        },
        'heal': {
            desc: 'Restores health and energy.',
            usage: '/heal',
            devOnly: true,
            action: () => {
                if (player) {
                    player.health = player.maxHealth;
                    player.energy = player.maxEnergy;
                    showNotification({ name: "SYSTEMS REPAIRED", type: { color: '#10b981' } }, "");
                    Utils.playSound('playChime', { id: 'rare' });
                }
            }
        },
        'tp': {
            desc: 'Teleports to specified coordinates.',
            usage: '/tp <x> <y> (Ex: /tp 5000 5000)',
            devOnly: true,
            action: (args) => {
                if (args.length < 2) return ConsoleSystem.showUsage('tp');

                const x = parseFloat(args[0]);
                const y = parseFloat(args[1]);

                if (isNaN(x) || isNaN(y)) return ConsoleSystem.showUsage('tp');

                if (player) {
                    player.x = x;
                    player.y = y;
                    player.vx = 0;
                    player.vy = 0;
                    if (player.tail) player.tail.forEach(t => { t.x = x; t.y = y; });
                    if (window.cameraFocus) { window.cameraFocus.x = x; window.cameraFocus.y = y; }

                    showNotification({ name: "TELEPORT SUCCESSFUL", type: { color: '#a855f7' } }, `[${Math.floor(x)}:${Math.floor(y)}]`);
                }
            }
        },
        'give': {
            desc: 'Adds item to inventory.',
            usage: '/give <name> <count> (Ex: /give Crystal 10)',
            devOnly: true,
            action: (args) => {
                if (args.length < 1) return ConsoleSystem.showUsage('give');

                let count = 1;
                const lastArg = args[args.length - 1];
                if (!isNaN(parseInt(lastArg))) {
                    count = parseInt(lastArg);
                    args.pop();
                }

                const itemNameSearch = args.join(" ").toLowerCase();

                let foundType = null;
                let foundName = "";

                for (const [rarityKey, items] of Object.entries(LOOT_DB)) {
                    for (const item of items) {
                        if (item.toLowerCase() === itemNameSearch) {
                            foundName = item;
                            foundType = RARITY[rarityKey.toUpperCase()];
                            break;
                        }
                    }
                    if (foundType) break;
                }

                if (!foundType) return ConsoleSystem.error("Item not found. Try typing exact name.");

                for (let i = 0; i < count; i++) {
                    const fakePlanet = { name: foundName, type: foundType };
                    collectedItems.push(fakePlanet);
                }

                updateInventoryCount();
                if (inventoryOpen) renderInventory();
                addChatMessage(`Console: Given ${count}x ${foundName}.`, 'loot', 'general');
            }
        },
        'xp': {
            desc: 'Gives XP to player.',
            usage: '/xp <amount> (Ex: /xp 500)',
            devOnly: true,
            action: (args) => {
                if (args.length < 1) return ConsoleSystem.showUsage('xp');
                const amount = parseInt(args[0]);
                if (player && !isNaN(amount)) {
                    player.gainXp(amount);
                    addChatMessage(`Console: Added +${amount} XP.`, 'info', 'general');
                } else {
                    ConsoleSystem.showUsage('xp');
                }
            }
        },
        'level': {
            desc: 'Level up.',
            usage: '/level',
            devOnly: true,
            action: () => {
                if (player) player.gainXp(player.maxXp);
            }
        },
        'speed': {
            desc: 'Increases speed limit (For testing).',
            usage: '/speed <value>',
            devOnly: true,
            action: (args) => {
                if (args.length < 1) return ConsoleSystem.showUsage('speed');
                ConsoleSystem.error("Speed setting can only be done via Nexus.");
            }
        },
        'stardust': {
            desc: 'Adds Crystal (Currency).',
            usage: '/stardust <amount>',
            devOnly: true,
            action: (args) => {
                if (args.length < 1) return ConsoleSystem.showUsage('stardust');
                const amount = parseInt(args[0]);

                if (isNaN(amount)) return ConsoleSystem.showUsage('stardust');

                playerData.stardust += amount;
                playerData.stats.totalStardust += amount;
                player.updateUI();
                addChatMessage(`Console: Added +${amount} Crystal.`, 'loot', 'general');
            }
        },
        'wormhole': {
            desc: 'Spawns or finds a wormhole.',
            usage: '/wormhole <spawn|list>',
            devOnly: true,
            action: (args) => {
                if (!entityManager) return ConsoleSystem.error("Entity Manager missing.");

                if (args[0] === 'spawn') {
                    const dist = 500;
                    const wx = player.x + Math.cos(player.angle) * dist;
                    const wy = player.y + Math.sin(player.angle) * dist;

                    if (typeof Wormhole !== 'undefined') {
                        const w = new Wormhole(wx, wy);
                        entityManager.wormholes.push(w);
                        addChatMessage("Console: Wormhole spawned.", 'info', 'general');
                        showNotification({ name: "ARTIFICIAL ANOMALY", type: { color: '#8b5cf6' } }, "Created");
                    } else {
                        ConsoleSystem.error("Wormhole class not found.");
                    }
                } else if (args[0] === 'list') {
                    const count = entityManager.wormholes.length;
                    addChatMessage(`Console: There are ${count} wormholes on map.`, 'info', 'info');

                    let nearest = null, minDist = Infinity;
                    entityManager.wormholes.forEach(w => {
                        const d = Utils.distEntity(player, w);
                        if (d < minDist) { minDist = d; nearest = w; }
                    });

                    if (nearest) {
                        addChatMessage(`Nearest: [${Math.floor(nearest.x)}:${Math.floor(nearest.y)}] (${Math.floor(minDist)}m)`, 'info', 'info');

                        // UPDATE GLOBAL VARIABLES
                        window.manualTarget = { x: nearest.x, y: nearest.y };
                        window.autopilot = true;
                        window.aiMode = 'travel';

                        // UI GÜNCELLE
                        const aiToggle = document.getElementById('btn-ai-toggle');
                        if (aiToggle) aiToggle.classList.add('active');

                        if (typeof updateAIButton === 'function') updateAIButton();
                        showNotification({ name: "ROUTE CREATED", type: { color: '#fff' } }, "Traveling to Wormhole...");
                    } else {
                        addChatMessage("Console: No wormholes found. Use '/wormhole spawn'.", 'alert', 'general');
                    }
                } else {
                    ConsoleSystem.showUsage('wormhole');
                }
            }
        },
        'echo': {
            desc: 'Manages Echo drone.',
            usage: '/echo <spawn|kill>',
            devOnly: true,
            action: (args) => {
                if (args.length < 1) return ConsoleSystem.showUsage('echo');

                if (args[0] === 'spawn') {
                    if (echoRay) return ConsoleSystem.error("Echo already active.");
                    spawnEcho(player.x, player.y + 100);
                    addChatMessage("Console: Echo spawned.", 'info', 'general');
                } else if (args[0] === 'kill') {
                    if (!echoRay) return ConsoleSystem.error("No Echo found.");
                    window.echoRay = null;
                    document.getElementById('echo-wrapper-el').style.display = 'none';
                    addChatMessage("Console: Echo destroyed.", 'alert', 'general');
                } else {
                    ConsoleSystem.showUsage('echo');
                }
            }
        },
        'save': {
            desc: 'Force saves the game.',
            usage: '/save',
            devOnly: false,
            action: () => {
                if (typeof SaveManager !== 'undefined') {
                    SaveManager.save();
                    addChatMessage("System: Game force saved.", 'system', 'general');
                }
            }
        },
        'ui': {
            desc: 'Toggles UI visibility.',
            usage: '/ui',
            devOnly: false,
            action: () => {
                if (typeof toggleHUD === 'function') toggleHUD();
            }
        },
        'clear': {
            desc: 'Clears chat history.',
            usage: '/clear',
            devOnly: false,
            action: () => {
                const content = document.getElementById('chat-content');
                if (content) content.innerHTML = '';
                chatHistory.general = [];
                chatHistory.info = [];
                chatHistory.group = [];
            }
        }
    },

    execute: function (inputString) {
        if (!window.gameSettings || !window.gameSettings.enableConsole) {
            this.error("Console disabled. Enable 'Active Console' in Settings > Game menu.");
            return;
        }

        const cleanInput = inputString.substring(1).trim();
        if (!cleanInput) return;

        const parts = cleanInput.split(" ");
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        const cmd = this.commands[commandName];

        if (cmd) {
            if (cmd.devOnly) {
                if (!window.gameSettings || !window.gameSettings.developerMode) {
                    this.error(`You must enable 'Developer Mode' to use this command. (Settings > Game)`);
                    return;
                }
            }

            try {
                cmd.action(args);
            } catch (e) {
                console.error(e);
                this.error("Error executing command.");
            }
        } else {
            this.error(`Unknown command: ${commandName}. Type /help for help.`);
        }
    },

    error: function (msg) {
        addChatMessage(`ERROR: ${msg}`, 'alert', 'general');
    },

    showUsage: function (cmdKey) {
        const cmd = this.commands[cmdKey];
        if (cmd && cmd.usage) {
            addChatMessage(`USAGE: <span style="color:#fbbf24">${cmd.usage}</span>`, 'alert', 'general');
        } else {
            this.error("No usage info for this command.");
        }
    }
};

window.ConsoleSystem = ConsoleSystem;