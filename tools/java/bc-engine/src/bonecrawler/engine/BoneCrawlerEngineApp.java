package bonecrawler.engine;

import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.WindowConstants;
import java.awt.BorderLayout;
import java.io.IOException;

public final class BoneCrawlerEngineApp {
  private BoneCrawlerEngineApp() {}

  public static void main(String[] args) {
    GameManifest manifest;
    try {
      manifest = GameDataLoader.loadDefault();
    } catch (IOException | RuntimeException error) {
      JOptionPane.showMessageDialog(
        null,
        "Failed to load BoneCrawler package manifest.\n" + error.getMessage(),
        "BoneCrawler Java Engine",
        JOptionPane.ERROR_MESSAGE
      );
      throw new IllegalStateException("Could not start BoneCrawler Java Engine", error);
    }

    EngineRuntime runtime = new EngineRuntime(manifest);
    PixelSurface surface = new PixelSurface(runtime);

    JFrame frame = new JFrame(manifest.game().title() + " Java Engine");
    frame.setDefaultCloseOperation(WindowConstants.EXIT_ON_CLOSE);
    frame.setLayout(new BorderLayout());
    frame.add(surface, BorderLayout.CENTER);
    frame.pack();
    frame.setLocationRelativeTo(null);
    frame.setVisible(true);

    EngineLoop loop = new EngineLoop(runtime, surface::renderFrame);
    loop.start();
  }
}
