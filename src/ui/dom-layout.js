// Dom-layout.js
// Purpose: Canvas/DOM references, display zoom, side panels, collapsible panels,
// responsive shell layout, and non-game UI handlers.

// ── Canvas ────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const screenWrapHolder = document.getElementById('screenWrapHolder');
const screenWrap = document.getElementById('screenWrap');
const playerShell = document.getElementById('playerShell');
const playerMenuLeft = document.getElementById('playerMenuLeft');
const playerMenuRight = document.getElementById('playerMenuRight');
const playerMenus = [playerMenuLeft, playerMenuRight].filter(Boolean);
const zoomStrip = document.getElementById('zoomStrip');
const playerStageEl = document.querySelector('.player-stage');
const playerPageFooter = document.querySelector('.player-page-footer');
const playerPageFooterInner = document.querySelector('.player-page-footer-inner');
const playerFooterDismiss = document.getElementById('playerFooterDismiss');
const desktopTitlebarEl = document.getElementById('desktopTitlebar');
const aboutPanel = document.getElementById('aboutPanel');
const aboutPanelTitle = aboutPanel ? aboutPanel.querySelector('.player-card-title') : null;
const aboutExpandBtn = document.getElementById('aboutExpandBtn');
const aboutNormalBtn = document.getElementById('aboutNormalBtn');
const zoomCollapse = document.getElementById('zoomCollapse');
const aboutPanelCollapse = document.getElementById('aboutPanelCollapse');
const zoomDismiss = document.getElementById('zoomDismiss');
const aboutPanelDismiss = document.getElementById('aboutPanelDismiss');
const zoomButtons = Array.from(document.querySelectorAll('.zoom-btn[data-zoom]'));
const DISPLAY_ZOOM_MIN = 1;
const DISPLAY_ZOOM_MAX = 3;
const DISPLAY_ZOOM_STEP = 0.25;
const DISPLAY_ZOOM_KEY = 'bonecrawler_display_zoom';
let displayZoom = 1;
const howToPlayPanel = document.getElementById('howToPlayPanel');
const panelDismiss = document.getElementById('panelDismiss');
const howToPlayCollapseBtn = document.getElementById('howToPlayCollapseBtn');
const howToPlaySummary = howToPlayPanel ? howToPlayPanel.querySelector('summary') : null;
const howToPlayExpandBtn = document.getElementById('howToPlayExpandBtn');
const howToPlayNormalBtn = document.getElementById('howToPlayNormalBtn');
const touchPauseBtn = document.getElementById('touchPauseBtn');
const touchInteractBtn = document.getElementById('touchInteractBtn');
const touchDodgeBtn = document.getElementById('touchDodgeBtn');
const nameModalOverlay = document.getElementById('nameModalOverlay');
const nameModalInput = document.getElementById('nameModalInput');
const nameModalOk = document.getElementById('nameModalOk');
const nameModalCancel = document.getElementById('nameModalCancel');
const touchUiAvailable = (() => {
  if (document.documentElement.classList.contains('mobile-browser')) return true;
  if (document.documentElement.classList.contains('desktop-browser')) return false;
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|iPhone|iPad|iPod|IEMobile|BlackBerry|Opera Mini|Mobile|Tablet/i.test(ua);
  const iPadOS = /Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  const coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const noHover = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
  const touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  return (mobileUA || iPadOS) && (touch || coarse || noHover);
})();
let lastTouchPauseUiState = '';
const PLAYER_SHELL_MIN_SIDE_WIDTH = 220;
const PLAYER_SHELL_MAX_SIDE_WIDTH = 292;
const PLAYER_SHELL_GAP = 18;
const PLAYER_SHELL_STACK_ENTER_BUFFER = 8;
const PLAYER_SHELL_STACK_EXIT_BUFFER = 40;
let playerShellLayoutFrame = 0;
let playerShellPostLayoutFrame = 0;

function setCardCollapsed(card, isCollapsed){
  if(!card) return;
  card.classList.toggle('collapsed', !!isCollapsed);
}
function setHowToPlayCollapsed(isCollapsed){
  if(!howToPlayPanel) return;
  const collapsed = !!isCollapsed;
  if(collapsed) setHowToPlayMaximized(false);
  howToPlayPanel.classList.toggle('collapsed', collapsed);
  howToPlayPanel.open = true;
  howToPlayPanel.setAttribute('open', '');
}
function syncCollapseButtonState(button, isCollapsed, collapseLabel, expandLabel){
  if(!button) return;
  const collapsed = !!isCollapsed;
  const nextLabel = collapsed ? (expandLabel || 'Expand panel') : (collapseLabel || 'Minimize panel');
  button.textContent = collapsed ? '+' : '−';
  button.setAttribute('aria-label', nextLabel);
  button.setAttribute('title', nextLabel);
  button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}
