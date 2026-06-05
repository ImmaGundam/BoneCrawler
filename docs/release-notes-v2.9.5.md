# BoneCrawler v2.9.5

BoneCrawler v2.9.5 released!

This update moves BoneCrawler into the new Java runtime packaging path while keeping the browser game logic loose and manifest-driven.

### Highlights

- Added the new Windows Java runtime container using `JDK + Swing + JCEF`.
- Packaged runtime controls are now embedded into the in-game status panel.
- Added a proper GitHub build path for packaged Windows runtime builds.
- Added a tagged release workflow so future Windows Java builds can publish directly to GitHub Releases.

### Runtime / Packaging

- New packaged Windows runtime is built from `tools/java/bc-launcher`.
- Runtime now uses the game UI for `Reload`, `Fullscreen`, `Reset Scoreboard`, and `Exit Game`.
- EXE metadata and packaging flow were cleaned up for release output.
- The old JavaFX experiment path was removed from the active project flow.

### Game / Runtime Coordination

- Browser game logic remains in `index.html`, `src/`, `assets/`, and `packages/`.
- Java now owns the secure host window, embedded runtime container, packaging, and release flow.
- Runtime bridge handling for packaged builds is coordinated through `src/platform/java-runtime-bridge.js`.
- Player/runtime wiring for block, reflect, mirror, mobile controls, and runtime UI was kept aligned with the manifest-driven state path.

### Tools / Dev Kit

- Dev Kit remains available for inspection, transport, and runtime testing.
- Layout and runtime control updates were carried forward into the current shell/UI path.
- Java engine and pipeline prototype work remain separated under `tools/java/bc-engine` and `tools/java/bc-pipeline`.

### Files

- Web Browser runtime
  - `index.html`

- Windows Java runtime
  - `BoneCrawler-java-windows-v2.9.5.zip`
