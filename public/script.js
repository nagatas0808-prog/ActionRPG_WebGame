const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const titleScreen = document.getElementById('title-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const levelupScreen = document.getElementById('levelup-screen');
const upgradeBtns = document.querySelectorAll('.upgrade-btn');

const scoreBtn = document.getElementById('score');
const finalScoreBtn = document.getElementById('final-score');
const playerLevelBtn = document.getElementById('player-level');
const finalLevelBtn = document.getElementById('final-level');

const healthBar = document.getElementById('health-bar');
const expBar = document.getElementById('exp-bar');
const specialBar = document.getElementById('special-bar');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const messageDisplay = document.getElementById('message-display');

// --- Perk System ---
const availablePerks = [
    { id: 'kensei', name: '剣聖', desc: 'リーチ ＋ 攻撃範囲の大幅拡大' },
    { id: 'shinsoku', name: '神速', desc: '移動速度 ＋ 回避距離（ダッシュ性能）UP' },
    { id: 'zetsuei', name: '絶影', desc: 'クリティカル率 ＋ クリティカルダメージUP' },
    { id: 'goyoku', name: '強欲', desc: '獲得経験値 1.5倍' },
    { id: 'meikyo', name: '明鏡止水', desc: 'ジャスト回避でHP回復 ＋ スロー演出延長' },
    { id: 'kongo', name: '金剛', desc: 'のけぞり無効 ＋ 低HP時に攻撃力大幅アップ' },
    { id: 'kenkon', name: '乾坤一擲', desc: 'カウンター強化 ＋ 被弾時のダメージ反射' },
    { id: 'ougi', name: '奥義の真髄', desc: 'SP上昇量アップ ＋ 奥義（光破）の範囲拡大' },
    { id: 'kinkyu', name: '緊急回避', desc: '被弾直前にSPを消費して自動的に回避を発動' },
    { id: 'rengeki', name: '連撃', desc: '攻撃速度の向上（コンボ速度）' }
];

// --- Asset Manager ---
const AssetManager = {
    images: {},
    loadImages: function () {
        this.images.golem = new Image();
        this.images.golem.src = 'assets/enemies/golem.png?v=8';
        this.images.orc = new Image();
        this.images.orc.src = 'assets/enemies/orc.png?v=10';
        this.images.mage = new Image();
        this.images.mage.src = 'assets/enemies/mage.png?v=2';
        this.images.boss = new Image();
        this.images.boss.src = 'assets/enemies/boss.png?v=2';
        this.images.player = new Image();
        this.images.player.src = 'assets/hero_sprite.png?v=1';
    }
};
AssetManager.loadImages();

// --- Sound Effects Manager (Web Audio API) ---
const WebAudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

const sfx = {
    init: () => {
        if (!audioCtx) audioCtx = new WebAudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    },
    bgm: null,
    bgmGain: null,
    loadBGM: (url) => {
        if (sfx.bgm) return;
        sfx.bgm = new Audio(url);
        sfx.bgm.loop = true;
        sfx.bgm.volume = 0.4;
    },
    playBGM: () => {
        if (sfx.bgm) {
            sfx.bgm.play().catch(e => console.log("BGM play blocked:", e));
        }
    },
    stopBGM: () => {
        if (sfx.bgm) {
            sfx.bgm.pause();
            sfx.bgm.currentTime = 0;
        }
    },
    playSwing: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    },
    playHit: () => {
        if (!audioCtx) return;
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        const gain = audioCtx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        noise.start();
    },
    playEvade: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    },
    playSpecial: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    },
    playDamage: () => {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
};

// Game State
let gameState = 'title'; // 'title', 'tutorial', 'countdown', 'playing', 'levelup', 'bosstransition', 'bossfight', 'gameover'
let previousGameState = 'title'; // To remember state when pausing for level up
let gameLoopId = null; // Track animation frame to prevent duplicate loops
let score = 0;
let lastTime = 0;
let deltaTime = 0;
let timeScale = 1; // Used for slow motion
let slowMoTimer = 0;

// Phase 1: Survival Timer
const SURVIVAL_TIME_SECONDS = 60; // 60 seconds for Phase 1
let survivalTimer = SURVIVAL_TIME_SECONDS;

// Countdown State
let countdownValue = 3; // 3, 2, 1, 0(=GO!)
let countdownTimer = 0;
const COUNTDOWN_STEP_DURATION = 0.8; // seconds per number
const COUNTDOWN_GO_DURATION = 0.6; // duration for "GO!" display

// Boss Alert State
let bossAlertActive = false;
let bossAlertFlashEl = null; // DOM element for red flash

// Input State
// Note: We use lowercase keys for uniform checking in the event listener
const keys = {
    w: false, a: false, s: false, d: false,
    arrowup: false, arrowleft: false, arrowdown: false, arrowright: false,
    j: false, k: false, l: false, ' ': false
};
const mouse = { x: 0, y: 0, left: false, right: false };
let currentPerkIndex = 0; // For keyboard navigation of levelup perks

// --- Event Listeners ---
const lastKeyTimes = { w: 0, a: 0, s: 0, d: 0, arrowup: 0, arrowleft: 0, arrowdown: 0, arrowright: 0 };
const doubleTapThreshold = 400; // ms (Increased from 250ms for easier double-tap)

