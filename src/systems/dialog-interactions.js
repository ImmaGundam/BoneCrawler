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
function maybeTriggerScriptedZoneDialog(){
  if(gState!=='playing') return false;
  try{
    if(window.BoneCrawlerProgression && typeof BoneCrawlerProgression.maybeTriggerScriptedDialog === 'function' && BoneCrawlerProgression.maybeTriggerScriptedDialog()) return true;
  }catch(err){}
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

