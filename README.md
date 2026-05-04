<h1 align="center">BoneCrawler</h1>
<p align="center">
  <img width="400" alt="BoneCrawler title screen" src="https://github.com/user-attachments/assets/9af41399-d7f9-46f5-8e0c-95b9b5b8e468">
</p>

<p align="center">
  <strong>NES-Style Dark Fantasy Arcade-Action</strong>
</p>

<p align="center">
  <a href="https://bonecrawler.com">Homepage</a> ·
  <a href="https://immagundam.github.io/BoneCrawler">GitHub Pages</a>
</p>

## About Game
BoneCrawler is a browser-based Dark Fantasy Arcade Action game built with JavaScript, HTML5 Canvas, and a custom lightweight game-engine structure. 

- Dodge waves of skeletons that hone in and attack you.
- Clear zones to earn points! Each Zone will Rank you!
- Chests drop Upgrades! Plan your upgrades carefully so you don't get overwhelmed!
- There are 3 zones, 2 secret rooms, 3 bosses and a tiny fantasy dungeon to explore and discover secrets.

Gameplay is made for short runs (20-30 minutes). Die a few times in a few minutes and try again later, or keep dying for a few hours in a "one more try" loop.<br>

### Story
```txt
You've been sleeping for a long time..
Welcome, initiate. We have a task for you.
The king requests our services again. Complete this job and you'll earn your stay.
```
### Screenshots    
<details>
    <summary>Click to expand</summary>
    <img width="900" height="auto" alt="bonecrawler" src="https://github.com/user-attachments/assets/c08fc144-9509-4c30-85da-b449aa44e9eb" />
<br>
 Game in Editor:<br><br>
    <img width="380" height="auto" alt="dragone" src="https://github.com/user-attachments/assets/73f42363-62c0-4f97-858f-d06e162c0046" />

    
</details>

## About Project
BoneCrawler is my first public game release after finishing school and earning my degree. I have spent most of my life around computers, gaming, and software. After more than 20 years as a gamer, I wanted to build something that represented the games that I loved as a kid, and inspired me as a gamer and a creator to show the kind of work I want to do every day: designing games.

This project was built as a personal step toward working as a game developer, whether by helping me find employment or by becoming my first public project as an independent developer. My goal was to create a scoped, playable game release that could demonstrate my ability to plan, build, test, refine, and document a complete game project. 

BoneCrawler was built with vanilla JavaScript, incrementally developing engine-style systems for the game loop, player input, rendering, collision, state management, enemies, zones, events, and game progression.

The project scope was defined around one of my favorite games: the original NES Legend of Zelda. That influence helped shape the visual style, screen structure, combat design, movement, enemy behavior, zone progression, and technical boundaries of the project.

Those boundaries were intentional. They reduced scope creep, kept the game focused, and made the project manageable within an agile-style development lifecycle for a solo developer.

To simplify early testing and sharing, I developed the game in a single HTML file. This kept development for sharing and testing quick & painless until I moved past zone 1.. and I needed to create my game editor. At this point I refactored the code into a formal file-tree structure. Its structure separates gameplay into engine-style systems such as player control, enemies, maps, collision, rendering, items, dialog, scoring, and game state management.
With my background in software engineering concepts, computer science, and game-engine structure, I set out to build and release a complete game that could serve both as a playable project and as a demonstration of what I can create.. and it led to my first public game release as a game developer!

## Technical Highlights

- Built a custom Javascript rendering pipeline for pixel-art/NES-style gameplay and aesthetic.
- Designed a state-driven game loop for title, intro, gameplay, pause, dialog, upgrades, zone transitions, scoreboard, and game-over flow.
- Implemented player movement, sword combat, dodge mechanics, upgrade progression, health, potion use, and special abilities.
- Created enemy systems for skeletons, wizards, projectiles, bosses, and wave-based spawning.
- Built modular zone logic for map blockers, decor, breakables, secrets, doors, portals, and transitions.
- Added local scoreboard persistence using browser storage.
- Added keyboard, mouse, and mobile touch-control support.
- Separate Electron distribution code from the browser game runtime (for distribution/publishing).

### Documentation
- README.md<br>
- docs/<br>
    - GAMEPLAY_REQUIREMENTS.md<br>
    - GAME_FLOW.md<br>
    - ENGINE_STRUCTURE.md<br>
    - DEVELOPMENT_NOTES.md<br>
    - HOW_TO_PLAY.md<br>

