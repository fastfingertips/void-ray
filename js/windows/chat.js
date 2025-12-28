/**
 * Void Ray - Window: Chat (ES6 Module)
 */

export let chatHistory = {
    general: [],
    info: [],
    group: []
};
export let activeChatTab = 'general';

// Chat mode: 2=Active, 1=Semi
let chatState = 1;
let wasSemiActive = false;

/**
 * Toggles chat mode (Triggered by button).
 * Cycle 2 -> 1 -> 2 (Active <-> Semi).
 */
window.cycleChatMode = function () {
    if (chatState === 2) {
        chatState = 1; // Active -> Semi
    } else {
        chatState = 2; // Semi -> Active
    }
    wasSemiActive = false; // Reset memory on manual change
    updateChatUI();
};

/**
 * Updates UI based on current chatState.
 */
function updateChatUI() {
    const panel = document.getElementById('chat-panel');
    const btn = document.getElementById('btn-chat-mode');
    const inputArea = document.getElementById('chat-input-area');

    if (!panel || !btn) return;

    // Clear classes
    panel.classList.remove('chat-mode-semi', 'chat-mode-off');

    if (chatState === 2) {
        // --- ACTIVE MODE ---
        // 'active' class is required for opacity system to detect this window as OPEN
        panel.classList.add('active');

        btn.innerText = "✉";
        btn.style.color = "white";

        // Mark button as active
        if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-chat-mode', true);

        // Make input area visible
        if (inputArea) inputArea.style.removeProperty('display');

        // Restore full history
        switchChatTab(activeChatTab);
    }
    else {
        // --- SEMI ACTIVE ---
        // Removing 'active' class so it behaves like the window is closed
        // (This allows default CSS transparency instead of the UI opacity setting)
        panel.classList.remove('active');

        btn.innerText = "⋯";
        btn.style.color = "#94a3b8";
        panel.classList.add('chat-mode-semi');

        // Deactivate button
        if (typeof setHudButtonActive === 'function') setHudButtonActive('btn-chat-mode', false);

        // Force HIDE input area
        if (inputArea) inputArea.style.display = 'none';

        // Clear old clutter when switching to semi mode
        const chatContent = document.getElementById('chat-content');
        if (chatContent) chatContent.innerHTML = '';
    }
}

/**
 * Adds a new message to the chat panel.
 */
function addChatMessage(text, type = 'system', channel = 'info') {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const msgObj = { text, type, time: timeStr };

    // Always save the data
    chatHistory[channel].push(msgObj);
    if (channel !== 'general') {
        chatHistory['general'].push(msgObj);
    }

    // If channel is not active, do not draw (In semi mode only active channel is shown)
    if (activeChatTab !== channel && activeChatTab !== 'general') return;

    const chatContent = document.getElementById('chat-content');
    if (!chatContent) return;

    const div = document.createElement('div');
    div.className = `chat-message ${type}`;
    div.innerHTML = `<span class="chat-timestamp">[${timeStr}]</span> ${text}`;

    if (chatState === 1) {
        // SEMI MODE: Fade out effect (6s total life)
        div.classList.add('fading-msg');
        chatContent.appendChild(div);

        // Remove from DOM after animation (Already in history)
        setTimeout(() => {
            if (div.parentNode) div.parentNode.removeChild(div);
        }, 6000);
    } else {
        // ACTIVE MODE: Normal add (No delete)
        chatContent.appendChild(div);
        chatContent.scrollTop = chatContent.scrollHeight;
    }
}

function switchChatTab(tab) {
    activeChatTab = tab;

    document.querySelectorAll('.chat-tab').forEach(t => t.classList.remove('active'));
    const activeTabEl = document.getElementById(`tab-${tab}`);
    if (activeTabEl) activeTabEl.classList.add('active');

    const inputArea = document.getElementById('chat-input-area');
    if (inputArea) {
        // Only manage input visibility if in ACTIVE (2) mode
        if (chatState === 2) {
            if (tab === 'info') inputArea.style.display = 'none';
            else inputArea.style.display = 'flex';
        }
    }

    // Do not load history if in semi mode
    if (chatState === 1) {
        const chatContent = document.getElementById('chat-content');
        if (chatContent) chatContent.innerHTML = '';
        return;
    }

    const chatContent = document.getElementById('chat-content');
    if (chatContent) {
        chatContent.innerHTML = '';
        chatHistory[tab].forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-message ${msg.type}`;
            div.innerHTML = `<span class="chat-timestamp">[${msg.time}]</span> ${msg.text}`;
            chatContent.appendChild(div);
        });
        chatContent.scrollTop = chatContent.scrollHeight;
    }
}

function sendUserMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;

    const msg = input.value.trim();
    if (msg) {
        // --- COMMAND SYSTEM INTEGRATION ---
        if (msg.startsWith('/')) {
            if (typeof ConsoleSystem !== 'undefined') {
                ConsoleSystem.execute(msg);
                input.value = '';
                // Clear style after command
                input.classList.remove('command-mode');
            } else {
                const t = window.t || ((key) => key.split('.').pop());
                addChatMessage(t('chatMessages.consoleError'), 'alert', activeChatTab);
            }
        } else {
            // Normal Chat Message
            addChatMessage(`Pilot: ${msg}`, 'loot', activeChatTab);
            input.value = '';
            setTimeout(() => {
                const t = window.t || ((key) => key.split('.').pop());
                if (audio) audio.playError();
                addChatMessage(t('chatMessages.channelError'), 'alert', activeChatTab);
            }, 200);
        }
    }

    // After message sent: If we came from Semi Mode, return there
    if (wasSemiActive) {
        chatState = 1;
        wasSemiActive = false;
        updateChatUI();
        // Return focus to game (Canvas)
        const canvas = document.getElementById('gameCanvas');
        if (canvas) canvas.focus();
    }
}

// --- INIT FUNCTION ---
function initChatSystem() {
    console.log("Chat system initializing...");
    updateChatUI(); // Apply initial mode (1: Semi)

    const sendBtn = document.getElementById('chat-send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendUserMessage);
    }

    // Input listener: Command mode detection (Orange Color)
    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('input', (e) => {
            if (input.value.startsWith('/')) {
                if (!input.classList.contains('command-mode')) {
                    input.classList.add('command-mode');
                }
            } else {
                if (input.classList.contains('command-mode')) {
                    input.classList.remove('command-mode');
                }
            }
        });
    }

    window.addEventListener('keydown', (e) => {
        const input = document.getElementById('chat-input');

        if (e.key === 'Enter') {
            if (document.activeElement === input) {
                // If input focused and Enter pressed -> Send Message
                sendUserMessage();
            } else {
                // If semi mode and input not focused -> ACTIVATE
                wasSemiActive = true;
                chatState = 2; // Activate
                updateChatUI();
                e.preventDefault();
                setTimeout(() => {
                    if (input) input.focus();
                }, 50);
            }
        }

        // Cancel with ESC (Close if input is open)
        if (e.key === 'Escape') {
            if (chatState === 2 && wasSemiActive) {
                chatState = 1;
                wasSemiActive = false;
                updateChatUI();
                if (input) {
                    input.value = ''; // Clear typed text
                    input.classList.remove('command-mode'); // Clear style
                    input.blur();
                }
            }
        }
    });
}

// Window exports for backward compatibility
if (typeof window !== 'undefined') {
    window.chatHistory = chatHistory;
    window.addChatMessage = addChatMessage;
    window.initChatSystem = initChatSystem;
    window.switchChatTab = switchChatTab;
}