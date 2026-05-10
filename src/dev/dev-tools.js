// Developer toolkit limited
// Purpose: Editable stat/dev API helpers.
// ── Cheat code name detection ─────────────────────────────────────
function getCheatCode(name=currentPlayerName){
  if(window.BoneCrawlerCheatCodes && typeof BoneCrawlerCheatCodes.detect === 'function') return BoneCrawlerCheatCodes.detect(name);
  const clean=String(name||'').trim().toLowerCase();
  const codes={
    'link':'link','doodoorocks':'doodoorocks','circa90x':'circa90x',
    'itsasecret':'itsasecret','devsecret':'devsecret',
    'whydragons':'whydragons','zone2':'zone2','zone3':'zone3',
  };
  return codes[clean]||null;
}
function applyCheatCode(code){
  if(window.BoneCrawlerCheatCodes && typeof BoneCrawlerCheatCodes.apply === 'function'){
    BoneCrawlerCheatCodes.apply(code);
    return;
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
  try{ if(window.AudioEvents) AudioEvents.enterZone(currentZone); }catch(err){}
}
function startGameWithCheat(code){
  if(window.BoneCrawlerCheatCodes && typeof BoneCrawlerCheatCodes.start === 'function'){
    if(BoneCrawlerCheatCodes.start(code)) return;
  }
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
    clearChests(); clearKeyDrops();
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
    clearChests(); clearKeyDrops();
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
  if(whyDragonsBoss){
    if(whyDragonsBoss.howlT>0){
      whyDragonsBoss.howlT=1;
      pushDevFloat('BONUS PHASE', C.MG2);
      return;
    }
    damageWhyDragonsBoss(whyDragonsBoss.hp,false);
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

  clearChests(); clearKeyDrops();
  enemies=[]; pSpawns=[]; fireballs=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; parts=[];
  dragonBoss=null; whyDragonsBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
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
    whyDragonsActive:!!whyDragonsBoss,
    whyDragonsPhase:whyDragonsBoss ? whyDragonsBoss.phase : 0,
    whyDragonsHp:whyDragonsBoss ? whyDragonsBoss.hp : 0,
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

