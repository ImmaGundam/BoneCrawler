# BoneCrawler Engine Roadmap

BoneCrawler is currently a playable custom arcade-action game with an emerging engine/runtime pipeline. The next goal is to turn the current game into a reusable toolkit for making games in the same family while moving the player runtime into Java and keeping editor tooling external to the shipped game.

## Current Spine

- Playable JavaScript/canvas game runtime with title, play, pause, dialog, upgrade, and game-over states.
- Package manifests under `packages/bonecrawler/` describing game identity, maps, progression, and runtime handlers.
- Java validator/packer seed under `tools/java/bc-pipeline/`.
- Raw-JDK launcher under `tools/java/bc-launcher/` for native Windows app-image packaging.
- Java-native engine track under `tools/java/bc-engine/`.
- Token-secured local Java runtime bridge for packaged builds.
- Runtime package loader that lets the game read package metadata while keeping JS defaults available.

## Missing Engine-Platform Systems

- **Scene graph / entity model:** move from custom arrays/globals toward unified entity ownership, lifecycle, queries, and component-like data.
- **Renderer abstraction:** add render layers, anchors, camera conventions, layout helpers, culling rules, and reusable panel/icon/grid drawing.
- **Editor tooling:** add map/entity/property inspectors, visual placement tools, asset browsing, undo/redo, and project save/load in an external companion tool.
- **Asset pipeline:** add asset metadata, dependency validation, import rules, pack rules, and build-time optimization.
- **Collision/physics layer:** formalize colliders, hit queries, damage volumes, projectile ownership, and reusable collision channels.
- **Serialization and saves:** define project schema, runtime save schema, version migration, and compatibility checks.
- **Packaging profiles:** expand from Windows app-image to installer profiles, signing, platform-specific outputs, and release/update flow.
- **Debug/profiling tools:** add frame timing, object counts, collision overlays, event tracing, spawn inspection, and replay/debug capture.
- **Scripting/event system:** move enemies, maps, triggers, dialogs, upgrades, and cutscenes toward data-driven commands.
- **Runtime/editor separation:** keep packaged games locked down and move the editor out of the in-game runtime entirely.

## Java Backbone Direction

- Build the player runtime as a direct Java engine instead of a browser-hosted localhost game.
- Keep packaged games small and locked down while editor tooling becomes a separate product.
- Let Java validate, pack, run, and eventually project-manage game packages.
- Preserve manifests and schemas so content rules survive the runtime migration.

## Stable Runtime API Naming

- Keep core engine/runtime globals stable under `window.GameRuntime`.
- Treat `window.BoneCrawler*` names as compatibility aliases during the migration, not the long-term engine contract.
- Keep `game.title` for display, `game.id` for package identity, and reserve `game.namespace` for an optional branded alias emitted by tooling later.
- Future editor exports may generate a project alias from `game.namespace`, but engine code should always depend on the stable `GameRuntime` API.

## Near-Term Phases

1. Stand up the Java engine shell and use the current JS game as the behavioral reference.
2. Formalize `game.manifest.json` into a stricter schema and validator rules.
3. Add map/entity data schemas that can be loaded by both the Java runtime and future editor tooling.
4. Port the current JS state loop, renderer primitives, and input flow into Java in layers.
5. Expand package profiles for dev, packaged game, and external editor builds.
