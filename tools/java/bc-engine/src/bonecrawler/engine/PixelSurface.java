package bonecrawler.engine;

import javax.swing.JPanel;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Toolkit;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;

final class PixelSurface extends JPanel {
  private final EngineRuntime runtime;

  PixelSurface(EngineRuntime runtime) {
    this.runtime = runtime;
    setPreferredSize(new Dimension(EngineRuntime.GAME_WIDTH * EngineRuntime.SCALE, EngineRuntime.GAME_HEIGHT * EngineRuntime.SCALE));
    setBackground(new Color(9, 7, 4));
    setDoubleBuffered(true);
    setFocusable(true);
    addKeyListener(new EngineInput(runtime));
    addMouseListener(new MouseAdapter() {
      @Override
      public void mousePressed(MouseEvent event) {
        requestFocusInWindow();
      }
    });
  }

  void renderFrame() {
    repaint();
    Toolkit.getDefaultToolkit().sync();
  }

  @Override
  public void addNotify() {
    super.addNotify();
    requestFocusInWindow();
  }

  @Override
  protected void paintComponent(Graphics graphics) {
    super.paintComponent(graphics);
    Graphics2D g = (Graphics2D) graphics.create();
    try {
      PixelRenderer renderer = new PixelRenderer(g);
      renderer.clear();
      drawScene(renderer);
    } finally {
      g.dispose();
    }
  }