## Game Design and Engine Structure

The first thought for the game was to be a small embedded browser game that I could put in my portfolio.  I wanted it combine aspects from the technical asthetic (NES - ZELDA 1), darker fantasy (like Lord of the Rings & Elden Ring) and arcadey chaotic difficulty, like DMC/NG. 

My project scope: NES action game with a small/lightweight custom game engine. I focused on organizing development in stages, starting with individual gameplay pieces and then turning them into reusable systems for game state, player control, enemies, maps, rendering, collision, items, upgrades, dialogue, and scoring.

The game has a  state-driven game loop that continuously runs through an update and render cycle, but the current game state determines what logic is active. States such as `title`, `playing`, `paused`, `dialog`, `upgrade`, `zoneClear`, and `gameover` control when gameplay runs, when menus are shown, when dialogue pauses the action, and when transitions occur between zones.

During the `playing` state, the engine reads player input, updates movement, handles attacks, checks collisions, updates enemies, spawns items, tracks score, and renders the dungeon. During menu or dialogue states, the active dungeon is paused or limited so the player can interact with UI, story text, upgrades, or retry options without enemies and timers continuing in the background.

<details>
<summary><b>View Game Flowchart</b></summary>

```txt
BONECRAWLER GAME FLOW

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
    |-- Set initial state to title
    |-- Prepare player defaults
    |-- Prepare zone data
    |-- Prepare enemy and item containers
    |
    v
[Main Game Loop]
    |
    |-- update()
    |-- render()
    |-- requestAnimationFrame(loop)
    |
    v
[State Controller]
    |
    +--> title
    |       |-- Show title screen
    |       |-- Play / scoreboard / name options
    |       +-- Start game -> intro
    |
    +--> intro
    |       |-- Show opening setup
    |       +-- Continue -> playing
    |
    +--> playing
    |       |
    |       +-- Input System
    |       |     |-- Movement
    |       |     |-- Attack
    |       |     |-- Dodge / ability
    |       |     |-- Interact / pause
    |       |
    |       +-- Player System
    |       |     |-- Movement
    |       |     |-- Combat
    |       |     |-- Health
    |       |     |-- Upgrades
    |       |
    |       +-- Map / Zone System
    |       |     |-- Blockers
    |       |     |-- Breakables
    |       |     |-- Doors
    |       |     |-- Secrets
    |       |     |-- Transitions
    |       |
    |       +-- Enemy System
    |       |     |-- Spawning
    |       |     |-- Skeletons
    |       |     |-- Wizards
    |       |     |-- Projectiles
    |       |     |-- Bosses
    |       |
    |       +-- Collision / Combat System
    |       |     |-- Player vs walls
    |       |     |-- Sword vs enemies
    |       |     |-- Enemies vs player
    |       |     |-- Projectiles vs player
    |       |
    |       +-- Item / Upgrade System
    |       |     |-- Hearts
    |       |     |-- Potions
    |       |     |-- Keys
    |       |     |-- Chests
    |       |     |-- Upgrade choices
    |       |
    |       +-- Render System
    |             |-- Draw zone
    |             |-- Draw decor
    |             |-- Draw items
    |             |-- Draw enemies
    |             |-- Draw player
    |             |-- Draw HUD
    |
    |       State exits:
    |       |
    |       +-- Pause input -> paused
    |       +-- NPC / object interaction -> dialog
    |       +-- Chest upgrade -> upgrade
    |       +-- Zone completed -> zoneClear
    |       +-- Player health reaches zero -> gameover
    |
    +--> paused
    |       |-- Stop active gameplay updates
    |       +-- Resume -> playing
    |
    +--> dialog
    |       |-- Show dialog text
    |       |-- Limit active gameplay
    |       +-- Dialog finished -> playing
    |
    +--> upgrade
    |       |-- Show upgrade choices
    |       |-- Apply selected upgrade
    |       +-- Upgrade selected -> playing
    |
    +--> zoneClear
    |       |-- Show transition screen
    |       |-- Prepare next zone
    |       +-- Continue -> playing
    |
    +--> gameover
    |       |-- Stop gameplay simulation
    |       |-- Save score if eligible
    |       |-- Show retry / menu options
    |       +-- Retry -> playing
    |       +-- Main menu -> title
    |
    +--> scoreboard
            |-- Load saved local scores
            +-- Back -> title
```
</details>