function syncPanelControlState(){
  syncCollapseButtonState(zoomCollapse, !!(zoomStrip && zoomStrip.classList.contains('collapsed')), 'Minimize Display Zoom', 'Expand Display Zoom');
  syncCollapseButtonState(aboutPanelCollapse, !!(aboutPanel && aboutPanel.classList.contains('collapsed')), 'Minimize About & Controls', 'Expand About & Controls');
  syncCollapseButtonState(howToPlayCollapseBtn, !!(howToPlayPanel && howToPlayPanel.classList.contains('collapsed')), 'Minimize How to Play', 'Expand How to Play');
}

function clampDisplayZoom(value){
  const numeric = Number(value);
  if(!Number.isFinite(numeric)) return 1;
  const clamped = Math.min(DISPLAY_ZOOM_MAX, Math.max(DISPLAY_ZOOM_MIN, numeric));
  return Math.round(clamped / DISPLAY_ZOOM_STEP) * DISPLAY_ZOOM_STEP;
}

function nudgeDisplayZoom(direction){
  const step = direction > 0 ? DISPLAY_ZOOM_STEP : -DISPLAY_ZOOM_STEP;
  const nextZoom = clampDisplayZoom(displayZoom + step);
  if(nextZoom === displayZoom) return;
  setDisplayZoom(nextZoom);
}
function resetDisplayZoom(){
  if(displayZoom === DISPLAY_ZOOM_MIN) return;
  setDisplayZoom(DISPLAY_ZOOM_MIN);
}
function getPlayerStageWidth(){
  if(!screenWrapHolder || !screenWrap) return 0;
  const styledWidth = Number.parseFloat(screenWrapHolder.style.width || '0');
  if(Number.isFinite(styledWidth) && styledWidth > 0) return Math.ceil(styledWidth);
  const holderRectWidth = screenWrapHolder.getBoundingClientRect().width;
  if(holderRectWidth > 0) return Math.ceil(holderRectWidth);
  return Math.ceil((screenWrap.offsetWidth || 0) * displayZoom);
}
function getMenuZoomForDisplayZoom(){
  // Let the game canvas grow normally, but keep the desktop side panels compact
  // so they do not get forced underneath the game at a higher display zoom.
  const scaled = 1 + ((displayZoom || 1) - 1) * 0.25;
  return Math.min(1.22, Math.max(1, scaled));
}
function getDesiredSidePanelWidth(stageWidth){
  const safeStageWidth = Math.max(0, Math.ceil(stageWidth || 0));
  if(!safeStageWidth) return PLAYER_SHELL_MIN_SIDE_WIDTH;
  const menuZoom = getMenuZoomForDisplayZoom();
  const preferred = Math.ceil(PLAYER_SHELL_MIN_SIDE_WIDTH * menuZoom);
  return Math.min(safeStageWidth, Math.max(PLAYER_SHELL_MIN_SIDE_WIDTH, Math.min(PLAYER_SHELL_MAX_SIDE_WIDTH, preferred)));
}
function syncShellSizingVars(stageWidth){
  const safeStageWidth = Math.max(0, Math.ceil(stageWidth || getPlayerStageWidth() || 0));
  const sideWidth = getDesiredSidePanelWidth(safeStageWidth);
  const menuZoom = getMenuZoomForDisplayZoom();
  if(playerShell){
    playerShell.style.setProperty('--player-stage-width', safeStageWidth + 'px');
    playerShell.style.setProperty('--player-side-width', sideWidth + 'px');
    playerShell.style.setProperty('--menu-zoom', String(menuZoom));
  }
  document.documentElement.style.setProperty('--player-stage-width', safeStageWidth + 'px');
  document.documentElement.style.setProperty('--player-side-width', sideWidth + 'px');
  document.documentElement.style.setProperty('--menu-zoom', String(menuZoom));
  if(zoomStrip){
    zoomStrip.style.width = safeStageWidth + 'px';
    zoomStrip.style.maxWidth = '100%';
  }
  return sideWidth;
}
let equalPanelHeightsFrame = 0;
let equalPanelHeightLock = 0;
function clearEqualPanelHeightStyles(){
  document.documentElement.style.removeProperty('--player-equal-panel-min-height');
  if(aboutPanel) aboutPanel.style.minHeight = '';
  if(howToPlayPanel) howToPlayPanel.style.minHeight = '';
}
function panelsCanShareEqualHeight(){
  return !!(
    aboutPanel && howToPlayPanel &&
    playerMenuLeft && !playerMenuLeft.classList.contains('is-hidden') &&
    playerMenuRight && !playerMenuRight.classList.contains('is-hidden') &&
    !aboutPanel.classList.contains('is-hidden') &&
    !howToPlayPanel.classList.contains('info-panel-hidden') &&
    !aboutPanel.classList.contains('panel-maximized') &&
    !howToPlayPanel.classList.contains('panel-maximized')
  );
}
function updateEqualPanelHeightLock(){
  if(!panelsCanShareEqualHeight()) return;
  if(aboutPanel.classList.contains('collapsed') || howToPlayPanel.classList.contains('collapsed')) return;
  aboutPanel.style.minHeight = '';
  howToPlayPanel.style.minHeight = '';
  const aboutHeight = Math.ceil(aboutPanel.getBoundingClientRect().height || 0);
  const howToPlayHeight = Math.ceil(howToPlayPanel.getBoundingClientRect().height || 0);
  const nextHeight = Math.max(aboutHeight, howToPlayHeight, 0);
  if(nextHeight > 0){
    equalPanelHeightLock = nextHeight;
  }
}
function applyEqualPanelHeightLock(){
  if(!aboutPanel || !howToPlayPanel){
    clearEqualPanelHeightStyles();
    return;
  }
  clearEqualPanelHeightStyles();
  if(!panelsCanShareEqualHeight() || !equalPanelHeightLock){
    return;
  }
  document.documentElement.style.setProperty('--player-equal-panel-min-height', equalPanelHeightLock + 'px');
  const aboutCollapsed = aboutPanel.classList.contains('collapsed');
  const howCollapsed = howToPlayPanel.classList.contains('collapsed');
  if(!aboutCollapsed){
    aboutPanel.style.minHeight = 'var(--player-equal-panel-min-height)';
  }
  if(!howCollapsed){
    howToPlayPanel.style.minHeight = 'var(--player-equal-panel-min-height)';
  }
}
function syncEqualPanelHeights(){
  updateEqualPanelHeightLock();
  applyEqualPanelHeightLock();
}
function queueEqualPanelHeights(){
  if(equalPanelHeightsFrame) cancelAnimationFrame(equalPanelHeightsFrame);
  equalPanelHeightsFrame = requestAnimationFrame(()=>{
    equalPanelHeightsFrame = 0;
    syncEqualPanelHeights();
  });
}

