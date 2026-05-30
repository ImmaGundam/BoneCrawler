// upgrades
// Purpose: Upgrade constants, weighted point rewards, upgrade-button rolling.
// ── Upgrade menu buttons ─────────────────────────────────────
const PLAYER_BASE_SPEED = 0.28;
const SPEED_UP_STEP = 0.12;
const MAX_PLAYER_SPEED = 0.94;
const MASTER_SWORD_START_LEVEL = 4;
const MASTER_SWORD_START_REACH = 35;
const MASTER_SWORD_DISPLAY_RANGE = 5;
const MASTER_SWORD_START_WIDTH = 1;
const MASTER_SWORD_START_HEART_SLOTS = 5;
const STEP_BASE_DISTANCE = 10;
const STEP_SHADOW_BASE_DISTANCE = 14;
const STEP_DISTANCE_PER_UPGRADE = 2;
const STEP_BASE_COOLDOWN_FRAMES = 5*60;
const STEP_SHADOW_BASE_COOLDOWN_FRAMES = 4*60;
const STEP_COOLDOWN_REDUCTION_PER_UPGRADE = 45;
const STEP_MIN_COOLDOWN_FRAMES = 90;
const SHADOW_STEP_INVULN_FRAMES = 12;
const POTION_DROP_CHANCE = 0.18;
const POTION_MAX_COUNT = 1;
const POTION_ITEM_TTL_FRAMES = 8*60;
const POTION_ITEM_FADE_FRAMES = 2*60;
const UPGRADE_SLOT_YS=[37,58,79];
const POINT_REWARD_WEIGHTS=[
  {points:5,weight:25},
  {points:10,weight:20},
  {points:20,weight:20},
  {points:30,weight:20},
  {points:40,weight:10},
  {points:100,weight:9},
  {points:200,weight:5},
  {points:1000,weight:1},
];
const UPGRADE_POOL=[
  {type:'heart',label:'HEART',sub:'HEAL 1 HEART',border:C.BLD,text:'#ff9977',icon:'upHeart'},
  {type:'sword',label:'SWORD',sub:'BIGGER BLADE',border:C.SI2,text:C.BN1,icon:'upSword'},
  {type:'shield',label:'MAGIC SHIELD',sub:'ABSORB HIT + SHOCKWAVE',border:C.SH2,text:C.SH,icon:'shieldIcon',labelFs:6,subFs:4},
  {type:'speed',label:'SPEED',sub:'INCREASE SPEED',border:C.FR2,text:C.FR1,icon:'upSpeed'},
  {type:'shadowstep',label:'SHADOW STEP',sub:'IMPROVE DODGE',border:'#7a74f5',text:'#d8d3ff',icon:'shadowStepIcon',labelFs:5,subFs:4},
  {type:'points',label:'POINTS',sub:'BONUS SCORE',border:C.FR1,text:C.BN1,icon:'pointsIcon'},
];
let currentUpgradeBtns=[];

function choosePointReward(){
  const total=POINT_REWARD_WEIGHTS.reduce((sum,opt)=>sum+opt.weight,0);
  let roll=Math.random()*total;
  for(const opt of POINT_REWARD_WEIGHTS){
    roll-=opt.weight;
    if(roll<=0) return opt.points;
  }
  return POINT_REWARD_WEIGHTS[POINT_REWARD_WEIGHTS.length-1].points;
}

function rollUpgradeChoices(){
  const pool=UPGRADE_POOL.slice();
  for(let i=pool.length-1;i>0;i--){
    const j=(Math.random()*(i+1))|0;
    const tmp=pool[i];
    pool[i]=pool[j];
    pool[j]=tmp;
  }
  currentUpgradeBtns=pool.slice(0,3).map((opt,idx)=>{
    const btn={
      ...opt,
      num:String(idx+1),
      x:31,
      y:UPGRADE_SLOT_YS[idx],
      w:58,
      h:16,
    };
    if(btn.type==='points'){
      btn.pointValue=choosePointReward();
      btn.sub='+'+btn.pointValue+' SCORE';
    }
    return btn;
  });
}



