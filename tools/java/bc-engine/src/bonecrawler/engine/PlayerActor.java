package bonecrawler.engine;

final class PlayerActor {
  enum Facing {
    UP,
    DOWN,
    LEFT,
    RIGHT
  }

  double x;
  double y;
  final int w = 8;
  final int h = 8;
  double speed;
  double walkFrame;
  Facing facing = Facing.DOWN;
  int hp;
  int maxHp;
  int swordReach;
  int speedLevel;
  int attackTimer;
  int attackCooldown;
  int blockTimer;
  int blockWindowTimer;
  int hurtTimer;
  boolean dead;

  private final double baseSpeed;
  private final double maxSpeed;
  private final int baseHp;
  private final int capHp;
  private final int baseSwordReach;

  PlayerActor(GameManifest.PlayerStats stats) {
    this.baseSpeed = stats.baseSpeed();
    this.maxSpeed = stats.maxSpeed();
    this.baseHp = stats.baseHp();
    this.capHp = stats.maxHp();
    this.baseSwordReach = stats.baseSwordReach();
    resetForNewRun();
  }

  void resetForNewRun() {
    x = (EngineRuntime.GAME_WIDTH / 2.0) - 4.0;
    y = EngineRuntime.GAME_HEIGHT / 2.0;
    speed = baseSpeed;
    walkFrame = 0.0;
    facing = Facing.DOWN;
    hp = baseHp;
    maxHp = capHp;
    swordReach = baseSwordReach;
    speedLevel = 0;
    attackTimer = 0;
    attackCooldown = 0;
    blockTimer = 0;
    blockWindowTimer = 0;
    hurtTimer = 0;
    dead = false;
  }

  void advanceWalkFrame(double distance) {
    walkFrame += Math.max(0.0, distance * 2.2);
  }

  boolean isWalking() {
    return walkFrame > 0.01;
  }

  boolean isAttacking() {
    return attackTimer > 0;
  }

  boolean isBlocking() {
    return blockTimer > 0;
  }

  double maxSpeed() {
    return maxSpeed;
  }
}
