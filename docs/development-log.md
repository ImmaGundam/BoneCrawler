# BoneCrawler v2.9.5 Development Log

## Java Runtime Pipeline

- Added a raw-JDK packaging path under `tools/java/bc-launcher`.
- Packaged builds are created in `dist/native/BoneCrawler` and launch with `BoneCrawler.exe`.
- The Java launcher hosts the game locally, embeds a JCEF/Chromium game window, and exposes runtime controls used by the in-game status panel.
- Java runtime status, reload, fullscreen, hide, and stop actions are coordinated through `src/platform/java-runtime-bridge.js`.
- The JavaScript game state stays in `index.html`, `src/`, `assets/`, and `packages/`, while Java only owns the secure host window, container controls, and packaged runtime flow.
- The in-game runtime panel is now the primary control surface for packaged runs instead of a separate Java window button bar.
- The playable browser runtime remains in `index.html`, `src/`, `assets/`, and `packages/bonecrawler`.
- The Dev Kit remains in `dev/` for testing, spawning, transport, and live inspection.
- Java prototype engine work is kept separate under `tools/java/bc-engine` and `tools/java/bc-pipeline`.

## File Layout

- `index.html` starts the current game runtime.
- `src/` contains the game engine/runtime scripts, renderers, systems, maps, UI, and platform bridge.
- `assets/` contains icons, title art, fonts, and audio.
- `packages/bonecrawler/game.manifest.json` defines loose runtime metadata for player moves, upgrades, maps, and package/editor contracts.
- `tools/java/bc-launcher/scripts/package-windows.ps1` builds the Windows test package with a JDK.
