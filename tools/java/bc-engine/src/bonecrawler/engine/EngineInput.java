package bonecrawler.engine;

import java.awt.event.KeyAdapter;
import java.awt.event.KeyEvent;
import java.util.HashSet;
import java.util.Set;

final class EngineInput extends KeyAdapter {
  private final EngineRuntime runtime;
  private final Set<Integer> heldKeys = new HashSet<>();

  EngineInput(EngineRuntime runtime) {
    this.runtime = runtime;
  }

  @Override
  public void keyPressed(KeyEvent event) {
    int keyCode = event.getKeyCode();
    runtime.setMovementKey(keyCode, true);
    if (!heldKeys.add(keyCode)) return;

    if (runtime.state() == GameState.PLAYING) {
      if (keyCode == KeyEvent.VK_SPACE) {
        runtime.handleAction(EngineAction.ATTACK);
        return;
      }
      if (keyCode == KeyEvent.VK_B) {
        runtime.handleAction(EngineAction.BLOCK);
        return;
      }
    }

    switch (keyCode) {
      case KeyEvent.VK_ENTER -> runtime.handleAction(EngineAction.START_OR_CONFIRM);
      case KeyEvent.VK_ESCAPE -> runtime.handleAction(EngineAction.BACK_OR_MENU);
      case KeyEvent.VK_P -> runtime.handleAction(EngineAction.TOGGLE_PAUSE);
      case KeyEvent.VK_R -> runtime.handleAction(EngineAction.RETRY);
      case KeyEvent.VK_M -> runtime.handleAction(EngineAction.MENU);
      case KeyEvent.VK_G -> runtime.handleAction(EngineAction.DEBUG_GAMEOVER);
      case KeyEvent.VK_N -> runtime.handleAction(EngineAction.DEBUG_ADVANCE);
      default -> {
      }
    }
  }

  @Override
  public void keyReleased(KeyEvent event) {
    int keyCode = event.getKeyCode();
    heldKeys.remove(keyCode);
    runtime.setMovementKey(keyCode, false);
  }
}