<details>
<summary><b>View Project Structure</b></summary>

```txt
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

```

</details>

<details>
<summary><b>Game Mechanics</b></summary>
    
``` txt
Gameplay Requirements

This document outlines the current gameplay requirements, secret-zone unlock conditions, boss spawn logic, enemy point values, and scoreboard ranking values used in BoneCrawler.

> **Spoiler Warning:**  
> This document contains secret-zone, boss-spawn, scoring, and progression details.

---

## Secret Zone and Boss Requirements

### Entering Secret Zone 1

Secret Zone 1 is accessed from Zone 1 after several conditions are met.

The player must:

- Be in **Zone 1**
- Have collected the **Secret Zone 1 key**
- Have no active Secret Zone 1 key drop still sitting on the ground
- Clear all active enemies
- Clear all pending enemy spawns
- Break the required Zone 1 bookshelf / secret entrance object
- Stand near the Secret Zone 1 entrance area

In gameplay terms, the player needs to clear the room, obtain the secret key, break the correct bookshelf, and interact with the secret entrance.

---

### Zone 1 Secret Dragon Spawn

The Zone 1 Secret Dragon, also treated as the Bone Dragon mini-boss, spawns when the player reaches the required Zone 1 kill count.

Requirements:

- Player is in **Zone 1**
- Zone 1 kill count reaches **300**
- No dragon boss is already active
- Boss has not already been defeated
- Zone 1 miniboss has not already been defeated

Once these conditions are met, the game prepares and spawns the Zone 1 dragon mini-boss encounter.

---

### Zone 2 Dragon Spawn

The current code does not use a separate “Secret Zone 2 Dragon” encounter. The dragon boss logic applies to Zone 1 and Zone 2.

The regular Zone 2 Dragon spawns when:

- Player is in **Zone 2**
- Zone 2 progress reaches **100 kills**
- No dragon boss is already active
- Boss has not already been defeated

---

### Entering Secret Zone 2

Secret Zone 2 is unlocked from Zone 3 after the corrupted boss has been defeated.

Requirements:

- Player is in **Zone 3**
- The Zone 3 Corrupted boss has been defeated
- Player score is at least **999**
- Player enters the Secret Zone 2 portal area

Secret Zone 2 acts as a late-game secret reward area after the Zone 3 boss encounter.

---

### Zone 3 Corrupted Boss Spawn

The Zone 3 Corrupted boss spawns after the player reaches the required Zone 3 progression point and clears the active room.

Requirements:

- Player is in **Zone 3**
- Zone 3 progress reaches **300 kills**
- All active enemies are cleared
- All pending enemy spawns are cleared
- No corrupted boss is already active
- Corrupted boss has not already been defeated

This makes the Corrupted boss a room-clear progression encounter instead of an instant spawn during an active enemy wave.

---

## Enemy Point Values

BoneCrawler awards score based on enemy type. Standard enemies add their point value when defeated.
-----------------------------------
| Enemy / Encounter Type | Points |
|---|---:                         |
| Normal Skeleton Variant 1 | 1   |
| Normal Skeleton Variant 2 | 1   |
| Classic Skeleton Variant | 1    |
| Giant Skeleton | 5              |
| Wizard Skeleton | 3             |
| Dragon-Fight Normal Add | 1     |
| Dragon-Fight Wizard Add | 3     |
| Shadow Boss Wizard Add | 3      |
-----------------------------------
---

## Boss Point Values

Boss encounters award larger score values.
-------------------------------------
| Boss / Major Encounter | Points   |
|---|---:---------------------------|
| Zone 1 Bone Dragon Miniboss | 200 |
| Zone 2 Skeleton Dragon Boss | 300 |
| Zone 3 Corrupted Crawler | 500    |
-------------------------------------
---

## Scoreboard Ranking Values

BoneCrawler uses letter ranks during zone-clear and victory screens. The rank is based on score at the time of the clear.

Ranks used:

- **A**
- **B**
- **C**
- **D**

---

### Zone 1 Clear Rank

Used when transitioning from Zone 1 to Zone 2.
----------------------------
| Rank | Score Requirement |
|---|---:------------------|
| A | 1200+                |
| B | 1000+                |
| C | 950+                 |
| D | Below 950            |
----------------------------
---

### Zone 2 Clear Rank

Used when transitioning from Zone 2 to Zone 3.

----------------------------
| Rank | Score Requirement |
|---|---:------------------|
| A | 1500+                |
| B | 1300+                |
| C | 1200+                |
| D | Below 1200           |
----------------------------
---

### Final / Victory Rank

Used for Zone 3, Secret Zone 2, and final victory clear screens.

----------------------------
| Rank | Score Requirement |
|---|---:------------------|
| A | 2000+                |
| B | 1800+                |
| C | 1700+                |
| D | Below 1700           |
----------------------------

---

## Saved Scoreboard Behavior

The saved scoreboard tracks run performance locally.

Stored scoreboard data includes:

- Player name
- Total kills
- Game time
- Whether the run was completed
- Timestamp

The scoreboard sorts entries by:

1. Highest kill count
2. Highest game time
3. Most recent timestamp

Completed runs are marked with an asterisk.

Example display format:
 
```
 </details>