function queuePlayerShellLayout(){
  if(playerShellLayoutFrame) cancelAnimationFrame(playerShellLayoutFrame);
  playerShellLayoutFrame = requestAnimationFrame(()=>{
    playerShellLayoutFrame = 0;
    syncPlayerShellLayout();
  });
}
function queuePostShellLayoutZoomSync(){
  if(playerShellPostLayoutFrame) cancelAnimationFrame(playerShellPostLayoutFrame);
  playerShellPostLayoutFrame = requestAnimationFrame(()=>{
    playerShellPostLayoutFrame = 0;
    syncDisplayZoomLayout();
  });
}
function syncPlayerShellLayout(){
  if(!playerShell || !screenWrapHolder) return;
  const leftHidden = !playerMenuLeft || playerMenuLeft.classList.contains('is-hidden');
  const rightHidden = !playerMenuRight || playerMenuRight.classList.contains('is-hidden');
  const stageWidth = getPlayerStageWidth();
  const parentWidth = Math.ceil((playerShell.parentElement && playerShell.parentElement.clientWidth) || document.documentElement.clientWidth || window.innerWidth || 0);
  const shellWidth = Math.max(0, parentWidth);
  const sidePanelWidth = syncShellSizingVars(stageWidth);
  const leftWidth = leftHidden ? 0 : sidePanelWidth;
  const rightWidth = rightHidden ? 0 : sidePanelWidth;
  const visibleMenuCount = (leftHidden ? 0 : 1) + (rightHidden ? 0 : 1);
  const required = stageWidth + leftWidth + rightWidth + (PLAYER_SHELL_GAP * visibleMenuCount);
  playerShell.style.setProperty('--player-shell-required-width', required + 'px');
  const wasStacked = playerShell.classList.contains('stack-game');
  let shouldStack = false;

  if(visibleMenuCount > 0){
    const enterStackAt = required + PLAYER_SHELL_STACK_ENTER_BUFFER;
    const exitStackAt = required + PLAYER_SHELL_STACK_EXIT_BUFFER;
    shouldStack = wasStacked ? (shellWidth < exitStackAt) : (shellWidth <= enterStackAt);
  }

  playerShell.classList.toggle('stack-game', shouldStack);

  if(wasStacked !== shouldStack){
    queuePostShellLayoutZoomSync();
  }
  queueEqualPanelHeights();
  syncDesktopMinimumWindowSize();
}

