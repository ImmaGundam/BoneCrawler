// Player input
// Purpose: Keyboard, mouse, and touch input listeners and input state transitions.

// ── Input ─────────────────────────────────────────────────────
const keys={};
const CANVAS_TOUCH_CLICK_SUPPRESS_MS=450;
const CANVAS_TOUCH_TAP_MAX_PX=14;
const CANVAS_TOUCH_TAP_MAX_MS=260;
const CANVAS_TOUCH_DODGE_SWIPE_MIN_PX=48;
const CANVAS_TOUCH_DODGE_SWIPE_MAX_MS=320;
let lastCanvasDialogTouchTime=0;

function makeInputEvent(code, key, repeat){
  return {
    code: code,
    key: key,
    repeat: !!repeat,
    preventDefault(){},
    stopPropagation(){}
  };
}

function isKeyDown(...codes){
  return codes.some(code=>!!keys[code]);
}

function __runtimeLookup(key, legacy){
  return (window.GameRuntimeApi && window.GameRuntimeApi.lookup(key, legacy)) || (legacy && legacy.length ? window[legacy[0]] : null) || null;
}

function __titleFlow(){
  return __runtimeLookup('titleFlow', ['BoneCrawlerTitleFlow']);
}

function __playerAbilities(){
  return __runtimeLookup('playerAbilities', ['BoneCrawlerPlayerAbilities']);
}

function __runFlow(){
  return __runtimeLookup('runFlow', ['BoneCrawlerRunFlow']);
}

function goToTitleMenu(){
  const runFlow = __runFlow();
  if(runFlow && typeof runFlow.goToTitleState === 'function') runFlow.goToTitleState({clearAllSceneCaches:true, stopAudio:true});
  else if(typeof goToTitleState === 'function') goToTitleState({clearAllSceneCaches:true, stopAudio:true});
  else gState='title';
}

function performRegisteredMove(moveId, payload){
  const abilities=__playerAbilities();
  if(abilities && typeof abilities.performMove==='function'){
    return !!abilities.performMove(moveId, payload||{});
  }
  if(moveId==='dodge' && typeof performDodge==='function') return performDodge();
  if(moveId==='block' && typeof performBlock==='function') return performBlock();
  if(moveId==='interact' && typeof handlePrimaryInteract==='function') return handlePrimaryInteract();
  if(moveId==='attack' && typeof performPlayerAttack==='function') return performPlayerAttack(payload && payload.strength!=null ? payload.strength : 1);
  return false;
}

function applyRegisteredUpgrade(upgradeId, payload){
  if(typeof applyUpgrade==='function') return !!applyUpgrade(upgradeId, payload||{});
  const abilities=__playerAbilities();
  if(abilities && typeof abilities.applyUpgrade==='function'){
    return !!abilities.applyUpgrade(upgradeId, payload||{});
  }
  return false;
}

function setPlayerDirFromVector(dx,dy){
  if(!player) return;
  if(Math.abs(dx)>Math.abs(dy)) player.dir=dx<0 ? 'left' : 'right';
  else player.dir=dy<0 ? 'up' : 'down';
}

function performTouchSwipeDodge(dx,dy,dist,elapsed){
  if(gState!=='playing' || !player || player.dead) return false;
  if(dist<CANVAS_TOUCH_DODGE_SWIPE_MIN_PX || elapsed>CANVAS_TOUCH_DODGE_SWIPE_MAX_MS) return false;
  setPlayerDirFromVector(dx,dy);
  return performRegisteredMove('dodge', {source:'touch-swipe'});
}

