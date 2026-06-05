import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import me.friwi.jcefmaven.CefAppBuilder;
import me.friwi.jcefmaven.MavenCefAppHandlerAdapter;
import org.cef.CefApp;
import org.cef.CefApp.CefAppState;
import org.cef.CefClient;
import org.cef.browser.CefBrowser;
import org.cef.browser.CefFrame;
import org.cef.browser.CefMessageRouter;
import org.cef.browser.CefMessageRouter.CefMessageRouterConfig;
import org.cef.callback.CefQueryCallback;
import org.cef.handler.CefFocusHandlerAdapter;
import org.cef.handler.CefLoadHandlerAdapter;
import org.cef.handler.CefMessageRouterHandlerAdapter;

import javax.imageio.ImageIO;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import javax.swing.WindowConstants;
import java.awt.AWTException;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Desktop;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GraphicsDevice;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.Image;
import java.awt.KeyboardFocusManager;
import java.awt.MenuItem;
import java.awt.PopupMenu;
import java.awt.Rectangle;
import java.awt.SystemTray;
import java.awt.TrayIcon;
import java.awt.event.FocusAdapter;
import java.awt.event.FocusEvent;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.CodeSource;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

public final class BoneCrawlerLauncher {
  private static final String TOKEN_PARAM = "bc_runtime_token";
  private static final String TOKEN_COOKIE = "BC_RUNTIME_TOKEN";
  private static final CountDownLatch shutdownLatch = new CountDownLatch(1);
  private static final AtomicBoolean runtimeStopping = new AtomicBoolean(false);
  private static JFrame launcherFrame;
  private static TrayIcon trayIcon;
  private static volatile CefApp cefApp;
  private static volatile CefClient embeddedCefClient;
  private static volatile CefBrowser embeddedBrowser;
  private static volatile CefMessageRouter embeddedMessageRouter;
  private static volatile Component embeddedBrowserComponent;
  private static volatile boolean embeddedBrowserAvailable;
  private static volatile String embeddedBrowserError = "";
  private static volatile boolean launcherFullscreen;
  private static volatile Rectangle launcherRestoreBounds;
  private static volatile int launcherRestoreState = JFrame.NORMAL;
  private static volatile boolean launcherRestoreResizable = true;
  private static volatile JPanel launcherRootPanel;
  private static volatile GraphicsDevice launcherFullscreenDevice;

  public static void main(String[] args) throws Exception {
    LaunchOptions options = LaunchOptions.parse(args);
    Path gameRoot = resolveGameRoot(options);
    RuntimeContext context = new RuntimeContext(gameRoot, resolvePackageFolder(gameRoot), generateRuntimeToken());
    HttpServer server = startServer(context, options.port);
    context.server = server;
    URI gameUri = runtimeGameUri(server, context.token);
    context.gameUri = gameUri;
    Image appIcon = loadAppIcon(gameRoot);

    Runtime.getRuntime().addShutdownHook(new Thread(() -> stopRuntime(server), "bonecrawler-shutdown"));

    System.out.println("BoneCrawler runtime serving: " + gameRoot);
    System.out.println("Open: " + gameUri);

    if (!options.headless && !GraphicsEnvironment.isHeadless()) {
      SwingUtilities.invokeLater(() -> installRuntimeUi(gameUri, context, server, appIcon));
    } else if (!options.noOpen) {
      openBrowser(gameUri);
    }

    shutdownLatch.await();
  }

  private static HttpServer startServer(RuntimeContext context, int requestedPort) throws IOException {
    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", Math.max(0, requestedPort)), 0);
    server.createContext("/", exchange -> routeRequest(context, exchange));
    server.setExecutor(Executors.newCachedThreadPool(runnable -> {
      Thread thread = new Thread(runnable, "bonecrawler-http");
      thread.setDaemon(true);
      return thread;
    }));
    server.start();
    return server;
  }

  private static void routeRequest(RuntimeContext context, HttpExchange exchange) throws IOException {
    String requestPath = exchange.getRequestURI().getPath();
    String decodedPath = URLDecoder.decode(requestPath == null ? "/" : requestPath, StandardCharsets.UTF_8.name());
    if (decodedPath.startsWith("/__bc_runtime/")) {
      handleRuntimeEndpoint(context, exchange, decodedPath);
      return;
    }
    serve(context, exchange, decodedPath);
  }

