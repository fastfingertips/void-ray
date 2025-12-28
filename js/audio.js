/**
 * Void Ray - Audio Management (ES6 Module)
 * Handles music crossfade and sound effects.
 */

let volMusic = 0.2, volSFX = 0.8;

export class ZenAudio {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Get music elements
        this.musicBase = document.getElementById('music-base');
        this.musicSpace = document.getElementById('music-space');
        this.sfxError = document.getElementById('sfx-error'); // Error sound

        this.currentTrack = null; // Currently active track
        this.activeTheme = '';    // 'base' or 'space'
        this.fadeInterval = null; // Crossfade animation timer

        // Mute sounds initially (for fade-in)
        if (this.musicBase) this.musicBase.volume = 0;
        if (this.musicSpace) this.musicSpace.volume = 0;

        // Initial setting for error sound (low volume)
        if (this.sfxError) this.sfxError.volume = Math.max(0, Math.min(1, volSFX * 0.2));

        this.scale = [196.00, 220.00, 261.63, 293.66, 329.63, 392.00];
        this.lastChimeTime = 0;
        this.lastEvolveTime = 0;
    }

    init() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        // When the game starts, playTheme will be called from game.js.
    }

    /**
     * Smoothly crossfades between two music tracks.
     * @param {string} themeName - 'base' or 'space'
     */
    playTheme(themeName) {
        if (this.activeTheme === themeName) return;
        this.activeTheme = themeName;

        const targetTrack = themeName === 'base' ? this.musicBase : this.musicSpace;
        const fadeOutTrack = themeName === 'base' ? this.musicSpace : this.musicBase;

        console.log(`♫ Music Transition Started: ${themeName.toUpperCase()} (Soft Fade)`);

        // Start target track silently (if not playing)
        if (targetTrack.paused) {
            targetTrack.volume = 0;
            targetTrack.play().catch(e => console.warn("Autoplay blocked by browser:", e));
        }

        // Cancel existing fade operation if any
        if (this.fadeInterval) clearInterval(this.fadeInterval);

        // --- SOFT CROSSFADE SETTINGS ---
        const duration = 3000; // 3 Seconds (Softer)
        const fps = 60; // Updates per second
        const stepTime = 1000 / fps;
        const steps = duration / stepTime;
        let currentStep = 0;

        // Record initial volume levels
        const startVolIn = targetTrack.volume;
        const startVolOut = fadeOutTrack ? fadeOutTrack.volume : 0;

        this.fadeInterval = setInterval(() => {
            currentStep++;
            const ratio = currentStep / steps; // 0.0 -> 1.0 progress

            // Easing Formula: To make it sound more natural
            // Slightly curved transition instead of simple linear
            const fadeLevel = ratio;

            // 1. New Music Rising (Fade In)
            // Limit with volMusic (max level in settings)
            targetTrack.volume = Math.min(1, startVolIn + (volMusic - startVolIn) * fadeLevel);

            // 2. Old Music Falling (Fade Out)
            if (fadeOutTrack && !fadeOutTrack.paused) {
                fadeOutTrack.volume = Math.max(0, startVolOut * (1 - fadeLevel));
            }

            // Transition Complete
            if (currentStep >= steps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;

                // Set final values to be sure
                targetTrack.volume = volMusic;
                if (fadeOutTrack) {
                    fadeOutTrack.volume = 0;
                    fadeOutTrack.pause();
                    fadeOutTrack.currentTime = 0; // Rewind to beginning
                }
                this.currentTrack = targetTrack;
            }
        }, stepTime);
    }

    /**
     * Instant update when volume is changed from settings panel.
     */
    updateMusicVolume(newVolume) {
        volMusic = newVolume;
        // If there is a track currently playing, update its volume immediately
        if (this.currentTrack && !this.currentTrack.paused) {
            // Update if there is no ongoing fade operation
            if (!this.fadeInterval) {
                this.currentTrack.volume = volMusic;
            }
        }
    }

    // --- SOUND EFFECTS ---

    // NEW: Error Sound (Very Low - 20% of volSFX)
    playError() {
        if (this.sfxError) {
            // Give only 20% of the general sfx volume to avoid annoyance
            const quietVolume = Math.max(0, Math.min(1, volSFX * 0.2));
            this.sfxError.volume = quietVolume;
            this.sfxError.currentTime = 0; // Rewind to beginning
            this.sfxError.play().catch(e => console.warn("Error sfx blocked", e));
        }
    }

    playChime(rarity) {
        const now = this.ctx.currentTime;
        if (now - this.lastChimeTime < 0.08) return;
        this.lastChimeTime = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const freq = this.scale[Math.floor(Math.random() * this.scale.length)];

        if (rarity.id === 'lost') osc.type = 'square';
        else if (rarity.id === 'tardigrade') osc.type = 'triangle';
        else osc.type = rarity.id === 'legendary' ? 'triangle' : 'sine';

        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volSFX * 0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(now + 3.1);
    }

    playCash() {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(500, t); osc.frequency.exponentialRampToValueAtTime(1000, t + 0.1);
        gain.gain.setValueAtTime(volSFX * 0.2, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(t + 0.35);
    }

    playEvolve() {
        const now = this.ctx.currentTime;
        if (now - this.lastEvolveTime < 0.5) return;
        this.lastEvolveTime = now;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'triangle'; osc.frequency.setValueAtTime(100, now); osc.frequency.linearRampToValueAtTime(600, now + 2);
        gain.gain.setValueAtTime(volSFX * 0.3, now); gain.gain.linearRampToValueAtTime(0, now + 2.5);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(now + 3);
    }

    playToxic() {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(150, this.ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(volSFX * 0.5, this.ctx.currentTime); gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.5);
    }
}

// Window export for backward compatibility
if (typeof window !== 'undefined') {
    window.ZenAudio = ZenAudio;
}