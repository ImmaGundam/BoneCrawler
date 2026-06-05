package bonecrawler.engine;

record RectL(double x, double y, double w, double h) {
  boolean overlaps(RectL other) {
    return x < other.x + other.w &&
      x + w > other.x &&
      y < other.y + other.h &&
      y + h > other.y;
  }
}