// player-combat
// Purpose: Player attacks, sword hit detection, whirlwind slash, and attack effects.
function performPlayerAttack(strength=1){
  const p=player;
  if(!p || p.atkCD>0 || p.atkT>0) return false;
  p.atkT=14;
  p.atkCD=30;
  try{ if(window.AudioEvents) AudioEvents.playerAttack(); }catch(err){}
  const dmg = devGodMode ? 999 : Math.max(1, strength|0);
  const box=atkBox(p, p.swordReach);
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e || e.spawnInvulnerable) continue;
    if(ov(box,{x:e.x,y:e.y,w:e.w,h:e.h})){
      e.hp -= dmg;
      try{ if(window.AudioEvents) AudioEvents.enemyHit(); }catch(err){}
      burst(e.x+e.w/2, e.y+e.h/2);
      if(e.hp<=0){
        handleEnemyDefeat(i,e,false);
      } else {
        e.hurtT=10;
      }
    }
  }
  if(dragonBoss && dragonBoss.howlT<=0 && ov(box,getDragonHurtBox())){
    damageDragonBoss(devGodMode ? 10 : strength,false);
  }
  if(whyDragonsBoss && whyDragonsBoss.howlT<=0 && ov(box,getDragonHurtBox(whyDragonsBoss))){
    damageWhyDragonsBoss(devGodMode ? 10 : strength,false);
  }
  if(shadowBoss && shadowBoss.howlT<=0 && ov(box,getShadowHurtBox())){
    damageShadowBoss(devGodMode ? 10 : strength,false);
    const sc=getShadowCenter();
    const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
    if(Math.hypot(pcx-sc.x,pcy-sc.y)<18 && Math.random()<0.85){
      triggerShadowCounter();
    }
  }
  if(currentZone===1){
    for(let i=0;i<ZONE1_DECOR_BLOCKERS.length;i++){
      if(!zone1Broken[i] && ov(box, ZONE1_DECOR_BREAK_RECTS[i])) breakZone1Decor(i);
    }
  }
  if(currentZone===2){
    for(let i=0;i<ZONE2_DECOR_BREAK_RECTS.length;i++){
      if(!zone2Broken[i] && ov(box, ZONE2_DECOR_BREAK_RECTS[i])) breakZone2Decor(i);
    }
  }
  if(currentZone===3){
    if(!zone3TreeAwake && ov(box, ZONE3_TREE_RECT)){
      zone3TreeHits=Math.min(ZONE3_TREE_HITS_TO_WAKE, zone3TreeHits+1);
      zone3TreeShakeT=10;
      burstDecor(ZONE3_TREE_RECT.x+ZONE3_TREE_RECT.w/2, ZONE3_TREE_RECT.y+ZONE3_TREE_RECT.h/2);
      if(zone3TreeHits>=ZONE3_TREE_HITS_TO_WAKE){
        zone3TreeAwake=true;
        floatTexts.push({x:ZONE3_TREE_RECT.x+ZONE3_TREE_RECT.w/2,y:ZONE3_TREE_RECT.y-6,text:'DEKU',life:60,max:60,col:C.MG2});
      }
    }
    for(let i=0;i<ZONE3_DECOR_BREAK_RECTS.length;i++){
      if(!zone3Broken[i] && ov(box, ZONE3_DECOR_BREAK_RECTS[i])) breakZone3Decor(i);
    }
  }
  return true;
}

