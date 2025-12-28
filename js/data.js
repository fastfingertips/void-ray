/**
 * Void Ray - Data and Configuration (ES6 Module)
 * Game constants, configuration objects, and initial data.
 */

// --- WORLD SIZE ---
export const WORLD_SIZE = 120000;

// --- GAME CONFIGURATION ---
export const GAME_CONFIG = {
    LOCATIONS: {
        NEXUS: { x: 3000, y: 3000 },
        STORAGE_CENTER: { x: 2400, y: 2400 },
        REPAIR_STATION: { x: 3600, y: 3200 },
        PLAYER_START: { x: 3000, y: 3800 },
        PLAYER_RESPAWN: { x: 3600, y: 3200 }
    },

    WORLD_GEN: {
        PLANET_COUNT: 1200,
        STAR_COUNT: 5000,
        SAFE_ZONE_RADIUS: 2000,
        WORMHOLE_COUNT: 25
    },

    WORMHOLE: {
        RADIUS: 150,
        COLOR_CORE: "#8b5cf6",
        COLOR_OUTER: "#c4b5fd",
        TELEPORT_SAFE_DISTANCE: 5000,
        SPIN_SPEED: 0.05,
        GRAVITY_RADIUS: 3500,
        GRAVITY_FORCE: 180
    },

    CAMERA: {
        INITIAL_ZOOM: 0.2,
        DEFAULT_ZOOM: 1.0,
        LERP_SPEED: 0.05,
        ADAPTIVE_FACTOR: 30,
        MAX_OFFSET: 400
    },

    PLAYER: {
        BASE_XP: 150,
        BASE_HEALTH: 100,
        BASE_ENERGY: 100,
        BASE_CAPACITY: 150,
        CAPACITY_PER_LEVEL: 25,
        SCAN_RADIUS: 4000,
        RADAR_RADIUS: 10000,
        BASE_TAIL_COUNT: 20,
        BOOST_TAIL_COUNT: 50,
        LIGHT_JUMP_EFFICIENCY: 750,
        LIGHT_JUMP_CHARGE_TIME: 180,
        LIGHT_JUMP_CHARGE_DRAIN: 0.25,
        LIGHT_JUMP_SPEED: 250,
        ENERGY_COST: {
            BOOST: 0.05,
            MOVE: 0.002,
            REGEN: 0.01
        }
    },

    ECHO: {
        BASE_ENERGY: 100,
        BASE_CAPACITY: 80,
        CAPACITY_PER_LEVEL: 10,
        SCAN_RADIUS: 4000,
        RADAR_RADIUS: 10000,
        DRAIN_RATE: 0.005,
        OUT_OF_BOUNDS_DRAIN: 0.5,
        INTERACTION_DIST: 350,
        SIGNAL_INTERFERENCE_START: 0.6
    },

    PLANETS: {
        RADIUS: {
            LEGENDARY: 120,
            TOXIC: 500,
            LOST: 80,
            TARDIGRADE: 50,
            BASE: 40,
            VARIANCE: 60
        }
    },

    ECONOMY: {
        UPGRADE_COST_MULTIPLIER: 1.5,
        LEVEL_XP_MULTIPLIER: 1.5,
        XP_VARIANCE_MIN: 0.5,
        XP_VARIANCE_MAX: 1.5
    },

    LOOT_DISTRIBUTION: [
        { count: 0, weight: 20 },
        { count: 1, weight: 45 },
        { count: 2, weight: 25 },
        { count: 3, weight: 7 },
        { count: 4, weight: 3 }
    ]
};

// --- INTRO SEQUENCE (Dynamic i18n support) ---
export const getIntroSequence = () => {
    const t = window.t || ((key) => key.split('.').pop());
    return [
        { time: 0, text: t('intro.systemStarting'), type: "system" },
        { time: 1000, text: t('intro.calibratingSensors'), type: "info" },
        { time: 3500, text: t('intro.welcomePilot'), type: "loot" }
    ];
};
export const INTRO_SEQUENCE = getIntroSequence();

