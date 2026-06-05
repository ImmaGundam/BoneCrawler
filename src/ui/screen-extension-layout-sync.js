(function () {
  var root = document.documentElement;
  var shell = document.querySelector('.bc-play-shell');
  var nav = shell && shell.querySelector('.screen-extension-nav');
  var statusPanel = document.getElementById('screenExtensionPanel');
  if (!shell || !nav || !statusPanel) return;

  var isMobile = root.classList.contains('mobile-browser');
  if (isMobile) {
    shell.style.removeProperty('--bc-game-size-sync');
    return;
  }

  var rafId = 0;
  var timeoutId = 0;

  function syncLayout() {
    rafId = 0;

    if (window.matchMedia('(max-width: 719px)').matches) {
      shell.style.removeProperty('--bc-game-size-sync');
      return;
    }

    var shellStyles = window.getComputedStyle(shell);
    var gap = parseFloat(shellStyles.getPropertyValue('--bc-gap')) || 12;
    var panelWidth = Math.ceil(statusPanel.getBoundingClientRect().width || 286);
    var navHeight = Math.ceil(nav.getBoundingClientRect().height || 0);
    var viewportWidthCap = Math.floor(window.innerWidth * 0.96);
    var viewportHeightCap = Math.floor(window.innerHeight - navHeight - 120);
    var availableWidth = Math.floor(viewportWidthCap - panelWidth - gap);
    var desired = Math.ceil(statusPanel.scrollHeight + 2);
    var target = Math.max(360, Math.min(desired, availableWidth, viewportHeightCap, 860));

    if (!Number.isFinite(target) || target <= 0) return;
    shell.style.setProperty('--bc-game-size-sync', target + 'px');
  }

  function queueSync() {
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(function () {
      timeoutId = 0;
      if (rafId) return;
      rafId = window.requestAnimationFrame(syncLayout);
    }, 90);
  }

  window.addEventListener('resize', queueSync, { passive: true });
  window.addEventListener('orientationchange', queueSync, { passive: true });
  document.addEventListener('DOMContentLoaded', queueSync);
  window.addEventListener('load', queueSync);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(queueSync).catch(function () {});
  }

  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(queueSync);
    observer.observe(statusPanel);
    observer.observe(nav);
    observer.observe(shell);
  }

  if ('MutationObserver' in window) {
    var mutationObserver = new MutationObserver(queueSync);
    mutationObserver.observe(statusPanel, { childList: true, subtree: true, characterData: true, attributes: true });
  }

  queueSync();
})();