function handleInputKeyDown(e){
  const code=e.code;
  const key=e.key;
  const keyLower=typeof key==='string' ? key.toLowerCase() : '';
  keys[code]=true;
  if(['Space','Enter','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyF'].includes(code) && e && typeof e.preventDefault==='function') e.preventDefault();

  if(gState==='dialog'){
    if(code==='Enter' || code==='Space' || code==='KeyE'){
      if(typeof tryAdvanceDialogFromInput === 'function') tryAdvanceDialogFromInput();
      else advanceDialog();
    }
    else if(code==='Escape') skipDialog();
    return;
  }

  if(gState==='paused'){
    if(code==='Enter' || code==='Escape') resumeGame();
    else if(keyLower==='r') openRetryPrompt();
    else if(keyLower==='m' || code==='Backspace'){
      retryTaxPaid=false;
      retryPromptMode='';
      goToTitleMenu();
    }
    return;
  }

  if(gState==='upgrade'){
    if(key==='1' && currentUpgradeBtns[0]) applyRegisteredUpgrade(currentUpgradeBtns[0].type, {button:currentUpgradeBtns[0], source:'keyboard'});
    else if(key==='2' && currentUpgradeBtns[1]) applyRegisteredUpgrade(currentUpgradeBtns[1].type, {button:currentUpgradeBtns[1], source:'keyboard'});
    else if(key==='3' && currentUpgradeBtns[2]) applyRegisteredUpgrade(currentUpgradeBtns[2].type, {button:currentUpgradeBtns[2], source:'keyboard'});
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
    const titleFlow=__titleFlow();
    if(code==='Enter' || code==='Space' || code==='Escape'){ if(titleFlow && typeof titleFlow.beginRunFromIntro === 'function') titleFlow.beginRunFromIntro(); else beginRunFromIntro(); }
    return;
  }

  if(gState==='intro_fade'){
    return;
  }

  if(gState==='startup_scene'){
    return;
  }

  if(gState==='scoreboard'){
    if(code==='Escape' || code==='Backspace'){ goToTitleMenu(); }
    else if(code==='ArrowLeft'){ const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.prevScorePage === 'function') titleFlow.prevScorePage(); else if(scoreboardPage>0) scoreboardPage--; }
    else if(code==='ArrowRight'){ const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.nextScorePage === 'function') titleFlow.nextScorePage(); else if(scoreboardPage<totalScorePages()-1) scoreboardPage++; }
    return;
  }

  if(gState==='playing' && !e.repeat && (code==='ShiftLeft' || code==='ShiftRight')){
    if(performRegisteredMove('dodge', {source:'keyboard'})) return;
  }
  if(gState==='playing' && !e.repeat && code==='KeyF'){
    if(performRegisteredMove('block', {source:'keyboard'})) return;
  }
  if(gState==='playing' && !e.repeat && code==='KeyP'){
    if(useHealthPotion()) return;
  }

  if(gState==='playing' && (code==='Enter' || code==='KeyE')){
    if(performRegisteredMove('interact', {source:'keyboard'})) return;
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
      goToTitleMenu();
    }
    return;
  }
}

function handleInputKeyUp(e){
  keys[e.code]=false;
}

document.addEventListener('keydown', handleInputKeyDown);
document.addEventListener('keyup', handleInputKeyUp);

const touchInputBridge = {
  press(code, key){
    handleInputKeyDown(makeInputEvent(code, key || code, !!keys[code]));
  },
  release(code, key){
    handleInputKeyUp(makeInputEvent(code, key || code, false));
  },
  clear(){
    if(typeof clearGameplayKeys === 'function') clearGameplayKeys();
  }
};
if(window.GameRuntimeApi && typeof window.GameRuntimeApi.register === 'function') window.GameRuntimeApi.register('touchInputBridge', touchInputBridge, { legacy: ['BoneCrawlerTouchInputBridge'] });
else window.BoneCrawlerTouchInputBridge = touchInputBridge;
window.addEventListener('blur', clearGameplayKeys);
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden) clearGameplayKeys();
});
canvas.addEventListener('mousedown',e=>{
  if(e.button!==0) return;
  if(gState!=='playing') return;
  e.preventDefault();
  mouseAttackHeld=true;
  if(whirlwindUnlocked && player && !player.dead && player.atkCD<=0 && player.atkT<=0){
    whirlwindChargeT=Math.max(whirlwindChargeT,1);
  } else {
    mouseAttackQueued=true;
  }
});
window.addEventListener('mouseup',()=>{
  if(mouseAttackHeld && gState==='playing' && whirlwindUnlocked && whirlwindChargeT>0){
    mouseAttackReleaseQueued=true;
  }
  mouseAttackHeld=false;
});

