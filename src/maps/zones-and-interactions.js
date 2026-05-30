// Purpose: Zone labels/rank info, zone transitions, scene entry, and compatibility wrappers around the registry/runtime path.

function __zoneNumber(zone){
  const value = Number(zone);
  return Number.isFinite(value) ? value : 0;
}
function __zoneBox(x,y,w,h){
  if(window.SceneEngine && typeof SceneEngine.boxFromArgs === 'function') return SceneEngine.boxFromArgs(x,y,w,h);
  return (typeof x === 'object' && x) ? x : {x:x||0,y:y||0,w:w||0,h:h||0};
}
function __zoneScene(zone){
  try{ if(window.SceneEngine && typeof SceneEngine.get === 'function') return SceneEngine.get(__zoneNumber(zone)); }catch(err){}
  return null;
}
function __sceneGeometry(){
  try{ if(window.SceneRuntime && typeof SceneRuntime.getGeometry === 'function') return SceneRuntime.getGeometry() || {}; }catch(err){}
  return {};
}
function __sceneRect(objectId, field){
  try{ if(window.SceneRuntime && typeof SceneRuntime.getRect === 'function') return SceneRuntime.getRect(objectId, field); }catch(err){}
  return null;
}
function __sceneFlow(){
  return (window.BoneCrawlerSceneFlow && typeof BoneCrawlerSceneFlow === 'object') ? BoneCrawlerSceneFlow : null;
}
function __runFlow(){
  if(window.BoneCrawlerRunFlow && typeof BoneCrawlerRunFlow === 'object') return BoneCrawlerRunFlow;
  return null;
}
function __playerNearRect(rect, pad=4){
  if(!player || !rect || typeof ov !== 'function') return false;
  const p=player;
  const zone={x:rect.x-pad,y:rect.y-pad,w:rect.w+pad*2,h:rect.h+pad*2};
  return ov({x:p.x,y:p.y,w:p.w,h:p.h}, zone);
}
function __sceneCollidesFallback(zone, box){
  const g = __sceneGeometry();
  if(zone===1) return (g.ZONE1_DECOR_BLOCKERS||[]).some((r,i)=>!zone1Broken[i]&&ov(box,r)) || (g.ZONE1_EXTRA_BLOCKERS||[]).some(r=>ov(box,r));
  if(zone===2) return (g.ZONE2_TREE_BLOCKERS||[]).some(r=>ov(box,r)) || (g.ZONE2_HOLE_BLOCKERS||[]).some(r=>ov(box,r)) || (g.ZONE2_DECOR_BLOCKERS||[]).some((r,i)=>!zone2Broken[i]&&ov(box,r));
  if(zone===3) return (g.ZONE3_DECOR_BLOCKERS||[]).some((r,i)=>((i >= (g.ZONE3_DECOR_BREAK_RECTS||[]).length) || !zone3Broken[i]) && ov(box,r));
  if(zone===ZONE_SECRET1) return (g.SECRET1_POOL_BLOCKERS||[]).some(r=>ov(box,r));
  if(zone===ZONE_SECRET2) return (g.SECRET2_STONE_BLOCKERS||[]).some(r=>ov(box,r));
  return false;
}
function collidesZone2Tree(x,y,w,h){
  const zoneId = __zoneNumber(typeof currentZone !== 'undefined' ? currentZone : 0);
  if(zoneId!==2) return false;
  const box=__zoneBox(x,y,w,h);
  try{ if(window.SceneEngine && typeof SceneEngine.collidesTree === 'function') return !!SceneEngine.collidesTree(2, box); }catch(err){}
  return (__sceneGeometry().ZONE2_TREE_BLOCKERS||[]).some(r=>ov(box,r));
}
function collidesZoneObstacles(x,y,w,h){
  const zoneId = __zoneNumber(typeof currentZone !== 'undefined' ? currentZone : 0);
  const box=__zoneBox(x,y,w,h);
  try{ if(window.SceneEngine && typeof SceneEngine.collides === 'function' && SceneEngine.collides(zoneId, box)) return true; }catch(err){}
  return __sceneCollidesFallback(zoneId, box);
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
  const zoneId = __zoneNumber(zone);
  try{ if(window.SceneEngine && typeof SceneEngine.isSecret === 'function') return !!SceneEngine.isSecret(zoneId); }catch(err){}
  return zoneId===ZONE_SECRET1 || zoneId===ZONE_SECRET2;
}
function getZoneLabel(zone){
  const zoneId = __zoneNumber(zone);
  try{ if(window.SceneEngine && typeof SceneEngine.getLabel === 'function'){
    const label = SceneEngine.getLabel(zoneId);
    if(label) return label;
  } }catch(err){}
  if(zoneId===ZONE_SECRET1 || zoneId===ZONE_SECRET2) return '????';
  if(zoneId===1 || zoneId===2 || zoneId===3) return 'ZONE '+zoneId;
  return 'ZONE';
}
function buildZoneTransitionInfo(nextZone, opts={}){
  const flow = __sceneFlow();
  if(flow && typeof flow.buildTransitionInfo === 'function') return flow.buildTransitionInfo(nextZone, opts);
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
    resumePlay: !!opts.resumePlay
  };
}
function openZoneTransition(nextZone, opts={}){
  const flow = __sceneFlow();
  if(flow && typeof flow.openZoneTransition === 'function') return flow.openZoneTransition(nextZone, opts);
  pendingZoneTransition=nextZone;
  zoneTransitionInfo=buildZoneTransitionInfo(nextZone, opts);
  clearGameplayKeys();
  gState='zone_transition';
}
function finishRunVictory(){
  const flow = __sceneFlow();
  if(flow && typeof flow.finishRunVictory === 'function') return flow.finishRunVictory();
  const runFlow = __runFlow();
  try{ if(runFlow && typeof runFlow.goToTitleState === 'function') runFlow.goToTitleState({clearAllSceneCaches:true, stopAudio:true}); else if(window.AudioEvents) AudioEvents.stopAll(); }catch(err){}
  if(runStartMs>0 && runTimeMs<=0) runTimeMs=performance.now()-runStartMs;
  const titleFlow = window.BoneCrawlerTitleFlow || null;
  if(titleFlow && typeof titleFlow.saveRunIfNeeded === 'function') titleFlow.saveRunIfNeeded();
  else saveRunIfNeeded();
  pendingZoneTransition=0;
  zoneTransitionInfo=null;
  clearGameplayKeys();
  retryTaxPaid=false;
  retryPromptMode='';
  startupDialogPending=!!newGamePlus;
  if(!(runFlow && typeof runFlow.goToTitleState === 'function')) gState='title';
}