function syncPlayerMenuVisibility(){
  if(playerMenuLeft){
    const leftVisiblePanels = [
      aboutPanel && !aboutPanel.classList.contains('is-hidden')
    ].filter(Boolean).length;
    playerMenuLeft.classList.toggle('is-hidden', leftVisiblePanels===0);
  }

  if(playerMenuRight){
    const rightVisiblePanels = [
      howToPlayPanel && !howToPlayPanel.classList.contains('info-panel-hidden')
    ].filter(Boolean).length;
    playerMenuRight.classList.toggle('is-hidden', rightVisiblePanels===0);
  }

  queuePlayerShellLayout();
}
function setHowToPlayMaximized(isMaximized){
  if(!howToPlayPanel) return;
  const maximized = !!isMaximized;
  howToPlayPanel.classList.toggle('panel-maximized', maximized);
  if(playerMenuRight) playerMenuRight.classList.toggle('has-floating-panel', maximized);
  if(maximized){
    setHowToPlayCollapsed(false);
    howToPlayPanel.open = true;
    howToPlayPanel.setAttribute('open', '');
  }
  if(howToPlayExpandBtn) howToPlayExpandBtn.classList.toggle('hidden', maximized);
  if(howToPlayNormalBtn) howToPlayNormalBtn.classList.toggle('hidden', !maximized);
  syncPanelControlState();
}
function setAboutMaximized(isMaximized){
  if(!aboutPanel) return;
  const maximized = !!isMaximized;
  aboutPanel.classList.toggle('panel-maximized', maximized);
  if(playerMenuLeft) playerMenuLeft.classList.toggle('has-floating-panel', maximized);
  if(aboutExpandBtn) aboutExpandBtn.classList.toggle('hidden', maximized);
  if(aboutNormalBtn) aboutNormalBtn.classList.toggle('hidden', !maximized);
  syncPanelControlState();
}
function syncDisplayZoomLayout(){
  if(!screenWrap || !screenWrapHolder) return;
  const baseWidth = Math.ceil(screenWrap.offsetWidth || 0);
  const baseHeight = Math.ceil(screenWrap.offsetHeight || 0);
  const scaledWidth = Math.ceil(baseWidth * displayZoom);
  const scaledHeight = Math.ceil(baseHeight * displayZoom);
  screenWrapHolder.style.width = scaledWidth+'px';
  screenWrapHolder.style.height = scaledHeight+'px';
  syncShellSizingVars(scaledWidth);
  // Keep the lower strip locked to the visible game width so it stays aligned with the stage.
  if(zoomStrip){ zoomStrip.style.width = scaledWidth+'px'; zoomStrip.style.maxWidth = '100%'; }
  const panelHeight = Math.min(Math.max(260, scaledHeight), 420);
  document.documentElement.style.setProperty('--player-panel-max-height', panelHeight+'px');
  queuePlayerShellLayout();
}

