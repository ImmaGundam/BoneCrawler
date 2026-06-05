package bonecrawler.engine;

import java.util.List;

final class ZoneLibrary {
  private ZoneLibrary() {
  }

  static ZoneLayout forZone(GameManifest.ZoneInfo zone) {
    return switch (zone.id()) {
      case "zone1" -> new ZoneLayout(
        zone.id(),
        zone.name(),
        56,
        94,
        List.of(
          new RectL(51, 42, 18, 10),
          new RectL(18, 70, 12, 16),
          new RectL(90, 66, 12, 18)
        ),
        List.of(
          new ZoneLayout.EnemySpawn(18, 28, 0.16),
          new ZoneLayout.EnemySpawn(92, 30, 0.14)
        )
      );
      case "zone2" -> new ZoneLayout(
        zone.id(),
        zone.name(),
        56,
        92,
        List.of(
          new RectL(46, 34, 28, 18),
          new RectL(22, 62, 10, 22),
          new RectL(88, 62, 10, 22)
        ),
        List.of(
          new ZoneLayout.EnemySpawn(18, 26, 0.17),
          new ZoneLayout.EnemySpawn(94, 26, 0.17),
          new ZoneLayout.EnemySpawn(56, 70, 0.12)
        )
      );
      case "zone3" -> new ZoneLayout(
        zone.id(),
        zone.name(),
        56,
        92,
        List.of(
          new RectL(53, 28, 14, 24),
          new RectL(26, 58, 12, 14),
          new RectL(82, 58, 12, 14),
          new RectL(52, 82, 16, 8)
        ),
        List.of(
          new ZoneLayout.EnemySpawn(18, 24, 0.18),
          new ZoneLayout.EnemySpawn(94, 24, 0.18),
          new ZoneLayout.EnemySpawn(56, 58, 0.14)
        )
      );
      case "secret-zone1" -> new ZoneLayout(
        zone.id(),
        zone.name(),
        56,
        92,
        List.of(
          new RectL(18, 46, 14, 10),
          new RectL(88, 46, 14, 10)
        ),
        List.of(
          new ZoneLayout.EnemySpawn(56, 28, 0.16)
        )
      );
      case "secret-zone2" -> new ZoneLayout(
        zone.id(),
        zone.name(),
        56,
        92,
        List.of(
          new RectL(40, 38, 8, 28),
          new RectL(72, 38, 8, 28),
          new RectL(51, 72, 18, 8)
        ),
        List.of(
          new ZoneLayout.EnemySpawn(24, 26, 0.15),
          new ZoneLayout.EnemySpawn(88, 26, 0.15)
        )
      );
      default -> new ZoneLayout(
        zone.id(),
        zone.name(),
        56,
        92,
        List.of(),
        List.of()
      );
    };
  }
}
