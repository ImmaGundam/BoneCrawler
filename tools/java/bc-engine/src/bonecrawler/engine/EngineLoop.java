package bonecrawler.engine;

final class EngineLoop {
  private static final double TARGET_UPS = 60.0;
  private static final long NANOS_PER_UPDATE = (long) (1_000_000_000L / TARGET_UPS);

  private final EngineRuntime runtime;
  private final Runnable renderAction;

  private volatile boolean running;

  EngineLoop(EngineRuntime runtime, Runnable renderAction) {
    this.runtime = runtime;
    this.renderAction = renderAction;
  }

  void start() {
    if (running) return;
    running = true;

    Thread loopThread = new Thread(this::runLoop, "bonecrawler-engine-loop");
    loopThread.setDaemon(false);
    loopThread.start();
  }

  private void runLoop() {
    long previous = System.nanoTime();
    long accumulator = 0L;

    while (running) {
      long now = System.nanoTime();
      long delta = now - previous;
      previous = now;

      if (delta < 0L) delta = 0L;
      if (delta > NANOS_PER_UPDATE * 5L) delta = NANOS_PER_UPDATE * 5L;
      accumulator += delta;

      while (accumulator >= NANOS_PER_UPDATE) {
        runtime.update();
        accumulator -= NANOS_PER_UPDATE;
      }

      renderAction.run();

      try {
        Thread.sleep(1L);
      } catch (InterruptedException interrupted) {
        Thread.currentThread().interrupt();
        running = false;
      }
    }
  }
}