  private void drawScene(PixelRenderer renderer) {
    drawPlayField(renderer);
    drawZoneObstacles(renderer);
    drawEnemies(renderer);
    switch (runtime.state()) {
      case TITLE -> drawTitle(renderer);
      case PLAYING -> {
        drawPlayer(renderer);
        drawPlayingHud(renderer);
      }
      case PAUSED -> {
        drawPlayer(renderer);
        drawPlayingHud(renderer);
        drawPaused(renderer);
      }
      case GAMEOVER -> {
        drawPlayer(renderer);
        drawPlayingHud(renderer);
        drawGameOver(renderer);
      }
      default -> renderer.text(runtime.state().name(), 60, 56, 8, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
    }
  }

  private void drawPlayField(PixelRenderer renderer) {
    renderer.fillRect(4, 17, 112, 99, new Color(14, 12, 9));
    renderer.drawFrame(4, 17, 112, 99, PixelRenderer.BONE_MID, new Color(16, 14, 11));
    renderer.fillRect(0, 0, 120, 15, new Color(22, 27, 23));
    renderer.text(runtime.zoneName(), 6, 4, 4, PixelRenderer.BONE);
    renderer.text("WAVE " + runtime.wave(), 34, 4, 4, PixelRenderer.BONE);
    renderer.text("SCORE " + runtime.score(), 78, 4, 4, PixelRenderer.BONE);
    renderer.text("KILLS " + runtime.kills(), 78, 9, 4, PixelRenderer.BONE);
    renderer.text("HP " + runtime.player().hp + "/" + runtime.player().maxHp, 34, 9, 4, PixelRenderer.BONE);
    renderer.text(runtime.manifest().runtime().target(), 60, 22, 4, PixelRenderer.GREEN, PixelRenderer.Alignment.CENTER);
    renderer.fillRect(8, 28, 104, 84, new Color(17, 14, 11));
    renderer.drawFrame(8, 28, 104, 84, new Color(68, 58, 41), new Color(17, 14, 11));
  }

  private void drawTitle(PixelRenderer renderer) {
    renderer.drawFrame(16, 24, 88, 60, PixelRenderer.BONE_MID, new Color(6, 6, 7, 230));
    renderer.text(runtime.manifest().game().title().toUpperCase(), 60, 34, 8, PixelRenderer.ORANGE, PixelRenderer.Alignment.CENTER);
    renderer.text("JAVA ENGINE " + runtime.manifest().game().version(), 60, 46, 4, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
    renderer.text("ZONES " + runtime.manifest().zones().size(), 60, 56, 4, PixelRenderer.GREEN, PixelRenderer.Alignment.CENTER);
    renderer.text("PRESS ENTER TO START", 60, 66, 4, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
    renderer.text("P PAUSE  G GAMEOVER", 60, 74, 4, PixelRenderer.BLUE, PixelRenderer.Alignment.CENTER);
  }

  private void drawPlayingHud(PixelRenderer renderer) {
    renderer.text(runtime.banner(), 60, 108, 4, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
  }

  private void drawPlayer(PixelRenderer renderer) {
    renderer.player(runtime.player());
    if (runtime.player().isAttacking()) {
      renderer.outline(runtime.attackPreviewBox(), PixelRenderer.ORANGE);
    }
    if (runtime.player().isBlocking()) {
      renderer.outline(new RectL(runtime.player().x - 1, runtime.player().y - 1, runtime.player().w + 2, runtime.player().h + 2), PixelRenderer.BLUE);
    }
  }

  private void drawEnemies(PixelRenderer renderer) {
    for (EnemyActor enemy : runtime.enemies()) {
      if (enemy.dead) continue;
      renderer.enemy(enemy);
      if (enemy.attackWindup > 0 || enemy.attackActive > 0) {
        renderer.outline(runtime.enemyAttackPreviewBox(enemy), PixelRenderer.PURPLE);
      }
    }
  }

  private void drawZoneObstacles(PixelRenderer renderer) {
    if (runtime.zoneLayout() == null) return;
    for (RectL obstacle : runtime.zoneLayout().obstacles()) {
      renderer.obstacle(obstacle);
    }
  }

  private void drawPaused(PixelRenderer renderer) {
    renderer.fillRect(0, 0, 120, 120, new Color(8, 6, 3, 160));
    renderer.drawFrame(12, 12, 96, 97, PixelRenderer.BONE_MID, new Color(4, 4, 5, 230));
    renderer.text("PAUSED", 60, 24, 10, PixelRenderer.ORANGE, PixelRenderer.Alignment.CENTER);
    renderer.fillRect(18, 43, 84, 1, PixelRenderer.BONE_MID);
    renderer.fillRect(18, 66, 84, 1, PixelRenderer.BONE_MID);
    renderer.fillRect(18, 93, 84, 1, PixelRenderer.BONE_MID);
    renderer.text("MOVES", 60, 48, 5, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
    drawChipGrid(renderer, runtime.moves(), 21, 54, 36, 11, 2);
    renderer.text("UPGRADES", 60, 70, 5, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
    drawChipGrid(renderer, runtime.upgrades(), 21, 76, 24, 9, 3);
    renderer.drawFrame(26, 98, 26, 8, PixelRenderer.BONE_MID, new Color(6, 6, 7, 230));
    renderer.drawFrame(68, 98, 26, 8, PixelRenderer.BONE_MID, new Color(6, 6, 7, 230));
    renderer.text("RETRY", 39, 100, 4, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
    renderer.text("MENU", 81, 100, 4, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
  }

  private void drawGameOver(PixelRenderer renderer) {
    renderer.fillRect(0, 0, 120, 120, new Color(8, 6, 3, 180));
    renderer.drawFrame(21, 27, 78, 75, PixelRenderer.BONE_MID, new Color(3, 3, 4, 240));
    renderer.text("GAME OVER", 60, 38, 8, PixelRenderer.ORANGE, PixelRenderer.Alignment.CENTER);
    renderer.text("R TO RETRY", 60, 58, 4, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
    renderer.text("M TO MENU", 60, 66, 4, PixelRenderer.BONE, PixelRenderer.Alignment.CENTER);
    renderer.text("ZONE " + runtime.zoneNumber() + "  FRAME " + runtime.frame(), 60, 82, 4, PixelRenderer.BLUE, PixelRenderer.Alignment.CENTER);
  }

  private void drawChipGrid(PixelRenderer renderer, EngineRuntime.HudChip[] chips, int startX, int startY, int colWidth, int rowGap, int columns) {
    for (int index = 0; index < chips.length; index++) {
      int column = index % columns;
      int row = index / columns;
      int x = startX + (column * colWidth);
      int y = startY + (row * rowGap);
      EngineRuntime.HudChip chip = chips[index];
      renderer.chip(chip.label(), chip.value(), x, y, colWidth - 3, chip.accent());
    }
  }
}
