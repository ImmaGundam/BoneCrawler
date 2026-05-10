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
    if(shouldShowDevKitTitleButton() && pointInBtn(lx,ly,DEVKIT_TITLE_BTN)){
      openDevKitPrompt();
    }
    else if(pointInBtn(lx,ly,MENU_PLAY)) startGame();
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

