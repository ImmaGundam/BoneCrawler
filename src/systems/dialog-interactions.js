// dialog-interactions
// Purpose: Primary interaction handling, scripted zone dialogs, 
// NPC/sword/tree dialogs, dialog advance/skip, player damage entry point.

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

function getDialogEntry(id){
  try{
    if(window.GameContent && typeof GameContent.getDialog === 'function') return GameContent.getDialog(id);
  }catch(err){}
  return null;
}
function maybeTriggerScriptedZoneDialog(){
  if(gState!=='playing') return false;
  try{
    if(window.EventEngine && typeof EventEngine.maybeTriggerScriptedDialog === 'function') return !!EventEngine.maybeTriggerScriptedDialog();
  }catch(err){}
  return false;
}

function startSecret2NpcDialog(){
  if(currentZone!==ZONE_SECRET2) return;
  const dialog = getDialogEntry(secret2NpcMet ? 'npc.woundedStranger.repeat' : 'npc.woundedStranger.initial');
  dialogTitle=(dialog && dialog.title) || 'WOUNDED STRANGER';
  dialogMode=(dialog && dialog.mode) || 'npc';
  dialogPages=(dialog && dialog.pages) ? dialog.pages : [];
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
  const dialog = getDialogEntry('npc.zone3Tree.default');
  dialogTitle=(dialog && dialog.title) || 'DEKU';
  dialogMode=(dialog && dialog.mode) || 'npc';
  dialogPages=(dialog && dialog.pages) ? dialog.pages : [];
  zone3TreeMet=true;
  dialogPageIndex=0;
  clearGameplayKeys();
  gState='dialog';
}


function startSecret1RatDialog(){
  if(currentZone!==ZONE_SECRET1) return;
  const dialogId = secret1RatTalkCount<=0 ? 'npc.rat.initial' : 'npc.rat.repeat';
  const dialog = getDialogEntry(dialogId);
  if(secret1RatTalkCount<=0){
    secret1RatTalkCount=1;
  } else {
    secret1RatTalkCount=2;
    secret1NodeSpoken=true;
  }
  openDialogSequence((dialog && dialog.title) || 'NODE', (dialog && dialog.pages) || [], (dialog && dialog.mode) || 'npc');
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
    if(wasOpening && !(typeof isSecretZone === 'function' && isSecretZone(currentZone))){
      try{ if(window.AudioEvents) AudioEvents.enterZone(currentZone); }catch(err){}
    }
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
  if(wasOpening && !(typeof isSecretZone === 'function' && isSecretZone(currentZone))){
    try{ if(window.AudioEvents) AudioEvents.enterZone(currentZone); }catch(err){}
  }
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
    try{ if(window.AudioEvents) AudioEvents.playerShield(); }catch(err){}
    p.shield=false;
    p.shieldBreakT=24;
    p.hurtT=35;
    shieldBurst(p.x+4,p.y+4);
    triggerShieldShockwave(p.x+4,p.y+4);
    return true;
  }
  p.hp=Math.max(0,p.hp-amount);
  try{ if(window.AudioEvents) AudioEvents.playerHit(); }catch(err){}
  p.hurtT=amount>1?52:40;
  if(p.hp<=0){
    p.dead=true;
    try{ if(window.AudioEvents) AudioEvents.playerDeath(); }catch(err){}
    runTimeMs=performance.now()-runStartMs;
    saveRunIfNeeded();
    setTimeout(()=>{gState='gameover';},1200);
  }
  return true;
}