window.addEventListener('keydown', e => {
    if (e.repeat) return; // Prevent key hold from triggering multiple keydowns
    const key = e.key.toLowerCase();

    // Register key press first so evade logic knows the direction
    if (keys.hasOwnProperty(key)) keys[key] = true;
    if (e.key === ' ') keys[' '] = true; // Spacebar support

    // Double tap detection for WASD and Arrows
    const moves = ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
    if (moves.includes(key)) {
        const now = performance.now();
        if (now - lastKeyTimes[key] < doubleTapThreshold) {
            handleEvadeInput();
        }
        lastKeyTimes[key] = now;
    }

    // Tab key toggles auto lock-on
    if (e.key === 'Tab') {
        e.preventDefault();
        if (player) {
            player.autoLockOn = !player.autoLockOn;
            showMessage(player.autoLockOn ? 'ロックオン：ON' : 'ロックオン：OFF', 'just-evade');
        }
    }

    // Allow J or Space for Attack
    if (e.key === 'j' || e.key === 'j' || e.key === ' ') handleAttackInput();

    // Allow K or Shift for Evade
    if (key === 'k' || key === 'shift') handleEvadeInput();

    // Allow L for Special Attack
    if (key === 'l') handleSpecialInput();

    // Menu Navigation
    if (gameState === 'title') {
        if (key === 'enter') {
            document.getElementById('title-screen').classList.remove('active');
            showTutorial();
        }
    } else if (gameState === 'tutorial') {
        // Any key dismisses tutorial
        dismissTutorial();
    } else if (gameState === 'gameover') {
        if (key === 'enter') {
            document.getElementById('game-over-screen').classList.remove('active');
            document.getElementById('boss-hud').classList.add('hide');
            startGame();
        }
    } else if (gameState === 'levelup') {
        const perkContainer = document.getElementById('perk-container');
        const buttons = perkContainer.querySelectorAll('.perk-btn');
        if (buttons.length > 0) {
            if (key === 'arrowup' || key === 'w') {
                buttons[currentPerkIndex].classList.remove('selected-perk');
                // Move UP in the list (index decreases)
                currentPerkIndex = (currentPerkIndex - 1 + buttons.length) % buttons.length;
                buttons[currentPerkIndex].classList.add('selected-perk');
            } else if (key === 'arrowdown' || key === 's') {
                buttons[currentPerkIndex].classList.remove('selected-perk');
                // Move DOWN in the list (index increases)
                currentPerkIndex = (currentPerkIndex + 1) % buttons.length;
                buttons[currentPerkIndex].classList.add('selected-perk');
            } else if (key === 'enter' || key === ' ') {
                buttons[currentPerkIndex].click();
            }
        }
    }
});
window.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
    if (e.key === ' ') keys[' '] = false;
});
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
canvas.addEventListener('mousedown', e => {
    if (e.button === 0) { mouse.left = true; handleAttackInput(); }
    if (e.button === 2) {
        mouse.right = true;
        // Right click now triggers Special Attack instead of evade
        handleSpecialInput();
    }
});
canvas.addEventListener('mouseup', e => {
    if (e.button === 0) mouse.left = false;
    if (e.button === 2) mouse.right = false;
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

startBtn.addEventListener('click', () => showTutorial());
restartBtn.addEventListener('click', startGame);

function handleAttackInput() {
    if ((gameState === 'playing' || gameState === 'bossfight') && player) player.attack();
}

function handleEvadeInput() {
    if ((gameState === 'playing' || gameState === 'bossfight') && player) player.evade();
}

function handleSpecialInput() {
    if ((gameState === 'playing' || gameState === 'bossfight') && player && player.specialGauge >= player.maxSpecialGauge) {
        player.useSpecial();
    }
}

// --- Utility Functions ---
function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function showMessage(text, type) {
    messageDisplay.textContent = text;
    messageDisplay.className = '';

    // Force reflow to restart animation
    void messageDisplay.offsetWidth;

    messageDisplay.classList.add(`msg-${type}`);
}

// --- Sprite Preloading (Player sprite sheet handled via AssetManager) ---

// --- Classes ---

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 15; // Hitbox
        this.speed = 250; // pixels per second
        this.color = '#e8dbce'; // Silver/Parchment armor highlight
        this.maxHealth = 100;
        this.health = this.maxHealth;

        // RPG Stats
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.attackPower = 10;
        this.attackRange = 60;

        // Attack
        this.attackCooldown = 0.5; // seconds
        this.currentAttackCooldown = 0;
        this.attackAngle = 0;
        this.attackArc = Math.PI * 0.75; // 135-degree sweep
        this.isAttacking = false;

        // New Perks
        this.specialGaugeGain = 20;

        // New Perk Stats & Flags
        this.baseCritChance = 0; // chance to randomly proc 'hasCriticalNext'
        this.critDamageMultiplier = 5; // Default critical multiplier
        this.comboSpeedMultiplier = 1.0;
        this.expMultiplier = 1.0;
        this.evadeDistanceMultiplier = 1.0; // Default +20 per evade
        this.healOnKill = 0; // Default no heal
        this.justEvadeHealBonus = 0; // Bonus heal on Just Evade
        this.slowMoDurationMultiplier = 1.0; // Multiplier for Just Evade slow-mo
        this.superArmor = false; // Immunity to Hit Stun
        this.lowHpAttackBoost = false; // Increased attack when HP < 30%
        this.reflectDamage = false; // Reflect damage back to attacker
        this.counterBoost = false; // Increased Critical Damage after Just Evade
        this.specialRangeMultiplier = 1.0; // Multiplier for Special Attack AoE
        this.autoEvade = false; // Automatically consume SP to evade damage
        this.attackDuration = 0.15;
        this.attackTimer = 0;
        this.hasCriticalNext = false;

        // Combo System
        this.comboCount = 0; // 0, 1, 2 (3 hits max)
        this.lastComboCount = 1; // For rendering: stores the combo stage at attack start
        this.comboTimer = 0; // Time window to continue combo
        this.comboWindow = 0.6; // Seconds to input next combo hit

        // Auto Lock-On
        this.autoLockOn = true;

        // Special Attack State
        this.specialGauge = 0;
        this.maxSpecialGauge = 100;
        this.isSpecialAttacking = false;
        this.specialTimer = 0;
        this.specialDuration = 0.8;

        // Evade (Dash)
        this.evadeCooldown = 1.0;
        this.currentEvadeCooldown = 0;
        this.evadeSpeedMultiplier = 3.5;
        this.evadeDuration = 0.2;
        this.evadeTimer = 0;
        this.isEvading = false;

        // Hit Stun (Player)
        this.isStunned = false;
        this.stunTimer = 0;
        this.stunDuration = 0.3;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 1.0; // 1 second of i-frames after stun

        // Physics
        this.vx = 0;
        this.vy = 0;

        // Afterimage Trail
        this.trail = []; // {x, y, alpha, sprite, facingRight, time, frame, row}
        this.trailTimer = 0;
        this.trailInterval = 0.03;

        // Animation State
        this.animTimer = 0;
        this.animFrame = 0;
        this.animSpeed = 0.1; // seconds per frame

        // Visual Effects
        this.shakeTimer = 0;
        this.shakeIntensity = 5;
    }

    update(dt) {
        if (this.health <= 0) return;

        // Decrease Cooldowns
        if (this.currentAttackCooldown > 0) this.currentAttackCooldown -= dt;
        if (this.currentEvadeCooldown > 0) this.currentEvadeCooldown -= dt;
        if (this.shakeTimer > 0) this.shakeTimer -= dt;

        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) {
                this.isStunned = false;
                this.isInvincible = true; // Start i-frames after stun
                this.invincibleTimer = this.invincibleDuration;
            }
        }
        if (this.invincibleTimer > 0 && !this.isStunned) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) this.isInvincible = false;
        }

        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0; // Reset combo if window expires
            }
        }

        // Hit Stun
        if (this.isStunned) {
            // Apply knockback movement during stun
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
            this.y = Math.max(this.radius + 30, Math.min(canvas.height - this.radius, this.y));
            return; // Skip all other updates while stunned
        }

        // State updates
        if (this.isAttacking) {
            this.attackTimer -= dt;
            // Decelerate lunge during attack
            this.vx *= 0.85;
            this.vy *= 0.85;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.vx = 0;
                this.vy = 0;
            }
        }

        // Special Attack Logic
        if (this.isSpecialAttacking) {
            this.specialTimer -= dt;
            if (this.specialTimer <= 0) {
                this.isSpecialAttacking = false;
            }
        }

        if (this.isEvading) {
            this.evadeTimer -= dt;
            if (this.evadeTimer <= 0) {
                this.isEvading = false;
                this.vx = 0;
                this.vy = 0;
            }
        } else if (!this.isAttacking) {
            // Normal Movement
            let dx = 0;
            let dy = 0;
            if (keys.w || keys.arrowup) dy -= 1;
            if (keys.s || keys.arrowdown) dy += 1;
            if (keys.a || keys.arrowleft) dx -= 1;
            if (keys.d || keys.arrowright) dx += 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                this.vx = (dx / len) * this.speed;
                this.vy = (dy / len) * this.speed;
                // Update facing angle only when moving and not attacking
                if (!this.isAttacking) {
                    this.attackAngle = Math.atan2(dy, dx);
                }
            } else {
                this.vx = 0;
                this.vy = 0;

                // Mouse aiming fallback (only if lock-on is OFF)
                if (!this.isAttacking && !this.autoLockOn) {
                    this.attackAngle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
                }
            }
        } // End of else block for Normal Movement

        // Auto Lock-On: face nearest enemy
        if (this.autoLockOn && !this.isAttacking && !this.isEvading && enemies.length > 0) {
            let nearestDist = Infinity;
            let nearestEnemy = null;
            enemies.forEach(enemy => {
                const d = getDistance(this.x, this.y, enemy.x, enemy.y);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearestEnemy = enemy;
                }
            });
            if (nearestEnemy) {
                this.attackAngle = Math.atan2(nearestEnemy.y - this.y, nearestEnemy.x - this.x);
            }
        } else if (!this.autoLockOn && !this.isAttacking && !this.isEvading) {
            // Mouse aiming when lock-on is OFF and not moving
            if (this.vx === 0 && this.vy === 0) {
                this.attackAngle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
            }
        }

        // Set facing direction based on attack angle
        this.facingRight = Math.cos(this.attackAngle) >= 0;

        // Apply movement
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Boundaries
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius + 30, Math.min(canvas.height - this.radius, this.y));

        // Afterimage trail spawning
        this.trailTimer += dt;
        const shouldTrail = this.isEvading || this.isAttacking || this.isSpecialAttacking || (Math.abs(this.vx) > 100 || Math.abs(this.vy) > 100);
        if (shouldTrail && this.trailTimer >= this.trailInterval) {
            this.trailTimer = 0;
            // Capture current animation state for the trail (10-frame sprite sheet)
            let trailFrame = 0; // Default Idle
            const facing = this.facingRight ? 1 : -1; // 1 for right, -1 for left

            if (this.health <= 0) trailFrame = 9; // Death (v9)
            else if (this.isSpecialAttacking) trailFrame = 8; // Ougi (v9)
            else if (this.isAttacking) {
                // Map 1-indexed comboCount (1,2,3) to v9 frames (5, 6, 7)
                trailFrame = 4 + this.lastComboCount; 
            } else if (this.isEvading) {
                const moveAngle = Math.atan2(this.vy, this.vx);
                const facingAngle = facing === 1 ? 0 : Math.PI;
                const diff = Math.abs(moveAngle - facingAngle);
                const isMovingForward = diff < Math.PI / 2 || diff > (Math.PI * 3) / 2;
                trailFrame = isMovingForward ? 3 : 4; // 3: DashF, 4: Backstep (v9)
            } else if (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10) {
                const moveAngle = Math.atan2(this.vy, this.vx);
                const facingAngle = facing === 1 ? 0 : Math.PI;
                const diff = Math.abs(moveAngle - facingAngle);
                const isMovingForward = diff < Math.PI / 2 || diff > (Math.PI * 3) / 2;
                trailFrame = isMovingForward ? 1 : 2; // 1: RunF, 2: RunB (v9)
            } else {
                trailFrame = 0; // Idle
            }

            this.trail.push({
                x: this.x,
                y: this.y,
                alpha: 0.6,
                facingRight: this.facingRight,
                frame: trailFrame
            });
            if (this.trail.length > 12) this.trail.shift();
        }

        // --- Standard Animation Update (Simplified for Player) ---
        // Character doesn't have multi-frame loop animations currently, just state-based
        this.animFrame = 0; // Reset to idle (frame 0)
    }

    draw(ctx) {
        const t = performance.now();
        const isMoving = Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10;
        const img = AssetManager.images.player;

        if (!img || !img.complete) return;

        const cols = 10; // Back to 10 frames with clean v9 asset
        const sWidth = img.width / cols;
        const sHeight = img.height;
        const spriteW = 160; // Increased size for better presence
        const spriteH = 160;

        // Determine current animation frame (10-frame system):
        // 0:Idle, 1:Run Forward, 2:Run Backward, 3:Fwd Dash, 4:Backstep, 5:Attack1, 6:Attack2, 7:Attack3, 8:Ougi, 9:Death
        let frameX = 0; 
        const facing = this.facingRight ? 1 : -1; // 1 for right, -1 for left
        
        if (this.health <= 0) {
            frameX = 9; // Death (v9)
        } else if (this.isSpecialAttacking) {
            frameX = 8; // Ougi (v9)
        } else if (this.isAttacking) {
            // Map 1-indexed comboCount (1,2,3) to v9 frames (5, 6, 7)
            frameX = 4 + this.lastComboCount; 
        } else if (this.isEvading) {
            const moveAngle = Math.atan2(this.vy, this.vx);
            const facingAngle = facing === 1 ? 0 : Math.PI;
            const diff = Math.abs(moveAngle - facingAngle);
            const isMovingForward = diff < Math.PI / 2 || diff > (Math.PI * 3) / 2;
            frameX = isMovingForward ? 3 : 4; // 3: DashF, 4: Backstep (v9)
        } else if (isMoving) { // Running
            // Determine if running forward or backward relative to facing
            const moveAngle = Math.atan2(this.vy, this.vx);
            const facingAngle = facing === 1 ? 0 : Math.PI;
            const diff = Math.abs(moveAngle - facingAngle);
            const isMovingForward = diff < Math.PI / 2 || diff > (Math.PI * 3) / 2;
            
            frameX = isMovingForward ? 1 : 2; // 1: Run Forward, 2: Run Backward
        } else {
            frameX = 0; // Idle
        }

        // --- Draw Afterimage Trail ---
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const tr = this.trail[i];
            tr.alpha -= 0.02;
            if (tr.alpha <= 0) {
                this.trail.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = tr.alpha * 0.5;
            ctx.translate(tr.x, tr.y);
            if (!tr.facingRight) {
                ctx.scale(-1, 1);
            }
            
            if (this.hasCriticalNext) {
                ctx.filter = 'sepia(1) hue-rotate(20deg) saturate(3) brightness(1.5)';
            } else {
                ctx.filter = 'sepia(1) hue-rotate(180deg) saturate(2) brightness(1.5)';
            }
            
            ctx.drawImage(img, tr.frame * sWidth, 0, sWidth, sHeight, -spriteW / 2, -spriteH * 0.75, spriteW, spriteH);
            ctx.filter = 'none';
            ctx.restore();
        }

        ctx.save();

        // --- Stun/Invincibility Blinking ---
        if (this.isStunned) {
            ctx.globalAlpha = 0.4;
        } else if (this.isInvincible) {
            ctx.globalAlpha = Math.sin(t * 0.02) > 0 ? 1.0 : 0.15;
        }

        // --- 1. Drop Shadow ---
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.radius * 1.5, this.radius * 0.6, 0, 0, Math.PI * 2);
        const shadowGrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 1.5);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
        shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = shadowGrad;
        ctx.fill();

        // --- 2. Ambient Aura Particles ---
        // (保持: Aura particles and Critical graphics logic)
        if (!this.isStunned) {
            const particleCount = this.hasCriticalNext ? 8 : 3;
            for (let i = 0; i < particleCount; i++) {
                const angle = (t * 0.002 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
                const orbitR = 18 + Math.sin(t * 0.003 + i) * 6;
                const px = this.x + Math.cos(angle) * orbitR;
                const py = (this.y - spriteH * 0.3) + Math.sin(angle) * orbitR * 0.4;
                const pSize = 1.5 + Math.sin(t * 0.005 + i * 2) * 1;

                ctx.beginPath();
                ctx.arc(px, py, pSize, 0, Math.PI * 2);
                if (this.hasCriticalNext) {
                    ctx.fillStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(t * 0.004 + i) * 0.3})`;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#ffd700';
                } else {
                    ctx.fillStyle = `rgba(120, 180, 255, ${0.3 + Math.sin(t * 0.004 + i) * 0.2})`;
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = '#88bbff';
                }
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        if (this.hasCriticalNext) {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y - spriteH * 0.35, 25, 35, 0, 0, Math.PI * 2);
            const auraGrad = ctx.createRadialGradient(this.x, this.y - spriteH * 0.35, 5, this.x, this.y - spriteH * 0.35, 35);
            auraGrad.addColorStop(0, 'rgba(255,215,0,0.15)');
            auraGrad.addColorStop(0.7, 'rgba(255,215,0,0.05)');
            auraGrad.addColorStop(1, 'rgba(255,215,0,0)');
            ctx.fillStyle = auraGrad;
            ctx.fill();
        }

        // --- 4. Draw Character Sprite ---
        ctx.save();
        ctx.translate(this.x, this.y);
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }

        if (this.isEvading) {
            ctx.globalAlpha = Math.max(0.3, ctx.globalAlpha * 0.5);
        }

        // Draw current frame from simplified single-row sprite sheet
        ctx.drawImage(img, frameX * sWidth, 0, sWidth, sHeight, -spriteW / 2, -spriteH * 0.75, spriteW, spriteH);
        
        ctx.restore();
        ctx.restore(); // main save

        // --- 5. Slash Arc Effect ---
        if (this.isAttacking) {
            const progress = 1 - (this.attackTimer / this.attackDuration);
            const comboHit = this.comboCount || 1;
            const arcWidth = this.attackArc; // Use player's attackArc
            const baseAngle = this.attackAngle;

            ctx.beginPath();
            if (comboHit === 2) {
                ctx.ellipse(this.x, this.y, this.attackRange * progress, this.attackRange * 0.4 * progress,
                    0, baseAngle + arcWidth, baseAngle - arcWidth, true);
            } else {
                ctx.ellipse(this.x, this.y, this.attackRange * progress, this.attackRange * 0.4 * progress,
                    0, baseAngle - arcWidth, baseAngle + arcWidth);
            }

            // Outer glow
            ctx.lineWidth = comboHit === 3 ? 12 : 6;
            ctx.strokeStyle = this.hasCriticalNext
                ? `rgba(255, 215, 0, ${0.7 * (1 - progress)})`
                : `rgba(150, 200, 255, ${0.5 * (1 - progress)})`;
            ctx.stroke();
            // Inner bright
            ctx.lineWidth = comboHit === 3 ? 5 : 2;
            ctx.strokeStyle = this.hasCriticalNext
                ? `rgba(255, 255, 220, ${0.9 * (1 - progress)})`
                : `rgba(230, 245, 255, ${0.7 * (1 - progress)})`;
            ctx.stroke();
            ctx.closePath();
        }

        // --- 6. Special Attack Graphics ---
        if (this.isSpecialAttacking) {
            const progress = 1 - (this.specialTimer / this.specialDuration);
            // Visual size scales with level and ougi perk
            const levelScale = 1 + (this.level * 0.1);
            const r = this.attackRange * 3 * levelScale * this.specialRangeMultiplier;

            // Outer ring
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, r * progress, r * 0.5 * progress, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${0.35 * (1 - progress)})`;
            ctx.fill();
            ctx.lineWidth = 6;
            ctx.strokeStyle = `rgba(255, 215, 0, ${1 - progress})`;
            ctx.stroke();

            // Inner ring
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, r * 0.6 * progress, r * 0.3 * progress, 0, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = `rgba(255, 255, 200, ${0.8 * (1 - progress)})`;
            ctx.stroke();

            // Flash
            if (progress < 0.2) {
                ctx.beginPath();
                ctx.arc(this.x, this.y - 12, 50, 0, Math.PI * 2);
                const flashGrad = ctx.createRadialGradient(this.x, this.y - 12, 0, this.x, this.y - 12, 50);
                flashGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
                flashGrad.addColorStop(1, 'rgba(255,215,0,0)');
                ctx.fillStyle = flashGrad;
                ctx.fill();
            }
        }
    }

    attack() {
        if (this.isStunned || this.isEvading) return;

        // Combo logic: allow next hit if combo timer is active, or start fresh if cooldown is done
        const canAttack = this.currentAttackCooldown <= 0 || (this.comboTimer > 0 && this.comboCount < 3 && !this.isAttacking);

        if (canAttack) {
            sfx.playSwing();
            this.isAttacking = true;
            this.attackTimer = this.attackDuration;

            // Advance combo
            if (this.comboTimer > 0 && this.comboCount < 3) {
                this.comboCount++;
            } else {
                this.comboCount = 1; // First hit
            }
            this.lastComboCount = this.comboCount; // Save for rendering
            this.comboTimer = this.comboWindow;

            // Combo finisher (3rd hit) has longer cooldown
            if (this.comboCount >= 3) {
                this.currentAttackCooldown = this.attackCooldown * 1.5; // Longer recovery
                this.comboTimer = 0; // End combo chain
                this.comboCount = 0;
            } else {
                this.currentAttackCooldown = this.attackDuration + 0.05; // Small gap between combo hits
            }

            // Automatic critical chance from perks
            if (this.baseCritChance > 0 && Math.random() < this.baseCritChance) {
                this.hasCriticalNext = true;
            }

            // Hit detection & Logic
            let closestEnemy = null;
            let closestDist = Infinity;
            enemies.forEach(enemy => {
                const dist = getDistance(this.x, this.y, enemy.x, enemy.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = enemy;
                }
            });

            if (closestEnemy) {
                // Snap direction to the enemy
                this.attackAngle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
            }

            // Forward lunge: step toward facing direction on each combo hit
            // Made extreme: almost equal to evade speed (800) for huge forward momentum
            const lungeSpeed = 700 + (this.comboCount * 200);
            this.vx = Math.cos(this.attackAngle) * lungeSpeed;
            this.vy = Math.sin(this.attackAngle) * lungeSpeed;

            // Combo damage multiplier: 1x, 1.5x, 2.5x
            const comboDamageMultiplier = [1, 1.5, 2.5][Math.min(this.comboCount - 1, 2)] || 1;

            // Check hit
            enemies.forEach(enemy => {
                const dist = getDistance(this.x, this.y, enemy.x, enemy.y);
                if (dist < this.attackRange + enemy.radius) {
                    const angleToEnemy = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    let diff = angleToEnemy - this.attackAngle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;

                    if (Math.abs(diff) < this.attackArc / 2) { // Use player's attackArc
                        // 金剛 (kongo): HP30%以下ならダメージ1.5倍
                        let finalAttackPower = this.attackPower;
                        if (this.lowHpAttackBoost && (this.health / this.maxHealth) <= 0.3) {
                            finalAttackPower *= 1.5;
                        }

                        // 絶影 (zetsuei): クリティカル倍率の適用、乾坤一擲 (kenkon): ジャスト回避後のクリティカルならさらに1.5倍
                        let critMult = this.critDamageMultiplier; // default 5
                        if (this.counterBoost) critMult *= 1.5; // +50% damage if from Just Evade + kenkon

                        let dmg = this.hasCriticalNext
                            ? finalAttackPower * critMult
                            : finalAttackPower * comboDamageMultiplier;

                        if (this.hasCriticalNext) {
                            this.hasCriticalNext = false;
                            showMessage("絶影！", "critical");
                            createParticles(enemy.x, enemy.y, '#ffd700', 8); // reduced from 20
                        } else {
                            createParticles(enemy.x, enemy.y, '#c0c0c0', 2); // reduced from 5
                        }

                        enemy.takeDamage(dmg);

                        // Massive Stagger/Knockback on each combo hit to match the aggressive lunge
                        const knockbackForce = 600 + (this.comboCount * 300);
                        enemy.applyStagger(this.attackAngle, knockbackForce);

                        // Screenshake for impact
                        canvas.style.transform = `translate(${(Math.random() - 0.5) * 5}px, ${(Math.random() - 0.5) * 5}px)`;
                        setTimeout(() => canvas.style.transform = 'none', 50);
                    }
                }
            });
        }
    }

    useSpecial() {
        this.isSpecialAttacking = true;
        this.specialTimer = this.specialDuration;
        this.specialGauge = 0;
        updateSpecialBar();

        showMessage("絶技・光破！", "critical");

        // Massive screen shake relative to level
        const shake = 20 + (this.level * 2);
        canvas.style.transform = `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)`;
        setTimeout(() => canvas.style.transform = 'none', 100);

        // Huge AoE damage + stagger that scales with level and ougi perk
        const levelScale = 1 + (this.level * 0.1);
        const specialRadius = this.attackRange * 3 * levelScale * this.specialRangeMultiplier;
        const specialDamage = this.attackPower * (10 + this.level * 2); // Damage scales hard

        enemies.forEach(enemy => {
            const dist = getDistance(this.x, this.y, enemy.x, enemy.y);
            if (dist <= specialRadius + enemy.radius) {
                const killed = enemy.takeDamage(specialDamage);
                createParticles(enemy.x, enemy.y, '#ffd700', 8 + Math.floor(this.level * 0.5)); // Reduced from 30+ for performance

                // Bonus EXP for special attack kills
                if (killed) {
                    addExp(15);
                }

                // Stagger outward from player (even if attacking)
                const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                enemy.applyStagger(angle, 300);
            }
        });
    }

    evade() {
        if (this.currentEvadeCooldown <= 0 && !this.isEvading) {
            this.isEvading = true;
            this.evadeTimer = this.evadeDuration;
            this.currentEvadeCooldown = this.evadeCooldown;

            // Grant base invincibility for the first half of ANY evade (0.1s out of 0.2s duration)
            // This makes normal dodging safer even if it's not a "Just Evade"
            this.isInvincible = true;
            this.invincibleTimer = 0.15;

            // Determine dash direction
            let dx = 0, dy = 0;
            if (keys.w || keys.arrowup) dy -= 1;
            if (keys.s || keys.arrowdown) dy += 1;
            if (keys.a || keys.arrowleft) dx -= 1;
            if (keys.d || keys.arrowright) dx += 1;

            if (dx === 0 && dy === 0) {
                // Dash towards mouse if not moving
                dx = mouse.x - this.x;
                dy = mouse.y - this.y;
            }

            const len = Math.hypot(dx, dy);
            if (len > 0) {
                this.vx = (dx / len) * this.speed * this.evadeSpeedMultiplier * this.evadeDistanceMultiplier;
                this.vy = (dy / len) * this.speed * this.evadeSpeedMultiplier * this.evadeDistanceMultiplier;
            }

            this.checkJustEvade();
        }
    }

    checkJustEvade() {
        // Check if dodging *just* as an attack is about to hit (or is hitting)
        // Invincibility frames logic happens naturally since enemy damage is checked separately,
        // but checking here awards the bonus.
        let triggered = false;

        enemies.forEach(enemy => {
            // Is the attack warning about to expire? (Last 45% of charging time - slightly eased from 40%)
            const isAboutToHit = enemy.isPreparingAttack && (enemy.attackWarningTimer < enemy.attackWarningTime * 0.45);
            // Or is it currently in the active swing animation? (Active frames)
            const isHitting = enemy.isAttacking;

            if (isAboutToHit || isHitting) {
                // Use the enemy's geometric hit detection but with a generous grace radius (+25px)
                if (enemy.checkHit(this.x, this.y, this.radius + 25)) {
                    triggered = true;
                }
            }
        });

        projectiles.forEach(p => {
            // Can just evade the explosion if it's currently exploding or just about to
            if ((p.isExploding || p.explosionTimer > -0.2) && getDistance(this.x, this.y, p.x, p.y) < p.explosionRadius + this.radius + 20) {
                triggered = true;
                p.life = 0; // Evading destroys the explosion
            }
        });

        if (triggered) {
            doJustEvade();
        }
    }

    takeDamage(amount) {
        if (this.isEvading || this.isInvincible) return; // I-frames during evade or post-stun

        // 緊急回避 (kinkyu): SPが30以上あれば消費して自動回避
        if (this.autoEvade && this.specialGauge >= 30) {
            this.specialGauge -= 30;
            updateSpecialBar();
            showMessage("緊急回避！", "critical");
            this.currentEvadeCooldown = 0; // cooldown bypass
            this.evade();
            return; // ダメージ無効化
        }

        this.health -= amount;
        this.shakeTimer = 0.15; // Trigger screen shake

        // 乾坤一擲 (kenkon): 被弾時にダメージ反射
        if (this.reflectDamage) {
            const reflectAmount = amount * 1.5; // 150% reflection
            // Reflect to all enemies in a small radius
            enemies.forEach(enemy => {
                if (getDistance(this.x, this.y, enemy.x, enemy.y) < 150) {
                    enemy.takeDamage(reflectAmount);
                    createParticles(enemy.x, enemy.y, '#ff4444', 10);
                }
            });
        }

        // Grant brief damage immunity to prevent multiple projectiles hitting in the same frame
        this.isInvincible = true;
        this.invincibleTimer = 0.15; // 150ms of i-frames on any hit
        sfx.playDamage();
        updateHealthBar();

        if (this.health > 0) {
            // 金剛 (kongo): スーパーアーマー（のけぞり無効）
            if (!this.superArmor) {
                this.isStunned = true;
                this.stunTimer = this.stunDuration;
                this.comboCount = 0; // Break combo on hit
                this.comboTimer = 0;

                // Interrupt current actions
                this.isAttacking = false;
                this.isSpecialAttacking = false;

                // Knockback direction: away from nearest attacking enemy
                let knockAngle = 0;
                let minDist = Infinity;
                enemies.forEach(e => {
                    const d = getDistance(this.x, this.y, e.x, e.y);
                    if (d < minDist) {
                        minDist = d;
                        knockAngle = Math.atan2(this.y - e.y, this.x - e.x); // Away from enemy
                    }
                });
                const knockSpeed = 400;
                this.vx = Math.cos(knockAngle) * knockSpeed;
                this.vy = Math.sin(knockAngle) * knockSpeed;
            } else {
                // If super armor, still flash slightly but don't stun or interrupt combo
                showMessage("金剛！", "critical");
            }

            // Screen shake
            canvas.style.transform = `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 10}px)`;
            setTimeout(() => canvas.style.transform = 'none', 80);
        }
    }
}

