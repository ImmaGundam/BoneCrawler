import { createAppRoot } from './platform/app-root.js';
import { ensureGameRuntimeApi } from './platform/runtime-api.js';
import { loadScriptsSequentially } from './platform/script-loader.js';
import { engineManifest } from './engine/manifest.js';
import { gameManifest } from './game/manifest.js';
import { uiManifest } from './ui/manifest.js';
import { platformManifest } from './platform/manifest.js';
import { editorManifest } from './editor/manifest.js';

const runtimeApi = ensureGameRuntimeApi();
const app = createAppRoot();
runtimeApi.register('app', app, { legacy: ['BoneCrawlerApp'] });
app.services.gameRuntime = runtimeApi;
app.runtime.namespace = 'GameRuntime';
app.runtime.legacyNamespace = 'BoneCrawler';

await loadScriptsSequentially(['src/platform/game-package-loader.js'], {
  tag: 'package',
  continueOnError: true,
  onLoad(path) {
    app.runtime.loadedScripts.push(path);
  },
  onError(path, error) {
    app.runtime.failedScripts.push({ path, message: error && error.message ? error.message : String(error) });
  },
});

const manifests = [
  { name: 'engine', files: engineManifest, enabled: true },
  { name: 'platform', files: platformManifest, enabled: true },
  { name: 'game', files: gameManifest, enabled: true },
  { name: 'editor', files: editorManifest, enabled: true },
  { name: 'ui', files: uiManifest, enabled: true },
];

for (const manifest of manifests) {
  if (!manifest.enabled) continue;
  app.runtime.loadedManifests.push(manifest.name);
  await loadScriptsSequentially(manifest.files, {
    tag: manifest.name,
    continueOnError: true,
    onLoad(path) {
      app.runtime.loadedScripts.push(path);
    },
    onError(path, error) {
      app.runtime.failedScripts.push({ path, message: error && error.message ? error.message : String(error) });
    },
  });
}

app.runtime.isReady = true;
window.dispatchEvent(new CustomEvent('bonecrawler-app-ready', { detail: { app } }));
window.dispatchEvent(new CustomEvent('game-runtime-ready', { detail: { app, runtime: runtimeApi } }));
if (typeof window.BoneCrawlerBoot === 'function') {
  try { window.BoneCrawlerBoot(app); } catch (error) { console.error('[BoneCrawler] boot hook failed', error); }
}
