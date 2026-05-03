# BoneCrawler for Flipper Zero

This is the Flipper Zero C port of **BoneCrawler**, a small retro dungeon
survival game.

The original BoneCrawler v1 was built as a browser game. This version rebuilds
the game as a native Flipper Zero `.fap` app using C.

## Features

- Native Flipper Zero app
- D-pad movement
- OK button attack
- Title menu
- About page
- 1-bit monochrome visuals
- Compact arena adapted for the 128×64 Flipper display

## Controls

```text
D-pad = Move / menu navigation
OK    = Start / select / attack
Back  = Exit or return
```

## Build

Install uFBT:

```bash
py -m pip install --upgrade ufbt
```

Build:

```bash
ufbt
```

Build and launch to a connected Flipper Zero:

```bash
ufbt launch
```

## Files

```text
application.fam  Flipper app manifest
bonecrawler.c    Main game source
bonecrawler.png  App icon
README.md        Documentation
screenshots/     qFlipper screenshots
```

## Links

```text
Website: https://bonecrawler.com
GitHub:  https://github.com/ImmaGundam/BoneCrawler
```

## Credits

Created by **ImmaGundam**.
