package bonecrawler.engine;

import java.util.ArrayList;
import java.util.List;

final class EngineRuntime {
  static final int GAME_WIDTH = 120;
  static final int GAME_HEIGHT = 120;
  static final int SCALE = 4;
  static final int PLAYFIELD_X = 4;
  static final int PLAYFIELD_Y = 17;
  static final int PLAYFIELD_W = 112;
  static final int PLAYFIELD_H = 99;

  private final GameManifest manifest;
  private final PlayerActor player;
  private final List<EnemyActor> enemies = new ArrayList<>();
  private GameState state = GameState.TITLE;
  private long frame;
  private long runFrame;
  private int zoneIndex;
  private int wave = 1;
  private int score;
  private int kills;
  private String banner;
  private final HudChip[] moves;
  private final HudChip[] upgrades;
  private boolean leftHeld;
  private boolean rightHeld;
  private boolean upHeld;
  private boolean downHeld;
  private ZoneLayout zoneLayout;

  EngineRuntime(GameManifest manifest) {
    this.manifest = manifest;
    this.player = new PlayerActor(manifest.player().stats());
    this.moves = manifest.player().moves().stream()
      .map(move -> new HudChip(normalizeLabel(move.label()), keyHint(move.input()), accentForMove(move.id())))
      .toArray(HudChip[]::new);
    this.upgrades = manifest.upgrades().stream()
      .map(upgrade -> new HudChip(normalizeLabel(upgrade.label()), stackHint(upgrade), accentForUpgrade(upgrade.id())))
      .toArray(HudChip[]::new);
    this.banner = "PACKAGE " + manifest.game().version() + " READY";
  }

  GameManifest manifest() {
    return manifest;
  }

  GameState state() {
    return state;
  }

  PlayerActor player() {
    return player;
  }

  List<EnemyActor> enemies() {
    return enemies;
  }

  ZoneLayout zoneLayout() {
    return zoneLayout;
  }

  RectL attackPreviewBox() {
    return attackBox(player.x, player.y, player.w, player.h, player.facing, player.swordReach, 0);
  }

  RectL enemyAttackPreviewBox(EnemyActor enemy) {
    return attackBox(enemy.x, enemy.y, enemy.w, enemy.h, enemy.facing, 8, 0);
  }

  long frame() {
    return frame;
  }

  long runFrame() {
    return runFrame;
  }

  int zoneNumber() {
    return zoneIndex + 1;
  }

  String zoneName() {
    return manifest.zoneNameAt(zoneIndex);
  }

  int wave() {
    return wave;
  }

  int score() {
    return score;
  }

  int kills() {
    return kills;
  }

  String banner() {
    return banner;
  }

  HudChip[] moves() {
    return moves;
  }

  HudChip[] upgrades() {
    return upgrades;
  }

  void update() {
    frame++;
    if (state != GameState.PLAYING) return;

    updatePlayerTimers();
    updatePlayerMovement();
    updateEnemies();
    runFrame++;
    if (runFrame % 90L == 0L) score += 10;
    if (runFrame % 300L == 0L) wave = Math.min(99, wave + 1);
    if (runFrame % 900L == 0L && zoneIndex < manifest.zones().size() - 1) loadZone(zoneIndex + 1);
  }

  void setMovementKey(int keyCode, boolean pressed) {
    switch (keyCode) {
      case java.awt.event.KeyEvent.VK_LEFT, java.awt.event.KeyEvent.VK_A -> leftHeld = pressed;
      case java.awt.event.KeyEvent.VK_RIGHT, java.awt.event.KeyEvent.VK_D -> rightHeld = pressed;
      case java.awt.event.KeyEvent.VK_UP, java.awt.event.KeyEvent.VK_W -> upHeld = pressed;
      case java.awt.event.KeyEvent.VK_DOWN, java.awt.event.KeyEvent.VK_S -> downHeld = pressed;
      default -> {
      }
    }
  }