// --- MESSAGES (Dynamic i18n support) ---
const getMessages = () => {
    const t = window.t || ((key) => key.split('.').pop());
    return {
        ECHO: {
            SPAWN: t('messages.echo.spawn'),
            DETACH: t('messages.echo.detach'),
            MERGE: t('messages.echo.merge'),
            MERGE_DESC: t('messages.echo.mergeDesc'),
            COMING: t('messages.echo.coming'),
            LOST_SIGNAL: t('messages.echo.lostSignal'),
            LOST_SIGNAL_DESC: t('messages.echo.lostSignalDesc'),
            RANGE_WARNING: t('messages.echo.rangeWarning')
        },
        UI: {
            INVENTORY_FULL: t('messages.ui.inventoryFull'),
            ROUTE_CREATED: t('messages.ui.routeCreated'),
            CAMERA_RESET: t('messages.ui.cameraReset'),
            CAMERA_RESET_DESC: t('messages.ui.cameraResetDesc'),
            SAFE_ZONE_ENTER: t('messages.ui.safeZoneEnter'),
            SAFE_ZONE_ENTER_DESC: t('messages.ui.safeZoneEnterDesc'),
            SAFE_ZONE_EXIT: t('messages.ui.safeZoneExit'),
            SAFE_ZONE_EXIT_DESC: t('messages.ui.safeZoneExitDesc'),
            WORMHOLE_ENTER: t('messages.ui.wormholeEnter'),
            WORMHOLE_DESC: t('messages.ui.wormholeDesc'),
            JUMP_FAIL_ENERGY: t('messages.ui.jumpFailEnergy'),
            JUMP_FAIL_UNPREDICTABLE: t('messages.ui.jumpFailUnpredictable'),
            JUMP_CANCELLED: t('messages.ui.jumpCancelled'),
            JUMP_PHASE_1: t('messages.ui.jumpPhase1'),
            JUMP_PHASE_2: t('messages.ui.jumpPhase2'),
            JUMP_PHASE_3: t('messages.ui.jumpPhase3')
        }
    };
};

// Export as a getter that returns fresh translations
export const MESSAGES = new Proxy({}, {
    get: (target, prop) => getMessages()[prop]
});

// --- INITIAL PLAYER DATA ---
export const INITIAL_PLAYER_DATA = {
    stardust: 0,
    upgrades: {
        playerSpeed: 0, playerTurn: 0, playerMagnet: 0, playerCapacity: 0,
        echoSpeed: 0, echoRange: 0, echoDurability: 0, echoCapacity: 0
    },
    equipment: {
        shield: null, engine: null, weaponL: null, weaponR: null, sensor: null, hull: null
    },
    stats: {
        maxSpeed: 0, echoMaxSpeed: 0, totalResources: 0, distance: 0,
        totalStardust: 0, totalSpentStardust: 0, totalEnergySpent: 0,
        timeIdle: 0, timeMoving: 0, timeAI: 0
    }
};

// --- RARITY SYSTEM ---
export const RARITY = {
    COMMON: { id: 'common', name: 'Matter', color: '#94a3b8', prob: 0.5, xp: 10, value: 10 },
    RARE: { id: 'rare', name: 'Crystal', color: '#38bdf8', prob: 0.2, xp: 40, value: 30 },
    EPIC: { id: 'epic', name: 'Essence', color: '#c084fc', prob: 0.1, xp: 100, value: 100 },
    LEGENDARY: { id: 'legendary', name: 'Relic', color: '#fbbf24', prob: 0.04, xp: 500, value: 400 },
    TOXIC: { id: 'toxic', name: 'Data Fog', color: '#10b981', prob: 0.01, xp: 0, value: 0 },
    TARDIGRADE: { id: 'tardigrade', name: 'Tardigrade Nest', color: '#C7C0AE', prob: 0.02, xp: 20, value: 0 },
    LOST: { id: 'lost', name: 'Lost Cargo', color: '#a855f7', prob: 0, xp: 0, value: 0 }
};

// --- LOOT DATABASE ---
export const LOOT_DB = {
    common: ["Hydrogen", "Carbon Dust", "Iron", "Silica"],
    rare: ["Ice Core", "Sapphire", "Ionized Gas"],
    epic: ["Nebula Essence", "Star Fragment", "Plasma"],
    legendary: ["Time Crystal", "Black Hole Remnant"],
    toxic: ["Static Noise", "Corrupted Sector"],
    tardigrade: ["Tardigrade"],
    lost: ["LOST SIGNAL"]
};