function syncDesktopMinimumWindowSize(){
  const desktopApi = window.bonecrawlerDesktop;
  if(!desktopApi || !desktopApi.isDesktop || !desktopApi.setMinimumWindowSize) return;
  if(!screenWrapHolder) return;

  const bodyStyles = window.getComputedStyle(document.body);
  const bodyPadLeft = Number.parseFloat(bodyStyles.paddingLeft || '0') || 0;
  const bodyPadRight = Number.parseFloat(bodyStyles.paddingRight || '0') || 0;
  const bodyPadTop = Number.parseFloat(bodyStyles.paddingTop || '0') || 0;
  const bodyPadBottom = Number.parseFloat(bodyStyles.paddingBottom || '0') || 0;

  const stageWidth = Math.ceil(getPlayerStageWidth() || screenWrapHolder.getBoundingClientRect().width || 0);
  const zoomWidth = Math.ceil((zoomStrip && !zoomStrip.classList.contains('is-hidden')) ? zoomStrip.getBoundingClientRect().width : 0);
  const footerVisible = !!(playerPageFooter && !playerPageFooter.classList.contains('is-hidden'));
  const footerWidth = Math.ceil((footerVisible && playerPageFooterInner) ? playerPageFooterInner.getBoundingClientRect().width : 0);

  const contentWidth = Math.max(stageWidth, zoomWidth, footerWidth, 360);
  const minWidth = Math.ceil(contentWidth + bodyPadLeft + bodyPadRight + 24);

  const stageHeight = Math.ceil(screenWrapHolder.getBoundingClientRect().height || 0);
  const stageGap = Math.ceil(playerStageEl ? (Number.parseFloat(window.getComputedStyle(playerStageEl).gap || '0') || 0) : 0);
  const zoomHeight = Math.ceil((zoomStrip && !zoomStrip.classList.contains('is-hidden')) ? zoomStrip.getBoundingClientRect().height : 0);
  const footerHeight = Math.ceil(footerVisible && playerPageFooter ? playerPageFooter.getBoundingClientRect().height : 0);
  const footerMarginTop = Math.ceil(footerVisible && playerPageFooter ? (Number.parseFloat(window.getComputedStyle(playerPageFooter).marginTop || '0') || 0) : 0);
  const titlebarHeight = Math.ceil((desktopTitlebarEl && window.getComputedStyle(desktopTitlebarEl).display !== 'none') ? desktopTitlebarEl.getBoundingClientRect().height : 0);

  const minHeight = Math.ceil(
    titlebarHeight +
    stageHeight +
    (zoomHeight ? stageGap : 0) +
    zoomHeight +
    footerMarginTop +
    footerHeight +
    bodyPadTop +
    bodyPadBottom +
    18
  );

  desktopApi.setMinimumWindowSize(minWidth, minHeight);
}

