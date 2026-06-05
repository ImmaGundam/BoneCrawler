# BoneCrawler Java Pipeline

Small dependency-free Java CLI for validating and packing game packages.

## Compile

```powershell
javac -d tools/java/bc-pipeline/build/classes tools/java/bc-pipeline/src/BcPipeline.java
```

## Validate

```powershell
java -cp tools/java/bc-pipeline/build/classes BcPipeline validate packages/bonecrawler
```

## Inspect

```powershell
java -cp tools/java/bc-pipeline/build/classes BcPipeline inspect packages/bonecrawler
```

## Pack

```powershell
java -cp tools/java/bc-pipeline/build/classes BcPipeline pack packages/bonecrawler dist/packages
```

The tool accepts either a package directory or a direct path to `game.manifest.json`.

## Roadmap

See `docs/engine-roadmap.md` for the broader engine/editor/runtime scope that this Java pipeline is beginning to support.
