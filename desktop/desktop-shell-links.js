// BoneCrawler safe split module
// Purpose: Electron-only desktop shell controls and external-link routing for packaged app.
// Source: app.js lines 7620-7689
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

(function(){
  const desktopApi = window.bonecrawlerDesktop;
  if(!desktopApi || !desktopApi.isDesktop) return;

  document.body.classList.add('desktop-has-titlebar');

  const titlebar = document.getElementById('desktopTitlebar');
  const minBtn = document.getElementById('desktopMinBtn');
  const maxBtn = document.getElementById('desktopMaxBtn');
  const closeBtn = document.getElementById('desktopCloseBtn');

  if(titlebar){
    titlebar.setAttribute('aria-hidden', 'false');
  }

  const applyWindowState = (state = {}) => {
    const isMaximized = !!state.isMaximized;
    const isFullScreen = !!state.isFullScreen;
    if (maxBtn) {
      maxBtn.textContent = isMaximized ? '❐' : '□';
      maxBtn.setAttribute('aria-label', isMaximized ? 'Restore' : 'Maximize');
    }
    document.body.classList.toggle('desktop-is-fullscreen', isFullScreen);
  };

  if (minBtn) {
    minBtn.addEventListener('click', () => desktopApi.minimizeWindow && desktopApi.minimizeWindow());
  }
  if (maxBtn) {
    maxBtn.addEventListener('click', () => desktopApi.toggleMaximizeWindow && desktopApi.toggleMaximizeWindow());
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => desktopApi.closeWindow && desktopApi.closeWindow());
  }

  if (desktopApi.getWindowState) {
    desktopApi.getWindowState().then(applyWindowState).catch(() => {});
  }
  if (desktopApi.onWindowState) {
    desktopApi.onWindowState(applyWindowState);
  }

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('data:')) return;
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor) return;

    const rawHref = anchor.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('data:')) return;

    event.preventDefault();

    let resolvedHref = rawHref;
    try {
      resolvedHref = new URL(rawHref, window.location.href).toString();
    } catch (_error) {}

    if (desktopApi.openLink) {
      desktopApi.openLink(resolvedHref);
    } else {
      window.open(resolvedHref, '_blank', 'noopener');
    }
  }, true);
})();
