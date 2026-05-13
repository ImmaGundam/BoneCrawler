// menu-storage-touch
// Purpose: Menu button rectangles, zone decor constants, scoreboard/player-name storage, touch/pause UI utility helpers.
// ── Title / scoreboard buttons ───────────────────────────────
const MENU_BTN_W=66, MENU_BTN_H=9;
const MENU_BTN_X=((GW-MENU_BTN_W)/2)|0;
const MENU_PLAY={x:MENU_BTN_X,y:78,w:MENU_BTN_W,h:MENU_BTN_H};
const MENU_SCORE={x:MENU_BTN_X,y:92,w:MENU_BTN_W,h:MENU_BTN_H};
const GAMEOVER_RETRY={x:21,y:94,w:32,h:10};
const GAMEOVER_MENU={x:67,y:94,w:32,h:10};
const NAME_BTN={x:MENU_BTN_X,y:106,w:MENU_BTN_W,h:MENU_BTN_H};
const DEVKIT_TITLE_BTN={x:84,y:8,w:34,h:30};

function shouldShowDevKitTitleButton(){
  // Show on the normal top-level title screen only.
  // Hide when the game is already running inside the dev kit iframe.
  return window.self === window.top;
}

function openDevKitPrompt(){
  const ok = window.confirm('Load the developer kit?\n\nBest viewed in desktop!');
  if(!ok) return false;

  const url = 'dev/devkit_lite.html';
  const opened = window.open(url, '_blank', 'noopener');

  // Fallback for strict popup blockers.
  if(!opened){
    window.location.href = url;
  }

  return true;
}
const __menuSceneGeometry = (window.SceneRuntime && typeof SceneRuntime.getGeometry === 'function')
  ? SceneRuntime.getGeometry()
  : {};
const ZONE1_DOOR_RECT=__menuSceneGeometry.ZONE1_DOOR_RECT || {x:0,y:0,w:0,h:0};
const ZONE1_DECOR_BREAK_RECTS=__menuSceneGeometry.ZONE1_DECOR_BREAK_RECTS || [];
const ZONE1_DECOR_BLOCKERS=__menuSceneGeometry.ZONE1_DECOR_BLOCKERS || [];
const ZONE2_TREE_BLOCKERS=__menuSceneGeometry.ZONE2_TREE_BLOCKERS || [];
const ZONE1_EXTRA_BLOCKERS=__menuSceneGeometry.ZONE1_EXTRA_BLOCKERS || [];
const ZONE2_HOLE_BLOCKERS=__menuSceneGeometry.ZONE2_HOLE_BLOCKERS || [];
const ZONE2_DECOR_BREAK_RECTS=__menuSceneGeometry.ZONE2_DECOR_BREAK_RECTS || [];
const ZONE2_DECOR_BLOCKERS=__menuSceneGeometry.ZONE2_DECOR_BLOCKERS || [];
function syncZone2ObjectGeometry(){
  try{
    if(window.SceneRuntime && typeof SceneRuntime.rebuild === 'function'){
      SceneRuntime.rebuild();
      return true;
    }
  }catch(err){}
  return false;
}
syncZone2ObjectGeometry();
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
  mouseAttackReleaseQueued=false;
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

