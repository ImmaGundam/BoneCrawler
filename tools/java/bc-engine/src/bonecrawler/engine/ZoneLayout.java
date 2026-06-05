package bonecrawler.engine;

import java.util.List;

record ZoneLayout(
  String zoneId,
  String zoneName,
  double spawnX,
  double spawnY,
  List<RectL> obstacles,
  List<EnemySpawn> enemySpawns
) {
  record EnemySpawn(double x, double y, double speed) {
  }
}
