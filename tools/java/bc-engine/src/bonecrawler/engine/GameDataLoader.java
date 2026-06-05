package bonecrawler.engine;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

final class GameDataLoader {
  private static final String MANIFEST_RELATIVE_PATH = "packages/bonecrawler/game.manifest.json";

  private GameDataLoader() {
  }

  static GameManifest loadDefault() throws IOException {
    Path projectRoot = locateProjectRoot(Paths.get("").toAbsolutePath());
    return load(projectRoot.resolve(MANIFEST_RELATIVE_PATH));
  }

  static GameManifest load(Path manifestPath) throws IOException {
    @SuppressWarnings("unchecked")
    Map<String, Object> root = (Map<String, Object>) MiniJson.parse(Files.readString(manifestPath, StandardCharsets.UTF_8));

    Map<String, Object> gameNode = object(root, "game");
    Map<String, Object> runtimeNode = object(root, "runtime");
    Map<String, Object> contentNode = object(root, "content");
    Map<String, Object> playerNode = object(root, "player");
    Map<String, Object> progressionNode = object(root, "progression");

    GameManifest.GameInfo game = new GameManifest.GameInfo(
      string(gameNode, "id"),
      string(gameNode, "title"),
      string(gameNode, "version"),
      string(gameNode, "description")
    );

    GameManifest.RuntimeInfo runtime = new GameManifest.RuntimeInfo(
      string(runtimeNode, "target"),
      string(runtimeNode, "minimumEngineVersion"),
      string(runtimeNode, "entry"),
      string(runtimeNode, "mode")
    );

    List<GameManifest.ZoneInfo> zones = new ArrayList<>();
    for (Map<String, Object> zoneNode : objects(contentNode, "zones")) {
      zones.add(new GameManifest.ZoneInfo(
        string(zoneNode, "id"),
        string(zoneNode, "name"),
        string(zoneNode, "kind"),
        string(zoneNode, "runtimeRef")
      ));
    }

    Map<String, Object> statsNode = object(playerNode, "stats");
    GameManifest.PlayerStats stats = new GameManifest.PlayerStats(
      decimal(statsNode, "baseSpeed"),
      decimal(statsNode, "maxSpeed"),
      integer(statsNode, "baseSwordReach"),
      integer(statsNode, "baseHp"),
      integer(statsNode, "maxHp")
    );

    List<GameManifest.MoveInfo> moves = new ArrayList<>();
    for (Map<String, Object> moveNode : objects(playerNode, "moves")) {
      moves.add(new GameManifest.MoveInfo(
        string(moveNode, "id"),
        string(moveNode, "label"),
        strings(moveNode, "input"),
        string(moveNode, "runtimeHandler")
      ));
    }

    GameManifest.PlayerInfo player = new GameManifest.PlayerInfo(
      string(playerNode, "entityId"),
      stats,
      List.copyOf(moves)
    );

    List<GameManifest.UpgradeInfo> upgrades = new ArrayList<>();
    for (Map<String, Object> upgradeNode : objects(progressionNode, "upgrades")) {
      upgrades.add(new GameManifest.UpgradeInfo(
        string(upgradeNode, "id"),
        string(upgradeNode, "label"),
        string(upgradeNode, "stacking"),
        optionalString(upgradeNode, "requiresMove"),
        optionalString(upgradeNode, "requiresUpgrade"),
        optionalDecimal(upgradeNode, "cooldownSeconds"),
        optionalDecimal(upgradeNode, "minimumCooldownSeconds"),
        string(upgradeNode, "runtimeHandler")
      ));
    }

    return new GameManifest(
      manifestPath,
      game,
      runtime,
      List.copyOf(zones),
      player,
      List.copyOf(upgrades)
    );
  }

  private static Path locateProjectRoot(Path start) {
    for (Path current = start; current != null; current = current.getParent()) {
      if (Files.isRegularFile(current.resolve(MANIFEST_RELATIVE_PATH))) {
        return current;
      }
    }
    throw new IllegalStateException("Could not locate BoneCrawler project root from " + start);
  }

  @SuppressWarnings("unchecked")
  private static Map<String, Object> object(Map<String, Object> source, String key) {
    Object value = source.get(key);
    if (value instanceof Map<?, ?> map) {
      return (Map<String, Object>) map;
    }
    throw new IllegalArgumentException("Expected object for key '" + key + "'");
  }

  @SuppressWarnings("unchecked")
  private static List<Map<String, Object>> objects(Map<String, Object> source, String key) {
    Object value = source.get(key);
    if (!(value instanceof List<?> list)) {
      throw new IllegalArgumentException("Expected array for key '" + key + "'");
    }

    List<Map<String, Object>> objects = new ArrayList<>();
    for (Object item : list) {
      if (!(item instanceof Map<?, ?> map)) {
        throw new IllegalArgumentException("Expected object entries for key '" + key + "'");
      }
      objects.add((Map<String, Object>) map);
    }
    return objects;
  }

  private static List<String> strings(Map<String, Object> source, String key) {
    Object value = source.get(key);
    if (!(value instanceof List<?> list)) {
      throw new IllegalArgumentException("Expected array for key '" + key + "'");
    }

    List<String> strings = new ArrayList<>();
    for (Object item : list) {
      if (!(item instanceof String string)) {
        throw new IllegalArgumentException("Expected string entries for key '" + key + "'");
      }
      strings.add(string);
    }
    return List.copyOf(strings);
  }

  private static String string(Map<String, Object> source, String key) {
    Object value = source.get(key);
    if (value instanceof String string) return string;
    throw new IllegalArgumentException("Expected string for key '" + key + "'");
  }

  private static String optionalString(Map<String, Object> source, String key) {
    Object value = source.get(key);
    if (value == null) return null;
    if (value instanceof String string) return string;
    throw new IllegalArgumentException("Expected string for key '" + key + "'");
  }

  private static int integer(Map<String, Object> source, String key) {
    Object value = source.get(key);
    if (value instanceof Number number) return number.intValue();
    throw new IllegalArgumentException("Expected number for key '" + key + "'");
  }

  private static double decimal(Map<String, Object> source, String key) {
    Object value = source.get(key);
    if (value instanceof Number number) return number.doubleValue();
    throw new IllegalArgumentException("Expected number for key '" + key + "'");
  }

  private static Double optionalDecimal(Map<String, Object> source, String key) {
    Object value = source.get(key);
    if (value == null) return null;
    if (value instanceof Number number) return number.doubleValue();
    throw new IllegalArgumentException("Expected number for key '" + key + "'");
  }
}
