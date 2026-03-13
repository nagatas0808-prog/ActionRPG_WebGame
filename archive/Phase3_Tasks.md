# 2D Action RPG Game Development (Just Evasion Focus)

## Planning
- [x] Read global and webapp project rules
- [x] Determine project folder name and structure
- [x] Create `implementation_plan.md` outlining the game mechanics (Just Evasion, Counterattacks, UI, etc.)
- [x] Request user review for the plan

## Implementation
- [x] Setup project folder structure
- [x] Create `index.html` structure
- [x] Implement `style.css` for game canvas and UI
- [x] Implement `script.js` core game loop
- [x] Implement player movement and drawing
- [x] Implement enemy attacks and telegraphs
- [x] Implement "Just Evasion" mechanic and benefits (e.g., invincibility frames, counter attack, visual effects)
- [x] Implement game over and score/survival time logic
- [x] Overhaul `player.draw` to depict a "Swordsman" instead of a basic circle
- [x] Adjust enemy spawn difficulty curve to be more gradual based on score
- [x] Overhaul Canvas rendering (Player, Enemy, Particles, Telegraphs) to an oblique/angled 2.5D perspective

## Theme Overhaul (Japanese Fantasy)
- [x] Update `index.html` text and UI labels to Fantasy Japanese (e.g., Score -> 討伐数, LEVEL UP -> 成長, HP/ATK/SPD -> 体力/筋力/俊敏性)
- [x] Update `style.css` colors, fonts, and backgrounds from Cyberpunk/Neon to Fantasy (Parchment, Earth tones, Gold accents, Muted colors)
- [x] Update `script.js` particle colors, character base colors, and text to match the Fantasy theme.

## Content Expansion
- [x] Add dynamic environment objects (Rocks, Trees, Ruins) that increase/change when the player levels up.
- [x] Add multiple enemy types (e.g., Goblin, Orc).
- [x] Implement a Boss enemy that spawns every 10 kills.

## Combat Mechanics Enhancement (Attack Patterns)
- [x] Add `attackType` (circle, line, cone) to Enemy class and generate corresponding geometry.
- [x] Implement collision detection and telegraph drawing for `line` (Rectangular dash) attacks.
- [x] Implement collision detection and telegraph drawing for `cone` (Sector/Arc sweep) attacks.

## New Mechanics (Double-Tap Dodge & Special Attack)
- [x] Implement WASD double-tap detection for dodging (evasion).
- [x] Add "Special Gauge" UI element to `index.html` and `style.css`.
- [x] Add Special Gauge logic (fills on Just Evasion).
- [x] Implement Right-Click special attack (consumes gauge, deals massive AoE damage).

## Verification
- [x] Verify game runs in the browser
- [x] Tuning the "Just Evasion" frame window and gameplay feel
- [x] Create `walkthrough.md`

## Combat System Expansion (Phase 2)

### Auto Lock-On
- [x] Add `autoLockOn` toggle state (default: ON)
- [x] Add UI toggle button (Tab key / or on-screen)
- [x] When ON: Player auto-faces nearest enemy

### Combo Attack System
- [x] Implement 3-hit combo chain on left-click (swing patterns: right→left→overhead)
- [x] Add combo timer window between hits
- [x] Add enemy stagger (knockback + hitstun) on each combo hit
- [x] Enemies in attack animation are immune to stagger

### Special Attack Stagger
- [x] Apply stagger/knockback to enemies hit by special attack (奥義)
- [x] Enemies in attack animation still immune to stagger

### Visual Enhancements
- [x] Replace vector graphics with AI-generated 2D character sprites (Idle, Walk, Attack 1-3)
- [x] Implement offline Python preprocessing for sprite background transparency (Checkerboard removal)
- [x] Add Afterimage Trail effects for evasions, attacks, and dash movement
- [x] Add dynamic Aura particles (blue/gold depending on critical state)
- [x] Add +15 EXP bonus logic when killing enemies with the Special Attack (絶技)

## Phase 3: Future Update Plan (Ideas for Next Session)
- [x] **Enemy Variety & Boss Mechanics**
    - Add ranged enemies (archers/mages) that force the player to dodge projectiles.
    - Enhance the Boss (Black enemy) with multiple phases or a larger variety of telegraphs.
- [x] **Level Up System Expansion (Skill Tree / Perks)**
    - Instead of just stat bumps, offer unique perks on level up (e.g., "Wider Attack Arc", "Faster Special Gauge Fill", "Trail causes damage").
- [x] **Sound Effects (BGM / SFX)**
    - Add immersive sound effects for sword swings, enemy hits, dodging (whoosh sound), and special attacks.
    - Add atmospheric background music fitting the dark fantasy theme.
- [x] **UI Polish & Quality of Life**
    - Add floating damage numbers when hitting enemies.
    - Add visual hit-flash (white overlay) on enemies when they take damage to improve attack feedback.
- [ ] **Map & Environment**
    - Add a scrolling or larger arena map with obstacles that both player and enemies must path around.
