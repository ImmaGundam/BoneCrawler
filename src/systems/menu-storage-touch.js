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

