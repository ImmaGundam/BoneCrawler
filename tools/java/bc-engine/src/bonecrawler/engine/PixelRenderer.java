package bonecrawler.engine;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;

final class PixelRenderer {
  static final Color BG = new Color(9, 7, 4);
  static final Color BONE = new Color(212, 200, 154);
  static final Color BONE_MID = new Color(168, 152, 112);
  static final Color ORANGE = new Color(255, 140, 52);
  static final Color SILVER = new Color(188, 204, 214);
  static final Color PURPLE = new Color(208, 128, 255);
  static final Color BLUE = new Color(136, 200, 255);
  static final Color DARK = new Color(12, 10, 6);
  static final Color GREEN = new Color(90, 165, 123);

  private final Graphics2D g;

  PixelRenderer(Graphics2D graphics) {
    this.g = graphics;
    this.g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_OFF);
    this.g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_OFF);
  }

  void clear() {
    g.setColor(BG);
    g.fillRect(0, 0, EngineRuntime.GAME_WIDTH * EngineRuntime.SCALE, EngineRuntime.GAME_HEIGHT * EngineRuntime.SCALE);
  }

  void fillRect(int lx, int ly, int lw, int lh, Color color) {
    g.setColor(color);
    g.fillRect(px(lx), px(ly), px(lw), px(lh));
  }

  void drawFrame(int lx, int ly, int lw, int lh, Color edge, Color fill) {
    fillRect(lx, ly, lw, lh, fill);
    g.setColor(edge);
    g.setStroke(new BasicStroke(EngineRuntime.SCALE));
    g.drawRect(px(lx), px(ly), px(lw) - EngineRuntime.SCALE, px(lh) - EngineRuntime.SCALE);
    fillRect(lx + 1, ly + 1, lw - 2, 1, new Color(255, 255, 255, 20));
  }

  void text(String value, int lx, int ly, int size, Color color) {
    text(value, lx, ly, size, color, Alignment.LEFT);
  }

  void text(String value, int lx, int ly, int size, Color color, Alignment alignment) {
    Font font = new Font(Font.MONOSPACED, Font.BOLD, Math.max(8, size * EngineRuntime.SCALE));
    g.setFont(font);
    int x = px(lx);
    int y = px(ly);
    int width = g.getFontMetrics().stringWidth(value);
    if (alignment == Alignment.CENTER) x -= width / 2;
    else if (alignment == Alignment.RIGHT) x -= width;

    g.setColor(DARK);
    g.drawString(value, x + 1, y + 1);
    g.setColor(color);
    g.drawString(value, x, y);
  }

  void chip(String label, String value, int lx, int ly, int lw, Color accent) {
    drawFrame(lx, ly, lw, 8, BONE_MID, new Color(7, 7, 8, 230));
    fillRect(lx + 2, ly + 2, 4, 4, accent);
    text(label, lx + 8, ly + 1, 4, BONE);
    text(value, lx + lw - 2, ly + 1, 4, accent, Alignment.RIGHT);
  }

  void player(PlayerActor player) {
    int lx = (int) Math.round(player.x);
    int ly = (int) Math.round(player.y);
    int stride = player.isWalking() && ((int) Math.floor(player.walkFrame) % 2 == 0) ? 1 : 0;

    fillRect(lx + 1, ly + 7, 6, 1, new Color(0, 0, 0, 120));
    fillRect(lx + 2, ly, 4, 2, player.hurtTimer > 0 ? ORANGE : BONE);
    fillRect(lx + 1, ly + 2, 6, 3, player.hurtTimer > 0 ? ORANGE : SILVER);
    fillRect(lx + 2, ly + 5, 4, 2, new Color(110, 74, 52));
    fillRect(lx + 2, ly + 7, 1, 1, DARK);
    fillRect(lx + 5, ly + 7, 1, 1, DARK);

    switch (player.facing) {
      case LEFT -> {
        fillRect(lx, ly + 2, 1, 3, BONE);
        fillRect(lx + 1, ly + 5 + stride, 1, 2, ORANGE);
      }
      case RIGHT -> {
        fillRect(lx + 7, ly + 2, 1, 3, BONE);
        fillRect(lx + 6, ly + 5 + stride, 1, 2, ORANGE);
      }
      case UP -> {
        fillRect(lx + 3, ly - 1, 2, 1, ORANGE);
        fillRect(lx + 2, ly + 5 + stride, 1, 2, DARK);
        fillRect(lx + 5, ly + 6 - stride, 1, 2, DARK);
      }
      case DOWN -> {
        fillRect(lx + 3, ly + 2, 2, 1, DARK);
        fillRect(lx + 2, ly + 6 - stride, 1, 2, ORANGE);
        fillRect(lx + 5, ly + 5 + stride, 1, 2, ORANGE);
      }
    }
  }

  void enemy(EnemyActor enemy) {
    int lx = (int) Math.round(enemy.x);
    int ly = (int) Math.round(enemy.y);
    Color body = enemy.hurtTimer > 0 ? ORANGE : new Color(198, 208, 218);
    Color accent = enemy.attackWindup > 0 || enemy.attackActive > 0 ? ORANGE : PURPLE;
    fillRect(lx + 1, ly + 1, 6, 6, body);
    fillRect(lx + 2, ly, 4, 1, accent);
    fillRect(lx + 2, ly + 2, 1, 1, DARK);
    fillRect(lx + 5, ly + 2, 1, 1, DARK);
    fillRect(lx + 3, ly + 4, 2, 1, DARK);
  }

  void obstacle(RectL obstacle) {
    int lx = (int) Math.round(obstacle.x());
    int ly = (int) Math.round(obstacle.y());
    int lw = (int) Math.round(obstacle.w());
    int lh = (int) Math.round(obstacle.h());
    drawFrame(lx, ly, lw, lh, new Color(92, 78, 60), new Color(36, 30, 24));
    fillRect(lx + 1, ly + 1, Math.max(1, lw - 2), 1, new Color(124, 110, 88));
  }

  void outline(RectL rect, Color color) {
    int lx = (int) Math.round(rect.x());
    int ly = (int) Math.round(rect.y());
    int lw = (int) Math.round(rect.w());
    int lh = (int) Math.round(rect.h());
    g.setColor(color);
    g.setStroke(new BasicStroke(Math.max(1, EngineRuntime.SCALE / 2f)));
    g.drawRect(px(lx), px(ly), px(lw) - 1, px(lh) - 1);
  }

  private static int px(int logical) {
    return logical * EngineRuntime.SCALE;
  }

  enum Alignment {
    LEFT,
    CENTER,
    RIGHT
  }
}