class Enemy {
    constructor(type = 'golem', scaling = 1) {
        this.type = type;
        this.scaling = scaling; // Store scaling for use in update()
        this.hitFlashTimer = 0; // Timer for white hit flash
        this.state = 'spawn'; // 'spawn', 'alive', 'dying', 'dead'
        this.spawnTimer = 0.5; // 0.5 seconds spawn animation
        this.deathTimer = 0.6; // 0.6 seconds death animation
        this.opacity = 0; // For fade-in/out

        // Spawn logic: Random position within the canvas
        // Keep a larger margin to ensure they don't spawn hugging the very edge
        // Mages and other ranged units especially need to be well within bounds as their projectiles originate from their y position.
        const marginY = 60; // Keep them further from the very top/bottom borders
        const marginX = 60;
        let spawnedSafely = false;
        let attempts = 0;

        while (!spawnedSafely && attempts < 10) {
            this.x = Math.random() * (canvas.width - marginX * 2) + marginX;
            this.y = Math.random() * (canvas.height - marginY * 2) + marginY;

            // Check distance from player (prevent spawning right on top)
            if (player) {
                const distToPlayer = getDistance(this.x, this.y, player.x, player.y);
                if (distToPlayer > 180) { // Increased minimum spawn distance from player
                    spawnedSafely = true;
                }
            } else {
                spawnedSafely = true;
            }
            attempts++;
        }

        if (type === 'boss') {
            this.radius = 75; // 3x originally 25
            this.speed = 90 + (scaling * 5); // Increased base speed
            this.baseColor = '#4a1111'; // Darker red/black
            this.hp = 800 + (scaling * 200); // Massive HP buff
            this.maxHp = this.hp;
            this.damage = 40 + (scaling * 10); // More damage

            // Boss mechanics context
            this.bossPhase = 1;
            this.attackPatternIndex = 0;

            // Default stats for boss (will be overridden by phase mechanics)
            this.attackRange = 240; // 1.5x originally 160
            this.attackRadius = 270; // 1.5x originally 180
            this.attackShape = 'cone';
            this.attackWidth = Math.PI / 2;
            this.attackWarningTime = 1.0; // Reduced from 1.5
            this.attackDuration = 0.4;
            this.attackCooldown = 1.8; // Reduced from 3.0

        } else if (type === 'orc') {
            this.radius = 54; // 3x originally 18
            this.speed = 90 + (scaling * 3); // Slightly faster than golem
            this.baseColor = '#dcdcdc'; // Bone white
            this.hp = 80 + (scaling * 15); // Tougher than golem
            this.damage = 25 + (scaling * 3);
            this.attackRange = 240; // Lance reach (increased)
            this.attackRadius = 150; // Not used for cone/line
            this.attackShape = 'cone'; // Cone (wide sweep)
            this.attackWidth = Math.PI * 0.7; // Wide spear swing
            this.attackWarningTime = 1.0; // Medium windup
            this.attackDuration = 0.4;
            this.attackCooldown = 2.0;
        } else if (type === 'mage') {
            this.radius = 36; // 3x originally 12
            this.speed = 40 + (scaling * 2); // 移動は遅め（基本的にワープで近づく）
            this.baseColor = '#3c2b5c'; // Dark purple
            this.hp = 15 + (scaling * 8);
            this.damage = 25 + (scaling * 5); // 爆発ダメージは高め
            this.attackRange = 600; // 1.5x originally 400 (ワープ索敵範囲)
            this.attackRadius = 150; // 1.5x originally 100 (爆発範囲)
            this.attackShape = 'teleport_burst'; // ワープからの近接広範囲爆発
            this.attackWarningTime = 1.0; // ワープ後の猶予（ジャスト回避猶予）
            this.attackDuration = 0.5; // 爆発のエフェクト残存時間
            this.attackCooldown = 4.0; // ワープ頻度
        } else {
            // Mud Golem
            this.radius = 36; // 3x originally 12
            this.speed = 100 + (scaling * 4); // Slightly slower than goblin
            this.baseColor = '#5c4033'; // Mud brown
            this.hp = 25 + (scaling * 10); // Slightly tougher
            this.damage = 10 + (scaling * 2);
            this.attackRange = 120; // Expanded for larger body
            this.attackRadius = 140; // Expanded AoE to match large sprite
            this.attackShape = 'circle'; // Ground smash (Standard AoE)
            this.attackWarningTime = 0.7; // Slightly slower warning to feel heavier
            this.attackDuration = 0.2;
            this.attackCooldown = 1.0;
        }

        this.isPreparingAttack = false;
        this.isAttacking = false;
        this.isMoving = false;
        this.attackAngle = 0; // Direction of attack focus for line/cone
        this.attackWarningTimer = 0;
        this.lastX = this.x;
        this.lastY = this.y;

        // teleport state
        this.isTeleporting = false;
        this.teleportDestX = 0;
        this.teleportDestY = 0;
        this.teleportTimer = 0;

        // Random Teleport (Movement) timer for Mage
        this.randomTeleportTimer = Math.random() * 2.0 + 1.0; // 1~3秒に1回移動ワープ
        this.attackTimer = 0;
        this.currentCooldown = Math.random() * 1.0;

        // Stagger State
        this.isStaggered = false;
        this.staggerTimer = 0;
        this.staggerDuration = 0.3;
        this.staggerVx = 0;
        this.staggerVy = 0;
    }

