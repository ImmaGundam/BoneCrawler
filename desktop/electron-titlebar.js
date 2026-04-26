// BoneCrawler safe split module
// Purpose: Electron-only custom titlebar wiring for packaged desktop distribution. Not required for web gameplay.
// Source: app.js lines 1-24
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Electron titlebar wiring ──────────────────────────────────────
(function(){
  const bar = document.getElementById('electron-titlebar');
  if (!bar || !window.electronAPI) return;
  bar.classList.add('visible');
  document.body.classList.add('has-titlebar');
  const minBtn   = document.getElementById('etbMin');
  const maxBtn   = document.getElementById('etbMax');
  const closeBtn = document.getElementById('etbClose');
  const maxIcon  = document.getElementById('etbMaxIcon');
  if (minBtn)   minBtn.addEventListener('click',   () => window.electronAPI.minimize());
  if (closeBtn) closeBtn.addEventListener('click',  () => window.electronAPI.close());
  if (maxBtn) {
    maxBtn.addEventListener('click', async () => {
      const isMax = await window.electronAPI.toggleMaximize();
      if (maxIcon) {
        maxIcon.innerHTML = isMax
          ? '<rect x="3" y="1.5" width="5.5" height="5.5" rx="0.5"/><rect x="1.5" y="3" width="5.5" height="5.5" rx="0.5"/>'
          : '<rect x="1.5" y="1.5" width="7" height="7" rx="0.5"/>';
      }
    });
  }
})();

