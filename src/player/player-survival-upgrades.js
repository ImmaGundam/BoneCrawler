// player-survival-upgrades
// Purpose: Progression rewards, health/potion/dodge, decor breaking, applying upgrades, title/start/scoreboard helpers.
const SHIELD_SHOCKWAVE_BASE_RADIUS = 15;
const SHIELD_SHOCKWAVE_STEP = 3;

function handleEnemyDefeat(i,e,fromShockwave){
  try{ if(window.AudioEvents) AudioEvents.skeletonDeath(); }catch(err){}
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
  const defeatPayload = {
    zoneId: currentZone,
    enemy: e,
    fromShockwave: !!fromShockwave,
    runKills: killCount,
    zoneKills: (typeof getZoneProgressKills === 'function' ? getZoneProgressKills(currentZone) : killCount),
    x: e.x + Math.floor((e.w || 8) / 2) - 3,
    y: e.y + Math.floor((e.h || 8) / 2) - 3
  };
  try{ if(window.EventEngine) EventEngine.emit('enemy.defeated', defeatPayload); }catch(err){}
  const spawnSubsystemHandledDefeat = !!(window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.onEnemyDefeated === 'function' && BoneCrawlerZoneSpawn.onEnemyDefeated(defeatPayload));
  const usingManagedSpawnProgression = !!(window.BoneCrawlerZoneSpawn && BoneCrawlerZoneSpawn.usesManagedSpawns(currentZone));
  if(!spawnSubsystemHandledDefeat && !usingManagedSpawnProgression && currentZone===1 && killCount===ZONE1_ZONE2_KEY_KILLS && !player.zone1DoorKey && !hasKeyDropKind('zone1Door')){
    spawnKeyDrop(e.x+Math.floor(e.w/2)-3,e.y+Math.floor(e.h/2)-3,'zone1Door');
    floatTexts.push({x:e.x+e.w/2,y:e.y-10,text:'ZONE 2 KEY!',life:52,max:52,col:C.FR1});
  }
  if(!spawnSubsystemHandledDefeat && !usingManagedSpawnProgression && currentZone===1 && killCount===ZONE1_SECRET_KEY_KILLS && !player.secret1Key && !hasKeyDropKind('secret1')){
    spawnKeyDrop(e.x+Math.floor(e.w/2)-3,e.y+Math.floor(e.h/2)-3,'secret1');
    floatTexts.push({x:e.x+e.w/2,y:e.y-10,text:'SECRET KEY!',life:52,max:52,col:C.MG2});
  }
  if(!spawnSubsystemHandledDefeat && !usingManagedSpawnProgression && currentZone===2 && getZoneProgressKills(2)===ZONE2_KEY_KILLS && !player.zone2Key && !hasKeyDropKind('zone2')){
    spawnKeyDrop(e.x+Math.floor(e.w/2)-3,e.y+Math.floor(e.h/2)-3,'zone2');
    floatTexts.push({x:e.x+e.w/2,y:e.y-10,text:'KEY!',life:46,max:46,col:C.BN1});
  }
  if(!spawnSubsystemHandledDefeat && !usingManagedSpawnProgression && currentZone===1 && killCount===ZONE1_DRAGON_MINIBOSS_KILLS && !dragonBoss && !bossDefeated && !zone1MiniBossDefeated){
    pendingZone1DragonSpawn=true;
  }
  if(!spawnSubsystemHandledDefeat && !dragonBoss && !shadowBoss && !pendingZone1DragonSpawn){
    for(const spawn of pSpawns){
      spawn.t=Math.min(spawn.t, spawn.giant ? giantSpawnDelay() : regularSpawnDelay());
    }
    const managedChestZone = window.BoneCrawlerZoneSpawn && BoneCrawlerZoneSpawn.usesManagedSpawns(currentZone);
    if(!managedChestZone && killCount>=nextChestAt && !chest && !isSecretZone(currentZone)){
      spawnChest();
      nextChestAt+=getChestKillStepForZone(currentZone);
    }
    if(!isSecretZone(currentZone) && (!window.BoneCrawlerZoneSpawn || !BoneCrawlerZoneSpawn.usesManagedSpawns(currentZone)) && getZoneProgressKills(currentZone)<getZoneKillTarget(currentZone)){
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
  try{ if(window.AudioEvents) AudioEvents.playerDodge(); }catch(err){}
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
  try{ if(window.AudioEvents) AudioEvents.playerShield(); }catch(err){}
  const shockwaveRadius=getShieldShockwaveRadius();
  shockwaves.push({x:cx,y:cy,r:3,maxR:shockwaveRadius,life:18,maxLife:18});
  for(let i=0;i<20;i++){
    const a=(i/20)*Math.PI*2, s=0.7+Math.random()*1.2;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:14+(Math.random()*8|0),max:24,col:Math.random()<0.5?C.SH:C.SI1});
  }
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e || e.spawnInvulnerable) continue;
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
  if(whyDragonsBoss && whyDragonsBoss.howlT<=0){
    const dc=getDragonCenter(whyDragonsBoss);
    const dist=Math.hypot(dc.x-cx, dc.y-cy);
    if(dist<=shockwaveRadius + Math.max(whyDragonsBoss.w,whyDragonsBoss.h)/3){
      damageWhyDragonsBoss(1,true);
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

function getBreakableObjectDef(zone, idx){
  try{
    if(window.SceneRuntime && typeof SceneRuntime.getBreakable === 'function'){
      return SceneRuntime.getBreakable(zone, idx);
    }
  }catch(err){}
  return null;
}

function burstLanternBreak(x,y){
  for(let i=0;i<18;i++){
    const a=Math.random()*Math.PI*2, s=0.25+Math.random()*1.4;
    parts.push({
      x,y,
      vx:Math.cos(a)*s,
      vy:Math.sin(a)*s - 0.35,
      life:18+(Math.random()*18|0),
      max:34,
      col:Math.random()<0.45?C.FR1:(Math.random()<0.72?C.FR2:C.BN1)
    });
  }
}

function handleBreakableObjectBreak(zone, idx, brokenArray, breakRects){
  if(!brokenArray || brokenArray[idx]) return false;
  const def=getBreakableObjectDef(zone, idx);
  const r=(def && def.breakRect) || (breakRects && breakRects[idx]);
  if(!r) return false;
  const cx=r.x+r.w/2;
  const cy=r.y+r.h/2;
  brokenArray[idx]=true;
  try{
    if(window.EventEngine){
      EventEngine.emit('prop.broken', {
        zoneId:zone,
        objectId:(def && def.id) || ('zone' + zone + '.decor' + idx),
        propType:'breakable',
        kind:(def && def.kind) || 'decor',
        index:idx,
        x:cx,
        y:cy
      });
    }
  }catch(err){}
  if(def && def.breakEffect === 'lanternFlame') burstLanternBreak(cx, cy);
  else burstDecor(cx, cy);
  const canDropHalfHeart = !def || def.dropsHalfHeart !== false;
  if(canDropHalfHeart && Math.random()<BREAKABLE_HALF_HEART_DROP_CHANCE){
    spawnHalfHeartDrop(r.x+Math.floor(r.w/2)-3, r.y+Math.floor(r.h/2)-3);
  }
  return true;
}

function breakZone1Decor(idx){
  if(currentZone!==1) return;
  if(!zone1Broken || zone1Broken[idx]) return;
  const r=ZONE1_DECOR_BREAK_RECTS[idx];
  zone1Broken[idx]=true;
  const def=getBreakableObjectDef(1, idx);
  try{ if(window.EventEngine) EventEngine.emit('prop.broken', {zoneId:1, objectId:(def && def.id) || ('zone1.break'+idx), propType:'breakable', index:idx, x:r.x+r.w/2, y:r.y+r.h/2}); }catch(err){}
  burstDecor(r.x+r.w/2, r.y+r.h/2);
  if(Math.random()<BREAKABLE_HALF_HEART_DROP_CHANCE){
    spawnHalfHeartDrop(r.x+Math.floor(r.w/2)-3, r.y+Math.floor(r.h/2)-3);
  }
}


function breakZone2Decor(idx){
  if(currentZone!==2) return;
  handleBreakableObjectBreak(2, idx, zone2Broken, ZONE2_DECOR_BREAK_RECTS);
}

function breakZone3Decor(idx){
  if(currentZone!==3) return;
  handleBreakableObjectBreak(3, idx, zone3Broken, ZONE3_DECOR_BREAK_RECTS);
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