  private static void serve(RuntimeContext context, HttpExchange exchange, String decodedPath) throws IOException {
    String method = exchange.getRequestMethod();
    if (!"GET".equalsIgnoreCase(method) && !"HEAD".equalsIgnoreCase(method)) {
      send(exchange, 405, "Method Not Allowed", "text/plain; charset=utf-8", !"HEAD".equalsIgnoreCase(method));
      return;
    }

    boolean indexRequest = decodedPath.equals("/") || decodedPath.equals("/index.html") || decodedPath.isBlank();
    if (indexRequest && hasLaunchToken(exchange, context)) {
      setRuntimeCookie(exchange, context);
    } else if (!isAuthorized(exchange, context)) {
      send(exchange, 403, "Forbidden", "text/plain; charset=utf-8", !"HEAD".equalsIgnoreCase(method));
      return;
    }

    if (indexRequest) decodedPath = "/index.html";
    Path file = context.gameRoot.resolve(decodedPath.substring(1).replace('/', java.io.File.separatorChar)).normalize();

    if (!file.startsWith(context.gameRoot) || Files.isDirectory(file) || !Files.exists(file)) {
      send(exchange, 404, "Not Found", "text/plain; charset=utf-8", !"HEAD".equalsIgnoreCase(method));
      return;
    }

    byte[] bytes = Files.readAllBytes(file);
    Headers headers = exchange.getResponseHeaders();
    headers.set("Content-Type", contentType(file));
    headers.set("Cache-Control", "no-store");
    exchange.sendResponseHeaders(200, "HEAD".equalsIgnoreCase(method) ? -1 : bytes.length);
    if (!"HEAD".equalsIgnoreCase(method)) {
      try (OutputStream output = exchange.getResponseBody()) {
        output.write(bytes);
      }
    } else {
      exchange.close();
    }
  }

