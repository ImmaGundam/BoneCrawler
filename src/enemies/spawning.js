// BoneCrawler safe split module
// Purpose: Enemy spawn queue, spawn timing, enemy type selection, standard/zone enemy creation.
// Source: app.js lines 2198-2390
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

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

function getEnemyMoveRateForProgress(progress){
  return Math.min(0.68,0.22+Math.sqrt(Math.max(0, progress))*0.035);
}

function getDefaultEnemyMoveRate(){
  return getEnemyMoveRateForProgress(score);
}

function getBaseEnemyMoveRateForZone(zone=currentZone){
  if(zone===2 || zone===3) return getEnemyMoveRateForProgress(getZoneProgressKills(zone));
  return getDefaultEnemyMoveRate();
}

function getZone2EnemyProgressionValue(){
  return Math.max(0, getZoneProgressKills(2));
}

function getZone2BaseEnemyMoveRate(){
  const defaultRate=getBaseEnemyMoveRateForZone(2);
  const progress=getZone2EnemyProgressionValue();
  return defaultRate * (1 + progress*0.0020);
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

function createStandardEnemyGameObject(kind, x, y, zone=currentZone){
  const base=getBaseEnemyMoveRateForZone(zone);
  const progress=Math.max(0, getZoneProgressKills(zone));

  if(kind==='normalEnemy1'){
    return {
      x,y,w:9,h:9,speed:base,dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'old',enemyType:'normalEnemy1'
    };
  }
  if(kind==='normalEnemy2'){
    return {
      x,y,w:9,h:9,speed:Math.max(0.14, base*0.9),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'new',enemyType:'normalEnemy2'
    };
  }
  if(kind==='normalEnemy3'){
    return {
      x,y,w:9,h:9,speed:Math.max(0.08, base*0.55),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'classic',enemyType:'normalEnemy3'
    };
  }
  if(kind==='giantEnemy1'){
    const giantStage=(giantKillCount|0)<=0 ? 0.7 : Math.max(0.5, 1 - progress*0.0025);
    return {
      x,y,w:18,h:18,speed:Math.max(0.18, base*0.65*giantStage),dir:'left',
      atkT:0,atkCD:95+(Math.random()*50|0),walkF:0,
      hp:3,points:5,giant:true,hurtT:0,variant:'new',enemyType:'giantEnemy1'
    };
  }
  if(kind==='wizardEnemy1'){
    return {
      x,y,w:8,h:8,speed:Math.max(0.14, base*0.45),dir:'left',
      atkT:0,atkCD:160+(Math.random()*60|0),walkF:0,
      hp:1,points:3,giant:false,wizard:true,hurtT:0,shootCD:0,enemyType:'wizardEnemy1'
    };
  }
  return null;
}

function createZone2EnemyGameObject(kind, x, y){
  const base=getZone2BaseEnemyMoveRate();
  const progress=getZone2EnemyProgressionValue();

  if(kind==='normalEnemy1'){
    return {
      x,y,w:9,h:9,speed:base,dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'old',enemyType:'normalEnemy1'
    };
  }
  if(kind==='normalEnemy2'){
    return {
      x,y,w:9,h:9,speed:Math.max(0.14, base*0.9),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'new',enemyType:'normalEnemy2'
    };
  }
  if(kind==='normalEnemy3'){
    return {
      x,y,w:9,h:9,speed:Math.max(0.08, base*0.55),dir:'left',
      atkT:0,atkCD:92+(Math.random()*55|0),walkF:0,
      hp:1,points:1,giant:false,hurtT:0,variant:'classic',enemyType:'normalEnemy3'
    };
  }
  if(kind==='giantEnemy1'){
    const giantStage=(giantKillCount|0)<=0 ? 0.7 : Math.max(0.5, 1 - progress*0.0025);
    return {
      x,y,w:18,h:18,speed:Math.max(0.18, base*0.65*giantStage),dir:'left',
      atkT:0,atkCD:95+(Math.random()*50|0),walkF:0,
      hp:3,points:5,giant:true,hurtT:0,variant:'new',enemyType:'giantEnemy1'
    };
  }
  if(kind==='wizardEnemy1'){
    return {
      x,y,w:8,h:8,speed:Math.max(0.14, base*0.45),dir:'left',
      atkT:0,atkCD:160+(Math.random()*60|0),walkF:0,
      hp:1,points:3,giant:false,wizard:true,hurtT:0,shootCD:0,enemyType:'wizardEnemy1'
    };
  }
  return null;
}

function doSpawn(giant, wizard, type){
  const side=Math.random()*4|0;
  let x,y;
  if(side===0){x=PX+Math.random()*(PW-8);y=PY-10;}
  else if(side===1){x=PX+PW+2;y=PY+Math.random()*(PH-8);}
  else if(side===2){x=PX+Math.random()*(PW-8);y=PY+PH+4;}
  else{x=PX-10;y=PY+Math.random()*(PH-8);}

  if(currentZone===2){
    const enemyKind=wizard ? 'wizardEnemy1' : (giant ? 'giantEnemy1' : (type || pickRegularEnemyType()));
    const enemy=createZone2EnemyGameObject(enemyKind, x, y);
    if(enemy) enemies.push(enemy);
    return;
  }

  const enemyKind=wizard ? 'wizardEnemy1' : (giant ? 'giantEnemy1' : (type || pickRegularEnemyType()));
  const enemy=createStandardEnemyGameObject(enemyKind, x, y, currentZone);
  if(enemy) enemies.push(enemy);
}