function setDisplayZoom(value, persist=true){
  displayZoom = clampDisplayZoom(value);
  document.documentElement.style.setProperty('--game-zoom', String(displayZoom));
  if(zoomButtons.length){
    const currentZoom = Math.round(displayZoom * 100);
    zoomButtons.forEach((btn)=>{
      const btnZoom = Number(btn.dataset.zoom || '0');
      const isActive = btnZoom === currentZoom;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }
  syncDisplayZoomLayout();
  if(persist){
    try{ localStorage.setItem(DISPLAY_ZOOM_KEY, String(displayZoom)); }catch(_err){}
  }
}
const savedDisplayZoom = (()=>{
  try{ return clampDisplayZoom(Number(localStorage.getItem(DISPLAY_ZOOM_KEY)||'1')); }catch(_err){ return 1; }
})();
if(zoomButtons.length){
  zoomButtons.forEach((btn)=>{
    btn.addEventListener('click', ()=>{
      const targetZoom = Number(btn.dataset.zoom || '100') / 100;
      setDisplayZoom(targetZoom);
    });
  });
}

document.addEventListener('wheel', (event)=>{
  if(!(event.ctrlKey || event.metaKey)) return;
  const target = event.target;
  if(target && target.closest && target.closest('input,textarea,select,[contenteditable="true"]')) return;
  event.preventDefault();
  nudgeDisplayZoom(event.deltaY < 0 ? 1 : -1);
}, { passive:false });

document.addEventListener('keydown', (event)=>{
  if(!(event.ctrlKey || event.metaKey)) return;
  const target = event.target;
  if(target && target.closest && target.closest('input,textarea,select,[contenteditable="true"]')) return;
  const key = String(event.key || '');
  if(key === '+' || key === '=' || key === 'Add'){
    event.preventDefault();
    nudgeDisplayZoom(1);
    return;
  }
  if(key === '-' || key === '_' || key === 'Subtract'){
    event.preventDefault();
    nudgeDisplayZoom(-1);
    return;
  }
  if(key === '0' || key === 'Digit0'){
    event.preventDefault();
    resetDisplayZoom();
  }
});
window.addEventListener('resize', ()=>{ syncDisplayZoomLayout(); syncPlayerMenuVisibility(); queuePlayerShellLayout(); });
setDisplayZoom(savedDisplayZoom, false);
setHowToPlayMaximized(false);
setAboutMaximized(false);
syncPlayerMenuVisibility();
syncPlayerShellLayout();
// Force a second pass after initial paint so the menu snaps under the game immediately on narrow widths
requestAnimationFrame(()=>{ syncDisplayZoomLayout(); syncPlayerMenuVisibility(); syncPlayerShellLayout(); });

syncPanelControlState();
function shouldIgnorePanelHeaderToggle(target){
  return !!(target && target.closest && target.closest('button,a,input,textarea,select,label,[role="button"]'));
}
function controlsHeaderWasClicked(ev){
  if(!aboutPanel) return false;
  const target = ev && ev.target;
  if(shouldIgnorePanelHeaderToggle(target)) return false;
  if(aboutPanel.classList.contains('collapsed')) return true;
  if(aboutPanelTitle && aboutPanelTitle.contains(target)) return true;
  const rect = aboutPanel.getBoundingClientRect();
  const titleRect = aboutPanelTitle ? aboutPanelTitle.getBoundingClientRect() : rect;
  const headerBottom = Math.max(titleRect.bottom, rect.top + 44);
  return (ev.clientY || 0) <= headerBottom;
}
if(zoomCollapse && zoomStrip){
  zoomCollapse.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    setCardCollapsed(zoomStrip, !zoomStrip.classList.contains('collapsed'));
    syncPanelControlState();
    queuePlayerShellLayout();
  });
}
if(aboutPanelCollapse && aboutPanel){
  aboutPanelCollapse.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    setCardCollapsed(aboutPanel, !aboutPanel.classList.contains('collapsed'));
    syncPanelControlState();
    queuePlayerShellLayout();
  });
}
if(aboutPanel){
  aboutPanel.addEventListener('click', (ev)=>{
    if(!controlsHeaderWasClicked(ev)) return;
    ev.preventDefault();
    setCardCollapsed(aboutPanel, !aboutPanel.classList.contains('collapsed'));
    syncPanelControlState();
    queuePlayerShellLayout();
  });
}
if(howToPlayPanel){
  howToPlayPanel.open = true;
  howToPlayPanel.setAttribute('open', '');
}
if(howToPlaySummary){
  howToPlaySummary.addEventListener('click', (ev)=>{
    ev.preventDefault();
    if(ev.target && ev.target.closest && ev.target.closest('button')) return;
    setHowToPlayCollapsed(!howToPlayPanel.classList.contains('collapsed'));
    syncPanelControlState();
    queuePlayerShellLayout();
  });
}
if(howToPlayCollapseBtn && howToPlayPanel){
  howToPlayCollapseBtn.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    setHowToPlayCollapsed(!howToPlayPanel.classList.contains('collapsed'));
    syncPanelControlState();
    queuePlayerShellLayout();
  });
}
if(howToPlayExpandBtn){
  howToPlayExpandBtn.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    setHowToPlayMaximized(true);
  });
}
if(howToPlayNormalBtn){
  howToPlayNormalBtn.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    setHowToPlayMaximized(false);
  });
}
if(aboutExpandBtn){
  aboutExpandBtn.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    setAboutMaximized(true);
  });
}
if(aboutNormalBtn){
  aboutNormalBtn.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    setAboutMaximized(false);
  });
}
panelDismiss.addEventListener('click', (ev)=>{
  ev.preventDefault();
  ev.stopPropagation();
  setHowToPlayMaximized(false);
  setHowToPlayCollapsed(false);
  howToPlayPanel.classList.add('info-panel-hidden');
  syncPanelControlState();
  syncPlayerMenuVisibility();
});

if(zoomDismiss){
  zoomDismiss.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    zoomStrip.classList.add('is-hidden');
    syncPanelControlState();
    syncPlayerMenuVisibility();
  });
}

if(playerFooterDismiss && playerPageFooter){
  playerFooterDismiss.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    playerPageFooter.classList.add('is-hidden');
    syncDesktopMinimumWindowSize();
  });
}

if(aboutPanelDismiss){
  aboutPanelDismiss.addEventListener('click', (ev)=>{
    ev.preventDefault();
    ev.stopPropagation();
    aboutPanel.classList.add('is-hidden');
    syncPanelControlState();
    syncPlayerMenuVisibility();
  });
}
