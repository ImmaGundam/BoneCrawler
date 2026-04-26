BONECRAWLER GAME FLOW
Game Design + Engine Structure

[Game Boot]
    |
    v
[Load Core Engine]
    |
    |-- Load constants, colors, palette, sprites
    |-- Connect canvas renderer
    |-- Register keyboard / mouse / touch input
    |-- Load saved player name and scoreboard
    |-- Prepare UI panels and display scaling
    |
    v
[Initialize Game State]
    |
    |-- Set gState = "title"
    |-- Prepare player defaults
    |-- Prepare zone data
    |-- Prepare enemy/item containers
    |
    v
[Main Game Loop]
    |
    |-- update()
    |-- render()
    |-- requestAnimationFrame(loop)
    |
    v
+--------------------------------------------------+
|                 STATE CONTROLLER                 |
+--------------------------------------------------+
    |
    | checks current gState
    |
    +--> [title]
    |        |
    |        |-- Show title screen
    |        |-- Show play / scoreboard / name options
    |        |
    |        +--> Start Game
    |                 |
    |                 v
    |             [intro]
    |
    +--> [intro]
    |        |
    |        |-- Show opening text / setup
    |        |-- Wait for continue input
    |        |
    |        +--> Continue
    |                 |
    |                 v
    |             [playing]
    |
    +--> [playing]
    |        |
    |        +--> [Input System]
    |        |        |
    |        |        |-- Read movement input
    |        |        |-- Read attack input
    |        |        |-- Read dodge / ability input
    |        |        |-- Read interact / pause input
    |        |
    |        +--> [Player System]
    |        |        |
    |        |        |-- Move player
    |        |        |-- Handle direction
    |        |        |-- Process sword attacks
    |        |        |-- Process dodge / shadow step
    |        |        |-- Apply upgrades and abilities
    |        |        |-- Track health and damage
    |        |
    |        +--> [Map / Zone System]
    |        |        |
    |        |        |-- Load current zone rules
    |        |        |-- Check walls and blockers
    |        |        |-- Check breakable objects
    |        |        |-- Check doors, portals, and secret triggers
    |        |        |-- Handle zone transition conditions
    |        |
    |        +--> [Enemy System]
    |        |        |
    |        |        |-- Spawn enemies
    |        |        |-- Update skeletons
    |        |        |-- Update wizards and projectiles
    |        |        |-- Update bosses
    |        |        |-- Check enemy attacks
    |        |
    |        +--> [Collision / Combat System]
    |        |        |
    |        |        |-- Check player vs wall collision
    |        |        |-- Check sword vs enemies
    |        |        |-- Check enemies vs player
    |        |        |-- Check projectiles vs player
    |        |        |-- Apply damage, knockback, death, score
    |        |
    |        +--> [Item / Upgrade System]
    |        |        |
    |        |        |-- Spawn hearts, potions, keys, chests
    |        |        |-- Check item pickup
    |        |        |-- Open chest / roll upgrade choices
    |        |        |-- Trigger upgrade state when needed
    |        |
    |        +--> [Dialog / Interaction System]
    |        |        |
    |        |        |-- Detect NPC or object interaction
    |        |        |-- Start dialog when triggered
    |        |        |-- Pause active dungeon simulation
    |        |
    |        +--> [Render System]
    |                 |
    |                 |-- Draw current zone
    |                 |-- Draw decor and breakables
    |                 |-- Draw items and particles
    |                 |-- Draw enemies and bosses
    |                 |-- Draw player
    |                 |-- Draw HUD
    |
    |        State exits from playing:
    |        |
    |        +--> Pause input ----------------------> [paused]
    |        +--> NPC / object interaction --------> [dialog]
    |        +--> Chest upgrade selection ---------> [upgrade]
    |        +--> Zone completed ------------------> [zoneClear]
    |        +--> Player health reaches zero ------> [gameover]
    |
    +--> [paused]
    |        |
    |        |-- Stop active gameplay updates
    |        |-- Keep current run data in memory
    |        |-- Draw pause menu
    |        |
    |        +--> Resume --------------------------> [playing]
    |        +--> Retry / Menu --------------------> [gameover] or [title]
    |
    +--> [dialog]
    |        |
    |        |-- Stop or limit active gameplay updates
    |        |-- Show dialog box / story text
    |        |-- Advance pages with input
    |        |
    |        +--> Dialog finished -----------------> [playing]
    |
    +--> [upgrade]
    |        |
    |        |-- Stop active gameplay updates
    |        |-- Show three upgrade choices
    |        |-- Apply selected upgrade
    |        |
    |        +--> Upgrade selected ----------------> [playing]
    |
    +--> [zoneClear]
    |        |
    |        |-- Show zone transition screen
    |        |-- Preserve player progress
    |        |-- Prepare next zone
    |        |
    |        +--> Continue ------------------------> [playing]
    |
    +--> [gameover]
    |        |
    |        |-- Stop gameplay simulation
    |        |-- Save score if eligible
    |        |-- Show retry / menu options
    |        |
    |        +--> Retry ---------------------------> [playing]
    |        +--> Main Menu -----------------------> [title]
    |
    +--> [scoreboard]
             |
             |-- Load saved local scores
             |-- Display ranked runs
             |
             +--> Back ---------------------------> [title]


ENGINE DESIGN SUMMARY

[Game State]
    Controls which mode is active.

[Main Loop]
    Runs update and render continuously.

[Systems]
    Player, enemies, maps, items, dialog, collision, score, and rendering
    operate as separate engine-style responsibilities.

[Zones]
    Each map defines its own blockers, decor, transitions, secrets, and events.

[Expansion]
    New zones, bosses, upgrades, items, and screens can be added by extending
    the matching system instead of rewriting the whole game.