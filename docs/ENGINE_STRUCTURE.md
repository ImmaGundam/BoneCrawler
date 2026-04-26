## Project Structure

```
src/
  core/
    constants-palette-sprites.js
      Shared constants, colors, palette data, and sprite definitions.

    decals.js
      Deterministic bone decal generation for dungeon decoration.

  engine/
    render-helpers.js
      Canvas drawing helpers for sprites, rectangles, borders, and pixel text.

    collision.js
      Shared collision helpers for rectangles, attacks, and hitboxes.

    input.js
      Keyboard, mouse, and touch input handling.

  player/
    player-combat.js
      Sword attacks, attack boxes, whirlwind behavior, and combat timing.

    player-survival-upgrades.js
      Player health, damage, dodge, shield, upgrade effects, and breakable interaction.

  enemies/
    spawning.js
      Enemy creation, spawn timing, progression, and wave behavior.

    bosses.js
      Boss-specific logic for major encounters.

  maps/
    zones-and-interactions.js
      Zone transitions, map interaction rules, blockers, secrets, and portals.

  systems/
    upgrades.js
      Upgrade pool, reward rolling, and upgrade menu data.

    menu-storage-touch.js
      Scoreboard storage, player name storage, menu helpers, and touch UI support.

    run-flow.js
      Start, reset, retry, checkpoint, and run progression logic.

    items.js
      Chests, hearts, potions, keys, drops, and pickup behavior.

    dialog-interactions.js
      Dialog pages, NPC interaction, object prompts, and story events.

  render/
    zone-renderers.js
      Zone backgrounds, dungeon drawing, decor, and environment rendering.

    render-play-dispatch.js
      Gameplay render dispatcher and HUD drawing.

    render-menus.js
      Title screen, scoreboard, intro, pause, game over, and dialog rendering.

  ui/
    dom-layout.js
      Browser UI panels, display zoom, layout controls, and responsive shell behavior.

  dev/
    dev-tools.js
      Development tools, debug helpers, cheats, and testing utilities.

  main/
    update.js
      Main gameplay update logic.

    loop.js
      requestAnimationFrame loop and update/render dispatch.

desktop/
  electron-titlebar.js
    Electron-only custom titlebar behavior.

  desktop-shell-links.js
    Electron-only desktop shell integration.