  void handleAction(EngineAction action) {
    switch (action) {
      case START_OR_CONFIRM -> {
        if (state == GameState.TITLE || state == GameState.GAMEOVER) startRun();
        else if (state == GameState.PAUSED) resumeRun();
      }
      case BACK_OR_MENU -> {
        if (state == GameState.PLAYING) pauseRun();
        else if (state == GameState.PAUSED || state == GameState.GAMEOVER) goToTitle();
      }
      case TOGGLE_PAUSE -> {
        if (state == GameState.PLAYING) pauseRun();
        else if (state == GameState.PAUSED) resumeRun();
      }
      case ATTACK -> {
        if (state == GameState.PLAYING) performPlayerAttack();
      }
      case BLOCK -> {
        if (state == GameState.PLAYING) performPlayerBlock();
      }
      case RETRY -> {
        if (state == GameState.PAUSED || state == GameState.GAMEOVER) startRun();
      }
      case MENU -> {
        if (state == GameState.PAUSED || state == GameState.GAMEOVER) goToTitle();
      }
      case DEBUG_GAMEOVER -> {
        if (state == GameState.PLAYING || state == GameState.PAUSED) {
          state = GameState.GAMEOVER;
          banner = "R TO RETRY  M TO MENU";
        }
      }
      case DEBUG_ADVANCE -> {
        if (state == GameState.PLAYING) {
          score += 50;
          kills += 3;
          wave = Math.min(99, wave + 1);
          if (zoneIndex < manifest.zones().size() - 1) loadZone(zoneIndex + 1);
          banner = "DEBUG ADVANCE";
        }
      }
    }
  }

  private void startRun() {
    state = GameState.PLAYING;
    runFrame = 0L;
    wave = 1;
    score = 0;
    kills = 0;
    player.resetForNewRun();
    clearHeldMovement();
    loadZone(0);
    banner = "ESC OR P TO PAUSE";
  }

  private void pauseRun() {
    state = GameState.PAUSED;
    clearHeldMovement();
    banner = "PAUSED";
  }

  private void resumeRun() {
    state = GameState.PLAYING;
    clearHeldMovement();
    banner = "ESC OR P TO PAUSE";
  }

  private void goToTitle() {
    state = GameState.TITLE;
    clearHeldMovement();
    enemies.clear();
    banner = "PACKAGE " + manifest.game().version() + " READY";
  }

  private void loadZone(int nextZoneIndex) {
    zoneIndex = Math.max(0, Math.min(nextZoneIndex, manifest.zones().size() - 1));
    zoneLayout = ZoneLibrary.forZone(manifest.zones().get(zoneIndex));
    enemies.clear();
    for (ZoneLayout.EnemySpawn spawn : zoneLayout.enemySpawns()) {
      enemies.add(new EnemyActor(spawn.x(), spawn.y(), spawn.speed()));
    }
    player.x = zoneLayout.spawnX();
    player.y = zoneLayout.spawnY();
    banner = zoneLayout.zoneName().toUpperCase();
  }

  private void updatePlayerTimers() {
    if (player.attackTimer > 0) player.attackTimer--;
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (player.blockTimer > 0) player.blockTimer--;
    if (player.blockWindowTimer > 0) player.blockWindowTimer--;
    if (player.hurtTimer > 0) player.hurtTimer--;
  }

