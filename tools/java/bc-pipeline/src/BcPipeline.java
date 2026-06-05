import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class BcPipeline {
  private static final String MANIFEST_FILE = "game.manifest.json";

  public static void main(String[] args) {
    try {
      if (args.length == 0 || "help".equalsIgnoreCase(args[0]) || "--help".equalsIgnoreCase(args[0])) {
        printUsage();
        return;
      }

      String command = args[0].toLowerCase();
      Path packagePath = args.length >= 2 ? Paths.get(args[1]) : Paths.get("packages", "bonecrawler");

      switch (command) {
        case "validate":
          printValidation(validate(packagePath), true);
          break;
        case "inspect":
          inspect(packagePath);
          break;
        case "pack":
          Path outputRoot = args.length >= 3 ? Paths.get(args[2]) : Paths.get("dist", "packages");
          pack(packagePath, outputRoot);
          break;
        default:
          fail("Unknown command: " + args[0]);
      }
    } catch (PipelineException error) {
      System.err.println("[bc-pipeline] ERROR: " + error.getMessage());
      System.exit(2);
    } catch (Exception error) {
      System.err.println("[bc-pipeline] ERROR: " + error.getMessage());
      System.exit(1);
    }
  }

  private static void printUsage() {
    System.out.println("BoneCrawler Java Pipeline");
    System.out.println();
    System.out.println("Usage:");
    System.out.println("  java BcPipeline validate [packageDir|manifestPath]");
    System.out.println("  java BcPipeline inspect  [packageDir|manifestPath]");
    System.out.println("  java BcPipeline pack     [packageDir|manifestPath] [outputDir]");
  }

  private static ValidationResult validate(Path packagePath) throws IOException {
    Path manifestPath = resolveManifest(packagePath);
    Path packageDir = manifestPath.getParent();
    Object parsed = Json.parse(Files.readString(manifestPath, StandardCharsets.UTF_8));
    if (!(parsed instanceof Map)) fail("Manifest root must be a JSON object: " + manifestPath);

    @SuppressWarnings("unchecked")
    Map<String, Object> root = (Map<String, Object>) parsed;
    ValidationResult result = new ValidationResult(manifestPath);

    requireString(root, "schemaVersion", "schemaVersion", result);
    requireString(root, "packageVersion", "packageVersion", result);

    Map<String, Object> game = requireObject(root, "game", "game", result);
    String gameId = requireString(game, "id", "game.id", result);
    requireId(gameId, "game.id", result);
    requireString(game, "title", "game.title", result);
    requireString(game, "version", "game.version", result);

    Map<String, Object> runtime = requireObject(root, "runtime", "runtime", result);
    requireString(runtime, "target", "runtime.target", result);
    validateOptionalRef(packageDir, stringValue(runtime.get("entry")), "runtime.entry", result);

    Map<String, Object> assets = requireObject(root, "assets", "assets", result);
    List<Object> assetRoots = requireArray(assets, "roots", "assets.roots", result);
    for (int index = 0; index < assetRoots.size(); index++) {
      validateOptionalRef(packageDir, stringValue(assetRoots.get(index)), "assets.roots[" + index + "]", result);
    }

    Map<String, Object> content = requireObject(root, "content", "content", result);
    List<Object> zones = requireArray(content, "zones", "content.zones", result);
    validateObjectListIds(zones, "content.zones", result);
    for (int index = 0; index < zones.size(); index++) {
      Map<String, Object> zone = objectAt(zones, index, "content.zones", result);
      if (zone == null) continue;
      requireString(zone, "name", "content.zones[" + index + "].name", result);
      requireString(zone, "kind", "content.zones[" + index + "].kind", result);
      validateOptionalRef(packageDir, stringValue(zone.get("runtimeRef")), "content.zones[" + index + "].runtimeRef", result);
      validateOptionalRef(packageDir, stringValue(zone.get("spawnConfigRef")), "content.zones[" + index + "].spawnConfigRef", result);
    }

    validateNestedRuntimeRef(packageDir, content, "dialogs", "content.dialogs.runtimeRef", result);
    validateNestedRuntimeRef(packageDir, content, "events", "content.events.runtimeRef", result);

    Map<String, Object> player = requireObject(root, "player", "player", result);
    requireString(player, "entityId", "player.entityId", result);
    Map<String, Object> stats = requireObject(player, "stats", "player.stats", result);
    requireNumber(stats, "baseSpeed", "player.stats.baseSpeed", result);
    requireNumber(stats, "maxSpeed", "player.stats.maxSpeed", result);
    requireNumber(stats, "baseHp", "player.stats.baseHp", result);
    requireNumber(stats, "maxHp", "player.stats.maxHp", result);
    List<Object> moves = requireArray(player, "moves", "player.moves", result);
    validateObjectListIds(moves, "player.moves", result);
    for (int index = 0; index < moves.size(); index++) {
      Map<String, Object> move = objectAt(moves, index, "player.moves", result);
      if (move == null) continue;
      requireString(move, "label", "player.moves[" + index + "].label", result);
      requireArray(move, "input", "player.moves[" + index + "].input", result);
      requireString(move, "runtimeHandler", "player.moves[" + index + "].runtimeHandler", result);
    }

    Map<String, Object> progression = requireObject(root, "progression", "progression", result);
    List<Object> upgrades = requireArray(progression, "upgrades", "progression.upgrades", result);
    validateObjectListIds(upgrades, "progression.upgrades", result);
    for (int index = 0; index < upgrades.size(); index++) {
      Map<String, Object> upgrade = objectAt(upgrades, index, "progression.upgrades", result);
      if (upgrade == null) continue;
      requireString(upgrade, "label", "progression.upgrades[" + index + "].label", result);
      requireString(upgrade, "stacking", "progression.upgrades[" + index + "].stacking", result);
      requireString(upgrade, "runtimeHandler", "progression.upgrades[" + index + "].runtimeHandler", result);
    }

    if (result.hasErrors()) {
      throw new ValidationFailedException(result);
    }
    return result;
  }

  private static void printValidation(ValidationResult result, boolean includeSuccess) {
    for (String warning : result.warnings) System.out.println("[bc-pipeline] WARN: " + warning);
    if (includeSuccess) {
      System.out.println("[bc-pipeline] OK: " + result.manifestPath);
      System.out.println("[bc-pipeline] Checked zones=" + result.zoneCount + ", moves=" + result.moveCount + ", upgrades=" + result.upgradeCount);
    }
  }

  private static void inspect(Path packagePath) throws IOException {
    ValidationResult result = validate(packagePath);
    printValidation(result, false);
    Path manifestPath = resolveManifest(packagePath);
    @SuppressWarnings("unchecked")
    Map<String, Object> root = (Map<String, Object>) Json.parse(Files.readString(manifestPath, StandardCharsets.UTF_8));
    @SuppressWarnings("unchecked")
    Map<String, Object> game = (Map<String, Object>) root.get("game");
    @SuppressWarnings("unchecked")
    Map<String, Object> runtime = (Map<String, Object>) root.get("runtime");
    System.out.println("[bc-pipeline] Package: " + game.get("title") + " (" + game.get("id") + ")");
    System.out.println("[bc-pipeline] Version: " + game.get("version") + " / package " + root.get("packageVersion"));
    System.out.println("[bc-pipeline] Runtime: " + runtime.get("target") + " / " + runtime.get("mode"));
    System.out.println("[bc-pipeline] Content: zones=" + result.zoneCount + ", moves=" + result.moveCount + ", upgrades=" + result.upgradeCount);
  }

  private static void pack(Path packagePath, Path outputRoot) throws IOException {
    ValidationResult result = validate(packagePath);
    printValidation(result, false);
    Path manifestPath = resolveManifest(packagePath);
    Path packageDir = manifestPath.getParent();
    String packageId = readPackageId(manifestPath);
    Path targetDir = outputRoot.resolve(packageId).normalize();
    Files.createDirectories(targetDir);
    copyTree(packageDir, targetDir);
    String buildMeta = "{\n" +
      "  \"packageId\": \"" + escapeJson(packageId) + "\",\n" +
      "  \"source\": \"" + escapeJson(packageDir.toAbsolutePath().normalize().toString().replace('\\', '/')) + "\",\n" +
      "  \"packedAt\": \"" + Instant.now() + "\",\n" +
      "  \"manifest\": \"" + MANIFEST_FILE + "\"\n" +
      "}\n";
    Files.writeString(targetDir.resolve("package.build.json"), buildMeta, StandardCharsets.UTF_8);
    System.out.println("[bc-pipeline] OK: packed " + packageId + " -> " + targetDir);
  }

  private static String readPackageId(Path manifestPath) throws IOException {
    @SuppressWarnings("unchecked")
    Map<String, Object> root = (Map<String, Object>) Json.parse(Files.readString(manifestPath, StandardCharsets.UTF_8));
    @SuppressWarnings("unchecked")
    Map<String, Object> game = (Map<String, Object>) root.get("game");
    String id = stringValue(game.get("id"));
    return id == null || id.isBlank() ? "package" : id;
  }

  private static void copyTree(Path sourceDir, Path targetDir) throws IOException {
    Files.walkFileTree(sourceDir, new SimpleFileVisitor<Path>() {
      @Override
      public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
        Files.createDirectories(targetDir.resolve(sourceDir.relativize(dir)));
        return FileVisitResult.CONTINUE;
      }

      @Override
      public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
        Files.copy(file, targetDir.resolve(sourceDir.relativize(file)), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.COPY_ATTRIBUTES);
        return FileVisitResult.CONTINUE;
      }
    });
  }

  private static Path resolveManifest(Path path) {
    Path candidate = path.normalize();
    if (Files.isDirectory(candidate)) candidate = candidate.resolve(MANIFEST_FILE);
    if (!Files.exists(candidate)) fail("Manifest not found: " + candidate);
    return candidate.toAbsolutePath().normalize();
  }

  private static Map<String, Object> requireObject(Map<String, Object> parent, String key, String label, ValidationResult result) {
    Object value = parent == null ? null : parent.get(key);
    if (value instanceof Map) {
      @SuppressWarnings("unchecked")
      Map<String, Object> map = (Map<String, Object>) value;
      return map;
    }
    result.errors.add(label + " must be an object");
    return new LinkedHashMap<>();
  }

  private static List<Object> requireArray(Map<String, Object> parent, String key, String label, ValidationResult result) {
    Object value = parent == null ? null : parent.get(key);
    if (value instanceof List) {
      @SuppressWarnings("unchecked")
      List<Object> list = (List<Object>) value;
      if (list.isEmpty()) result.errors.add(label + " must not be empty");
      return list;
    }
    result.errors.add(label + " must be an array");
    return new ArrayList<>();
  }

  private static String requireString(Map<String, Object> parent, String key, String label, ValidationResult result) {
    String value = stringValue(parent == null ? null : parent.get(key));
    if (value == null || value.isBlank()) result.errors.add(label + " must be a non-empty string");
    return value;
  }

  private static void requireNumber(Map<String, Object> parent, String key, String label, ValidationResult result) {
    Object value = parent == null ? null : parent.get(key);
    if (!(value instanceof Number)) result.errors.add(label + " must be a number");
  }

  private static Map<String, Object> objectAt(List<Object> list, int index, String label, ValidationResult result) {
    Object value = list.get(index);
    if (value instanceof Map) {
      @SuppressWarnings("unchecked")
      Map<String, Object> map = (Map<String, Object>) value;
      return map;
    }
    result.errors.add(label + "[" + index + "] must be an object");
    return null;
  }

  private static void validateObjectListIds(List<Object> list, String label, ValidationResult result) {
    Set<String> ids = new LinkedHashSet<>();
    for (int index = 0; index < list.size(); index++) {
      Map<String, Object> item = objectAt(list, index, label, result);
      if (item == null) continue;
      String id = requireString(item, "id", label + "[" + index + "].id", result);
      requireId(id, label + "[" + index + "].id", result);
      if (id != null && !ids.add(id)) result.errors.add(label + " contains duplicate id: " + id);
    }
    if ("content.zones".equals(label)) result.zoneCount = list.size();
    if ("player.moves".equals(label)) result.moveCount = list.size();
    if ("progression.upgrades".equals(label)) result.upgradeCount = list.size();
  }

  private static void requireId(String value, String label, ValidationResult result) {
    if (value == null || value.isBlank()) return;
    if (!value.matches("[a-z][a-z0-9_-]*")) result.errors.add(label + " must match [a-z][a-z0-9_-]*: " + value);
  }

  private static void validateNestedRuntimeRef(Path packageDir, Map<String, Object> parent, String key, String label, ValidationResult result) {
    Object value = parent == null ? null : parent.get(key);
    if (value == null) return;
    if (!(value instanceof Map)) {
      result.errors.add(label.substring(0, label.lastIndexOf('.')) + " must be an object");
      return;
    }
    @SuppressWarnings("unchecked")
    Map<String, Object> map = (Map<String, Object>) value;
    validateOptionalRef(packageDir, stringValue(map.get("runtimeRef")), label, result);
  }

  private static void validateOptionalRef(Path packageDir, String ref, String label, ValidationResult result) {
    if (ref == null || ref.isBlank()) return;
    if (ref.startsWith("runtime:")) return;
    Path refPath = packageDir.resolve(ref).normalize();
    if (!Files.exists(refPath)) result.errors.add(label + " points to missing path: " + ref);
  }

  private static String stringValue(Object value) {
    return value instanceof String ? (String) value : null;
  }

  private static String escapeJson(String value) {
    return value.replace("\\", "\\\\").replace("\"", "\\\"");
  }

  private static void fail(String message) {
    throw new PipelineException(message);
  }

  private static final class ValidationResult {
    final Path manifestPath;
    final List<String> errors = new ArrayList<>();
    final List<String> warnings = new ArrayList<>();
    int zoneCount;
    int moveCount;
    int upgradeCount;

    ValidationResult(Path manifestPath) {
      this.manifestPath = manifestPath;
    }

    boolean hasErrors() {
      return !errors.isEmpty();
    }
  }

  private static class PipelineException extends RuntimeException {
    PipelineException(String message) {
      super(message);
    }
  }

  private static final class ValidationFailedException extends PipelineException {
    ValidationFailedException(ValidationResult result) {
      super(String.join("; ", result.errors));
    }
  }

  private static final class Json {
    static Object parse(String text) {
      return new Parser(text).parse();
    }

    private static final class Parser {
      private final String text;
      private int pos;

      Parser(String text) {
        this.text = text == null ? "" : text;
      }

      Object parse() {
        Object value = readValue();
        skipWhitespace();
        if (pos != text.length()) error("Unexpected trailing content");
        return value;
      }

      private Object readValue() {
        skipWhitespace();
        if (pos >= text.length()) error("Unexpected end of JSON");
        char ch = text.charAt(pos);
        if (ch == '{') return readObject();
        if (ch == '[') return readArray();
        if (ch == '"') return readString();
        if (ch == 't') return readLiteral("true", Boolean.TRUE);
        if (ch == 'f') return readLiteral("false", Boolean.FALSE);
        if (ch == 'n') return readLiteral("null", null);
        if (ch == '-' || Character.isDigit(ch)) return readNumber();
        error("Unexpected character '" + ch + "'");
        return null;
      }

      private Map<String, Object> readObject() {
        expect('{');
        Map<String, Object> object = new LinkedHashMap<>();
        skipWhitespace();
        if (peek('}')) {
          pos++;
          return object;
        }
        while (true) {
          skipWhitespace();
          if (pos >= text.length() || text.charAt(pos) != '"') error("Expected object key");
          String key = readString();
          skipWhitespace();
          expect(':');
          object.put(key, readValue());
          skipWhitespace();
          if (peek('}')) {
            pos++;
            return object;
          }
          expect(',');
        }
      }

      private List<Object> readArray() {
        expect('[');
        List<Object> array = new ArrayList<>();
        skipWhitespace();
        if (peek(']')) {
          pos++;
          return array;
        }
        while (true) {
          array.add(readValue());
          skipWhitespace();
          if (peek(']')) {
            pos++;
            return array;
          }
          expect(',');
        }
      }

      private String readString() {
        expect('"');
        StringBuilder builder = new StringBuilder();
        while (pos < text.length()) {
          char ch = text.charAt(pos++);
          if (ch == '"') return builder.toString();
          if (ch == '\\') {
            if (pos >= text.length()) error("Unterminated escape");
            char esc = text.charAt(pos++);
            switch (esc) {
              case '"': builder.append('"'); break;
              case '\\': builder.append('\\'); break;
              case '/': builder.append('/'); break;
              case 'b': builder.append('\b'); break;
              case 'f': builder.append('\f'); break;
              case 'n': builder.append('\n'); break;
              case 'r': builder.append('\r'); break;
              case 't': builder.append('\t'); break;
              case 'u':
                if (pos + 4 > text.length()) error("Invalid unicode escape");
                String hex = text.substring(pos, pos + 4);
                try {
                  builder.append((char) Integer.parseInt(hex, 16));
                } catch (NumberFormatException error) {
                  error("Invalid unicode escape: " + hex);
                }
                pos += 4;
                break;
              default:
                error("Unsupported escape: \\" + esc);
            }
          } else {
            builder.append(ch);
          }
        }
        error("Unterminated string");
        return "";
      }

      private Object readNumber() {
        int start = pos;
        if (peek('-')) pos++;
        while (pos < text.length() && Character.isDigit(text.charAt(pos))) pos++;
        boolean decimal = false;
        if (peek('.')) {
          decimal = true;
          pos++;
          while (pos < text.length() && Character.isDigit(text.charAt(pos))) pos++;
        }
        if (peek('e') || peek('E')) {
          decimal = true;
          pos++;
          if (peek('+') || peek('-')) pos++;
          while (pos < text.length() && Character.isDigit(text.charAt(pos))) pos++;
        }
        String raw = text.substring(start, pos);
        try {
          return decimal ? Double.parseDouble(raw) : Long.parseLong(raw);
        } catch (NumberFormatException error) {
          error("Invalid number: " + raw);
          return 0;
        }
      }

      private Object readLiteral(String literal, Object value) {
        if (!text.startsWith(literal, pos)) error("Expected " + literal);
        pos += literal.length();
        return value;
      }

      private boolean peek(char expected) {
        return pos < text.length() && text.charAt(pos) == expected;
      }

      private void expect(char expected) {
        if (!peek(expected)) error("Expected '" + expected + "'");
        pos++;
      }

      private void skipWhitespace() {
        while (pos < text.length() && Character.isWhitespace(text.charAt(pos))) pos++;
      }

      private void error(String message) {
        throw new PipelineException(message + " at JSON offset " + pos);
      }
    }
  }
}