// --- ITEM TYPES (RPG System) ---
export const ITEM_TYPES = {
    WEAPON: { id: 'weapon', label: 'Laser Module', icon: '⌖' },
    ENGINE: { id: 'engine', label: 'Ion Engine', icon: '▲' },
    SHIELD: { id: 'shield', label: 'Energy Shield', icon: '◊' },
    SENSOR: { id: 'sensor', label: 'Radar Unit', icon: '◎' },
    HULL: { id: 'hull', label: 'Nano Plating', icon: '⬢' }
};

// --- RPG ITEMS ---
export const RPG_ITEMS = {
    weapon: ["Photon Beam", "Plasma Cannon", "Quantum Laser", "Antimatter Projector", "Void Cutter"],
    engine: ["Warp Drive", "Ion Thruster", "Fusion Reactor", "Dark Matter Engine", "Hyperdrive"],
    shield: ["Magnetic Shield", "Plasma Barrier", "Deflector Shield", "Mirror Field Generator"],
    sensor: ["Deep Space Radar", "Spectral Scanner", "Bio-Sensor", "Long Range Array"],
    hull: ["Titanium Armor", "Carbon Fiber Hull", "Reactive Armor", "Crystal Plating"]
};

// --- BONUS TYPES ---
export const BONUS_TYPES = [
    { id: 'thrust', name: 'Thrust Power', unit: '%', min: 2, max: 20, weight: 25 },
    { id: 'maneuver', name: 'Maneuverability', unit: '%', min: 5, max: 30, weight: 20 },
    { id: 'energy_max', name: 'Max Energy', unit: '', min: 20, max: 200, weight: 25 },
    { id: 'energy_regen', name: 'Energy Regen', unit: '%', min: 5, max: 25, weight: 20 },
    { id: 'fuel_save', name: 'Fuel Save', unit: '%', min: 5, max: 30, weight: 15 },
    { id: 'radar_range', name: 'Radar Range', unit: 'km', min: 1, max: 10, weight: 20 },
    { id: 'scan_speed', name: 'Scan Speed', unit: '%', min: 5, max: 40, weight: 15 },
    { id: 'magnet', name: 'Magnet Range', unit: '%', min: 5, max: 50, weight: 25 },
    { id: 'xp_gain', name: 'Data Analysis (XP)', unit: '%', min: 5, max: 30, weight: 20 },
    { id: 'cargo', name: 'Cargo Capacity', unit: '', min: 10, max: 100, weight: 20 },
    { id: 'hull_hp', name: 'Hull Integrity', unit: '', min: 50, max: 500, weight: 30 },
    { id: 'shield_cap', name: 'Shield Capacity', unit: '', min: 20, max: 200, weight: 20 },
    { id: 'gravity_res', name: 'Gravity Resistance', unit: '%', min: 5, max: 25, weight: 15 },
    { id: 'rad_res', name: 'Radiation Protection', unit: '%', min: 5, max: 30, weight: 15 }
];

// --- UPGRADES (Dynamic i18n support) ---
export const getUpgrades = () => {
    const t = window.t || ((key) => key.split('.').pop());
    return {
        playerSpeed: { name: t('upgrades.playerSpeed.name'), desc: t('upgrades.playerSpeed.desc'), baseCost: 100, max: 5 },
        playerTurn: { name: t('upgrades.playerTurn.name'), desc: t('upgrades.playerTurn.desc'), baseCost: 150, max: 5 },
        playerMagnet: { name: t('upgrades.playerMagnet.name'), desc: t('upgrades.playerMagnet.desc'), baseCost: 200, max: 5 },
        playerCapacity: { name: t('upgrades.playerCapacity.name'), desc: t('upgrades.playerCapacity.desc'), baseCost: 300, max: 5 },
        echoSpeed: { name: t('upgrades.echoSpeed.name'), desc: t('upgrades.echoSpeed.desc'), baseCost: 150, max: 5 },
        echoRange: { name: t('upgrades.echoRange.name'), desc: t('upgrades.echoRange.desc'), baseCost: 250, max: 5 },
        echoDurability: { name: t('upgrades.echoDurability.name'), desc: t('upgrades.echoDurability.desc'), baseCost: 200, max: 5 },
        echoCapacity: { name: t('upgrades.echoCapacity.name'), desc: t('upgrades.echoCapacity.desc'), baseCost: 250, max: 5 }
    };
};