function performWhirlwindSlash(){
  const p=player;
  if(!p || whirlwindCooldownT>0 || p.dead) return false;
  const cx=p.x+p.w/2, cy=p.y+p.h/2;
  const radius=18 + Math.max(0, p.swordWidth||0);
  whirlwindSlashT=16;
  whirlwindCooldownT=WHIRLWIND_COOLDOWN_FRAMES;
  try{ if(window.AudioEvents) AudioEvents.playerAttack(); }catch(err){}
  p.atkT=18;
  p.atkCD=30;

  for(let i=0;i<18;i++){
    const a=(i/18)*Math.PI*2;
    const s=0.5+Math.random()*1.6;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:16+(Math.random()*8|0),max:22,col:Math.random()<0.5?'#d8f6ff':'#7ccfff'});
  }

  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e || e.spawnInvulnerable) continue;
    const ex=e.x+e.w/2, ey=e.y+e.h/2;
    if(Math.hypot(ex-cx,ey-cy) <= radius + Math.max(e.w,e.h)/2){
      e.hp -= devGodMode ? 999 : 2;
      try{ if(window.AudioEvents) AudioEvents.enemyHit(); }catch(err){}
      burst(ex, ey);
      if(e.hp<=0){
        handleEnemyDefeat(i,e,false);
      } else {
        e.hurtT=12;
      }
    }
  }

  if(dragonBoss && dragonBoss.howlT<=0){
    const b=getDragonCenter();
    if(Math.hypot(b.x-cx,b.y-cy)<=radius+18) damageDragonBoss(devGodMode ? 10 : 2,false);
  }
  if(whyDragonsBoss && whyDragonsBoss.howlT<=0){
    const b=getDragonCenter(whyDragonsBoss);
    if(Math.hypot(b.x-cx,b.y-cy)<=radius+18) damageWhyDragonsBoss(devGodMode ? 10 : 2,false);
  }
  if(shadowBoss && shadowBoss.howlT<=0){
    const s=getShadowCenter();
    if(Math.hypot(s.x-cx,s.y-cy)<=radius+12) damageShadowBoss(devGodMode ? 10 : 2,false);
  }

  floatTexts.push({x:cx,y:cy-8,text:'WHIRLWIND',life:36,max:36,col:C.SH});
  return true;
}


