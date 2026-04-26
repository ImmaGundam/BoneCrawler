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
