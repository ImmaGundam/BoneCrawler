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


// BoneCrawler safe split module
// Purpose: Base constants, logical canvas size, color palette, pixel sprite tables.
// Source: app.js lines 25-332
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ================================================================
//  BONECRAWLER  ·  120×120 logic  ·  2× render (240×240 canvas)
// ================================================================
const SCALE = 2;
const GW = 120, GH = 120;
const PX = 4, PY = 17, PW = 112, PH = 99;

const C = {
  BG:'#090704',
  FL:'#2a1c0c', FL2:'#221408', FL3:'#321e0e',
  W1:'#314339', W2:'#243229', W3:'#161f19', WH:'#5a7060',
  BN1:'#d4c89a', BN2:'#a89870', BN3:'#6a5838',
  SI1:'#bcccd6', SI2:'#7a8ea0', SI3:'#3c4e60',
  DK:'#0c0a06',
  TB:'#6a3820', TB2:'#4a2810',
  FR1:'#ff8c34', FR2:'#c44118',
  GR:'#5aa57b',
  BLD:'#5a1a10',
  SH:'#88c8ff',   // shield blue
  SH2:'#3388cc',  // shield dark
  RD:'#cc2200',   // hurt flash
  HP1:'#ff9ca8',  // heart highlight
  HP2:'#e24b5b',  // heart mid
  HP3:'#7a2031',  // heart dark
  MG:'#9040d0',   // magic purple (wizard)
  MG2:'#d080ff',  // magic light
  MG3:'#50108a',  // magic dark
  FB:'#ff8000',   // fireball orange
  FB2:'#ffdd00',  // fireball yellow core
};

const PAL = [
  null,   // 0 transparent
  C.BN1,  // 1 bright bone
  C.BN2,  // 2 mid bone
  C.BN3,  // 3 dark bone
  C.SI1,  // 4 bright silver
  C.SI2,  // 5 mid silver
  C.SI3,  // 6 dark silver
  C.DK,   // 7 near black
  C.TB,   // 8 tabard brown
  C.TB2,  // 9 dark tabard
  C.W1,   // 10 stone mid
  C.W2,   // 11 stone dark
  C.FR1,  // 12 fire bright / gold
  C.FR2,  // 13 fire dark
  C.GR,   // 14 green glow
  C.WH,   // 15 wall highlight
  C.BLD,  // 16 blood/rust
  C.HP1,  // 17 heart highlight
  C.HP2,  // 18 heart mid
  C.HP3,  // 19 heart dark
  C.MG,   // 20 magic purple
  C.MG2,  // 21 magic light
  C.MG3,  // 22 magic dark
];

const S = {
  plrD:[
    [0,0,4,4,4,4,0,0],[0,4,5,7,7,5,4,0],[0,4,4,5,5,4,4,0],[4,5,5,5,5,5,5,4],
    [0,8,5,9,9,5,8,0],[0,9,8,8,8,8,9,0],[0,5,6,0,0,6,5,0],[0,0,5,0,0,5,0,0],
  ],
  plrU:[
    [0,0,4,4,4,4,0,0],[0,4,5,5,5,5,4,0],[0,4,4,5,5,4,4,0],[4,5,5,5,5,5,5,4],
    [0,8,5,5,5,5,8,0],[0,9,8,8,8,8,9,0],[0,5,6,0,0,6,5,0],[0,0,5,0,0,5,0,0],
  ],
  plrR:[
    [0,0,4,4,4,0,0,0],[0,4,5,7,4,0,0,0],[0,4,5,5,4,4,0,0],[0,4,5,5,5,5,4,0],
    [0,8,5,9,5,5,0,0],[0,9,8,8,8,0,0,0],[0,5,6,0,5,5,0,0],[0,0,5,0,0,5,0,0],
  ],
  skeOld:[
    [0,0,1,1,1,1,1,0,0],[0,1,7,1,1,1,7,1,0],[0,1,1,2,1,2,1,1,0],
    [0,0,1,1,1,1,1,0,0],[0,2,1,2,1,2,1,2,0],[0,0,2,1,1,1,2,0,0],
    [0,0,0,2,1,2,0,0,0],[0,0,0,1,0,1,0,0,0],[0,0,0,1,0,1,0,0,0],
  ],
  skeOldA:[
    [0,0,1,1,1,1,1,0,0],[0,1,7,1,1,1,7,1,0],[0,1,1,2,1,2,1,1,0],
    [2,0,1,1,1,1,1,0,2],[0,2,1,2,1,2,1,2,0],[0,0,2,1,1,1,2,0,0],
    [0,0,0,2,1,2,0,0,0],[0,0,0,1,0,1,0,0,0],[0,0,0,1,0,1,0,0,0],
  ],
  skeNew:[
    [0,0,1,1,1,1,1,0,0],[0,1,2,2,2,2,2,1,0],[0,1,7,2,1,2,7,1,0],
    [0,0,1,2,2,2,1,0,0],[0,2,1,2,1,2,1,2,0],[0,0,2,1,1,1,2,0,0],
    [0,0,1,2,2,2,1,0,0],[0,0,2,0,1,0,2,0,0],[0,0,2,0,1,0,2,0,0],
  ],
  skeNewA:[
    [0,0,1,1,1,1,1,0,0],[0,1,2,2,2,2,2,1,0],[0,1,7,2,1,2,7,1,0],
    [2,0,1,2,2,2,1,0,2],[0,2,1,2,1,2,1,2,0],[0,0,2,1,1,1,2,0,0],
    [0,0,1,2,2,2,1,0,0],[0,0,2,0,1,0,2,0,0],[0,0,2,0,1,0,2,0,0],
  ],
skeClassic:[
  [0,1,1,1,0],
  [1,2,2,2,1],
  [1,7,2,7,1],
  [0,1,2,1,0],
  [1,2,1,2,1],
  [0,2,1,2,0],
  [0,1,1,1,0],
  [0,1,0,1,0],
  [0,2,0,2,0],
],

skeClassicA:[
  [0,1,1,1,0],
  [1,2,2,2,1],
  [1,7,2,7,1],
  [0,1,2,1,0],
  [2,1,1,1,2],
  [0,2,1,2,0],
  [0,1,1,1,0],
  [0,1,0,1,0],
  [0,2,0,2,0],
],
  // Wizard Skeleton - 8x8 sprite with pointed hat and staff
  wiz:[
    [0,0,0,20,0,0,0,0],[0,0,20,20,20,0,0,0],[0,20,20,21,20,20,0,0],[0,0,1,1,1,0,0,0],
    [0,1,7,1,7,1,0,0],[0,20,1,20,1,20,0,0],[0,0,20,1,20,0,0,0],[0,21,20,0,20,21,0,0],
  ],
  // Wizard casting - arms raised
  wizA:[
    [0,0,0,20,0,0,0,0],[0,0,20,20,20,0,0,0],[0,20,20,21,20,20,0,0],[0,0,1,1,1,0,0,0],
    [0,1,7,1,7,1,0,0],[20,1,20,1,20,1,20,0],[0,20,1,20,1,20,0,0],[0,21,20,0,20,21,0,0],
  ],
  hFull:[
    [0,1,1,1,1,0,0,0],[1,2,7,2,7,1,0,0],[1,2,1,1,1,1,0,0],
    [0,1,2,2,1,0,0,0],[0,0,1,1,0,0,0,0],[0,0,1,0,1,0,0,0],
  ],
  hHalf:[
    [0,2,2,2,2,0,0,0],[2,3,7,3,7,2,0,0],[2,3,2,2,2,2,0,0],
    [0,2,3,3,2,0,0,0],[0,0,2,2,0,0,0,0],[0,0,2,0,2,0,0,0],
  ],
  hEmt:[
    [0,3,3,3,3,0,0,0],[3,7,3,3,7,3,0,0],[3,3,3,3,3,3,0,0],
    [0,3,3,3,3,0,0,0],[0,0,3,3,0,0,0,0],[0,0,3,0,3,0,0,0],
  ],
  skull:[
    [0,0,0,1,1,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,2,2,1,0,0],
    [0,1,2,1,14,2,2,14,1,2,1,0],[0,1,2,14,2,2,2,2,14,2,1,0],
    [0,1,2,2,2,2,2,2,2,2,1,0],[0,0,1,2,2,2,2,2,2,1,0,0],
    [0,0,1,2,7,2,2,7,2,1,0,0],[0,0,0,1,2,2,2,2,1,0,0,0],
    [0,0,0,1,7,1,1,7,1,0,0,0],[0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  hangSkull:[
    [0,0,0,1,1,1,1,1,1,0,0,0],[0,0,1,2,2,2,2,2,2,1,0,0],
    [0,1,2,1,16,2,2,16,1,2,1,0],[0,1,2,16,2,2,2,2,16,2,1,0],
    [0,1,2,2,2,2,2,2,2,2,1,0],[0,0,1,2,2,2,2,2,2,1,0,0],
    [0,0,1,2,7,2,2,7,2,1,0,0],[0,0,0,1,2,2,2,2,1,0,0,0],
    [0,0,0,1,7,1,1,7,1,0,0,0],[0,0,0,0,1,0,0,1,0,0,0,0],
    [0,0,0,0,1,0,0,1,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  torch:[
    [0,12,0,0],[12,12,13,0],[13,12,12,0],[0,13,12,0],[0,8,8,0],[0,2,2,0],[0,2,0,0],
  ],
  mskull:[
    [0,1,1,0],[1,7,7,1],[0,1,1,0],[0,1,1,0],
  ],
  hudDoor:[
    [0,10,10,10,10,10,10,10,0,0],
    [10,15,15,15,15,15,15,15,10,0],
    [10,15,8,8,8,8,8,8,15,10],
    [10,15,8,9,8,8,9,8,15,10],
    [10,15,8,9,4,4,9,8,15,10],
    [10,15,8,9,4,4,9,8,15,10],
    [10,15,8,9,8,8,9,8,15,10],
    [10,15,8,9,8,8,9,8,15,10],
    [10,15,8,8,8,8,8,8,15,10],
    [10,10,10,10,10,10,10,10,10,10],
  ],
  key:[
    [0,12,12,0,0,0,0],
    [12,1,1,12,0,0,0],
    [12,1,7,12,12,12,0],
    [0,12,12,12,0,12,0],
    [0,0,0,12,12,12,0],
    [0,0,0,12,0,0,0],
    [0,0,0,0,0,0,0],
  ],
  // ── 8×8 Treasure Chest ──
  chest:[
    [9,9,9,9,9,9,9,9],
    [9,8,8,12,12,8,8,9],
    [9,8,8,8,8,8,8,9],
    [9,9,9,9,9,9,9,9],
    [9,9,9,9,9,9,9,9],
    [9,8,12,8,8,12,8,9],
    [9,8,8,8,8,8,8,9],
    [9,9,9,9,9,9,9,9],
  ],
  // ── 5×7 Shield icon for HUD ──
  shieldIcon:[
    [0,4,4,4,0],[4,4,5,4,4],[4,5,5,5,4],[4,5,5,5,4],
    [0,4,5,4,0],[0,0,4,0,0],[0,0,0,0,0],
  ],
  heartFull:[
    [0,17,0,0,17,0,0],
    [17,18,17,17,18,17,0],
    [18,17,18,18,17,18,17],
    [18,18,18,18,18,18,17],
    [0,18,18,18,18,17,0],
    [0,0,18,18,17,0,0],
    [0,0,0,17,0,0,0],
  ],
  heartHalf:[
    [0,17,0,0,19,0,0],
    [17,18,17,19,19,19,0],
    [18,17,18,19,19,19,19],
    [18,18,18,19,19,19,19],
    [0,18,18,19,19,19,0],
    [0,0,18,19,19,0,0],
    [0,0,0,19,0,0,0],
  ],
  heartEmpty:[
    [0,19,0,0,19,0,0],
    [19,0,19,19,0,19,0],
    [19,0,0,0,0,0,19],
    [19,0,0,0,0,0,19],
    [0,19,0,0,0,19,0],
    [0,0,19,0,19,0,0],
    [0,0,0,19,0,0,0],
  ],
  heartDrop:[
    [0,17,0,0,17,0,0],
    [17,18,17,17,18,17,0],
    [18,17,18,18,17,18,17],
    [18,18,18,18,18,18,17],
    [0,18,18,18,18,17,0],
    [0,0,18,18,17,0,0],
    [0,0,0,17,0,0,0],
  ],
  halfHeartDrop:[
    [0,17,0,0,0,0,0],
    [17,18,17,17,0,0,0],
    [18,17,18,18,17,0,0],
    [18,18,18,18,17,0,0],
    [0,18,18,18,0,0,0],
    [0,0,18,17,0,0,0],
    [0,0,0,17,0,0,0],
  ],
  upHeart:[
    [0,17,0,0,17,0,0],
    [17,18,17,17,18,17,0],
    [18,17,18,18,17,18,17],
    [18,18,18,18,18,18,17],
    [0,18,18,18,18,17,0],
    [0,0,18,18,17,0,0],
    [0,0,0,17,0,0,0],
  ],
  upSword:[
    [0,0,0,0,4,0,0,0,0],
    [0,0,0,4,5,4,0,0,0],
    [0,0,0,4,5,4,0,0,0],
    [0,0,0,4,5,4,0,0,0],
    [0,0,0,4,5,4,0,0,0],
    [0,0,0,4,5,4,0,0,0],
    [0,0,4,4,5,4,4,0,0],
    [0,0,0,8,5,8,0,0,0],
    [0,0,8,8,8,8,8,0,0],
  ],
  upSpeed:[
    [0,12,13,0,0,0,0,0,0],
    [12,13,12,14,0,0,0,0,0],
    [0,12,13,0,15,15,15,0,0],
    [0,0,0,0,15,4,4,15,0],
    [0,0,0,15,4,4,4,4,15],
    [0,0,0,8,8,5,5,5,4],
    [0,0,8,8,8,8,0,4,4],
    [0,8,8,8,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
  ],
  whirlwindIcon:[
    [0,0,15,4,15,0,0],
    [0,15,4,0,4,15,0],
    [15,4,0,15,0,4,15],
    [4,0,15,4,15,0,4],
    [15,4,0,15,0,4,15],
    [0,15,4,0,4,15,0],
    [0,0,15,4,15,0,0],
  ],
  stepIcon:[
    [0,0,4,4,0,0,0],
    [0,4,5,5,4,0,0],
    [0,0,4,5,0,0,0],
    [0,4,5,5,4,0,0],
    [4,0,5,0,4,0,0],
    [0,4,0,4,0,4,0],
    [0,0,0,0,0,0,0],
  ],
  shadowStepIcon:[
    [0,15,4,4,15,0,0],
    [15,4,5,5,4,15,0],
    [0,15,4,5,15,0,0],
    [15,4,5,5,4,15,0],
    [4,0,5,0,4,0,15],
    [0,4,0,4,0,15,0],
    [0,0,15,0,15,0,0],
  ],
  potionIcon:[
    [0,0,12,12,0,0,0],
    [0,12,1,1,12,0,0],
    [0,12,18,18,12,0,0],
    [12,18,18,18,18,12,0],
    [12,18,17,17,18,12,0],
    [0,12,18,18,12,0,0],
    [0,0,12,12,0,0,0],
  ],
};


// BoneCrawler safe split module
// Purpose: Deterministic bone decal generation used by dungeon rendering.
// Source: app.js lines 333-344
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Bone decals (deterministic) ──────────────────────────────
let _s = 42;
function _r(){_s=(_s*1664525+1013904223)>>>0;return _s/0xffffffff;}
const BONE_DECALS = [];
for(let i=0;i<55;i++){
  const x=PX+1+(_r()*(PW-4)|0), y=PY+1+(_r()*(PH-4)|0);
  const t=_r(), col=_r()<0.55?C.BN2:C.BN3;
  if(t<0.18) BONE_DECALS.push({type:'s',x,y,col});
  else if(t<0.55) BONE_DECALS.push({type:'h',x,y,col});
  else BONE_DECALS.push({type:'v',x,y,col});
}


// BoneCrawler safe split module
// Purpose: Canvas/DOM references, display zoom, side panels, collapsible panels, responsive shell layout, and non-game UI handlers.
// Source: app.js lines 345-889
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

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
  // so they do not get forced underneath the game at 175%+ display zoom.
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

// BoneCrawler safe split module
// Purpose: Low-level canvas drawing helpers: sprite drawing, fills, borders, pixel font text.
// Source: app.js lines 890-973
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Draw helpers ──────────────────────────────────────────────
function ds(spr, lx, ly, fx){
  const rows=spr.length, cols=spr[0].length;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const v=spr[r][fx?cols-1-c:c];
    if(!v) continue;
    ctx.fillStyle=PAL[v];
    ctx.fillRect((lx+c)*SCALE,(ly+r)*SCALE,SCALE,SCALE);
  }
}
// Draw sprite at 2× logical scale (giant skeleton)
function ds2(spr, lx, ly, fx){
  const rows=spr.length, cols=spr[0].length;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const v=spr[r][fx?cols-1-c:c];
    if(!v) continue;
    ctx.fillStyle=PAL[v];
    ctx.fillRect((lx+c*2)*SCALE,(ly+r*2)*SCALE,2*SCALE,2*SCALE);
  }
}
function dsScale(spr, lx, ly, scale, fx){
  const rows=spr.length, cols=spr[0].length;
  const tw=Math.max(1, Math.round(cols*scale));
  const th=Math.max(1, Math.round(rows*scale));
  for(let r=0;r<th;r++) for(let c=0;c<tw;c++){
    const sr=Math.min(rows-1, Math.floor(r/scale));
    const sc=Math.min(cols-1, Math.floor(c/scale));
    const v=spr[sr][fx?cols-1-sc:sc];
    if(!v) continue;
    ctx.fillStyle=PAL[v];
    ctx.fillRect((lx+c)*SCALE,(ly+r)*SCALE,SCALE,SCALE);
  }
}

function dsMap(spr, lx, ly, map={}, fx){
  const rows=spr.length, cols=spr[0].length;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const v=spr[r][fx?cols-1-c:c];
    if(!v) continue;
    ctx.fillStyle=(v in map) ? map[v] : PAL[v];
    ctx.fillRect((lx+c)*SCALE,(ly+r)*SCALE,SCALE,SCALE);
  }
}
function fr(lx,ly,lw,lh,col){
  ctx.fillStyle=col;
  ctx.fillRect(lx*SCALE,ly*SCALE,lw*SCALE,lh*SCALE);
}
// Draw pixel-perfect 1px border rect in logical coords
function frBorder(lx,ly,lw,lh,col,alpha){
  ctx.globalAlpha=alpha;
  ctx.fillStyle=col;
  ctx.fillRect(lx*SCALE,     ly*SCALE,          lw*SCALE, SCALE);        // top
  ctx.fillRect(lx*SCALE,     (ly+lh-1)*SCALE,   lw*SCALE, SCALE);        // bottom
  ctx.fillRect(lx*SCALE,     ly*SCALE,           SCALE,    lh*SCALE);     // left
  ctx.fillRect((lx+lw-1)*SCALE, ly*SCALE,        SCALE,    lh*SCALE);     // right
  ctx.globalAlpha=1;
}
function pt(text,x,y,size,color,align='left',shadow=C.DK){
  ctx.textBaseline='top';
  ctx.textAlign=align;
  ctx.font=size+'px "Press Start 2P",monospace';
  if(shadow){
    ctx.fillStyle=shadow;
    ctx.fillText(text,x+1,y);
    ctx.fillText(text,x-1,y);
    ctx.fillText(text,x,y+1);
    ctx.fillText(text,x,y-1);
  }
  ctx.fillStyle=color;
  ctx.fillText(text,x,y);
}
function ptHeavy(text,x,y,size,color,align='left',shadow=C.DK){
  ctx.textBaseline='top';
  ctx.textAlign=align;
  ctx.font=size+'px "Press Start 2P",monospace';
  if(shadow){
    ctx.fillStyle=shadow;
    const offs=[[2,0],[-2,0],[0,2],[0,-2],[1,1],[-1,1],[1,-1],[-1,-1]];
    for(const [ox,oy] of offs) ctx.fillText(text,x+ox,y+oy);
  }
  ctx.fillStyle=color;
  ctx.fillText(text,x,y);
}


// BoneCrawler safe split module
// Purpose: Generic rectangle overlap and attack-box calculation helpers.
// Source: app.js lines 974-985
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Collision ─────────────────────────────────────────────────
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function atkBox(e,reach){
  const r=reach||11;
  const extra=e.swordWidth||0;
  const half=Math.floor(extra/2);
  if(e.dir==='right') return{x:e.x+e.w, y:e.y+1-half,   w:r,        h:(e.h-2)+extra};
  if(e.dir==='left')  return{x:e.x-r,   y:e.y+1-half,   w:r,        h:(e.h-2)+extra};
  if(e.dir==='up')    return{x:e.x+1-half, y:e.y-r,     w:(e.w-2)+extra, h:r};
  /*down*/             return{x:e.x+1-half, y:e.y+e.h,  w:(e.w-2)+extra, h:r};
}


// BoneCrawler safe split module
// Purpose: Upgrade constants, weighted point rewards, upgrade-button rolling.
// Source: app.js lines 986-1062
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Upgrade menu buttons ─────────────────────────────────────
const PLAYER_BASE_SPEED = 0.28;
const SPEED_UP_STEP = 0.12;
const MAX_PLAYER_SPEED = 0.94;
const MASTER_SWORD_START_LEVEL = 4;
const MASTER_SWORD_START_REACH = 35;
const MASTER_SWORD_DISPLAY_RANGE = 5;
const MASTER_SWORD_START_WIDTH = 1;
const MASTER_SWORD_START_HEART_SLOTS = 5;
const STEP_BASE_DISTANCE = 10;
const STEP_SHADOW_BASE_DISTANCE = 14;
const STEP_DISTANCE_PER_UPGRADE = 2;
const STEP_BASE_COOLDOWN_FRAMES = 5*60;
const STEP_SHADOW_BASE_COOLDOWN_FRAMES = 4*60;
const STEP_COOLDOWN_REDUCTION_PER_UPGRADE = 45;
const STEP_MIN_COOLDOWN_FRAMES = 90;
const SHADOW_STEP_INVULN_FRAMES = 12;
const POTION_DROP_CHANCE = 0.04;
const POTION_MAX_COUNT = 1;
const POTION_ITEM_TTL_FRAMES = 8*60;
const POTION_ITEM_FADE_FRAMES = 2*60;
const UPGRADE_SLOT_YS=[37,58,79];
const POINT_REWARD_WEIGHTS=[
  {points:5,weight:25},
  {points:10,weight:20},
  {points:20,weight:20},
  {points:30,weight:20},
  {points:40,weight:10},
  {points:100,weight:9},
  {points:200,weight:5},
  {points:1000,weight:1},
];
const UPGRADE_POOL=[
  {type:'heart',label:'HEART',sub:'HEAL 1 HEART',border:C.BLD,text:'#ff9977',icon:'upHeart'},
  {type:'sword',label:'SWORD',sub:'BIGGER BLADE',border:C.SI2,text:C.BN1,icon:'upSword'},
  {type:'shield',label:'MAGIC SHIELD',sub:'ABSORB HIT + SHOCKWAVE',border:C.SH2,text:C.SH,icon:'shieldIcon',labelFs:6,subFs:4},
  {type:'speed',label:'SPEED',sub:'INCREASE SPEED',border:C.FR2,text:C.FR1,icon:'upSpeed'},
  {type:'shadowstep',label:'SHADOW STEP',sub:'IMPROVE DODGE',border:'#7a74f5',text:'#d8d3ff',icon:'shadowStepIcon',labelFs:5,subFs:4},
  {type:'points',label:'POINTS',sub:'BONUS SCORE',border:C.FR1,text:C.BN1,icon:'pointsIcon'},
];
let currentUpgradeBtns=[];

function choosePointReward(){
  const total=POINT_REWARD_WEIGHTS.reduce((sum,opt)=>sum+opt.weight,0);
  let roll=Math.random()*total;
  for(const opt of POINT_REWARD_WEIGHTS){
    roll-=opt.weight;
    if(roll<=0) return opt.points;
  }
  return POINT_REWARD_WEIGHTS[POINT_REWARD_WEIGHTS.length-1].points;
}

function rollUpgradeChoices(){
  const pool=UPGRADE_POOL.slice();
  for(let i=pool.length-1;i>0;i--){
    const j=(Math.random()*(i+1))|0;
    const tmp=pool[i];
    pool[i]=pool[j];
    pool[j]=tmp;
  }
  currentUpgradeBtns=pool.slice(0,3).map((opt,idx)=>{
    const btn={
      ...opt,
      num:String(idx+1),
      x:31,
      y:UPGRADE_SLOT_YS[idx],
      w:58,
      h:16,
    };
    if(btn.type==='points'){
      btn.pointValue=choosePointReward();
      btn.sub='+'+btn.pointValue+' SCORE';
    }
    return btn;
  });
}


// BoneCrawler safe split module
// Purpose: Menu button rectangles, zone decor constants, scoreboard/player-name storage, touch/pause UI utility helpers.
// Source: app.js lines 1063-1259
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Title / scoreboard buttons ───────────────────────────────
const MENU_BTN_W=66, MENU_BTN_H=9;
const MENU_BTN_X=((GW-MENU_BTN_W)/2)|0;
const MENU_PLAY={x:MENU_BTN_X,y:78,w:MENU_BTN_W,h:MENU_BTN_H};
const MENU_SCORE={x:MENU_BTN_X,y:92,w:MENU_BTN_W,h:MENU_BTN_H};
const GAMEOVER_RETRY={x:21,y:94,w:32,h:10};
const GAMEOVER_MENU={x:67,y:94,w:32,h:10};
const NAME_BTN={x:MENU_BTN_X,y:106,w:MENU_BTN_W,h:MENU_BTN_H};
const ZONE1_DOOR_RECT={x:GW/2-5,y:PY-2,w:10,h:10};
const ZONE1_DECOR_BREAK_RECTS=[
  // left / right bookshelves
  {x:PX+2,y:PY+22,w:6,h:17},
  {x:PX+PW-8,y:PY+20,w:6,h:17},

  // broken round table + chairs corner
  {x:PX+7,y:PY+11,w:19,h:15},

  // lone broken barrel near the top-right
  {x:PX+PW-14,y:PY+8,w:6,h:8},

  // bottom-right barrel cluster
  {x:PX+PW-24,y:PY+PH-22,w:6,h:8},
  {x:PX+PW-16,y:PY+PH-20,w:6,h:8},
  {x:PX+PW-9,y:PY+PH-23,w:6,h:8},
  {x:PX+PW-18,y:PY+PH-13,w:6,h:8},
  {x:PX+PW-10,y:PY+PH-12,w:6,h:8},
];
const ZONE1_DECOR_BLOCKERS=[
  // standing shelves only block at their lower/base portion so the player can walk under the upper body
  {x:PX+2,y:PY+33,w:6,h:6},
  {x:PX+PW-8,y:PY+31,w:6,h:6},

  // broken round table + chairs corner
  {x:PX+7,y:PY+11,w:19,h:15},

  // lone broken barrel near the top-right
  {x:PX+PW-14,y:PY+8,w:6,h:8},

  // bottom-right barrel cluster
  {x:PX+PW-24,y:PY+PH-22,w:6,h:8},
  {x:PX+PW-16,y:PY+PH-20,w:6,h:8},
  {x:PX+PW-9,y:PY+PH-23,w:6,h:8},
  {x:PX+PW-18,y:PY+PH-13,w:6,h:8},
  {x:PX+PW-10,y:PY+PH-12,w:6,h:8},
];
const ZONE2_TREE_BLOCKERS=[
  // lower trunk / stump only; top half stays walkable so the player can appear under the tree
  {x:GW/2-5,y:PY+46,w:10,h:15},

  // main root mass / lower roots
  {x:GW/2-13,y:PY+53,w:26,h:8},
  {x:GW/2-7,y:PY+59,w:14,h:5},
  {x:GW/2-23,y:PY+53,w:13,h:6},
  {x:GW/2+10,y:PY+53,w:13,h:6},
];
const ZONE1_EXTRA_BLOCKERS=[
  {x:PX+9,y:PY+PH-16,w:8,h:6},   // broken weapon rack
  {x:PX+19,y:PY+PH-18,w:7,h:10}, // training dummy
];

const ZONE2_HOLE_BLOCKERS=[
  {x:PX+15,y:PY+PH-24,w:4,h:4},
  {x:PX+PW-27,y:PY+PH-25,w:4,h:4},
];
const ZONE2_DECOR_BREAK_RECTS=[
  // back-wall bookshelves sitting in the grass
  {x:GW/2-14,y:PY+7,w:6,h:17},
  {x:GW/2-6,y:PY+7,w:6,h:17},
  {x:GW/2+2,y:PY+7,w:6,h:17},
  {x:GW/2+10,y:PY+7,w:6,h:17},
  // grassy upper-right clutter
  {x:PX+PW-30,y:PY+12,w:7,h:7},
  {x:PX+PW-22,y:PY+10,w:6,h:8},
  {x:PX+PW-14,y:PY+12,w:6,h:8},
  // side and pocket bookshelves tucked into the back wall
  {x:PX+6,y:PY+7,w:6,h:17},
  {x:PX+14,y:PY+7,w:6,h:17},
  {x:PX+PW-20,y:PY+7,w:6,h:17},
  {x:PX+PW-12,y:PY+7,w:6,h:17},
];
const ZONE2_DECOR_BLOCKERS=[
  // bookshelf bases only, so upper shelves still feel against the wall
  {x:GW/2-14,y:PY+18,w:6,h:6},
  {x:GW/2-6,y:PY+18,w:6,h:6},
  {x:GW/2+2,y:PY+18,w:6,h:6},
  {x:GW/2+10,y:PY+18,w:6,h:6},
  // grassy corner clutter
  {x:PX+PW-30,y:PY+12,w:7,h:7},
  {x:PX+PW-22,y:PY+10,w:6,h:8},
  {x:PX+PW-14,y:PY+12,w:6,h:8},
  // side and pocket shelf bases
  {x:PX+6,y:PY+18,w:6,h:6},
  {x:PX+14,y:PY+18,w:6,h:6},
  {x:PX+PW-20,y:PY+18,w:6,h:6},
  {x:PX+PW-12,y:PY+18,w:6,h:6},
];
const SCORE_PAGE_SIZE=6;
const SCOREBOARD_KEY='boneCrawlerScoreboard_v1';
const PLAYERNAME_KEY='boneCrawlerPlayerName_v1';
const memoryStore={scores:[],name:''};

function loadScores(){
  try{
    const raw=localStorage.getItem(SCOREBOARD_KEY);
    if(raw) return JSON.parse(raw)||[];
  }catch(err){}
  return memoryStore.scores.slice();
}
function saveScores(list){
  memoryStore.scores=list.slice();
  try{ localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(list)); }catch(err){}
}
function loadPlayerName(){
  try{
    const raw=localStorage.getItem(PLAYERNAME_KEY);
    if(raw) return raw;
  }catch(err){}
  return memoryStore.name||'';
}
function savePlayerName(name){
  memoryStore.name=name;
  try{ localStorage.setItem(PLAYERNAME_KEY, name); }catch(err){}
}
function formatTime(ms){
  const total=Math.max(0, Math.floor(ms/1000));
  const h=Math.floor(total/3600);
  const m=Math.floor((total%3600)/60);
  const s=total%60;
  if(h>0) return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function pointInBtn(mx,my,btn){
  return mx>=btn.x&&mx<=btn.x+btn.w&&my>=btn.y&&my<=btn.y+btn.h;
}
function clearGameplayKeys(){
  const reset=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyS','KeyD','KeyW','Space','ShiftLeft','ShiftRight','KeyP','KeyE','Enter','Escape'];
  for(const k of reset) keys[k]=false;
  prevSpc=false;
  mouseAttackQueued=false;
  mouseAttackHeld=false;
  touchMoveActive=false;
  touchIdentifier=null;
  touchAttackChargeActive=false;
  touchAttackReleaseQueued=false;
  touchAttackCancelQueued=false;
  touchAttackMoved=false;
}
function syncMenuCredit(){}
function pauseGame(){
  if(gState!=='playing') return;
  pauseStartedMs=performance.now();
  clearGameplayKeys();
  gState='paused';
}
function resumeGame(){
  if(gState!=='paused') return;
  if(pauseStartedMs) runStartMs += performance.now()-pauseStartedMs;
  pauseStartedMs=0;
  clearGameplayKeys();
  gState='playing';
}
function syncTouchPauseBtn(){
  if(touchUiAvailable && document.getElementById('gamePadShell')){
    if(touchPauseBtn){ touchPauseBtn.classList.add('hidden'); touchPauseBtn.style.display='none'; }
    return;
  }
  if(!touchPauseBtn) return;
  const active=touchUiAvailable && (gState==='playing' || gState==='paused');
  const aria=gState==='paused' ? 'Resume game' : 'Pause game';
  const stateKey=(active?'1':'0')+'|'+aria;
  if(stateKey===lastTouchPauseUiState) return;
  lastTouchPauseUiState=stateKey;
  touchPauseBtn.classList.toggle('hidden', !active);
  touchPauseBtn.textContent='❚❚';
  touchPauseBtn.setAttribute('aria-label', aria);
}
function syncTouchActionBtns(){
  if(touchUiAvailable && document.getElementById('gamePadShell')){
    if(touchInteractBtn){ touchInteractBtn.classList.add('hidden'); touchInteractBtn.style.display='none'; }
    if(touchDodgeBtn){ touchDodgeBtn.classList.add('hidden'); touchDodgeBtn.style.display='none'; }
    return;
  }
  if(!touchUiAvailable){
    if(touchInteractBtn) touchInteractBtn.classList.add('hidden');
    if(touchDodgeBtn) touchDodgeBtn.classList.add('hidden');
    return;
  }
  const inPlay=gState==='playing';
  const inDialog=gState==='dialog';
  if(touchInteractBtn) touchInteractBtn.classList.toggle('hidden', !(inPlay||inDialog));
  if(touchDodgeBtn) touchDodgeBtn.classList.toggle('hidden', !inPlay);
}
function closeAboutModal(){
  if(aboutPanel) aboutPanel.classList.add('is-hidden');
  syncPlayerMenuVisibility();
}


// BoneCrawler safe split module
// Purpose: Global runtime state variables, zone IDs, boss constants, item constants, and secret-zone geometry.
// Source: app.js lines 1260-1471
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Game state ────────────────────────────────────────────────
const ZONE_TRANSITION_CONTINUE_BTN={x:35,y:99,w:50,h:10};
const RETRY_CONFIRM_YES_BTN={x:24,y:92,w:28,h:10};
const RETRY_CONFIRM_NO_BTN={x:68,y:92,w:28,h:10};
const SECRET2_SWORD_CONFIRM_YES_BTN={x:24,y:92,w:28,h:10};
const SECRET2_SWORD_CONFIRM_NO_BTN={x:68,y:92,w:28,h:10};
const LEAVE_ZONE_CONFIRM_YES_BTN={x:24,y:92,w:28,h:10};
const LEAVE_ZONE_CONFIRM_NO_BTN={x:68,y:92,w:28,h:10};
const RETRY_POINT_SACRIFICE=0.30;
const WHIRLWIND_HOLD_FRAMES=24;
const WHIRLWIND_COOLDOWN_FRAMES=5*60;

let gState='title';
let player, enemies, parts, pSpawns, frame, score, prevSpc;
let killCount, nextChestAt, nextGiantAt, chest, floatTexts, heartDrops, potionDrops, shockwaves, keyDrop, currentZone;
let zone1Broken, zone1Rubble, zone2Broken, zone3Broken;
let fireballs, nextWizardAt, giantKillInterval, wizardKillInterval;
let normalKillCount=0, giantKillCount=0, wizardKillCount=0;
let zone3TreeHits=0, zone3TreeShakeT=0, zone3TreeAwake=false, zone3TreeMet=false;
let pendingZoneTransition=0;
let zoneTransitionInfo=null;
let leaveZonePromptData=null;
let dragonBoss=null, dragonFlames=[], dragonSwipe=null, bossDefeated=false, zone1MiniBossDefeated=false, pendingZone1DragonSpawn=false;
let shadowBoss=null, shadowWaves=[], shadowBossDefeated=false, shadowWizardRespawns=[];
let bossClearTimer=0;
let secret1BlessingT=0;
let secret2NpcMet=false;
let secret1RatTalkCount=0;
let secret1NodeSpoken=false;
let zone1DoorKeyDialogShown=false;
let zone1Kill90DialogShown=false;
let zone1Kill109DialogShown=false;
let zone2IntroDialogShown=false;
let zone2Kill30DialogShown=false;
let zone3IntroDialogShown=false;
let zone3Kill80DialogShown=false;
let zone3BossDefeatDialogShown=false;
let startupDialogCompletedThisRun=false;
let dialogPages=[];
let dialogPageIndex=0;
let dialogTitle='WOUNDED STRANGER';
let dialogMode='npc';
let currentPlayerName=loadPlayerName()||'Player';
let scoreboardEntries=loadScores();
let scoreboardPage=0;
let runStartMs=0, runSaved=false, runTimeMs=0, pauseStartedMs=0, runCompleted=false;
let zone1KillStart=0;
let zone2KillStart=0;
let zone3KillStart=0;
let introStartMs=0;
let introPage=0;
let introSeenThisPage=false;
let introFadeT=0, introFadeMax=20;
let startupSceneFadeT=0, startupSceneFadeMax=20;
let startupScenePauseStartMs=0;
const STARTUP_SCENE_DIALOG_DELAY_MS=1500;
const INTRO_PAGE_COUNT=3;
const STARTUP_GAME_DIALOG_PAGES=[
  {speaker:'NODE',lines:['Welcome BoneCrawler..!','This dungeon will serve as your','training since waking up.','Good luck.']},
  {speaker:'NODE',lines:['.. and if you see a Dragon,','well..',"I'm glad I mentioned it now."]},
  {speaker:'PLAYER',lines:["I don't deal with dragons."]},
  {speaker:'NODE',lines:['You do now.', ".. and don't forget the corrupted."]},     
  {speaker:'PLAYER',lines:["That's great..",'I need to get out of this room.','There should be a key somewhere..']},
];
let mouseAttackQueued=false;
let mouseAttackHeld=false;
let touchMoveActive=false;
let touchStartX=0, touchStartY=0, touchX=0, touchY=0, touchStartTime=0;
let touchIdentifier=null;
let touchAttackChargeActive=false;
let touchAttackReleaseQueued=false;
let touchAttackCancelQueued=false;
let touchAttackMoved=false;
const TOUCH_ATTACK_CANCEL_MOVE_PX=18;
let devGodMode=false;
let retryCheckpoint=null;
let retryTaxPaid=false;
let retryPromptMode='';
let secret1UnlockAlertShown=false;
let secret1UnlockAlertT=0;
let startupDialogPending=false;
let newGamePlus=false;
let masterSwordOwned=false;
let whirlwindUnlocked=false;
let masterSwordDialogSeen=false;
let whirlwindLearnDialogSeen=false;
let pendingRewardDialogs=[];
let whirlwindChargeT=0;
let whirlwindCooldownT=0;
let whirlwindSlashT=0;
let dodgeCooldownT=0;
let potionCount=0;
let potionDialogSeenThisRun=false;
const DEV_GOD_SPEED_MULT=1.85;

const ITEM_TTL_FRAMES=15*60;
const ITEM_FADE_FRAMES=5*60;
const BREAKABLE_HALF_HEART_DROP_CHANCE=0.10;
const ZONE3_TREE_HITS_TO_WAKE=5;
const ZONE1_CHEST_KILL_STEP=10;
const ZONE2_CHEST_KILL_STEP=15;
const ZONE2_FIRST_CHEST_DELAY=18;
const ZONE1_ZONE2_KEY_KILLS=50;
const ZONE1_SECRET_KEY_KILLS=150;
const ZONE1_DRAGON_MINIBOSS_KILLS=300;
const ZONE1_DRAGON_PHASE_HITS=10;
const ZONE2_KEY_KILLS=50;
const DRAGON_BOSS_TRIGGER_KILLS=100;
const ZONE3_CHEST_KILL_STEP=18;
const ZONE3_FIRST_CHEST_DELAY=22;
const ZONE3_KEY_KILLS=300;
const ZONE3_BOSS_TRIGGER_KILLS=ZONE3_KEY_KILLS;
const SHADOW_PHASE_HITS=10;
const SHADOW_HOWL_FRAMES=180;
const SHADOW_WAVE_INTERVAL=18;
const SHADOW_PHASE1_LUNGE_BONUS_DISTANCE=2;
const SHADOW_PHASE2_LUNGE_BONUS_DISTANCE=1;
const SHADOW_SCREECH_STARTUP_FRAMES=2*60;
const SHADOW_SCREECH_DURATION_FRAMES=2*60;
const SHADOW_SCREECH_WAVE_INTERVAL=18;
const CRAWLER_WIZARD_RESPAWN_FRAMES=4*60;
const ZONE_SECRET1=101;
const ZONE_SECRET2=102;
const SECRET2_SCORE_REQ=999;
const SECRET1_BLESSING_FRAMES=170;
const ZONE3_DOOR_RECT={x:GW/2-5,y:PY-2,w:10,h:10};
const SECRET1_ENTRANCE_RECT={x:PX+3,y:PY+24,w:4,h:10};
const SECRET1_EXIT_DOOR_RECT={x:GW/2-5,y:PY-2,w:10,h:10};
function zone1SecretEntranceReady(){
  return currentZone===1 && !!player && !!player.secret1Key && !hasKeyDropKind('secret1') && enemies.length===0 && pSpawns.length===0;
}
const SECRET1_POOL_BLOCKERS=[];
const SECRET1_POOL_WATER_RECT={x:GW/2-25,y:PY+25,w:50,h:20};
const SECRET2_NPC_RECT={x:GW/2-18,y:PY+68,w:12,h:8};
const SECRET2_SWORD_RECT={x:GW/2-6,y:PY+24,w:12,h:24};
const ZONE3_TREE_RECT={x:PX+13,y:PY+PH-28,w:16,h:22};
const ZONE3_TREE_INTERACT_RECT={x:PX+8,y:PY+PH-26,w:22,h:18};
const ZONE3_SECRET2_PORTAL_RECT={x:GW/2-6,y:PY+57,w:12,h:12};
const SECRET1_RAT_RECT={x:PX+10,y:PY+10,w:8,h:6};
const SECRET1_RAT_INTERACT_RECT={x:PX+7,y:PY+7,w:15,h:12};
const SECRET1_CHEESE_RECT={x:PX+20,y:PY+12,w:6,h:4};
const SECRET2_RETURN_PORTAL_RECT={x:PX+PW-18,y:PY+70,w:12,h:12};
const SECRET2_STONE_BLOCKERS=[
  {x:GW/2-5,y:PY+42,w:10,h:7},
];
function isSecret1WaterZone(box){
  return !!box && ov(box, SECRET1_POOL_WATER_RECT);
}

const ZONE3_TREE_BLOCKERS=[
  {x:PX+15,y:PY+PH-20,w:12,h:10},
  {x:PX+10,y:PY+PH-12,w:20,h:7},
];
const ZONE3_EXTRA_BLOCKERS=[
  {x:PX+PW-18,y:PY+PH-11,w:7,h:7},
];
const ZONE3_DECOR_BREAK_RECTS=[
  {x:PX+2,y:PY+22,w:6,h:17},
  {x:PX+PW-8,y:PY+20,w:6,h:17},
  {x:GW/2-7,y:PY+35,w:15,h:13},
  {x:PX+PW-25,y:PY+PH-13,w:6,h:8},
  {x:PX+PW-10,y:PY+PH-12,w:6,h:8},
];
const ZONE3_DECOR_BLOCKERS=[
  {x:PX+2,y:PY+33,w:6,h:6},
  {x:PX+PW-8,y:PY+31,w:6,h:6},
  {x:GW/2-6,y:PY+41,w:12,h:8},
  {x:PX+PW-25,y:PY+PH-13,w:6,h:8},
  {x:PX+PW-10,y:PY+PH-12,w:6,h:8},
  ...ZONE3_TREE_BLOCKERS,
  ...ZONE3_EXTRA_BLOCKERS,
];
const DRAGON_PHASE_HITS=20;
const DRAGON_SUMMON_INTERVAL=7*60;
const DRAGON_MAX_NORMAL_ADDS=4;
const DRAGON_MAX_WIZARDS=2;
const DRAGON_FIREBLAST_TTL=40;
const DRAGON_TAIL_TTL=16;

function maxEnemies(){ return Math.min(6, 1+Math.floor(killCount/4)); }

function pushDevFloat(text,col=C.FR1){
  if(!floatTexts) return;
  floatTexts.push({x:GW/2,y:PY+12,text,life:55,max:55,col});
}

function setDevGodMode(enabled){
  devGodMode=!!enabled;
  if(player){
    player.dead=false;
    player.hp=player.maxHp;
    player.hurtT=0;
    player.shield=true;
    player.shieldBreakT=0;
    player.visibleHearts=Math.max(player.visibleHearts||3, Math.min(5, Math.ceil(player.hp/2)));
  }
  pushDevFloat(devGodMode?'GOD MODE ON':'GOD MODE OFF', devGodMode?C.MG2:C.WH);
}

function toggleDevGodMode(){
  setDevGodMode(!devGodMode);
}

function isGodName(name=currentPlayerName){
  const clean=String(name||'').trim().toLowerCase();
  return clean==='immagundam';
}
function syncNameGodMode(){
  const shouldEnable=isGodName(currentPlayerName);
  if(shouldEnable!==!!devGodMode) setDevGodMode(shouldEnable);
}


// BoneCrawler safe split module
// Purpose: Cheat-code detection, dev commands, god mode, editable stat/dev API helpers.
// Source: app.js lines 1472-1805
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Cheat code name detection ─────────────────────────────────────
function getCheatCode(name=currentPlayerName){
  const clean=String(name||'').trim().toLowerCase();
  const codes={
    'link':'link','doodoorocks':'doodoorocks','circa90x':'circa90x',
    'itsasecret':'itsasecret','devsecret':'devsecret',
    'whydragons':'whydragons','zone2':'zone2','zone3':'zone3',
  };
  return codes[clean]||null;
}
function applyCheatCode(code){
  if(!code||!player) return;
  const p=player;
  if(code==='link'){
    p.swordLevel=3; p.swordReach=11+3*6; p.swordWidth=1;
    p.speedLevel=3; p.speed=PLAYER_BASE_SPEED+3*SPEED_UP_STEP;
    p.shield=true; p.shieldLevel=3;
    p.shadowStep=true; p.stepLevel=3;
    p.hp=p.maxHp; p.visibleHearts=5;
    masterSwordOwned=true; whirlwindUnlocked=true;
    p.swordLevel=Math.max(p.swordLevel,MASTER_SWORD_START_LEVEL);
    p.swordReach=Math.max(p.swordReach,MASTER_SWORD_START_REACH);
    p.swordWidth=Math.max(p.swordWidth,MASTER_SWORD_START_WIDTH);
    potionCount=1;
  } else if(code==='doodoorocks'){
    p.swordLevel=7; p.swordReach=11+7*6;
    p.speedLevel=7; p.speed=Math.min(MAX_PLAYER_SPEED,PLAYER_BASE_SPEED+7*SPEED_UP_STEP);
  } else if(code==='circa90x'){
    p.shield=true; p.shieldLevel=1;
    p.hp=1; p.visibleHearts=3;
  }
}
function openStartupGameDialog(){
  startupDialogCompletedThisRun=false;
  dialogTitle='NODE';
  dialogMode='opening';
  dialogPages=STARTUP_GAME_DIALOG_PAGES.map(page=>( {
    speaker:(page.speaker||'NODE').toUpperCase(),
    lines:(page.lines||[]).slice()
  }));
  dialogPageIndex=0;
  startupDialogPending=false;
  startupScenePauseStartMs=0;
  clearGameplayKeys();
  gState='dialog';
}
function beginStartupSceneTransition(){
  startupSceneFadeT=startupSceneFadeMax;
  startupScenePauseStartMs=0;
  clearGameplayKeys();
  gState='startup_scene';
}
function beginPlayableRun(){
  if(startupDialogPending){
    openStartupGameDialog();
    return;
  }
  clearGameplayKeys();
  gState='playing';
}
function startGameWithCheat(code){
  if(code==='itsasecret'){ clearGameplayKeys(); enterSecretZone1(); if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun(); return; }
  if(code==='devsecret'){  clearGameplayKeys(); enterSecretZone2(); if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun(); return; }
  if(code==='whydragons'){ killCount=ZONE1_DRAGON_MINIBOSS_KILLS; pendingZone1DragonSpawn=true; clearGameplayKeys(); if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun(); return; }
  if(code==='zone2'){      enterZone2(); clearGameplayKeys(); if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun(); return; }
  if(code==='zone3'){      enterZone3(); clearGameplayKeys(); if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun(); return; }
  if(introSeenThisPage){
    introStartMs=0;
    introPage=0;
    if(startupDialogPending) beginStartupSceneTransition();
    else beginPlayableRun();
  }
  else {
    introStartMs=performance.now();
    introPage=0;
    gState='intro';
  }
}
function getKeyDropList(){
  if(!keyDrop) return [];
  if(Array.isArray(keyDrop)) return keyDrop;
  keyDrop=[keyDrop];
  return keyDrop;
}
function hasAnyKeyDrop(){
  return getKeyDropList().length>0;
}
function hasKeyDropKind(kind){
  return getKeyDropList().some(drop=>drop && drop.kind===kind);
}
function clearKeyDrops(){
  keyDrop=[];
}
function playerHasAnyKey(p=player){
  if(!p) return false;
  return !!(p.hasKey || p.zone1DoorKey || p.secret1Key || p.zone2Key);
}

function devSpawnChestAtPlayer(){
  if(!player || gState!=='playing') return;
  const x=Math.max(PX+2, Math.min(PX+PW-10, Math.floor(player.x+player.w/2-4)));
  const y=Math.max(PY+2, Math.min(PY+PH-10, Math.floor(player.y+player.h/2-4)));
  chest={x,y,w:8,h:8};
  pushDevFloat('CHEST SPAWNED', C.BN1);
}

function devAdvanceProgress(){
  if(!player || gState!=='playing') return;
  if(currentZone===1){
    player.zone1DoorKey=true;
    clearKeyDrops();
    openZoneTransition(2);
    pushDevFloat('SKIP TO ZONE 2', C.GR);
    return;
  }
  if(currentZone===2){
    killCount=Math.max(killCount, zone2KillStart + DRAGON_BOSS_TRIGGER_KILLS);
    syncKillSpawnSchedulesFromCount();
    chest=null; clearKeyDrops();
    enemies=[]; pSpawns=[]; fireballs=[];
    dragonFlames=[]; dragonSwipe=null;
    spawnDragonBoss();
    if(dragonBoss){
      player.x=GW/2-4;
      player.y=PY+PH-16;
      player.hurtT=0;
      pushDevFloat('DRAGON TEST', C.FR1);
    }
    return;
  }
  if(currentZone===3){
    killCount=Math.max(killCount, zone3KillStart + ZONE3_BOSS_TRIGGER_KILLS);
    chest=null; clearKeyDrops();
    enemies=[]; pSpawns=[]; fireballs=[];
    shadowBoss=null; shadowWaves=[]; shadowBossDefeated=false; shadowWizardRespawns=[];
    spawnShadowBoss();
    if(shadowBoss){
      player.x=GW/2-4;
      player.y=PY+PH-16;
      player.hurtT=0;
      pushDevFloat('CORRUPTED TEST', C.MG2);
    }
  }
}

function devSkipBossPhase(){
  if(gState!=='playing') return;
  if(dragonBoss && !bossDefeated){
    if(dragonBoss.howlT>0){
      dragonBoss.howlT=1;
      pushDevFloat('PHASE TRANSITION', C.WH);
      return;
    }
    damageDragonBoss(dragonBoss.hp,false);
    return;
  }
  if(shadowBoss && !shadowBossDefeated){
    if(shadowBoss.howlT>0){
      shadowBoss.howlT=1;
      pushDevFloat('PHASE TRANSITION', C.WH);
      return;
    }
    damageShadowBoss(shadowBoss.hp,false);
  }
}

function devGotoZone(zone){
  if(!player) return;
  const target=String(zone||'').toLowerCase();
  const validZones={zone1:true, secret1:true, zone2:true, zone3:true, secret2:true};
  if(!validZones[target]) return;

  gState='playing';
  pendingZoneTransition=0;
  zoneTransitionInfo=null;
  clearGameplayKeys();

  chest=null; clearKeyDrops();
  enemies=[]; pSpawns=[]; fireballs=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; parts=[];
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  shadowBoss=null; shadowWaves=[]; shadowBossDefeated=false; shadowWizardRespawns=[];
  bossClearTimer=0;
  secret1BlessingT=0;
  runCompleted=false;

  zone1Broken=Array(ZONE1_DECOR_BREAK_RECTS.length).fill(false);
  zone1Rubble=[];
  zone2Broken=Array(ZONE2_DECOR_BREAK_RECTS.length).fill(false);
  zone3Broken=Array(ZONE3_DECOR_BREAK_RECTS.length).fill(false);
  player.hasKey=false;

  if(target==='zone1'){
    currentZone=1;
    zone1KillStart=killCount;
    nextChestAt=killCount + 10;
    syncKillSpawnSchedulesFromCount();
    player.x=GW/2-4;
    player.y=PY+PH-14;
    player.atkT=0; player.atkCD=10; player.hurtT=0;
    qSpawn(40, false, false, 'normalEnemy1');
    qSpawn(48, false, false, 'normalEnemy3');
    pushDevFloat('ZONE 1', C.GR);
  } else if(target==='secret1'){
    enterSecretZone1();
    secret1BlessingT=0;
    pushDevFloat('SECRET ZONE 1', C.MG2);
  } else if(target==='zone2'){
    nextChestAt=killCount + ZONE2_FIRST_CHEST_DELAY;
    enterZone2();
    pushDevFloat('ZONE 2', C.GR);
  } else if(target==='zone3'){
    nextChestAt=killCount + ZONE3_FIRST_CHEST_DELAY;
    enterZone3();
    pushDevFloat('ZONE 3', C.MG2);
  } else if(target==='secret2'){
    enterSecretZone2();
    pushDevFloat('SECRET ZONE 2', C.BN1);
  }
}

function rebalanceDevKillBreakdown(){
  const target=Math.max(0, killCount|0);
  let total=(normalKillCount|0)+(giantKillCount|0)+(wizardKillCount|0);
  if(total===target) return;
  if(total<target){
    normalKillCount=(normalKillCount|0)+(target-total);
    return;
  }
  let over=total-target;
  const takeNormal=Math.min(normalKillCount|0, over);
  normalKillCount=(normalKillCount|0)-takeNormal;
  over-=takeNormal;
  const takeGiant=Math.min(giantKillCount|0, over);
  giantKillCount=(giantKillCount|0)-takeGiant;
  over-=takeGiant;
  const takeWizard=Math.min(wizardKillCount|0, over);
  wizardKillCount=(wizardKillCount|0)-takeWizard;
}

function syncDevKillThresholds(){
  killCount=Math.max(0, killCount|0);
  rebalanceDevKillBreakdown();
  if(currentZone===1 && killCount>=ZONE1_ZONE2_KEY_KILLS && !player.zone1DoorKey && !hasKeyDropKind('zone1Door')){
    spawnKeyDrop(Math.floor(player.x+player.w/2)-3, Math.floor(player.y+player.h/2)-3,'zone1Door');
    floatTexts.push({x:player.x+player.w/2,y:player.y-8,text:'ZONE 2 KEY!',life:52,max:52,col:C.FR1});
  }
  if(currentZone===1 && killCount>=ZONE1_SECRET_KEY_KILLS && !player.secret1Key && !hasKeyDropKind('secret1')){
    spawnKeyDrop(Math.floor(player.x+player.w/2)-3, Math.floor(player.y+player.h/2)-3,'secret1');
    floatTexts.push({x:player.x+player.w/2,y:player.y-8,text:'SECRET KEY!',life:52,max:52,col:C.MG2});
  }
  if(currentZone===2 && getZoneProgressKills(2)>=ZONE2_KEY_KILLS && !player.zone2Key && !hasKeyDropKind('zone2')){
    spawnKeyDrop(Math.floor(player.x+player.w/2)-3, Math.floor(player.y+player.h/2)-3,'zone2');
    floatTexts.push({x:player.x+player.w/2,y:player.y-8,text:'KEY!',life:46,max:46,col:C.BN1});
  }
  syncKillSpawnSchedulesFromCount();
  for(const spawn of pSpawns){
    spawn.t=Math.min(spawn.t, spawn.giant ? giantSpawnDelay() : regularSpawnDelay());
  }
  if(!dragonBoss && !shadowBoss && !isSecretZone(currentZone)){
    if(nextChestAt<=killCount){
      if(!chest) spawnChest();
      nextChestAt=killCount+getChestKillStepForZone(currentZone);
    }
  }
}

function devSetEditableStats(stats){
  if(!player || !stats || typeof stats!=='object') return;
  const changed=[];
  if(Object.prototype.hasOwnProperty.call(stats,'sword')){
    const lvl=Math.max(0, Math.floor(Number(stats.sword)||0));
    player.swordLevel=lvl;
    player.swordReach=11 + lvl*6;
    player.swordWidth=Math.min(4, lvl);
    changed.push('SWORD '+lvl);
  }
  if(Object.prototype.hasOwnProperty.call(stats,'speed')){
    const lvl=Math.max(0, Math.floor(Number(stats.speed)||0));
    player.speedLevel=lvl;
    player.speed=Math.min(MAX_PLAYER_SPEED, PLAYER_BASE_SPEED + SPEED_UP_STEP*lvl);
    changed.push('SPEED '+lvl);
  }
  if(Object.prototype.hasOwnProperty.call(stats,'points')){
    score=Math.max(0, Math.floor(Number(stats.points)||0));
    changed.push('POINTS '+score);
  }
  if(Object.prototype.hasOwnProperty.call(stats,'kills')){
    killCount=Math.max(0, Math.floor(Number(stats.kills)||0));
    syncDevKillThresholds();
    changed.push('KILLS '+killCount);
  }
  if(changed.length){
    pushDevFloat(changed.join(' • '), C.BN1);
  }
}

const __bonecrawlerDevApi = {
  toggleGodMode: ()=>toggleDevGodMode(),
  setGodMode: (enabled)=>setDevGodMode(enabled),
  spawnChest: ()=>devSpawnChestAtPlayer(),
  advanceProgress: ()=>devAdvanceProgress(),
  skipBossPhase: ()=>devSkipBossPhase(),
  setStats: (stats)=>devSetEditableStats(stats),
  gotoZone: (zone)=>devGotoZone(zone),
  getSnapshot: ()=>({
    state:gState,
    zone:currentZone,
    score:score,
    kills:killCount,
    normalKills:normalKillCount,
    giantKills:giantKillCount,
    wizardKills:wizardKillCount,
    dragonActive:!!dragonBoss,
    dragonPhase:dragonBoss ? dragonBoss.phase : 0,
    dragonHp:dragonBoss ? dragonBoss.hp : 0,
    shadowActive:!!shadowBoss,
    shadowPhase:shadowBoss ? shadowBoss.phase : 0,
    shadowHp:shadowBoss ? shadowBoss.hp : 0,
    bossDefeated:!!bossDefeated, zone1MiniBossDefeated:!!zone1MiniBossDefeated,
    shadowBossDefeated:!!shadowBossDefeated,
    godMode:!!devGodMode,
    playerHp:player ? player.hp : 0,
    playerMaxHp:player ? player.maxHp : 0,
    swordLevel:player ? (player.swordLevel||0) : 0,
    speedLevel:player ? (player.speedLevel||0) : 0,
    playerSpeed:player ? Number((player.speed||0).toFixed(2)) : 0,
  })
};
window.__bonecrawlerDevApi = __bonecrawlerDevApi;
if(window.__registerBoneCrawlerDevHooks){
  window.__registerBoneCrawlerDevHooks(__bonecrawlerDevApi);
}
window.dispatchEvent(new CustomEvent('bonecrawler-dev-api-ready'));


// BoneCrawler safe split module
// Purpose: Reset/start/retry flow, checkpoints, queued reward dialogs, New Game Plus startup flow.
// Source: app.js lines 1806-2096
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function resetGame(){
  player={
    x:GW/2-4, y:GH/2, w:8, h:8, speed:PLAYER_BASE_SPEED,
    dir:'down', hp:6, maxHp:10, visibleHearts:3,
    atkT:0, atkCD:0, hurtT:0, walkF:0, dead:false,
    swordReach:11, swordLevel:0, swordWidth:1,
    shield:false, shieldBreakT:0, shieldLevel:0,
    speedLevel:0, hasKey:false, zone1DoorKey:false, secret1Key:false, zone2Key:false,
    shadowStep:false, stepLevel:0, dodgeInvulnT:0,
  };
  pendingRewardDialogs=[];
  if(masterSwordOwned){
    player.swordLevel=Math.max(player.swordLevel||0, MASTER_SWORD_START_LEVEL);
    player.swordReach=Math.max(player.swordReach||11, MASTER_SWORD_START_REACH);
    player.swordWidth=Math.max(player.swordWidth||1, MASTER_SWORD_START_WIDTH);
    player.hp=player.maxHp;
    player.visibleHearts=Math.max(player.visibleHearts||3, MASTER_SWORD_START_HEART_SLOTS);
  }
  if(newGamePlus){
    player.hp=player.maxHp;
    player.visibleHearts=Math.max(player.visibleHearts||3, MASTER_SWORD_START_HEART_SLOTS);
  }
  enemies=[]; parts=[]; pSpawns=[]; frame=0; score=0; prevSpc=false;
  killCount=0; nextChestAt=10; nextGiantAt=GIANT_KILL_INTERVAL_START; chest=null; floatTexts=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; keyDrop=[]; fireballs=[]; nextWizardAt=WIZARD_KILL_INTERVAL_START; giantKillInterval=GIANT_KILL_INTERVAL_START; wizardKillInterval=WIZARD_KILL_INTERVAL_START; currentZone=1;
  zone1KillStart=0; zone2KillStart=0; zone3KillStart=0;
  normalKillCount=0; giantKillCount=0; wizardKillCount=0;
  pendingZoneTransition=0;
  zoneTransitionInfo=null;
  leaveZonePromptData=null;
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  shadowBoss=null; shadowWaves=[]; shadowBossDefeated=false; shadowWizardRespawns=[];
  bossClearTimer=0;
  secret1BlessingT=0;
  secret2NpcMet=false;
  secret1RatTalkCount=0;
  secret1NodeSpoken=false;
  zone1DoorKeyDialogShown=false;
  zone1Kill90DialogShown=false;
  zone1Kill109DialogShown=false;
  zone2IntroDialogShown=false;
  zone2Kill30DialogShown=false;
  zone3IntroDialogShown=false;
  zone3Kill80DialogShown=false;
  zone3BossDefeatDialogShown=false;
  startupDialogCompletedThisRun=false;
  dialogPages=[];
  dialogPageIndex=0;
  dialogTitle='WOUNDED STRANGER';
  dialogMode='npc';
  zone1Broken=Array(ZONE1_DECOR_BREAK_RECTS.length).fill(false);
  zone1Rubble=[];
  zone2Broken=Array(ZONE2_DECOR_BREAK_RECTS.length).fill(false);
  zone3Broken=Array(ZONE3_DECOR_BREAK_RECTS.length).fill(false);
  runStartMs=performance.now();
  runSaved=false;
  runTimeMs=0;
  pauseStartedMs=0;
  runCompleted=false;
  retryCheckpoint=null;
  retryTaxPaid=false;
  retryPromptMode='';
  secret1UnlockAlertShown=false;
  secret1UnlockAlertT=0;
  whirlwindChargeT=0;
  whirlwindCooldownT=0;
  whirlwindSlashT=0;
  dodgeCooldownT=0;
  potionCount=0;
  potionDialogSeenThisRun=false;
  zone3TreeHits=0;
  zone3TreeShakeT=0;
  zone3TreeAwake=false;
  zone3TreeMet=false;
  rollUpgradeChoices();
  qSpawn(80, false, false, 'normalEnemy1');
  qSpawn(92, false, false, 'normalEnemy3');
}


function createZoneRetryCheckpoint(zone){
  if(zone!==2 && zone!==3) return;
  retryCheckpoint={
    zone,
    score:Math.max(0, score|0),
    killCount:Math.max(0, killCount|0),
    normalKillCount:Math.max(0, normalKillCount|0),
    giantKillCount:Math.max(0, giantKillCount|0),
    wizardKillCount:Math.max(0, wizardKillCount|0),
    nextGiantAt:Math.max(GIANT_KILL_INTERVAL_START, nextGiantAt|0),
    giantKillInterval:Math.max(GIANT_KILL_INTERVAL_MIN, giantKillInterval|0),
    nextWizardAt:Math.max(WIZARD_KILL_INTERVAL_START, nextWizardAt|0),
    wizardKillInterval:Math.max(WIZARD_KILL_INTERVAL_MIN, wizardKillInterval|0),
    player:{
      hp:player.hp,
      maxHp:player.maxHp,
      visibleHearts:player.visibleHearts||3,
      swordReach:player.swordReach||11,
      swordLevel:player.swordLevel||0,
      swordWidth:Math.max(1, player.swordWidth||1),
      shield:!!player.shield,
      shieldLevel:player.shieldLevel||0,
      speed:player.speed||PLAYER_BASE_SPEED,
      speedLevel:player.speedLevel||0,
      dir:player.dir||'down',
      zone1DoorKey:!!player.zone1DoorKey,
      secret1Key:!!player.secret1Key,
      zone2Key:!!player.zone2Key,
      shadowStep:!!player.shadowStep,
      stepLevel:player.stepLevel||0
    },
    potionCount:Math.max(0,potionCount|0),
    zone3TreeHits:Math.max(0, zone3TreeHits|0),
    zone3TreeAwake:!!zone3TreeAwake,
    zone3TreeMet:!!zone3TreeMet,
    secret1NodeSpoken:!!secret1NodeSpoken
  };
}

function getRetryZoneLabel(zone){
  if(zone===2) return 'Zone 2';
  if(zone===3) return 'Zone 3';
  if(zone===ZONE_SECRET2) return 'Secret Zone 2';
  return 'Zone 1';
}

function queueRewardDialog(title, pages){
  if(!pages || !pages.length) return false;
  pendingRewardDialogs.push({
    title:title||'REWARD',
    pages:pages.map(page=>page.slice())
  });
  return true;
}
function openQueuedRewardDialog(){
  if(!pendingRewardDialogs.length) return false;
  const next=pendingRewardDialogs.shift();
  dialogTitle=next.title||'REWARD';
  dialogMode='reward';
  dialogPages=next.pages.map(page=>page.slice());
  dialogPageIndex=0;
  clearGameplayKeys();
  gState='dialog';
  return true;
}
function getMasterSwordRewardPages(){
  return [[
    'MASTER SWORD',
    'NEW RUNS START WITH',
    'SWORD LV '+MASTER_SWORD_START_LEVEL,
    'RANGE '+MASTER_SWORD_DISPLAY_RANGE,
    'MAX HEALTH'
  ]];
}
function queueWhirlwindLearnDialog(){
  if(whirlwindLearnDialogSeen) return false;
  whirlwindLearnDialogSeen=true;
  return queueRewardDialog('SKILL LEARNED', [[
    'WHIRLWIND SLASH',
    'HOLD ATTACK',
    'THEN RELEASE'
  ]]);
}
function queueShadowStepDialog(){
  return queueRewardDialog('SKILL LEARNED', [[
    'SHADOW STEP',
    'PRESS SHIFT TO DODGE',
    'BRIEF INVINCIBILITY'
  ]]);
}
function queuePotionAcquireDialog(){
  return queueRewardDialog('ITEM ACQUIRED', [[
    'HEALTH POTION',
    'PRESS P TO HEAL',
    'RESTORES 1 HEART'
  ]]);
}
function queueMasterSwordRewardDialog(){
  if(masterSwordDialogSeen) return false;
  masterSwordDialogSeen=true;
  queueRewardDialog('ITEM ACQUIRED', getMasterSwordRewardPages());
  if(!whirlwindLearnDialogSeen) queueWhirlwindLearnDialog();
  return true;
}
function startNgPlusDialog(){
  masterSwordDialogSeen=true;
  dialogTitle='ITEM ACQUIRED';
  dialogMode='reward';
  dialogPages=getMasterSwordRewardPages();
  dialogPageIndex=0;
  clearGameplayKeys();
  startupDialogPending=false;
  gState='dialog';
}

function openRetryPrompt(){
  if(!retryCheckpoint || retryCheckpoint.zone<2){
    startGame();
    return;
  }
  retryPromptMode = retryTaxPaid ? 'free' : 'cost';
  clearGameplayKeys();
  gState='retry_confirm';
}

function restoreRetryCheckpoint(){
  const cp=retryCheckpoint;
  if(!cp){
    startGame();
    return;
  }

  const scoreBase=Math.max(0, cp.score|0);
  if(!retryTaxPaid){
    score=Math.max(0, Math.floor(scoreBase*(1-RETRY_POINT_SACRIFICE)));
    retryTaxPaid=true;
  } else {
    score=scoreBase;
  }

  killCount=Math.max(0, cp.killCount|0);
  normalKillCount=Math.max(0, cp.normalKillCount|0);
  giantKillCount=Math.max(0, cp.giantKillCount|0);
  wizardKillCount=Math.max(0, cp.wizardKillCount|0);
  nextGiantAt=Math.max(GIANT_KILL_INTERVAL_START, cp.nextGiantAt|0);
  giantKillInterval=Math.max(GIANT_KILL_INTERVAL_MIN, cp.giantKillInterval|0);
  nextWizardAt=Math.max(WIZARD_KILL_INTERVAL_START, cp.nextWizardAt|0);
  wizardKillInterval=Math.max(WIZARD_KILL_INTERVAL_MIN, cp.wizardKillInterval|0);
  if(!cp.nextGiantAt || !cp.nextWizardAt) syncKillSpawnSchedulesFromCount();
  chest=null; clearKeyDrops();
  enemies=[]; pSpawns=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; fireballs=[]; parts=[];
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  shadowBoss=null; shadowWaves=[]; shadowBossDefeated=false; shadowWizardRespawns=[];
  bossClearTimer=0;
  zone1Broken=Array(ZONE1_DECOR_BREAK_RECTS.length).fill(false);
  zone1Rubble=[];
  zone2Broken=Array(ZONE2_DECOR_BREAK_RECTS.length).fill(false);
  zone3Broken=Array(ZONE3_DECOR_BREAK_RECTS.length).fill(false);
  secret1BlessingT=0;
  dialogPages=[];
  dialogPageIndex=0;
  leaveZonePromptData=null;
  pendingRewardDialogs=[];
  whirlwindChargeT=0;
  whirlwindSlashT=0;
  dodgeCooldownT=0;
  runSaved=false;
  runCompleted=false;
  runStartMs=performance.now();
  runTimeMs=0;
  pauseStartedMs=0;
  zone2IntroDialogShown=false;
  zone2Kill30DialogShown=false;
  zone3IntroDialogShown=false;
  zone3Kill80DialogShown=false;
  zone3BossDefeatDialogShown=false;

  if(cp.zone===2) enterZone2();
  else enterZone3();

  player.maxHp=cp.player.maxHp||player.maxHp;
  player.hp=player.maxHp;
  player.visibleHearts=Math.max(5, cp.player.visibleHearts||player.visibleHearts);
  player.swordReach=cp.player.swordReach||player.swordReach;
  player.swordLevel=cp.player.swordLevel||0;
  player.swordWidth=Math.max(1, cp.player.swordWidth||1);
  player.zone1DoorKey=!!cp.player.zone1DoorKey;
  player.secret1Key=!!cp.player.secret1Key;
  player.zone2Key=!!cp.player.zone2Key;
  player.shadowStep=!!cp.player.shadowStep;
  player.stepLevel=cp.player.stepLevel||0;
  player.dodgeInvulnT=0;
  potionCount=Math.max(0, cp.potionCount|0);
  zone3TreeHits=Math.max(0, cp.zone3TreeHits|0);
  zone3TreeAwake=!!cp.zone3TreeAwake;
  zone3TreeMet=!!cp.zone3TreeMet;
  secret1NodeSpoken=!!cp.secret1NodeSpoken;
  zone3TreeShakeT=0;
  player.shield=!!cp.player.shield;
  player.shieldLevel=cp.player.shieldLevel||0;
  player.speed=cp.player.speed||player.speed;
  player.speedLevel=cp.player.speedLevel||0;
  player.dir=cp.player.dir||'down';
  player.dead=false;
  player.hurtT=0;
  player.atkT=0;
  player.atkCD=10;

  clearGameplayKeys();
  gState='playing';
}


// BoneCrawler safe split module
// Purpose: Player attacks, sword hit detection, whirlwind slash, and attack effects.
// Source: app.js lines 2097-2197
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function performPlayerAttack(strength=1){
  const p=player;
  if(!p || p.atkCD>0 || p.atkT>0) return false;
  p.atkT=14;
  p.atkCD=30;
  const dmg = devGodMode ? 999 : Math.max(1, strength|0);
  const box=atkBox(p, p.swordReach);
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e) continue;
    if(ov(box,{x:e.x,y:e.y,w:e.w,h:e.h})){
      e.hp -= dmg;
      burst(e.x+e.w/2, e.y+e.h/2);
      if(e.hp<=0){
        handleEnemyDefeat(i,e,false);
      } else {
        e.hurtT=10;
      }
    }
  }
  if(dragonBoss && dragonBoss.howlT<=0 && ov(box,getDragonHurtBox())){
    damageDragonBoss(devGodMode ? 10 : strength,false);
  }
  if(shadowBoss && shadowBoss.howlT<=0 && ov(box,getShadowHurtBox())){
    damageShadowBoss(devGodMode ? 10 : strength,false);
    const sc=getShadowCenter();
    const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
    if(Math.hypot(pcx-sc.x,pcy-sc.y)<18 && Math.random()<0.85){
      triggerShadowCounter();
    }
  }
  if(currentZone===1){
    for(let i=0;i<ZONE1_DECOR_BLOCKERS.length;i++){
      if(!zone1Broken[i] && ov(box, ZONE1_DECOR_BREAK_RECTS[i])) breakZone1Decor(i);
    }
  }
  if(currentZone===2){
    for(let i=0;i<ZONE2_DECOR_BREAK_RECTS.length;i++){
      if(!zone2Broken[i] && ov(box, ZONE2_DECOR_BREAK_RECTS[i])) breakZone2Decor(i);
    }
  }
  if(currentZone===3){
    if(!zone3TreeAwake && ov(box, ZONE3_TREE_RECT)){
      zone3TreeHits=Math.min(ZONE3_TREE_HITS_TO_WAKE, zone3TreeHits+1);
      zone3TreeShakeT=10;
      burstDecor(ZONE3_TREE_RECT.x+ZONE3_TREE_RECT.w/2, ZONE3_TREE_RECT.y+ZONE3_TREE_RECT.h/2);
      if(zone3TreeHits>=ZONE3_TREE_HITS_TO_WAKE){
        zone3TreeAwake=true;
        floatTexts.push({x:ZONE3_TREE_RECT.x+ZONE3_TREE_RECT.w/2,y:ZONE3_TREE_RECT.y-6,text:'DEKU',life:60,max:60,col:C.MG2});
      }
    }
    for(let i=0;i<ZONE3_DECOR_BREAK_RECTS.length;i++){
      if(!zone3Broken[i] && ov(box, ZONE3_DECOR_BREAK_RECTS[i])) breakZone3Decor(i);
    }
  }
  return true;
}

function performWhirlwindSlash(){
  const p=player;
  if(!p || whirlwindCooldownT>0 || p.dead) return false;
  const cx=p.x+p.w/2, cy=p.y+p.h/2;
  const radius=18 + Math.max(0, p.swordWidth||0);
  whirlwindSlashT=16;
  whirlwindCooldownT=WHIRLWIND_COOLDOWN_FRAMES;
  p.atkT=18;
  p.atkCD=30;

  for(let i=0;i<18;i++){
    const a=(i/18)*Math.PI*2;
    const s=0.5+Math.random()*1.6;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:16+(Math.random()*8|0),max:22,col:Math.random()<0.5?'#d8f6ff':'#7ccfff'});
  }

  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e) continue;
    const ex=e.x+e.w/2, ey=e.y+e.h/2;
    if(Math.hypot(ex-cx,ey-cy) <= radius + Math.max(e.w,e.h)/2){
      e.hp -= devGodMode ? 999 : 2;
      burst(ex, ey);
      if(e.hp<=0){
        handleEnemyDefeat(i,e,false);
      } else {
        e.hurtT=12;
      }
    }
  }

  if(dragonBoss && dragonBoss.howlT<=0){
    const b=getDragonCenter();
    if(Math.hypot(b.x-cx,b.y-cy)<=radius+18) damageDragonBoss(devGodMode ? 10 : 2,false);
  }
  if(shadowBoss && shadowBoss.howlT<=0){
    const s=getShadowCenter();
    if(Math.hypot(s.x-cx,s.y-cy)<=radius+12) damageShadowBoss(devGodMode ? 10 : 2,false);
  }

  floatTexts.push({x:cx,y:cy-8,text:'WHIRLWIND',life:36,max:36,col:C.SH});
  return true;
}

// BoneCrawler safe split module
// Purpose: Enemy spawn queue, spawn timing, enemy type selection, standard/zone enemy creation.
// Source: app.js lines 2198-2390
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function qSpawn(delay, giant, wizard, type){ pSpawns.push({t:delay, giant:!!giant, wizard:!!wizard, type:type||null}); }

function regularSpawnDelay(){
  const progress=getZoneProgressKills(currentZone);
  return progress>=100 ? 56 : 112;
}

function giantSpawnDelay(){
  const progress=getZoneProgressKills(currentZone);
  return progress>=100 ? 60 : 120;
}

function giantKillStep(){
  return Math.max(12, giantKillInterval|0 || 20);
}

const GIANT_KILL_INTERVAL_START=20;
const GIANT_KILL_INTERVAL_MIN=12;
const WIZARD_KILL_INTERVAL_START=30;
const WIZARD_KILL_INTERVAL_MIN=10;

function getNextSpawnThreshold(baseInterval, minInterval, kills){
  let next=baseInterval;
  let interval=baseInterval;
  const safeKills=Math.max(0, kills|0);
  while(next<=safeKills){
    interval=Math.max(minInterval, interval-1);
    next+=interval;
  }
  return {next, interval};
}

function syncKillSpawnSchedulesFromCount(){
  const giantSchedule=getNextSpawnThreshold(GIANT_KILL_INTERVAL_START, GIANT_KILL_INTERVAL_MIN, killCount);
  nextGiantAt=giantSchedule.next;
  giantKillInterval=giantSchedule.interval;

  const wizardSchedule=getNextSpawnThreshold(WIZARD_KILL_INTERVAL_START, WIZARD_KILL_INTERVAL_MIN, killCount);
  nextWizardAt=wizardSchedule.next;
  wizardKillInterval=wizardSchedule.interval;
}

function getEnemyMoveRateForProgress(progress){
  return Math.min(0.68,0.22+Math.sqrt(Math.max(0, progress))*0.035);
}

function getDefaultEnemyMoveRate(){
  return getEnemyMoveRateForProgress(score);
}

function getBaseEnemyMoveRateForZone(zone=currentZone){
  if(zone===2 || zone===3) return getEnemyMoveRateForProgress(getZoneProgressKills(zone));
  return getDefaultEnemyMoveRate();
}

function getZone2EnemyProgressionValue(){
  return Math.max(0, getZoneProgressKills(2));
}

function getZone2BaseEnemyMoveRate(){
  const defaultRate=getBaseEnemyMoveRateForZone(2);
  const progress=getZone2EnemyProgressionValue();
  return defaultRate * (1 + progress*0.0020);
}

function getRegularEnemyWeights(kills=killCount){
  const safeKills=Math.max(0, kills|0);
  return [
    {type:'normalEnemy1', weight:1 + Math.floor(safeKills/20)},
    {type:'normalEnemy2', weight:Math.floor(safeKills/30)},
    {type:'normalEnemy3', weight:1 + Math.floor(safeKills/10)},
  ];
}

function pickRegularEnemyType(kills=killCount){
  const weights=getRegularEnemyWeights(kills).filter(entry=>entry.weight>0);
  let total=0;
  for(const entry of weights) total+=entry.weight;
  if(total<=0) return 'normalEnemy1';
  let roll=Math.random()*total;
  for(const entry of weights){
    roll-=entry.weight;
    if(roll<0) return entry.type;
  }
  return weights[weights.length-1].type;
}

function createStandardEnemyGameObject(kind, x, y, zone=currentZone){
  const base=getBaseEnemyMoveRateForZone(zone);
  const progress=Math.max(0, getZoneProgressKills(zone));

  if(kind==='normalEnemy1'){
    return {
      x,y,w:9,h:9,speed:base,dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'old',enemyType:'normalEnemy1'
    };
  }
  if(kind==='normalEnemy2'){
    return {
      x,y,w:9,h:9,speed:Math.max(0.14, base*0.9),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'new',enemyType:'normalEnemy2'
    };
  }
  if(kind==='normalEnemy3'){
    return {
      x,y,w:9,h:9,speed:Math.max(0.08, base*0.55),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'classic',enemyType:'normalEnemy3'
    };
  }
  if(kind==='giantEnemy1'){
    const giantStage=(giantKillCount|0)<=0 ? 0.7 : Math.max(0.5, 1 - progress*0.0025);
    return {
      x,y,w:18,h:18,speed:Math.max(0.18, base*0.65*giantStage),dir:'left',
      atkT:0,atkCD:95+(Math.random()*50|0),walkF:0,
      hp:3,points:5,giant:true,hurtT:0,variant:'new',enemyType:'giantEnemy1'
    };
  }
  if(kind==='wizardEnemy1'){
    return {
      x,y,w:8,h:8,speed:Math.max(0.14, base*0.45),dir:'left',
      atkT:0,atkCD:160+(Math.random()*60|0),walkF:0,
      hp:1,points:3,giant:false,wizard:true,hurtT:0,shootCD:0,enemyType:'wizardEnemy1'
    };
  }
  return null;
}

function createZone2EnemyGameObject(kind, x, y){
  const base=getZone2BaseEnemyMoveRate();
  const progress=getZone2EnemyProgressionValue();

  if(kind==='normalEnemy1'){
    return {
      x,y,w:9,h:9,speed:base,dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'old',enemyType:'normalEnemy1'
    };
  }
  if(kind==='normalEnemy2'){
    return {
      x,y,w:9,h:9,speed:Math.max(0.14, base*0.9),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'new',enemyType:'normalEnemy2'
    };
  }
  if(kind==='normalEnemy3'){
    return {
      x,y,w:9,h:9,speed:Math.max(0.08, base*0.55),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'classic',enemyType:'normalEnemy3'
    };
  }
  if(kind==='giantEnemy1'){
    const giantStage=(giantKillCount|0)<=0 ? 0.7 : Math.max(0.5, 1 - progress*0.0025);
    return {
      x,y,w:18,h:18,speed:Math.max(0.18, base*0.65*giantStage),dir:'left',
      atkT:0,atkCD:95+(Math.random()*50|0),walkF:0,
      hp:3,points:5,giant:true,hurtT:0,variant:'new',enemyType:'giantEnemy1'
    };
  }
  if(kind==='wizardEnemy1'){
    return {
      x,y,w:8,h:8,speed:Math.max(0.14, base*0.45),dir:'left',
      atkT:0,atkCD:160+(Math.random()*60|0),walkF:0,
      hp:1,points:3,giant:false,wizard:true,hurtT:0,shootCD:0,enemyType:'wizardEnemy1'
    };
  }
  return null;
}

function doSpawn(giant, wizard, type){
  const side=Math.random()*4|0;
  let x,y;
  if(side===0){x=PX+Math.random()*(PW-8);y=PY-10;}
  else if(side===1){x=PX+PW+2;y=PY+Math.random()*(PH-8);}
  else if(side===2){x=PX+Math.random()*(PW-8);y=PY+PH+4;}
  else{x=PX-10;y=PY+Math.random()*(PH-8);}

  if(currentZone===2){
    const enemyKind=wizard ? 'wizardEnemy1' : (giant ? 'giantEnemy1' : (type || pickRegularEnemyType()));
    const enemy=createZone2EnemyGameObject(enemyKind, x, y);
    if(enemy) enemies.push(enemy);
    return;
  }

  const enemyKind=wizard ? 'wizardEnemy1' : (giant ? 'giantEnemy1' : (type || pickRegularEnemyType()));
  const enemy=createStandardEnemyGameObject(enemyKind, x, y, currentZone);
  if(enemy) enemies.push(enemy);
}


// BoneCrawler safe split module
// Purpose: Chest, heart, potion, key drop creation and item alpha/fade helper.
// Source: app.js lines 2391-2431
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function spawnChest(){
  const x=(PX+14+Math.random()*(PW-36))|0;
  const y=(PY+14+Math.random()*(PH-36))|0;
  chest={x,y,w:8,h:8};
}

function spawnHeartDrop(x,y,kind='full'){
  heartDrops.push({
    x:(x|0),y:(y|0),w:7,h:7,
    kind,
    ttl:ITEM_TTL_FRAMES,
    maxTtl:ITEM_TTL_FRAMES,
    fadeFrames:ITEM_FADE_FRAMES,
    bobSeed:Math.random()*Math.PI*2,
  });
}
function spawnHalfHeartDrop(x,y){
  spawnHeartDrop(x,y,'half');
}
function spawnPotionDrop(x,y){
  potionDrops.push({
    x:(x|0),y:(y|0),w:7,h:7,
    ttl:POTION_ITEM_TTL_FRAMES,
    maxTtl:POTION_ITEM_TTL_FRAMES,
    fadeFrames:POTION_ITEM_FADE_FRAMES,
    bobSeed:Math.random()*Math.PI*2,
  });
}
function getGroundItemAlpha(item){
  if(!item || typeof item.ttl!=='number') return 1;
  const fadeFrames=item.fadeFrames||ITEM_FADE_FRAMES;
  if(item.ttl>fadeFrames) return 1;
  const t=Math.max(0, item.ttl/fadeFrames);
  const blink=item.ttl<90 ? (0.7+0.3*Math.sin(frame*0.55 + (item.bobSeed||0))) : 1;
  return Math.max(0, Math.min(1, t*t*blink));
}
function spawnKeyDrop(x,y,kind='zone3'){
  const list=getKeyDropList();
  list.push({x:(x|0),y:(y|0),w:7,h:7,kind});
  keyDrop=list;
}

// BoneCrawler safe split module
// Purpose: Zone obstacle collision, zone labels/rank info, zone transitions, secret-zone entry, interaction target detection.
// Source: app.js lines 2432-2825
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function collidesZone2Tree(x,y,w,h){
  if(currentZone!==2) return false;
  const box={x,y,w,h};
  return ZONE2_TREE_BLOCKERS.some(r=>ov(box,r));
}
function collidesZoneObstacles(x,y,w,h){
  const box={x,y,w,h};
  if(currentZone===1) return ZONE1_DECOR_BLOCKERS.some((r,i)=>!zone1Broken[i]&&ov(box,r)) || ZONE1_EXTRA_BLOCKERS.some(r=>ov(box,r));
  if(currentZone===2) return ZONE2_TREE_BLOCKERS.some(r=>ov(box,r)) || ZONE2_HOLE_BLOCKERS.some(r=>ov(box,r)) || ZONE2_DECOR_BLOCKERS.some((r,i)=>!zone2Broken[i]&&ov(box,r));
  if(currentZone===3) return ZONE3_DECOR_BLOCKERS.some((r,i)=>((i>=ZONE3_DECOR_BREAK_RECTS.length)||!zone3Broken[i])&&ov(box,r));
  if(currentZone===ZONE_SECRET1) return SECRET1_POOL_BLOCKERS.some(r=>ov(box,r));
  if(currentZone===ZONE_SECRET2) return SECRET2_STONE_BLOCKERS.some(r=>ov(box,r));
  return false;
}
function getRankInfo(totalScore, fromZone=currentZone, nextZone=0){
  let thresholds;

  if(fromZone===1 && nextZone===2){
    thresholds = {A:1200, B:1000, C:950};
  } else if(fromZone===2 && nextZone===3){
    thresholds = {A:1500, B:1300, C:1200};
  } else if(fromZone===3 || nextZone===ZONE_SECRET2 || nextZone===-1){
    thresholds = {A:2000, B:1800, C:1700};
  } else {
    thresholds = {A:1200, B:1000, C:950};
  }

  if(totalScore>=thresholds.A) return {rank:'A', message:'Marvelous, Bonecrawler..', lines:['Marvelous, Bonecrawler..']};
  if(totalScore>=thresholds.B) return {rank:'B', message:'Decent work.', lines:['Decent work.']};
  if(totalScore>=thresholds.C) return {rank:'C', message:"You'll need some shapin' up if you work like that.", lines:["You'll need some shapin' up",'if you work like that.']};
  return {rank:'D', message:"Hmm... still alive, I 'spose.", lines:['Hmm... still alive,',"I 'spose."]};
}
function isSecretZone(zone){
  return zone===ZONE_SECRET1 || zone===ZONE_SECRET2;
}
function getZoneLabel(zone){
  if(zone===1) return 'ZONE 1';
  if(zone===2) return 'ZONE 2';
  if(zone===3) return 'ZONE 3';
  if(zone===ZONE_SECRET1 || zone===ZONE_SECRET2) return '????';
  return 'ZONE';
}
function buildZoneTransitionInfo(nextZone, opts={}){
  const fromZone=('fromZone' in opts) ? opts.fromZone : currentZone;
  const hideStats=('hideStats' in opts) ? !!opts.hideStats : isSecretZone(fromZone);
  const rankInfo=getRankInfo(score, fromZone, nextZone);
  return {
    nextZone,
    fromZone,
    hideStats,
    title: opts.title || (hideStats ? '????' : (getZoneLabel(fromZone)+' CLEAR')),
    messageLines: opts.messageLines || (hideStats ? ['Looks like you','found a secret. .'] : (rankInfo.lines||[rankInfo.message])),
    rank: hideStats ? '????' : rankInfo.rank,
  };
}
function openZoneTransition(nextZone, opts={}){
  pendingZoneTransition=nextZone;
  zoneTransitionInfo=buildZoneTransitionInfo(nextZone, opts);
  clearGameplayKeys();
  gState='zone_transition';
}
function finishRunVictory(){
  if(runStartMs>0 && runTimeMs<=0) runTimeMs=performance.now()-runStartMs;
  saveRunIfNeeded();
  pendingZoneTransition=0;
  zoneTransitionInfo=null;
  clearGameplayKeys();
  retryTaxPaid=false;
  retryPromptMode='';
  startupDialogPending=!!newGamePlus;
  gState='title';
}
function continueZoneTransition(){
  if(gState!=='zone_transition') return;
  const info=zoneTransitionInfo||{};
  const nextZone=pendingZoneTransition||2;
  pendingZoneTransition=0;
  zoneTransitionInfo=null;
  if(info.resumePlay){
    clearGameplayKeys();
    gState='playing';
    return;
  }
  if(nextZone===2) enterZone2();
  else if(nextZone===3) enterZone3();
  else if(nextZone===ZONE_SECRET1) enterSecretZone1();
  else if(nextZone===ZONE_SECRET2) enterSecretZone2();
  else if(nextZone===-1) return finishRunVictory();
  clearGameplayKeys();
  gState='playing';
}
function getChestKillStepForZone(zone){
  if(zone===2) return ZONE2_CHEST_KILL_STEP;
  if(zone===3) return ZONE3_CHEST_KILL_STEP;
  return ZONE1_CHEST_KILL_STEP;
}
function getZoneKillTarget(zone=currentZone){
  if(zone===1) return 300;
  if(zone===2) return DRAGON_BOSS_TRIGGER_KILLS;
  if(zone===3) return ZONE3_KEY_KILLS;
  return 0;
}

function getZoneProgressKills(zone=currentZone){
  if(zone===1) return Math.max(0, killCount-zone1KillStart);
  if(zone===2) return Math.max(0, killCount-zone2KillStart);
  if(zone===3) return Math.max(0, killCount-zone3KillStart);
  return killCount;
}

function ensureZoneMomentum(){
  if(isSecretZone(currentZone) || getZoneProgressKills(currentZone)>=getZoneKillTarget(currentZone) || pSpawns.length>0) return;
  const immediateDelay=Math.max(12, Math.floor(regularSpawnDelay()*0.55));
  qSpawn(immediateDelay, false, false, pickRegularEnemyType());
}

function enterZone2(){
  secret1RatTalkCount=0;
  currentZone=2;
  chest=null; clearKeyDrops();
  enemies=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; fireballs=[];
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  bossClearTimer=0;
  parts=[];
  zone2KillStart=killCount;
  nextChestAt=Math.max(nextChestAt, killCount + ZONE2_FIRST_CHEST_DELAY);
  const p=player;
  p.hasKey=false;
  p.zone2Key=false;
  p.zone1DoorKey=false;
  p.secret1Key=false;
  p.x=GW/2-4;
  p.y=PY+PH-14;
  p.atkT=0; p.atkCD=10; p.hurtT=18;
  floatTexts.push({x:GW/2,y:PY+12,text:'ZONE 2',life:50,max:50,col:C.GR});
  ensureZoneMomentum();
  createZoneRetryCheckpoint(2);
}
function enterZone3(){
  secret1RatTalkCount=0;
  currentZone=3;
  chest=null; clearKeyDrops();
  enemies=[]; pSpawns=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; fireballs=[];
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  shadowBoss=null; shadowWaves=[]; shadowBossDefeated=false; shadowWizardRespawns=[];
  bossClearTimer=0;
  parts=[];
  zone3KillStart=killCount;
  zone3IntroDialogShown=false;
  zone3Kill80DialogShown=false;
  zone3BossDefeatDialogShown=false;
  zone3Broken=Array(ZONE3_DECOR_BREAK_RECTS.length).fill(false);
  nextChestAt=Math.max(nextChestAt, killCount + ZONE3_FIRST_CHEST_DELAY);
  syncKillSpawnSchedulesFromCount();
  const p=player;
  p.hasKey=false;
  p.zone2Key=false;
  p.x=GW/2-4;
  p.y=PY+PH-14;
  p.atkT=0; p.atkCD=10; p.hurtT=18;
  floatTexts.push({x:GW/2,y:PY+12,text:'ZONE 3',life:60,max:60,col:C.MG2});
  ensureZoneMomentum();
  createZoneRetryCheckpoint(3);
}
function applySecretZone1Blessing(){
  const p=player;
  p.hp=p.maxHp;
  p.visibleHearts=5;
  p.shield=true;
  p.shieldBreakT=0;
  p.shieldLevel=Math.max(p.shieldLevel||0,5);
  score+=500;
  floatTexts.push({x:GW/2,y:PY+16,text:'+500',life:65,max:65,col:C.BN1});
  floatTexts.push({x:GW/2,y:PY+24,text:'FAIRY BLESSING',life:90,max:90,col:C.MG2});
}
function enterSecretZone1(){
  secret1RatTalkCount=0;
  currentZone=ZONE_SECRET1;
  chest=null; clearKeyDrops();
  enemies=[]; pSpawns=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; fireballs=[];
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  shadowBoss=null; shadowWaves=[]; shadowBossDefeated=false; shadowWizardRespawns=[];
  bossClearTimer=0;
  parts=[];
  const p=player;
  p.hasKey=false;
  p.zone2Key=false;
  p.x=GW/2-4;
  p.y=PY+PH-14;
  p.atkT=0; p.atkCD=10; p.hurtT=0;
  applySecretZone1Blessing();
  if(!whirlwindUnlocked){
    whirlwindUnlocked=true;
    queueWhirlwindLearnDialog();
  }
  secret1BlessingT=SECRET1_BLESSING_FRAMES;
}
function enterSecretZone2(){
  secret1RatTalkCount=0;
  currentZone=ZONE_SECRET2;
  chest=null; clearKeyDrops();
  enemies=[]; pSpawns=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; fireballs=[];
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  bossClearTimer=0;
  parts=[];
  const p=player;
  p.hasKey=false;
  p.zone2Key=false;
  p.x=GW/2-4;
  p.y=PY+PH-14;
  p.atkT=0; p.atkCD=10; p.hurtT=0;
  secret2NpcMet=false;
  dialogPages=[];
  dialogPageIndex=0;
  dialogTitle='WOUNDED STRANGER';
  dialogMode='npc';
  if(masterSwordOwned && !whirlwindUnlocked){
    whirlwindUnlocked=true;
    queueWhirlwindLearnDialog();
  }
  floatTexts.push({x:GW/2,y:PY+18,text:'SECRET ZONE',life:90,max:90,col:C.BN1});
  floatTexts.push({x:GW/2,y:PY+26,text:masterSwordOwned?'SANCTUM':'MASTER SWORD',life:95,max:95,col:C.SH});
  saveRunIfNeeded();
}

function canInteractSecret2Npc(){
  if(currentZone!==ZONE_SECRET2 || !player) return false;
  const p=player;
  const zone={x:SECRET2_NPC_RECT.x-4,y:SECRET2_NPC_RECT.y-4,w:SECRET2_NPC_RECT.w+8,h:SECRET2_NPC_RECT.h+8};
  return ov({x:p.x,y:p.y,w:p.w,h:p.h}, zone);
}

function canInteractSecret2Sword(){
  if(currentZone!==ZONE_SECRET2 || !player || masterSwordOwned) return false;
  const p=player;
  const zone={x:SECRET2_SWORD_RECT.x-4,y:SECRET2_SWORD_RECT.y-4,w:SECRET2_SWORD_RECT.w+8,h:SECRET2_SWORD_RECT.h+8};
  return ov({x:p.x,y:p.y,w:p.w,h:p.h}, zone);
}
function canInteractZone3Tree(){
  if(currentZone!==3 || !player || !zone3TreeAwake) return false;
  const p=player;
  return ov({x:p.x,y:p.y,w:p.w,h:p.h}, ZONE3_TREE_INTERACT_RECT);
}
function canInteractSecret1Rat(){
  if(currentZone!==ZONE_SECRET1 || !player) return false;
  const p=player;
  return ov({x:p.x,y:p.y,w:p.w,h:p.h}, SECRET1_RAT_INTERACT_RECT);
}
function canInteractZone3Secret2Portal(){
  if(currentZone!==3 || !player) return false;
  if(!shadowBossDefeated || score<SECRET2_SCORE_REQ) return false;
  const p=player;
  const zone={x:ZONE3_SECRET2_PORTAL_RECT.x-4,y:ZONE3_SECRET2_PORTAL_RECT.y-4,w:ZONE3_SECRET2_PORTAL_RECT.w+8,h:ZONE3_SECRET2_PORTAL_RECT.h+8};
  return ov({x:p.x,y:p.y,w:p.w,h:p.h}, zone);
}
function canInteractSecret2ReturnPortal(){
  if(currentZone!==ZONE_SECRET2 || !player) return false;
  const p=player;
  const zone={x:SECRET2_RETURN_PORTAL_RECT.x-4,y:SECRET2_RETURN_PORTAL_RECT.y-4,w:SECRET2_RETURN_PORTAL_RECT.w+8,h:SECRET2_RETURN_PORTAL_RECT.h+8};
  return ov({x:p.x,y:p.y,w:p.w,h:p.h}, zone);
}
function isNearRect(rect,pad=4){
  if(!player || !rect) return false;
  const p=player;
  const zone={x:rect.x-pad,y:rect.y-pad,w:rect.w+pad*2,h:rect.h+pad*2};
  return ov({x:p.x,y:p.y,w:p.w,h:p.h}, zone);
}
function getActiveZoneTransitionInteractable(){
  if(!player) return null;
  if(currentZone===1){
    if(zone1SecretEntranceReady() && zone1Broken[0] && isNearRect(SECRET1_ENTRANCE_RECT,4)){
      return {
        id:'zone1_secret1',
        rect:SECRET1_ENTRANCE_RECT,
        promptX:SECRET1_ENTRANCE_RECT.x + SECRET1_ENTRANCE_RECT.w/2,
        promptY:SECRET1_ENTRANCE_RECT.y - 4,
        nextZone:ZONE_SECRET1,
        transitionOpts:{fromZone:1}
      };
    }
    if(player.zone1DoorKey && isNearRect(ZONE1_DOOR_RECT,4)){
      return {
        id:'zone1_zone2',
        rect:ZONE1_DOOR_RECT,
        promptX:ZONE1_DOOR_RECT.x + ZONE1_DOOR_RECT.w/2,
        promptY:ZONE1_DOOR_RECT.y - 4,
        nextZone:2,
        transitionOpts:{fromZone:1}
      };
    }
  }
  if(currentZone===ZONE_SECRET1 && secret1BlessingT<=0 && isNearRect(SECRET1_EXIT_DOOR_RECT,4)){
    return {
      id:'secret1_exit',
      rect:SECRET1_EXIT_DOOR_RECT,
      promptX:SECRET1_EXIT_DOOR_RECT.x + SECRET1_EXIT_DOOR_RECT.w/2,
      promptY:SECRET1_EXIT_DOOR_RECT.y - 4,
      nextZone:2,
      transitionOpts:{fromZone:ZONE_SECRET1, secret:true}
    };
  }
  if(currentZone===3){
    if(player.hasKey && isNearRect(ZONE3_DOOR_RECT,4)){
      return {
        id:'zone3_exit',
        rect:ZONE3_DOOR_RECT,
        promptX:ZONE3_DOOR_RECT.x + ZONE3_DOOR_RECT.w/2,
        promptY:ZONE3_DOOR_RECT.y - 4,
        nextZone:-1,
        transitionOpts:{fromZone:3,title:'ZONE CLEAR',messageLines:['Well done,','Bonecrawler'],hideStats:false}
      };
    }
    if(canInteractZone3Secret2Portal()){
      return {
        id:'zone3_secret2',
        rect:ZONE3_SECRET2_PORTAL_RECT,
        promptX:ZONE3_SECRET2_PORTAL_RECT.x + ZONE3_SECRET2_PORTAL_RECT.w/2,
        promptY:ZONE3_SECRET2_PORTAL_RECT.y - 4,
        nextZone:ZONE_SECRET2,
        transitionOpts:{fromZone:3}
      };
    }
  }
  if(currentZone===ZONE_SECRET2 && canInteractSecret2ReturnPortal()){
    return {
      id:'secret2_return',
      rect:SECRET2_RETURN_PORTAL_RECT,
      promptX:SECRET2_RETURN_PORTAL_RECT.x + SECRET2_RETURN_PORTAL_RECT.w/2,
      promptY:SECRET2_RETURN_PORTAL_RECT.y - 4,
      nextZone:-1,
      transitionOpts:{fromZone:3,title:'ZONE CLEAR',messageLines:['Well done,','Bonecrawler'],hideStats:false}
    };
  }
  return null;
}
function getCurrentInteractionTarget(){
  if(gState!=='playing') return null;
  if(canInteractSecret2Sword()) return {type:'secret2Sword', promptX:SECRET2_SWORD_RECT.x + SECRET2_SWORD_RECT.w/2, promptY:SECRET2_SWORD_RECT.y - 3};
  if(canInteractSecret2Npc()) return {type:'secret2Npc', promptX:SECRET2_NPC_RECT.x + SECRET2_NPC_RECT.w/2, promptY:SECRET2_NPC_RECT.y - 6};
  if(canInteractZone3Tree()) return {type:'zone3Tree', promptX:ZONE3_TREE_INTERACT_RECT.x + ZONE3_TREE_INTERACT_RECT.w/2, promptY:ZONE3_TREE_INTERACT_RECT.y - 4};
  if(canInteractSecret1Rat()) return {type:'secret1Rat', promptX:SECRET1_RAT_RECT.x + SECRET1_RAT_RECT.w/2, promptY:SECRET1_RAT_RECT.y - 5};
  const transition=getActiveZoneTransitionInteractable();
  if(transition) return {type:'transition', promptX:transition.promptX, promptY:transition.promptY, data:transition};
  return null;
}
function openDialogSequence(title, pages, mode='npc'){
  dialogTitle=title||'NODE';
  dialogMode=mode;
  dialogPages=(pages||[]).map(page=>Array.isArray(page) ? page.slice() : {speaker:String(page.speaker||title||'NODE').toUpperCase(),lines:(page.lines||[]).slice()});
  dialogPageIndex=0;
  clearGameplayKeys();
  gState='dialog';
}
function startLeaveZoneConfirm(transition){
  if(!transition) return;
  leaveZonePromptData=transition;
  clearGameplayKeys();
  gState='leave_zone_confirm';
}
function confirmLeaveZone(){
  if(gState!=='leave_zone_confirm' || !leaveZonePromptData) return;
  const transition=leaveZonePromptData;
  if(transition.id==='zone3_exit' || transition.id==='secret2_return') runCompleted=true;
  leaveZonePromptData=null;
  openZoneTransition(transition.nextZone, transition.transitionOpts||{});
}
function cancelLeaveZone(){
  if(gState!=='leave_zone_confirm') return;
  leaveZonePromptData=null;
  clearGameplayKeys();
  gState='playing';
}
function startSecret1RatDialog(){
  if(currentZone!==ZONE_SECRET1) return;
  let pages;
  if(secret1RatTalkCount<=0){
    pages=[
      {speaker:'RAT',lines:['...']},
      {speaker:'PLAYER',lines:['...']}
    ];
    secret1RatTalkCount=1;
  } else {
    pages=[
      {speaker:'NODE',lines:["C'mon man, would you just", "play the game?"]},
      {speaker:'PLAYER',lines:["You're a rat?"]},
      {speaker:'NODE',lines:["Game's short, we ain't got time","discussin' this.","Dijya' even pay for this game?"]},
      {speaker:'PLAYER',lines:['.. Maybe.']},
      {speaker:'NODE',lines:["Sheesh. Go on, get otta' 'ere"]}
    ];
    secret1RatTalkCount=2;
    secret1NodeSpoken=true;
  }
  openDialogSequence('NODE', pages, 'npc');
}

// BoneCrawler safe split module
// Purpose: Primary interaction handling, scripted zone dialogs, NPC/sword/tree dialogs, dialog advance/skip, player damage entry point.
// Source: app.js lines 2826-3024
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function handlePrimaryInteract(){
  const target=getCurrentInteractionTarget();
  if(!target) return false;
  if(target.type==='secret2Npc') startSecret2NpcDialog();
  else if(target.type==='secret2Sword') startSecret2SwordDialog();
  else if(target.type==='zone3Tree') startZone3TreeDialog();
  else if(target.type==='secret1Rat') startSecret1RatDialog();
  else if(target.type==='transition') startLeaveZoneConfirm(target.data);
  else return false;
  return true;
}
function maybeTriggerScriptedZoneDialog(){
  if(gState!=='playing') return false;
  if(currentZone===1){
    const progress=getZoneProgressKills(1);
    if(!zone1DoorKeyDialogShown && hasKeyDropKind('zone1Door')){
      zone1DoorKeyDialogShown=true;
      openDialogSequence('NODE', [{speaker:'NODE',lines:['Grab the key!']}]);
      return true;
    }
    if(!zone1Kill90DialogShown && progress>=90){
      zone1Kill90DialogShown=true;
      openDialogSequence('NODE', [{speaker:'NODE',lines:["There's a grate to the left..","It looks locked..","Maybe there's a way to unlock it?"]}]);
      return true;
    }
    if(!zone1Kill109DialogShown && progress>=109){
      zone1Kill109DialogShown=true;
      openDialogSequence('NODE', [
        {speaker:'NODE',lines:['I hear something..']},
        {speaker:'NODE',lines:['.. keep fighting.']}
      ]);
      return true;
    }
  }
  if(currentZone===2){
    const progress=getZoneProgressKills(2);
    if(!zone2IntroDialogShown){
      zone2IntroDialogShown=true;
      openDialogSequence('NODE', [
        {speaker:'NODE',lines:['Seeesh. How many skellys was that?']},
        {speaker:'PLAYER',lines:['Too many.']},
        {speaker:'NODE',lines:['Yeah. Good job!','.... Now do it again!']},
        {speaker:'PLAYER',lines:['Here they come..']}
      ]);
      return true;
    }
    if(!zone2Kill30DialogShown && progress>=25){
      zone2Kill30DialogShown=true;
      openDialogSequence('NODE', [
        {speaker:'NODE',lines:['Shh.. do you hear that?','I smell a dragon!']},
        {speaker:'PLAYER',lines:[secret1NodeSpoken ? 'Rats can smell dragons?' : 'Wait, what? Are you here?']},
        {speaker:'NODE',lines:['....']},
        {speaker:'PLAYER',lines:['Here we go again..']}
      ]);
      return true;
    }
  }
  if(currentZone===3){
    const progress=getZoneProgressKills(3);
    if(!zone3IntroDialogShown){
      zone3IntroDialogShown=true;
      openDialogSequence('NODE', [
        {speaker:'NODE',lines:['I smell an evil soul..',"it's in here somewhere"]}
      ]);
      return true;
    }
    if(!zone3Kill80DialogShown && progress>=80){
      zone3Kill80DialogShown=true;
      openDialogSequence('NODE', [
        {speaker:'NODE',lines:["Don't give up!"]}
      ]);
      return true;
    }
    if(!zone3BossDefeatDialogShown && shadowBossDefeated){
      zone3BossDefeatDialogShown=true;
      openDialogSequence('NODE', [
        {speaker:'NODE',lines:['Good job..',"You'll do good Bonecrawler."]},
        {speaker:'NODE',lines:['See ya next game.']}
      ]);
      return true;
    }
  }
  return false;
}

function startSecret2NpcDialog(){
  if(currentZone!==ZONE_SECRET2) return;
  dialogTitle='WOUNDED STRANGER';
  dialogMode='npc';
  dialogPages = secret2NpcMet
    ? [['......'],["There's a name engraved on his sword",'ImmaGundam']]
    : [['You . . . found me . .','Thank you. . for. . playing. .'],['......'],["There's a name engraved on his sword",'ImmaGundam']];
  secret2NpcMet = true;
  dialogPageIndex = 0;
  clearGameplayKeys();
  gState='dialog';
}

function claimSecret2MasterSword(){
  if(currentZone!==ZONE_SECRET2 || masterSwordOwned) return;
  masterSwordOwned=true;
  newGamePlus=true;
  masterSwordDialogSeen=true;
  if(!whirlwindUnlocked) whirlwindUnlocked=true;
  if(!whirlwindLearnDialogSeen) queueWhirlwindLearnDialog();
  dialogTitle='ITEM ACQUIRED';
  dialogMode='reward';
  dialogPages = getMasterSwordRewardPages();
  dialogPageIndex = 0;
  saveRunIfNeeded();
  clearGameplayKeys();
  gState='dialog';
}

function startSecret2SwordDialog(){
  if(currentZone!==ZONE_SECRET2 || masterSwordOwned) return;
  clearGameplayKeys();
  gState='secret2_sword_confirm';
}
function startZone3TreeDialog(){
  if(currentZone!==3 || !zone3TreeAwake) return;
  dialogTitle='DEKU';
  dialogMode='npc';
  dialogPages=[['.....']];
  zone3TreeMet=true;
  dialogPageIndex=0;
  clearGameplayKeys();
  gState='dialog';
}

function drawInteractPrompt(cx, cy){
  const bob = Math.sin(frame*0.18)*1.2;
  const x = Math.round(cx-4);
  const y = Math.round(cy-8+bob);

  ctx.globalAlpha = 0.24 + 0.10*Math.sin(frame*0.16);
  fr(x-2,y-2,10,10,C.MG);
  ctx.globalAlpha = 1;
  fr(x-1,y-1,8,8,C.DK);
  fr(x,y,6,6,C.W3);
  fr(x+1,y+1,4,4,C.DK);
  pt('E',(x+3)*SCALE,(y+1)*SCALE,5,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function advanceDialog(){
  if(gState!=='dialog') return;
  dialogPageIndex++;
  if(dialogPageIndex>=dialogPages.length){
    const wasOpening=dialogMode==='opening';
    dialogPages=[];
    dialogPageIndex=0;
    if(wasOpening) startupDialogCompletedThisRun=true;
    clearGameplayKeys();
    gState='playing';
  }
}

function skipDialog(){
  if(gState!=='dialog') return;
  const wasOpening=dialogMode==='opening';
  dialogPages=[];
  dialogPageIndex=0;
  if(wasOpening) startupDialogCompletedThisRun=true;
  clearGameplayKeys();
  gState='playing';
}

function hurtPlayer(amount=1){
  const p=player;
  if(!p) return false;
  if(devGodMode){
    p.dead=false;
    p.hp=p.maxHp;
    p.hurtT=0;
    p.shield=true;
    p.shieldBreakT=0;
    return false;
  }
  if(p.dead || p.hurtT>0 || (p.dodgeInvulnT||0)>0) return false;
  if(p.shield){
    p.shield=false;
    p.shieldBreakT=24;
    p.hurtT=35;
    shieldBurst(p.x+4,p.y+4);
    triggerShieldShockwave(p.x+4,p.y+4);
    return true;
  }
  p.hp=Math.max(0,p.hp-amount);
  p.hurtT=amount>1?52:40;
  if(p.hp<=0){
    p.dead=true;
    runTimeMs=performance.now()-runStartMs;
    saveRunIfNeeded();
    setTimeout(()=>{gState='gameover';},1200);
  }
  return true;
}


// BoneCrawler safe split module
// Purpose: Dragon boss and corrupted/shadow boss spawning, AI updates, attacks, damage, and defeat flow.
// Source: app.js lines 3025-3631
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function getDragonCenter(b=dragonBoss){
  return b ? {x:b.x+b.w/2, y:b.y+b.h/2} : {x:0,y:0};
}

function getDragonHurtBox(b=dragonBoss){
  if(!b) return {x:0,y:0,w:0,h:0};
  return {x:b.x+4,y:b.y+4,w:b.w-8,h:b.h-6};
}

function clearDragonHazards(){
  dragonFlames=[];
  dragonSwipe=null;
  fireballs=fireballs.filter(f=>!f.dragon);
}

function countDragonFightNormalAdds(){
  return enemies.filter(e=>!e.giant && !e.wizard).length;
}

function countDragonFightWizards(){
  return enemies.filter(e=>e.wizard).length;
}

function countShadowBossWizards(){
  return enemies.filter(e=>e.shadowBossWizard).length;
}

function spawnWizardNearShadow(){
  const b=shadowBoss;
  if(!b || shadowBossDefeated) return false;
  const c=getShadowCenter(b);
  const candidates=[
    {x:Math.round(c.x-18), y:Math.round(c.y-10)},
    {x:Math.round(c.x+10), y:Math.round(c.y-10)},
    {x:Math.round(c.x-18), y:Math.round(c.y+8)},
    {x:Math.round(c.x+10), y:Math.round(c.y+8)},
    {x:Math.round(c.x-4), y:Math.round(c.y-18)},
  ];
  for(const cand of candidates){
    const x=Math.max(PX, Math.min(PX+PW-8, cand.x));
    const y=Math.max(PY+2, Math.min(PY+PH-8, cand.y));
    const box={x,y,w:8,h:8};
    if(collidesZoneObstacles(x,y,8,8)) continue;
    if(ov(box,{x:player.x,y:player.y,w:player.w,h:player.h})) continue;
    if(enemies.some(e=>ov(box,{x:e.x,y:e.y,w:e.w,h:e.h}))) continue;
    enemies.push({x,y,w:8,h:8,speed:0.30,dir:'left',
      atkT:0,atkCD:140,walkF:0,hp:1,points:3,giant:false,wizard:true,hurtT:0,shootCD:64,
      shadowBossWizard:true});
    return true;
  }
  return false;
}

function ensureCrawlerWizardRespawns(){
  if(!shadowBoss || shadowBossDefeated) return;
  const desired = shadowBoss.phase===1 ? 1 : 2;
  let alive = countShadowBossWizards();
  for(let i=shadowWizardRespawns.length-1;i>=0;i--){
    shadowWizardRespawns[i]--;
    if(shadowWizardRespawns[i] <= 0){
      if(alive < desired && spawnWizardNearShadow()){
        shadowWizardRespawns.splice(i,1);
        alive++;
      } else {
        shadowWizardRespawns[i] = 30;
      }
    }
  }
}

function spawnWizardNearDragon(){
  const b=dragonBoss;
  if(!b || countDragonFightWizards()>=DRAGON_MAX_WIZARDS) return;
  const x=Math.max(PX, Math.min(PX+PW-8, b.x + (b.dir==='right' ? b.w-10 : 2)));
  const y=Math.max(PY, Math.min(PY+PH-8, b.y+b.h+2));
  enemies.push({x,y,w:8,h:8,speed:0.26,dir:'left',
    atkT:0,atkCD:150,walkF:0,hp:1,points:3,giant:false,wizard:true,hurtT:0,shootCD:70});
}

function spawnNormalFromDragon(){
  const b=dragonBoss;
  if(!b || countDragonFightNormalAdds()>=DRAGON_MAX_NORMAL_ADDS) return;
  const normalVariants=['old','new','classic'];
  const x=Math.max(PX, Math.min(PX+PW-9, b.x + (b.dir==='right' ? 2 : b.w-11) + ((Math.random()*5)|0)));
  const y=Math.max(PY, Math.min(PY+PH-9, b.y+b.h-4 + ((Math.random()*4)|0)));
  enemies.push({x,y,w:9,h:9,speed:0.34,dir:b.dir,
    atkT:0,atkCD:90+(Math.random()*40|0),walkF:0,
    hp:1,points:1,giant:false,hurtT:0,variant:normalVariants[(Math.random()*normalVariants.length)|0]});
}

function spawnDragonBoss(){
  if((currentZone!==1 && currentZone!==2) || dragonBoss || bossDefeated) return;
  if(currentZone===1 && zone1MiniBossDefeated) return;
  chest=null; clearKeyDrops();
  enemies=[]; pSpawns=[]; fireballs=[]; dragonFlames=[]; dragonSwipe=null;
  const zone1Mini=currentZone===1;
  const phaseHp=zone1Mini ? ZONE1_DRAGON_PHASE_HITS : DRAGON_PHASE_HITS;
  dragonBoss={
    x:GW/2-18, y:PY+8, w:36, h:28,
    dir:'left', speed:0.18, walkF:0,
    phase:1, hp:phaseHp, maxHp:phaseHp,
    phaseHp,
    hurtT:0, atkT:0, atkName:'', howlT:0,
    fireballCD:110, fireblastCD:145, tailCD:52,
    summonT:DRAGON_SUMMON_INTERVAL, spawnLock:36,
    zone1Mini,
    points:zone1Mini?200:300,
  };
  floatTexts.push({x:GW/2,y:PY+12,text:(zone1Mini?'MINIBOSS: BONE DRAGON':'BOSS: SKELETON DRAGON'),life:85,max:85,col:C.FR1});
}

function rollFireballSpeed(base){
  const slowerBase=base*0.5;
  const variance=0.8 + Math.random()*0.4;
  return slowerBase*variance;
}

function spawnDragonFireball(){
  const b=dragonBoss;
  if(!b) return;
  const {x:cx,y:cy}=getDragonCenter(b);
  const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
  const dx=pcx-cx, dy=pcy-cy;
  const baseAng=Math.atan2(dy,dx);
  const spread=[-0.22,0,0.22];
  const sx=cx+(b.dir==='right'?8:-8), sy=cy-6;

  for(const off of spread){
    const ang=baseAng+off;
    const spd=rollFireballSpeed(0.92);
    fireballs.push({
      x:sx,y:sy,
      vx:Math.cos(ang)*spd,
      vy:Math.sin(ang)*spd,
      life:175,
      dragon:true
    });
  }

  b.atkT=24;
  b.atkName='fireball';
}

function spawnDragonFireblast(){
  const b=dragonBoss;
  if(!b) return;
  for(let i=0;i<6;i++){
    const w=6+i*3;
    const h=5+i*2;
    const depth=4+i*5;
    const x=b.dir==='right' ? b.x+b.w-4+depth : b.x-depth-w+4;
    const y=b.y+10-Math.floor(h/2);
    dragonFlames.push({x,y,w,h,ttl:DRAGON_FIREBLAST_TTL,maxTtl:DRAGON_FIREBLAST_TTL});
  }
  b.atkT=26;
  b.atkName='fireblast';
}

function spawnDragonTailSwipe(){
  const b=dragonBoss;
  if(!b) return;
  const w=18, h=18;
  const x=b.dir==='right' ? b.x-16 : b.x+b.w-2;
  const y=b.y+8;
  dragonSwipe={x,y,w,h,ttl:DRAGON_TAIL_TTL,maxTtl:DRAGON_TAIL_TTL};
  b.atkT=18;
  b.atkName='tail';
}

function startDragonPhase2(){
  const b=dragonBoss;
  if(!b) return;
  b.phase=2;
  b.hp=b.phaseHp||DRAGON_PHASE_HITS;
  b.maxHp=b.phaseHp||DRAGON_PHASE_HITS;
  b.howlT=0;
  b.spawnLock=50;
  b.fireballCD=36;
  b.fireblastCD=68;
  b.tailCD=32;
  b.summonT=DRAGON_SUMMON_INTERVAL;
  b.atkT=22;
  b.atkName='phase2';
  spawnWizardNearDragon();
  floatTexts.push({x:GW/2,y:PY+18,text:'PHASE 2',life:70,max:70,col:C.MG2});
}

function defeatDragonBoss(){
  const b=dragonBoss;
  if(!b) return;
  const {x:cx,y:cy}=getDragonCenter(b);
  for(let i=0;i<34;i++){
    const a=Math.random()*Math.PI*2, s=0.5+Math.random()*2.6;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:24+(Math.random()*16|0),max:40,col:Math.random()<0.45?C.WH:(Math.random()<0.6?C.BN1:C.FR1)});
  }
  score+=b.points||100;
  killCount++;
  giantKillCount++;
  clearDragonHazards();
  enemies=[];
  pSpawns=[];
  chest=null;
  if(b.zone1Mini){
    zone1MiniBossDefeated=true;
    // Do NOT set bossDefeated or bossClearTimer — zone 1 resumes normal spawning
  } else {
    bossDefeated=true;
    bossClearTimer=120;
  }
  dragonBoss=null;
  floatTexts.push({x:GW/2,y:PY+16,text:'DRAGON SLAIN!',life:95,max:95,col:C.FR1});
}

function damageDragonBoss(amount=1, fromShockwave=false){
  const b=dragonBoss;
  if(!b || bossDefeated || b.howlT>0) return false;
  b.hp-=amount;
  b.hurtT=10;
  const {x:cx,y:cy}=getDragonCenter(b);
  burst(cx,cy);
  if(fromShockwave){
    floatTexts.push({x:cx,y:b.y-6,text:'-1',life:24,max:24,col:C.SH});
  }
  if(b.hp<=0){
    clearDragonHazards();
    if(b.phase===1){
      b.hp=0;
      b.howlT=160;
      b.atkT=26;
      b.atkName='howl';
      floatTexts.push({x:GW/2,y:PY+16,text:'THE DRAGON HOWLS!',life:80,max:80,col:C.WH});
    } else {
      defeatDragonBoss();
    }
  }
  return true;
}

function chooseDragonAttack(b, dist, playerBehind){
  const options=[];
  if(playerBehind && dist<34 && b.tailCD<=0) options.push(['tail',8]);

  // Fireblast should feel dangerous, but not spammy.
  if(b.fireblastCD<=0){
    if(dist<24) options.push(['fireblast',2]);
    else if(dist<50) options.push(['fireblast',3]);
    else options.push(['fireblast',1]);
  }

  // Fireball is now a 3-shot spread, so weight it lower and pace it out.
  if(b.fireballCD<=0){
    if(dist>60) options.push(['fireball',4]);
    else if(dist>34) options.push(['fireball',2]);
    else options.push(['fireball',1]);
  }

  if(!options.length) return '';
  let total=0;
  for(const [,w] of options) total+=w;
  let roll=Math.random()*total;
  for(const [name,w] of options){
    roll-=w;
    if(roll<=0) return name;
  }
  return options[0][0];
}

function updateDragonBoss(){
  const b=dragonBoss;
  if(!b || bossDefeated) return;
  if(b.hurtT>0) b.hurtT--;
  if(b.atkT>0) b.atkT--;
  if(b.fireballCD>0) b.fireballCD--;
  if(b.fireblastCD>0) b.fireblastCD--;
  if(b.tailCD>0) b.tailCD--;
  if(b.spawnLock>0) b.spawnLock--;
  b.walkF++;

  for(let i=dragonFlames.length-1;i>=0;i--){
    const f=dragonFlames[i];
    f.ttl--;
    if(f.ttl<=0){ dragonFlames.splice(i,1); continue; }
    if(ov({x:player.x,y:player.y,w:player.w,h:player.h},f)) hurtPlayer(1);
  }
  if(dragonSwipe){
    dragonSwipe.ttl--;
    if(dragonSwipe.ttl<=0) dragonSwipe=null;
    else if(ov({x:player.x,y:player.y,w:player.w,h:player.h},dragonSwipe)) hurtPlayer(1);
  }

  const {x:cx,y:cy}=getDragonCenter(b);
  const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
  const ddx=pcx-cx, ddy=pcy-cy;
  const dist=Math.hypot(ddx,ddy)||1;
  b.dir = ddx>=0 ? 'right' : 'left';

  if(b.howlT>0){
    if(frame%12===0){
      parts.push({x:cx+(Math.random()*10-5),y:b.y+4,vx:Math.random()*0.4-0.2,vy:-0.6-Math.random()*0.4,
        life:18,max:24,col:Math.random()<0.5?C.WH:C.MG2});
    }
    b.howlT--;
    if(b.howlT<=0) startDragonPhase2();
    return;
  }

  if(b.phase===2){
    b.summonT--;
    if(b.summonT<=0){
      if(countDragonFightNormalAdds()<DRAGON_MAX_NORMAL_ADDS) spawnNormalFromDragon();
      b.summonT=DRAGON_SUMMON_INTERVAL;
    }
  }

  const ideal=b.phase===1 ? 50 : 42;
  let mvx=Math.sin(frame*0.03)*0.05, mvy=Math.cos(frame*0.025)*0.04;
  if(dist>ideal){
    mvx+=ddx/dist*b.speed;
    mvy+=ddy/dist*b.speed*0.7;
  } else if(dist<18){
    mvx-=ddx/dist*b.speed*0.7;
    mvy-=ddy/dist*b.speed*0.5;
  }
  b.x=Math.max(PX,Math.min(PX+PW-b.w,b.x+mvx));
  b.y=Math.max(PY+2,Math.min(PY+PH-b.h-2,b.y+mvy));

  if(b.spawnLock<=0 && b.atkT<=0){
    const playerBehind=(b.dir==='right') ? (pcx < b.x+10) : (pcx > b.x+b.w-10);
    const attack=chooseDragonAttack(b, dist, playerBehind);
    if(attack==='tail'){
      b.tailCD=b.phase===2?64:82;
      spawnDragonTailSwipe();
    } else if(attack==='fireblast'){
      b.fireblastCD=b.phase===2?118:155;
      spawnDragonFireblast();
    } else if(attack==='fireball'){
      b.fireballCD=b.phase===2?92:128;
      spawnDragonFireball();
    }
  }
}

function getShadowCenter(b=shadowBoss){
  return b ? {x:b.x+b.w/2, y:b.y+b.h/2} : {x:0,y:0};
}

function getShadowHurtBox(b=shadowBoss){
  if(!b) return {x:0,y:0,w:0,h:0};
  return {x:b.x+1,y:b.y+1,w:b.w-2,h:b.h-1};
}

function getShadowSlashBox(b=shadowBoss){
  if(!b) return {x:0,y:0,w:0,h:0};
  if(b.dir==='left') return {x:b.x-6,y:b.y+1,w:7,h:6};
  if(b.dir==='right') return {x:b.x+b.w-1,y:b.y+1,w:7,h:6};
  if(b.dir==='up') return {x:b.x+1,y:b.y-6,w:6,h:7};
  return {x:b.x+1,y:b.y+b.h-1,w:6,h:7};
}

function spawnShadowWave(){
  const b=shadowBoss;
  if(!b) return;
  const c=getShadowCenter(b);
  shadowWaves.push({x:c.x,y:c.y,r:3,maxR:15,life:18,maxLife:18});
}

function triggerShadowCounter(){
  const b=shadowBoss;
  if(!b || shadowBossDefeated || b.howlT>0) return;
  b.counterT=14;
}

function startShadowPhase2(){
  const b=shadowBoss;
  if(!b) return;
  b.phase=2;
  b.hp=SHADOW_PHASE_HITS;
  b.maxHp=SHADOW_PHASE_HITS;
  b.speed=0.40;
  b.atkT=0;
  b.atkName='';
  b.counterT=0;
  b.lungeCD=48;
  b.slashCD=22;
  b.screechCD=90;
  b.screechStartupT=0;
  b.screechT=0;
  b.screechWaveT=SHADOW_SCREECH_WAVE_INTERVAL;
  while(countShadowBossWizards()<2 && spawnWizardNearShadow()){}
  floatTexts.push({x:GW/2,y:PY+18,text:'PHASE 2',life:70,max:70,col:C.FR1});
}

function spawnShadowBoss(){
  if(currentZone!==3 || shadowBoss || shadowBossDefeated) return;
  chest=null; clearKeyDrops();
  enemies=[]; pSpawns=[]; fireballs=[];
  shadowWaves=[];
  shadowBoss={
    x:GW/2-4, y:PY+12, w:8, h:8,
    dir:'down', speed:0.34, walkF:0,
    phase:1, hp:SHADOW_PHASE_HITS, maxHp:SHADOW_PHASE_HITS,
    hurtT:0, atkT:0, atkName:'', howlT:0,
    lungeCD:72, slashCD:30, counterT:0, waveT:SHADOW_WAVE_INTERVAL,
    screechCD:0, screechStartupT:0, screechT:0, screechWaveT:SHADOW_SCREECH_WAVE_INTERVAL,
    lungeVX:0, lungeVY:0
  };
  shadowWizardRespawns=[];
  spawnWizardNearShadow();
  floatTexts.push({x:GW/2,y:PY+12,text:'BOSS: CORRUPTED CRAWLER',life:95,max:95,col:C.MG2});
}

function updateShadowBoss(){
  const b=shadowBoss;
  if(!b || shadowBossDefeated) return;
  if(b.hurtT>0) b.hurtT--;
  if(b.atkT>0) b.atkT--;
  if(b.lungeCD>0) b.lungeCD--;
  if(b.slashCD>0) b.slashCD--;
  if(b.counterT>0) b.counterT--;
  b.walkF++;

  const box={x:player.x,y:player.y,w:player.w,h:player.h};

  ensureCrawlerWizardRespawns();

  for(let i=shadowWaves.length-1;i>=0;i--){
    const sw=shadowWaves[i];
    sw.r += (sw.maxR - sw.r) * 0.35;
    const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
    const dist=Math.hypot(pcx-sw.x,pcy-sw.y);
    if(Math.abs(dist-sw.r) <= 3) hurtPlayer(1);
    if(--sw.life<=0) shadowWaves.splice(i,1);
  }

  if(b.howlT>0){
    b.howlT--;
    b.waveT--;
    if(b.waveT<=0){
      spawnShadowWave();
      b.waveT=SHADOW_WAVE_INTERVAL;
    }
    if(frame%10===0){
      const c=getShadowCenter(b);
      parts.push({x:c.x+(Math.random()*6-3),y:c.y-2,vx:Math.random()*0.5-0.25,vy:-0.5-Math.random()*0.4,
        life:16,max:22,col:Math.random()<0.5?C.MG2:C.FR1});
    }
    if(b.howlT<=0) startShadowPhase2();
    return;
  }

  if(b.screechStartupT>0){
    b.screechStartupT--;
    if(frame%8===0){
      const c=getShadowCenter(b);
      parts.push({x:c.x+(Math.random()*8-4),y:c.y-1,vx:Math.random()*0.7-0.35,vy:-0.55-Math.random()*0.45,
        life:18,max:26,col:Math.random()<0.5?C.FR1:C.MG2});
    }
    if(b.screechStartupT<=0){
      b.screechT=SHADOW_SCREECH_DURATION_FRAMES;
      b.screechWaveT=1;
      b.atkName='screech';
    }
    return;
  }

  if(b.screechT>0){
    b.screechT--;
    b.screechWaveT--;
    if(b.screechWaveT<=0){
      spawnShadowWave();
      b.screechWaveT=SHADOW_SCREECH_WAVE_INTERVAL;
    }
    if(frame%8===0){
      const c=getShadowCenter(b);
      parts.push({x:c.x+(Math.random()*9-4.5),y:c.y-2,vx:Math.random()*0.8-0.4,vy:-0.60-Math.random()*0.55,
        life:18,max:24,col:Math.random()<0.5?C.FR1:C.WH});
    }
    if(b.screechT<=0){
      b.atkName='';
      b.screechCD=6*60;
    }
    return;
  }

  const c=getShadowCenter(b);
  const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
  const ddx=pcx-c.x, ddy=pcy-c.y;
  const dist=Math.hypot(ddx,ddy)||1;

  if(Math.abs(ddx)>Math.abs(ddy)) b.dir=ddx>0?'right':'left';
  else b.dir=ddy>0?'down':'up';

  const slashBox=getShadowSlashBox(b);

  if(b.atkName==='lunge' && b.atkT>0){
    b.x=Math.max(PX,Math.min(PX+PW-b.w,b.x+b.lungeVX));
    b.y=Math.max(PY+2,Math.min(PY+PH-b.h-2,b.y+b.lungeVY));
    if(ov(box, slashBox)) hurtPlayer(1);
    if(b.atkT<=0) b.atkName='';
    return;
  }
  if(b.atkName==='slash' && b.atkT>0){
    if(ov(box, slashBox)) hurtPlayer(1);
    if(b.atkT<=0) b.atkName='';
  }

  const prefer=b.phase===1 ? 30 : 24;
  if(dist<prefer){
    b.x-=ddx/dist*b.speed*0.75;
    b.y-=ddy/dist*b.speed*0.75;
  } else if(dist>prefer+18){
    b.x+=ddx/dist*b.speed*0.45;
    b.y+=ddy/dist*b.speed*0.45;
  } else {
    b.x+=Math.sin(frame*0.05)*0.08;
    b.y+=Math.cos(frame*0.04)*0.06;
  }
  b.x=Math.max(PX,Math.min(PX+PW-b.w,b.x));
  b.y=Math.max(PY+2,Math.min(PY+PH-b.h-2,b.y));

  if(b.counterT>0 && dist<18 && b.atkT<=0 && b.slashCD<=0){
    b.atkT=16;
    b.atkName='slash';
    b.slashCD=b.phase===1?36:24;
    return;
  }

  if(b.phase===2 && b.atkT<=0 && b.screechCD<=0 && dist<66){
    b.screechStartupT=SHADOW_SCREECH_STARTUP_FRAMES;
    b.screechT=0;
    b.screechWaveT=SHADOW_SCREECH_WAVE_INTERVAL;
    b.atkName='screech';
    return;
  }

  if(b.atkT<=0 && b.lungeCD<=0 && dist<60){
    b.atkT=b.phase===1?14:16;
    b.atkName='lunge';
    const duration=b.atkT;
    const baseSpeed=b.phase===1?1.15:1.35;
    const bonusDistance=b.phase===1?SHADOW_PHASE1_LUNGE_BONUS_DISTANCE:SHADOW_PHASE2_LUNGE_BONUS_DISTANCE;
    const sp=baseSpeed + (bonusDistance/Math.max(1,duration));
    b.lungeVX=ddx/dist*sp;
    b.lungeVY=ddy/dist*sp;
    b.lungeCD=b.phase===1?76:54;
    return;
  }

  if(b.atkT<=0 && dist<14 && b.slashCD<=0){
    b.atkT=14;
    b.atkName='slash';
    b.slashCD=b.phase===1?34:22;
  }
}

function damageShadowBoss(amount=1, fromShockwave=false){
  const b=shadowBoss;
  if(!b || shadowBossDefeated || b.howlT>0) return false;
  b.hp-=amount;
  b.hurtT=10;
  const c=getShadowCenter(b);
  burst(c.x,c.y);
  if(fromShockwave){
    floatTexts.push({x:c.x,y:b.y-6,text:'-1',life:24,max:24,col:C.SH});
  }
  if(b.hp<=0){
    if(b.phase===1){
      b.hp=0;
      b.howlT=SHADOW_HOWL_FRAMES;
      b.atkT=0;
      b.atkName='howl';
      b.waveT=1;
      floatTexts.push({x:GW/2,y:PY+16,text:'THE CRAWLER HOWLS!',life:80,max:80,col:C.WH});
    } else {
      defeatShadowBoss();
    }
  }
  return true;
}

function defeatShadowBoss(){
  const b=shadowBoss;
  if(!b) return;
  const c=getShadowCenter(b);
  for(let i=0;i<28;i++){
    const a=Math.random()*Math.PI*2, s=0.5+Math.random()*2.2;
    parts.push({x:c.x,y:c.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:24+(Math.random()*16|0),max:40,col:Math.random()<0.4?C.MG2:(Math.random()<0.7?C.FR1:C.WH)});
  }
  score+=500;
  killCount++;
  wizardKillCount++;
  spawnKeyDrop(Math.round(c.x)-3,Math.round(c.y)-3,'zone3');
  shadowWaves=[];
  shadowWizardRespawns=[];
  enemies=enemies.filter(e=>!e.shadowBossWizard);
  shadowBossDefeated=true;
  shadowBoss=null;
  runCompleted=true;
  runTimeMs=performance.now()-runStartMs;
  floatTexts.push({x:GW/2,y:PY+16,text:'CORRUPTION SILENCED',life:95,max:95,col:C.FR1});
  floatTexts.push({x:Math.round(c.x),y:Math.round(c.y)-10,text:'KEY!',life:54,max:54,col:C.BN1});
  bossClearTimer=0;
}



// BoneCrawler safe split module
// Purpose: Shield shockwave, enemy defeat rewards, health/potion/dodge, decor breaking, applying upgrades, title/start/scoreboard helpers.
// Source: app.js lines 3632-4033
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

const SHIELD_SHOCKWAVE_BASE_RADIUS = 15;
const SHIELD_SHOCKWAVE_STEP = 3;

function handleEnemyDefeat(i,e,fromShockwave){
  if(e.giant){
    giantKillCount++;
    floatTexts.push({x:e.x+8,y:e.y-4,text:'+5',life:45,max:45,col:C.FR1});
    spawnHeartDrop(e.x+Math.floor(e.w/2)-3,e.y+Math.floor(e.h/2)-3);
  } else if(e.wizard){
    wizardKillCount++;
    if(e.shadowBossWizard && shadowBoss && !shadowBossDefeated){
      shadowWizardRespawns.push(CRAWLER_WIZARD_RESPAWN_FRAMES);
    }
    floatTexts.push({x:e.x+4,y:e.y-4,text:'+3',life:45,max:45,col:C.MG2});
  } else {
    normalKillCount++;
    if(Math.random()<POTION_DROP_CHANCE){
      spawnPotionDrop(e.x+Math.floor(e.w/2)-3,e.y+Math.floor(e.h/2)-3);
      floatTexts.push({x:e.x+4,y:e.y-4,text:'POTION',life:42,max:42,col:C.HP1});
    }
  }
  enemies.splice(i,1);
  score+=e.points;
  killCount++;
  if(currentZone===1 && killCount===ZONE1_ZONE2_KEY_KILLS && !player.zone1DoorKey && !hasKeyDropKind('zone1Door')){
    spawnKeyDrop(e.x+Math.floor(e.w/2)-3,e.y+Math.floor(e.h/2)-3,'zone1Door');
    floatTexts.push({x:e.x+e.w/2,y:e.y-10,text:'ZONE 2 KEY!',life:52,max:52,col:C.FR1});
  }
  if(currentZone===1 && killCount===ZONE1_SECRET_KEY_KILLS && !player.secret1Key && !hasKeyDropKind('secret1')){
    spawnKeyDrop(e.x+Math.floor(e.w/2)-3,e.y+Math.floor(e.h/2)-3,'secret1');
    floatTexts.push({x:e.x+e.w/2,y:e.y-10,text:'SECRET KEY!',life:52,max:52,col:C.MG2});
  }
  if(currentZone===2 && getZoneProgressKills(2)===ZONE2_KEY_KILLS && !player.zone2Key && !hasKeyDropKind('zone2')){
    spawnKeyDrop(e.x+Math.floor(e.w/2)-3,e.y+Math.floor(e.h/2)-3,'zone2');
    floatTexts.push({x:e.x+e.w/2,y:e.y-10,text:'KEY!',life:46,max:46,col:C.BN1});
  }
  if(currentZone===1 && killCount===ZONE1_DRAGON_MINIBOSS_KILLS && !dragonBoss && !bossDefeated && !zone1MiniBossDefeated){
    pendingZone1DragonSpawn=true;
  }
  if(!dragonBoss && !shadowBoss && !pendingZone1DragonSpawn){
    for(const spawn of pSpawns){
      spawn.t=Math.min(spawn.t, spawn.giant ? giantSpawnDelay() : regularSpawnDelay());
    }
    if(killCount>=nextChestAt && !chest && !isSecretZone(currentZone)){
      spawnChest();
      nextChestAt+=getChestKillStepForZone(currentZone);
    }
    if(!isSecretZone(currentZone) && getZoneProgressKills(currentZone)<getZoneKillTarget(currentZone)){
      if(killCount>=nextGiantAt){
        qSpawn(giantSpawnDelay(), true);
        giantKillInterval=Math.max(GIANT_KILL_INTERVAL_MIN, giantKillInterval-1);
        nextGiantAt+=giantKillInterval;
      }
      if(killCount>=nextWizardAt){
        qSpawn(regularSpawnDelay(), false, true);
        wizardKillInterval=Math.max(WIZARD_KILL_INTERVAL_MIN, wizardKillInterval-1);
        nextWizardAt+=wizardKillInterval;
      }
    }
  }
  if(fromShockwave){
    floatTexts.push({x:e.x+e.w/2,y:e.y-4,text:'-1',life:24,max:24,col:C.SH});
  }
}

function getShieldShockwaveRadius(){
  return SHIELD_SHOCKWAVE_BASE_RADIUS + Math.max(0, (player.shieldLevel||0)-1) * SHIELD_SHOCKWAVE_STEP;
}

function getSkeletonSprite(enemy){
  if(enemy.wizard) return enemy.atkT>0?S.wizA:S.wiz;
  if(enemy.variant==='classic') return enemy.atkT>0 ? S.skeClassicA : S.skeClassic;
  const useOld = enemy.variant==='old';
  return enemy.atkT>0 ? (useOld?S.skeOldA:S.skeNewA) : (useOld?S.skeOld:S.skeNew);
}

function drawEnemyBrokenSword(e, rx, ry, bob, flip){
  if(e.wizard) return;
  if(e.variant!=='new') return;
  const s=e.giant?2:1;
  const baseY=ry+bob+(e.giant?8:4);

  function px(x,y,w,h,col){ fr(x,y,w,h,col); }

  if(e.atkT>0){
    if(e.dir==='left'){
      const x=rx-(e.giant?6:4), y=baseY+(e.giant?1:0);
      px(x+1*s,y,2*s,2*s,C.TB);
      px(x+3*s,y,1*s,1*s,C.SI3);
      px(x+4*s,y-1*s,3*s,1*s,C.SI2);
      px(x+7*s,y-1*s,2*s,1*s,C.SI1);
      px(x+8*s,y,1*s,1*s,C.SI3);
    } else if(e.dir==='right'){
      const x=rx+e.w-(e.giant?2:1), y=baseY+(e.giant?1:0);
      px(x-1*s,y,2*s,2*s,C.TB);
      px(x-2*s,y,1*s,1*s,C.SI3);
      px(x-5*s,y-1*s,3*s,1*s,C.SI2);
      px(x-7*s,y-1*s,2*s,1*s,C.SI1);
      px(x-8*s,y,1*s,1*s,C.SI3);
    } else if(e.dir==='up'){
      const x=rx+(e.giant?8:4), y=ry-(e.giant?5:3);
      px(x,y+4*s,2*s,2*s,C.TB);
      px(x,y+3*s,1*s,1*s,C.SI3);
      px(x,y,1*s,3*s,C.SI2);
      px(x+1*s,y-1*s,1*s,2*s,C.SI1);
      px(x,y-2*s,1*s,1*s,C.SI3);
    } else {
      const x=rx+(e.giant?8:4), y=ry+e.h-(e.giant?1:0);
      px(x,y,2*s,2*s,C.TB);
      px(x,y+2*s,1*s,1*s,C.SI3);
      px(x,y+3*s,1*s,3*s,C.SI2);
      px(x+1*s,y+5*s,1*s,2*s,C.SI1);
      px(x,y+7*s,1*s,1*s,C.SI3);
    }
  } else {
    const x=flip ? rx+(e.giant?2:1) : rx+e.w-(e.giant?5:3);
    const y=baseY;
    px(x,y+2*s,2*s,2*s,C.TB);
    px(x+1*s,y+1*s,1*s,1*s,C.SI3);
    px(x+1*s,y-2*s,1*s,3*s,C.SI2);
    px(x+2*s,y-3*s,1*s,2*s,C.SI1);
    px(x+1*s,y-4*s,1*s,1*s,C.SI3);
  }
}

function isHealthFull(){
  return player.hp >= player.maxHp;
}
function syncVisibleHearts(){
  if(!player) return;
  player.visibleHearts = Math.max(player.visibleHearts||3, Math.min(5, Math.ceil(player.hp/2)));
}

function getDodgeDistance(){
  if(!player) return STEP_BASE_DISTANCE;
  if(!player.shadowStep) return STEP_BASE_DISTANCE;
  return STEP_SHADOW_BASE_DISTANCE + Math.max(0, (player.stepLevel||1)-1) * STEP_DISTANCE_PER_UPGRADE;
}
function getDodgeCooldownFrames(){
  if(!player || !player.shadowStep) return STEP_BASE_COOLDOWN_FRAMES;
  return Math.max(
    STEP_MIN_COOLDOWN_FRAMES,
    STEP_SHADOW_BASE_COOLDOWN_FRAMES - Math.max(0, (player.stepLevel||1)-1) * STEP_COOLDOWN_REDUCTION_PER_UPGRADE
  );
}
function performDodge(){
  const p=player;
  if(!p || p.dead || dodgeCooldownT>0) return false;
  let dx=0, dy=0;
  if(p.dir==='left') dx=-1;
  else if(p.dir==='right') dx=1;
  else if(p.dir==='up') dy=-1;
  else dy=1;
  const dist=Math.round(getDodgeDistance());
  for(let i=0;i<dist;i++){
    const nx=Math.max(PX,Math.min(PX+PW-p.w,p.x+dx));
    const ny=Math.max(PY,Math.min(PY+PH-p.h,p.y+dy));
    if(collidesZoneObstacles(nx,ny,p.w,p.h)) break;
    p.x=nx;
    p.y=ny;
  }
  dodgeCooldownT=getDodgeCooldownFrames();
  if(p.shadowStep) p.dodgeInvulnT=Math.max(p.dodgeInvulnT||0, SHADOW_STEP_INVULN_FRAMES);
  floatTexts.push({x:p.x+4,y:p.y-5,text:p.shadowStep?'SHADOW STEP':'STEP',life:22,max:22,col:p.shadowStep?C.MG2:C.SI1});
  return true;
}
function useHealthPotion(){
  if(!player || potionCount<=0 || isHealthFull()) return false;
  potionCount=Math.max(0, potionCount-1);
  player.hp=Math.min(player.maxHp, player.hp + 2);
  syncVisibleHearts();
  burst(player.x+4, player.y+4);
  floatTexts.push({x:player.x+4,y:player.y-6,text:'+POTION',life:34,max:34,col:C.HP1});
  return true;
}


function grantHeartReward(x,y){
  if(isHealthFull()){
    score += 5;
    floatTexts.push({x,y:y-4,text:'+5',life:40,max:40,col:C.FR1});
  } else {
    player.hp = Math.min(player.maxHp, player.hp + 2);
    player.visibleHearts = Math.max(player.visibleHearts||3, Math.min(5, Math.ceil(player.hp/2)));
    floatTexts.push({x,y:y-4,text:'+HP',life:40,max:40,col:C.HP1});
  }
}
function grantHalfHeartReward(x,y){
  if(isHealthFull()){
    score += 2;
    floatTexts.push({x,y:y-4,text:'+2',life:34,max:34,col:C.FR1});
  } else {
    player.hp = Math.min(player.maxHp, player.hp + 1);
    player.visibleHearts = Math.max(player.visibleHearts||3, Math.min(5, Math.ceil(player.hp/2)));
    floatTexts.push({x,y:y-4,text:'+1/2',life:36,max:36,col:C.HP1});
  }
}

function triggerShieldShockwave(cx,cy){
  const shockwaveRadius=getShieldShockwaveRadius();
  shockwaves.push({x:cx,y:cy,r:3,maxR:shockwaveRadius,life:18,maxLife:18});
  for(let i=0;i<20;i++){
    const a=(i/20)*Math.PI*2, s=0.7+Math.random()*1.2;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:14+(Math.random()*8|0),max:24,col:Math.random()<0.5?C.SH:C.SI1});
  }
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e) continue;
    const ex=e.x+e.w/2, ey=e.y+e.h/2;
    const dist=Math.hypot(ex-cx, ey-cy);
    if(dist<=shockwaveRadius + e.w/2){
      e.hp--;
      burst(ex, ey);
      if(e.hp<=0){
        handleEnemyDefeat(i,e,true);
      } else {
        e.hurtT=10;
      }
    }
  }
  if(dragonBoss && !bossDefeated && dragonBoss.howlT<=0){
    const dc=getDragonCenter();
    const dist=Math.hypot(dc.x-cx, dc.y-cy);
    if(dist<=shockwaveRadius + Math.max(dragonBoss.w,dragonBoss.h)/3){
      damageDragonBoss(1,true);
    }
  }
}

function burst(x,y){
  for(let i=0;i<10;i++){
    const a=Math.random()*Math.PI*2, s=0.5+Math.random()*2;
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:22+(Math.random()*14|0),max:36,col:Math.random()<.6?C.BN1:C.BN2});
  }
}

function burstDecor(x,y){
  for(let i=0;i<14;i++){
    const a=Math.random()*Math.PI*2, s=0.4+Math.random()*1.6;
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:20+(Math.random()*12|0),max:30,col:Math.random()<0.55?C.TB:(Math.random()<0.7?C.BN3:C.BN2)});
  }
}

function breakZone1Decor(idx){
  if(currentZone!==1) return;
  if(!zone1Broken || zone1Broken[idx]) return;
  const r=ZONE1_DECOR_BREAK_RECTS[idx];
  zone1Broken[idx]=true;
  burstDecor(r.x+r.w/2, r.y+r.h/2);
  if(Math.random()<BREAKABLE_HALF_HEART_DROP_CHANCE){
    spawnHalfHeartDrop(r.x+Math.floor(r.w/2)-3, r.y+Math.floor(r.h/2)-3);
  }
}


function breakZone2Decor(idx){
  if(currentZone!==2) return;
  if(!zone2Broken || zone2Broken[idx]) return;
  const r=ZONE2_DECOR_BREAK_RECTS[idx];
  zone2Broken[idx]=true;
  burstDecor(r.x+r.w/2, r.y+r.h/2);
  if(Math.random()<BREAKABLE_HALF_HEART_DROP_CHANCE){
    spawnHalfHeartDrop(r.x+Math.floor(r.w/2)-3, r.y+Math.floor(r.h/2)-3);
  }
}

function breakZone3Decor(idx){
  if(currentZone!==3) return;
  if(!zone3Broken || zone3Broken[idx]) return;
  const r=ZONE3_DECOR_BREAK_RECTS[idx];
  zone3Broken[idx]=true;
  burstDecor(r.x+r.w/2, r.y+r.h/2);
  if(Math.random()<BREAKABLE_HALF_HEART_DROP_CHANCE){
    spawnHalfHeartDrop(r.x+Math.floor(r.w/2)-3, r.y+Math.floor(r.h/2)-3);
  }
}

function shieldBurst(x,y){
  for(let i=0;i<16;i++){
    const a=(i/16)*Math.PI*2, s=0.8+Math.random()*2.2;
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:20+(Math.random()*12|0),max:32,col:Math.random()<.6?C.SH:C.SI1});
  }
}

function applyUpgrade(type){
  const p=player;
  if(type==='heart'){
    grantHeartReward(GW/2, PY+22);
  } else if(type==='sword'){
    p.swordLevel=(p.swordLevel||0)+1;
    p.swordReach+=3;
    p.swordWidth=Math.max(1,p.swordWidth||1);
  } else if(type==='shield'){
    p.shieldLevel=(p.shieldLevel||0)+1;
    p.shield=true;
    p.shieldBreakT=0;
  } else if(type==='speed'){
    p.speedLevel=(p.speedLevel||0)+1;
    p.speed=Math.min(MAX_PLAYER_SPEED, p.speed+SPEED_UP_STEP);
  } else if(type==='shadowstep'){
    if(!p.shadowStep){
      p.shadowStep=true;
      p.stepLevel=1;
      queueShadowStepDialog();
    } else {
      p.stepLevel=(p.stepLevel||1)+1;
    }
  } else if(type==='points'){
    const picked=currentUpgradeBtns.find(btn=>btn.type==='points');
    const gain=picked && picked.pointValue ? picked.pointValue : choosePointReward();
    score+=gain;
    floatTexts.push({x:GW/2,y:PY+18,text:'+'+gain,life:48,max:48,col:C.FR1});
  }
  prevSpc=!!keys['Space']; // prevent instant sword swing on resume
  gState='playing';
}

function beginRunFromIntro(){
  if(introPage<INTRO_PAGE_COUNT-1){
    introPage++;
    return;
  }
  introFadeT=introFadeMax;
  clearGameplayKeys();
  gState='intro_fade';
}
function startGame(){
  resetGame();
  syncNameGodMode();
  clearGameplayKeys();
  introFadeT=0;
  startupSceneFadeT=0;
  startupScenePauseStartMs=0;
  startupDialogPending=true;
  const _cheat=getCheatCode(currentPlayerName);
  if(_cheat){ applyCheatCode(_cheat); startGameWithCheat(_cheat); return; }
  if(introSeenThisPage){
    introStartMs=0;
    introPage=0;
    beginStartupSceneTransition();
    return;
  }
  introStartMs=performance.now();
  introPage=0;
  gState='intro';
}
function promptForPlayerName(){
  if(!nameModalOverlay || !nameModalInput) {
    // fallback if modal elements missing
    const entered=window.prompt('Enter name:', currentPlayerName||'Player');
    if(entered===null) return;
    const clean=entered.trim();
    currentPlayerName=clean||'Player';
    savePlayerName(currentPlayerName);
    syncNameGodMode();
    return;
  }
  nameModalInput.value=currentPlayerName||'Player';
  nameModalOverlay.classList.remove('hidden');
  nameModalInput.focus();
  nameModalInput.select();
}
function commitPlayerName(){
  if(!nameModalOverlay) return;
  nameModalOverlay.classList.add('hidden');
  const clean=(nameModalInput ? nameModalInput.value : '').trim();
  currentPlayerName=clean||'Player';
  savePlayerName(currentPlayerName);
  syncNameGodMode();
}
function openScoreboard(){
    scoreboardEntries=loadScores();
  scoreboardPage=0;
  gState='scoreboard';
}
function saveRunIfNeeded(){
  if(runSaved) return;
  runSaved=true;
  const entry={
    name:(currentPlayerName||'Player').trim()||'Player',
    kills:killCount|0,
    timeMs:Math.max(0, Math.floor(runTimeMs)),
    finished:!!runCompleted,
    at:Date.now()
  };
  scoreboardEntries=loadScores();
  scoreboardEntries.push(entry);
  scoreboardEntries.sort((a,b)=>(b.kills-a.kills)||(b.timeMs-a.timeMs)||(b.at-a.at));
  saveScores(scoreboardEntries);
}
function totalScorePages(){
  return Math.max(1, Math.ceil(scoreboardEntries.length/SCORE_PAGE_SIZE));
}
function scorePageEntries(){
  const start=scoreboardPage*SCORE_PAGE_SIZE;
  return scoreboardEntries.slice(start,start+SCORE_PAGE_SIZE);
}


// BoneCrawler safe split module
// Purpose: Keyboard, mouse, and touch input listeners and input state transitions.
// Source: app.js lines 4034-4406
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Input ─────────────────────────────────────────────────────
const keys={};
function isKeyDown(...codes){
  return codes.some(code=>!!keys[code]);
}
document.addEventListener('keydown',e=>{
  const code=e.code;
  const key=e.key;
  const keyLower=typeof key==='string' ? key.toLowerCase() : '';
  keys[code]=true;
  if(['Space','Enter','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code)) e.preventDefault();

  if(gState==='dialog'){
    if(code==='Enter' || code==='Space' || code==='KeyE') advanceDialog();
    else if(code==='Escape') skipDialog();
    return;
  }

  if(gState==='paused'){
    if(code==='Enter' || code==='Escape') resumeGame();
    else if(keyLower==='r') openRetryPrompt();
    else if(keyLower==='m' || code==='Backspace'){
      retryTaxPaid=false;
      retryPromptMode='';
      gState='title';
    }
    return;
  }

  if(gState==='upgrade'){
    if(key==='1' && currentUpgradeBtns[0]) applyUpgrade(currentUpgradeBtns[0].type);
    else if(key==='2' && currentUpgradeBtns[1]) applyUpgrade(currentUpgradeBtns[1].type);
    else if(key==='3' && currentUpgradeBtns[2]) applyUpgrade(currentUpgradeBtns[2].type);
    return;
  }

  if(gState==='zone_transition'){
    if(code==='Enter' || code==='Space' || code==='Escape') continueZoneTransition();
    return;
  }

  if(gState==='retry_confirm'){
    if(code==='Enter' || code==='Space' || keyLower==='y'){
      restoreRetryCheckpoint();
    } else if(code==='Escape' || code==='Backspace' || keyLower==='n'){
      gState='gameover';
    }
    return;
  }

  if(gState==='leave_zone_confirm'){
    if(code==='Enter' || code==='Space' || keyLower==='y') confirmLeaveZone();
    else if(code==='Escape' || code==='Backspace' || keyLower==='n') cancelLeaveZone();
    return;
  }

  if(gState==='secret2_sword_confirm'){
    if(code==='Enter' || code==='Space' || keyLower==='y'){
      claimSecret2MasterSword();
    } else if(code==='Escape' || code==='Backspace' || keyLower==='n'){
      clearGameplayKeys();
      gState='playing';
    }
    return;
  }

  if(gState==='intro'){
    if(code==='Enter' || code==='Space' || code==='Escape') beginRunFromIntro();
    return;
  }

  if(gState==='intro_fade'){
    return;
  }

  if(gState==='startup_scene'){
    return;
  }

  if(gState==='scoreboard'){
    if(code==='Escape' || code==='Backspace') gState='title';
    else if(code==='ArrowLeft' && scoreboardPage>0) scoreboardPage--;
    else if(code==='ArrowRight' && scoreboardPage<totalScorePages()-1) scoreboardPage++;
    return;
  }

  if(gState==='playing' && !e.repeat && (code==='ShiftLeft' || code==='ShiftRight')){
    if(performDodge()) return;
  }
  if(gState==='playing' && !e.repeat && code==='KeyP'){
    if(useHealthPotion()) return;
  }

  if(gState==='playing' && (code==='Enter' || code==='KeyE')){
    if(handlePrimaryInteract()) return;
    if(code==='Enter'){
      pauseGame();
      return;
    }
  }

  if(gState==='playing' && code==='Escape'){
    pauseGame();
    return;
  }

  if(gState==='gameover'){
    if(code==='Enter' || code==='Space' || keyLower==='r') openRetryPrompt();
    else if(code==='Escape' || code==='Backspace' || keyLower==='m'){
      retryTaxPaid=false;
      retryPromptMode='';
      gState='title';
    }
    return;
  }
});
document.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur', clearGameplayKeys);
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden) clearGameplayKeys();
});
canvas.addEventListener('mousedown',e=>{
  if(e.button!==0) return;
  if(gState!=='playing') return;
  e.preventDefault();
  mouseAttackQueued=true;
  mouseAttackHeld=true;
});
window.addEventListener('mouseup',()=>{
  mouseAttackHeld=false;
});

canvas.addEventListener('touchstart',e=>{
  if(gState!=='playing') return;
  if(!e.touches.length) return;
  const t=e.touches[0];
  touchIdentifier=t.identifier;
  touchStartX=t.clientX;
  touchStartY=t.clientY;
  touchX=t.clientX;
  touchY=t.clientY;
  touchStartTime=performance.now();
  touchMoveActive=true;
  touchAttackMoved=false;
  touchAttackReleaseQueued=false;
  touchAttackCancelQueued=false;
  touchAttackChargeActive=!!(whirlwindUnlocked && player && !player.dead && player.atkCD<=0 && player.atkT<=0);
  if(touchAttackChargeActive){
    whirlwindChargeT=Math.max(whirlwindChargeT,1);
  }
  e.preventDefault();
},{passive:false});

canvas.addEventListener('touchmove',e=>{
  if(gState!=='playing' || !touchMoveActive) return;
  let t=null;
  for(const touch of e.touches){
    if(touch.identifier===touchIdentifier){ t=touch; break; }
  }
  if(!t && e.touches.length) t=e.touches[0];
  if(!t) return;
  touchX=t.clientX;
  touchY=t.clientY;
  const dragDist=Math.hypot(touchX-touchStartX, touchY-touchStartY);
  if(dragDist>TOUCH_ATTACK_CANCEL_MOVE_PX){
    touchAttackMoved=true;
    if(touchAttackChargeActive || whirlwindChargeT>0){
      touchAttackChargeActive=false;
      touchAttackCancelQueued=true;
    }
  }
  e.preventDefault();
},{passive:false});

canvas.addEventListener('touchend',e=>{
  if(gState!=='playing' || !touchMoveActive) return;
  const dx=touchX-touchStartX;
  const dy=touchY-touchStartY;
  const dist=Math.hypot(dx,dy);
  const elapsed=performance.now()-touchStartTime;
  const rect=canvas.getBoundingClientRect();
  const lx=((touchStartX-rect.left)*(canvas.width/rect.width))/SCALE;
  const ly=((touchStartY-rect.top)*(canvas.height/rect.height))/SCALE;
  const potionRect={x:0,y:0,w:55,h:22};

  if(potionCount>0 && dist<14 && elapsed<260 && pointInBtn(lx,ly,potionRect)){
    useHealthPotion();
    touchAttackChargeActive=false;
    touchAttackCancelQueued=true;
  } else if(!touchAttackMoved && whirlwindUnlocked && whirlwindChargeT>0){
    touchAttackReleaseQueued=true;
    touchAttackChargeActive=false;
  } else if(dist<14 && elapsed<260){
    mouseAttackQueued=true;
  } else {
    touchAttackChargeActive=false;
  }

  touchMoveActive=false;
  touchIdentifier=null;
  touchAttackMoved=false;
  e.preventDefault();
},{passive:false});

canvas.addEventListener('touchcancel',()=>{
  if(touchAttackChargeActive || whirlwindChargeT>0){
    touchAttackCancelQueued=true;
  }
  touchMoveActive=false;
  touchIdentifier=null;
  touchAttackChargeActive=false;
  touchAttackMoved=false;
});

if(touchPauseBtn){
  const onTouchPausePress=e=>{
    e.preventDefault();
    e.stopPropagation();
    if(gState==='playing') pauseGame();
    else if(gState==='paused') resumeGame();
  };
  if(touchUiAvailable){
    if(window.PointerEvent) touchPauseBtn.addEventListener('pointerdown', onTouchPausePress);
    else touchPauseBtn.addEventListener('touchstart', onTouchPausePress, {passive:false});
  } else {
    touchPauseBtn.addEventListener('click', onTouchPausePress);
  }
}

if(touchInteractBtn){
  const onInteractPress=e=>{
    e.preventDefault();
    e.stopPropagation();
    if(gState==='dialog'){ advanceDialog(); return; }
    if(gState==='leave_zone_confirm'){ confirmLeaveZone(); return; }
    if(gState==='playing') handlePrimaryInteract();
  };
  if(window.PointerEvent) touchInteractBtn.addEventListener('pointerdown', onInteractPress);
  else touchInteractBtn.addEventListener('touchstart', onInteractPress, {passive:false});
}

if(touchDodgeBtn){
  const onDodgePress=e=>{
    e.preventDefault();
    e.stopPropagation();
    if(gState==='playing') performDodge();
  };
  if(window.PointerEvent) touchDodgeBtn.addEventListener('pointerdown', onDodgePress);
  else touchDodgeBtn.addEventListener('touchstart', onDodgePress, {passive:false});
}

// name modal wiring
if(nameModalOk) nameModalOk.addEventListener('click', commitPlayerName);
if(nameModalCancel) nameModalCancel.addEventListener('click', ()=>{ if(nameModalOverlay) nameModalOverlay.classList.add('hidden'); });
if(nameModalOverlay) nameModalOverlay.addEventListener('click', e=>{ if(e.target===nameModalOverlay) nameModalOverlay.classList.add('hidden'); });
if(nameModalInput) nameModalInput.addEventListener('keydown', e=>{
  if(e.key==='Enter'){ e.preventDefault(); commitPlayerName(); }
  else if(e.key==='Escape'){ e.preventDefault(); nameModalOverlay.classList.add('hidden'); }
});

canvas.addEventListener('click',e=>{
  const rect=canvas.getBoundingClientRect();
  const scaleX=canvas.width/rect.width;
  const scaleY=canvas.height/rect.height;
  const lx=((e.clientX-rect.left)*scaleX)/SCALE;
  const ly=((e.clientY-rect.top)*scaleY)/SCALE;

  if(gState==='upgrade'){
    for(const btn of currentUpgradeBtns){
      if(pointInBtn(lx,ly,btn)){
        applyUpgrade(btn.type);
        break;
      }
    }
    return;
  }

  if(gState==='playing'){
    const numHearts=Math.max(3, Math.min(5, player ? (player.visibleHearts||3) : 3));
    const dodgeRect={x:GW-41,y:2,w:8,h:8};
    const whirlRect={x:GW-31,y:2,w:8,h:8};
    const potionRect={x:0,y:0,w:55,h:22};
    if(pointInBtn(lx,ly,dodgeRect)){
      performDodge();
      return;
    }
    if(potionCount>0 && pointInBtn(lx,ly,potionRect)){
      useHealthPotion();
      return;
    }
    if(whirlwindUnlocked && pointInBtn(lx,ly,whirlRect)){
      performWhirlwindSlash();
      return;
    }
  }

  if(gState==='title'){
    if(pointInBtn(lx,ly,MENU_PLAY)) startGame();
    else if(pointInBtn(lx,ly,MENU_SCORE)) openScoreboard();
    else if(pointInBtn(lx,ly,NAME_BTN)) promptForPlayerName();
    return;
  }

  if(gState==='dialog'){
    return;
  }

  if(gState==='zone_transition'){
    if(pointInBtn(lx,ly,ZONE_TRANSITION_CONTINUE_BTN)) continueZoneTransition();
    return;
  }

  if(gState==='retry_confirm'){
    if(pointInBtn(lx,ly,RETRY_CONFIRM_YES_BTN)) restoreRetryCheckpoint();
    else if(pointInBtn(lx,ly,RETRY_CONFIRM_NO_BTN)) gState='gameover';
    return;
  }

  if(gState==='leave_zone_confirm'){
    if(pointInBtn(lx,ly,LEAVE_ZONE_CONFIRM_YES_BTN)) confirmLeaveZone();
    else if(pointInBtn(lx,ly,LEAVE_ZONE_CONFIRM_NO_BTN)) cancelLeaveZone();
    return;
  }

  if(gState==='secret2_sword_confirm'){
    if(pointInBtn(lx,ly,SECRET2_SWORD_CONFIRM_YES_BTN)) claimSecret2MasterSword();
    else if(pointInBtn(lx,ly,SECRET2_SWORD_CONFIRM_NO_BTN)){
      clearGameplayKeys();
      gState='playing';
    }
    return;
  }

  if(gState==='intro'){
    beginRunFromIntro();
    return;
  }

  if(gState==='intro_fade'){
    return;
  }

  if(gState==='startup_scene'){
    return;
  }

  if(gState==='scoreboard'){
    if(pointInBtn(lx,ly,{x:7,y:105,w:24,h:9})) gState='title';
    else if(pointInBtn(lx,ly,{x:89,y:105,w:10,h:9}) && scoreboardPage>0) scoreboardPage--;
    else if(pointInBtn(lx,ly,{x:103,y:105,w:10,h:9}) && scoreboardPage<totalScorePages()-1) scoreboardPage++;
    return;
  }

  if(gState==='paused'){
    if(pointInBtn(lx,ly,GAMEOVER_RETRY)) openRetryPrompt();
    else if(pointInBtn(lx,ly,GAMEOVER_MENU)){
      retryTaxPaid=false;
      retryPromptMode='';
      gState='title';
    }
    return;
  }

  if(gState==='gameover'){
    if(pointInBtn(lx,ly,GAMEOVER_RETRY)) openRetryPrompt();
    else if(pointInBtn(lx,ly,GAMEOVER_MENU)){
      retryTaxPaid=false;
      retryPromptMode='';
      gState='title';
    }
  }
});


// BoneCrawler safe split module
// Purpose: Main update tick: game-state progression, movement, collisions, items, enemy updates, and menu transitions.
// Source: app.js lines 4407-4934
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Update ────────────────────────────────────────────────────
function update(){
  frame++; // always tick so animations run on all screens
  syncVisibleHearts();
  if(gState==='intro_fade'){
    introFadeT=Math.max(0,introFadeT-1);
    if(introFadeT<=0){
      introSeenThisPage=true;
      introStartMs=0;
      introPage=0;
      beginStartupSceneTransition();
    }
    return;
  }
  if(gState==='startup_scene'){
    if(startupSceneFadeT>0){
      startupSceneFadeT=Math.max(0,startupSceneFadeT-1);
      if(startupSceneFadeT<=0) startupScenePauseStartMs=performance.now();
    } else if(startupDialogPending){
      if(!startupScenePauseStartMs) startupScenePauseStartMs=performance.now();
      if(performance.now()-startupScenePauseStartMs>=STARTUP_SCENE_DIALOG_DELAY_MS){
        openStartupGameDialog();
      }
    } else {
      beginPlayableRun();
    }
    return;
  }
  if(gState!=='playing') return;
  if(pendingRewardDialogs.length && openQueuedRewardDialog()) return;

  // Spawn timers
  if(!isSecretZone(currentZone)){
    for(let i=pSpawns.length-1;i>=0;i--){
      pSpawns[i].t--;
      if(pSpawns[i].t<=0){
        const g=pSpawns[i].giant; const wiz=pSpawns[i].wizard; const type=pSpawns[i].type;
        pSpawns.splice(i,1);
        doSpawn(g, wiz, type);
      }
    }
    if(currentZone===1 && pendingZone1DragonSpawn && !dragonBoss && !bossDefeated && !zone1MiniBossDefeated){
      pendingZone1DragonSpawn=false;
      spawnDragonBoss();
    }
    if(currentZone===2 && getZoneProgressKills(2)>=DRAGON_BOSS_TRIGGER_KILLS && !dragonBoss && !bossDefeated){
      spawnDragonBoss();
    }
    if(currentZone===1 && killCount>=ZONE1_DRAGON_MINIBOSS_KILLS && !dragonBoss && !bossDefeated && !zone1MiniBossDefeated){
      spawnDragonBoss();
    }
    if(currentZone===3 && getZoneProgressKills(3)>=ZONE3_BOSS_TRIGGER_KILLS && enemies.length===0 && pSpawns.length===0 && !shadowBoss && !shadowBossDefeated){
      spawnShadowBoss();
    }
    if(!dragonBoss && !shadowBoss && getZoneProgressKills(currentZone)<getZoneKillTarget(currentZone) && enemies.length<maxEnemies()&&pSpawns.length===0){
      qSpawn(regularSpawnDelay(), false, false, pickRegularEnemyType());
    }
  }

  const p=player;
  if(p.dead) return;
  if(currentZone===2 && bossDefeated && !dragonBoss && bossClearTimer>0){
    bossClearTimer--;
    if(bossClearTimer<=0){
      openZoneTransition(3);
      return;
    }
  }


  if(devGodMode){
    p.hp=p.maxHp;
    p.hurtT=0;
    p.shield=true;
    p.shieldBreakT=0;
    p.visibleHearts=Math.max(p.visibleHearts||3, Math.min(5, Math.ceil(p.hp/2)));
  }

  if(p.shieldBreakT>0) p.shieldBreakT--;

  for(let i=heartDrops.length-1;i>=0;i--){
    const h=heartDrops[i];
    if(typeof h.ttl==='number'){
      h.ttl--;
      if(h.ttl<=0) heartDrops.splice(i,1);
    }
  }
  for(let i=potionDrops.length-1;i>=0;i--){
    const d=potionDrops[i];
    if(typeof d.ttl==='number'){
      d.ttl--;
      if(d.ttl<=0) potionDrops.splice(i,1);
    }
  }
  if(zone3TreeShakeT>0) zone3TreeShakeT--;

  // Movement
  let dx=0,dy=0;
  const waterBox={x:p.x,y:p.y,w:p.w,h:p.h};
  const inSecret1Water=currentZone===ZONE_SECRET1 && isSecret1WaterZone(waterBox);
  const terrainSpeedMult=inSecret1Water ? 0.58 : 1;
  const moveSpeed=(devGodMode ? p.speed*DEV_GOD_SPEED_MULT : p.speed)*terrainSpeedMult;
  if(isKeyDown('ArrowLeft','KeyA')){dx-=moveSpeed;p.dir='left';}
  if(isKeyDown('ArrowRight','KeyD')){dx+=moveSpeed;p.dir='right';}
  if(isKeyDown('ArrowUp','KeyW')){dy-=moveSpeed;p.dir='up';}
  if(isKeyDown('ArrowDown','KeyS')){dy+=moveSpeed;p.dir='down';}

  if(touchMoveActive){
    const tdx=touchX-touchStartX;
    const tdy=touchY-touchStartY;
    const dist=Math.hypot(tdx,tdy);
    if(dist>10){
      const nx=tdx/dist, ny=tdy/dist;
      dx += nx*moveSpeed;
      dy += ny*moveSpeed;
      if(Math.abs(tdx)>Math.abs(tdy)) p.dir = tdx<0 ? 'left' : 'right';
      else p.dir = tdy<0 ? 'up' : 'down';
    }
  }

  if(dx&&dy){dx*=0.707;dy*=0.707;}
  let nx=Math.max(PX,Math.min(PX+PW-p.w,p.x+dx));
  if(collidesZoneObstacles(nx,p.y,p.w,p.h)) nx=p.x;
  p.x=nx;
  let ny=Math.max(PY,Math.min(PY+PH-p.h,p.y+dy));
  if(collidesZoneObstacles(p.x,ny,p.w,p.h)) ny=p.y;
  p.y=ny;
  if(dx||dy) p.walkF += inSecret1Water ? 0.45 : 1;

  if(inSecret1Water && (dx||dy) && frame%6===0){
    const px=p.x+p.w/2;
    const py=p.y+p.h-1;
    parts.push({x:px-2+Math.random()*4,y:py,vx:(Math.random()*0.5-0.25),vy:-0.10-Math.random()*0.18,
      life:10+(Math.random()*5|0),max:16,col:Math.random()<0.5?'#d8f6ff':'#8fd8ff'});
    parts.push({x:px-2+Math.random()*4,y:py+1,vx:(Math.random()*0.4-0.2),vy:-0.04-Math.random()*0.10,
      life:8+(Math.random()*4|0),max:14,col:'#6ec3e7'});
  }

  if(secret1UnlockAlertT>0) secret1UnlockAlertT--;
  if(currentZone===1 && zone1SecretEntranceReady()){
    if(!secret1UnlockAlertShown){
      secret1UnlockAlertShown=true;
      secret1UnlockAlertT=135;
      floatTexts.push({x:GW/2,y:PY+60,text:'SECRET ZONE 1',life:72,max:72,col:C.MG2});
      floatTexts.push({x:GW/2,y:PY+68,text:'UNLOCKED! (INTERACT)',life:72,max:72,col:C.BN1});
    }
  }

  if(maybeTriggerScriptedZoneDialog()) return;

  // Key pickup + door unlock to zone 2
  if(hasAnyKeyDrop()){
    const drops=getKeyDropList();
    for(let i=drops.length-1;i>=0;i--){
      const drop=drops[i];
      if(!ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:drop.x,y:drop.y,w:drop.w,h:drop.h})) continue;
      if(drop.kind==='zone1Door') p.zone1DoorKey=true;
      else if(drop.kind==='secret1'){ p.secret1Key=true; breakZone1Decor(0); }
      else if(drop.kind==='zone2') p.zone2Key=true;
      else p.hasKey=true;
      drops.splice(i,1);
      floatTexts.push({x:p.x+4,y:p.y-6,text:drop.kind==='secret1'?'SECRET KEY':(drop.kind==='zone1Door'?'ZONE 2 KEY':'KEY'),life:40,max:40,col:drop.kind==='secret1'?C.MG2:C.BN1});
    }
    keyDrop=drops;
  }
  if(currentZone===ZONE_SECRET1){
    if(secret1BlessingT>0) secret1BlessingT--;
    if(secret1BlessingT===80){
      floatTexts.push({x:GW/2,y:PY+72,text:'THE FAIRIES SEND YOU ONWARD',life:70,max:70,col:C.MG2});
    }
  }

  // Chest collision → pause for upgrade
  if(chest && ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:chest.x,y:chest.y,w:chest.w,h:chest.h})){
    chest=null;
    rollUpgradeChoices();
    gState='upgrade';
    return;
  }

  // Heart pickups
  for(let i=heartDrops.length-1;i>=0;i--){
    const h=heartDrops[i];
    if(ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:h.x,y:h.y,w:h.w,h:h.h})){
      if(h.kind==='half') grantHalfHeartReward(h.x+4,h.y);
      else grantHeartReward(h.x+4,h.y);
      for(let j=0;j<6;j++){
        const a=Math.random()*Math.PI*2, s=0.4+Math.random()*1.3;
        parts.push({x:h.x+3.5,y:h.y+3.5,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
          life:18+(Math.random()*10|0),max:28,col:Math.random()<0.5?C.HP1:C.HP2});
      }
      heartDrops.splice(i,1);
    }
  }

  // Potion pickups stay on the field until the player can carry one again
  if(potionCount < POTION_MAX_COUNT){
    for(let i=potionDrops.length-1;i>=0;i--){
      const d=potionDrops[i];
      if(ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:d.x,y:d.y,w:d.w,h:d.h})){
        potionCount=Math.min(POTION_MAX_COUNT, potionCount+1);
        burst(d.x+3.5, d.y+3.5);
        floatTexts.push({x:d.x+3,y:d.y-5,text:'POTION',life:34,max:34,col:C.HP1});
        if(!potionDialogSeenThisRun){
          potionDialogSeenThisRun=true;
          queuePotionAcquireDialog();
        }
        potionDrops.splice(i,1);
      }
    }
  }

  // Attack
  const keyboardSpcNow=isKeyDown('Space');
  const touchSpcNow=touchAttackChargeActive && !touchAttackMoved;
  const spcNow=keyboardSpcNow || touchSpcNow;
  const touchChargeCanceled=touchAttackCancelQueued && !spcNow && prevSpc;
  const spcJust=spcNow&&!prevSpc;
  const spcRelease=((!spcNow&&prevSpc&&!touchChargeCanceled) || touchAttackReleaseQueued);
  const clickJust=mouseAttackQueued;
  prevSpc=spcNow;
  mouseAttackQueued=false;
  touchAttackReleaseQueued=false;
  touchAttackCancelQueued=false;

  if(whirlwindCooldownT>0) whirlwindCooldownT--;
  if(whirlwindSlashT>0) whirlwindSlashT--;
  if(dodgeCooldownT>0) dodgeCooldownT--;
  if(p.dodgeInvulnT>0) p.dodgeInvulnT--;

  if(whirlwindUnlocked){
    if(spcJust && p.atkCD<=0 && p.atkT<=0){
      whirlwindChargeT=1;
    } else if(spcNow && whirlwindChargeT>0){
      whirlwindChargeT++;
      if(whirlwindChargeT>=WHIRLWIND_HOLD_FRAMES){
        p.atkT=Math.max(p.atkT,2);
      }
    } else if(spcRelease && whirlwindChargeT>0){
      if(whirlwindChargeT>=WHIRLWIND_HOLD_FRAMES && whirlwindCooldownT<=0){
        performWhirlwindSlash();
      } else if(p.atkCD<=0 && p.atkT<=0){
        performPlayerAttack(1);
      }
      whirlwindChargeT=0;
    } else if((!spcNow && whirlwindChargeT>0 && !spcRelease) || touchChargeCanceled){
      whirlwindChargeT=0;
    }
  } else if(spcJust && p.atkCD<=0 && p.atkT<=0){
    performPlayerAttack(1);
  }

  if(clickJust && p.atkCD<=0 && p.atkT<=0){
    performPlayerAttack(1);
  }

  if(p.atkT>0) p.atkT--;
  if(p.atkCD>0) p.atkCD--;
  if(p.hurtT>0) p.hurtT--;

  updateDragonBoss();
  updateShadowBoss();

  // Enemy AI
  for(const e of enemies){
    if(e.atkT>0) e.atkT--;
    if(e.atkCD>0) e.atkCD--;
    if(e.hurtT>0) e.hurtT--;
    e.walkF++;
    const cx=e.x+e.w/2, cy=e.y+e.h/2, pcx=p.x+4, pcy=p.y+4;
    const ddx=pcx-cx, ddy=pcy-cy;
    const dist=Math.hypot(ddx,ddy);
    if(dist>0) e.dir=Math.abs(ddx)>Math.abs(ddy)?(ddx>0?'right':'left'):(ddy>0?'down':'up');
    // ← reduced attack trigger box (was +2 each side, now +1)
    // Wizard Skeleton: shoot fireballs at player, try to keep distance
    if(e.wizard){
      if(e.shootCD>0) e.shootCD--;
      // Keep distance - move away if too close, drift sideways otherwise
      const preferDist=32;
      if(dist<preferDist){
        // Back away from player
        if(dist>0){e.x-=ddx/dist*e.speed*0.7;e.y-=ddy/dist*e.speed*0.7;}
      } else if(dist>preferDist+20){
        // Drift slowly closer
        if(dist>0){e.x+=ddx/dist*e.speed*0.4;e.y+=ddy/dist*e.speed*0.4;}
      }
      // Clamp to arena
      e.x=Math.max(PX,Math.min(PX+PW-e.w,e.x));
      e.y=Math.max(PY,Math.min(PY+PH-e.h,e.y));
      // Shoot fireball at player
      if(e.shootCD<=0 && dist<90){
        e.shootCD=150+(Math.random()*60|0);
        e.atkT=20;
        const spd=rollFireballSpeed(0.9);
        const fbDx=ddx/dist*spd, fbDy=ddy/dist*spd;
        fireballs.push({x:e.x+e.w/2-1,y:e.y+e.h/2-1,vx:fbDx,vy:fbDy,life:160});
      }
    } else {
    const near=ov({x:e.x,y:e.y,w:e.w,h:e.h},{x:p.x,y:p.y,w:p.w,h:p.h});
    if(near){
      if(e.atkCD<=0){
        e.atkT=20; e.atkCD=(e.giant?100:116)+(Math.random()*(e.giant?60:65)|0);
        if(p.hurtT<=0){
          hurtPlayer(1);
        }
      }
    } else {
      if(dist>0){e.x+=ddx/dist*e.speed;e.y+=ddy/dist*e.speed;}
    }
    } // end non-wizard
  }

  // Fireballs
  for(let i=fireballs.length-1;i>=0;i--){
    const fb=fireballs[i];
    fb.x+=fb.vx; fb.y+=fb.vy;
    fb.life--;
    // Out of arena bounds - disappear
    if(fb.x<PX||fb.x>PX+PW||fb.y<PY||fb.y>PY+PH||fb.life<=0){
      fireballs.splice(i,1); continue;
    }
    // Hit player
    if(p.hurtT<=0 && ov({x:fb.x,y:fb.y,w:3,h:3},{x:p.x,y:p.y,w:p.w,h:p.h})){
      fireballs.splice(i,1);
      hurtPlayer(1);
      continue;
    }
  }

  // Particles
  for(let i=parts.length-1;i>=0;i--){
    const pt=parts[i];
    pt.x+=pt.vx; pt.y+=pt.vy; pt.vx*=0.82; pt.vy*=0.82;
    if(--pt.life<=0) parts.splice(i,1);
  }

  // Floating score texts
  for(let i=floatTexts.length-1;i>=0;i--){
    floatTexts[i].y-=0.25;
    if(--floatTexts[i].life<=0) floatTexts.splice(i,1);
  }

  for(let i=shockwaves.length-1;i>=0;i--){
    const sw=shockwaves[i];
    sw.r += (sw.maxR - sw.r) * 0.35;
    if(--sw.life<=0) shockwaves.splice(i,1);
  }
}


function drawDragonBoss(b){
  if(!b) return;
  const x=Math.round(b.x), y=Math.round(b.y);
  const flip=b.dir!=='right';
  const bob=(Math.floor(b.walkF/10)%2);
  const zone1Mini=!!b.zone1Mini;
  const boneDark=zone1Mini ? '#6f675d' : C.BN1;
  const boneMid=zone1Mini ? '#948876' : C.BN2;
  const boneLite=zone1Mini ? '#b4a48c' : C.BN3;
  const bonePale=zone1Mini ? '#d3c6ae' : C.W3;
  const boneBright=zone1Mini ? '#e5dcc6' : C.WH;
  const wingShade=zone1Mini ? '#5b5b5b' : C.SI3;
  function px(dx,dy,w,h,col,alpha=1){
    const rx=flip ? x+b.w-dx-w : x+dx;
    const ry=y+dy+bob;
    const old=ctx.globalAlpha;
    if(alpha!==1) ctx.globalAlpha=old*alpha;
    fr(rx,ry,w,h,col);
    if(alpha!==1) ctx.globalAlpha=old;
  }

  ctx.globalAlpha=0.20;
  fr(x+4,y+b.h-1,b.w-8,3,C.DK);
  ctx.globalAlpha=1;

  if(b.hurtT>0){
    ctx.globalAlpha=0.28;
    fr(x+3,y+2,b.w-6,b.h-5,C.RD);
    ctx.globalAlpha=1;
  }

  // ragged skeletal wings behind the body, using the same dark-bone palette as the other skeletons
  px(2,5,1,11,boneDark); px(3,5,4,1,boneLite); px(3,8,5,1,bonePale); px(2,12,6,1,boneLite); px(3,15,5,1,bonePale);
  px(4,6,1,10,boneMid); px(6,7,1,8,boneMid); px(7,9,3,1,wingShade,0.75); px(7,13,2,1,wingShade,0.65);
  px(28,5,1,11,boneDark); px(24,5,4,1,boneLite); px(23,8,5,1,bonePale); px(22,12,6,1,boneLite); px(23,15,5,1,bonePale);
  px(26,6,1,10,boneMid); px(24,7,1,8,boneMid); px(20,9,3,1,wingShade,0.75); px(21,13,2,1,wingShade,0.65);

  // tail vertebrae
  const tailSegs=flip
    ? [[31,14,4,2],[28,15,3,2],[25,16,3,2],[22,17,3,1],[19,18,2,1]]
    : [[1,14,4,2],[5,15,3,2],[8,16,3,2],[11,17,3,1],[14,18,2,1]];
  for(let i=0;i<tailSegs.length;i++){
    const [dx,dy,w,h]=tailSegs[i];
    px(dx,dy,w,h,i%2===0?bonePale:boneMid);
    if(w>2) px(dx+1,dy,1,h,boneDark,0.9);
  }
  if(flip) px(33,15,2,1,boneDark); else px(0,15,2,1,boneDark);

  // hind / fore legs
  px(9,18,2,6,bonePale);  px(10,23,1,2,boneDark);
  px(15,19,2,5,bonePale); px(16,23,1,2,boneDark);
  px(21,18,2,6,bonePale); px(22,23,1,2,boneDark);
  px(25,17,2,6,bonePale); px(26,22,1,2,boneDark);
  px(8,20,4,1,boneLite); px(20,20,5,1,boneLite);

  // body / rib cage - closer to the existing skeleton silhouettes and colors
  px(9,9,18,8,bonePale);
  px(10,10,16,6,boneBright);
  px(11,11,14,4,bonePale);
  px(12,8,10,1,boneDark);
  px(12,16,13,1,boneLite);
  for(let i=0;i<6;i++){
    px(12+i*2,9,1,8,boneDark);
    if(i<5) px(13+i*2,11,1,3,boneMid,0.8);
  }
  px(14,12,8,1,boneLite);
  px(15,13,6,1,boneLite);

  // neck vertebrae
  px(24,7,2,2,bonePale); px(25,6,2,2,boneBright); px(26,5,2,2,bonePale); px(27,4,2,2,boneBright);

  // skull head / jaw
  px(27,4,6,5,bonePale);
  px(28,5,4,3,boneBright);
  px(31,6,3,2,bonePale);
  px(32,7,2,1,boneDark);
  px(29,9,4,1,boneDark);
  px(28,3,1,2,boneDark);
  px(30,2,2,1,boneDark);
  px(29,10,3,1,boneLite);
  px(31,10,2,1,boneLite);
  if(b.atkName==='tail'){
    px(28,10,4,1,boneDark);
    px(31,9,2,1,boneDark);
  }

  // eye socket glow
  const eyeCol=C.RD;
  px(30,6,1,1,eyeCol,1);
  px(31,6,1,1,eyeCol,(b.atkName==='fireball' || b.atkName==='fireblast') ? 1 : 0.82);

  // fire charge near the mouth
  if(b.atkName==='fireball' || b.atkName==='fireblast'){
    const pulse=0.24+0.22*Math.sin(frame*0.25);
    const hx=flip ? x+5 : x+b.w-10;
    ctx.globalAlpha=pulse;
    fr(hx,y+5,6,6,C.FR2);
    ctx.globalAlpha=pulse*0.95;
    fr(hx+1,y+6,4,4,C.FR1);
    ctx.globalAlpha=pulse*0.8;
    fr(hx+2,y+7,2,2,C.FB2);
    ctx.globalAlpha=1;
  }

  // howl aura stays simple and skeletal
  if(b.howlT>0){
    const pulse=0.16+0.14*Math.sin(frame*0.22);
    ctx.globalAlpha=pulse;
    fr(x+6,y+3,b.w-12,b.h-11,C.MG3);
    ctx.globalAlpha=pulse*0.65;
    fr(x+9,y+5,b.w-18,b.h-15,C.MG2);
    ctx.globalAlpha=1;
  }
}

function drawShadowBoss(b){
  if(!b) return;
  const x=Math.round(b.x), y=Math.round(b.y);
  const flip=b.dir==='left';
  const bob=Math.floor(b.walkF/8)%2;
  const aura1=b.phase===1 ? C.MG : C.MG;
  const aura2=b.phase===1 ? C.MG3 : C.FR1;

  ctx.globalAlpha=0.18 + 0.08*Math.sin(frame*0.16);
  fr(x-2,y-2,b.w+4,b.h+4,aura1);
  ctx.globalAlpha=0.10 + 0.05*Math.sin(frame*0.11+1.1);
  fr(x-3,y-3,b.w+6,b.h+6,aura2);
  ctx.globalAlpha=1;

  if(b.hurtT>0){
    ctx.globalAlpha=0.35;
    fr(x-1,y-1,b.w+2,b.h+2,C.FR1);
    ctx.globalAlpha=1;
  }

  const spr=b.dir==='up'?S.plrU:b.dir==='down'?S.plrD:S.plrR;
  const map={
    4: b.phase===1 ? C.MG3 : '#5a2742',
    5: b.phase===1 ? C.MG2 : '#a0567d',
    6: C.SI3,
    7: C.FR1,
    8: b.phase===1 ? '#6a4a9a' : '#7a2538',
    9: b.phase===1 ? '#3e255f' : '#4b1522'
  };
  dsMap(spr,x,y+bob,map,flip);

  if(flip){ fr(x+1,y+2+bob,1,1,C.FR1); fr(x+3,y+2+bob,1,1,C.MG2); }
  else { fr(x+4,y+2+bob,1,1,C.FR1); fr(x+6,y+2+bob,1,1,C.MG2); }

  if(b.atkT>0 && (b.atkName==='lunge' || b.atkName==='slash')){
    const sb=getShadowSlashBox(b);
    const alpha=(b.atkT/(b.atkName==='lunge'?16:14));
    ctx.globalAlpha=Math.max(0.12,alpha*0.6);
    fr(sb.x,sb.y,sb.w,sb.h,b.phase===1?C.MG2:C.FR1);
    ctx.globalAlpha=Math.max(0.08,alpha*0.35);
    fr(sb.x+1,sb.y+1,Math.max(1,sb.w-2),Math.max(1,sb.h-2),C.WH);
    ctx.globalAlpha=1;
  }

  if(b.screechStartupT>0 || b.screechT>0){
    const pulse=0.22 + 0.10*Math.sin(frame*0.42);
    ctx.globalAlpha=pulse;
    fr(x-6,y-6,b.w+12,b.h+12,C.FR1);
    ctx.globalAlpha=Math.max(0.10,pulse*0.65);
    fr(x-8,y-8,b.w+16,b.h+16,C.MG2);
    ctx.globalAlpha=1;
  }

  if(b.howlT>0){
    ctx.globalAlpha=0.18 + 0.08*Math.sin(frame*0.45);
    fr(x-5,y-5,b.w+10,b.h+10,C.FR1);
    ctx.globalAlpha=0.12 + 0.06*Math.sin(frame*0.36);
    fr(x-6,y-6,b.w+12,b.h+12,C.MG2);
    ctx.globalAlpha=1;
  }
}



// BoneCrawler safe split module
// Purpose: Dungeon/zone renderers for Zone 1, Zone 2, Zone 3, Secret Zone 1, Secret Zone 2, decor, backgrounds.
// Source: app.js lines 4935-6295
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Dungeon background ────────────────────────────────────────
function drawDungeonZone1(){
  fr(0,0,GW,GH,C.W2);
  for(let y=0;y<GH;y+=4){
    fr(0,y,GW,1,C.W3);
    const off=(Math.floor(y/4)%2)*4;
    for(let x=off;x<GW;x+=8) fr(x,y,1,4,C.W3);
  }
  for(let y=1;y<GH;y+=4) fr(0,y,GW,1,C.W1);
  fr(PX,PY,PW,PH,C.FL);
  for(let y=PY+5;y<PY+PH;y+=7) fr(PX,y,PW,1,C.FL2);
  for(let x=PX+10;x<PX+PW;x+=14) fr(x,PY,1,PH,C.FL2);
  for(const d of BONE_DECALS){
    ctx.globalAlpha=0.54;
    if(d.type==='s') ds(S.mskull,d.x,d.y);
    else if(d.type==='h'){fr(d.x,d.y,2,1,d.col);fr(d.x+1,d.y+1,1,1,d.col);}
    else{fr(d.x,d.y,1,2,d.col);fr(d.x+1,d.y+1,1,1,d.col);}
  }
  ctx.globalAlpha=1;
  fr(PX-1,PY-1,PW+2,1,C.WH);
  fr(PX-1,PY-1,1,PH+2,C.WH);
  fr(PX-1,PY+PH,PW+2,1,C.W3);
  fr(PX+PW,PY-1,1,PH+2,C.W3);
}

function drawZone3DoorBlockage(){
  const doorX=GW/2-6;

  // sealed arch / frame
  fr(doorX-4, PY-1, 20, 3, '#7f6a51');
  fr(doorX-2, PY+1, 16, 10, '#3e3125');
  fr(doorX-1, PY+2, 14, 8, '#241c16');
  fr(doorX-2, PY+10, 16, 2, '#2b221a');

  // two nailed planks over the doorway
  fr(doorX-1, PY+3, 14, 2, '#7d5f3e');
  fr(doorX,   PY+6, 13, 2, '#6f5335');
  fr(doorX+1, PY+3, 1, 2, C.SI3); fr(doorX+11, PY+3, 1, 2, C.SI3);
  fr(doorX+2, PY+6, 1, 2, C.SI3); fr(doorX+10, PY+6, 1, 2, C.SI3);

  // scattered stones and rubble in front of the sealed exit
  const rocks=[
    [doorX-6,PY+11,4,3,'#6b5a46'],
    [doorX-2,PY+13,5,3,'#544638'],
    [doorX+4,PY+12,4,3,'#72604b'],
    [doorX+9,PY+14,5,3,'#5d4d3d'],
    [doorX+14,PY+11,3,3,'#6f5c47'],
  ];
  for(const [rx,ry,rw,rh,col] of rocks){
    fr(rx,ry,rw,rh,col);
    fr(rx,ry,rw,1,'#8b745b');
    fr(rx+1,ry+rh-1,Math.max(1,rw-2),1,'#3b3026');
  }
  fr(doorX-8,PY+15,24,2,'#332920');
}


function drawZone3BrokenTreeCluster(){
  const shake=zone3TreeShakeT>0 ? (((zone3TreeShakeT%4)<2)?-1:1) : 0;
  const mainX=PX+21+shake, mainY=PY+PH-18;

  ctx.globalAlpha=0.20;
  fr(PX+9,PY+PH-12,24,3,'#5a4330');
  fr(PX+14,PY+PH-20,16,2,'#4a3526');
  ctx.globalAlpha=1;

  // chopped stump: upper half removed
  fr(mainX-5, mainY-1, 10, 9, C.TB2);
  fr(mainX-4, mainY, 8, 7, C.TB);
  fr(mainX-5, mainY+1, 10, 1, C.BN3);
  fr(mainX-2, mainY+1, 1, 5, C.BN3);
  fr(mainX+2, mainY+2, 1, 4, C.BN3);
  fr(mainX-4, mainY-2, 8, 2, '#2c2219');
  fr(mainX-3, mainY-3, 2, 1, C.BN3);
  fr(mainX+1, mainY-3, 2, 1, C.BN3);
  fr(mainX-1, mainY-2, 1, 1, '#8b7350');
  fr(mainX+1, mainY-1, 1, 1, '#8b7350');

  const roots=[
    [[mainX-2,mainY+8],[mainX-7,mainY+10],[mainX-12,mainY+12]],
    [[mainX+1,mainY+8],[mainX+6,mainY+10],[mainX+11,mainY+12]],
    [[mainX-4,mainY+6],[mainX-9,mainY+7],[mainX-14,mainY+8]],
  ];
  for(const root of roots){
    for(const [rx,ry] of root){
      fr(rx,ry,3,1,C.TB2);
      if((rx+ry)%2===0) fr(rx+1,ry-1,1,1,'#8b7350');
    }
  }

  if(zone3TreeAwake){
    fr(mainX-2,mainY+1,1,1,C.WH);
    fr(mainX+1,mainY+1,1,1,C.WH);
    fr(mainX-2,mainY+2,1,1,C.MG2);
    fr(mainX+1,mainY+2,1,1,C.MG2);
    fr(mainX-1,mainY+4,2,1,'#2c2219');
  }

  fr(mainX-10, mainY+9, 2,1, C.BN3);
  fr(mainX-7,  mainY+11,1,1, C.TB);
  fr(mainX+8,  mainY+10,2,1, C.BN3);
  fr(mainX+5,  mainY+12,1,1, C.TB2);
}

function drawDungeonZone3(){
  const wallDark='#201710';
  const wallMid ='#2f2219';
  const wallLight='#5a4734';
  const wallMortar='#17110d';
  const floorBase='#17120f';
  const floorLine='#241c17';
  const floorAccent='#34281f';
  const floorGlow='#584531';

  fr(0,0,GW,GH,wallDark);
  for(let y=0;y<GH;y+=4){
    fr(0,y,GW,1,wallMid);
    const off=(Math.floor(y/4)%2)*4;
    for(let x=off;x<GW;x+=8){
      const col=((x+y)>>2)%3===0 ? wallDark : '#3d3025';
      fr(x,y,1,4,col);
      if(((x+y)>>2)%5===0) fr(x+2,y+1,1,1,wallLight);
    }
  }
  for(let y=1;y<GH;y+=4) fr(0,y,GW,1,'#5b4937');

  ctx.globalAlpha=0.05+0.02*Math.sin(frame*0.028);
  ctx.fillStyle='#5d4734';
  ctx.fillRect(0, 0, GW*SCALE, Math.floor(GH*0.46)*SCALE);
  ctx.globalAlpha=0.04+0.03*Math.sin(frame*0.034+1.4);
  ctx.fillStyle='#31261d';
  ctx.fillRect(0, Math.floor(GH*0.34)*SCALE, GW*SCALE, Math.floor(GH*0.66)*SCALE);
  ctx.globalAlpha=1;

  fr(PX,PY,PW,PH,floorBase);
  for(let y=PY+5;y<PY+PH;y+=7) fr(PX,y,PW,1,floorLine);
  for(let x=PX+10;x<PX+PW;x+=14) fr(x,PY,1,PH,floorAccent);

  ctx.globalAlpha=0.04+0.02*Math.sin(frame*0.03+0.8);
  ctx.fillStyle=floorGlow;
  ctx.fillRect(PX*SCALE, PY*SCALE, PW*SCALE, PH*SCALE);
  ctx.globalAlpha=1;

  ctx.globalAlpha=0.28;
  for(const d of BONE_DECALS){
    if(d.type==='s') ds(S.mskull,d.x,d.y);
    else if(d.type==='h'){fr(d.x,d.y,2,1,C.BN2);fr(d.x+1,d.y+1,1,1,C.BN3);}
    else{fr(d.x,d.y,1,2,C.BN3);fr(d.x+1,d.y+1,1,1,C.BN2);}
  }
  ctx.globalAlpha=1;

  drawZone3DoorBlockage();

  // torn carpet / old chamber runner beneath the center table
  drawTornCarpetPatch(GW/2, PY+22);

  if(!zone3Broken[0]) drawBrokenBookshelf(PX+2, PY+22, 0);
  else drawDecorRubble(PX+5, PY+39, 0);

  if(!zone3Broken[1]) drawBrokenBookshelf(PX+PW-8, PY+20, 1);
  else drawDecorRubble(PX+PW-5, PY+37, 1);

  if(!zone3Broken[2]) drawBrokenRoundTableSet(GW/2-4, PY+35);
  else drawDecorRubble(GW/2, PY+48, 2);

  drawZone3BrokenTreeCluster();

  if(shadowBossDefeated && score>=SECRET2_SCORE_REQ){
    const rx=ZONE3_SECRET2_PORTAL_RECT.x, ry=ZONE3_SECRET2_PORTAL_RECT.y;
    const pulse=0.22 + 0.08*Math.sin(frame*0.12);
    ctx.globalAlpha=pulse;
    fr(rx-3,ry-3,ZONE3_SECRET2_PORTAL_RECT.w+6,ZONE3_SECRET2_PORTAL_RECT.h+6,C.MG2);
    ctx.globalAlpha=0.30 + 0.10*Math.sin(frame*0.15+1.1);
    fr(rx-1,ry-1,ZONE3_SECRET2_PORTAL_RECT.w+2,ZONE3_SECRET2_PORTAL_RECT.h+2,C.SH);
    ctx.globalAlpha=1;
    fr(rx+1,ry+1,10,10,'#36414b');
    fr(rx+2,ry+2,8,8,'#101923');
    fr(rx+3,ry+3,6,6,'#43295b');
    fr(rx+4,ry+4,4,4,'#a75dff');
    fr(rx+5 + Math.round(Math.sin(frame*0.09)),ry+5,1,1,'#f0ddff');
    fr(rx+6 + Math.round(Math.cos(frame*0.11)),ry+6,1,1,C.MG2);
  }

  // dead roots / dried growth where zone 1 and 2 aesthetics meet
  for(let vy=PY+10;vy<PY+PH-8;vy+=10){
    fr(PX+4,vy,1,5,'#715b42');
    fr(PX+5,vy+2,2,1,'#8c7557');
  }
  for(let vy=PY+14;vy<PY+PH-12;vy+=12){
    fr(PX+PW-6,vy,1,4,'#5d4c39');
    fr(PX+PW-8,vy+2,2,1,'#8a7254');
  }

  // bottom corners lit mostly by torch fire
  drawTorch(PX+8, PY+PH-19);
  ctx.globalAlpha=0.10+0.04*Math.sin(frame*0.18);
  fr(PX+1, PY+PH-28, 18, 16, '#6a4322');
  ctx.globalAlpha=1;
  drawTorch(PX+PW-12, PY+PH-19);
  ctx.globalAlpha=0.10+0.04*Math.sin(frame*0.18+1.3);
  fr(PX+PW-24, PY+PH-28, 18, 16, '#6a4322');
  ctx.globalAlpha=1;
  drawFloorLantern(GW/2-24, PY+PH-15);
  drawFloorLantern(GW/2+16, PY+PH-17);
  if(!zone3Broken[3]) drawBarrel(PX+PW-25, PY+PH-13, 1); else drawDecorRubble(PX+PW-22, PY+PH-6, 3);
  drawCrate(PX+PW-18, PY+PH-11, true);
  if(!zone3Broken[4]) drawBarrel(PX+PW-10, PY+PH-12, 2); else drawDecorRubble(PX+PW-7, PY+PH-5, 3);

  fr(PX-1,PY-1,PW+2,1,wallLight);
  fr(PX-1,PY-1,1,PH+2,wallLight);
  fr(PX-1,PY+PH,PW+2,1,wallMortar);
  fr(PX+PW,PY-1,1,PH+2,wallMortar);
}
function drawDungeonSecret1(){
  fr(0,0,GW,GH,'#121028');
  for(let y=0;y<GH;y+=4){
    fr(0,y,GW,1,'#2f3158');
    const off=(Math.floor(y/4)%2)*4;
    for(let x=off;x<GW;x+=8) fr(x,y,1,4,'#26244a');
  }
  for(let y=1;y<GH;y+=4) fr(0,y,GW,1,'#433f78');
  fr(PX,PY,PW,PH,'#20314a');
  for(let y=PY+6;y<PY+PH;y+=8) fr(PX,y,PW,1,'#29405e');

  const fx=GW/2, fy=PY+39;

  // walkway leading up to the pond
  const walkX = fx-6, walkY = fy+15, walkW = 12, walkH = 18;
  fr(walkX-1, walkY-1, walkW+2, walkH+2, '#8e939f');
  fr(walkX, walkY, walkW, walkH, '#c8ccd3');
  for(let y=walkY+2; y<walkY+walkH; y+=4){
    fr(walkX+1, y, walkW-2, 1, '#9ea4b0');
  }
  for(let x=walkX+3; x<walkX+walkW; x+=4){
    fr(x, walkY+1, 1, walkH-2, '#b2b7c2');
  }

  // brick ring around the pond
  const poolOuter = {x:fx-32, y:fy-16, w:64, h:32};
  fr(poolOuter.x, poolOuter.y, poolOuter.w, poolOuter.h, '#aeb3bc');
  fr(poolOuter.x+1, poolOuter.y+1, poolOuter.w-2, poolOuter.h-2, '#d6d9df');
  for(let y=poolOuter.y+2; y<poolOuter.y+poolOuter.h-1; y+=4){
    const off=((y-poolOuter.y)/4)%2 ? 3 : 1;
    for(let x=poolOuter.x+off; x<poolOuter.x+poolOuter.w-3; x+=6){
      fr(x, y, 4, 2, '#bcc1cb');
      fr(x, y+2, 1, 1, '#8f95a2');
    }
  }

  // opening in the brickwork where the walkway joins
  fr(fx-7, fy+15, 14, 3, '#c8ccd3');

  // larger fairy pool
  ctx.globalAlpha=0.18+0.06*Math.sin(frame*0.028);
  fr(fx-29,fy-14,58,28,C.MG2);
  ctx.globalAlpha=0.38;
  fr(fx-25,fy-12,50,24,'#4e6fa0');
  ctx.globalAlpha=0.70;
  fr(fx-19,fy-9,38,18,'#6ca8cf');
  ctx.globalAlpha=1;
  fr(fx-13,fy-6,26,12,'#a6e8ff');

  // moving water stripes / shimmer (30% slower)
  const rippleA = Math.round(Math.sin(frame*0.056)*3);
  const rippleB = Math.round(Math.sin(frame*0.042 + 1.7)*4);
  ctx.globalAlpha=0.28;
  fr(fx-18+rippleA,fy-5,36,1,'#d8f6ff');
  fr(fx-16-rippleB,fy-1,32,1,'#d8f6ff');
  fr(fx-14+rippleB,fy+3,28,1,'#bfefff');
  ctx.globalAlpha=0.18;
  fr(fx-10-rippleA,fy-8,20,1,'#ffffff');
  fr(fx-11+rippleB,fy+6,22,1,'#ffffff');
  ctx.globalAlpha=1;

  // little animated sparkles in the water (also slower)
  const sparkleX = Math.round(Math.sin(frame*0.063)*6);
  fr(fx-8+sparkleX,fy-2,2,1,C.WH);
  fr(fx+4-sparkleX,fy+2,2,1,C.WH);
  fr(fx-1+Math.round(Math.cos(frame*0.049)*5),fy-6,1,1,C.WH);

  // fairies (30% slower)
  for(let i=0;i<5;i++){
    const ang=frame*0.035 + i*1.26;
    const ox=Math.cos(ang)*26;
    const oy=Math.sin(ang*1.4)*12;
    const sx=Math.round(fx+ox);
    const sy=Math.round(fy-13+oy);
    ctx.globalAlpha=0.5+0.35*Math.sin(frame*0.14+i);
    fr(sx,sy,2,2,C.MG2);
    fr(sx+1,sy-1,1,1,C.WH);
    ctx.globalAlpha=1;
  }

  // stone pillars around the fountain area
  drawStonePillar(fx-31, fy-18);
  drawStonePillar(fx+26, fy-18);
  drawStonePillar(fx-31, fy+8);
  drawStonePillar(fx+26, fy+8);

  // torchlight near the room corners
  drawTorch(PX+6, PY+10);
  drawTorch(PX+PW-10, PY+10);
  drawTorch(PX+6, PY+PH-14);
  drawTorch(PX+PW-10, PY+PH-14);

  // sun-speckled dust through the opening above the fountain
  ctx.globalAlpha=0.28;
  fr(fx-9 + Math.round(Math.sin(frame*0.04)*2), fy-11, 1, 1, '#f9fff2');
  fr(fx+2 + Math.round(Math.cos(frame*0.05)*2), fy-8, 1, 1, '#f9fff2');
  fr(fx+7 + Math.round(Math.sin(frame*0.03+0.8)*2), fy-2, 1, 1, '#f9fff2');
  fr(fx-13 + Math.round(Math.cos(frame*0.06+1.1)*2), fy+1, 1, 1, '#f9fff2');
  ctx.globalAlpha=1;

  // tiny rat and cheese in the upper-left corner
  const ratX=SECRET1_RAT_RECT.x, ratY=SECRET1_RAT_RECT.y;
  fr(SECRET1_CHEESE_RECT.x,SECRET1_CHEESE_RECT.y,SECRET1_CHEESE_RECT.w,SECRET1_CHEESE_RECT.h,'#f0d36a');
  fr(SECRET1_CHEESE_RECT.x+1,SECRET1_CHEESE_RECT.y+1,SECRET1_CHEESE_RECT.w-2,SECRET1_CHEESE_RECT.h-2,'#ffd98e');
  fr(SECRET1_CHEESE_RECT.x+1,SECRET1_CHEESE_RECT.y+1,1,1,'#b88b2d');
  fr(SECRET1_CHEESE_RECT.x+3,SECRET1_CHEESE_RECT.y+2,1,1,'#b88b2d');
  fr(ratX+1,ratY+2,5,2,'#7d7b86');
  fr(ratX+2,ratY+1,3,2,'#9694a2');
  fr(ratX+1,ratY+1,1,1,'#b7b5c2');
  fr(ratX+5,ratY+1,1,1,'#b7b5c2');
  fr(ratX,ratY+3,1,1,'#6d6b77');
  fr(ratX+6,ratY+3,2,1,'#6d6b77');
  fr(ratX+7,ratY+4,2,1,'#9694a2');
  fr(ratX+3,ratY+2,1,1,C.DK);
  if(secret1RatTalkCount>=2){
    ctx.globalAlpha=0.18+0.05*Math.sin(frame*0.12);
    fr(ratX-2,ratY-2,12,10,C.MG2);
    ctx.globalAlpha=1;
  }

  // larger decorative rocks with varied gray tones
  drawRockCluster(PX+8, PY+PH-18, 0);
  drawRockCluster(PX+PW-17, PY+PH-19, 1);
  drawRockCluster(PX+14, PY+11, 2);

  const dx=SECRET1_EXIT_DOOR_RECT.x, dy=SECRET1_EXIT_DOOR_RECT.y;
  fr(dx-1,dy,12,10,C.WH);
  fr(dx,dy+1,10,9,'#5a4c78');
  fr(dx+2,dy+2,6,7,'#05060a');
  fr(dx+1,dy+1,8,1,'#8d84bc');
  fr(dx+2,dy+2,6,1,'#b6b1d9');
  fr(dx,dy+3,2,5,'#6b5034');
  fr(dx+8,dy+3,2,5,'#6b5034');
  fr(dx,dy+3,1,5,'#8e6e48');
  fr(dx+9,dy+3,1,5,'#8e6e48');
  if(secret1BlessingT<=0){
    ctx.globalAlpha=0.16+0.06*Math.sin(frame*0.049);
    fr(dx+2,dy+8,6,3,C.WH);
    ctx.globalAlpha=1;
  }

  fr(PX-1,PY-1,PW+2,1,C.WH);
  fr(PX-1,PY-1,1,PH+2,C.WH);
  fr(PX-1,PY+PH,PW+2,1,'#2f3158');
  fr(PX+PW,PY-1,1,PH+2,'#2f3158');
}


function drawSecret2SwordOverlay(cx, cy){
  // top cap of plinth stays in front so the player can pass behind it
  fr(cx-3,cy,6,3,'#8a948d');
  fr(cx-2,cy-1,4,1,'#a4ada7');

  // smaller sword for better player proportion
  fr(cx-1,cy-8,2,8,C.SI1);
  fr(cx-2,cy-7,1,6,C.SI2);
  fr(cx+1,cy-7,1,6,C.WH);
  fr(cx-2,cy-9,4,1,C.SI1);

  // smaller purple hilt
  fr(cx-1,cy-13,2,4,'#5d2c83');
  fr(cx,cy-12,1,2,'#8f61c0');

  // guard and pommel
  fr(cx-2,cy-10,5,1,'#9fa9b2');
  fr(cx-1,cy-14,2,1,C.BN1);

  // sword glow, separate from sunlight beam
  ctx.globalAlpha=0.06 + 0.025*Math.sin(frame*0.08);
  fr(cx-3,cy-14,6,14,'#dff7ff');
  ctx.globalAlpha=1;

  // fairies around the blade
  for(let i=0;i<3;i++){
    const ang=frame*0.045 + i*2.1;
    const fx=Math.round(cx + Math.cos(ang)*6);
    const fy=Math.round(cy-12 + Math.sin(ang*1.2)*4);
    ctx.globalAlpha=0.45 + 0.30*Math.sin(frame*0.13+i);
    fr(fx,fy,2,2,C.MG2);
    fr(fx+1,fy-1,1,1,C.WH);
    ctx.globalAlpha=1;
  }
}

function drawDungeonSecret2(){
  fr(0,0,GW,GH,'#0a0e12');

  const wallH = 28;

  // back wall, darker than the floor
  fr(PX,PY,PW,wallH,'#151e24');
  for(let y=PY+1;y<PY+wallH;y+=4) fr(PX,y,PW,1,'#202b33');
  for(let x=PX+4;x<PX+PW;x+=9) fr(x,PY,1,wallH,'#0f151a');

  // crooked, splintered wall cracks
  const crackColor='#080b0e';
  const splinters=[
    [GW/2-23,PY+3,1,4],[GW/2-24,PY+6,2,1],[GW/2-22,PY+7,1,3],[GW/2-25,PY+10,3,1],
    [GW/2-23,PY+11,1,2],[GW/2-21,PY+13,2,1],[GW/2-22,PY+14,1,4],[GW/2-24,PY+17,3,1],
    [GW/2-20,PY+8,1,2],[GW/2-19,PY+9,2,1],
    [GW/2-2,PY+2,1,3],[GW/2-3,PY+4,2,1],[GW/2-1,PY+5,1,3],[GW/2+1,PY+7,2,1],
    [GW/2,PY+8,1,3],[GW/2-2,PY+10,2,1],[GW/2-1,PY+11,1,2],
    [GW/2+18,PY+4,1,4],[GW/2+17,PY+7,2,1],[GW/2+19,PY+8,1,3],[GW/2+16,PY+10,3,1],
    [GW/2+18,PY+11,1,2],[GW/2+20,PY+13,2,1],[GW/2+19,PY+14,1,4],[GW/2+17,PY+17,3,1],
    [GW/2+15,PY+9,1,2],[GW/2+14,PY+10,2,1]
  ];
  for(const s of splinters) fr(s[0],s[1],s[2],s[3],crackColor);

  // lots more vines creeping from those cracks
  const vine='#30443a';
  const vineHi='#58705f';
  const vineDark='#243229';
  const vines=[
    [GW/2-24,PY+1,1,16],[GW/2-23,PY+6,4,1],[GW/2-25,PY+12,3,1],[GW/2-22,PY+15,1,5],[GW/2-24,PY+18,4,1],
    [GW/2-20,PY+5,1,9],[GW/2-19,PY+9,3,1],[GW/2-18,PY+12,1,4],
    [GW/2-2,PY,1,12],[GW/2-3,PY+4,3,1],[GW/2,PY+6,3,1],[GW/2+1,PY+9,1,5],[GW/2-1,PY+13,3,1],
    [GW/2+18,PY+2,1,15],[GW/2+16,PY+7,4,1],[GW/2+19,PY+11,3,1],[GW/2+18,PY+14,1,5],[GW/2+16,PY+18,4,1],
    [GW/2+14,PY+6,1,8],[GW/2+13,PY+10,3,1],[GW/2+15,PY+13,1,4]
  ];
  for(const v of vines){
    fr(v[0],v[1],v[2],v[3],vine);
    if(v[2] >= 3) fr(v[0]+1,v[1],1,v[3],vineHi);
    if(v[3] >= 4) fr(v[0],v[1]+1,v[2],1,vineDark);
  }

  // floor, clearly different shade from the wall
  fr(PX,PY+wallH,PW,PH-wallH,'#1b2a36');
  for(let y=PY+wallH+2;y<PY+PH;y+=7) fr(PX,y,PW,1,'#24384a');
  for(let y=PY+wallH+5;y<PY+PH;y+=14) fr(PX,y,PW,1,'#16222c');

  const cx=GW/2, cy=PY+43;

  // sunlight opening and beam
  ctx.save();
  ctx.globalAlpha=0.13 + 0.04*Math.sin(frame*0.035);
  ctx.fillStyle='#f8fff0';
  ctx.beginPath();
  ctx.moveTo((cx-4)*SCALE, PY*SCALE);
  ctx.lineTo((cx+6)*SCALE, PY*SCALE);
  ctx.lineTo((cx+17)*SCALE, (cy+10)*SCALE);
  ctx.lineTo((cx-13)*SCALE, (cy+10)*SCALE);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha=0.10 + 0.03*Math.sin(frame*0.04);
  fr(cx-13,cy+5,26,10,'#f3f7e1');
  ctx.globalAlpha=1;

  ctx.globalAlpha=0.24;
  fr(cx-2 + Math.round(Math.sin(frame*0.04)*2), cy-17, 1, 1, C.WH);
  fr(cx+4 + Math.round(Math.cos(frame*0.05)*2), cy-12, 1, 1, C.WH);
  fr(cx-6 + Math.round(Math.sin(frame*0.03+1.3)*2), cy-7, 1, 1, C.WH);
  ctx.globalAlpha=1;

  // shrine platform with a more top-down view
  fr(cx-16,cy+4,32,7,'#cfd3cf');
  fr(cx-14,cy+5,28,5,'#e2e5e1');
  fr(cx-11,cy+3,22,2,'#f0f2ef');

  fr(cx-12,cy+3,24,1,'#9ca29c');
  fr(cx-16,cy+6,2,4,'#8b908b');
  fr(cx+14,cy+6,2,4,'#8b908b');

  // front steps tapering down
  fr(cx-12,cy+11,24,2,'#b3b8b3');
  fr(cx-9,cy+13,18,2,'#a0a59f');
  fr(cx-6,cy+15,12,2,'#8e938e');

  // lower plinth/body stays behind the player
  fr(cx-4,cy+1,8,5,'#667069');
  fr(cx-3,cy+2,6,3,'#788279');

  // wounded NPC crawling toward the shrine
  const nx=SECRET2_NPC_RECT.x, ny=SECRET2_NPC_RECT.y;
  ctx.globalAlpha=0.18;
  fr(nx-1,ny+6,14,3,C.DK);
  ctx.globalAlpha=1;
  fr(nx+2,ny+2,7,3,C.TB2);
  fr(nx+8,ny+2,3,2,C.TB);
  fr(nx+10,ny+1,2,1,C.BN3);
  fr(nx,ny+1,3,3,C.BN1);
  fr(nx+1,ny+2,1,1,C.DK);
  fr(nx+3,ny+5,2,2,C.TB);
  fr(nx+5,ny+5,2,2,C.TB);
  fr(nx+2,ny+4,1,2,C.BN3);
  fr(nx+6,ny+4,1,2,C.BN3);
  fr(nx+4,ny+1,1,1,C.BLD);

  // return portal - easter egg exit back to the main menu
  const rx=SECRET2_RETURN_PORTAL_RECT.x, ry=SECRET2_RETURN_PORTAL_RECT.y;
  const pulse=0.20 + 0.08*Math.sin(frame*0.12);
  ctx.globalAlpha=pulse;
  fr(rx-2,ry-2,SECRET2_RETURN_PORTAL_RECT.w+4,SECRET2_RETURN_PORTAL_RECT.h+4,C.MG2);
  ctx.globalAlpha=0.28 + 0.08*Math.sin(frame*0.15+1.1);
  fr(rx-1,ry-1,SECRET2_RETURN_PORTAL_RECT.w+2,SECRET2_RETURN_PORTAL_RECT.h+2,C.SH);
  ctx.globalAlpha=1;

  // stone base / frame
  fr(rx+1,ry+1,10,10,'#36414b');
  fr(rx+2,ry+2,8,8,'#101923');

  // glowing portal interior
  fr(rx+3,ry+3,6,6,'#1f3c63');
  fr(rx+4,ry+4,4,4,'#4ea2ff');
  fr(rx+5 + Math.round(Math.sin(frame*0.09)),ry+5,1,1,'#d8f6ff');
  fr(rx+6 + Math.round(Math.cos(frame*0.11)),ry+6,1,1,C.MG2);

  // tiny orbit sparks
  if(Math.floor(frame/10)%2===0){
    fr(rx+2,ry,1,1,'#9fd8ff');
    fr(rx+10,ry+2,1,1,'#bde9ff');
    fr(rx+1,ry+10,1,1,C.MG2);
  }

  fr(PX-1,PY-1,PW+2,1,C.WH);
  fr(PX-1,PY-1,1,PH+2,C.WH);
  fr(PX-1,PY+PH,PW+2,1,'#23313d');
  fr(PX+PW,PY-1,1,PH+2,'#23313d');
}

function drawDungeon(){
  if(currentZone===2){ drawDungeonZone2(); return; }
  if(currentZone===3){ drawDungeonZone3(); return; }
  if(currentZone===ZONE_SECRET1){ drawDungeonSecret1(); return; }
  if(currentZone===ZONE_SECRET2){ drawDungeonSecret2(); return; }
  drawDungeonZone1();
}

function drawZone2Tree(){
  const tx=GW/2, ty=PY+48;
  const mossA='#4d5a41';
  const mossB='#5b6a4a';
  const rotA='#394332';
  const rotB='#2f3828';
  const thinGrass='#667052';

  // uprooted crater / root tear
  fr(tx-14,ty+10,28,6,C.DK);
  for(let i=0;i<12;i++){
    const ox=-20+i*3;
    fr(tx+ox,ty+8+((i%2)?1:0),2,2,(i%3===0)?C.W2:C.W3);
  }

  // half-dead tree trunk
  fr(tx-5,ty-10,10,30,C.TB2);
  fr(tx-4,ty-9,8,28,C.TB);
  fr(tx-1,ty-8,1,26,C.BN3);
  fr(tx+2,ty-5,1,18,C.BN3);
  fr(tx-5,ty+6,10,2,C.BN3);

  // decayed canopy / rot patches
  fr(tx-12,ty-16,8,4,rotA); fr(tx+1,ty-18,11,6,rotB); fr(tx-3,ty-20,5,3,mossA);
  fr(tx-10,ty-15,6,4,mossA); fr(tx-4,ty-17,4,3,mossB); fr(tx+3,ty-16,6,4,rotA); fr(tx+8,ty-13,4,3,mossA);
  fr(tx-15,ty-6,5,3,rotB); fr(tx+11,ty-7,5,3,mossA);
  fr(tx-18,ty+12,6,3,rotA); fr(tx+12,ty+13,7,3,mossB);
  fr(tx-23,ty+20,5,3,rotB); fr(tx+18,ty+22,6,3,mossA);
  fr(tx-28,ty+30,7,4,rotB); fr(tx+22,ty+31,8,4,rotA);
  fr(tx-8,ty+26,5,3,mossA); fr(tx+4,ty+27,5,3,rotA);
  fr(tx-2,ty-20,3,2,C.W3); fr(tx+7,ty-11,2,2,rotB);

  // thinner, sparser grass tufts
  const zone2Grass=[
    [tx-26,ty+16],[tx-22,ty+28],[tx-17,ty+33],[tx-9,ty+31],[tx-4,ty+34],
    [tx+6,ty+32],[tx+13,ty+27],[tx+20,ty+17],[tx+24,ty+31],[tx+28,ty+21],
    [PX+10,PY+PH-16],[PX+18,PY+PH-11],[PX+PW-24,PY+PH-15],[PX+PW-15,PY+PH-10]
  ];
  for(const [gx,gy] of zone2Grass){
    fr(gx,gy,1,4,thinGrass);
    if((gx+gy)%2===0) fr(gx-1,gy+2,1,2,rotA);
    fr(gx+1,gy+1,1,3,mossA);
  }

  // dead branches
  fr(tx-10,ty-6,6,1,C.BN3); fr(tx+4,ty-4,7,1,C.BN3); fr(tx+9,ty-6,1,5,C.BN3);
  fr(tx-7,ty-13,1,7,C.BN3); fr(tx-11,ty-14,5,1,C.BN3);

  // roots through the room
  const roots=[
    [[tx-1,ty+18],[tx-4,ty+21],[tx-9,ty+24],[tx-14,ty+26],[tx-20,ty+29]],
    [[tx+1,ty+18],[tx+5,ty+21],[tx+10,ty+23],[tx+16,ty+26],[tx+24,ty+30]],
    [[tx-3,ty+16],[tx-8,ty+17],[tx-14,ty+17],[tx-20,ty+18]],
    [[tx+3,ty+16],[tx+8,ty+17],[tx+14,ty+19],[tx+21,ty+20]],
  ];
  for(const root of roots){
    for(const [rx,ry] of root){
      fr(rx,ry,3,1,C.TB2);
      if((rx+ry)%2===0) fr(rx+1,ry-1,1,1,C.W3);
      if((rx+ry)%3===0) fr(rx+2,ry+1,1,1,rotA);
    }
  }
}


function drawDungeonZone2(){
  const wallA='#24313a';
  const wallB='#1c2730';
  const wallC='#33434d';
  const floorA='#223548';
  const floorB='#1b2b39';
  const floorC='#2a4257';
  const mossA='#4e5d43';
  const mossB='#3f4c37';
  const mossC='#6b7459';
  const vineA='#485540';
  const vineB='#374233';
  const crackA='#0b1015';

  fr(0,0,GW,GH,wallB);
  for(let y=0;y<GH;y+=4){
    fr(0,y,GW,1,wallC);
    const off=(Math.floor(y/4)%2)*4;
    for(let x=off;x<GW;x+=8){
      fr(x,y,1,4,wallA);
      if(((x+y)>>2)%6===0) fr(x+2,y+1,1,1,'#566671');
      if(((x+y)>>2)%7===0) fr(x+5,y+2,2,1,wallB);
    }
  }
  for(let y=1;y<GH;y+=4) fr(0,y,GW,1,'#31424d');

  fr(PX,PY,PW,PH,floorA);
  for(let y=PY+5;y<PY+PH;y+=7) fr(PX,y,PW,1,floorC);
  for(let x=PX+10;x<PX+PW;x+=14) fr(x,PY,1,PH,floorB);

  fr(PX, PY, PW, 16, '#2c4156');
  for(let x=PX+1; x<PX+PW-1; x+=4){
    if(((x-PX)/4)%3===1) continue;
    const height = 2 + ((x*5)%4);
    const bend = (x%8===0)?1:0;
    fr(x, PY+16-height, 1, height, mossC);
    fr(x+1, PY+16-height+bend, 1, Math.max(1,height-1), mossA);
    if(x%12===0) fr(x-1, PY+15-height, 1, 1, '#88a2b8');
    if(x%16===0) fr(x+2, PY+17-height, 1, 1, mossB);
  }

  if(!zone2Broken[0]) drawBrokenBookshelf(GW/2-14, PY+7, 0); else drawDecorRubble(GW/2-11, PY+23, 0);
  if(!zone2Broken[1]) drawBrokenBookshelf(GW/2-6,  PY+7, 0); else drawDecorRubble(GW/2-3,  PY+23, 0);
  if(!zone2Broken[2]) drawBrokenBookshelf(GW/2+2,  PY+7, 0); else drawDecorRubble(GW/2+5,  PY+23, 0);
  if(!zone2Broken[3]) drawBrokenBookshelf(GW/2+10, PY+7, 1); else drawDecorRubble(GW/2+13, PY+23, 0);

  if(!zone2Broken[4]) drawCrate(PX+PW-30, PY+12, true); else drawDecorRubble(PX+PW-26, PY+19, 3);
  if(!zone2Broken[5]) drawBarrel(PX+PW-22, PY+10, 2); else drawDecorRubble(PX+PW-19, PY+18, 3);
  if(!zone2Broken[6]) drawBarrel(PX+PW-14, PY+12, 1); else drawDecorRubble(PX+PW-11, PY+19, 3);

  drawFloorLantern(GW/2-23, PY+23);

  const wallCracks = [
    [[PX+9,PY+10],[PX+10,PY+13],[PX+8,PY+16],[PX+10,PY+20],[PX+9,PY+24]],
    [[PX+PW-15,PY+8],[PX+PW-16,PY+11],[PX+PW-14,PY+14],[PX+PW-15,PY+18],[PX+PW-13,PY+21]],
    [[GW/2-24,PY+6],[GW/2-22,PY+9],[GW/2-23,PY+12],[GW/2-21,PY+15]],
    [[GW/2+24,PY+9],[GW/2+22,PY+12],[GW/2+23,PY+15],[GW/2+21,PY+18]]
  ];
  for(const crack of wallCracks){
    for(let i=0;i<crack.length;i++){
      const [cx,cy]=crack[i];
      fr(cx,cy,1,1,crackA);
      if(i%2===0) fr(cx+1,cy,1,1,'#54616a');
    }
  }

  const floorCracks = [
    [[PX+14,PY+PH-28],[PX+18,PY+PH-25],[PX+23,PY+PH-22],[PX+29,PY+PH-20]],
    [[PX+PW-18,PY+PH-30],[PX+PW-23,PY+PH-27],[PX+PW-28,PY+PH-24],[PX+PW-33,PY+PH-22]],
    [[GW/2-10,PY+PH-18],[GW/2-6,PY+PH-16],[GW/2-2,PY+PH-13],[GW/2+3,PY+PH-11]],
    [[GW/2+11,PY+PH-24],[GW/2+7,PY+PH-21],[GW/2+3,PY+PH-18],[GW/2-2,PY+PH-15]]
  ];
  for(const crack of floorCracks){
    for(let i=0;i<crack.length;i++){
      const [cx,cy]=crack[i];
      fr(cx,cy,2,1,crackA);
      if(i%2===0) fr(cx+1,cy-1,1,1,wallC);
    }
  }

  for(let vy=PY+8;vy<PY+PH-8;vy+=10){
    fr(PX+3,vy,1,5,vineA);
    fr(PX+4,vy+2,1,2,vineB);
  }
  for(let vy=PY+12;vy<PY+PH-12;vy+=12){
    fr(PX+PW-5,vy,1,4,vineA);
    fr(PX+PW-7,vy+2,2,1,vineB);
  }
  fr(PX+8,PY+12,3,1,mossA); fr(PX+PW-12,PY+16,4,1,mossB);
  fr(GW/2-18,PY+8,5,2,mossA); fr(GW/2+14,PY+12,4,2,mossB);

  const edgeGrass=[
    [PX+6,PY+PH-12],[PX+12,PY+PH-10],[PX+20,PY+PH-14],[PX+PW-22,PY+PH-13],[PX+PW-12,PY+PH-9],
    [GW/2-25,PY+PH-16],[GW/2-18,PY+PH-12],[GW/2+18,PY+PH-14],[GW/2+26,PY+PH-11],
    [PX+24,PY+PH-20],[PX+36,PY+PH-26],[PX+PW-36,PY+PH-22],[GW/2+28,PY+PH-24]
  ];
  for(const [gx,gy] of edgeGrass){
    fr(gx,gy,1,4,mossC);
    fr(gx+1,gy+1,1,3,mossA);
    if((gx+gy)%2===0) fr(gx-1,gy+2,1,2,mossB);
  }

  const floorGrassPatches=[
    [PX+9,PY+33],[PX+14,PY+41],[PX+22,PY+48],[PX+31,PY+38],[PX+39,PY+54],
    [GW/2-24,PY+43],[GW/2-12,PY+52],[GW/2+6,PY+46],[GW/2+20,PY+56],
    [PX+PW-40,PY+36],[PX+PW-31,PY+47],[PX+PW-20,PY+40],[PX+PW-14,PY+54]
  ];
  for(const [gx,gy] of floorGrassPatches){
    fr(gx,gy,1,3,mossC);
    fr(gx+1,gy+1,1,2,mossA);
    if((gx+gy)%3===0) fr(gx-1,gy+2,1,1,mossB);
  }

  // extra bookshelves tucked into the back grass and side wall pockets
  if(!zone2Broken[7]) drawBrokenBookshelf(PX+6, PY+7, 0); else drawDecorRubble(PX+9, PY+23, 0);
  if(!zone2Broken[8]) drawBrokenBookshelf(PX+14, PY+7, 0); else drawDecorRubble(PX+17, PY+23, 0);
  if(!zone2Broken[9]) drawBrokenBookshelf(PX+PW-20, PY+7, 1); else drawDecorRubble(PX+PW-17, PY+23, 0);
  if(!zone2Broken[10]) drawBrokenBookshelf(PX+PW-12, PY+7, 1); else drawDecorRubble(PX+PW-9, PY+23, 0);

  // mushrooms around the tree and along the grassy back wall
  const mushSpots=[
    [GW/2-18,PY+15],[GW/2-10,PY+17],[GW/2+12,PY+15],[GW/2+20,PY+18],
    [GW/2-8,PY+PH-22],[GW/2+7,PY+PH-24],[GW/2-15,PY+PH-12],[GW/2+15,PY+PH-13],
    [PX+PW-30,PY+18],[PX+PW-22,PY+20]
  ];
  mushSpots.forEach(([mx,my],idx)=>drawMushroom(mx,my,idx%2===0?'#c84a8d':'#9b4bd1'));

  drawZone2TriHole(PX+15, PY+PH-24, false);
  drawZone2TriHole(PX+PW-27, PY+PH-25, true);

  for(const d of BONE_DECALS){
    ctx.globalAlpha=0.36;
    if(d.type==='s') ds(S.mskull,d.x,d.y);
    else if(d.type==='h'){fr(d.x,d.y,2,1,d.col);fr(d.x+1,d.y+1,1,1,d.col);}
    else{fr(d.x,d.y,1,2,d.col);fr(d.x+1,d.y+1,1,1,d.col);}
  }
  ctx.globalAlpha=1;

  drawZone2Tree();

  fr(PX-1,PY-1,PW+2,1,C.WH);
  fr(PX-1,PY-1,1,PH+2,C.WH);
  fr(PX-1,PY+PH,PW+2,1,C.W3);
  fr(PX+PW,PY-1,1,PH+2,C.W3);
}

function drawTorch(lx,ly){
  ds(S.torch,lx,ly);
  const f=Math.floor(frame/4)%2;
  ctx.globalAlpha=0.20+f*0.08;
  fr(lx-2,ly-1,8,5,C.FR2);
  ctx.globalAlpha=0.10+f*0.05;
  fr(lx-1,ly,6,4,C.FR1);
  ctx.globalAlpha=1;
}

function drawChainColumn(x,y,len){
  // iron wall bracket
  fr(x,   y-2, 2,1, C.BN3);
  fr(x+1, y-1, 2,1, C.SI3);

  for(let i=0;i<len;i++){
    const oy=y+i*4;

    // alternating iron links with darker centers
    fr(x+1,oy,  1,1,C.SI1);
    fr(x,  oy+1,1,1,C.SI2);
    fr(x+2,oy+1,1,1,C.SI2);
    fr(x+1,oy+2,1,1,C.SI1);
    fr(x+1,oy+1,1,1,C.SI3);

    if(i<len-1){
      fr(x+1,oy+3,1,1,C.SI3);
    }
  }
}

function drawSpiderWeb(cx,cy){
  fr(cx,cy,1,1,C.WH);
  fr(cx-1,cy,1,1,C.BN2); fr(cx+1,cy,1,1,C.BN2);
  fr(cx,cy-1,1,1,C.BN2); fr(cx,cy+1,1,1,C.BN2);
  fr(cx-1,cy-1,1,1,C.BN2); fr(cx+1,cy-1,1,1,C.BN2);
  fr(cx-1,cy+1,1,1,C.BN2); fr(cx+1,cy+1,1,1,C.BN2);
  fr(cx-2,cy-2,1,1,C.W3); fr(cx+2,cy-2,1,1,C.W3);
  fr(cx-2,cy,1,1,C.W3);   fr(cx+2,cy,1,1,C.W3);
}

function drawBarrel(lx,ly,variant=0){
  // soft floor shadow / warm reflected light
  ctx.globalAlpha=0.22;
  fr(lx-1,ly+8,8,1,'#7b5330');
  fr(lx,ly+9,6,1,'#5f3d24');
  ctx.globalAlpha=1;

  // common body
  fr(lx+1,ly,4,1,C.BN3);
  fr(lx,ly+1,6,6,C.TB2);
  fr(lx+1,ly+1,4,6,C.TB);
  fr(lx,ly+2,6,1,C.BN3);
  fr(lx,ly+5,6,1,C.BN3);
  fr(lx+2,ly+1,1,6,C.BN3);
  fr(lx+4,ly+1,1,6,C.BN3);
  fr(lx+1,ly+7,4,1,C.BN3);

  if(variant===1){
    // lighter staves / brighter banding
    fr(lx+1,ly+1,1,6,C.BN2);
    fr(lx+3,ly+1,1,6,C.BN2);
  } else if(variant===2){
    // darker older barrel with side highlight
    fr(lx+1,ly+1,4,6,C.TB2);
    fr(lx+1,ly+1,1,6,C.TB);
  } else if(variant===3){
    // one strap shifted and slightly dented top
    fr(lx,ly+3,6,1,C.BN3);
    fr(lx+4,ly,1,1,C.TB2);
  } else if(variant===4){
    // half-broken barrel
    fr(lx,ly+4,6,3,C.DK);
    fr(lx+1,ly+5,1,2,C.BN3);
    fr(lx+4,ly+5,1,2,C.BN3);
    fr(lx+2,ly+4,2,1,C.TB);
    fr(lx+2,ly+6,2,1,C.TB2);
    // spilled wood pieces
    fr(lx+6,ly+7,1,1,C.BN3);
    fr(lx+7,ly+8,1,1,C.TB);
    fr(lx-1,ly+7,1,1,C.BN3);
  } else if(variant===5){
    // extra bright front slats
    fr(lx+2,ly+1,1,6,C.BN2);
    fr(lx+4,ly+1,1,6,C.BN2);
    fr(lx+1,ly+3,4,1,C.TB2);
  }
}

function drawBrokenRoundTableSet(lx,ly){
  // table shadow / lived-in grime
  ctx.globalAlpha=0.16;
  fr(lx-2,ly+10,15,2,'#6f4a28');
  fr(lx+1,ly+12,9,1,'#4f321c');
  ctx.globalAlpha=1;

  // broken round table top
  fr(lx+2,ly,7,1,C.BN3);
  fr(lx+1,ly+1,9,1,C.TB);
  fr(lx,ly+2,10,3,C.TB2);
  fr(lx+1,ly+5,8,1,C.TB);
  fr(lx+3,ly+6,4,1,C.BN3);

  // missing chunk / crack
  fr(lx+6,ly+1,3,2,C.DK);
  fr(lx+7,ly+3,2,1,C.DK);
  fr(lx+4,ly+2,1,3,C.BN3);

  // table pedestal / broken leg
  fr(lx+4,ly+7,2,3,C.BN3);
  fr(lx+3,ly+10,1,2,C.BN3);
  fr(lx+6,ly+9,1,1,C.BN3);

  // chair 1 (left)
  fr(lx-3,ly+3,3,1,C.BN3);
  fr(lx-4,ly+4,5,2,C.TB2);
  fr(lx-3,ly+6,3,2,C.TB);
  fr(lx-4,ly+8,1,2,C.BN3);
  fr(lx,ly+8,1,2,C.BN3);

  // chair 2 (bottom, knocked over)
  fr(lx+7,ly+10,4,1,C.BN3);
  fr(lx+8,ly+11,3,1,C.TB2);
  fr(lx+9,ly+12,2,1,C.TB);
  fr(lx+11,ly+11,1,2,C.BN3);

  // chair 3 (right, broken back)
  fr(lx+11,ly+2,1,4,C.BN3);
  fr(lx+12,ly+4,3,2,C.TB2);
  fr(lx+12,ly+6,2,2,C.TB);
  fr(lx+14,ly+2,1,1,C.BN3);
  fr(lx+14,ly+7,1,2,C.BN3);

  // scattered cup / debris for old lived-in feel
  fr(lx+1,ly+11,1,1,C.BN2);
  fr(lx+13,ly+10,1,1,C.BN2);
  fr(lx+2,ly+12,2,1,C.TB);
  fr(lx+12,ly+12,1,1,C.TB);
}

function drawTornCarpetPatch(cx,ty){
  const carpetX=cx-6;
  fr(carpetX, ty, 12, 3, '#6a1f1b');
  fr(carpetX+1, ty+3, 10, 4, '#7f2b24');
  fr(carpetX-1, ty+7, 13, 3, '#6a1f1b');
  fr(carpetX+1, ty+10, 9, 3, '#8d3329');

  fr(carpetX+3, ty+2, 4, 1, '#4c1210');
  fr(carpetX+2, ty+3, 6, 1, '#5c1714');
  fr(carpetX+5, ty+4, 2, 1, '#2f0909');
  fr(carpetX+2, ty+6, 5, 1, '#561612');
  fr(carpetX+4, ty+7, 3, 1, '#2f0909');
  fr(carpetX+6, ty+8, 4, 1, '#3f0e0d');

  fr(carpetX+1, ty+12, 2, 1, '#4d120f');
  fr(carpetX+5, ty+12, 1, 1, '#4d120f');
  fr(carpetX+8, ty+12, 2, 1, '#4d120f');

  fr(carpetX+2, ty+18, 8, 3, '#6a1f1b');
  fr(carpetX+1, ty+21, 10, 4, '#7f2b24');
  fr(carpetX+3, ty+25, 7, 4, '#8d3329');

  fr(carpetX+4, ty+19, 4, 1, '#40100d');
  fr(carpetX+3, ty+22, 5, 1, '#561612');
  fr(carpetX+6, ty+24, 3, 1, '#2f0909');
  fr(carpetX+4, ty+26, 3, 1, '#6a1b18');
  fr(carpetX+7, ty+27, 2, 1, '#390d0c');

  fr(carpetX+2, ty+17, 2, 1, '#4d120f');
  fr(carpetX+6, ty+17, 1, 1, '#4d120f');
  fr(carpetX+9, ty+18, 1, 1, '#4d120f');
  fr(carpetX+2, ty+28, 1, 1, '#4d120f');
  fr(carpetX+8, ty+28, 1, 1, '#4d120f');
}

function drawZone1SecretCrack(active=false, opened=false){
  const x=SECRET1_ENTRANCE_RECT.x-2;
  const y=SECRET1_ENTRANCE_RECT.y-2;

  // stone wall recess behind the bookshelf
  fr(x, y, 8, 14, '#4f4339');
  fr(x+1, y+1, 6, 12, '#68584b');

  // light chipped masonry around the hidden hatch
  fr(x+1,y+1,2,2,'#9ca2ad');
  fr(x+5,y+2,1,2,'#8e949f');
  fr(x+1,y+10,2,1,'#aeb4be');
  fr(x+4,y+11,2,1,'#9ca2ad');

  // cellar door frame
  fr(x+1,y+2,6,10,'#8f949d');
  fr(x+2,y+3,4,8,'#3d2a1b');

  // vertical wooden hatch planks
  fr(x+2,y+3,1,8,'#6e4a2c');
  fr(x+3,y+3,1,8,'#825636');
  fr(x+4,y+3,1,8,'#734c2f');
  fr(x+5,y+3,1,8,'#8c5d39');

  // iron braces / latch so it reads like a cellar hatch
  fr(x+2,y+5,4,1,'#7d8794');
  fr(x+2,y+8,4,1,'#6b7480');
  fr(x+5,y+6,1,2,'#a6afb8');
  fr(x+4,y+6,1,1,'#2a3138');

  // tiny seam line through the middle
  fr(x+4,y+3,1,8,'#23160f');

  // when opened, the hatch swings away and reveals a dark crawl opening
  if(opened){
    // open door leaf pushed aside / hanging
    fr(x+1,y+3,2,8,'#5b3b22');
    fr(x+1,y+5,2,1,'#727b86');
    fr(x+1,y+8,2,1,'#5f6975');

    // dark entrance behind it
    fr(x+3,y+3,3,8,'#050608');
    for(let yy=0;yy<4;yy++) fr(x+3,y+4+yy*2,3,1,'#202734');

    // chipped edge / debris
    fr(x+2,y+2,1,1,'#aeb4be');
    fr(x+6,y+10,1,1,'#8e949f');
    fr(x+2,y+11,2,1,'#6d727d');
    fr(x+5,y+11,1,1,'#8e949f');
  }

  // subtle ready-state pulse once the room is cleared
  if(active){
    ctx.globalAlpha=0.08+0.04*Math.sin(frame*0.10);
    fr(x-1,y-1,10,16,C.MG2);
    ctx.globalAlpha=1;
  }
}

function drawBrokenBookshelf(lx,ly,variant=0){
  // wall shadow
  ctx.globalAlpha=0.18;
  fr(lx-1,ly,8,18,'#3a2617');
  ctx.globalAlpha=1;

  // frame
  fr(lx,ly,6,17,C.BN3);
  fr(lx+1,ly+1,4,15,C.TB2);
  fr(lx+1,ly+4,4,1,C.BN3);
  fr(lx+1,ly+9,4,1,C.BN3);
  fr(lx+1,ly+14,4,1,C.BN3);

  if(variant===1){
    // more open gaps on the newer right-side shelf
    fr(lx+2,ly+1,2,4,C.DK);
    fr(lx+1,ly+6,3,2,C.DK);
    fr(lx+3,ly+11,2,2,C.DK);

    // a few remaining books tucked to one side
    fr(lx+4,ly+2,1,2,C.SI2);
    fr(lx+4,ly+6,1,2,C.BN2);
    fr(lx+1,ly+11,1,2,C.TB);

    // lots more books spilled on the floor
    fr(lx-2,ly+17,2,1,C.BN2);
    fr(lx,ly+18,2,1,C.TB);
    fr(lx+2,ly+17,1,2,C.GR);
    fr(lx+4,ly+18,2,1,C.SI2);
    fr(lx+6,ly+17,1,2,C.BN2);
    fr(lx+1,ly+19,2,1,C.TB2);
  } else {
    // damage variation
    fr(lx+1,ly+11,2,2,C.DK);
    fr(lx+2,ly+2,1,2,C.DK);

    // books on shelves
    fr(lx+1,ly+2,1,2,C.GR);
    fr(lx+2,ly+2,1,2,C.BN2);
    fr(lx+3,ly+2,1,2,C.SI2);
    fr(lx+4,ly+2,1,2,C.TB);

    fr(lx+1,ly+6,1,2,C.BN2);
    fr(lx+2,ly+6,1,2,C.TB);
    fr(lx+3,ly+6,1,2,C.GR);
    fr(lx+4,ly+6,1,2,C.BN2);

    fr(lx+1,ly+11,1,2,C.SI2);
    fr(lx+2,ly+11,1,2,C.BN2);
    fr(lx+3,ly+11,1,2,C.TB);

    // books on floor
    fr(lx-1,ly+17,2,1,C.BN2);
    fr(lx+2,ly+18,1,1,C.TB);
    fr(lx+5,ly+17,1,2,C.GR);
  }
}

function drawDecorRubble(cx,cy,kind){
  // small static rubble pile after breaking zone 1 props
  ctx.globalAlpha=0.22;
  fr(cx-4,cy+3,8,1,'#6a4528');
  ctx.globalAlpha=1;

  if(kind===0 || kind===1){
    // shelf planks + books
    fr(cx-3,cy,3,1,C.BN3);
    fr(cx+1,cy+1,3,1,C.BN3);
    fr(cx-1,cy+2,1,1,C.GR);
    fr(cx+2,cy+2,1,1,C.BN2);
    fr(cx-3,cy+2,1,1,C.TB);
  } else if(kind===2){
    // table/chair debris
    fr(cx-3,cy,2,1,C.BN3);
    fr(cx,cy,2,1,C.BN3);
    fr(cx-1,cy+1,1,2,C.TB);
    fr(cx+2,cy+2,1,1,C.BN2);
  } else {
    // barrel debris
    fr(cx-2,cy,2,1,C.BN3);
    fr(cx+1,cy,2,1,C.BN3);
    fr(cx-1,cy+1,1,2,C.TB);
    fr(cx+2,cy+1,1,1,C.TB2);
  }
}


function drawCrate(lx,ly,broken=false){
  ctx.globalAlpha=0.20;
  fr(lx-1,ly+7,9,1,'#6b4a2c');
  ctx.globalAlpha=1;
  fr(lx,ly,7,7,C.TB2);
  fr(lx+1,ly+1,5,5,C.TB);
  fr(lx,ly+3,7,1,C.BN3);
  fr(lx+3,ly,1,7,C.BN3);
  fr(lx+1,ly+1,5,1,'#8b7350');
  if(broken){
    fr(lx+4,ly+4,2,2,C.DK);
    fr(lx+6,ly+5,1,1,C.BN3);
    fr(lx-1,ly+5,1,1,C.BN3);
  }
}

function drawBrokenWeaponRack(lx,ly,small=false){
  const h = small ? 8 : 10;
  ctx.globalAlpha=0.18;
  fr(lx-1,ly+h,10,1,'#5b3f29');
  ctx.globalAlpha=1;
  fr(lx,ly,1,h,C.BN3);
  fr(lx+6,ly+1,1,h-1,C.BN3);
  fr(lx,ly+2,7,1,C.TB2);
  fr(lx+1,ly+5,6,1,C.TB);
  fr(lx+2,ly+7,4,1,C.TB2);
  // snapped rails and scattered weapons
  fr(lx+4,ly+2,3,1,C.DK);
  fr(lx+1,ly+h+1,2,1,C.BN3);
  fr(lx+4,ly+h,2,1,C.SI2);
  fr(lx+6,ly+h+1,1,2,C.TB);
  fr(lx+3,ly+h+2,1,1,C.BN2);
  if(!small){
    fr(lx+2,ly+1,1,5,C.SI2);
    fr(lx+5,ly+2,1,4,C.BN2);
  }
}

function drawTrainingDummy(lx,ly){
  ctx.globalAlpha=0.20;
  fr(lx-2,ly+10,10,2,'#6b4a2c');
  ctx.globalAlpha=1;
  fr(lx+2,ly+1,2,10,'#8b7350');
  fr(lx,ly+9,6,1,C.BN3);
  fr(lx-1,ly+10,8,1,C.TB2);
  fr(lx+1,ly,4,1,'#d2c48b');
  fr(lx,ly+1,6,5,'#bda66d');
  fr(lx+1,ly+2,4,3,'#d7c58f');
  fr(lx+2,ly+1,1,5,'#e5d7a8');
  fr(lx-2,ly+3,3,1,C.TB);
  fr(lx+5,ly+3,3,1,C.TB);
  fr(lx-1,ly+4,2,1,C.TB2);
  fr(lx+5,ly+4,2,1,C.TB2);
}

function drawFloorLantern(lx,ly){
  const glow=0.17 + 0.05*Math.sin(frame*0.05 + lx*0.08 + ly*0.05);
  ctx.globalAlpha=0.18+glow;
  fr(lx-4,ly-3,12,10,C.FR2);
  ctx.globalAlpha=0.10+glow*0.8;
  fr(lx-2,ly-2,8,8,C.FR1);
  ctx.globalAlpha=0.05+glow*0.4;
  fr(lx-6,ly-5,16,14,'#d8f6ff');
  ctx.globalAlpha=1;
  fr(lx+1,ly+1,4,4,'#3d4649');
  fr(lx+2,ly+2,2,2,'#f7d889');
  fr(lx+2,ly,2,1,'#6c7377');
  fr(lx+1,ly+5,4,1,'#1a1f22');
  if(Math.sin(frame*0.05 + lx*0.08)>0.25) fr(lx+2,ly+2,1,1,C.WH);
}


function drawMushroom(lx,ly,cap='#c84a8d', stem='#d9d0c3'){
  fr(lx+1,ly+2,1,2,stem);
  fr(lx,ly+1,3,1,cap);
  fr(lx+1,ly,1,1,'#f2d6e8');
}
function drawZone2TriHole(lx,ly,flip=false){
  const edgeA='#a3adb6', edgeB='#858f98', edgeC='#68727a', edgeD='#4d565e';
  fr(lx-2,ly+1,1,1,edgeD); fr(lx-1,ly,2,1,edgeB); fr(lx,ly-1,2,1,edgeA);
  fr(lx+2,ly-1,2,1,edgeB); fr(lx+4,ly,1,1,edgeC); fr(lx+5,ly+1,1,1,edgeD);
  fr(lx-1,ly+2,1,1,edgeC); fr(lx+5,ly+2,1,1,edgeC); fr(lx,ly+4,2,1,edgeD);
  fr(lx+2,ly+4,2,1,edgeB); fr(lx+4,ly+3,1,1,edgeD);
  fr(lx-3,ly+2,1,1,edgeB); fr(lx+6,ly+2,1,1,edgeB);
  fr(lx-2,ly+3,2,1,edgeD); fr(lx+5,ly+3,2,1,edgeD);
  fr(lx+1,ly+5,1,1,edgeC); fr(lx+3,ly+5,1,1,edgeC);
  if(!flip){
    fr(lx+1,ly+1,2,1,'#06080a');
    fr(lx+1,ly+2,3,1,'#050608');
    fr(lx+2,ly+3,1,1,'#050608');
  } else {
    fr(lx+2,ly+1,2,1,'#06080a');
    fr(lx+1,ly+2,3,1,'#050608');
    fr(lx+2,ly+3,1,1,'#050608');
  }
  fr(lx+2,ly+2,1,1,'#1d252c');
  fr(lx-1,ly+1,1,2,'#57616a');
  fr(lx+4,ly+1,1,2,'#57616a');
  fr(lx+1,ly+4,3,1,'#57616a');
}

function drawStonePillar(px,py){
  fr(px,py,5,12,'#6f757c');
  fr(px+1,py+1,3,10,'#969ca2');
  fr(px,py,5,1,'#b7bcc1');
  fr(px,py+11,5,1,'#555c63');
  fr(px+2,py+2,1,8,'#c7ccd0');
}

function drawRockCluster(rx,ry,size=0){
  const cols=[['#666c73','#8a9096'],['#575e66','#7b838b'],['#6f767d','#949aa0']][size%3];
  fr(rx,ry,6,4,cols[0]);
  fr(rx+1,ry+1,4,2,cols[1]);
  fr(rx+2,ry,2,1,'#4d535a');
}

function drawZone1DoorDecor(){
  const doorX=GW/2-6;

  // spread chains farther from the doorway and add a little wall hardware
  drawChainColumn(doorX-12,2,5);
  drawChainColumn(doorX+22,2,5);
  fr(doorX-6,9,3,1,C.SI3);
  fr(doorX+13,9,3,1,C.SI3);

  // more spread-out web detail
  drawSpiderWeb(doorX-7,5);
  drawSpiderWeb(doorX+18,5);
  drawSpiderWeb(doorX+17,13);
  drawSpiderWeb(doorX+25,9);
  drawSpiderWeb(PX+14,PY+10);

  // ripped carpet halves, separated around the middle
  const carpetX=GW/2-6;
  // upper half near the door
  fr(carpetX, PY, 12, 3, '#6a1f1b');
  fr(carpetX+1, PY+3, 10, 4, '#7f2b24');
  fr(carpetX-1, PY+7, 13, 3, '#6a1f1b');
  fr(carpetX+1, PY+10, 9, 3, '#8d3329');

  fr(carpetX+3, PY+2, 4, 1, '#4c1210');
  fr(carpetX+2, PY+3, 6, 1, '#5c1714');
  fr(carpetX+5, PY+4, 2, 1, '#2f0909');
  fr(carpetX+2, PY+6, 5, 1, '#561612');
  fr(carpetX+4, PY+7, 3, 1, '#2f0909');
  fr(carpetX+6, PY+8, 4, 1, '#3f0e0d');

  // torn edge
  fr(carpetX+1, PY+12, 2, 1, '#4d120f');
  fr(carpetX+5, PY+12, 1, 1, '#4d120f');
  fr(carpetX+8, PY+12, 2, 1, '#4d120f');

  // lower half farther away on the floor
  fr(carpetX+2, PY+18, 8, 3, '#6a1f1b');
  fr(carpetX+1, PY+21, 10, 4, '#7f2b24');
  fr(carpetX+3, PY+25, 7, 4, '#8d3329');

  fr(carpetX+4, PY+19, 4, 1, '#40100d');
  fr(carpetX+3, PY+22, 5, 1, '#561612');
  fr(carpetX+6, PY+24, 3, 1, '#2f0909');
  fr(carpetX+4, PY+26, 3, 1, '#6a1b18');
  fr(carpetX+7, PY+27, 2, 1, '#390d0c');

  // ragged lower torn edge / wear
  fr(carpetX+2, PY+17, 2, 1, '#4d120f');
  fr(carpetX+6, PY+17, 1, 1, '#4d120f');
  fr(carpetX+9, PY+18, 1, 1, '#4d120f');
  fr(carpetX+2, PY+28, 1, 1, '#4d120f');
  fr(carpetX+8, PY+28, 1, 1, '#4d120f');

  // opposite-side runner pieces pulling toward the room center
  fr(carpetX-24, PY+48, 9, 3, '#6a1f1b');
  fr(carpetX-22, PY+51, 10, 4, '#7f2b24');
  fr(carpetX-18, PY+55, 7, 3, '#8d3329');
  fr(carpetX+27, PY+48, 9, 3, '#6a1f1b');
  fr(carpetX+26, PY+51, 10, 4, '#7f2b24');
  fr(carpetX+27, PY+55, 7, 3, '#8d3329');

  // hidden crack for Secret Zone 1 sits behind the left bookshelf
  drawZone1SecretCrack(zone1SecretEntranceReady(), zone1Broken[0]);

  // bookshelves along the walls (breakable)
  if(!zone1Broken[0]) drawBrokenBookshelf(PX+2, PY+22, 0);
  else drawDecorRubble(PX+5, PY+39, 0);

  if(!zone1Broken[1]) drawBrokenBookshelf(PX+PW-8, PY+20, 1);
  else drawDecorRubble(PX+PW-5, PY+37, 1);

  // broken rack beside the added right shelf
  drawBrokenWeaponRack(PX+PW-17, PY+28, true);

  // lone broken barrel near the upper-right
  if(!zone1Broken[3]) drawBarrel(PX+PW-14, PY+8, 4);
  else drawDecorRubble(PX+PW-11, PY+15, 3);

  // rest of the barrels grouped together at the bottom-right
  if(!zone1Broken[4]) drawBarrel(PX+PW-24, PY+PH-22, 2);
  else drawDecorRubble(PX+PW-21, PY+PH-15, 4);

  if(!zone1Broken[5]) drawBarrel(PX+PW-16, PY+PH-20, 0);
  else drawDecorRubble(PX+PW-13, PY+PH-13, 5);

  if(!zone1Broken[6]) drawBarrel(PX+PW-9,  PY+PH-23, 5);
  else drawDecorRubble(PX+PW-6, PY+PH-16, 6);

  if(!zone1Broken[7]) drawBarrel(PX+PW-18, PY+PH-13, 3);
  else drawDecorRubble(PX+PW-15, PY+PH-6, 7);

  if(!zone1Broken[8]) drawBarrel(PX+PW-10, PY+PH-12, 1);
  else drawDecorRubble(PX+PW-7, PY+PH-5, 8);

  // another corner keeps signs of former life
  if(!zone1Broken[2]) drawBrokenRoundTableSet(PX+10,PY+11);
  else drawDecorRubble(PX+17, PY+22, 2);

  // bottom-left training nook
  drawBrokenWeaponRack(PX+10, PY+PH-17, false);
  drawTrainingDummy(PX+20, PY+PH-18);

}

function drawMenuTorch(lx,ly){
  ds(S.torch,lx,ly);

  // broad static wall glow
  ctx.globalAlpha=0.20;
  fr(lx-8,ly-8,20,16,C.FR2);
  ctx.globalAlpha=0.14;
  fr(lx-6,ly-6,16,12,C.FR1);
  ctx.globalAlpha=0.10;
  fr(lx-4,ly-3,12,8,C.BN1);

  // fixed flame shape
  fr(lx+1,ly-2,3,1,C.BN1);
  fr(lx,ly-1,5,2,C.FR2);
  fr(lx+1,ly+1,3,2,C.FR1);
  fr(lx+2,ly-3,1,1,C.WH);
  fr(lx+2,ly-2,1,1,C.BN1);
  fr(lx+1,ly,1,1,C.FR2);
  fr(lx+3,ly,1,1,C.FR2);

  // little static ember accents
  ctx.globalAlpha=0.32;
  fr(lx-1,ly+1,1,1,C.FR1);
  fr(lx+5,ly,1,1,C.BN1);
  ctx.globalAlpha=1;
}

function withClipRect(x,y,w,h,fn){
  ctx.save();
  ctx.beginPath();
  ctx.rect(x*SCALE,y*SCALE,w*SCALE,h*SCALE);
  ctx.clip();
  fn();
  ctx.restore();
}

function drawZoneFrontOverlays(){
  if(currentZone===1){
    if(!zone1Broken[0]) withClipRect(PX+2,PY+22,6,11,()=>drawBrokenBookshelf(PX+2, PY+22, 0));
    if(!zone1Broken[1]) withClipRect(PX+PW-8,PY+20,6,11,()=>drawBrokenBookshelf(PX+PW-8, PY+20, 1));
    return;
  }
  if(currentZone===2){
    const shelfClips=[
      [GW/2-14,PY+12,6,12,0],[GW/2-6,PY+12,6,12,1],[GW/2+2,PY+12,6,12,2],[GW/2+10,PY+12,6,12,3],
      [PX+6,PY+12,6,12,7],[PX+14,PY+12,6,12,8],[PX+PW-20,PY+12,6,12,9],[PX+PW-12,PY+12,6,12,10],
    ];
    for(const [sx,sy,sw,sh,idx] of shelfClips){
      if(!zone2Broken[idx]) withClipRect(sx,sy,sw,sh,()=>drawBrokenBookshelf(sx, PY+7, sx<GW/2?0:1));
    }
    withClipRect(GW/2-14,PY+30,29,24,()=>drawZone2Tree());
    return;
  }
  if(currentZone===3){
    if(!zone3Broken[0]) withClipRect(PX+2,PY+22,6,11,()=>drawBrokenBookshelf(PX+2, PY+22, 0));
    if(!zone3Broken[1]) withClipRect(PX+PW-8,PY+20,6,11,()=>drawBrokenBookshelf(PX+PW-8, PY+20, 1));
    if(!zone3Broken[2]) withClipRect(GW/2-8,PY+35,16,7,()=>drawBrokenRoundTableSet(GW/2-4, PY+35));
    withClipRect(PX+8,PY+PH-28,28,22,()=>drawZone3BrokenTreeCluster());
    return;
  }
  if(currentZone===ZONE_SECRET2){
    const cx=GW/2, cy=PY+43;
    if(!masterSwordOwned) withClipRect(cx-7, cy-15, 14, 18, ()=>drawSecret2SwordOverlay(cx, cy));
  }
}


// BoneCrawler safe split module
// Purpose: Main render dispatch and active play-state renderer/HUD drawing.
// Source: app.js lines 6296-6756
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Main render dispatch ──────────────────────────────────────
function render(){
  syncMenuCredit();
  syncTouchPauseBtn();
  syncTouchActionBtns();
  if(gState==='title'){rTitle();return;}
  if(gState==='intro'){rIntro();return;}
  if(gState==='intro_fade'){rIntro();
    ctx.globalAlpha=1-(introFadeT/Math.max(1,introFadeMax));
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,GW*SCALE,GH*SCALE);
    ctx.globalAlpha=1;
    return;}
  if(gState==='startup_scene'){
    drawDungeon();
    rPlay();
    const fadeAlpha=Math.max(0, Math.min(1, startupSceneFadeT/Math.max(1,startupSceneFadeMax)));
    if(fadeAlpha>0){
      ctx.globalAlpha=fadeAlpha;
      ctx.fillStyle='#000';
      ctx.fillRect(0,0,GW*SCALE,GH*SCALE);
      ctx.globalAlpha=1;
    }
    return;
  }
  if(gState==='scoreboard'){rScoreboard();return;}
  if(gState==='retry_confirm'){rRetryConfirm();return;}
  if(gState==='leave_zone_confirm'){drawDungeon(); rPlay(); rLeaveZoneConfirm(); return;}
  if(gState==='secret2_sword_confirm'){drawDungeon(); rPlay(); rSecret2SwordConfirm(); return;}
  drawDungeon();
  rPlay();
  if(gState==='gameover') rOver();
  else if(gState==='upgrade') rUpgrade();
  else if(gState==='paused') rPaused();
  else if(gState==='dialog') rDialog();
  else if(gState==='zone_transition') rZoneTransition();
}

// ── Play render ───────────────────────────────────────────────
function rPlay(){
  const p=player;

  // HUD bar
  fr(0,0,GW,PY-2,C.W3);
  fr(0,PY-3,GW,1,C.WH);
  fr(0,PY-2,GW,1,C.W2);
  drawTorch(PX+6,PY-8);
  drawTorch(PX+PW-9,PY-8);

  // Zone doors / room markers on the HUD bar
  if(currentZone===1 || currentZone===3){
    dsScale(S.hudDoor, GW/2-6, 2, 1.3);

    const eyePulse=0.22+0.14*Math.sin(frame*0.16);
    const eyeCol=currentZone===3 ? C.MG2 : C.RD;
    ctx.globalAlpha=eyePulse;
    fr(GW/2-2,0,1,1,eyeCol);
    fr(GW/2+1,0,1,1,eyeCol);
    fr(GW/2-3,1,2,1,eyeCol);
    fr(GW/2+1,1,2,1,eyeCol);
    ctx.globalAlpha=1;

    dsScale(S.hangSkull, GW/2-4, -1, 0.75);
    if(currentZone===1) drawZone1DoorDecor();
    else {
      drawChainColumn(GW/2-18,2,5);
      drawChainColumn(GW/2+18,2,5);
      drawSpiderWeb(PX+14,PY+10);
      drawSpiderWeb(PX+PW-15,PY+10);
    }
  }

  // HP hearts (reveals 4th/5th heart slots once earned by healing)
  const numHearts=Math.max(3, Math.min(5, p.visibleHearts||3));
  for(let i=0;i<numHearts;i++){
    const rem=Math.max(0,Math.min(2,p.hp-i*2));
    ds(rem>=2?S.heartFull:rem===1?S.heartHalf:S.heartEmpty, 3+i*9, 2);
  }


  // Tiny translucent inventory for run items
  const inventoryIcons=[];
  if(masterSwordOwned) inventoryIcons.push({spr:S.upSword, scale:0.68, alpha:0.92, passive:true});
  if(potionCount>0) inventoryIcons.push({spr:S.potionIcon, scale:0.74, alpha:0.92, count:potionCount});
  if(playerHasAnyKey(p)) inventoryIcons.push({spr:S.key, scale:0.74, alpha:0.92, count:1});
  const invX=3, invY=11, slotW=7, gap=1;
  const hasInventory=inventoryIcons.length>0;
  const invW=hasInventory ? inventoryIcons.length*(slotW+gap)-gap+4 : 0;
  if(hasInventory){
    ctx.save();
    ctx.globalAlpha=0.22;
    fr(invX-1,invY-1,invW,9,'#ced9df');
    ctx.globalAlpha=0.38;
    fr(invX,invY,invW-2,7,'#0c0f12');
    inventoryIcons.forEach((icon,idx)=>{
      const sx=invX+1+idx*(slotW+gap);
      ctx.globalAlpha=0.10;
      fr(sx-1,invY+1,slotW,5,'#d8e4ea');
      ctx.globalAlpha=icon.alpha;
      dsScale(icon.spr,sx,invY+1,icon.scale);
      if(icon.count){
        pt(String(icon.count), (sx+5)*SCALE, (invY+2)*SCALE, 4, C.BN1, 'center', C.DK);
      }
    });
    ctx.restore();
  }

  // Skill icons — moved beside the item tray underneath the health bar
  const skillIcons=[];
  if(p.shield){
    skillIcons.push({
      spr:S.shieldIcon,
      edge:C.SH2,
      pulse:0.50+0.18*Math.sin(frame*0.10),
      alpha:0.80
    });
  }
  skillIcons.push({
    spr:p.shadowStep ? S.shadowStepIcon : S.stepIcon,
    edge:p.shadowStep ? C.MG2 : C.SI2,
    pulse:dodgeCooldownT>0 ? 0.26 : (0.44+0.12*Math.sin(frame*0.12)),
    alpha:dodgeCooldownT>0 ? 0.44 : 0.72,
    cd:dodgeCooldownT>0 ? Math.max(1, Math.ceil(dodgeCooldownT/60)) : 0
  });
  if(whirlwindUnlocked){
    skillIcons.push({
      spr:S.whirlwindIcon,
      edge:C.SH2,
      pulse:whirlwindCooldownT>0 ? 0.28 : (0.48+0.12*Math.sin(frame*0.12)),
      alpha:whirlwindCooldownT>0 ? 0.42 : 0.68,
      cd:whirlwindCooldownT>0 ? Math.max(1, Math.ceil(whirlwindCooldownT/60)) : 0
    });
  }
  if(skillIcons.length){
    const skillX=(hasInventory ? (invX+invW+3) : 3);
    const skillY=11;
    const skillSlotW=7;
    const skillGap=1;
    skillIcons.forEach((icon,idx)=>{
      const iconX=skillX+idx*(skillSlotW+skillGap);
      const iconY=skillY;
      ctx.save();
      ctx.globalAlpha=icon.pulse;
      fr(iconX-1,iconY-1,9,9,icon.edge);
      ctx.globalAlpha=0.55;
      fr(iconX,iconY,7,7,C.DK);
      ctx.globalAlpha=icon.alpha;
      ds(icon.spr, iconX, iconY);
      ctx.restore();
      if(icon.cd){
        pt(String(icon.cd), (iconX+3)*SCALE, (iconY+8)*SCALE, 4, C.BN1, 'center', C.DK);
      }
    });
  }

  // Score + kill count aligned in two clean HUD rows, slightly larger for readability
  const hudLabelX=(GW-29)*SCALE;
  const hudValueX=(GW-4)*SCALE;
  ptHeavy('Score:',hudLabelX,3*SCALE,5,C.BN1,'left',C.DK);
  ptHeavy(String(score),hudValueX,3*SCALE,5,C.BN1,'right',C.DK);
  ptHeavy('Kills:',hudLabelX,10*SCALE,5,C.BN1,'left',C.DK);
  ptHeavy(String(killCount),hudValueX,10*SCALE,5,C.BN1,'right',C.DK);
  if(newGamePlus) pt('NG+',78*SCALE,4*SCALE,5,C.SH,'left',C.W3);
  if(devGodMode) pt('GOD',3*SCALE,(GH-4)*SCALE,5,C.MG2,'left',C.W3);
  if(dragonBoss && !bossDefeated){
    const bw=46, bh=4, bx=((GW-bw)/2)|0, by=10;
    ctx.save();
    ctx.globalAlpha=0.66;
    fr(bx-1,by-1,bw+2,bh+2,C.DK);
    fr(bx,by,bw,bh,C.W3);
    const fill=Math.max(0, Math.round((dragonBoss.hp/dragonBoss.maxHp)*bw));
    fr(bx,by,fill,bh,dragonBoss.phase===2?C.FR1:C.BN1);
    ctx.restore();

    pt('DRAGON', GW*SCALE/2, 15, 5, C.WH, 'center', C.DK);
    if(dragonBoss.phase===2){
      pt('PHASE 2', GW*SCALE/2, 21, 4, C.BN1, 'center', C.DK);
    }
    if(dragonBoss.howlT>0) pt('HOWL', GW*SCALE/2, 15, 5, C.MG2, 'center', C.DK);
  } else if(shadowBoss && !shadowBossDefeated){
    const bw=46, bh=4, bx=((GW-bw)/2)|0, by=10;
    ctx.save();
    ctx.globalAlpha=0.66;
    fr(bx-1,by-1,bw+2,bh+2,C.DK);
    fr(bx,by,bw,bh,C.W3);
    const fill=Math.max(0, Math.round((shadowBoss.hp/shadowBoss.maxHp)*bw));
    fr(bx,by,fill,bh,shadowBoss.phase===2?C.FR1:C.MG2);
    ctx.restore();

    pt('CRAWLER', GW*SCALE/2, 15, 5, C.WH, 'center', C.DK);
    if(shadowBoss.phase===2){
      pt('PHASE 2', GW*SCALE/2, 21, 4, C.FR1, 'center', C.DK);
    }
    if(shadowBoss.screechStartupT>0 || shadowBoss.screechT>0) pt('SCREECH', GW*SCALE/2, 15, 5, C.FR1, 'center', C.DK);
    else if(shadowBoss.howlT>0) pt('HOWL', GW*SCALE/2, 15, 5, C.FR1, 'center', C.DK);
  } else if(currentZone===2 && bossDefeated){
    pt('DRAGON SLAIN', GW*SCALE/2, 8, 5, C.FR1, 'center', C.DK);
  } else if(currentZone===3 && shadowBossDefeated){
    pt('CORRUPTION SILENCED', GW*SCALE/2, 8, 5, C.MG2, 'center', C.DK);
  }
  if(hasAnyKeyDrop()){
    ctx.globalAlpha=0.28+0.12*Math.sin(frame*0.14);
    fr(GW-18,2,7,7,C.FR1);
    ctx.globalAlpha=1;
  }
  ctx.textAlign='left';

  // ── Chest on floor ──
  if(chest){
    const glow=0.22+0.18*Math.sin(frame*0.19);
    ctx.globalAlpha=glow;
    fr(chest.x-2,chest.y-2,chest.w+4,chest.h+4,C.FR1);
    ctx.globalAlpha=1;
    ds(S.chest,chest.x,chest.y);
    // glint pixel
    if(Math.floor(frame/8)%3===0){
      ctx.globalAlpha=0.9;
      fr(chest.x+3,chest.y-1,1,1,C.BN1);
      ctx.globalAlpha=1;
    }
  }

  // Heart drops
  for(const h of heartDrops){
    const bob=Math.sin(frame*0.12 + (h.bobSeed||0))*0.75;
    const alpha=getGroundItemAlpha(h);
    const sprite=h.kind==='half' ? S.halfHeartDrop : S.heartDrop;
    ctx.globalAlpha=(0.22+0.14*Math.sin(frame*0.18))*alpha;
    fr(h.x-1,h.y-1,h.w+2,h.h+2,C.HP2);
    ctx.globalAlpha=alpha;
    ds(sprite,h.x,Math.round(h.y+bob));
    ctx.globalAlpha=1;
  }
  for(const d of potionDrops){
    const bob=Math.sin(frame*0.11 + (d.bobSeed||0))*0.6;
    const alpha=getGroundItemAlpha(d);
    ctx.globalAlpha=(0.18+0.10*Math.sin(frame*0.14))*alpha;
    fr(d.x-1,d.y-1,d.w+2,d.h+2,C.HP1);
    ctx.globalAlpha=alpha;
    ds(S.potionIcon,d.x,Math.round(d.y+bob));
    ctx.globalAlpha=1;
  }

  // Key drop
  if(hasAnyKeyDrop()){
    const bob=Math.floor(frame/14)%2;
    for(const drop of getKeyDropList()){
      const col=drop.kind==='secret1' ? C.MG2 : (drop.kind==='zone1Door' ? C.FR1 : C.BN1);
      ctx.globalAlpha=0.18+0.12*Math.sin(frame*0.16);
      fr(drop.x-1,drop.y-1,drop.w+2,drop.h+2,col);
      ctx.globalAlpha=1;
      ds(S.key,drop.x,drop.y+bob);
    }
  }

  // Particles
  for(const pt of parts){
    ctx.globalAlpha=pt.life/pt.max;
    ctx.fillStyle=pt.col;
    ctx.fillRect(Math.round(pt.x)*SCALE,Math.round(pt.y)*SCALE,SCALE,SCALE);
  }
  ctx.globalAlpha=1;

  // Fireballs (Wizard Skeleton projectiles)
  for(const fb of fireballs){
    const pulse=0.7+0.3*Math.sin(frame*0.4);
    ctx.globalAlpha=pulse*0.95;
    fr(Math.round(fb.x)-1,Math.round(fb.y)-1,5,5,C.FB);
    ctx.globalAlpha=pulse;
    fr(Math.round(fb.x),Math.round(fb.y),3,3,C.FB2);
    ctx.globalAlpha=1;
  }

  for(const flame of dragonFlames){
    const alpha=(flame.ttl/flame.maxTtl)*(0.72+0.28*Math.sin(frame*0.45));
    ctx.globalAlpha=Math.max(0.1,alpha*0.8);
    fr(flame.x,flame.y,flame.w,flame.h,C.FB);
    ctx.globalAlpha=Math.max(0.1,alpha);
    fr(flame.x+1,flame.y+1,Math.max(1,flame.w-2),Math.max(1,flame.h-2),C.FB2);
    ctx.globalAlpha=1;
  }
  if(dragonSwipe){
    const alpha=(dragonSwipe.ttl/dragonSwipe.maxTtl)*(0.6+0.4*Math.sin(frame*0.6));
    ctx.globalAlpha=Math.max(0.12,alpha*0.6);
    fr(dragonSwipe.x,dragonSwipe.y,dragonSwipe.w,dragonSwipe.h,C.WH);
    ctx.globalAlpha=Math.max(0.12,alpha);
    fr(dragonSwipe.x+1,dragonSwipe.y+1,Math.max(1,dragonSwipe.w-2),Math.max(1,dragonSwipe.h-2),C.BN1);
    ctx.globalAlpha=1;
  }

  // Shield shockwaves
  for(const sw of shockwaves){
    const t=sw.life/sw.maxLife;
    ctx.globalAlpha=Math.max(0.15, t*0.6);
    ctx.strokeStyle=C.SH;
    ctx.lineWidth=SCALE;
    ctx.beginPath();
    ctx.arc(sw.x*SCALE, sw.y*SCALE, sw.r*SCALE, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha=Math.max(0.08, t*0.35);
    ctx.strokeStyle=C.SI1;
    ctx.beginPath();
    ctx.arc(sw.x*SCALE, sw.y*SCALE, Math.max(0, sw.r-2)*SCALE, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha=1;
  }

  // Float texts (e.g. +5 for giant kill)
  ctx.textBaseline='top'; ctx.textAlign='center';
  for(const ft of floatTexts){
    ctx.globalAlpha=ft.life/ft.max;
    pt(ft.text,Math.round(ft.x)*SCALE,Math.round(ft.y)*SCALE,7,ft.col,'center',C.DK);
  }
  ctx.globalAlpha=1; ctx.textAlign='left';

  // ── Enemies ──
  for(const e of enemies){
    const rx=Math.round(e.x), ry=Math.round(e.y);
    const spr=getSkeletonSprite(e);
    const flip=e.dir==='right';

    if(e.giant){
      if(currentZone===3){
        ctx.globalAlpha=0.12+0.06*Math.sin(frame*0.12 + rx*0.1);
        fr(rx-3,ry-3,e.w+6,e.h+6,C.FR1);
        ctx.globalAlpha=1;
      }
      // Red hit flash behind sprite
      if(e.hurtT>0){
        ctx.globalAlpha=0.55;
        fr(rx,ry,e.w,e.h,C.RD);
        ctx.globalAlpha=1;
      }
      // Giant at 2× (each sprite pixel = 2 logical px)
      const bob=Math.floor(e.walkF/10)%2 *2;
      ds2(spr,rx,ry+bob,flip);
      drawEnemyBrokenSword(e,rx,ry,bob,flip);
      // HP pips above head
      for(let h=0;h<3;h++){
        fr(rx+h*5+1,ry-4,4,2,h<e.hp?C.GR:C.W3);
      }
    } else {
      if(currentZone===3 && !e.wizard){
        ctx.globalAlpha=0.10+0.05*Math.sin(frame*0.16 + rx*0.1);
        fr(rx-2,ry-2,e.w+4,e.h+4,C.FR1);
        ctx.globalAlpha=1;
      }
      if(e.hurtT>0){
        ctx.globalAlpha=0.5;
        fr(rx,ry,e.w,e.h,C.RD);
        ctx.globalAlpha=1;
      }
      // Wizard aura glow
      if(e.wizard){
        const glowA=0.25+0.15*Math.sin(frame*0.18);
        ctx.globalAlpha=glowA;
        fr(rx-2,ry-2,e.w+4,e.h+4,C.MG);
        ctx.globalAlpha=glowA*0.5;
        fr(rx-3,ry-3,e.w+6,e.h+6,C.MG3);
        ctx.globalAlpha=1;
      }
      const bob=Math.floor(e.walkF/10)%2;
      ds(spr,rx,ry+bob,flip);
      drawEnemyBrokenSword(e,rx,ry,bob,flip);
    }
  }
  if(dragonBoss && !bossDefeated) drawDragonBoss(dragonBoss);
  if(shadowBoss && !shadowBossDefeated) drawShadowBoss(shadowBoss);

  // ── Player ──
  const flash=p.hurtT>0&&Math.floor(p.hurtT/4)%2===1;
  if(!flash){
    const moving=isKeyDown('ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyS','KeyW','KeyD');
    const wb=moving?Math.floor(p.walkF/8)%2:0;
    const flip=p.dir==='left';
    const spr=p.dir==='up'?S.plrU:p.dir==='down'?S.plrD:S.plrR;

    // Shield visual (drawn before sprite so it appears around it)
    if(currentZone===3){
      const glow=0.14+0.06*Math.sin(frame*0.18);
      ctx.globalAlpha=glow;
      fr(p.x-4,p.y-4,p.w+8,p.h+8,p.shadowStep?C.MG2:C.SH);
      ctx.globalAlpha=1;
    }
    if((p.dodgeInvulnT||0)>0){
      const pulse=0.40+0.25*Math.sin(frame*0.35);
      frBorder(p.x-2,p.y-2,p.w+4,p.h+4,C.MG2,pulse);
      frBorder(p.x-3,p.y-3,p.w+6,p.h+6,C.SH,pulse*0.45);
    } else if(p.shield){
      const pulse=0.5+0.3*Math.sin(frame*0.28);
      frBorder(p.x-2,p.y-2,p.w+4,p.h+4,C.SH,pulse);
      frBorder(p.x-3,p.y-3,p.w+6,p.h+6,C.SH2,pulse*0.4);
    } else if(p.shieldBreakT>0){
      // Expanding / fading shatter border
      const t=p.shieldBreakT/24;
      const exp=(1-t)*5;
      frBorder(p.x-2-exp,p.y-2-exp,p.w+4+exp*2,p.h+4+exp*2,C.SI1,t*0.7);
      frBorder(p.x-3-exp,p.y-3-exp,p.w+6+exp*2,p.h+6+exp*2,C.SH,t*0.3);
    }

    ds(spr,Math.round(p.x),Math.round(p.y)+wb,flip);

    if(currentZone===ZONE_SECRET1 && isSecret1WaterZone({x:p.x,y:p.y,w:p.w,h:p.h})){
      ctx.globalAlpha=0.32+0.08*Math.sin(frame*0.10);
      fr(p.x-1,p.y+5,p.w+2,3,'#bfefff');
      ctx.globalAlpha=0.20+0.06*Math.sin(frame*0.13+0.7);
      fr(p.x,p.y+6,p.w,2,'#76c8e8');
      ctx.globalAlpha=1;
    }

    // Sword sweep flash
    if(p.atkT>0){
      const box=atkBox(p,p.swordReach);
      const a=p.atkT/18;
      ctx.globalAlpha=a*0.72; fr(box.x,box.y,box.w,box.h,C.SI1);
      ctx.globalAlpha=a*0.38; fr(box.x+1,box.y+1,box.w-2,box.h-2,C.BN1);
      if(masterSwordOwned){
        const glow=0.22+0.18*Math.sin(frame*0.26);
        ctx.globalAlpha=glow;
        fr(box.x-2,box.y-2,box.w+4,box.h+4,C.SH);
        ctx.globalAlpha=glow*0.7;
        fr(box.x-3,box.y-3,box.w+6,box.h+6,'#d8f6ff');
      }
      ctx.globalAlpha=1;
    }
    if(whirlwindChargeT>=WHIRLWIND_HOLD_FRAMES){
      const holdBox=atkBox(p, p.swordReach+2);
      const pulse=0.25+0.18*Math.sin(frame*0.30);
      ctx.globalAlpha=pulse;
      fr(holdBox.x-1,holdBox.y-1,holdBox.w+2,holdBox.h+2,C.SH);
      ctx.globalAlpha=1;
    }
    if(whirlwindSlashT>0){
      const cx=p.x+p.w/2, cy=p.y+p.h/2;
      const rr=10+(16-whirlwindSlashT)*1.8;
      ctx.globalAlpha=0.24+0.18*Math.sin(frame*0.30);
      fr(cx-rr,cy-1,rr*2,2,C.SH);
      fr(cx-1,cy-rr,2,rr*2,C.SH);
      ctx.globalAlpha=0.18;
      fr(cx-rr+2,cy-rr+2,rr*2-4,rr*2-4,'#d8f6ff');
      ctx.globalAlpha=1;
    }
  }

  if(gState==='playing'){
    const interactTarget=getCurrentInteractionTarget();
    if(interactTarget) drawInteractPrompt(interactTarget.promptX, interactTarget.promptY);
  }

  if(currentZone===1 && secret1UnlockAlertT>0){
    const pulse=0.55+0.45*Math.sin(frame*0.18);
    ctx.globalAlpha=0.20*pulse;
    fr(19,93,82,14,C.MG2);
    ctx.globalAlpha=1;
    ptHeavy('SECRET ZONE 1',GW*SCALE/2,95*SCALE,6,C.BN1,'center',C.DK);
    ptHeavy('UNLOCKED!  (CLICK!)',GW*SCALE/2,103*SCALE,4,C.WH,'center',C.DK);
  }

  drawZoneFrontOverlays();
}


// BoneCrawler safe split module
// Purpose: Upgrade menu, title screen, intro, scoreboard, dialogs, pause, game over, confirmation overlays.
// Source: app.js lines 6757-7615
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Upgrade Menu ─────────────────────────────────────────────
function rUpgrade(){
  // Dark overlay
  ctx.fillStyle='rgba(6,4,2,0.93)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  // Title
  pt('YOU FOUND A CHEST!',GW*SCALE/2,10*SCALE,6,C.FR1,'center',C.DK);
  pt('CHOOSE YOUR UPGRADE',GW*SCALE/2,22*SCALE,6,C.BN1,'center',C.DK);

  // Three option buttons
  if(!currentUpgradeBtns.length) rollUpgradeChoices();
  for(const btn of currentUpgradeBtns) _upBtn(btn);

  // Hint
  pt('PRESS  1  2  3',GW*SCALE/2,100*SCALE,5,C.BN1,'center',C.DK);
  pt('OR CLICK',GW*SCALE/2,106*SCALE,5,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function _upBtn(btn){
  drawPanelFrame(btn.x,btn.y,btn.w,btn.h,{edge:btn.border,fill:'rgba(3,3,4,0.94)',inner:'rgba(28,20,10,0.26)',glow:btn.border,ornate:false});

  if(btn.icon==='shieldIcon') ds(S.shieldIcon,btn.x+4,btn.y+4);
  else if(btn.icon==='upSword') ds(S.upSword,btn.x+2,btn.y+3);
  else if(btn.icon==='upSpeed') ds(S.upSpeed,btn.x+2,btn.y+3);
  else if(btn.icon==='shadowStepIcon') ds(S.shadowStepIcon,btn.x+3,btn.y+4);
  else if(btn.icon==='pointsIcon'){
    pt('+', (btn.x+6)*SCALE, (btn.y+1)*SCALE, 10, C.FR1, 'center', C.DK);
    pt('PTS', (btn.x+6)*SCALE, (btn.y+10)*SCALE, 6, C.BN1, 'center', C.DK);
  }
  else ds(S[btn.icon],btn.x+4,btn.y+4);

  const textCx=(btn.x+btn.w/2+5)*SCALE;
  pt(btn.num+'  '+btn.label,textCx,(btn.y+3)*SCALE,(btn.labelFs||7),btn.text,'center',C.DK);
  pt(btn.sub,textCx,(btn.y+10)*SCALE,(btn.subFs||5),C.BN1,'center',C.DK);
  if(btn.type==='heart' && isHealthFull()){
    pt('MAX', (btn.x+btn.w-8)*SCALE, (btn.y+2)*SCALE, 4, C.FR1, 'center', C.DK);
  }
}

function drawPanelFrame(x,y,w,h,opt={}){
  const edge=opt.edge||C.WH;
  const fill=opt.fill||C.BG;
  const inner=opt.inner||'rgba(255,255,255,0.02)';
  const glow=opt.glow||edge;
  const ornate=opt.ornate!==false;
  ctx.save();
  ctx.globalAlpha=0.22;
  ctx.fillStyle=glow;
  ctx.fillRect((x-1)*SCALE,(y-1)*SCALE,(w+2)*SCALE,(h+2)*SCALE);
  ctx.globalAlpha=1;
  fr(x,y,w,h,C.DK);
  ctx.fillStyle=fill;
  ctx.fillRect((x+1)*SCALE,(y+1)*SCALE,(w-2)*SCALE,(h-2)*SCALE);
  ctx.fillStyle=inner;
  ctx.fillRect((x+2)*SCALE,(y+2)*SCALE,(w-4)*SCALE,(h-4)*SCALE);
  ctx.fillStyle=edge;
  ctx.fillRect(x*SCALE,y*SCALE,w*SCALE,SCALE);
  ctx.fillRect(x*SCALE,(y+h-1)*SCALE,w*SCALE,SCALE);
  ctx.fillRect(x*SCALE,y*SCALE,SCALE,h*SCALE);
  ctx.fillRect((x+w-1)*SCALE,y*SCALE,SCALE,h*SCALE);
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.fillRect((x+1)*SCALE,(y+1)*SCALE,(w-2)*SCALE,SCALE);
  if(ornate){
    const cs=[[x+1,y+1],[x+w-3,y+1],[x+1,y+h-3],[x+w-3,y+h-3]];
    for(const [cx,cy] of cs){
      fr(cx,cy,2,1,edge); fr(cx,cy+1,1,1,edge);
    }
  }
  ctx.restore();
}

function drawMenuChains(){
  ctx.globalAlpha=0.35;
  for(let i=0;i<7;i++){ fr(51+(i%2),i*2,1,1,C.SI2); fr(67-(i%2),i*2,1,1,C.SI2); }
  ctx.globalAlpha=1;
}

function drawWallSkull(lx,ly,small=false){
  const spr=small?S.mskull:S.skull;
  ds(spr,lx,ly);
  ctx.save();
  ctx.globalAlpha=0.9;
  if(!small){
    // chipped crown / cheek / jaw
    fr(lx+1,ly+1,1,1,C.DK);
    fr(lx+9,ly+2,1,1,C.DK);
    fr(lx+3,ly+4,1,1,C.DK);
    fr(lx+8,ly+7,1,1,C.DK);
    fr(lx+6,ly+9,1,1,C.DK);
    // cracks
    fr(lx+4,ly+2,1,1,C.BN3);
    fr(lx+5,ly+3,1,1,C.DK);
    fr(lx+5,ly+4,1,1,C.BN3);
    fr(lx+7,ly+5,1,1,C.DK);
    fr(lx+8,ly+6,1,1,C.BN3);
    // missing tooth / jaw chip
    fr(lx+4,ly+9,1,2,C.DK);
  }else{
    fr(lx+1,ly,1,1,C.DK);
    fr(lx+2,ly+2,1,1,C.BN3);
    fr(lx+3,ly+3,1,1,C.DK);
  }
  ctx.restore();
}

// ── Title screen ──────────────────────────────────────────────
const MENU_HERO_IMAGE_SRC = 'data:image/png;base64,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zOpQpWLy5eevP/+CRyaM2B8RGToHDxwRGasKAaBFRLScMUFo6toDPywYpSUXuYxPALG4OObwvsoSEDGut27If7fk79devjPItwLweMJxtbxlyhOMeWBUZarbcZP2nf/78gPG9tVQ8ubbP/fr2kWbEKRgIIgYMpdLAVps3r5+y9rXwihi3BLRnyuW79tjqDWEJAiU0mbDqrc2bN7juDT2oO6r1rzCxHgnrj0ea21pO+7Y4U+/9cOZk47v2Tt++pkH9RvSqzp+Zq9efXPZ9ocfrN617Z105alD9z0hXZJYvHh67a6PSktO+eTjH4y2l1x5UuCHflCQmBQO27Wz8buvpgzff4pfyD107wfX3HS8Xwhbsx06Mjfe9JxANve/3xet+mfPrnprcVRvmWkP19Xm0PK+3TgRkSbOweFQXVKBYL/+4hf6HwoMwN561UTT3h6ZJuaWOLzDDURIFtBZt65+wklHffzO+357vnffss0dEq3w/e3XXT3p8afeQmDnX3RU785VFgR3Urv2ND/1xMtFo9qEw08+4ujOyhpOiBwQEAAMAhpORIIxxjghohAcERHQahMyEgpOuHisCfnLr3+RyeaLBclCOFVhv6qykluvO05KWVZW9cxzXzY0NHGODNHoqKyidOZr1wtmPTedSpZpaywoLhkHtIhe3FE6JAvtbb/26Hp8XXPmje++OnrUoc35jk9++w0AEO2CTTB84OCUFNJ1k7HYbz8sjUKHCJlkiBBPSCZkEOSsoV11uYokKLKKMSAI8s2hKnNdp7KsbNmyl8JIIXg6StV0PwxRjRtzyI23HeP7fll5HJj5bfli2DuCwuOHj4viXJFl1hIYa3WozSnnjerRpTyVTjU1NXCH19baF56f9dyszUiMUBMwRmzq1AtVkJNOjCB+9TXTrbUH9d3XKoFedsCAmmRCHnLU8GTC4VI8+PAFU+58btSAMULbVDzMhco6GEVBp+ryP397QSn/3XcXITOABBa0YIAqVAEYqNvz+fotu4DLNatqybCd1RkiGj56UM8eSSaTj057P5Zwjjt59MB9On3+6SL52cp7H7js0amvlZS5rW1tD0+d1Nz0bkXVhW3t4cCBN373w6Otma/T6bMAgrdf/0ZKecmlp8diseamtlkf/vnYw+cTaSJBEMx45oNZ79360N1na1Ny/4OvMM5A09q129p3t2mTDzUY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';
const menuHeroImg = new Image();
let menuHeroReady = false;
menuHeroImg.onload = ()=>{ menuHeroReady = true; };
menuHeroImg.src = MENU_HERO_IMAGE_SRC;

function drawMenuBgFallback(){
  // dark dungeon chamber
  fr(0,0,GW,GH,C.DK);
  fr(0,0,GW,74,'#121822');
  fr(0,74,GW,GH-74,'#23170f');

  // rear stone wall
  for(let y=4;y<72;y+=8){
    fr(0,y,GW,1,C.WH);
    const off=((y/8)%2)*5;
    for(let x=off;x<GW;x+=12){
      fr(x,y+1,7,4,C.W1);
      fr(x+7,y+1,5,4,C.W2);
      fr(x,y+5,12,2,C.W3);
      if(((x+y)>>2)%4===0) fr(x+2,y+2,2,1,C.WH);
      if(((x+y)>>2)%5===0) fr(x+8,y+3,2,1,C.DK);
      if(((x+y)>>1)%7===0) fr(x+5,y+5,1,1,C.DK);
    }
  }

  // side pillars / chamber framing
  fr(6,6,8,68,'#1d242d'); fr(7,7,6,66,'#2a3542'); fr(9,8,2,64,C.W3);
  fr(GW-14,6,8,68,'#1d242d'); fr(GW-13,7,6,66,'#2a3542'); fr(GW-11,8,2,64,C.W3);

  // arched alcove in the center back wall
  fr(32,12,56,50,'#1b211f');
  fr(34,14,52,46,'#31403f');
  fr(38,18,44,38,'#4b3022');
  fr(40,20,40,36,C.TB);
  for(let x=42;x<79;x+=6) fr(x,20,1,36,C.TB2);
  fr(36,12,48,3,C.W1); fr(39,15,42,2,C.WH);

  // iron gate inside the alcove
  fr(52,30,16,12,C.DK);
  fr(53,31,14,10,C.W2);
  for(let gx=55;gx<=65;gx+=4) fr(gx,31,1,10,C.SI2);
  for(let gy=33;gy<=39;gy+=2) fr(53,gy,14,1,C.SI2);

  // cracks on the wall
  const cracks=[
    [[18,22],[19,25],[17,28],[18,31],[16,35]],
    [[95,18],[94,21],[96,24],[95,27],[97,30]],
    [[59,10],[58,14],[60,17],[59,20],[61,23]],
    [[26,40],[28,43],[27,46],[29,49]],
    [[86,41],[85,44],[87,48],[86,51]]
  ];
  for(const crack of cracks){
    for(let i=0;i<crack.length;i++){
      fr(crack[i][0],crack[i][1],1,1,C.DK);
      if(i%2===0) fr(crack[i][0]+1,crack[i][1],1,1,C.W3);
    }
  }

  // upper trim
  fr(0,0,GW,2,C.WH);
  fr(0,2,GW,1,C.W3);

  // floor boards / stone
  fr(0,72,GW,GH-72,C.FL);
  for(let y=72;y<GH;y+=7) fr(0,y,GW,1,C.FL2);
  for(let x=0;x<GW;x+=16) fr(x,82,1,GH-82,C.TB2);

  // long runner / ritual carpet leading to center
  fr(48,60,24,8,'#3c1414');
  fr(46,68,28,10,'#521b1a');
  fr(44,78,32,18,'#671f1d');
  fr(42,96,36,26,'#7a2521');
  fr(45,123,30,12,'#521b1a');
  for(let y=61;y<133;y+=8) fr(50,y,20,1,'#9e8562');
  fr(55,72,10,1,'#2c0a0a'); fr(54,95,12,1,'#2c0a0a'); fr(56,116,8,1,'#2c0a0a');

  // circular platform behind the title banner
  fr(38,54,44,4,C.W3);
  fr(36,58,48,4,C.W2);
  fr(34,62,52,4,C.W1);
  fr(37,66,46,2,'#5d6a69');

  // central standing figure, player-like silhouette
  const px=58, py=46;
  fr(px+2,py,4,1,C.BN1);
  fr(px+1,py+1,6,2,C.SI2);
  fr(px+2,py+3,4,2,C.SI3);
  fr(px+3,py+5,2,6,C.WH);
  fr(px+2,py+6,1,4,C.SI2); fr(px+5,py+6,1,4,C.SI2);
  fr(px+1,py+7,1,4,C.SI2); fr(px+6,py+7,1,4,C.SI2);
  fr(px+2,py+11,1,5,C.SI2); fr(px+5,py+11,1,5,C.SI2);
  fr(px+1,py+16,2,1,C.BN3); fr(px+5,py+16,2,1,C.BN3);
  fr(px+7,py+6,1,7,C.SI2); fr(px+8,py+6,1,7,C.SI1);
  fr(px+6,py+6,3,1,C.BN1);
  ctx.globalAlpha=0.16+0.05*Math.sin(frame*0.08);
  fr(px-3,py-2,14,20,C.WH);
  ctx.globalAlpha=1;

  // surrounding skeletons
  const skels=[[26,52,false],[34,86,true],[88,54,true],[82,88,false],[16,100,false],[100,100,true]];
  for(const [sx,sy,flip] of skels){
    ctx.globalAlpha=0.88;
    dsMap(S.mskull,sx,sy,{1:C.BN1,2:C.BN2,3:C.WH,4:C.DK,5:C.SI3},flip);
    fr(sx+3,sy+6,2,5,C.BN2);
    fr(sx+1,sy+8,1,4,C.BN2); fr(sx+6,sy+8,1,4,C.BN2);
    fr(sx+2,sy+11,1,4,C.BN3); fr(sx+5,sy+11,1,4,C.BN3);
    fr(sx+1,sy+15,2,1,C.BN3); fr(sx+5,sy+15,2,1,C.BN3);
  }
  ctx.globalAlpha=1;

  // debris / bones near the floor edges
  const piles=[[12,127],[22,122],[96,125],[106,120],[18,111],[101,109]];
  ctx.globalAlpha=0.42;
  for(const [bx,by] of piles){
    fr(bx,by,3,1,C.BN2); fr(bx+1,by+1,1,1,C.BN3); fr(bx+3,by+1,1,1,C.BN2);
  }
  ctx.globalAlpha=1;

  // torches
  drawMenuTorch(6,34);
  drawMenuTorch(GW-10,34);

  // chains and skull ornaments
  drawMenuChains();
  drawWallSkull(GW/2-6,7);
  drawWallSkull(8,22);
  drawWallSkull(GW-20,22);
}

function drawMenuBg(){
  if(!menuHeroReady || !menuHeroImg.complete || !menuHeroImg.naturalWidth){
    drawMenuBgFallback();
    return;
  }

  const w = GW*SCALE;
  const h = GH*SCALE;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = C.DK;
  ctx.fillRect(0,0,w,h);

  const heroZoom = 1.10;
  const drawW = Math.ceil(w * heroZoom);
  const drawH = Math.ceil(h * heroZoom);
  const drawX = Math.floor((w - drawW) / 2) - 1 * SCALE;
  const drawY = Math.floor((h - drawH) / 2) - 3 * SCALE;

  ctx.drawImage(menuHeroImg,0,0,menuHeroImg.naturalWidth || menuHeroImg.width,menuHeroImg.naturalHeight || menuHeroImg.height,drawX,drawY,drawW,drawH);

  // overall dark pass so the framed title and buttons stay readable
  ctx.fillStyle = 'rgba(0,0,0,0.24)';
  ctx.fillRect(0,0,w,h);

  // subtle top shade for the title banner area
  const topShade = ctx.createLinearGradient(0,0,0,84*SCALE);
  topShade.addColorStop(0,'rgba(0,0,0,0.26)');
  topShade.addColorStop(0.55,'rgba(0,0,0,0.08)');
  topShade.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = topShade;
  ctx.fillRect(0,0,w,84*SCALE);

  // stronger bottom gradient so the button stack remains clear
  const bottomShade = ctx.createLinearGradient(0,72*SCALE,0,h);
  bottomShade.addColorStop(0,'rgba(0,0,0,0)');
  bottomShade.addColorStop(0.45,'rgba(0,0,0,0.18)');
  bottomShade.addColorStop(0.75,'rgba(0,0,0,0.42)');
  bottomShade.addColorStop(1,'rgba(0,0,0,0.74)');
  ctx.fillStyle = bottomShade;
  ctx.fillRect(0,0,w,h);

  // side vignette to hold the eye in the center hero composition
  const sideShade = ctx.createLinearGradient(0,0,w,0);
  sideShade.addColorStop(0,'rgba(0,0,0,0.36)');
  sideShade.addColorStop(0.12,'rgba(0,0,0,0.10)');
  sideShade.addColorStop(0.50,'rgba(0,0,0,0)');
  sideShade.addColorStop(0.88,'rgba(0,0,0,0.10)');
  sideShade.addColorStop(1,'rgba(0,0,0,0.36)');
  ctx.fillStyle = sideShade;
  ctx.fillRect(0,0,w,h);

  // faint panel support behind the button column
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = C.DK;
  ctx.fillRect(21*SCALE,73*SCALE,78*SCALE,39*SCALE);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function rMenuBtn(btn,label){
  drawPanelFrame(btn.x,btn.y,btn.w,btn.h,{edge:C.BN2,fill:'rgba(6,6,7,0.92)',inner:'rgba(28,44,52,0.18)',glow:C.WH});

  // Cool inner glow strip
  ctx.globalAlpha=0.16;
  ctx.fillStyle=C.WH;
  ctx.fillRect((btn.x+2)*SCALE,(btn.y+2)*SCALE,(btn.w-4)*SCALE,2*SCALE);
  ctx.globalAlpha=1;

  // Corner rune pixel marks (2×2 bright dots)
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.55;
  ctx.fillRect((btn.x+2)*SCALE,(btn.y+2)*SCALE,2*SCALE,2*SCALE);
  ctx.fillRect((btn.x+btn.w-4)*SCALE,(btn.y+2)*SCALE,2*SCALE,2*SCALE);
  ctx.fillRect((btn.x+2)*SCALE,(btn.y+btn.h-4)*SCALE,2*SCALE,2*SCALE);
  ctx.fillRect((btn.x+btn.w-4)*SCALE,(btn.y+btn.h-4)*SCALE,2*SCALE,2*SCALE);
  ctx.globalAlpha=1;

  // Horizontal hairline divider near bottom of button
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.22;
  ctx.fillRect((btn.x+3)*SCALE,(btn.y+btn.h-3)*SCALE,(btn.w-6)*SCALE,SCALE);
  ctx.globalAlpha=1;

  let fs=10;
  if(label==='SCOREBOARD') fs=7;
  else if(label.startsWith('NAME:')) fs=8;
  else if(label.length>=10) fs=8;

  const cx=(btn.x+btn.w/2)*SCALE;
  const cy=(btn.y+btn.h/2)*SCALE;
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font=fs+'px "Press Start 2P",monospace';
  ctx.fillStyle=C.DK;
  ctx.fillText(label,cx+1,cy);
  ctx.fillText(label,cx-1,cy);
  ctx.fillText(label,cx,cy+1);
  ctx.fillText(label,cx,cy-1);
  ctx.fillStyle=C.BN1;
  ctx.fillText(label,cx,cy);
  ctx.textBaseline='top';
}

function rTitle(){
  drawMenuBg();

  // Horizontal rule lines inside title panel
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.38;
  ctx.fillRect(16*SCALE,42*SCALE,88*SCALE,SCALE); // top outer line
  ctx.fillRect(16*SCALE,60*SCALE,88*SCALE,SCALE); // bottom outer line
  ctx.fillRect(19*SCALE,43*SCALE,84*SCALE,SCALE); // top inner line
  ctx.fillRect(19*SCALE,59*SCALE,84*SCALE,SCALE); // bottom inner line
  ctx.globalAlpha=1;


  ptHeavy('BONECRAWLER',GW*SCALE/2,50*SCALE,10,C.SI1,'center',C.DK);

  rMenuBtn(MENU_PLAY,'PLAY');
  rMenuBtn(MENU_SCORE,'SCOREBOARD');
  rMenuBtn(NAME_BTN,'NAME: '+(currentPlayerName||'PLAYER').toUpperCase().slice(0,12));

  // Bottom panel chain decorations (pixel chain links)
  ctx.globalAlpha=0.28;
  for(let cx2=18;cx2<=100;cx2+=6){ fr(cx2,65,1,1,C.BN2); fr(cx2+1,65,1,1,C.SI2); }
  ctx.globalAlpha=1;

  ctx.textAlign='left';
}

function rIntro(){
  drawMenuBg();
  drawPanelFrame(2,10,116,80,{edge:C.BN2,fill:'rgba(5,5,7,0.92)',inner:'rgba(36,52,58,0.14)',glow:C.WH});

  const nm=((currentPlayerName||'PLAYER').toUpperCase().slice(0,14))||'PLAYER';
  let lines = [];
  let size = 6;
  let startY = 24;
  let stepY = 7;

  if(introPage===0){
    lines = [
      'THE KING SOUGHT THE AID',
      'OF THE BONECRAWLERS.',
      'YOU DO NOT LOOK FOR',
      'A WELCOME HERE, '+nm+'.'
    ];
    size = 7;
    startY = 24;
    stepY = 11;
  } else if(introPage===1){
    lines = [
      'SOLIDARITY IS BORN OF',
      'NECESSITY, AND THE HIERARCHY',
      'IS WRITTEN IN THE SPEED',
      'OF A VANISHING BREATH.',
      'IN THIS LAND, PEACE IS',
      'ACHIEVED THROUGH PASSIVE',
      'ACKNOWLEDGEMENT — A SILENCE',
      'THAT MUST NEVER BE BROKEN.'
    ];
    size = 6;
    startY = 16;
    stepY = 9;
  } else {
    lines = [
      'YOU ARE SENT TO EXTINGUISH THE',
      'UNQUIET THAT RATTLES IN THE DARK,',
      'SILENCING THE REVENANT OF AN',
      'ANCIENT EVIL THAT FEEDS ON THE',
      'DISTRESS OF THE KINGDOM.',
      'A GRIM TASK TO JOIN THEIR',
      'SKELETAL RANKS.',
      '"MOVE WITH HASTE; TO BE SEEN',
      'IS TO FAIL THE SILENCE; TO',
      'BE KNOWN IS TO CEASE TO EXIST."'
    ];
    size = 6;
    startY = 14;
    stepY = 7;
  }

  for(let i=0;i<lines.length;i++){
    pt(lines[i],GW*SCALE/2,(startY + i*stepY)*SCALE,size,C.BN1,'center',C.DK);
  }

  pt('ENTER / CLICK',GW*SCALE/2,84*SCALE,5,C.WH,'center',C.DK);
  ctx.textAlign='left';
}

function rScoreboard(){
  drawMenuBg();

  drawPanelFrame(6,22,108,82,{edge:C.BN2,fill:'rgba(4,4,5,0.95)',inner:'rgba(33,45,40,0.12)',glow:C.WH});

  ctx.globalAlpha=0.26;
  ctx.fillStyle=C.BN2;
  ctx.fillRect(12*SCALE,27*SCALE,96*SCALE,11*SCALE);
  ctx.fillRect(12*SCALE,40*SCALE,96*SCALE,8*SCALE);
  ctx.globalAlpha=1;

  // Panel horizontal rules
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.40;
  ctx.fillRect(9*SCALE,25*SCALE,102*SCALE,SCALE);  // below top border
  ctx.fillRect(9*SCALE,39*SCALE,102*SCALE,SCALE);  // between title and player
  ctx.fillRect(9*SCALE,49*SCALE,102*SCALE,SCALE);  // below player / above rows
  ctx.globalAlpha=0.18;
  ctx.fillRect(11*SCALE,26*SCALE,98*SCALE,SCALE);
  ctx.fillRect(11*SCALE,50*SCALE,98*SCALE,SCALE);
  ctx.globalAlpha=1;

  // Skull markers flanking SCOREBOARD title
  ds(S.mskull,8,30);
  ds(S.mskull,108,30);

  // Side tick marks on panel
  for(let ty=32;ty<=96;ty+=8){
    fr(6,ty,2,1,C.BN2); fr(112,ty,2,1,C.BN2);
  }

  ptHeavy('SCOREBOARD',GW*SCALE/2,28*SCALE,9,C.BN1,'center',C.DK);
  ptHeavy('PLAYER: '+(currentPlayerName||'PLAYER').toUpperCase(),GW*SCALE/2,41*SCALE,6,C.SI1,'center',C.DK);

  const rows=scorePageEntries();

  if(!rows.length){
    ptHeavy('NO RUNS SAVED YET',GW*SCALE/2,58*SCALE,7,C.BN1,'center',C.DK);
  } else {
    ctx.textAlign='left';
    for(let i=0;i<rows.length;i++){
      const row=rows[i];
      const y=50+i*9;
      const nm=(row.name||'Player').toUpperCase().slice(0,8);
      const line=nm+' - '+row.kills+' - '+formatTime(row.timeMs)+(row.finished?' *':'');
      ptHeavy(line,11*SCALE,y*SCALE,6,(row.finished?C.FR1:(i===0?C.BN1:C.SI1)),'left',C.DK);
      ctx.fillStyle=C.W2;
      ctx.fillRect(10*SCALE,(y+7)*SCALE,100*SCALE,SCALE);
    }
  }

  const totalPages=totalScorePages();
  ptHeavy('PAGE '+(scoreboardPage+1)+' / '+totalPages,GW*SCALE/2,89*SCALE,6,C.BN1,'center',C.DK);

  ptHeavy('NAME - KILLS - GAMETIME *',GW*SCALE/2,96*SCALE,5,C.BN1,'center',C.DK);

  rMenuBtn({x:8,y:105,w:24,h:9},'BACK');
  rMenuBtn({x:88,y:105,w:11,h:9},'<');
  rMenuBtn({x:102,y:105,w:11,h:9},'>');

  ctx.textAlign='left';
  if(currentZone===ZONE_SECRET2 && canInteractSecret2Npc() && gState==='playing'){
    const pulse=0.55+0.45*Math.sin(frame*0.22);
    ctx.globalAlpha=0.25*pulse;
    fr(SECRET2_NPC_RECT.x-2,SECRET2_NPC_RECT.y-8,SECRET2_NPC_RECT.w+4,5,C.MG);
    ctx.globalAlpha=1;
    pt('ENTER',(SECRET2_NPC_RECT.x+SECRET2_NPC_RECT.w/2)*SCALE,(SECRET2_NPC_RECT.y-9)*SCALE,4,C.BN1,'center',C.DK);
    ctx.textAlign='left';
  }
}

function rZoneTransition(){
  const info=zoneTransitionInfo || buildZoneTransitionInfo(pendingZoneTransition||2);
  const messageLines=info.messageLines||[];
  const hideStats=!!info.hideStats;
  const statText=hideStats ? '????' : null;

  ctx.fillStyle='rgba(6,5,3,0.90)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(13,15,94,96,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:C.FR1});

  ptHeavy(info.title || 'ZONE CLEAR',GW*SCALE/2,18*SCALE,8,C.FR1,'center',C.DK);

  if(messageLines.length===1){
    ptHeavy(messageLines[0],GW*SCALE/2,30*SCALE,7,C.WH,'center',C.DK);
  }else if(messageLines.length>=2){
    ptHeavy(messageLines[0],GW*SCALE/2,29*SCALE,6,C.WH,'center',C.DK);
    ptHeavy(messageLines[1],GW*SCALE/2,37*SCALE,6,C.WH,'center',C.DK);
  }

  ptHeavy('KILLS:',20*SCALE,46*SCALE,7,C.BN1,'left',C.DK);
  ptHeavy('SKELETONS',24*SCALE,56*SCALE,6,C.SI1,'left',C.DK);
  ptHeavy(hideStats ? statText : String(normalKillCount),93*SCALE,56*SCALE,7,C.SI1,'right',C.DK);
  ptHeavy('GIANTS',24*SCALE,66*SCALE,6,C.FR1,'left',C.DK);
  ptHeavy(hideStats ? statText : String(giantKillCount),93*SCALE,66*SCALE,7,C.FR1,'right',C.DK);
  ptHeavy('WIZARDS',24*SCALE,76*SCALE,6,C.MG2,'left',C.DK);
  ptHeavy(hideStats ? statText : String(wizardKillCount),93*SCALE,76*SCALE,7,C.MG2,'right',C.DK);

  ptHeavy('SCORE:',20*SCALE,86*SCALE,7,C.BN1,'left',C.DK);
  ptHeavy(hideStats ? statText : String(score),93*SCALE,86*SCALE,7,C.BN1,'right',C.DK);
  ptHeavy('RANK:',20*SCALE,94*SCALE,7,C.BN1,'left',C.DK);
  ptHeavy(hideStats ? statText : String(info.rank||'?'),93*SCALE,94*SCALE,7,C.BN1,'right',C.DK);

  rMenuBtn(ZONE_TRANSITION_CONTINUE_BTN,'CONTINUE');
  pt('PRESS CONTINUE . . .',GW*SCALE/2,110*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rDialog(){
  const rawPage=dialogPages[dialogPageIndex];
  const isObjectPage=!!rawPage && !Array.isArray(rawPage) && Array.isArray(rawPage.lines);
  const page=isObjectPage ? rawPage.lines : (Array.isArray(rawPage) ? rawPage : ['....']);
  const whisperCol='#5f7f9d';
  const isSwordDialog=dialogMode==='sword';
  const isRewardDialog=dialogMode==='reward';
  const isOpeningDialog=dialogMode==='opening';
  const rawSpeaker=isObjectPage ? String(rawPage.speaker||'NODE').trim() : '';
  const pageSpeaker=rawSpeaker.toUpperCase();
  const openingPlayerSpeaker=((currentPlayerName||'Player').trim()||'Player');
  const resolvedSpeaker=pageSpeaker==='PLAYER' ? openingPlayerSpeaker : (rawSpeaker||pageSpeaker||'NODE');
  const panelTitle=isRewardDialog
    ? (dialogTitle||'REWARD')
    : (isOpeningDialog
      ? resolvedSpeaker
      : (isObjectPage ? resolvedSpeaker : (dialogTitle||(isRewardDialog?'REWARD':'WOUNDED STRANGER'))));

  ctx.fillStyle='rgba(8,6,3,0.72)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  const longestLine=Math.max(panelTitle?panelTitle.length:0, ...page.map(line=>String(line||'').length));
  const lineH=isSwordDialog ? 8 : (isRewardDialog ? 8 : 7);
  const charW=isSwordDialog ? 5.2 : (isRewardDialog ? 5.0 : 4.8);
  const minW=isRewardDialog ? 62 : 58;
  const maxW=isRewardDialog ? 112 : 108;
  const panelW=Math.max(minW, Math.min(maxW, Math.round(longestLine*charW)+24));
  const panelH=Math.max(isRewardDialog ? 44 : 38, 24 + page.length*lineH + 10);
  const panelX=Math.round((GW-panelW)/2);
  const panelY=isRewardDialog ? Math.round((GH-panelH)/2)-4 : Math.max(42, GH-panelH-10);
  const panelGlow=isRewardDialog ? C.SH : C.MG;
  const fill=isRewardDialog ? 'rgba(4,4,5,0.96)' : 'rgba(4,4,5,0.92)';
  const inner=isRewardDialog ? 'rgba(40,52,62,0.14)' : 'rgba(53,39,28,0.10)';

  drawPanelFrame(panelX,panelY,panelW,panelH,{edge:C.BN2,fill,inner,glow:panelGlow});
  ptHeavy(panelTitle,GW*SCALE/2,(panelY+7)*SCALE,7,C.BN1,'center',C.DK);
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.35;
  ctx.fillRect((panelX+4)*SCALE,(panelY+14)*SCALE,(panelW-8)*SCALE,SCALE);
  ctx.globalAlpha=1;

  for(let i=0;i<page.length;i++){
    const line=page[i];
    const y=(panelY+19+i*lineH)*SCALE;

    if(line==='......' || line==='.....' || line==='....'){
      pt(line,GW*SCALE/2,y,6,whisperCol,'center',C.DK);
      continue;
    }

    if(line==="There's a name engraved on his sword"){
      ctx.save();
      ctx.textBaseline='top';
      ctx.textAlign='center';
      ctx.font='italic 5px "Press Start 2P",monospace';
      ctx.fillStyle=C.DK;
      ctx.fillText(line,GW*SCALE/2+1,y);
      ctx.fillText(line,GW*SCALE/2-1,y);
      ctx.fillText(line,GW*SCALE/2,y+1);
      ctx.fillText(line,GW*SCALE/2,y-1);
      ctx.fillStyle=whisperCol;
      ctx.fillText(line,GW*SCALE/2,y);
      ctx.restore();
      continue;
    }

    if(line==='ImmaGundam'){
      const bob=Math.sin(frame*0.10)*1.2;
      const pulse=0.72 + 0.28*Math.sin(frame*0.16);
      const baseX=GW*SCALE/2;
      const baseY=y+bob;
      const r1=Math.round(155 + 100*Math.sin(frame*0.08));
      const g1=Math.round(120 + 110*Math.sin(frame*0.08 + 2.09));
      const b1=Math.round(155 + 100*Math.sin(frame*0.08 + 4.18));
      const r2=Math.round(110 + 80*Math.sin(frame*0.11 + 0.8));
      const g2=Math.round(110 + 80*Math.sin(frame*0.11 + 2.9));
      const b2=Math.round(180 + 70*Math.sin(frame*0.11 + 4.5));
      const rgbA=`rgb(${r1},${g1},${b1})`;
      const rgbB=`rgb(${r2},${g2},${b2})`;
      ctx.save();
      ctx.globalAlpha=0.24 + 0.14*pulse;
      ptHeavy(line,baseX,baseY,6,rgbA,'center',C.DK);
      ctx.globalAlpha=0.16 + 0.10*pulse;
      ptHeavy(line,baseX,baseY,6,rgbB,'center',C.DK);
      ctx.globalAlpha=1;
      ptHeavy(line,baseX,baseY,6,'rgb(235,225,190)','center',rgbA);
      ctx.restore();
      for(let j=0;j<4;j++){
        const ang=frame*0.045 + j*1.57;
        const px=Math.round((GW/2 + Math.cos(ang)*10 + Math.sin(frame*0.03+j)*2)*SCALE);
        const py=Math.round((y/SCALE - 2 + Math.sin(ang*1.25)*3)*SCALE);
        ctx.globalAlpha=0.42 + 0.28*Math.sin(frame*0.14+j);
        ctx.fillStyle='rgb(150,220,255)';
        ctx.fillRect(px,py,2,2);
        ctx.fillStyle='rgb(225,245,255)';
        ctx.fillRect(px+1,py-1,1,1);
      }
      for(let j=0;j<3;j++){
        const ang=frame*0.06 + j*2.2 + 1.1;
        const px=Math.round((GW/2 + Math.cos(ang)*6 - Math.sin(frame*0.025+j)*5)*SCALE);
        const py=Math.round((y/SCALE + 3 + Math.sin(ang*1.8)*4)*SCALE);
        ctx.globalAlpha=0.30 + 0.22*Math.sin(frame*0.18 + j*1.6);
        ctx.fillStyle='rgb(105,185,245)';
        ctx.fillRect(px,py,1,3);
        ctx.fillStyle='rgb(185,235,255)';
        ctx.fillRect(px-1,py+1,3,1);
      }
      ctx.globalAlpha=1;
      continue;
    }

    if(isSwordDialog){
      ctx.save();
      ctx.textBaseline='top';
      ctx.textAlign='center';
      ctx.font='italic 7px "Press Start 2P",monospace';
      ctx.fillStyle=C.DK;
      ctx.fillText(line,GW*SCALE/2+1,y);
      ctx.fillText(line,GW*SCALE/2-1,y);
      ctx.fillText(line,GW*SCALE/2,y+1);
      ctx.fillText(line,GW*SCALE/2,y-1);
      ctx.fillStyle=whisperCol;
      ctx.fillText(line,GW*SCALE/2,y);
      ctx.restore();
      continue;
    }

    if(isRewardDialog){
      const isNameLine=(line==='MASTER SWORD' || line==='WHIRLWIND SLASH' || line==='SHADOW STEP' || line==='HEALTH POTION');
      const fs=isNameLine ? 8 : 6;
      const col=isNameLine ? C.SH : C.BN1;
      ptHeavy(line,GW*SCALE/2,y,fs,col,'center',C.DK);
      continue;
    }

    pt(line,GW*SCALE/2,y,6,C.BN1,'center',C.DK);
  }

  pt('ENTER',GW*SCALE/2,(panelY+panelH-6)*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rPaused(){
  ctx.fillStyle='rgba(8,6,3,0.68)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  const p=player||{};
  const items=[];
  if(masterSwordOwned) items.push({spr:S.upSword,val:'x1',col:C.SH});
  if(potionCount>0) items.push({spr:S.potionIcon,val:'x'+potionCount,col:C.HP1});
  if(playerHasAnyKey(p)) items.push({spr:S.key,val:'x1',col:C.BN1});
  if(p.shield) items.push({spr:S.shieldIcon,val:'x'+Math.max(1,p.shieldLevel||1),col:C.SH});
  if(!items.length) items.push({spr:S.mskull,val:'x0',col:C.BN1});

  const skills=[
    {spr:S.upSword,val:'x'+Math.max(1,(p.swordLevel||0)+1),col:C.BN1},
    {spr:p.shadowStep?S.shadowStepIcon:S.stepIcon,val:'x'+Math.max(1,p.shadowStep?(p.stepLevel||1):1),col:p.shadowStep?C.MG2:C.SI1},
    {spr:S.upSpeed,val:'x'+Math.max(1,(p.speedLevel||0)+1),col:C.FR1},
  ];
  if(whirlwindUnlocked) skills.push({spr:S.whirlwindIcon,val:'x1',col:C.SH});

  const drawInlineStatRow=(entries,startY,textSize)=>{
    const slotW=22;
    const iconOffsetY=1;
    const textOffsetX=10;
    const textOffsetY=2;
    const startX=Math.round((GW - entries.length*slotW)/2);
    entries.forEach((entry,idx)=>{
      const x=startX + idx*slotW;
      ds(entry.spr,x,startY+iconOffsetY);
      ptHeavy(entry.val,(x+textOffsetX)*SCALE,(startY+textOffsetY)*SCALE,textSize,entry.col,'left',C.DK);
    });
  };

  drawPanelFrame(12,12,96,97,{edge:C.BN2,fill:'rgba(4,4,5,0.90)',inner:'rgba(53,39,28,0.10)',glow:C.FR1});
  ctx.globalAlpha=0.18+0.10*Math.sin(frame*0.07);
  ctx.fillStyle=C.FR1;
  ctx.fillRect(55*SCALE,12*SCALE,10*SCALE,6*SCALE);
  ctx.globalAlpha=1;
  ds(S.mskull,57,13);

  ptHeavy('PAUSED',GW*SCALE/2,24*SCALE,12,C.FR1,'center',C.DK);
  if(devGodMode) pt('DEV GOD ON',GW*SCALE/2,35*SCALE,6,C.MG2,'center',C.W3);
  ptHeavy('ENTER / ESC = RESUME',GW*SCALE/2,43*SCALE,6,C.BN1,'center',C.DK);

  ctx.fillStyle=C.BN2; ctx.globalAlpha=0.45;
  ctx.fillRect(18*SCALE,46*SCALE,84*SCALE,SCALE);
  ctx.fillRect(18*SCALE,69*SCALE,84*SCALE,SCALE);
  ctx.globalAlpha=1;
  fr(12,46,3,1,C.BN2); fr(105,46,3,1,C.BN2);
  fr(12,69,3,1,C.BN2); fr(105,69,3,1,C.BN2);

  ptHeavy('ITEMS',GW*SCALE/2,51*SCALE,6,C.BN1,'center',C.DK);
  drawInlineStatRow(items,57,5);

  ptHeavy('SKILLS',GW*SCALE/2,73*SCALE,6,C.BN1,'center',C.DK);
  drawInlineStatRow(skills,79,5);

  rMenuBtn(GAMEOVER_RETRY,'RETRY');
  rMenuBtn(GAMEOVER_MENU,'MENU');
  pt('R = RETRY   M = MENU',GW*SCALE/2,107*SCALE,5,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

// ── Game-over overlay ─────────────────────────────────────────
function rOver(){
  ctx.fillStyle='rgba(8,6,3,0.88)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(21,27,78,75,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:C.FR1});

  const skX=GW/2-6, skY=14;

  // Animated double glow ring around skull
  const t=Date.now();
  const rp=0.38+0.12*Math.sin(t/300);
  const rp2=0.15+0.08*Math.sin(t/220+1);
  ctx.globalAlpha=rp2;
  ctx.fillStyle=C.FR1;
  ctx.fillRect((skX-3)*SCALE,(skY-2)*SCALE,18*SCALE,16*SCALE);
  ctx.globalAlpha=rp;
  fr(skX+3,skY+2,6,3,C.GR);
  ctx.globalAlpha=1;
  ds(S.skull,skX,skY);

  // Horizontal separator below GAME OVER
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.42;
  ctx.fillRect(25*SCALE,52*SCALE,70*SCALE,SCALE);
  ctx.globalAlpha=0.16;
  ctx.fillRect(27*SCALE,53*SCALE,66*SCALE,SCALE);
  ctx.globalAlpha=1;
  // Tick marks on separator
  fr(21,52,3,1,C.BN2); fr(96,52,3,1,C.BN2);

  // Second separator above buttons
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.35;
  ctx.fillRect(25*SCALE,94*SCALE,70*SCALE,SCALE);
  ctx.globalAlpha=1;
  fr(21,94,3,1,C.BN2); fr(96,94,3,1,C.BN2);

  // Side tick marks on panel
  for(let ty=36;ty<=90;ty+=9){
    fr(21,ty,2,1,C.BN2); fr(98,ty,2,1,C.BN2);
  }

  pt('GAME OVER',GW*SCALE/2,40*SCALE,10,C.BN1,'center',C.DK);

  pt('SCORE: '+score,GW*SCALE/2,63*SCALE,7,C.BN1,'center',C.DK);
  pt('KILLS: '+killCount,GW*SCALE/2,74*SCALE,7,C.SI1,'center',C.DK);
  pt('TIME: '+formatTime(runTimeMs),GW*SCALE/2,85*SCALE,7,C.SI1,'center',C.DK);

  rMenuBtn(GAMEOVER_RETRY,'RETRY');
  rMenuBtn(GAMEOVER_MENU,'MENU');

  const retryHint=(retryCheckpoint && retryCheckpoint.zone>=2)
    ? 'ZONE RETRY / MENU'
    : 'RESTART / MENU';
  pt(retryHint,GW*SCALE/2,103*SCALE,5,C.BN1,'center',C.DK);
  pt('ENTER/R = RETRY   ESC/M = MENU',GW*SCALE/2,109*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rSecret2SwordConfirm(){
  ctx.fillStyle='rgba(8,6,3,0.78)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(16,26,88,74,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:C.SH});
  ptHeavy('MASTER SWORD',GW*SCALE/2,34*SCALE,8,C.SH,'center',C.DK);
  ptHeavy('THE BLADE HUMS WITH',GW*SCALE/2,52*SCALE,5,C.BN1,'center',C.DK);
  ptHeavy('ANCIENT POWER . . .',GW*SCALE/2,62*SCALE,5,C.BN1,'center',C.DK);
  ptHeavy('PULL THE SWORD?',GW*SCALE/2,74*SCALE,6,C.WH,'center',C.DK);

  rMenuBtn(SECRET2_SWORD_CONFIRM_YES_BTN,'YES');
  rMenuBtn(SECRET2_SWORD_CONFIRM_NO_BTN,'NO');
  pt('ENTER / Y = YES',GW*SCALE/2,108*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rLeaveZoneConfirm(){
  const target=leaveZonePromptData||{};
  const goingSecret=target.nextZone===ZONE_SECRET1 || target.nextZone===ZONE_SECRET2;
  const heading=target.nextZone===-1 ? 'LEAVE ZONE?' : (goingSecret ? 'ENTER SECRET ZONE?' : 'LEAVE ZONE?');
  ctx.fillStyle='rgba(8,6,3,0.82)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(18,28,84,70,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:goingSecret?C.MG2:C.SH});
  ptHeavy(heading,GW*SCALE/2,38*SCALE,8,goingSecret?C.MG2:C.SH,'center',C.DK);
  ptHeavy('YES / NO',GW*SCALE/2,66*SCALE,6,C.WH,'center',C.DK);

  rMenuBtn(LEAVE_ZONE_CONFIRM_YES_BTN,'YES');
  rMenuBtn(LEAVE_ZONE_CONFIRM_NO_BTN,'NO');
  pt('ENTER / Y = YES',GW*SCALE/2,108*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rRetryConfirm(){
  ctx.fillStyle='rgba(8,6,3,0.90)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(18,28,84,70,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:C.SH});
  ptHeavy('RETRY',GW*SCALE/2,36*SCALE,10,C.SH,'center',C.DK);

  const zoneName=getRetryZoneLabel(retryCheckpoint ? retryCheckpoint.zone : currentZone);
  if(retryPromptMode==='cost'){
    ptHeavy('SACRIFICE 30% POINTS',GW*SCALE/2,56*SCALE,5,C.BN1,'center',C.DK);
    ptHeavy('TO RESTART '+zoneName.toUpperCase()+'?',GW*SCALE/2,66*SCALE,5,C.BN1,'center',C.DK);
  } else {
    ptHeavy("EHH.. DON'T WORRY",GW*SCALE/2,56*SCALE,5,C.BN1,'center',C.DK);
    ptHeavy('ABOUT IT.',GW*SCALE/2,66*SCALE,5,C.BN1,'center',C.DK);
  }

  rMenuBtn(RETRY_CONFIRM_YES_BTN,'YES');
  rMenuBtn(RETRY_CONFIRM_NO_BTN,'NO');
  pt('ENTER / Y = YES',GW*SCALE/2,108*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}


// BoneCrawler safe split module
// Purpose: Main requestAnimationFrame loop and font-ready startup.
// Source: app.js lines 7616-7619
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Loop ──────────────────────────────────────────────────────
function loop(){ update(); render(); requestAnimationFrame(loop); }
document.fonts.ready.then(()=>{ loop(); }).catch(()=>{ loop(); });



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