// player-survival-upgrades
// Purpose: Progression rewards, health/potion/dodge, decor breaking, and applying upgrades.
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
    const hasChest = typeof getChestList === 'function' ? getChestList().length > 0 : !!chest;
    if(!managedChestZone && killCount>=nextChestAt && !hasChest && !isSecretZone(currentZone)){
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

// title/start/name/scoreboard flow moved to src/title/title-menu-runtime.js


// player-update-runtime
// Purpose: Player movement, field pickups, dodge/attack charge, and player-side combat tick orchestration.
function updatePlayerRuntimeFrame(){
  const p=player;
  if(p.dead) return true;
  if(devGodMode){
    p.hp=p.maxHp;
    p.hurtT=0;
    p.shield=true;
    p.shieldBreakT=0;
    p.visibleHearts=Math.max(p.visibleHearts||3, Math.min(5, Math.ceil(p.hp/2)));
  }

  if(p.shieldBreakT>0) p.shieldBreakT--;

  for(let i=heartDrops.length-1;i>=0;i--){
    const h=heartDrops[i];
    if(typeof h.ttl==='number'){
      h.ttl--;
      if(h.ttl<=0) releaseHeartDropAt(i);
    }
  }
  for(let i=potionDrops.length-1;i>=0;i--){
    const d=potionDrops[i];
    if(typeof d.ttl==='number'){
      d.ttl--;
      if(d.ttl<=0) releasePotionDropAt(i);
    }
  }
  if(zone3TreeShakeT>0) zone3TreeShakeT--;

  let dx=0,dy=0;
  const waterBox={x:p.x,y:p.y,w:p.w,h:p.h};
  const inSecret1Water=currentZone===ZONE_SECRET1 && isSecret1WaterZone(waterBox);
  const terrainSpeedMult=inSecret1Water ? 0.58 : 1;
  const moveSpeed=(devGodMode ? p.speed*DEV_GOD_SPEED_MULT : p.speed)*terrainSpeedMult;
  if(isKeyDown('ArrowLeft','KeyA')){dx-=moveSpeed;p.dir='left';}
  if(isKeyDown('ArrowRight','KeyD')){dx+=moveSpeed;p.dir='right';}
  if(isKeyDown('ArrowUp','KeyW')){dy-=moveSpeed;p.dir='up';}
  if(isKeyDown('ArrowDown','KeyS')){dy+=moveSpeed;p.dir='down';}

  if(touchMoveActive){
    const tdx=touchX-touchStartX;
    const tdy=touchY-touchStartY;
    const dist=Math.hypot(tdx,tdy);
    if(dist>10){
      const nx=tdx/dist, ny=tdy/dist;
      dx += nx*moveSpeed;
      dy += ny*moveSpeed;
      if(Math.abs(tdx)>Math.abs(tdy)) p.dir = tdx<0 ? 'left' : 'right';
      else p.dir = tdy<0 ? 'up' : 'down';
    }
  }

  if(dx&&dy){dx*=0.707;dy*=0.707;}
  let nx=Math.max(PX,Math.min(PX+PW-p.w,p.x+dx));
  if(collidesZoneObstacles(nx,p.y,p.w,p.h)) nx=p.x;
  p.x=nx;
  let ny=Math.max(PY,Math.min(PY+PH-p.h,p.y+dy));
  if(collidesZoneObstacles(p.x,ny,p.w,p.h)) ny=p.y;
  p.y=ny;
  if(dx||dy) p.walkF += inSecret1Water ? 0.45 : 1;

  if(inSecret1Water && (dx||dy) && frame%6===0){
    const px=p.x+p.w/2;
    const py=p.y+p.h-1;
    spawnPart({x:px-2+Math.random()*4,y:py,vx:(Math.random()*0.5-0.25),vy:-0.10-Math.random()*0.18,
      life:10+(Math.random()*5|0),max:16,col:Math.random()<0.5?'#d8f6ff':'#8fd8ff'});
    spawnPart({x:px-2+Math.random()*4,y:py+1,vx:(Math.random()*0.4-0.2),vy:-0.04-Math.random()*0.10,
      life:8+(Math.random()*4|0),max:14,col:'#6ec3e7'});
  }

  if(secret1UnlockAlertT>0) secret1UnlockAlertT--;
  if(currentZone===1 && zone1SecretEntranceReady()){
    if(!secret1UnlockAlertShown){
      secret1UnlockAlertShown=true;
      secret1UnlockAlertT=135;
      spawnFloatText({x:GW/2,y:PY+60,text:'SECRET ZONE 1',life:72,max:72,col:C.MG2});
      spawnFloatText({x:GW/2,y:PY+68,text:'UNLOCKED! (INTERACT)',life:72,max:72,col:C.BN1});
    }
  }

  if(hasAnyKeyDrop()){
    const drops=getKeyDropList();
    for(let i=drops.length-1;i>=0;i--){
      const drop=drops[i];
      if(!ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:drop.x,y:drop.y,w:drop.w,h:drop.h})) continue;
      try{ if(window.AudioEvents) AudioEvents.keyPickup(); }catch(err){}
      if(drop.kind==='zone1Door') p.zone1DoorKey=true;
      else if(drop.kind==='secret1'){ p.secret1Key=true; breakZone1Decor(0); }
      else if(drop.kind==='zone2') p.zone2Key=true;
      else p.hasKey=true;
      removeKeyDropAt(i);
      spawnFloatText({x:p.x+4,y:p.y-6,text:drop.kind==='secret1'?'SECRET KEY':(drop.kind==='zone1Door'?'ZONE 2 KEY':'KEY'),life:40,max:40,col:drop.kind==='secret1'?C.MG2:C.BN1});
    }
    keyDrop=drops;
  }
  if(currentZone===ZONE_SECRET1){
    if(secret1BlessingT>0) secret1BlessingT--;
    if(secret1BlessingT===80){
      spawnFloatText({x:GW/2,y:PY+72,text:'THE FAIRIES SEND YOU ONWARD',life:70,max:70,col:C.MG2});
    }
  }

  const activeChests = typeof getChestList === 'function' ? getChestList() : (chest ? [chest] : []);
  for(let i=activeChests.length-1;i>=0;i--){
    const c=activeChests[i];
    if(!c || !ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:c.x,y:c.y,w:c.w,h:c.h})) continue;
    if(typeof removeChestAt === 'function') removeChestAt(i);
    else chest=null;
    try{ if(window.AudioEvents) AudioEvents.chestOpen(); }catch(err){}
    rollUpgradeChoices();
    gState='upgrade';
    return true;
  }

  for(let i=heartDrops.length-1;i>=0;i--){
    const h=heartDrops[i];
    if(ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:h.x,y:h.y,w:h.w,h:h.h})){
      if(h.kind==='half') grantHalfHeartReward(h.x+4,h.y);
      else grantHeartReward(h.x+4,h.y);
      for(let j=0;j<6;j++){
        const a=Math.random()*Math.PI*2, s=0.4+Math.random()*1.3;
        spawnPart({x:h.x+3.5,y:h.y+3.5,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
          life:18+(Math.random()*10|0),max:28,col:Math.random()<0.5?C.HP1:C.HP2});
      }
      releaseHeartDropAt(i);
    }
  }

  if(potionCount < POTION_MAX_COUNT){
    for(let i=potionDrops.length-1;i>=0;i--){
      const d=potionDrops[i];
      if(ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:d.x,y:d.y,w:d.w,h:d.h})){
        potionCount=Math.min(POTION_MAX_COUNT, potionCount+1);
        burst(d.x+3.5, d.y+3.5);
        spawnFloatText({x:d.x+3,y:d.y-5,text:'POTION',life:34,max:34,col:C.HP1});
        if(!potionDialogSeenThisRun){
          potionDialogSeenThisRun=true;
          queuePotionAcquireDialog();
        }
        releasePotionDropAt(i);
      }
    }
  }

  const keyboardSpcNow=isKeyDown('Space');
  const touchSpcNow=touchAttackChargeActive && !touchAttackMoved;
  const mouseSpcNow=mouseAttackHeld && whirlwindUnlocked;
  const spcNow=keyboardSpcNow || touchSpcNow || mouseSpcNow;
  const touchChargeCanceled=touchAttackCancelQueued && !spcNow && prevSpc;
  const spcJust=spcNow&&!prevSpc;
  const spcRelease=((!spcNow&&prevSpc&&!touchChargeCanceled) || touchAttackReleaseQueued || mouseAttackReleaseQueued);
  const clickJust=mouseAttackQueued;
  prevSpc=spcNow;
  mouseAttackQueued=false;
  mouseAttackReleaseQueued=false;
  touchAttackReleaseQueued=false;
  touchAttackCancelQueued=false;

  if(whirlwindCooldownT>0) whirlwindCooldownT--;
  if(whirlwindSlashT>0) whirlwindSlashT--;
  if(dodgeCooldownT>0) dodgeCooldownT--;
  if(p.dodgeInvulnT>0) p.dodgeInvulnT--;

  if(whirlwindUnlocked){
    if(spcJust && p.atkCD<=0 && p.atkT<=0){
      whirlwindChargeT=1;
    } else if(spcNow && whirlwindChargeT>0){
      whirlwindChargeT++;
      if(whirlwindChargeT>=WHIRLWIND_HOLD_FRAMES){
        p.atkT=Math.max(p.atkT,2);
      }
    } else if(spcRelease && whirlwindChargeT>0){
      if(whirlwindChargeT>=WHIRLWIND_HOLD_FRAMES && whirlwindCooldownT<=0){
        performWhirlwindSlash();
      } else if(p.atkCD<=0 && p.atkT<=0){
        performPlayerAttack(1);
      }
      whirlwindChargeT=0;
    } else if((!spcNow && whirlwindChargeT>0 && !spcRelease) || touchChargeCanceled){
      whirlwindChargeT=0;
    }
  } else if(spcJust && p.atkCD<=0 && p.atkT<=0){
    performPlayerAttack(1);
  }

  if(clickJust && p.atkCD<=0 && p.atkT<=0){
    performPlayerAttack(1);
  }

  if(p.atkT>0) p.atkT--;
  if(p.atkCD>0) p.atkCD--;
  if(p.hurtT>0) p.hurtT--;
  return false;
}