function continueZoneTransition(){
  const flow = __sceneFlow();
  if(flow && typeof flow.continueZoneTransition === 'function') return flow.continueZoneTransition();
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
  try{ if(window.AudioEvents) AudioEvents.doorUnlock(); }catch(err){}
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
  if(window.BoneCrawlerZoneSpawn && BoneCrawlerZoneSpawn.usesManagedSpawns(currentZone)) return;
  if(isSecretZone(currentZone) || getZoneProgressKills(currentZone)>=getZoneKillTarget(currentZone) || pSpawns.length>0) return;
  const immediateDelay=Math.max(12, Math.floor(regularSpawnDelay()*0.55));
  qSpawn(immediateDelay, false, false, pickRegularEnemyType());
}

function enterZone2(){
  try{ const runFlow = __runFlow(); if(runFlow && typeof runFlow.prepareZoneChange === 'function') runFlow.prepareZoneChange(2, {fromZone: currentZone, stopAudio: true}); }catch(err){}
  try{ if(window.AudioEvents) AudioEvents.enterZone(2); }catch(err){}
  secret1RatTalkCount=0;
  currentZone=2;
  if(window.BoneCrawlerZoneSpawn) BoneCrawlerZoneSpawn.enterZone(2);
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
  ensureZoneMomentum();
  createZoneRetryCheckpoint(2);
}
function enterZone3(){
  try{ const runFlow = __runFlow(); if(runFlow && typeof runFlow.prepareZoneChange === 'function') runFlow.prepareZoneChange(3, {fromZone: currentZone, stopAudio: true}); }catch(err){}
  try{ if(window.AudioEvents) AudioEvents.enterZone(3); }catch(err){}
  secret1RatTalkCount=0;
  currentZone=3;
  if(window.BoneCrawlerZoneSpawn) BoneCrawlerZoneSpawn.enterZone(3);
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
  spawnFloatText({x:GW/2,y:PY+24,text:'FAIRY BLESSING',life:90,max:90,col:C.MG2});
}
function enterSecretZone1(){
  try{ const runFlow = __runFlow(); if(runFlow && typeof runFlow.prepareZoneChange === 'function') runFlow.prepareZoneChange(ZONE_SECRET1, {fromZone: currentZone, stopAudio: true}); }catch(err){}
  try{ if(window.AudioEvents) AudioEvents.enterZone(ZONE_SECRET1); }catch(err){}
  secret1RatTalkCount=0;
  currentZone=ZONE_SECRET1;
  if(window.BoneCrawlerZoneSpawn) BoneCrawlerZoneSpawn.enterZone(ZONE_SECRET1);
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
  try{ const runFlow = __runFlow(); if(runFlow && typeof runFlow.prepareZoneChange === 'function') runFlow.prepareZoneChange(ZONE_SECRET2, {fromZone: currentZone, stopAudio: true}); }catch(err){}
  try{ if(window.AudioEvents) AudioEvents.enterZone(ZONE_SECRET2); }catch(err){}
  secret1RatTalkCount=0;
  currentZone=ZONE_SECRET2;
  if(window.BoneCrawlerZoneSpawn) BoneCrawlerZoneSpawn.enterZone(ZONE_SECRET2);
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
  spawnFloatText({x:GW/2,y:PY+18,text:'SECRET ZONE',life:90,max:90,col:C.BN1});
  spawnFloatText({x:GW/2,y:PY+26,text:masterSwordOwned?'SANCTUM':'MASTER SWORD',life:95,max:95,col:C.SH});
  const titleFlow = window.BoneCrawlerTitleFlow || null;
  if(titleFlow && typeof titleFlow.saveRunIfNeeded === 'function') titleFlow.saveRunIfNeeded();
  else saveRunIfNeeded();
}