  private void updatePlayerMovement() {
    if (player.dead) return;
    double dx = 0.0;
    double dy = 0.0;
    double moveSpeed = player.speed;

    if (leftHeld) {
      dx -= moveSpeed;
      player.facing = PlayerActor.Facing.LEFT;
    }
    if (rightHeld) {
      dx += moveSpeed;
      player.facing = PlayerActor.Facing.RIGHT;
    }
    if (upHeld) {
      dy -= moveSpeed;
      player.facing = PlayerActor.Facing.UP;
    }
    if (downHeld) {
      dy += moveSpeed;
      player.facing = PlayerActor.Facing.DOWN;
    }

    if (dx != 0.0 && dy != 0.0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    double nextX = moveWithCollisions(player.x, player.y, dx, 0.0, player.w, player.h).x();
    double nextY = moveWithCollisions(nextX, player.y, 0.0, dy, player.w, player.h).y();
    player.x = nextX;
    player.y = nextY;

    if (dx != 0.0 || dy != 0.0) {
      player.advanceWalkFrame(Math.hypot(dx, dy));
    }
  }

  private void updateEnemies() {
    if (player.dead) return;
    for (EnemyActor enemy : enemies) {
      if (enemy.dead) continue;

      if (enemy.hurtTimer > 0) enemy.hurtTimer--;
      if (enemy.attackCooldown > 0) enemy.attackCooldown--;

      if (enemy.attackWindup > 0) {
        enemy.attackWindup--;
        if (enemy.attackWindup == 0) {
          enemy.attackActive = 8;
          enemy.attackResolved = false;
        }
        continue;
      }

      if (enemy.attackActive > 0) {
        if (!enemy.attackResolved && enemy.attackActive <= 5) {
          resolveEnemyAttack(enemy);
          enemy.attackResolved = true;
        }
        enemy.attackActive--;
        continue;
      }

      double dx = (player.x + player.w / 2.0) - (enemy.x + enemy.w / 2.0);
      double dy = (player.y + player.h / 2.0) - (enemy.y + enemy.h / 2.0);
      orientToward(enemy, dx, dy);

      double distance = Math.hypot(dx, dy);
      if (distance <= 14.0 && enemy.attackCooldown <= 0) {
        enemy.attackWindup = 16;
        enemy.attackCooldown = 42;
        banner = "ENEMY WINDUP";
        continue;
      }

      if (distance > 12.0 && distance > 0.001) {
        double stepX = (dx / distance) * enemy.speed;
        double stepY = (dy / distance) * enemy.speed;
        RectL movedX = moveWithCollisions(enemy.x, enemy.y, stepX, 0.0, enemy.w, enemy.h);
        RectL movedY = moveWithCollisions(movedX.x(), enemy.y, 0.0, stepY, enemy.w, enemy.h);
        enemy.x = movedY.x();
        enemy.y = movedY.y();
      }
    }
  }

  private void performPlayerAttack() {
    if (player.dead || player.attackCooldown > 0 || player.attackTimer > 0) return;
    player.attackTimer = 14;
    player.attackCooldown = 24;
    RectL attackBox = attackBox(player.x, player.y, player.w, player.h, player.facing, player.swordReach, 0);
    boolean landed = false;
    for (EnemyActor enemy : enemies) {
      if (enemy.dead) continue;
      if (attackBox.overlaps(new RectL(enemy.x, enemy.y, enemy.w, enemy.h))) {
        enemy.hp -= 1;
        enemy.hurtTimer = 10;
        landed = true;
        if (enemy.hp <= 0) {
          enemy.dead = true;
          kills += 1;
          score += 25;
        }
      }
    }
    banner = landed ? "ATTACK HIT" : "ATTACK";
  }

  private void performPlayerBlock() {
    if (player.dead) return;
    player.blockTimer = Math.max(player.blockTimer, 20);
    player.blockWindowTimer = 12;
    banner = "GUARD";
  }

  private void resolveEnemyAttack(EnemyActor enemy) {
    RectL attackBox = attackBox(enemy.x, enemy.y, enemy.w, enemy.h, enemy.facing, 8, 0);
    RectL playerBox = new RectL(player.x, player.y, player.w, player.h);
    if (!attackBox.overlaps(playerBox)) return;

    if (player.blockWindowTimer > 0) {
      player.blockWindowTimer = 0;
      player.blockTimer = 8;
      banner = "PARRY";
      return;
    }

    int damage = 2;
    if (player.blockTimer > 0) {
      damage = 1;
      banner = "BLOCK -" + damage;
    } else {
      banner = "HIT -" + damage;
    }

    player.hp = Math.max(0, player.hp - damage);
    player.hurtTimer = damage > 1 ? 24 : 12;
    if (player.hp <= 0) {
      player.dead = true;
      state = GameState.GAMEOVER;
      banner = "PLAYER FALLEN";
    }
  }

  private RectL moveWithCollisions(double x, double y, double dx, double dy, int w, int h) {
    double nextX = clamp(x + dx, PLAYFIELD_X, PLAYFIELD_X + PLAYFIELD_W - w);
    double nextY = clamp(y + dy, PLAYFIELD_Y, PLAYFIELD_Y + PLAYFIELD_H - h);
    RectL next = new RectL(nextX, nextY, w, h);
    if (collidesObstacle(next)) {
      return new RectL(x, y, w, h);
    }
    return next;
  }

  private boolean collidesObstacle(RectL bounds) {
    if (zoneLayout == null) return false;
    for (RectL obstacle : zoneLayout.obstacles()) {
      if (bounds.overlaps(obstacle)) return true;
    }
    return false;
  }

  private static RectL attackBox(double x, double y, int w, int h, PlayerActor.Facing facing, int reach, int extra) {
    int half = extra / 2;
    return switch (facing) {
      case RIGHT -> new RectL(x + w, y + 1 - half, reach, (h - 2) + extra);
      case LEFT -> new RectL(x - reach, y + 1 - half, reach, (h - 2) + extra);
      case UP -> new RectL(x + 1 - half, y - reach, (w - 2) + extra, reach);
      case DOWN -> new RectL(x + 1 - half, y + h, (w - 2) + extra, reach);
    };
  }

  private static void orientToward(EnemyActor enemy, double dx, double dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      enemy.facing = dx < 0 ? PlayerActor.Facing.LEFT : PlayerActor.Facing.RIGHT;
    } else {
      enemy.facing = dy < 0 ? PlayerActor.Facing.UP : PlayerActor.Facing.DOWN;
    }
  }

