# BoneCrawler Java Engine Migration

BoneCrawler is moving from "Java hosts a browser game" toward "Java is the game engine runtime." The current Java launcher, validator, and package pipeline remain useful, but they now support a direct desktop engine instead of a localhost browser player.

## Direction

- Treat the current JavaScript game as the reference implementation.
- Port systems into Java in deliberate layers instead of rebuilding the whole game in one pass.
- Keep the editor out of the player runtime. Future editor work becomes an external companion tool built against the Java engine product.
- Preserve manifests and package data so content rules survive the runtime migration.

## Current Source Of Truth

- `src/main/loop.js` contains the current fixed-timestep loop contract.
- `src/main/update.js` contains the main simulation tick orchestration.
- `src/render/render-play-dispatch.js` contains the render dispatch and overlay order.
- `src/engine/render-helpers.js` contains the pixel render primitives.
- `src/engine/input.js` contains high-level input handling by game state.
- `packages/bonecrawler/game.manifest.json` contains the package/runtime/content contract we should preserve.

## What Java Already Owns

- Packaging and validation seed: `tools/java/bc-pipeline/`
- Native launcher/app-image packaging: `tools/java/bc-launcher/`
- Runtime security/bridge concepts that can be reused for tooling and packaging

## What Java Engine Needs To Own

- Game window and render surface
- Fixed update/render loop
- Game state machine (`title`, `playing`, `paused`, `upgrade`, `dialog`, `gameover`, `zone_transition`)
- Input system
- Asset loading
- Sprite/palette rendering
- Collision and projectile rules
- Player, enemy, item, and map runtime data
- Audio playback
- Save/persistence rules

## Port Order

1. Engine shell
   - Create the Java window, render surface, fixed loop, and state machine.
   - Render placeholder screens without browser dependencies.
2. Pixel renderer
   - Port palette, sprite, text, and panel rendering helpers.
   - Match the logical `GW/GH/SCALE` drawing model from the JS runtime.
3. Input and state flow
   - Port title, pause, retry, and menu transitions first.
   - Keep state names aligned with the JS version to reduce confusion.
4. Player runtime
   - Port movement, attack, block, dodge, and upgrade-derived stats.
   - Treat the current `player-runtime.js` as the behavioral reference.
5. World and collisions
   - Port room bounds, map interactions, hit detection, pickups, and projectiles.
6. Enemies and bosses
   - Port spawn rules, AI ticks, combat windows, and boss phases.
7. Audio and persistence
   - Recreate the current zone/music/sfx flow and save semantics.
8. Package loading
   - Replace JS runtime refs with Java-side asset/content loading from manifests.

## Working Rules For The Migration

- Do not re-invent behavior when the JS runtime already answers the question.
- Port the loop and systems into Java one subsystem at a time.
- Keep manifests and package contracts stable while engine internals change.
- Only remove JS runtime features after the Java version reaches feature parity for that subsystem.
- Treat the future editor as a separate product that targets the Java engine and package schema.

## First Java Milestone

The first useful Java milestone is not "full game parity." It is:

- a native window,
- a fixed engine loop,
- a render surface using logical game pixels,
- a minimal state machine,
- and enough structure to port the pause/title/play flow intentionally.