    applyStagger(angle, force) {
        this.isStaggered = true;
        this.staggerTimer = this.staggerDuration; // Keep it stunlocking for the combo window

        // Dampen knockback force when near walls to prevent wall-pinning
        const edgeMargin = Math.max(this.radius, 30);
        const topMargin = 60;
        const destX = this.x + Math.cos(angle) * force * this.staggerDuration;
        const destY = this.y + Math.sin(angle) * force * this.staggerDuration;
        if (destX < edgeMargin || destX > canvas.width - edgeMargin ||
            destY < topMargin || destY > canvas.height - edgeMargin) {
            force *= 0.4; // Significantly reduce force when it would push into wall
        }

        this.staggerVx = Math.cos(angle) * force;
        this.staggerVy = Math.sin(angle) * force;
        // Cancel any attack preparation
        if (!this.isPreparingAttack && !this.isAttacking) {
            this.currentCooldown = Math.max(this.currentCooldown, 0.5); // Delay next attack
        }
    }

    checkHit(px, py, pradius) {
        if (this.attackShape === 'circle' || this.attackShape === 'teleport_burst') {
            return getDistance(this.x, this.y, px, py) <= this.attackRadius + pradius;
        } else if (this.attackShape === 'line') {
            // Calculate distance from point to line segment
            const endX = this.x + Math.cos(this.attackAngle) * this.attackRange;
            const endY = this.y + Math.sin(this.attackAngle) * this.attackRange;

            const l2 = Math.pow(this.x - endX, 2) + Math.pow(this.y - endY, 2);
            if (l2 === 0) return getDistance(this.x, this.y, px, py) <= this.attackWidth / 2 + pradius;

            let t = ((px - this.x) * (endX - this.x) + (py - this.y) * (endY - this.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            const projX = this.x + t * (endX - this.x);
            const projY = this.y + t * (endY - this.y);

            return getDistance(px, py, projX, projY) <= this.attackWidth / 2 + pradius;
        } else if (this.attackShape === 'cone') {
            const dist = getDistance(this.x, this.y, px, py);
            if (dist > this.attackRadius + pradius) return false;

            const angleToPlayer = Math.atan2(py - this.y, px - this.x);
            let angleDiff = angleToPlayer - this.attackAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            return Math.abs(angleDiff) <= this.attackWidth / 2;
        }
        return false;
    }

    update(dt) {
        // Handle spawn state
        if (this.state === 'spawn') {
            this.spawnTimer -= dt;
            this.opacity = Math.min(1.0, 1.0 - (this.spawnTimer / 0.5));
            if (this.spawnTimer <= 0) {
                this.state = 'alive';
                this.opacity = 1.0;
            }
            return; // No other logic while spawning
        }

        // Handle death state
        if (this.hp <= 0) {
            if (this.state !== 'dying') {
                this.state = 'dying';
                this.deathTimer = 0.6;
            }
            this.deathTimer -= dt;
            this.opacity = Math.max(0, this.deathTimer / 0.6);
            if (this.deathTimer <= 0) {
                this.state = 'dead';
            }
            return; // Freeze in death animation
        }

        // === Custom Teleport Update ===
        if (this.isTeleporting) {
            this.teleportTimer -= dt;
            if (this.teleportTimer <= 0) {
                // ワープ完了：目的地へ移動
                this.x = this.teleportDestX;
                this.y = this.teleportDestY;
                this.isTeleporting = false;

                // ワープ出現時のエフェクト
                createParticles(this.x, this.y, '#8a2be2', 10);

                // 攻撃クールダウン中でなければ攻撃開始
                if (this.currentCooldown >= this.attackCooldown - 0.1) {
                    // Start Attack Warning (Burst)
                    // CDが満タン（直前に攻撃指示でワープした）状態なら攻撃予備動作開始
                    this.isPreparingAttack = true;
                    this.attackWarningTimer = this.attackWarningTime;
                }
            }
            return; // ワープ中は他の行動（ノックバックや移動）をしない（無敵＆非表示）
        }

        // Handle stagger state
        // Hit flash update
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= dt;
        }

        if (this.isStaggered) {
            this.staggerTimer -= dt;
            this.x += this.staggerVx * dt;
            this.y += this.staggerVy * dt;
            // Decelerate
            this.staggerVx *= 0.9;
            this.staggerVy *= 0.9;

            // Wall bounce: reverse velocity and clamp when hitting canvas edges
            const edgeMargin = Math.max(this.radius, 30);
            const topMargin = 60; // Larger top margin so enemy body (zOffset) stays visible
            if (this.x < edgeMargin) { this.x = edgeMargin; this.staggerVx = Math.abs(this.staggerVx) * 0.5; }
            if (this.x > canvas.width - edgeMargin) { this.x = canvas.width - edgeMargin; this.staggerVx = -Math.abs(this.staggerVx) * 0.5; }
            if (this.y < topMargin) { this.y = topMargin; this.staggerVy = Math.abs(this.staggerVy) * 0.5; }
            if (this.y > canvas.height - edgeMargin) { this.y = canvas.height - edgeMargin; this.staggerVy = -Math.abs(this.staggerVy) * 0.5; }

            if (this.staggerTimer <= 0) {
                this.isStaggered = false;
                this.staggerVx = 0;
                this.staggerVy = 0;
            }
            return; // Skip all other logic while staggered
        }

        if (this.currentCooldown > 0 && !this.isPreparingAttack && !this.isAttacking) {
            this.currentCooldown -= dt;
        }

        const distToPlayer = getDistance(this.x, this.y, player.x, player.y);

        // --- Boss Mechanics ---
        if (this.type === 'boss') {
            // Check Phase Transition
            if (this.bossPhase === 1 && this.hp < this.maxHp * 0.5) {
                this.bossPhase = 2;
                this.baseColor = '#8a0000'; // Enrage color
                showMessage("PHASE TRANSITION", "critical");
                createParticles(this.x, this.y, '#ff0000', 30);
                this.currentCooldown = 2.0; // Pause briefly
                this.isPreparingAttack = false;
                this.isAttacking = false;

                // Spawn a wave of minions on transition
                this.spawnMinions(4);
                return;
            }

            // Determine next attack shape dynamically before preparing
            if (this.currentCooldown <= 0 && !this.isPreparingAttack && !this.isAttacking) {
                this.attackPatternIndex++;
                if (this.bossPhase === 1) {
                    // Phase 1: Cone -> Line -> Spreads -> Summon
                    if (this.attackPatternIndex % 4 === 0) {
                        this.attackShape = 'spread'; // Bullet hell spread
                        this.attackWarningTime = 0.7; // Faster spread warning
                        this.attackDuration = 0.4;
                    } else if (this.attackPatternIndex % 4 === 1) {
                        this.attackShape = 'line'; // Fast charge
                        this.attackWidth = 60;
                        this.attackRange = 400;
                        this.attackWarningTime = 0.6; // Extremely fast linear charge
                        this.attackDuration = 0.3;
                    } else if (this.attackPatternIndex % 4 === 2) {
                        this.attackShape = 'summon'; // Summon minions
                        this.attackWarningTime = 1.0; // Faster summon
                        this.attackDuration = 0.5;
                    } else {
                        this.attackShape = 'cone';
                        this.attackWidth = Math.PI / 1.5;
                        this.attackRadius = 250; // Increased radius
                        this.attackWarningTime = 0.8; // Faster cone
                    }
                } else {
                    // Phase 2: Massive AoE -> Spread -> Fast Cone -> Summon
                    this.speed = 130 + (this.scaling * 8); // Even faster boss speed up in phase 2

                    if (this.attackPatternIndex % 4 === 0) {
                        this.attackShape = 'circle'; // Massive room wide AoE
                        this.attackRadius = 400; // Larger AoE
                        this.attackWarningTime = 1.2; // Faster massive AoE
                        this.attackDuration = 0.4;
                    } else if (this.attackPatternIndex % 4 === 1) {
                        this.attackShape = 'spread'; // Multiple bullets
                        this.attackWarningTime = 0.6; // Faster spread
                    } else if (this.attackPatternIndex % 4 === 2) {
                        this.attackShape = 'summon'; // Summon minions
                        this.attackWarningTime = 0.8; // Faster summon
                        this.attackDuration = 0.4;
                    } else {
                        this.attackShape = 'cone';
                        this.attackWidth = Math.PI; // 180 degrees
                        this.attackRadius = 300; // Larger cone
                        this.attackWarningTime = 0.5; // Lightning fast cone
                        this.speed = 180 + (this.scaling * 10); // Super moving speed
                    }
                }
            }
        }

        if (this.isPreparingAttack) {
            this.attackWarningTimer -= dt;
            if (this.attackWarningTimer <= 0) {
                this.isPreparingAttack = false;
                this.isAttacking = true;
                this.attackTimer = this.attackDuration;
                this.hasDealtDamage = false; // Add flag to prevent multiple hits
                // Remove immediate damage calculation here

                // Deal damage immediately upon attack triggering
                if (this.attackShape === 'summon') {
                    // Spawn 2-3 minions
                    const numMinions = this.bossPhase === 1 ? 2 : 3;
                    this.spawnMinions(numMinions);

                    // Visual feedback for summon
                    createParticles(this.x, this.y, '#00ff00', 40); // Green summon magic

                } else if (this.attackShape === 'teleport_burst') {
                    // ドンッという爆発エフェクト
                    createParticles(this.x, this.y, '#a854f7', 30);
                    // Hit判定は下部の this.checkHit で行われる
                } else if (this.attackShape === 'spread') {
                    // Spread logic happens on windup
                    const numBullets = this.bossPhase === 1 ? 15 : 25;
                    const angleOffset = performance.now() * 0.002;
                    const spiralSpread = Math.PI * 1.5;
                    const projectileSpeed = this.bossPhase === 1 ? 200 : 300;
                    const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
                    for (let i = 0; i < numBullets; i++) {
                        const offset = (spiralSpread / numBullets) * (i - numBullets / 2);
                        const a = baseAngle + offset + angleOffset;
                        const speed = projectileSpeed * (0.8 + Math.random() * 0.4);
                        const vx = Math.cos(a) * speed;
                        const vy = Math.sin(a) * speed;
                        projectiles.push(new Projectile(this.x, this.y, vx, vy, this.damage / 2, 10, '#ff3333'));
                    }
                }
                // Do not check hit yet, defer to update phase
            }
        } else if (this.isAttacking) {
            this.attackTimer -= dt;

            // Check Hit logic during attack animation (sync with Impact frame)
            const progress = 1 - (this.attackTimer / this.attackDuration);
            // Goblin Impact is around progress 0.3 ~ 0.7
            if (progress >= 0.3 && !this.hasDealtDamage) {
                this.hasDealtDamage = true;

                // Only do melee and burst hits here. Projectiles and summons are already spawned at start.
                if (this.attackShape !== 'summon' && this.attackShape !== 'spread') {
                    if (this.checkHit(player.x, player.y, player.radius)) {
                        player.takeDamage(this.damage);
                    }
                }
            }

            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.hasDealtDamage = false;
                // Faster recovery in phase 2 (0.4x instead of 0.6x for relentless attacks)
                this.currentCooldown = this.type === 'boss' && this.bossPhase === 2 ? this.attackCooldown * 0.4 : this.attackCooldown;
            }
        } else {
            // Movement logic
            if (this.attackShape === 'spread') {
                // Stay at range
                if (distToPlayer < 200) {
                    const angle = Math.atan2(this.y - player.y, this.x - player.x);
                    this.attackAngle = angle;
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                } else if (distToPlayer > 280) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    this.attackAngle = angle;
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                } else {
                    this.attackAngle = Math.atan2(player.y - this.y, player.x - this.x); // Face player
                }
            } else if (this.attackShape === 'teleport_burst') {
                // 基本機能（歩き）を廃止し、通常移動もランダムテレポートで行う
                this.randomTeleportTimer -= dt;

                // 攻撃クールダウン中かつ、ランダムワープタイマーが来たらランダムな場所へワープ
                if (this.currentCooldown > 0 && this.randomTeleportTimer <= 0) {
                    this.isTeleporting = true;
                    this.teleportTimer = 0.5; // 少しだけ姿を消す

                    // 完全ランダムではなく、プレイヤーからある程度離れた位置（画面内）を狙う
                    const margin = 60;
                    this.teleportDestX = Math.random() * (canvas.width - margin * 2) + margin;
                    this.teleportDestY = Math.random() * (canvas.height - margin * 2) + margin;

                    createParticles(this.x, this.y, '#3c2b5c', 10);
                    this.randomTeleportTimer = Math.random() * 1.5 + 1.0; // 次のランダムワープまで1~2.5秒
                }
            } else {
                if (distToPlayer > this.attackRange * 0.8) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    this.attackAngle = angle; // Point towards player while moving
                    this.x += Math.cos(angle) * this.speed * dt;
                    this.y += Math.sin(angle) * this.speed * dt;
                }
            }

