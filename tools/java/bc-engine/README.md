# BoneCrawler Java Engine

Early Java-native engine track for BoneCrawler.

This module is the starting point for moving the playable runtime from browser/canvas JavaScript into a direct Java desktop engine while keeping the package and content contracts intact.

## Compile

```powershell
New-Item -ItemType Directory -Force -Path tools/java/bc-engine/build/classes | Out-Null
javac -d tools/java/bc-engine/build/classes tools/java/bc-engine/src/bonecrawler/engine/*.java
```

## Run

```powershell
java -cp tools/java/bc-engine/build/classes bonecrawler.engine.BoneCrawlerEngineApp
```

## Output

- Native window
- Fixed update/render loop
- Logical pixel renderer shell
- State machine seed
- Manifest-driven package loading
- Player actor, attack, and timed block seed
- Authored zone layouts with obstacle collision
- Keyboard-driven title, play, pause, and game-over shell

See `docs/java-engine-migration.md` for the migration order and the JS reference files this engine should match.
