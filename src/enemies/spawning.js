// spawning
// Purpose: Enemy spawn queue, spawn timing, enemy type selection, standard/zone enemy creation.
function qSpawn(delay, giant, wizard, type){ pSpawns.push({t:delay, giant:!!giant, wizard:!!wizard, type:type||null}); }

function regularSpawnDelay(){
  const progress=getZoneProgressKills(currentZone);
  return progress>=100 ? 56 : 112;
}

function giantSpawnDelay(){
  const progress=getZoneProgressKills(currentZone);
  return progress>=100 ? 60 : 120;
}

function giantKillStep(){
  return Math.max(12, giantKillInterval|0 || 20);
}

const GIANT_KILL_INTERVAL_START=20;
const GIANT_KILL_INTERVAL_MIN=12;
const WIZARD_KILL_INTERVAL_START=30;
const WIZARD_KILL_INTERVAL_MIN=10;

function getNextSpawnThreshold(baseInterval, minInterval, kills){
  let next=baseInterval;
  let interval=baseInterval;
  const safeKills=Math.max(0, kills|0);
  while(next<=safeKills){
    interval=Math.max(minInterval, interval-1);
    next+=interval;
  }
  return {next, interval};
}

function syncKillSpawnSchedulesFromCount(){
  const giantSchedule=getNextSpawnThreshold(GIANT_KILL_INTERVAL_START, GIANT_KILL_INTERVAL_MIN, killCount);
  nextGiantAt=giantSchedule.next;
  giantKillInterval=giantSchedule.interval;

  const wizardSchedule=getNextSpawnThreshold(WIZARD_KILL_INTERVAL_START, WIZARD_KILL_INTERVAL_MIN, killCount);
  nextWizardAt=wizardSchedule.next;
  wizardKillInterval=wizardSchedule.interval;
}

function getEnemyMoveRateForProgress(progress, opts){
  const cfg=opts || {};
  const base=Number.isFinite(Number(cfg.baseSpeed)) ? Number(cfg.baseSpeed) : 0.22;
  const max=Number.isFinite(Number(cfg.maxSpeed)) ? Number(cfg.maxSpeed) : 0.68;
  const factor=Number.isFinite(Number(cfg.factor)) ? Number(cfg.factor) : 0.035;
  const curve=String(cfg.curve || 'sqrt').toLowerCase();
  const safeProgress=Math.max(0, Number(progress) || 0);
  const curveValue=curve === 'linear' ? safeProgress : curve === 'none' ? 0 : Math.sqrt(safeProgress);
  return Math.min(max, base + curveValue * factor);
}

function getDefaultEnemyMoveRate(){
  return getEnemyMoveRateForProgress(typeof score !== 'undefined' ? score : 0);
}

function getFallbackEnemyMoveRateForZone(zone=currentZone){

  try{ return getEnemyMoveRateForProgress(typeof score !== 'undefined' ? score : getZoneProgressKills(zone)); }catch(err){ return getDefaultEnemyMoveRate(); }
}

function getBaseEnemyMoveRateForZone(zone=currentZone){
  const resolved=resolveSpawnSystemEnemyStats('normalEnemy1', zone, {source:'compat-base-rate'});
  return Number.isFinite(Number(resolved.baseSpeed)) ? Number(resolved.baseSpeed) : getFallbackEnemyMoveRateForZone(zone);
}

function getZone2EnemyProgressionValue(){
  return Math.max(0, getZoneProgressKills(2));
}

function getZone2BaseEnemyMoveRate(){
  return getBaseEnemyMoveRateForZone(2);
}

function resolveSpawnSystemEnemyStats(kind, zone=currentZone, context){
  const ctx=Object.assign({
    zoneId:Number(zone),
    enemyType:kind || 'normalEnemy1',
    source:'enemy-factory'
  }, context || {});
  try{
    if(window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.resolveEnemyStats === 'function'){
      const resolved=BoneCrawlerZoneSpawn.resolveEnemyStats(kind || 'normalEnemy1', ctx);
      if(resolved && typeof resolved === 'object') return resolved;
    }
  }catch(err){}
  return {
    sourceSystem:'fallback',
    baseSpeed:getFallbackEnemyMoveRateForZone(zone),
    typeStats:{},
    typeMultipliers:{},
    minSpeeds:{}
  };
}

