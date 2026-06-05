# BoneCrawler Package

This folder is the first loose content package for the current JavaScript runtime.

The package intentionally references existing runtime files instead of replacing them. That lets the editor and Java pipeline validate/package game variables while the JS game remains editable and playable.

Current package scope:

- Game identity and runtime metadata
- Zone registry entries
- Player move declarations
- Upgrade declarations
- Asset root hints

The Java pipeline starts by validating and packing this shape. Later passes can migrate maps, actors, spawn tables, and upgrade tuning into package data.
