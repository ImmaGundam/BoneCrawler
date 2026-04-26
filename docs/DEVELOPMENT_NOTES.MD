## BoneCrawler

BoneCrawler is a browser-based dark fantasy arcade action game built with JavaScript, HTML5 Canvas, and a custom lightweight game-engine structure. The project focuses on state-driven gameplay, modular systems, pixel-art rendering, player combat, enemy AI, zone progression, upgrades, secrets, and local scoreboard persistence.

The game was designed as more than a single hardcoded level. Its structure separates gameplay into engine-style systems such as player control, enemies, maps, collision, rendering, items, dialog, scoring, and game state management.


## Technical Highlights

- Built a custom HTML5 Canvas rendering pipeline for pixel-art gameplay.
- Designed a state-driven game loop for title, intro, gameplay, pause, dialog, upgrades, zone transitions, scoreboard, and game-over flow.
- Implemented player movement, sword combat, dodge mechanics, upgrade progression, health, potion use, and special abilities.
- Created enemy systems for skeletons, wizards, projectiles, bosses, and wave-based spawning.
- Built modular zone logic for map blockers, decor, breakables, secrets, doors, portals, and transitions.
- Added local scoreboard persistence using browser storage.
- Added keyboard, mouse, and mobile touch-control support.
- Separate Electron distribution code from the browser game runtime.
- Refactored a large single-file prototype toward an engine-style file structure.


## Game Design and Engine Structure

BoneCrawler is designed as a small browser-based fast-paced (arcade influenced) action game built around a lightweight custom game engine. Instead of treating the project as one fixed level or one hardcoded sequence, the game is organized around reusable systems that work together: game state, player control, enemies, maps, rendering, collision, items, upgrades, dialog, and scoring.

At the center of the design is a state-driven game loop. The game continuously runs through an update and render cycle, but the current game state determines what logic is active. States such as `title`, `playing`, `paused`, `dialog`, `upgrade`, `zoneClear`, and `gameover` allow the engine to control when gameplay is active, when menus are shown, when dialog pauses the action, and when transitions occur between zones.

This structure keeps the game organized. During the `playing` state, the engine reads player input, updates movement, handles attacks, checks collisions, updates enemies, spawns items, tracks score, and renders the dungeon. During menu or dialog states, the active dungeon simulation is paused or limited so the player can interact with UI, story text, upgrades, or retry options without enemies and timers continuing in the background.

The game is also structured around modular engine concepts. The player controller handles movement, attacks, dodging, abilities, health, and upgrades. Enemy systems handle skeletons, wizards, bosses, projectiles, and spawn timing. Map systems define each zone, including blockers, breakable objects, transitions, secrets, and environmental interactions. Rendering systems draw the pixel-art world, sprites, HUD, menus, effects, and zone-specific decoration.

This approach allows BoneCrawler to function less like a single-page script and more like a compact game engine. New zones, enemies, abilities, items, or screens can be added by extending the correct system instead of rewriting the entire game. The design separates what the game is doing from how each system behaves, making the project easier to expand, debug, and eventually refactor into individual engine modules.

## Development Note

BoneCrawler was made with AI agent assistance in code creation to accelerate game development through a hands-on, directive workflow. I designed the game concept, gameplay structure, visual direction, system requirements, zone behavior, combat flow, UI expectations, and engine-style organization.

I directed the architecture, reviewed behavior, tested gameplay, identified issues, refined mechanics, adjusted layouts, and guided the project toward a working playable result.