## Multi-Platform Releases

| Platform | Release | Build Type | Notes |
|---|---|---|---|
| Web Browser | [v2.6](https://bonecrawler.com) | HTML5 Canvas + JavaScript | Main playable version of BoneCrawler. |
| Windows 10 / 11 | [v2.5.9](https://github.com/ImmaGundam/BoneCrawler/releases/tag/v2.5.9) | Portable EXE, Electron + Node.js | Desktop build packaged from the browser version. |
| Android 4+ | [v2.5.9](https://github.com/ImmaGundam/BoneCrawler/releases/tag/v2.5.9) | Signed APK, WebView + Android Studio | First signed Android APK release. |

<p align="center">
  <img width="288" height="282" alt="BoneCrawler multi-platform preview" src="https://github.com/user-attachments/assets/df94b914-2f80-4002-b364-7fa389678ed1" />
</p>

More to come!

### Original Prototype

| Platform | Release | Build Type | Notes |
|---|---|---|---|
| Web Browser | [v1](https://github.com/ImmaGundam/BoneCrawler/releases/tag/v1) | HTML5 Canvas + JavaScript | First public prototype version of BoneCrawler. This version established the original gameplay concept, visual style, and browser-based foundation for the project. |
| Flipper Zero | [v1-c](https://github.com/ImmaGundam/BoneCrawler/releases/tag/v1-c) | C port, `.fap` app | BoneCrawler v1 ported to C and compiled for Flipper Zero. |

<p align="center">
  <img width="290" alt="BoneCrawler prototype / Flipper Zero preview" src="https://github.com/user-attachments/assets/96af63a7-1133-4398-9bf4-160a4dd19105" />
</p>


<hr>

<div align="center">
  <h4>If you enjoy this project, <a href="https://immagundam.itch.io/bonecrawler">consider supporting</a> future game development.</h4>
  <p>
    Your support helps fund future updates, new games, art, assets, music, and more development time.
  </p>

  <p>
    &nbsp;
    <a href="https://buymeacoffee.com/immagundam" target="_blank">
      <img alt="Buy Me a Coffee" src="https://img.shields.io/badge/Buy_Me_A_Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000">
        <br>       
</a>
  <a href="https://immagundam.itch.io/bonecrawler" target="_blank">
    <img alt="Play on itch.io" src="https://img.shields.io/badge/Play%20on-itch.io-FA5C5C?style=for-the-badge&logo=itch.io&logoColor=white">
  </a>

</p>
  <p><strong>Thank you for helping keep indie development going.</strong></p>
  <img width="auto" height="300" src="https://github.com/user-attachments/assets/aac597fc-9d92-4bf3-9e5a-46500586418c" /><br>
</div>

<b>Warning:</b><br>
<i>Game contains: undead enemies, dark fantasy themes & atmosphere, a scary dragon, depictions of violence and the belief of magic. There's also a pixel guy who might be dead.</i><br>
<i>* This game is made to be difficult. Everything is still a Work In Progress *</i><br>

##### <i>You may NOT redistribute, reupload, mirror, or host this Software, in whole or in part, on any website, platform, or service without explicit written permission from the copyright holder.</i>