            // Check if can start attack
            if (this.currentCooldown <= 0 && (distToPlayer <= this.attackRange || this.attackShape === 'spread' || this.attackShape === 'summon' || this.attackShape === 'teleport_burst')) {
                if (this.attackShape === 'teleport_burst') {
                    // 攻撃ワープ開始（プレイヤーのそばへ）
                    this.isTeleporting = true;
                    this.teleportTimer = 0.5; // 0.5秒間姿を消す

                    // プレイヤーの進行方向や現在地付近に飛ぶ
                    const angle = Math.random() * Math.PI * 2;
                    const r = 50 + Math.random() * 50; // プレイヤーの50〜100px付近
                    this.teleportDestX = player.x + Math.cos(angle) * r;
                    this.teleportDestY = player.y + Math.sin(angle) * r;

                    // 飛ぶ前の位置にエフェクト
                    createParticles(this.x, this.y, '#3c2b5c', 15);
                    this.currentCooldown = this.attackCooldown; // ワープに入った時点でCD消費

                    // 次のランダムワープタイマーもリセットして暴発を防ぐ
                    this.randomTeleportTimer = Math.random() * 1.5 + 1.0;
                } else {
                    // Normal Start Attack
                    this.isPreparingAttack = true;
                    this.attackAngle = Math.atan2(player.y - this.y, player.x - this.x); // Lock in path
                    this.attackWarningTimer = this.attackWarningTime;
                }
            }
        }

        // Clamp position within canvas bounds so they don't wander off
        // Use a larger margin so their entire body and attacks (e.g. y-10 for projectiles) stay visible
        const edgeMargin = Math.max(this.radius, 30);
        const topMargin = 60; // Larger top margin so enemy body (drawn at y - zOffset) stays visible
        this.x = Math.max(edgeMargin, Math.min(canvas.width - edgeMargin, this.x));
        this.y = Math.max(topMargin, Math.min(canvas.height - edgeMargin, this.y));

        // Determine if moving
        if (Math.abs(this.x - this.lastX) > 0.1 || Math.abs(this.y - this.lastY) > 0.1) {
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
        this.lastX = this.x;
        this.lastY = this.y;
    }

    drawTelegraph(ctx, progress) {
        ctx.beginPath();
        if (this.attackShape === 'circle' || this.attackShape === 'summon' || this.attackShape === 'teleport_burst') {
            // Summon also uses a circular telegraph to show area of effect/magic circle
            ctx.ellipse(0, 0, this.attackRadius, this.attackRadius * 0.5, 0, 0, Math.PI * 2);
        } else if (this.attackShape === 'line') {
            // Un-rotate for isometric squash, then draw rotated box
            ctx.scale(1, 0.5);
            ctx.rotate(this.attackAngle);
            ctx.rect(0, -this.attackWidth / 2, this.attackRange, this.attackWidth);
            ctx.rotate(-this.attackAngle);
            ctx.scale(1, 2);
        } else if (this.attackShape === 'cone') {
            const startAngle = this.attackAngle - this.attackWidth / 2;
            const endAngle = this.attackAngle + this.attackWidth / 2;
            // Draw an isometric arc wedge
            ctx.moveTo(0, 0);
            ctx.ellipse(0, 0, this.attackRadius, this.attackRadius * 0.5, 0, startAngle, endAngle);
            ctx.lineTo(0, 0);
        }
    }

    draw(ctx) {
        if (this.isTeleporting || this.state === 'dead') return;

        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y);

        // Draw Warning Area (Telegraph) on the GROUND (Isometric scaling)
        if (this.isPreparingAttack) {
            const progress = 1 - (this.attackWarningTimer / this.attackWarningTime);

            // Draw the maximum range lightly (if not projectile)
            if (this.attackShape !== 'projectile') {
                this.drawTelegraph(ctx, progress);

                ctx.fillStyle = `rgba(255, 51, 51, 0.05)`;
                ctx.fill();
                ctx.strokeStyle = `rgba(255, 51, 51, ${0.2 + progress * 0.3})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // "Tales" style ! mark or flash right before attack
            if (progress > 0.8) {
                // Flash the entire range brightly to signal "EVADE NOW!" (except for projectiles)
                if (this.attackShape !== 'projectile') {
                    this.drawTelegraph(ctx, progress);
                    if (this.attackShape === 'summon') {
                        ctx.fillStyle = 'rgba(50, 255, 50, 0.3)'; // Green magic circle for summon
                        ctx.strokeStyle = '#32ff32';
                    } else {
                        ctx.fillStyle = 'rgba(212, 175, 55, 0.3)'; // Gold flash warning instead of yellow neon
                        ctx.strokeStyle = '#d4af37';
                    }
                    ctx.fill();
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }

                // Draw exclamation over enemy (floating)
                ctx.fillStyle = '#ff3333'; // Red ! for danger
                ctx.font = 'bold 24px Noto Serif JP';
                ctx.textAlign = 'center';
                // Adjust for isometric perspective so it floats above them
                ctx.fillText('!', 0, -35);
            } else {
                // Timing animation
                if (this.attackShape === 'circle' || this.attackShape === 'summon') {
                    ctx.beginPath();
                    ctx.ellipse(0, 0, Math.max(0, this.attackRadius * (1 - progress)), Math.max(0, (this.attackRadius * 0.5) * (1 - progress)), 0, 0, Math.PI * 2);
                    ctx.strokeStyle = this.attackShape === 'summon' ? '#32ff32' : '#ff3333';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (this.attackShape === 'line') {
                    ctx.beginPath();
                    ctx.scale(1, 0.5);
                    ctx.rotate(this.attackAngle);
                    // Fill bar up to the end
                    ctx.fillStyle = `rgba(255, 51, 51, ${0.1 * progress})`;
                    ctx.fillRect(0, -this.attackWidth / 2, this.attackRange * progress, this.attackWidth);
                    ctx.rotate(-this.attackAngle);
                    ctx.scale(1, 2);
                } else if (this.attackShape === 'cone') {
                    ctx.beginPath();
                    const startAngle = this.attackAngle - (this.attackWidth / 2) * progress;
                    const endAngle = this.attackAngle + (this.attackWidth / 2) * progress;
                    ctx.moveTo(0, 0);
                    ctx.ellipse(0, 0, this.attackRadius, this.attackRadius * 0.5, 0, startAngle, endAngle);
                    ctx.lineTo(0, 0);
                    ctx.strokeStyle = '#ff3333';
                    ctx.stroke();
                }
            }
        }

        // Draw active attack hit area
        if (this.isAttacking) {
            this.drawTelegraph(ctx, 1);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.6)'; // Solid red hit
            ctx.fill();
        }

        // --- Draw Drop Shadow ---
        ctx.beginPath();
        // Shift shadow down for taller/larger bosses so it stays at feet
        const shadowYOffset = this.type === 'boss' ? this.radius * 1.2 : this.radius * 0.8;
        ctx.ellipse(0, shadowYOffset, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.closePath();

        // --- Draw Enemy Body (floating slightly) ---
        const zOffset = 10;
        let shakeX = 0;
        let shakeY = 0;
        if (this.isPreparingAttack) {
            shakeX = (Math.random() - 0.5) * 4;
            shakeY = (Math.random() - 0.5) * 4;
        }

        ctx.beginPath();
        // Shift origin up for the body draw
        ctx.translate(shakeX, -zOffset + shakeY);

        // --- Sprite Rendering (All enemies) ---
        if (AssetManager.images[this.type] && AssetManager.images[this.type].complete) {
            const img = AssetManager.images[this.type];
            let cols = 5;
            let frame = 1; // Default to idle

            // Golem specific animation (7 frames)
            if (this.type === 'golem') {
                cols = 7;
                // Frame 0: Spawn, 1: Idle, 2: Walk, 3: Windup, 4: Impact(Attack), 5: Follow-through, 6: Death
                if (this.state === 'spawn') {
                    frame = 0;
                } else if (this.state === 'dying' || this.hp <= 0) {
                    frame = 6;
                } else if (this.isAttacking) {
                    // Animate through Windup(3) -> Impact(4) -> Follow-through(5) based on attackTimer
                    const progress = 1 - (this.attackTimer / this.attackDuration);
                    if (progress < 0.3) frame = 3;      // Windup
                    else if (progress < 0.7) frame = 4; // Impact
                    else frame = 5;                     // Follow-though
                } else if (this.isPreparingAttack) {
                    frame = 3; // Stay in Windup during telegraph warning
                } else if (this.isMoving) {
                    frame = 2; // Walk
                } else {
                    frame = 1; // Idle
                }
            } else if (this.type === 'orc') {
                cols = 7;
                // Frame 0: Spawn, 1: Idle, 2: Walk, 3: Windup, 4: Impact(Attack), 5: Follow-through, 6: Death
                if (this.state === 'spawn') {
                    frame = 0;
                } else if (this.state === 'dying' || this.hp <= 0) {
                    frame = 6;
                } else if (this.isAttacking) {
                    const progress = 1 - (this.attackTimer / this.attackDuration);
                    if (progress < 0.3) frame = 3;      // Windup
                    else if (progress < 0.7) frame = 4; // Impact
                    else frame = 5;                     // Follow-though
                } else if (this.isPreparingAttack) {
                    frame = 3; // Stay in Windup during telegraph warning
                } else if (this.isMoving) {
                    frame = 2; // Walk
                } else {
                    frame = 1; // Idle
                }
            } else if (this.type === 'boss') {
                cols = 8;
                // Frame 0: Idle, 1: Walk, 2: Attack_Cone, 3: Attack_Line, 4: Attack_Spread, 5: Attack_Summon, 6: Attack_Circle, 7: Death
                if (this.state === 'dying' || this.hp <= 0) {
                    frame = 7;
                } else if (this.isAttacking || this.isPreparingAttack) {
                    if (this.attackShape === 'cone') frame = 2;
                    else if (this.attackShape === 'line') frame = 3;
                    else if (this.attackShape === 'spread') frame = 4;
                    else if (this.attackShape === 'summon') frame = 5;
                    else if (this.attackShape === 'circle') frame = 6;
                    else frame = 2; // Default attack
                } else if (this.isMoving) {
                    frame = 1;
                } else {
                    frame = 0;
                }
            } else {
                // Original logic for 5-frame enemies
                if (this.state === 'spawn') {
                    frame = 0; // Assume 0 is spawn for others
                } else if (this.state === 'dying' || this.hp <= 0) {
                    frame = 4; // death
                } else if (this.isAttacking || this.isPreparingAttack) {
                    frame = 3; // attack
                } else if (this.isMoving) {
                    frame = 2; // move
                } else {
                    frame = 1; // idle
                }
            }

            // Define sprite cell dimensions dynamically based on calculated cols
            // Sub-pixel rendering can cause bleeding, but Math.floor causes cumulative error on later frames.
            const sWidth = img.width / cols;
            const sHeight = img.height;

            // --- Hit Flash Effect (Shader-like brightness) ---
            if (this.hitFlashTimer > 0) {
                ctx.filter = 'brightness(3) contrast(1.5)';
            }
            // this.radius is the hitbox. Scale based on the original aspect ratio to avoid squishing.
            const targetHeight = this.radius * 3; // Visual height is 3x the new radius
            const drawScale = targetHeight / sHeight;
            const dWidth = sWidth * drawScale;
            const dHeight = targetHeight;

            // Flip horizontally if moving/attacking towards the left
            if (player.x < this.x && this.attackShape !== 'spread') {
                ctx.scale(-1, 1);
            }

            // Calculate precise source X position, use Math.round or slightly offset to avoid bleeding without losing width
            const sx = Math.floor(frame * sWidth);
            // We use the exact sWidth for the crop to avoid the cumulitive error, and just floor the start position
            ctx.drawImage(img, sx, 0, Math.floor(sWidth), Math.floor(sHeight), -dWidth / 2, -dHeight / 2, dWidth, dHeight);

            ctx.filter = 'none';

        } else {
            // Draw original circle shape
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

            if (this.hitFlashTimer > 0) {
                ctx.fillStyle = '#ffffff'; // White flash when hit
            } else {
                ctx.fillStyle = this.baseColor;
            }

            ctx.fill();
            ctx.closePath();

            // Draw Eyes pointing in angle
            const eyeOffsetX = Math.cos(this.attackAngle) * this.radius * 0.5;
            const eyeOffsetY = Math.sin(this.attackAngle) * this.radius * 0.5;
            ctx.fillStyle = this.isPreparingAttack ? '#ffcc00' : '#000'; // Eyes glow when about to attack
            ctx.arc(eyeOffsetX, eyeOffsetY - 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore(); // Restore all transforms applied to drawing this enemy
    }

    takeDamage(amount) {
        if (this.hp <= 0) return;
        this.hp -= amount;
        this.hitFlashTimer = 0.1; // 100ms flash

        // Hit Stop effect on heavy hits
        if (amount > 20) {
            timeScale = 0.05;
            slowMoTimer = 0.05; // Very brief pause
        }
        damageTexts.push(new DamageText(this.x, this.y - this.radius, Math.round(amount)));
        sfx.playHit();

        if (this.type === 'boss') {
            updateBossHP(this.hp, this.maxHp);
        }

        if (this.hp <= 0) {
            killCount++;

            if (player.healOnKill > 0) {
                player.health = Math.min(player.maxHealth, player.health + player.healOnKill);
                updateHealthBar();
            }

            if (this.type === 'boss') {
                addScore(500);
                addExp(100);

                // Trigger win sequence
                winGame();

            } else if (this.type === 'orc') {
                addScore(150);
                addExp(30);
            } else {
                addScore(100);
                addExp(20);
            }
            return true; // indicates death
        }
        return false;
    }

    // Boss specific helper
    spawnMinions(count) {
        // Cap total enemies on screen to prevent runaway spawns
        const maxEnemies = 15;
        const available = maxEnemies - enemies.length;
        if (available <= 0) return;
        count = Math.min(count, available);

        for (let i = 0; i < count; i++) {
            // Spawn weak golems around the boss
            const angle = (Math.PI * 2 / count) * i;
            const dist = 100 + Math.random() * 50;
            const mx = this.x + Math.cos(angle) * dist;
            const my = this.y + Math.sin(angle) * dist;

            // Keep them inside bounds
            const safeX = Math.max(20, Math.min(canvas.width - 20, mx));
            const safeY = Math.max(20, Math.min(canvas.height - 20, my));

            const minion = new Enemy('golem', 1); // Level 1 golems so they don't instakill player
            minion.x = safeX;
            minion.y = safeY;
            minion.hp *= 0.5; // Half health minions
            minion.maxHp = minion.hp;

            enemies.push(minion);
            createParticles(safeX, safeY, '#00ff00', 10);
        }
    }
}

// --- Environment Objects (Pre-rendered) ---
const preRenderedEnv = { tree: null, rock: null };

function generateEnvTextures() {
    // Tree
    const treeCanvas = document.createElement('canvas');
    treeCanvas.width = 60;
    treeCanvas.height = 80;
    const tCtx = treeCanvas.getContext('2d');

    // Trunk
    tCtx.fillStyle = '#3a2e24';
    tCtx.fillRect(26, 60, 8, 20);

    // Leaves (Layers of circles for a fluffy tree look)
    tCtx.fillStyle = '#1e3828'; // Dark shadow
    tCtx.beginPath(); tCtx.arc(30, 40, 25, 0, Math.PI * 2); tCtx.fill();

    tCtx.fillStyle = '#2c4c3b'; // Base green
    tCtx.beginPath(); tCtx.arc(30, 35, 22, 0, Math.PI * 2); tCtx.fill();
    tCtx.beginPath(); tCtx.arc(15, 45, 18, 0, Math.PI * 2); tCtx.fill();
    tCtx.beginPath(); tCtx.arc(45, 45, 18, 0, Math.PI * 2); tCtx.fill();

    tCtx.fillStyle = '#3b6e51'; // Highlight
    tCtx.beginPath(); tCtx.arc(25, 25, 15, 0, Math.PI * 2); tCtx.fill();
    tCtx.beginPath(); tCtx.arc(12, 35, 10, 0, Math.PI * 2); tCtx.fill();

    preRenderedEnv.tree = treeCanvas;

    // Rock
    const rockCanvas = document.createElement('canvas');
    rockCanvas.width = 50;
    rockCanvas.height = 40;
    const rCtx = rockCanvas.getContext('2d');

    rCtx.fillStyle = '#4a4c4a'; // Base shadow
    rCtx.beginPath(); rCtx.ellipse(25, 25, 20, 15, 0, 0, Math.PI * 2); rCtx.fill();

    rCtx.fillStyle = '#6a6c6a'; // Main rock
    rCtx.beginPath(); rCtx.ellipse(23, 22, 18, 13, 0, 0, Math.PI * 2); rCtx.fill();

    rCtx.fillStyle = '#8a8c8a'; // Highlight edge
    rCtx.beginPath(); rCtx.ellipse(18, 16, 10, 6, 0.5, 0, Math.PI * 2); rCtx.fill();

    preRenderedEnv.rock = rockCanvas;
}

class EnvObject {
    constructor() {
        // Avoid spawning directly on the player
        do {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
        } while (player && getDistance(this.x, this.y, player.x, player.y) < 100);

        this.type = Math.random() > 0.5 ? 'tree' : 'rock';

        // Random slight scaling for variety
        this.scale = 0.8 + Math.random() * 0.4;
        this.flip = Math.random() > 0.5 ? -1 : 1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Drop shadow
        ctx.beginPath();
        const baseRadius = this.type === 'tree' ? 15 : 20;
        ctx.ellipse(0, 0, baseRadius * this.scale, (baseRadius * 0.5) * this.scale, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();
        ctx.closePath();

        // Draw pre-rendered texture
        const img = preRenderedEnv[this.type];
        if (img) {
            ctx.scale(this.scale * this.flip, this.scale);
            if (this.type === 'tree') {
                // Anchor at bottom center of tree trunk
                ctx.drawImage(img, -30, -80);
            } else {
                // Anchor at bottom center of rock
                ctx.drawImage(img, -25, -35);
            }
        }

        ctx.restore();
    }
}

// --- Particle System ---

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 100 + 50;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 2 + 1;
        this.size = Math.random() * 3 + 1;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // Additive blending for glowing effect
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

// --- Floating Damage Text ---
class DamageText {
    constructor(x, y, amount) {
        this.x = x + (Math.random() * 20 - 10);
        this.y = y;
        this.amount = amount;
        this.life = 1.0;
        this.vy = -30; // Move upwards
        this.color = '#ffaa00'; // Golden/Orange for damage
    }

    update(dt) {
        this.y += this.vy * dt;
        this.life -= dt * 1.5; // Fades out over ~0.66s
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = 'bold 20px "Cinzel", "Yu Mincho", serif';
        ctx.textAlign = 'center';
        // Stroke for readability
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(this.amount, this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fillText(this.amount, this.x, this.y);
        ctx.restore();
    }
}

// --- Projectiles ---
class Projectile {
    constructor(x, y, vx, vy, damage, radius, color) {
        this.x = x;
        this.y = y - 10; // offset slightly up so it looks like magic from hands
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.radius = radius; // Size of the moving ball
        this.color = color;
        this.life = 1.0;

        // Bomb/Explosion logic
        this.isExploding = false;
        this.explosionTimer = 0;
        this.explosionDuration = 0.4;
        this.explosionRadius = radius * 6; // How big the explosion gets
    }

    update(dt) {
        if (this.isExploding) {
            this.explosionTimer += dt;

            // Only deal damage once at the exact moment of explosion (like a hit frame)
            if (this.explosionTimer < 0.1 && !this.hasHit) {
                if (!player.isEvading && !player.isInvincible && getDistance(this.x, this.y, player.x, player.y) < this.explosionRadius + player.radius) {
                    player.takeDamage(this.damage);
                    this.hasHit = true;
                }
            }

            if (this.explosionTimer >= this.explosionDuration) {
                this.life = 0;
            }
            return;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check out of bounds
        if (this.x < -100 || this.x > canvas.width + 100 || this.y < -100 || this.y > canvas.height + 100) {
            this.life = 0;
            return;
        }

        // Trigger explosion if close to player (throttle: only if player is not already being hit this frame)
        if (getDistance(this.x, this.y, player.x, player.y) < this.explosionRadius * 0.8) {
            this.isExploding = true;
            this.hasHit = false; // reset hit flag
            createParticles(this.x, this.y, this.color, 8); // Reduced from 15 to prevent particle overload
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isExploding) {
            const progress = this.explosionTimer / this.explosionDuration;
            // Draw expanding circle
            ctx.beginPath();
            ctx.ellipse(0, 0, this.explosionRadius * progress, (this.explosionRadius * 0.5) * progress, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(168, 84, 247, ${0.5 * (1 - progress)})`; // Fading purple
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw warning telegraph right before it spawned (simulated by the fast explosion)
        } else {
            // Draw flying ball
            // Base glow
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.4;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 1.0;
            ctx.fill();

            // Draw Telegraph for the explosion size
            ctx.beginPath();
            ctx.ellipse(0, 0, this.explosionRadius, this.explosionRadius * 0.5, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 51, 51, 0.4)'; // Red circle following the ball showing blast radius
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 51, 51, 0.05)';
            ctx.fill();
        }

        ctx.restore();
    }
}