// Create a proxy to get fresh translations each time
export const UPGRADES = new Proxy({}, {
    get: (target, prop) => {
        const upgrades = getUpgrades();
        return upgrades[prop];
    },
    ownKeys: () => ['playerSpeed', 'playerTurn', 'playerMagnet', 'playerCapacity', 'echoSpeed', 'echoRange', 'echoDurability', 'echoCapacity'],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true })
});

// --- TIPS (Dynamic i18n support) ---
export const getTips = () => {
    const t = window.t || ((key) => key.split('.').pop());
    return [
        t('tips.tardigrade'),
        t('tips.wormholes'),
        t('tips.rarePlanets'),
        t('tips.enchantedEngines'),
        t('tips.spaceBoost'),
        t('tips.inventoryFull'),
        t('tips.lightJump')
    ];
};
export const TIPS = getTips();

// --- MAP CONFIGURATION ---
export const MAP_CONFIG = {
    grid: { major: 20000, minor: 5000, rings: [5000, 10000] },
    minimap: { size: 180, bg: "rgba(0, 0, 0, 0.8)", border: "rgba(255,255,255,0.1)", scanColor: "rgba(16, 185, 129, 0.4)", radius: 90 },
    bigmap: { bgOverlay: "rgba(0,0,0,0.4)", gridColor: "rgba(255,255,255,0.1)", margin: 50 },
    colors: {
        player: "#38bdf8", nexus: "#ffffff", repair: "#10b981", storage: "#a855f7",
        echo: "#67e8f9", wormhole: "#8b5cf6", target: "#ef4444",
        scanArea: "rgba(16, 185, 129, 0.05)", radarArea: "rgba(251, 191, 36, 0.03)", radarStroke: "rgba(251, 191, 36, 0.6)"
    },
    zoom: { min: 0.5, max: 1.5, speed: 0.001 }
};

// --- DEFAULT GAME SETTINGS ---
export const DEFAULT_GAME_SETTINGS = {
    showNexusArrow: true, showRepairArrow: false, showStorageArrow: false, showEchoArrow: true,
    hudOpacity: 1.0, windowOpacity: 1.0, hudHoverEffect: false, showShipBars: false,
    autoHideHUD: false, autoHideDelay: 5000,
    cameraOffsetX: 0, cameraOffsetY: 0, adaptiveCamera: false, smoothCameraTransitions: true,
    developerMode: false, enableConsole: false, showGravityFields: false, showHitboxes: false,
    showVectors: false, showTargetVectors: false, showFps: false, godMode: false, hidePlayer: false,
    enableCRT: false, crtIntensity: 50, showStars: true, starBrightness: 100, showGrid: false,
    themeColor: '#94d8c3', themeHue: 162, themeSat: 47
};

// -------------------------------------------------------------------------
// WINDOW EXPORTS (for backward compatibility with non-module scripts)
// -------------------------------------------------------------------------
if (typeof window !== 'undefined') {
    window.WORLD_SIZE = WORLD_SIZE;
    window.GAME_CONFIG = GAME_CONFIG;
    window.INTRO_SEQUENCE = INTRO_SEQUENCE;
    window.MESSAGES = MESSAGES;
    window.INITIAL_PLAYER_DATA = INITIAL_PLAYER_DATA;
    window.RARITY = RARITY;
    window.LOOT_DB = LOOT_DB;
    window.ITEM_TYPES = ITEM_TYPES;
    window.RPG_ITEMS = RPG_ITEMS;
    window.BONUS_TYPES = BONUS_TYPES;
    window.UPGRADES = UPGRADES;
    window.TIPS = TIPS;
    window.MAP_CONFIG = MAP_CONFIG;
    window.DEFAULT_GAME_SETTINGS = DEFAULT_GAME_SETTINGS;
}