  private void clearHeldMovement() {
    leftHeld = false;
    rightHeld = false;
    upHeld = false;
    downHeld = false;
  }

  private static double clamp(double value, double min, double max) {
    return Math.max(min, Math.min(max, value));
  }

  private static String normalizeLabel(String value) {
    return value.replace("Magic ", "").replace(" Step", "").toUpperCase();
  }

  private static String keyHint(java.util.List<String> inputs) {
    if (inputs.contains("Space")) return "SPACE";
    if (inputs.contains("KeyB")) return "B";
    if (inputs.contains("ShiftLeft")) return "SHIFT";
    if (inputs.contains("Enter")) return "ENTER";
    return "KEY";
  }

  private static String stackHint(GameManifest.UpgradeInfo upgrade) {
    if ("cooldown-reduction".equals(upgrade.stacking()) && upgrade.cooldownSeconds() != null) {
      return upgrade.cooldownSeconds().intValue() + "S";
    }
    if ("unlock".equals(upgrade.stacking())) return "UNLOCK";
    if ("reward-roll".equals(upgrade.stacking())) return "BONUS";
    if ("bounded".equals(upgrade.stacking())) return "CAP";
    return "STACK";
  }

  private static java.awt.Color accentForMove(String moveId) {
    return switch (moveId) {
      case "attack" -> PixelRenderer.SILVER;
      case "block" -> PixelRenderer.BLUE;
      case "dodge" -> PixelRenderer.ORANGE;
      case "interact" -> PixelRenderer.GREEN;
      default -> PixelRenderer.BONE;
    };
  }

  private static java.awt.Color accentForUpgrade(String upgradeId) {
    return switch (upgradeId) {
      case "heart" -> PixelRenderer.ORANGE;
      case "shield", "mirror" -> PixelRenderer.BLUE;
      case "shadowstep", "reflect" -> PixelRenderer.PURPLE;
      case "points" -> PixelRenderer.GREEN;
      default -> PixelRenderer.BONE;
    };
  }

  record HudChip(String label, String value, java.awt.Color accent) {
  }
}