  private static void handleRuntimeEndpoint(RuntimeContext context, HttpExchange exchange, String decodedPath) throws IOException {
    String method = exchange.getRequestMethod();
    if (!isAuthorized(exchange, context) || !isSameOriginRuntimeRequest(exchange, context)) {
      sendJson(exchange, 403, "{\"ok\":false,\"error\":\"forbidden\"}", !"HEAD".equalsIgnoreCase(method));
      return;
    }

    if (decodedPath.equals("/__bc_runtime/status") && ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method))) {
      sendJson(exchange, 200, runtimeStatusJson(context), !"HEAD".equalsIgnoreCase(method));
      return;
    }

    if (decodedPath.equals("/__bc_runtime/open-package-folder") && "POST".equalsIgnoreCase(method)) {
      boolean opened = openFolder(context.packageFolder);
      sendJson(exchange, opened ? 200 : 500, "{\"ok\":" + opened + ",\"action\":\"open-package-folder\"}", true);
      return;
    }

    if (decodedPath.equals("/__bc_runtime/reload") && "POST".equalsIgnoreCase(method)) {
      sendJson(exchange, 200, "{\"ok\":true,\"action\":\"reload\"}", true);
      scheduleReload(context);
      return;
    }

    if (decodedPath.equals("/__bc_runtime/fullscreen") && "POST".equalsIgnoreCase(method)) {
      scheduleFullscreenToggle();
      sendJson(exchange, 200, "{\"ok\":true,\"action\":\"fullscreen-toggle-requested\"}", true);
      return;
    }

    if (decodedPath.equals("/__bc_runtime/stop") && "POST".equalsIgnoreCase(method)) {
      sendJson(exchange, 200, "{\"ok\":true,\"action\":\"stop\"}", true);
      scheduleStop(context.server);
      return;
    }

    if (decodedPath.equals("/__bc_runtime/hide") && "POST".equalsIgnoreCase(method)) {
      sendJson(exchange, 200, "{\"ok\":true,\"action\":\"hide\"}", true);
      SwingUtilities.invokeLater(BoneCrawlerLauncher::hideLauncherWindow);
      return;
    }

    sendJson(exchange, 404, "{\"ok\":false,\"error\":\"not-found\"}", !"HEAD".equalsIgnoreCase(method));
  }

  private static void send(HttpExchange exchange, int status, String text, String contentType, boolean body) throws IOException {
    byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().set("Content-Type", contentType);
    exchange.getResponseHeaders().set("Cache-Control", "no-store");
    exchange.sendResponseHeaders(status, body ? bytes.length : -1);
    if (body) {
      try (OutputStream output = exchange.getResponseBody()) {
        output.write(bytes);
      }
    } else {
      exchange.close();
    }
  }

  private static void sendJson(HttpExchange exchange, int status, String json, boolean body) throws IOException {
    send(exchange, status, json, "application/json; charset=utf-8", body);
  }

  private static String contentType(Path file) {
    String name = file.getFileName().toString().toLowerCase();
    Map<String, String> types = new HashMap<>();
    types.put(".html", "text/html; charset=utf-8");
    types.put(".css", "text/css; charset=utf-8");
    types.put(".js", "text/javascript; charset=utf-8");
    types.put(".mjs", "text/javascript; charset=utf-8");
    types.put(".json", "application/json; charset=utf-8");
    types.put(".png", "image/png");
    types.put(".jpg", "image/jpeg");
    types.put(".jpeg", "image/jpeg");
    types.put(".gif", "image/gif");
    types.put(".svg", "image/svg+xml");
    types.put(".ico", "image/x-icon");
    types.put(".mp3", "audio/mpeg");
    types.put(".wav", "audio/wav");
    types.put(".ogg", "audio/ogg");
    for (Map.Entry<String, String> entry : types.entrySet()) {
      if (name.endsWith(entry.getKey())) return entry.getValue();
    }
    return "application/octet-stream";
  }

  private static URI runtimeGameUri(HttpServer server, String token) throws URISyntaxException {
    String query = "javaRuntime=1&" + TOKEN_PARAM + "=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    return new URI("http", null, "127.0.0.1", server.getAddress().getPort(), "/index.html", query, null);
  }

  private static String displayUri(URI uri) {
    String port = uri.getPort() > -1 ? ":" + uri.getPort() : "";
    return uri.getScheme() + "://" + uri.getHost() + port + uri.getPath();
  }

  private static String generateRuntimeToken() {
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  private static boolean hasLaunchToken(HttpExchange exchange, RuntimeContext context) {
    String token = queryParam(exchange.getRequestURI().getRawQuery(), TOKEN_PARAM);
    return context.token.equals(token);
  }

  private static String queryParam(String rawQuery, String key) {
    if (rawQuery == null || rawQuery.isBlank()) return null;
    String[] parts = rawQuery.split("&");
    for (String part : parts) {
      int equals = part.indexOf('=');
      String rawKey = equals >= 0 ? part.substring(0, equals) : part;
      if (!key.equals(urlDecode(rawKey))) continue;
      return equals >= 0 ? urlDecode(part.substring(equals + 1)) : "";
    }
    return null;
  }

  private static String urlDecode(String value) {
    try {
      return URLDecoder.decode(value == null ? "" : value, StandardCharsets.UTF_8.name());
    } catch (Exception error) {
      return "";
    }
  }

  private static void setRuntimeCookie(HttpExchange exchange, RuntimeContext context) {
    exchange.getResponseHeaders().add("Set-Cookie", TOKEN_COOKIE + "=" + context.token + "; Path=/; HttpOnly; SameSite=Strict");
  }

  private static boolean isAuthorized(HttpExchange exchange, RuntimeContext context) {
    String headerToken = firstHeader(exchange, "X-BoneCrawler-Runtime-Token");
    if (context.token.equals(headerToken)) return true;

    String cookie = firstHeader(exchange, "Cookie");
    if (cookie == null) return false;
    String[] parts = cookie.split(";");
    for (String part : parts) {
      String trimmed = part.trim();
      int equals = trimmed.indexOf('=');
      if (equals < 0) continue;
      String name = trimmed.substring(0, equals).trim();
      String value = trimmed.substring(equals + 1).trim();
      if (TOKEN_COOKIE.equals(name) && context.token.equals(value)) return true;
    }
    return false;
  }

  private static boolean isSameOriginRuntimeRequest(HttpExchange exchange, RuntimeContext context) {
    if (context.server == null) return false;
    String expected = "http://127.0.0.1:" + context.server.getAddress().getPort();
    String origin = firstHeader(exchange, "Origin");
    if (origin != null && !expected.equals(origin)) return false;
    String referer = firstHeader(exchange, "Referer");
    return referer == null || referer.equals(expected) || referer.startsWith(expected + "/");
  }

  private static String firstHeader(HttpExchange exchange, String name) {
    return exchange.getRequestHeaders().getFirst(name);
  }

  private static String runtimeStatusJson(RuntimeContext context) {
    long uptimeMs = Math.max(0, System.currentTimeMillis() - context.startedAtMs);
    int port = context.server == null ? 0 : context.server.getAddress().getPort();
    return "{"
      + "\"ok\":true,"
      + "\"name\":\"BoneCrawler Runtime\","
      + "\"version\":\"2.9.5\","
      + "\"mode\":\"raw-jdk-jcef\","
      + "\"secure\":true,"
      + "\"embedded\":" + embeddedBrowserAvailable + ","
      + "\"fullscreen\":" + isLauncherFullscreen() + ","
      + "\"port\":" + port + ","
      + "\"startedAt\":\"" + jsonEscape(context.startedAt) + "\","
      + "\"uptimeMs\":" + uptimeMs + ","
      + "\"gameRoot\":\"" + jsonEscape(context.gameRoot.toString()) + "\","
      + "\"packageFolder\":\"" + jsonEscape(context.packageFolder.toString()) + "\""
      + "}";
  }

  private static String jsonEscape(String value) {
    StringBuilder builder = new StringBuilder();
    for (int index = 0; index < value.length(); index++) {
      char ch = value.charAt(index);
      if (ch == '\\' || ch == '"') builder.append('\\').append(ch);
      else if (ch == '\n') builder.append("\\n");
      else if (ch == '\r') builder.append("\\r");
      else if (ch == '\t') builder.append("\\t");
      else builder.append(ch);
    }
    return builder.toString();
  }

  private static boolean openFolder(Path path) {
    if (!Desktop.isDesktopSupported()) return false;
    try {
      Desktop.getDesktop().open(path.toFile());
      return true;
    } catch (Exception error) {
      System.out.println("Could not open package folder: " + error.getMessage());
      return false;
    }
  }

  private static void scheduleReload(RuntimeContext context) {
    SwingUtilities.invokeLater(() -> {
      if (context.gameUri != null && reloadEmbeddedGame(context.gameUri)) return;
      System.out.println("Reload requested, but embedded game view is unavailable.");
    });
  }

  private static void scheduleStop(HttpServer server) {
    Thread thread = new Thread(() -> {
      try {
        Thread.sleep(180);
      } catch (InterruptedException ignored) {
        Thread.currentThread().interrupt();
      }
      stopRuntime(server);
    }, "bonecrawler-stop-runtime");
    thread.setDaemon(false);
    thread.start();
  }

  private static Path resolveGameRoot(LaunchOptions options) throws URISyntaxException {
    if (options.gameRoot != null) return requireGameRoot(options.gameRoot.toAbsolutePath().normalize());

    Path codePath = codeSourcePath();
    Path appDir = Files.isRegularFile(codePath) ? codePath.getParent() : codePath;
    Path packagedGame = appDir.resolve("game");
    if (Files.exists(packagedGame.resolve("index.html"))) return packagedGame.toAbsolutePath().normalize();

    Path cwd = Paths.get("").toAbsolutePath().normalize();
    if (Files.exists(cwd.resolve("index.html"))) return cwd;

    Path repoFromTool = cwd.getParent() != null && cwd.getParent().getParent() != null && cwd.getParent().getParent().getParent() != null
      ? cwd.getParent().getParent().getParent()
      : cwd;
    if (Files.exists(repoFromTool.resolve("index.html"))) return repoFromTool.toAbsolutePath().normalize();

    throw new IllegalStateException("Could not find game root. Pass --game-root C:\\path\\to\\bc-2-9-4.");
  }

  private static Path resolvePackageFolder(Path gameRoot) {
    Path name = gameRoot.getFileName();
    Path parent = gameRoot.getParent();
    if (name != null && parent != null && "game".equalsIgnoreCase(name.toString())) {
      Path appParent = parent.getParent();
      if (appParent != null && "app".equalsIgnoreCase(parent.getFileName().toString())) {
        return appParent.toAbsolutePath().normalize();
      }
      return parent.toAbsolutePath().normalize();
    }
    return gameRoot.toAbsolutePath().normalize();
  }

  private static Path requireGameRoot(Path path) {
    if (!Files.exists(path.resolve("index.html"))) {
      throw new IllegalArgumentException("Game root must contain index.html: " + path);
    }
    return path;
  }

  private static Path codeSourcePath() throws URISyntaxException {
    CodeSource source = BoneCrawlerLauncher.class.getProtectionDomain().getCodeSource();
    if (source == null || source.getLocation() == null) return Paths.get("").toAbsolutePath().normalize();
    return Paths.get(source.getLocation().toURI()).toAbsolutePath().normalize();
  }

  private static void openBrowser(URI uri) {
    if (!Desktop.isDesktopSupported()) return;
    try {
      Desktop.getDesktop().browse(uri);
    } catch (Exception error) {
      System.out.println("Could not open browser automatically: " + error.getMessage());
    }
  }

  private static Image loadAppIcon(Path gameRoot) {
    Path[] candidates = {
      gameRoot.resolve("assets/icon.jpg"),
      gameRoot.resolve("assets/icon.png")
    };

    for (Path candidate : candidates) {
      if (!Files.exists(candidate)) continue;
      try {
        Image image = ImageIO.read(candidate.toFile());
        if (image != null) return image;
      } catch (IOException error) {
        System.out.println("Could not load app icon: " + error.getMessage());
      }
    }
    return createTrayImage();
  }

  private static void installRuntimeUi(URI gameUri, RuntimeContext context, HttpServer server, Image appIcon) {
    if (SystemTray.isSupported()) {
      try {
        installTrayIcon(gameUri, context, server, appIcon);
      } catch (AWTException error) {
        System.out.println("Could not install tray icon: " + error.getMessage());
      }
    }
    showLauncherWindow(gameUri, context, server, appIcon);
  }

  private static void installTrayIcon(URI gameUri, RuntimeContext context, HttpServer server, Image appIcon) throws AWTException {
    PopupMenu menu = new PopupMenu();

    MenuItem openItem = new MenuItem("Show Game");
    openItem.addActionListener(event -> SwingUtilities.invokeLater(() -> showLauncherWindow(gameUri, context, server, appIcon)));
    menu.add(openItem);

    MenuItem reloadItem = new MenuItem("Reload Game");
    reloadItem.addActionListener(event -> reloadEmbeddedGame(gameUri));
    menu.add(reloadItem);

    menu.addSeparator();

    MenuItem stopItem = new MenuItem("Stop Runtime");
    stopItem.addActionListener(event -> stopRuntime(server));
    menu.add(stopItem);

    trayIcon = new TrayIcon(appIcon, "BoneCrawler Runtime", menu);
    trayIcon.setImageAutoSize(true);
    trayIcon.addActionListener(event -> SwingUtilities.invokeLater(() -> showLauncherWindow(gameUri, context, server, appIcon)));
    SystemTray.getSystemTray().add(trayIcon);
  }

  private static Image createTrayImage() {
    BufferedImage image = new BufferedImage(32, 32, BufferedImage.TYPE_INT_ARGB);
    Graphics2D graphics = image.createGraphics();
    graphics.setColor(new Color(8, 10, 10));
    graphics.fillRect(3, 3, 26, 26);
    graphics.setColor(new Color(205, 173, 76));
    graphics.drawRect(3, 3, 25, 25);
    graphics.setColor(new Color(199, 101, 232));
    graphics.fillRect(9, 7, 5, 18);
    graphics.fillRect(14, 7, 8, 5);
    graphics.fillRect(14, 17, 9, 5);
    graphics.fillRect(21, 12, 4, 5);
    graphics.fillRect(22, 22, 4, 3);
    graphics.dispose();
    return image;
  }

  private static void showLauncherWindow(URI gameUri, RuntimeContext context, HttpServer server, Image appIcon) {
    if (launcherFrame != null && launcherFrame.isDisplayable()) {
      launcherFrame.setVisible(true);
      launcherFrame.toFront();
      requestEmbeddedGameFocus(embeddedBrowserComponent);
      return;
    }

    JFrame frame = new JFrame("BoneCrawler");
    frame.setIconImage(appIcon);
    frame.setDefaultCloseOperation(WindowConstants.DO_NOTHING_ON_CLOSE);

    JPanel root = new JPanel(new BorderLayout(0, 0));
    root.setBorder(BorderFactory.createEmptyBorder(8, 8, 8, 8));
    root.setBackground(new Color(7, 10, 10));
    launcherRootPanel = root;

    Component gameView = createEmbeddedGameComponent(gameUri, context);
    if (gameView != null) {
      root.add(gameView, BorderLayout.CENTER);
      frame.setMinimumSize(new Dimension(900, 680));
      frame.setSize(1100, 820);
    } else {
      root.add(createFallbackPanel(gameUri), BorderLayout.CENTER);
      frame.setMinimumSize(new Dimension(520, 220));
      frame.setSize(600, 260);
    }

    final Component embeddedGameView = gameView;
    frame.addWindowListener(new WindowAdapter() {
      @Override
      public void windowClosing(WindowEvent event) {
        if (trayIcon == null) stopRuntime(server);
        else hideLauncherWindow();
      }

      @Override
      public void windowActivated(WindowEvent event) {
        requestEmbeddedGameFocus(embeddedGameView);
      }
    });

    frame.setContentPane(root);
    frame.setLocationRelativeTo(null);
    frame.setVisible(true);
    launcherFrame = frame;
    requestEmbeddedGameFocus(gameView);
  }

  private static JPanel createFallbackPanel(URI gameUri) {
    JPanel panel = new JPanel(new BorderLayout(10, 10));
    panel.setBorder(BorderFactory.createEmptyBorder(16, 16, 16, 16));
    panel.setBackground(new Color(7, 10, 10));

    JPanel titlePanel = new JPanel(new BorderLayout(2, 2));
    titlePanel.setOpaque(false);

    JLabel title = new JLabel("BONECRAWLER");
    title.setForeground(new Color(245, 228, 173));
    title.setFont(new Font(Font.MONOSPACED, Font.BOLD, 20));

    String fallbackReason = embeddedBrowserError == null || embeddedBrowserError.isBlank()
      ? "Embedded Chromium is unavailable. Open the secure browser fallback."
      : embeddedBrowserError;
    JLabel subtitle = new JLabel(fallbackReason);
    subtitle.setForeground(new Color(190, 175, 126));
    subtitle.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));

    titlePanel.add(title, BorderLayout.NORTH);
    titlePanel.add(subtitle, BorderLayout.SOUTH);

    JTextField urlField = new JTextField(displayUri(gameUri));
    urlField.setEditable(false);
    urlField.setBackground(new Color(16, 24, 24));
    urlField.setForeground(new Color(235, 229, 202));
    urlField.setCaretColor(new Color(235, 229, 202));
    urlField.setBorder(BorderFactory.createLineBorder(new Color(74, 63, 34)));

    JButton browserButton = new JButton("Open Browser Fallback");
    browserButton.setFocusable(false);
    browserButton.addActionListener(event -> openBrowser(gameUri));

    JPanel footer = new JPanel(new FlowLayout(FlowLayout.RIGHT, 0, 0));
    footer.setOpaque(false);
    footer.add(browserButton);

    panel.add(titlePanel, BorderLayout.NORTH);
    panel.add(urlField, BorderLayout.CENTER);
    panel.add(footer, BorderLayout.SOUTH);
    return panel;
  }

  private static Component createEmbeddedGameComponent(URI gameUri, RuntimeContext context) {
    try {
      CefAppBuilder builder = new CefAppBuilder();
      builder.setInstallDir(resolveJcefInstallDir().toFile());
      builder.getCefSettings().windowless_rendering_enabled = false;
      builder.getCefSettings().cache_path = resolveJcefCacheDir().toString();
      builder.setAppHandler(new MavenCefAppHandlerAdapter() {
        @Override
        public void stateHasChanged(CefAppState state) {
          if (state == CefAppState.TERMINATED) embeddedBrowserAvailable = false;
        }
      });

      cefApp = builder.build();
      embeddedCefClient = cefApp.createClient();
      installEmbeddedFocusHandler(embeddedCefClient);
      installEmbeddedLoadHandler(embeddedCefClient);
      installEmbeddedMessageRouter(embeddedCefClient, context);

      embeddedBrowser = embeddedCefClient.createBrowser(gameUri.toString(), false, false);
      embeddedBrowserComponent = embeddedBrowser.getUIComponent();
      embeddedBrowserComponent.setFocusable(true);
      embeddedBrowserComponent.setPreferredSize(new Dimension(1040, 760));
      embeddedBrowserComponent.addMouseListener(new MouseAdapter() {
        @Override
        public void mousePressed(MouseEvent event) {
          requestEmbeddedGameFocus(embeddedBrowserComponent);
        }
      });
      embeddedBrowserComponent.addFocusListener(new FocusAdapter() {
        @Override
        public void focusGained(FocusEvent event) {
          requestEmbeddedGameFocus(embeddedBrowserComponent);
        }
      });

      embeddedBrowserAvailable = true;
      embeddedBrowserError = "";
      return embeddedBrowserComponent;
    } catch (Throwable error) {
      embeddedBrowserAvailable = false;
      embeddedBrowserError = describeError("Embedded Chromium unavailable", error);
      System.out.println(embeddedBrowserError);
      return null;
    }
  }

  private static void installEmbeddedFocusHandler(CefClient client) {
    client.addFocusHandler(new CefFocusHandlerAdapter() {
      private boolean browserHasFocus = true;

      @Override
      public void onGotFocus(CefBrowser browser) {
        if (browserHasFocus) return;
        browserHasFocus = true;
        KeyboardFocusManager.getCurrentKeyboardFocusManager().clearGlobalFocusOwner();
        browser.setFocus(true);
      }

      @Override
      public void onTakeFocus(CefBrowser browser, boolean next) {
        browserHasFocus = false;
      }
    });
  }

  private static void installEmbeddedLoadHandler(CefClient client) {
    client.addLoadHandler(new CefLoadHandlerAdapter() {
      @Override
      public void onLoadEnd(CefBrowser browser, CefFrame frame, int httpStatusCode) {
        if (frame != null && !frame.isMain()) return;
        try {
          browser.executeJavaScript(
            "window.focus();var c=document.querySelector('canvas');if(c){c.tabIndex=0;c.focus();}",
            browser.getURL(),
            0
          );
        } catch (Exception error) {
          System.out.println("Could not focus embedded page after load: " + rootCause(error).getMessage());
        }
        SwingUtilities.invokeLater(() -> requestEmbeddedGameFocus(embeddedBrowserComponent));
      }
    });
  }

  private static void installEmbeddedMessageRouter(CefClient client, RuntimeContext context) {
    CefMessageRouterConfig config = new CefMessageRouterConfig();
    config.jsQueryFunction = "cefQuery";
    config.jsCancelFunction = "cefQueryCancel";

    embeddedMessageRouter = CefMessageRouter.create(config);
    embeddedMessageRouter.addHandler(new CefMessageRouterHandlerAdapter() {
      @Override
      public boolean onQuery(CefBrowser browser, CefFrame frame, long queryId, String request, boolean persistent, CefQueryCallback callback) {
        String response = handleEmbeddedBridgeRequest(context, request);
        if (response == null) return false;
        callback.success(response);
        return true;
      }
    }, true);
    client.addMessageRouter(embeddedMessageRouter);
  }

  private static String handleEmbeddedBridgeRequest(RuntimeContext context, String request) {
    if (request == null || request.isBlank()) {
      return "{\"ok\":false,\"error\":\"empty-request\"}";
    }

    if ("runtime:GET:/status".equals(request)) {
      return runtimeStatusJson(context);
    }

    if ("runtime:POST:/reload".equals(request)) {
      scheduleReload(context);
      return "{\"ok\":true,\"action\":\"reload\"}";
    }

    if ("runtime:POST:/fullscreen".equals(request)) {
      scheduleFullscreenToggle();
      return "{\"ok\":true,\"action\":\"fullscreen-toggle-requested\"}";
    }

    if ("runtime:POST:/stop".equals(request)) {
      scheduleStop(context.server);
      return "{\"ok\":true,\"action\":\"stop\"}";
    }

    if ("runtime:POST:/hide".equals(request)) {
      SwingUtilities.invokeLater(BoneCrawlerLauncher::hideLauncherWindow);
      return "{\"ok\":true,\"action\":\"hide\"}";
    }

    if ("runtime:POST:/open-package-folder".equals(request)) {
      boolean opened = openFolder(context.packageFolder);
      return "{\"ok\":" + opened + ",\"action\":\"open-package-folder\"}";
    }

    if ("runtime:GET:/ping".equals(request)) {
      return "{\"ok\":true,\"pong\":true}";
    }

    return null;
  }

  private static boolean reloadEmbeddedGame(URI gameUri) {
    CefBrowser browser = embeddedBrowser;
    if (browser == null) return false;
    try {
      browser.loadURL(gameUri.toString());
      requestEmbeddedGameFocus(embeddedBrowserComponent);
      return true;
    } catch (Exception error) {
      System.out.println("Could not reload embedded game view: " + error.getMessage());
      return false;
    }
  }

  private static void requestEmbeddedGameFocus(Component component) {
    if (component != null) {
      component.setFocusable(true);
      component.requestFocus();
      SwingUtilities.invokeLater(component::requestFocusInWindow);
    }

    CefBrowser browser = embeddedBrowser;
    if (browser == null) return;

    try {
      browser.setFocus(true);
    } catch (Exception error) {
      System.out.println("Could not focus embedded Chromium browser: " + rootCause(error).getMessage());
    }

    try {
      browser.executeJavaScript(
        "try{window.focus();document.body&&document.body.focus&&document.body.focus();" +
          "var c=document.querySelector('canvas');if(c){c.tabIndex=0;c.focus();}}catch(e){}",
        browser.getURL(),
        0
      );
    } catch (Exception error) {
      System.out.println("Could not focus embedded document: " + rootCause(error).getMessage());
    }
  }

  private static void hideLauncherWindow() {
    if (launcherFrame != null && launcherFrame.isDisplayable()) {
      if (isLauncherFullscreen()) exitLauncherFullscreen(launcherFrame);
      launcherFrame.setVisible(false);
    }
  }

  private static void toggleLauncherFullscreen() {
    JFrame frame = launcherFrame;
    if (frame == null || !frame.isDisplayable()) return;
    if (isLauncherFullscreen()) {
      exitLauncherFullscreen(frame);
    } else {
      enterLauncherFullscreen(frame);
    }
    frame.revalidate();
    frame.repaint();
    SwingUtilities.invokeLater(() -> requestEmbeddedGameFocus(embeddedBrowserComponent));
  }

  private static void scheduleFullscreenToggle() {
    SwingUtilities.invokeLater(() -> {
      try {
        toggleLauncherFullscreen();
      } catch (Exception error) {
        System.out.println("Could not toggle fullscreen: " + rootCause(error).getMessage());
      }
    });
  }

  private static void enterLauncherFullscreen(JFrame frame) {
    try {
      launcherRestoreBounds = frame.getBounds();
      launcherRestoreState = frame.getExtendedState();
      launcherRestoreResizable = frame.isResizable();
      GraphicsDevice device = frame.getGraphicsConfiguration() != null
        ? frame.getGraphicsConfiguration().getDevice()
        : GraphicsEnvironment.getLocalGraphicsEnvironment().getDefaultScreenDevice();
      Rectangle bounds = device.getDefaultConfiguration().getBounds();
      frame.dispose();
      frame.setUndecorated(true);
      frame.setResizable(false);
      frame.setBounds(bounds);
      if (launcherRootPanel != null) launcherRootPanel.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 0));
      frame.setVisible(true);
      frame.setExtendedState(JFrame.NORMAL);
      frame.toFront();
      launcherFullscreenDevice = device;
      launcherFullscreen = true;
    } catch (Exception error) {
      System.out.println("Could not enter fullscreen: " + error.getMessage());
    }
  }

  private static void exitLauncherFullscreen(JFrame frame) {
    try {
      frame.dispose();
      if (launcherFullscreenDevice != null && launcherFullscreenDevice.getFullScreenWindow() == frame) {
        launcherFullscreenDevice.setFullScreenWindow(null);
      }
      frame.setUndecorated(false);
      frame.setResizable(launcherRestoreResizable);
      if (launcherRootPanel != null) launcherRootPanel.setBorder(BorderFactory.createEmptyBorder(8, 8, 8, 8));
      if (launcherRestoreBounds != null) frame.setBounds(launcherRestoreBounds);
      frame.setExtendedState(launcherRestoreState);
      frame.setVisible(true);
      frame.toFront();
    } catch (Exception error) {
      System.out.println("Could not exit fullscreen: " + error.getMessage());
    } finally {
      launcherFullscreenDevice = null;
      launcherFullscreen = false;
    }
  }

  private static boolean isLauncherFullscreen() {
    return launcherFullscreen;
  }

  private static Path resolveJcefInstallDir() {
    return ensureRuntimeDirectory("jcef-bundle");
  }

  private static Path resolveJcefCacheDir() {
    return ensureRuntimeDirectory("jcef-cache");
  }

  private static Path ensureRuntimeDirectory(String child) {
    String localAppData = System.getenv("LOCALAPPDATA");
    Path root = (localAppData != null && !localAppData.isBlank())
      ? Paths.get(localAppData, "BoneCrawler")
      : Paths.get(System.getProperty("user.home"), ".bonecrawler");
    Path directory = root.resolve(child).toAbsolutePath().normalize();
    try {
      Files.createDirectories(directory);
    } catch (IOException error) {
      throw new IllegalStateException("Could not create runtime directory: " + directory, error);
    }
    return directory;
  }

  private static Throwable rootCause(Throwable error) {
    Throwable current = error;
    while (current != null) {
      Throwable next = current.getCause();
      if (next == null || next == current) return current;
      current = next;
    }
    return error;
  }

  private static String describeError(String prefix, Throwable error) {
    Throwable root = rootCause(error);
    String message = root == null ? "" : String.valueOf(root.getMessage());
    String type = root == null ? "Unknown" : root.getClass().getSimpleName();
    if (message == null || message.isBlank()) message = String.valueOf(error.getMessage());
    if (message == null || message.isBlank()) message = "no message";
    return prefix + ": " + type + " - " + message;
  }

  private static void stopRuntime(HttpServer server) {
    if (!runtimeStopping.compareAndSet(false, true)) return;
    server.stop(0);
    disposeEmbeddedBrowser();
    if (launcherFrame != null) {
      launcherFrame.dispose();
      launcherFrame = null;
    }
    if (trayIcon != null && SystemTray.isSupported()) {
      SystemTray.getSystemTray().remove(trayIcon);
      trayIcon = null;
    }
    shutdownLatch.countDown();
  }

  private static void disposeEmbeddedBrowser() {
    CountDownLatch disposed = new CountDownLatch(1);
    Runnable task = () -> {
      try {
        CefBrowser browser = embeddedBrowser;
        if (browser != null) {
          try {
            browser.close(true);
          } catch (Exception error) {
            System.out.println("Could not close embedded browser: " + error.getMessage());
          }
          embeddedBrowser = null;
        }

        CefMessageRouter router = embeddedMessageRouter;
        if (router != null) {
          try {
            router.dispose();
          } catch (Exception error) {
            System.out.println("Could not dispose message router: " + error.getMessage());
          }
          embeddedMessageRouter = null;
        }

        CefClient client = embeddedCefClient;
        if (client != null) {
          try {
            client.dispose();
          } catch (Exception error) {
            System.out.println("Could not dispose CEF client: " + error.getMessage());
          }
          embeddedCefClient = null;
        }

        CefApp app = cefApp;
        if (app != null) {
          try {
            app.dispose();
          } catch (Exception error) {
            System.out.println("Could not dispose CEF app: " + error.getMessage());
          }
          cefApp = null;
        }
      } finally {
        embeddedBrowserComponent = null;
        embeddedBrowserAvailable = false;
        disposed.countDown();
      }
    };

    if (SwingUtilities.isEventDispatchThread()) {
      task.run();
      return;
    }

    SwingUtilities.invokeLater(task);
    try {
      disposed.await(4, TimeUnit.SECONDS);
    } catch (InterruptedException error) {
      Thread.currentThread().interrupt();
    }
  }

  private static final class RuntimeContext {
    final Path gameRoot;
    final Path packageFolder;
    final String token;
    final String startedAt;
    final long startedAtMs;
    volatile HttpServer server;
    volatile URI gameUri;

    RuntimeContext(Path gameRoot, Path packageFolder, String token) {
      this.gameRoot = gameRoot;
      this.packageFolder = packageFolder;
      this.token = token;
      this.startedAt = Instant.now().toString();
      this.startedAtMs = System.currentTimeMillis();
    }
  }

  private static final class LaunchOptions {
    final Path gameRoot;
    final int port;
    final boolean noOpen;
    final boolean headless;

    private LaunchOptions(Path gameRoot, int port, boolean noOpen, boolean headless) {
      this.gameRoot = gameRoot;
      this.port = port;
      this.noOpen = noOpen;
      this.headless = headless;
    }

    static LaunchOptions parse(String[] args) {
      Path gameRoot = null;
      int port = 0;
      boolean noOpen = false;
      boolean headless = false;

      for (int index = 0; index < args.length; index++) {
        String arg = args[index];
        if ("--game-root".equals(arg) && index + 1 < args.length) {
          gameRoot = Paths.get(args[++index]);
        } else if ("--port".equals(arg) && index + 1 < args.length) {
          port = Integer.parseInt(args[++index]);
        } else if ("--no-open".equals(arg)) {
          noOpen = true;
        } else if ("--headless".equals(arg)) {
          headless = true;
        } else if ("--help".equals(arg) || "-h".equals(arg)) {
          printHelpAndExit();
        } else {
          throw new IllegalArgumentException("Unknown launcher argument: " + arg);
        }
      }
      return new LaunchOptions(gameRoot, port, noOpen, headless);
    }

    private static void printHelpAndExit() {
      System.out.println("BoneCrawlerLauncher");
      System.out.println("  --game-root PATH  Serve a specific game folder containing index.html");
      System.out.println("  --port PORT       Use a specific localhost port; default is automatic");
      System.out.println("  --no-open         Do not open the browser automatically");
      System.out.println("  --headless        Do not install the tray icon or launcher window");
      System.exit(0);
    }
  }
}
