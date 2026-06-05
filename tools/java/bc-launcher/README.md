# BoneCrawler JDK + JCEF Launcher

JDK launcher for packaging BoneCrawler as a Windows app with `jpackage`.

The launcher starts a locked `127.0.0.1` HTTP server, serves the bundled game files, and embeds the game inside a Swing-hosted JCEF/Chromium window instead of opening the user's normal browser session.

On launch, the host issues a per-run token cookie to the embedded game session. Static files and native runtime endpoints require that token. The game UI can call the runtime either through same-origin HTTP endpoints or through the embedded `window.cefQuery(...)` bridge exposed by JCEF.

Runtime endpoints:

- `GET /__bc_runtime/status`
- `POST /__bc_runtime/reload`
- `POST /__bc_runtime/stop`
- `POST /__bc_runtime/hide`
- `POST /__bc_runtime/open-package-folder`

Embedded bridge requests:

- `runtime:GET:/status`
- `runtime:POST:/reload`
- `runtime:POST:/stop`
- `runtime:POST:/hide`
- `runtime:POST:/open-package-folder`

## Runtime Stack

- `JDK` for compile, runtime image, and packaging
- `Swing` for the native launcher window and shell
- `JCEF` for the embedded Chromium game view
- `jpackage` for Windows app-image / installer output

## Requirements

- JDK 17 or newer for `jpackage`.
- JDK 21 LTS or JDK 26 works. The Windows script auto-detects `C:\Program Files\Java\latest` and `jdk-*` installs.
- Apache Maven. If Maven is not already installed, the Windows package script downloads a local copy into `tools/java/bc-launcher/.cache`.
- Windows installer output (`--type exe`) may require WiX Toolset. App-image output does not.

## Build the Native App Image

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File tools/java/bc-launcher/scripts/package-windows.ps1
```

If PATH still points at an older JDK:

```powershell
powershell -ExecutionPolicy Bypass -File tools/java/bc-launcher/scripts/package-windows.ps1 -JdkHome "C:\Program Files\Java\jdk-26.0.1"
```

Output:

```text
dist/native/BoneCrawler/BoneCrawler.exe
```

If `assets/icon.ico` exists, the script passes it to `jpackage` for the Windows executable and Explorer app icon.

## Useful Launcher Args

- `--game-root PATH` serves a specific folder containing `index.html`.
- `--port PORT` uses a fixed localhost port instead of an automatic one.
- `--no-open` starts the server without opening a browser fallback.
- `--headless` skips the tray icon and branded launcher window.