canvas.addEventListener('touchstart',e=>{
  if(gState==='dialog'){
    lastCanvasDialogTouchTime=performance.now();
    if(typeof tryAdvanceDialogFromInput === 'function') tryAdvanceDialogFromInput();
    else advanceDialog();
    e.preventDefault();
    return;
  }
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
  const isTap=dist<CANVAS_TOUCH_TAP_MAX_PX && elapsed<CANVAS_TOUCH_TAP_MAX_MS;
  const dodgeRect={x:GW-41,y:2,w:8,h:8};
  const whirlRect={x:GW-31,y:2,w:8,h:8};
  const potionRect={x:0,y:0,w:55,h:22};

  if(isTap && pointInBtn(lx,ly,dodgeRect)){
    performRegisteredMove('dodge', {source:'touch-ui'});
    touchAttackChargeActive=false;
    touchAttackCancelQueued=true;
  } else if(isTap && whirlwindUnlocked && pointInBtn(lx,ly,whirlRect)){
    performWhirlwindSlash();
    touchAttackChargeActive=false;
    touchAttackCancelQueued=true;
  } else if(potionCount>0 && isTap && pointInBtn(lx,ly,potionRect)){
    useHealthPotion();
    touchAttackChargeActive=false;
    touchAttackCancelQueued=true;
  } else if(performTouchSwipeDodge(dx,dy,dist,elapsed)){
    touchAttackChargeActive=false;
    touchAttackCancelQueued=true;
  } else if(!touchAttackMoved && whirlwindUnlocked && whirlwindChargeT>0){
    touchAttackReleaseQueued=true;
    touchAttackChargeActive=false;
  } else if(isTap){
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
    if(gState==='dialog'){
      if(typeof tryAdvanceDialogFromInput === 'function') tryAdvanceDialogFromInput();
      else advanceDialog();
      return;
    }
    if(gState==='leave_zone_confirm'){ confirmLeaveZone(); return; }
    if(gState==='playing') performRegisteredMove('interact', {source:'touch-button'});
  };
  if(window.PointerEvent) touchInteractBtn.addEventListener('pointerdown', onInteractPress);
  else touchInteractBtn.addEventListener('touchstart', onInteractPress, {passive:false});
}

if(touchDodgeBtn){
  const onDodgePress=e=>{
    e.preventDefault();
    e.stopPropagation();
    if(gState==='playing') performRegisteredMove('block', {source:'touch-button'});
  };
  if(window.PointerEvent) touchDodgeBtn.addEventListener('pointerdown', onDodgePress);
  else touchDodgeBtn.addEventListener('touchstart', onDodgePress, {passive:false});
}

if(touchBlockBtn){
  const onBlockPress=e=>{
    e.preventDefault();
    e.stopPropagation();
    if(gState==='playing') performRegisteredMove('block', {source:'touch-button'});
  };
  if(window.PointerEvent) touchBlockBtn.addEventListener('pointerdown', onBlockPress);
  else touchBlockBtn.addEventListener('touchstart', onBlockPress, {passive:false});
}

// name modal wiring
if(nameModalOk) nameModalOk.addEventListener('click', ()=>{ const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.commitPlayerName === 'function') titleFlow.commitPlayerName(); else commitPlayerName(); });
if(nameModalCancel) nameModalCancel.addEventListener('click', ()=>{ if(nameModalOverlay) nameModalOverlay.classList.add('hidden'); });
if(nameModalOverlay) nameModalOverlay.addEventListener('click', e=>{ if(e.target===nameModalOverlay) nameModalOverlay.classList.add('hidden'); });
if(nameModalInput) nameModalInput.addEventListener('keydown', e=>{
  if(e.key==='Enter'){ e.preventDefault(); const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.commitPlayerName === 'function') titleFlow.commitPlayerName(); else commitPlayerName(); }
  else if(e.key==='Escape'){ e.preventDefault(); nameModalOverlay.classList.add('hidden'); }
});