function readEnemyTypeStat(profile, kind, key, fallback){
  if(profile && profile.typeStats && profile.typeStats[kind] && profile.typeStats[kind][key] != null){
    const value=Number(profile.typeStats[kind][key]);
    if(Number.isFinite(value)) return value;
  }
  if(key === 'speedMultiplier' && profile && profile.typeMultipliers && profile.typeMultipliers[kind] != null){
    const value=Number(profile.typeMultipliers[kind]);
    if(Number.isFinite(value)) return value;
  }
  if(key === 'minSpeed' && profile && profile.minSpeeds && profile.minSpeeds[kind] != null){
    const value=Number(profile.minSpeeds[kind]);
    if(Number.isFinite(value)) return value;
  }
  if(key === 'hp' && profile && profile.hps && profile.hps[kind] != null){
    const value=Number(profile.hps[kind]);
    if(Number.isFinite(value)) return value;
  }
  if(key === 'points' && profile && profile.pointsByType && profile.pointsByType[kind] != null){
    const value=Number(profile.pointsByType[kind]);
    if(Number.isFinite(value)) return value;
  }
  if(profile && profile[key + 's'] && profile[key + 's'][kind] != null){
    const value=Number(profile[key + 's'][kind]);
    if(Number.isFinite(value)) return value;
  }
  if(profile && profile[key] != null){
    const value=Number(profile[key]);
    if(Number.isFinite(value)) return value;
  }
  return fallback;
}

function resolveEnemySpeed(kind, base, profile, fallbackMultiplier, fallbackMin){
  const explicit=readEnemyTypeStat(profile, kind, 'speed', NaN);
  if(Number.isFinite(explicit)) return explicit;
  const multiplier=readEnemyTypeStat(profile, kind, 'speedMultiplier', fallbackMultiplier);
  const min=readEnemyTypeStat(profile, kind, 'minSpeed', fallbackMin);
  return Math.max(min, base * multiplier);
}

function resolveEnemyHp(kind, baseHp, profile){
  const explicit=readEnemyTypeStat(profile, kind, 'hp', NaN);
  if(Number.isFinite(explicit)) return Math.max(1, Math.round(explicit));
  const add=readEnemyTypeStat(profile, kind, 'hpAdd', 0);
  const multiplier=readEnemyTypeStat(profile, kind, 'hpMultiplier', 1);
  return Math.max(1, Math.round(baseHp * multiplier + add));
}

function resolveEnemyPoints(kind, basePoints, profile){
  const explicit=readEnemyTypeStat(profile, kind, 'points', NaN);
  if(Number.isFinite(explicit)) return Math.max(0, Math.round(explicit));
  const add=readEnemyTypeStat(profile, kind, 'pointsAdd', 0);
  const multiplier=readEnemyTypeStat(profile, kind, 'pointsMultiplier', 1);
  return Math.max(0, Math.round(basePoints * multiplier + add));
}

function getRegularEnemyWeights(kills=killCount){
  const safeKills=Math.max(0, kills|0);
  return [
    {type:'normalEnemy1', weight:1 + Math.floor(safeKills/20)},
    {type:'normalEnemy2', weight:Math.floor(safeKills/30)},
    {type:'normalEnemy3', weight:1 + Math.floor(safeKills/10)},
  ];
}

function pickRegularEnemyType(kills=killCount){
  const weights=getRegularEnemyWeights(kills).filter(entry=>entry.weight>0);
  let total=0;
  for(const entry of weights) total+=entry.weight;
  if(total<=0) return 'normalEnemy1';
  let roll=Math.random()*total;
  for(const entry of weights){
    roll-=entry.weight;
    if(roll<0) return entry.type;
  }
  return weights[weights.length-1].type;
}