const MAX_PARTICLES = 100; // Reduced from 200 for better performance
function createParticles(x, y, color, count) {
    // Cap particle count to prevent overload during boss spread attacks
    const space = MAX_PARTICLES - particles.length;
    if (space <= 0) return;
    const actual = Math.min(count, space);
    for (let i = 0; i < actual; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// --- Global Logic ---
let player;
let enemies = [];
let projectiles = [];
let particles = [];
let damageTexts = [];
let envObjects = [];
let enemySpawnTimer = 0;
let killCount = 0;
let pendingLevelUps = 0;
let isLevelUpWaitingForSpecial = false;

// --- Perk Definitions ---
function doJustEvade() {
    sfx.playEvade();
    timeScale = 0.2; // Slow down time
    // 明鏡止水 (meikyo): スロー時間の延長
    slowMoTimer = 0.5 * player.slowMoDurationMultiplier; // Real seconds (0.5s real = 2.5s game feel)
    player.hasCriticalNext = true;

    // 明鏡止水 (meikyo): ジャスト回避時の追加回復
    const healAmount = 10 + player.justEvadeHealBonus;
    player.health = Math.min(player.maxHealth, player.health + healAmount);

    player.specialGauge = Math.min(player.maxSpecialGauge, player.specialGauge + player.specialGaugeGain);
    updateSpecialBar();
    addExp(10); // Bonus exp for just evade
    showMessage("見切り！", "just-evade"); // Fantasy Japanese for Just Evade

    // Reset evade cooldown instantly as a reward
    player.currentEvadeCooldown = 0;

    // Extend invincibility frames as a reward (+1.0 seconds of guaranteed safety)
    player.isInvincible = true;
    player.invincibleTimer = 1.0;

    // Flashing effect (warm glow)
    canvas.style.filter = 'sepia(50%) saturate(200%) brightness(110%)';
    setTimeout(() => { canvas.style.filter = 'none'; }, 200);
}

function addScore(amount) {
    score += amount;
    scoreBtn.textContent = score;
}

function addExp(amount) {
    player.exp += amount * player.expMultiplier;

    // Process all level ups gained from this exp chunk
    while (player.exp >= player.expToNext) {
        pendingLevelUps++;
        player.exp -= player.expToNext;
        player.expToNext = Math.floor(player.expToNext * 1.5); // Increase required exp
        player.level++;
    }

    if (pendingLevelUps > 0 && gameState !== 'levelup') {
        // Delay level up if special attack animation is playing
        if (player.isSpecialAttacking) {
            if (isLevelUpWaitingForSpecial) return; // Already waiting

            isLevelUpWaitingForSpecial = true;
            const waitForSpecial = () => {
                if (!player.isSpecialAttacking && gameState !== 'levelup') {
                    isLevelUpWaitingForSpecial = false;
                    triggerLevelUp();
                } else if (gameState === 'levelup') {
                    // If we somehow entered levelup state through another path
                    isLevelUpWaitingForSpecial = false;
                } else {
                    requestAnimationFrame(waitForSpecial);
                }
            };
            requestAnimationFrame(waitForSpecial);
        } else {
            triggerLevelUp();
        }
    }

    playerLevelBtn.textContent = player.level;
    updateExpBar();
}

function updateExpBar() {
    const percentage = Math.min(100, (player.exp / player.expToNext) * 100);
    expBar.style.width = percentage + '%';
}

function updateSpecialBar() {
    const percentage = Math.min(100, (player.specialGauge / player.maxSpecialGauge) * 100);
    specialBar.style.width = percentage + '%';

    // Make it glow when full
    if (percentage >= 100) {
        specialBar.style.boxShadow = '0 0 15px #ffd700, 0 0 30px #ffd700';
    } else {
        specialBar.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
    }
}

function triggerLevelUp() {
    if (pendingLevelUps <= 0) return;
    pendingLevelUps--;

    // Remember what state we were in before leveling up (playing or bossfight)
    // Don't save 'countdown' as previous state to avoid infinite loops
    if (gameState !== 'levelup' && gameState !== 'countdown') {
        previousGameState = gameState;
    }

    gameState = 'levelup';

    // Auto-scale stats and heal on every level up
    player.maxHealth += 10; // HP grows every level
    player.health = player.maxHealth;
    player.attackPower += 2; // Attack power grows every level
    updateHealthBar();

    // Spawn new environment layout to simulate "moving forward/journey"
    envObjects = [];
    const objCount = 3 + player.level * 2; // More scenery as you level up
    for (let i = 0; i < objCount; i++) {
        envObjects.push(new EnvObject());
    }

    // Generate random perks
    const perkContainer = document.getElementById('perk-container');
    perkContainer.innerHTML = ''; // clear old

    // Pick 3 random unique perks
    // Fisher-Yates shuffle for uniform distribution
    const shuffled = [...availablePerks];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const choices = shuffled.slice(0, 3);

    choices.forEach((perk, index) => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn neon-btn perk-btn';
        if (index === 0) btn.classList.add('selected-perk'); // Select first by default for keyboard
        btn.innerHTML = `<span class="perk-name">${perk.name}</span><br><span class="perk-desc" style="font-size: 0.6em; color: #ccc;">${perk.desc}</span>`;
        btn.onclick = () => applyUpgrade(perk.id);

        // Mouse hover support for keyboard selection sync
        btn.onmouseenter = () => {
            const allBtns = perkContainer.querySelectorAll('.perk-btn');
            allBtns.forEach(b => b.classList.remove('selected-perk'));
            btn.classList.add('selected-perk');
            currentPerkIndex = index;
        };

        perkContainer.appendChild(btn);
    });

    currentPerkIndex = 0; // Reset index
    showMessage("限界突破", "critical"); // Level Up fantasy word
    levelupScreen.classList.add('active');
}

function applyUpgrade(type) {
    if (type === 'kensei') { // 剣聖
        player.attackRange += 30;
        player.attackArc += Math.PI / 6; // +30 degrees
    } else if (type === 'shinsoku') { // 神速
        player.speed += 50;
        player.evadeDistanceMultiplier += 0.5; // +50% evade distance
    } else if (type === 'zetsuei') { // 絶影
        player.baseCritChance += 0.20; // 20% flat chance
        player.critDamageMultiplier += 2.0; // From 5x to 7x etc.
    } else if (type === 'goyoku') { // 強欲
        player.expMultiplier += 0.5; // +50% EXP
    } else if (type === 'meikyo') { // 明鏡止水
        player.justEvadeHealBonus += 20;
        player.slowMoDurationMultiplier += 0.5; // +50% slow-mo time
    } else if (type === 'kongo') { // 金剛
        player.superArmor = true;
        player.lowHpAttackBoost = true;
    } else if (type === 'kenkon') { // 乾坤一擲
        player.counterBoost = true;
        player.reflectDamage = true;
    } else if (type === 'ougi') { // 奥義の真髄
        player.specialGaugeGain += 15;
        player.specialRangeMultiplier += 0.5; // +50% AoE radius
    } else if (type === 'kinkyu') { // 緊急回避
        player.autoEvade = true;
    } else if (type === 'rengeki') { // 連撃
        player.comboSpeedMultiplier -= 0.15;
        player.attackCooldown = Math.max(0.1, player.attackCooldown * 0.80);
        player.attackDuration = Math.max(0.05, player.attackDuration * 0.80);
    }

    updateHealthBar();
    levelupScreen.classList.remove('active');

    if (pendingLevelUps > 0) {
        // Show next perk selection if we leveled up multiple times instantly
        triggerLevelUp();
    } else {
        // パーク選択後にカウントダウン演出を挟む
        // previousGameState は triggerLevelUp() で既に保存済み
        gameState = 'countdown';
        countdownValue = 3;
        countdownTimer = COUNTDOWN_STEP_DURATION;
    }
}

function updateHealthBar() {
    const percentage = Math.max(0, player.health / player.maxHealth * 100);
    healthBar.style.width = percentage + '%';
    if (percentage < 30) {
        healthBar.style.backgroundColor = '#ff0000';
    } else {
        healthBar.style.backgroundColor = '';
    }
}

function spawnEnemy() {
    const scaling = player ? player.level : 1;

    // Define base chances
    let baseMageChance = 0.05 + (scaling * 0.01);
    let baseBossChance = 0; // Boss has its own spawn logic

    // Scale existing chances
    let mageChance = baseMageChance;
    if (mageChance > 0.20) mageChance = 0.20; // Cap

    const orcChance = 0.15 + (scaling * 0.015);

    const rand = Math.random();
    let type = 'golem';

    if (rand < mageChance) {
        type = 'mage';
    } else if (rand < mageChance + orcChance) {
        type = 'orc';
    }
    enemies.push(new Enemy(type, scaling));
}


// --- Main Loops ---

// --- Tutorial & Countdown Flow ---
function showTutorial() {
    sfx.init(); // Initialize Audio on user interaction
    sfx.loadBGM('assets/audio/bgm_battle.mp3');
    sfx.playBGM();
    gameState = 'tutorial';
    titleScreen.classList.remove('active');
    document.getElementById('tutorial-screen').classList.add('active');
}

function dismissTutorial() {
    document.getElementById('tutorial-screen').classList.remove('active');
    startGame(); // This now starts with countdown
}

function startGame() {
    sfx.init(); // Initialize Audio on user interaction
    sfx.loadBGM('assets/audio/bgm_battle.mp3');
    sfx.playBGM();

    // Ensure textures are generated before starting
    if (!preRenderedEnv.tree) {
        generateEnvTextures();
    }

    player = new Player();
    enemies = [];
    projectiles = [];
    particles = [];
    envObjects = [];
    score = 0;
    killCount = 0;
    pendingLevelUps = 0;
    scoreBtn.textContent = '0';
    playerLevelBtn.textContent = '1';
    timeScale = 1;
    enemySpawnTimer = 2.0;
    survivalTimer = SURVIVAL_TIME_SECONDS; // Reset timer for Phase 1

    // Reset boss alert
    bossAlertActive = false;
    removeBossAlertFlash();

    // Hide boss UI in case of restart
    document.getElementById('boss-hud').classList.add('hide');

    // Clear any lingering messages/warnings
    messageDisplay.textContent = '';
    messageDisplay.className = '';

    // Initial scenery
    for (let i = 0; i < 3; i++) {
        envObjects.push(new EnvObject());
    }

    updateHealthBar();
    updateExpBar();
    updateSpecialBar();

    // Start countdown instead of directly playing
    gameState = 'countdown';
    countdownValue = 3;
    countdownTimer = COUNTDOWN_STEP_DURATION;

    titleScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    levelupScreen.classList.remove('active');
    document.getElementById('tutorial-screen').classList.remove('active');

    lastTime = performance.now();
    // Cancel any existing game loop before starting a new one
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function endGame() {
    gameState = 'gameover';
    document.getElementById('game-over-screen').querySelector('h2').textContent = 'GAME OVER - 力尽きた...';
    document.getElementById('boss-hud').classList.add('hide'); // Hide boss HUD
    finalScoreBtn.textContent = score;
    finalLevelBtn.textContent = player.level;
    gameOverScreen.classList.add('active');

    // Force extreme slow-mo on death
    timeScale = 0.3; 
    slowMoTimer = 5.0; 
}

function winGame() {
    gameState = 'gameover';
    document.getElementById('game-over-screen').querySelector('h2').textContent = 'MISSION CLEAR - 厄災を討伐した！';
    document.getElementById('boss-hud').classList.add('hide'); // Hide boss HUD
    finalScoreBtn.textContent = score;
    finalLevelBtn.textContent = player.level;
    gameOverScreen.classList.add('active');

    // Victory slow-mo
    timeScale = 0.3;
    slowMoTimer = 5.0;
}

function gameLoop(timestamp) {
    if (gameState === 'title' || gameState === 'gameover') {
        // ゲームオーバーやタイトル画面ではループを停止してCPU消費を防ぐ
        gameLoopId = null;
        return;
    }

    // Calculate real deltaTime
    let rawDt = (timestamp - lastTime) / 1000;
    if (rawDt < 0) rawDt = 0; // Prevent negative dt (time travel bug fix)
    if (rawDt > 0.1) rawDt = 0.1; // Cap dt to prevent huge jumps
    lastTime = timestamp;

    // Countdown state - progress countdown timer
    if (gameState === 'countdown') {
        countdownTimer -= rawDt;
        if (countdownTimer <= 0) {
            countdownValue--;
            if (countdownValue < 0) {
                // Countdown finished - resume previous state (playing or bossfight)
                // If previous state is title (game just started), start playing!
                if (!previousGameState || previousGameState === 'title') {
                    gameState = 'playing';
                } else {
                    gameState = previousGameState;
                }
            } else if (countdownValue === 0) {
                // "GO!" phase
                countdownTimer = COUNTDOWN_GO_DURATION;
            } else {
                countdownTimer = COUNTDOWN_STEP_DURATION;
            }
        }
    }

    if (gameState === 'playing' || gameState === 'bossfight') {
        // Handle Slow Mo recovery
        if (slowMoTimer > 0) {
            slowMoTimer -= rawDt; // Real time decay
            if (slowMoTimer <= 0) {
                timeScale = 1; // Return to normal speed
            }
        }

        // Apply timescale to game logic
        dt = rawDt * timeScale;

        update(dt, rawDt);
    }

    // Always draw so the background is visible during level up
    draw();

    gameLoopId = requestAnimationFrame(gameLoop);
}

function update(dt, rawDt) {
    // Player updates at raw speed
    player.update(rawDt);

    if (gameState === 'playing') {
        // Survival Timer Logic
        survivalTimer -= rawDt;
        updateTimerUI();

        // Boss Alert: activate when 5 seconds remain
        if (survivalTimer <= 5 && survivalTimer > 0 && !bossAlertActive) {
            bossAlertActive = true;
            addBossAlertFlash();
        }

        if (survivalTimer <= 0) {
            survivalTimer = 0;
            updateTimerUI();
            removeBossAlertFlash();
            bossAlertActive = false;
            transitionToBossPhase();
            return; // Skip rest of update this frame
        }

        // Calculate current max enemies based on time remaining or level
        let maxEnemies = 3 + Math.floor(player.level / 2);

        // Increase density as time runs out (Progressive scaling for 60s timer)
        if (survivalTimer < 45) maxEnemies += 1;
        if (survivalTimer < 30) maxEnemies += 2;
        if (survivalTimer < 15) maxEnemies += 3;

        // Cap max enemies to avoid performance issues
        maxEnemies = Math.min(maxEnemies, 15);

        // Enemy spawn difficulty curve based on time remaining
        enemySpawnTimer -= rawDt;
        if (enemySpawnTimer <= 0 && enemies.length < maxEnemies) {
            spawnEnemy();

            // Gets faster as time runs out (from 2.0s down to 0.4s)
            const progress = 1.0 - (survivalTimer / SURVIVAL_TIME_SECONDS);
            let spawnRate = Math.max(0.4, 2.0 - (progress * 1.6));

            // Additional scaling based on level
            spawnRate = Math.max(0.3, spawnRate - (player.level * 0.05));
            enemySpawnTimer = spawnRate;
        }
    }

    // Common for both playing and bossfight
    if (gameState === 'playing' || gameState === 'bossfight') {
        // Enemies (slowed by timeScale)
        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update(dt);
            if (enemies[i].state === 'dead') {
                createParticles(enemies[i].x, enemies[i].y, enemies[i].baseColor, 15);
                enemies.splice(i, 1);
            }
        }
    }

    // Particles (slowed by timeScale)
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(dt);
        if (projectiles[i].life <= 0) {
            projectiles.splice(i, 1);
        }
    }

    // Damage Texts (slowed by timeScale)
    for (let i = damageTexts.length - 1; i >= 0; i--) {
        damageTexts[i].update(dt);
        if (damageTexts[i].life <= 0) {
            damageTexts.splice(i, 1);
        }
    }
}

