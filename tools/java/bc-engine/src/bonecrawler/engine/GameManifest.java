package bonecrawler.engine;

import java.nio.file.Path;
import java.util.List;

record GameManifest(
  Path sourcePath,
  GameInfo game,
  RuntimeInfo runtime,
  List<ZoneInfo> zones,
  PlayerInfo player,
  List<UpgradeInfo> upgrades
) {
  String zoneNameAt(int zoneIndex) {
    if (zones.isEmpty()) return "No Zone";
    int safeIndex = Math.max(0, Math.min(zoneIndex, zones.size() - 1));
    return zones.get(safeIndex).name();
  }

  record GameInfo(
    String id,
    String title,
    String version,
    String description
  ) {
  }

  record RuntimeInfo(
    String target,
    String minimumEngineVersion,
    String entry,
    String mode
  ) {
  }

  record ZoneInfo(
    String id,
    String name,
    String kind,
    String runtimeRef
  ) {
  }

  record PlayerInfo(
    String entityId,
    PlayerStats stats,
    List<MoveInfo> moves
  ) {
  }

  record PlayerStats(
    double baseSpeed,
    double maxSpeed,
    int baseSwordReach,
    int baseHp,
    int maxHp
  ) {
  }

  record MoveInfo(
    String id,
    String label,
    List<String> input,
    String runtimeHandler
  ) {
  }

  record UpgradeInfo(
    String id,
    String label,
    String stacking,
    String requiresMove,
    String requiresUpgrade,
    Double cooldownSeconds,
    Double minimumCooldownSeconds,
    String runtimeHandler
  ) {
  }
}
