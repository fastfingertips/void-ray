import Utils from './utils.js';

/**
 * Void Ray - Tutorial System
 * Step-by-step guide to teach game basics.
 */

// Helper to get translation
const getTutorialText = (key) => {
    const t = window.t || ((k) => k.split('.').pop());
    return t(`tutorialSteps.${key}`);
};

const TUTORIAL_STEPS = [
    {
        id: 'intro_welcome',
        get text() { return getTutorialText('introWelcome'); },
        trigger: () => true, // Triggers immediately at start
        checkComplete: () => Math.hypot(player.vx, player.vy) > 2, // When moving
        delay: 1000
    },
    {
        id: 'intro_boost',
        get text() { return getTutorialText('introBoost'); },
        trigger: () => TutorialManager.isStepCompleted('intro_welcome'),
        checkComplete: () => keys && keys[" "], // When Space is pressed
        delay: 500
    },
    {
        id: 'first_resource',
        get text() { return getTutorialText('firstResource'); },
        trigger: () => TutorialManager.isStepCompleted('intro_boost'),
        checkComplete: () => collectedItems.length > 0,
        delay: 2000
    },
    {
        id: 'inventory_check',
        get text() { return getTutorialText('inventoryCheck'); },
        trigger: () => TutorialManager.isStepCompleted('first_resource'),
        checkComplete: () => typeof inventoryOpen !== 'undefined' && inventoryOpen,
        delay: 1000
    },
    {
        id: 'nexus_find',
        get text() { return getTutorialText('nexusFind'); },
        trigger: () => collectedItems.length >= 5, // After collecting some resources
        checkComplete: () => Utils.distEntity(player, nexus) < 400,
        delay: 500
    },
    {
        id: 'nexus_trade',
        get text() { return getTutorialText('nexusTrade'); },
        trigger: () => TutorialManager.isStepCompleted('nexus_find') && Utils.distEntity(player, nexus) < 400,
        checkComplete: () => typeof nexusOpen !== 'undefined' && nexusOpen,
        delay: 0
    },
    {
        id: 'echo_intro',
        get text() { return getTutorialText('echoIntro'); },
        trigger: () => player.level >= 2 && !echoRay,
        checkComplete: () => player.level >= 3,
        delay: 2000
    },
    {
        id: 'echo_command',
        get text() { return getTutorialText('echoCommand'); },
        trigger: () => echoRay !== null,
        checkComplete: () => echoRay && !echoRay.attached,
        delay: 1000
    }
];

class TutorialSystem {
    constructor() {
        this.activeStep = null;
        this.completedSteps = new Set();
        this.uiContainer = null;
        this.uiText = null;
        this.uiIcon = null;

        // States: 'idle', 'active', 'success', 'waiting_next'
        this.state = 'idle';
        this.timer = 0;
    }

    init() {
        this.uiContainer = document.getElementById('tutorial-box');
        this.uiText = document.getElementById('tutorial-text');
        this.uiIcon = document.getElementById('tutorial-icon');

        console.log("Tutorial System initialized.");
    }

    loadProgress(savedSteps) {
        if (Array.isArray(savedSteps)) {
            this.completedSteps = new Set(savedSteps);
        }
    }

    getExportData() {
        return Array.from(this.completedSteps);
    }

    isStepCompleted(id) {
        return this.completedSteps.has(id);
    }

    update(dt) {
        if (!player || !this.uiContainer) return;

        // 1. Search for New Task
        if (this.state === 'idle') {
            for (const step of TUTORIAL_STEPS) {
                if (!this.completedSteps.has(step.id)) {
                    if (step.trigger()) {
                        // Could use waiting state for delay control but keeping it simple
                        this.startStep(step);
                        break;
                    }
                }
            }
        }

        // 2. Check Active Task
        if (this.state === 'active' && this.activeStep) {
            if (this.activeStep.checkComplete()) {
                this.completeStep();
            }
        }

        // 3. Success Screen Timer
        if (this.state === 'success') {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.uiContainer.classList.remove('visible', 'success');
                this.state = 'idle';
                this.activeStep = null;
            }
        }
    }

    startStep(step) {
        this.activeStep = step;
        this.state = 'active';

        this.uiText.innerHTML = step.text;
        this.uiIcon.innerHTML = "!";

        this.uiContainer.classList.remove('success');
        this.uiContainer.classList.add('visible');

        // New task sound
        if (typeof audio !== 'undefined' && audio) audio.playChime({ id: 'common' });
    }

    completeStep() {
        this.completedSteps.add(this.activeStep.id);
        this.state = 'success';
        this.timer = 3000; // Stay on screen for 3 seconds

        this.uiContainer.classList.add('success');
        this.uiIcon.innerHTML = "✔";

        // If SaveManager exists, save immediately
        if (typeof SaveManager !== 'undefined') SaveManager.save(true);

        // Achievement sound
        if (typeof audio !== 'undefined' && audio) audio.playChime({ id: 'rare' });
    }

    reset() {
        this.completedSteps.clear();
        this.state = 'idle';
        this.activeStep = null;
        if (this.uiContainer) this.uiContainer.classList.remove('visible');
    }
}

window.TutorialManager = new TutorialSystem();