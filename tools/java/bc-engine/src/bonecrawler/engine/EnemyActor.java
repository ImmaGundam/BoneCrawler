package bonecrawler.engine;

final class EnemyActor {
  double x;
  double y;
  final int w = 8;
  final int h = 8;
  final double speed;
  int hp = 3;
  int hurtTimer;
  int attackCooldown;
  int attackWindup;
  int attackActive;
  boolean attackResolved;
  boolean dead;
  PlayerActor.Facing facing = PlayerActor.Facing.LEFT;

  EnemyActor(double x, double y, double speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }
}