function createStandardEnemyGameObject(kind, x, y, zone=currentZone, context){
  const enemyKind=kind || 'normalEnemy1';
  const profile=resolveSpawnSystemEnemyStats(enemyKind, zone, context || {});
  const base=Number.isFinite(Number(profile.baseSpeed)) ? Number(profile.baseSpeed) : getFallbackEnemyMoveRateForZone(zone);
  const progress=Math.max(0, Number(profile.progress) || getZoneProgressKills(zone) || 0);

  if(enemyKind==='normalEnemy1'){
    return {
      x,y,w:9,h:9,speed:resolveEnemySpeed(enemyKind, base, profile, 1, 0.08),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:resolveEnemyHp(enemyKind, 1, profile),points:resolveEnemyPoints(enemyKind, 1, profile),giant:false,hurtT:0,variant:'old',enemyType:'normalEnemy1',spawnSystem:profile.sourceSystem||null
    };
  }
  if(enemyKind==='normalEnemy2'){
    return {
      x,y,w:9,h:9,speed:resolveEnemySpeed(enemyKind, base, profile, 0.9, 0.14),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:resolveEnemyHp(enemyKind, 1, profile),points:resolveEnemyPoints(enemyKind, 1, profile),giant:false,hurtT:0,variant:'new',enemyType:'normalEnemy2',spawnSystem:profile.sourceSystem||null
    };
  }
  if(enemyKind==='normalEnemy3'){
    return {
      x,y,w:9,h:9,speed:resolveEnemySpeed(enemyKind, base, profile, 0.55, 0.08),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:resolveEnemyHp(enemyKind, 1, profile),points:resolveEnemyPoints(enemyKind, 1, profile),giant:false,hurtT:0,variant:'classic',enemyType:'normalEnemy3',spawnSystem:profile.sourceSystem||null
    };
  }
  if(enemyKind==='giantEnemy1'){
    const giantStage=(giantKillCount|0)<=0 ? 0.7 : Math.max(0.5, 1 - progress*0.0025);
    return {
      x,y,w:18,h:18,speed:resolveEnemySpeed(enemyKind, base, profile, 0.65*giantStage, 0.18),dir:'left',
      atkT:0,atkCD:95+(Math.random()*50|0),walkF:0,
      hp:resolveEnemyHp(enemyKind, 3, profile),points:resolveEnemyPoints(enemyKind, 5, profile),giant:true,hurtT:0,variant:'new',enemyType:'giantEnemy1',spawnSystem:profile.sourceSystem||null
    };
  }
  if(enemyKind==='wizardEnemy1'){
    return {
      x,y,w:8,h:8,speed:resolveEnemySpeed(enemyKind, base, profile, 0.45, 0.14),dir:'left',
      atkT:0,atkCD:160+(Math.random()*60|0),walkF:0,
      hp:resolveEnemyHp(enemyKind, 1, profile),points:resolveEnemyPoints(enemyKind, 3, profile),giant:false,wizard:true,hurtT:0,shootCD:0,enemyType:'wizardEnemy1',spawnSystem:profile.sourceSystem||null
    };
  }
  return null;
}

function createZone2EnemyGameObject(kind, x, y, context){

  return createStandardEnemyGameObject(kind, x, y, 2, Object.assign({source:'zone2-compat'}, context || {}));
}

function applyEnemySpawnAnimation(enemy, animation='walkIn', ticks=32, opts={}){
  if(!enemy || !animation || animation === 'none') return enemy;
  const duration=Math.max(1, Number(ticks)||32);
  enemy.spawnAnim=animation;
  enemy.spawnT=duration;
  enemy.spawnMax=duration;
  enemy.spawnInvulnerable=opts.invulnerable === false ? false : true;
  enemy.spawnFreeze=opts.freeze === false ? false : true;
  return enemy;
}

function doSpawn(giant, wizard, type){
  const side=Math.random()*4|0;
  let x,y;
  if(side===0){x=PX+Math.random()*(PW-8);y=PY-10;}
  else if(side===1){x=PX+PW+2;y=PY+Math.random()*(PH-8);}
  else if(side===2){x=PX+Math.random()*(PW-8);y=PY+PH+4;}
  else{x=PX-10;y=PY+Math.random()*(PH-8);}

  const enemyKind=wizard ? 'wizardEnemy1' : (giant ? 'giantEnemy1' : (type || pickRegularEnemyType()));
  const enemy=createStandardEnemyGameObject(enemyKind, x, y, currentZone, {source:'queued-standard-spawn'});
  if(enemy){ enemies.push(applyEnemySpawnAnimation(enemy, 'walkIn', 32, { freeze:false })); try{ if(window.AudioEvents) AudioEvents.skeletonSpawn(); }catch(err){} }
}