canvas.addEventListener('click',e=>{
  if(performance.now()-lastCanvasDialogTouchTime<CANVAS_TOUCH_CLICK_SUPPRESS_MS){
    e.preventDefault();
    return;
  }
  const rect=canvas.getBoundingClientRect();
  const scaleX=canvas.width/rect.width;
  const scaleY=canvas.height/rect.height;
  const lx=((e.clientX-rect.left)*scaleX)/SCALE;
  const ly=((e.clientY-rect.top)*scaleY)/SCALE;

  if(gState==='upgrade'){
    for(const btn of currentUpgradeBtns){
      if(pointInBtn(lx,ly,btn)){
        applyRegisteredUpgrade(btn.type, {button:btn, source:'pointer'});
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
      performRegisteredMove('dodge', {source:'pointer'});
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
    if(shouldShowDevKitTitleButton() && pointInBtn(lx,ly,DEVKIT_TITLE_BTN)){
      openDevKitPrompt();
    }
    else if(pointInBtn(lx,ly,MENU_PLAY)){ const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.startGame === 'function') titleFlow.startGame(); else startGame(); }
    else if(pointInBtn(lx,ly,MENU_SCORE)){ const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.openScoreboard === 'function') titleFlow.openScoreboard(); else openScoreboard(); }
    else if(pointInBtn(lx,ly,NAME_BTN)){ const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.promptForPlayerName === 'function') titleFlow.promptForPlayerName(); else promptForPlayerName(); }
    return;
  }

  if(gState==='dialog'){
    if(typeof tryAdvanceDialogFromInput === 'function') tryAdvanceDialogFromInput();
    else advanceDialog();
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
    const titleFlow=__titleFlow();
    if(titleFlow && typeof titleFlow.beginRunFromIntro === 'function') titleFlow.beginRunFromIntro(); else beginRunFromIntro();
    return;
  }

  if(gState==='intro_fade'){
    return;
  }

  if(gState==='startup_scene'){
    return;
  }

  if(gState==='scoreboard'){
    if(pointInBtn(lx,ly,{x:7,y:105,w:24,h:9})){ goToTitleMenu(); }
    else if(pointInBtn(lx,ly,{x:89,y:105,w:10,h:9})){ const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.prevScorePage === 'function') titleFlow.prevScorePage(); else if(scoreboardPage>0) scoreboardPage--; }
    else if(pointInBtn(lx,ly,{x:103,y:105,w:10,h:9})){ const titleFlow=__titleFlow(); if(titleFlow && typeof titleFlow.nextScorePage === 'function') titleFlow.nextScorePage(); else if(scoreboardPage<totalScorePages()-1) scoreboardPage++; }
    return;
  }

  if(gState==='paused'){
    if(pointInBtn(lx,ly,PAUSE_RETRY)) openRetryPrompt();
    else if(pointInBtn(lx,ly,PAUSE_MENU)){
      retryTaxPaid=false;
      retryPromptMode='';
      goToTitleMenu();
    }
    return;
  }

  if(gState==='gameover'){
    if(pointInBtn(lx,ly,GAMEOVER_RETRY)) openRetryPrompt();
    else if(pointInBtn(lx,ly,GAMEOVER_MENU)){
      retryTaxPaid=false;
      retryPromptMode='';
      goToTitleMenu();
    }
  }
});