// --- Specific UI & Transition logic ---
function updateTimerUI() {
    const timerUI = document.getElementById('survival-timer');
    if (timerUI) {
        const m = Math.floor(survivalTimer / 60);
        const s = Math.floor(survivalTimer % 60);
        timerUI.textContent = `${m}:${s.toString().padStart(2, '0')}`;

        // Pulse red if under 10 seconds
        if (survivalTimer <= 10 && survivalTimer > 0) {
            timerUI.style.color = '#ff4d4d';
            timerUI.style.fontSize = survivalTimer <= 5 ? '28px' : '24px';
        } else {
            timerUI.style.color = ''; // reset to default
            timerUI.style.fontSize = '';
        }
    }
}

// --- Boss Alert Flash ---
function addBossAlertFlash() {
    if (bossAlertFlashEl) return;
    bossAlertFlashEl = document.createElement('div');
    bossAlertFlashEl.className = 'boss-alert-flash';
    document.getElementById('game-container').appendChild(bossAlertFlashEl);
}

function removeBossAlertFlash() {
    if (bossAlertFlashEl) {
        bossAlertFlashEl.remove();
        bossAlertFlashEl = null;
    }
}

function transitionToBossPhase() {
    gameState = 'bossfight';

    // Kill all current enemies
    enemies.forEach(e => {
        createParticles(e.x, e.y, e.baseColor, 10);
    });
    enemies = [];
    projectiles = []; // Clear leftover magic

    // Ensure Warning Overlay is hidden (User decided it's unnecessary)
    const warningUI = document.getElementById('warning-overlay');
    if (warningUI) {
        warningUI.classList.remove('active');
        warningUI.classList.add('hide');
    }

    // Reset player position to center
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    // Clear the arena
    envObjects = [];

    // Show Boss HUD
    document.getElementById('boss-hud').classList.remove('hide');

    // Spawn Boss
    const boss = new Enemy('boss', player.level);
    enemies.push(boss);

    // Setup Boss UI
    updateBossHP(boss.hp, boss.maxHp);

    showMessage("BOSS BATTLE", "critical");
}

