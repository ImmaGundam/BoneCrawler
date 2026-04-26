# BoneCrawler Gameplay Requirements

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

The Zone 1 Secret Dragon, also treated as the Bone Dragon miniboss, spawns when the player reaches the required Zone 1 kill count.

Requirements:

- Player is in **Zone 1**
- Zone 1 kill count reaches **300**
- No dragon boss is already active
- Boss has not already been defeated
- Zone 1 miniboss has not already been defeated

Once these conditions are met, the game prepares and spawns the Zone 1 dragon miniboss encounter.

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

PLAYER - KILLS - TIME *