function canInteractSecret2Npc(){
  const flow = __sceneFlow();
  if(flow && typeof flow.interactionIs === 'function'){
    const hit = flow.interactionIs('secret2Npc');
    if(hit) return true;
  }
  return __zoneNumber(currentZone)===ZONE_SECRET2 && __playerNearRect(__sceneRect('secret2.woundedStranger', 'interactRect') || __sceneRect('secret2.woundedStranger', 'rect'));
}

function canInteractSecret2Sword(){
  const flow = __sceneFlow();
  if(flow && typeof flow.interactionIs === 'function'){
    const hit = flow.interactionIs('secret2Sword');
    if(hit) return true;
  }
  if(masterSwordOwned) return false;
  return __zoneNumber(currentZone)===ZONE_SECRET2 && __playerNearRect(__sceneRect('secret2.masterSword', 'interactRect') || __sceneRect('secret2.masterSword', 'rect'));
}
function canInteractZone3Tree(){
  const flow = __sceneFlow();
  if(flow && typeof flow.interactionIs === 'function'){
    const hit = flow.interactionIs('zone3Tree');
    if(hit) return true;
  }
  if(!zone3TreeAwake) return false;
  return __zoneNumber(currentZone)===3 && __playerNearRect(__sceneRect('zone3.tree', 'interactRect'));
}
function canInteractSecret1Rat(){
  const flow = __sceneFlow();
  if(flow && typeof flow.interactionIs === 'function'){
    const hit = flow.interactionIs('secret1Rat');
    if(hit) return true;
  }
  return __zoneNumber(currentZone)===ZONE_SECRET1 && __playerNearRect(__sceneRect('secret1.rat', 'interactRect'));
}
function canInteractZone3Secret2Portal(){
  const transition=getActiveZoneTransitionInteractable();
  return !!(transition && transition.id==='zone3_secret2');
}
function canInteractSecret2ReturnPortal(){
  const transition=getActiveZoneTransitionInteractable();
  return !!(transition && transition.id==='secret2_return');
}
function isNearRect(rect,pad=4){
  return __playerNearRect(rect,pad);
}
function getActiveZoneTransitionInteractable(){
  const flow = __sceneFlow();
  if(flow && typeof flow.getActiveZoneTransitionInteractable === 'function') return flow.getActiveZoneTransitionInteractable();
  try{
    if(window.EventEngine && typeof EventEngine.getActiveTransition === 'function') return EventEngine.getActiveTransition();
  }catch(err){}
  return null;
}
function getCurrentInteractionTarget(){
  const flow = __sceneFlow();
  if(flow && typeof flow.getCurrentInteractionTarget === 'function') return flow.getCurrentInteractionTarget();
  if(gState!=='playing') return null;
  try{
    if(window.EventEngine && typeof EventEngine.getActiveInteractionTarget === 'function'){
      const target = EventEngine.getActiveInteractionTarget();
      if(target) return target;
    }
  }catch(err){}
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
  const flow = __sceneFlow();
  if(flow && typeof flow.startLeaveZoneConfirm === 'function') return flow.startLeaveZoneConfirm(transition);
  if(!transition) return;
  leaveZonePromptData=transition;
  clearGameplayKeys();
  gState='leave_zone_confirm';
}
function confirmLeaveZone(){
  const flow = __sceneFlow();
  if(flow && typeof flow.confirmLeaveZone === 'function') return flow.confirmLeaveZone();
  if(gState!=='leave_zone_confirm' || !leaveZonePromptData) return;
  const transition=leaveZonePromptData;
  if(transition.id==='zone3_exit' || transition.id==='secret2_return') runCompleted=true;
  leaveZonePromptData=null;
  openZoneTransition(transition.nextZone, transition.transitionOpts||{});
}
function cancelLeaveZone(){
  const flow = __sceneFlow();
  if(flow && typeof flow.cancelLeaveZone === 'function') return flow.cancelLeaveZone();
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