function updateBossHP(current, max) {
    const bar = document.getElementById('boss-hp-bar');
    if (bar) {
        const percentage = Math.max(0, current / max * 100);
        bar.style.width = percentage + '%';
    }
}

function draw() {
    // Apply Global Screen Shake and Color Filters
    let shakeX = 0;
    let shakeY = 0;
    if (player.shakeTimer > 0) {
        shakeX = (Math.random() - 0.5) * player.shakeIntensity;
        shakeY = (Math.random() - 0.5) * player.shakeIntensity;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Apply grayscale filter on death
    if (player.health <= 0) {
        ctx.filter = 'grayscale(100%) contrast(1.2) brightness(0.8)';
    }

    // Clear Canvas
    ctx.fillStyle = 'rgba(26, 22, 20, 0.4)'; // Earthy Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid/background element (Old stone floor style)
    ctx.strokeStyle = 'rgba(140, 115, 75, 0.1)'; // faint wood/gold color
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for (let y = 0; y < canvas.height; y += 50) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();

    // Sort objects by their Y position (for depth sorting)
    const renderQueue = [player, ...enemies, ...envObjects, ...projectiles];
    renderQueue.sort((a, b) => a.y - b.y);

    renderQueue.forEach(obj => obj.draw(ctx));

    // --- Dynamic Lighting (Player Aura) ---
    if (gameState === 'playing' || gameState === 'bossfight') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Player light radius based on special gauge
        const lightRadius = 150 + (player.specialGauge / player.maxSpecialGauge) * 100;
        const gradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, lightRadius);

        // Color shifts slightly based on special gauge full
        if (player.specialGauge >= player.maxSpecialGauge) {
            gradient.addColorStop(0, 'rgba(255, 230, 150, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 200, 50, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 240, 200, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 240, 200, 0)');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(player.x - lightRadius, player.y - lightRadius, lightRadius * 2, lightRadius * 2);
        ctx.restore();
    }

    // Particles on top
    particles.forEach(p => p.draw(ctx));

    // UI overlays on very top
    damageTexts.forEach(dt => dt.draw(ctx));

    // --- Countdown Overlay (Canvas-drawn) ---
    if (gameState === 'countdown') {
        drawCountdown();
    }

    // --- Boss Alert Canvas Overlay ---
    if (bossAlertActive && gameState === 'playing' && survivalTimer > 0) {
        drawBossAlert();
    }

    // Resolve Death Check at the very end of the frame
    // This allows Vampire perk (healOnKill) or LevelUps to save the player if they trade hits with an enemy
    if (player.health <= 0 && gameState !== 'gameover' && gameState !== 'bosstransition' && gameState !== 'levelup') {
        // Double check: if pending level ups exist, let them process instead of dying
        if (pendingLevelUps > 0) {
            triggerLevelUp();
        } else {
            endGame();
            ctx.restore(); // Ensure we restore before returning
            return;
        }
    }

    ctx.restore(); // Final restore for screen shake/filter
}

// --- Countdown Drawing ---
function drawCountdown() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(10, 8, 6, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    let text;
    let progress;
    if (countdownValue > 0) {
        text = countdownValue.toString();
        progress = 1.0 - (countdownTimer / COUNTDOWN_STEP_DURATION);
    } else {
        text = 'GO!';
        progress = 1.0 - (countdownTimer / COUNTDOWN_GO_DURATION);
    }

    // Scale: pop in from 0.5 to 1.2, then settle at 1.0
    let scale;
    if (progress < 0.2) {
        scale = 0.5 + (progress / 0.2) * 0.7; // 0.5 -> 1.2
    } else if (progress < 0.4) {
        scale = 1.2 - ((progress - 0.2) / 0.2) * 0.2; // 1.2 -> 1.0
    } else {
        scale = 1.0;
    }

    // Fade out in the last 20%
    let alpha = 1.0;
    if (progress > 0.8) {
        alpha = 1.0 - ((progress - 0.8) / 0.2);
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Glow effect
    ctx.shadowColor = countdownValue > 0 ? '#d4af37' : '#ff6600';
    ctx.shadowBlur = 40;

    // Text
    ctx.font = `bold ${countdownValue > 0 ? 120 : 90}px 'Yu Mincho', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = countdownValue > 0 ? '#d4af37' : '#ff8800';
    ctx.fillText(text, 0, 0);

    // Outer stroke
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 4;
    ctx.strokeText(text, 0, 0);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();

    // Expanding ring effect
    if (progress < 0.5) {
        const ringProgress = progress / 0.5;
        const ringRadius = 50 + ringProgress * 150;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 175, 55, ${0.5 * (1 - ringProgress)})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

// --- Boss Alert Drawing ---
function drawBossAlert() {
    const remaining = Math.ceil(survivalTimer);
    const cx = canvas.width / 2;

    // Warning text at top
    const t = performance.now();
    const pulse = 0.7 + Math.sin(t * 0.008) * 0.3;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20;

    // "⚠ BOSS ARRIVING" text
    ctx.font = 'bold 28px "Yu Mincho", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`⚠ BOSS ARRIVING... ${remaining}`, cx, 85);

    // Stroke for readability
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeText(`⚠ BOSS ARRIVING... ${remaining}`, cx, 85);

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();

    // Screen edge vignette flash (red)
    const flashAlpha = 0.05 + Math.sin(t * 0.006) * 0.05;
    ctx.fillStyle = `rgba(180, 0, 0, ${flashAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Initial draw for background before start
ctx.fillStyle = '#0d0d12';
ctx.fillRect(0, 0, canvas.width, canvas.height);
