// BoneCrawler safe split module
// Purpose: Reset/start/retry flow, checkpoints, queued reward dialogs, New Game Plus startup flow.
// Source: app.js lines 1806-2096
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function resetGame(){
  player={
    x:GW/2-4, y:GH/2, w:8, h:8, speed:PLAYER_BASE_SPEED,
    dir:'down', hp:6, maxHp:10, visibleHearts:3,
    atkT:0, atkCD:0, hurtT:0, walkF:0, dead:false,
    swordReach:11, swordLevel:0, swordWidth:1,
    shield:false, shieldBreakT:0, shieldLevel:0,
    speedLevel:0, hasKey:false, zone1DoorKey:false, secret1Key:false, zone2Key:false,
    shadowStep:false, stepLevel:0, dodgeInvulnT:0,
  };
  pendingRewardDialogs=[];
  if(masterSwordOwned){
    player.swordLevel=Math.max(player.swordLevel||0, MASTER_SWORD_START_LEVEL);
    player.swordReach=Math.max(player.swordReach||11, MASTER_SWORD_START_REACH);
    player.swordWidth=Math.max(player.swordWidth||1, MASTER_SWORD_START_WIDTH);
    player.hp=player.maxHp;
    player.visibleHearts=Math.max(player.visibleHearts||3, MASTER_SWORD_START_HEART_SLOTS);
  }
  if(newGamePlus){
    player.hp=player.maxHp;
    player.visibleHearts=Math.max(player.visibleHearts||3, MASTER_SWORD_START_HEART_SLOTS);
  }
  enemies=[]; parts=[]; pSpawns=[]; frame=0; score=0; prevSpc=false;
  killCount=0; nextChestAt=10; nextGiantAt=GIANT_KILL_INTERVAL_START; chest=null; floatTexts=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; keyDrop=[]; fireballs=[]; nextWizardAt=WIZARD_KILL_INTERVAL_START; giantKillInterval=GIANT_KILL_INTERVAL_START; wizardKillInterval=WIZARD_KILL_INTERVAL_START; currentZone=1;
  zone1KillStart=0; zone2KillStart=0; zone3KillStart=0;
  normalKillCount=0; giantKillCount=0; wizardKillCount=0;
  pendingZoneTransition=0;
  zoneTransitionInfo=null;
  leaveZonePromptData=null;
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  shadowBoss=null; shadowWaves=[]; shadowBossDefeated=false; shadowWizardRespawns=[];
  bossClearTimer=0;
  secret1BlessingT=0;
  secret2NpcMet=false;
  secret1RatTalkCount=0;
  secret1NodeSpoken=false;
  zone1DoorKeyDialogShown=false;
  zone1Kill90DialogShown=false;
  zone1Kill109DialogShown=false;
  zone2IntroDialogShown=false;
  zone2Kill30DialogShown=false;
  zone3IntroDialogShown=false;
  zone3Kill80DialogShown=false;
  zone3BossDefeatDialogShown=false;
  startupDialogCompletedThisRun=false;
  dialogPages=[];
  dialogPageIndex=0;
  dialogTitle='WOUNDED STRANGER';
  dialogMode='npc';
  zone1Broken=Array(ZONE1_DECOR_BREAK_RECTS.length).fill(false);
  zone1Rubble=[];
  zone2Broken=Array(ZONE2_DECOR_BREAK_RECTS.length).fill(false);
  zone3Broken=Array(ZONE3_DECOR_BREAK_RECTS.length).fill(false);
  runStartMs=performance.now();
  runSaved=false;
  runTimeMs=0;
  pauseStartedMs=0;
  runCompleted=false;
  retryCheckpoint=null;
  retryTaxPaid=false;
  retryPromptMode='';
  secret1UnlockAlertShown=false;
  secret1UnlockAlertT=0;
  whirlwindChargeT=0;
  whirlwindCooldownT=0;
  whirlwindSlashT=0;
  dodgeCooldownT=0;
  potionCount=0;
  potionDialogSeenThisRun=false;
  zone3TreeHits=0;
  zone3TreeShakeT=0;
  zone3TreeAwake=false;
  zone3TreeMet=false;
  rollUpgradeChoices();
  qSpawn(80, false, false, 'normalEnemy1');
  qSpawn(92, false, false, 'normalEnemy3');
}


function createZoneRetryCheckpoint(zone){
  if(zone!==2 && zone!==3) return;
  retryCheckpoint={
    zone,
    score:Math.max(0, score|0),
    killCount:Math.max(0, killCount|0),
    normalKillCount:Math.max(0, normalKillCount|0),
    giantKillCount:Math.max(0, giantKillCount|0),
    wizardKillCount:Math.max(0, wizardKillCount|0),
    nextGiantAt:Math.max(GIANT_KILL_INTERVAL_START, nextGiantAt|0),
    giantKillInterval:Math.max(GIANT_KILL_INTERVAL_MIN, giantKillInterval|0),
    nextWizardAt:Math.max(WIZARD_KILL_INTERVAL_START, nextWizardAt|0),
    wizardKillInterval:Math.max(WIZARD_KILL_INTERVAL_MIN, wizardKillInterval|0),
    player:{
      hp:player.hp,
      maxHp:player.maxHp,
      visibleHearts:player.visibleHearts||3,
      swordReach:player.swordReach||11,
      swordLevel:player.swordLevel||0,
      swordWidth:Math.max(1, player.swordWidth||1),
      shield:!!player.shield,
      shieldLevel:player.shieldLevel||0,
      speed:player.speed||PLAYER_BASE_SPEED,
      speedLevel:player.speedLevel||0,
      dir:player.dir||'down',
      zone1DoorKey:!!player.zone1DoorKey,
      secret1Key:!!player.secret1Key,
      zone2Key:!!player.zone2Key,
      shadowStep:!!player.shadowStep,
      stepLevel:player.stepLevel||0
    },
    potionCount:Math.max(0,potionCount|0),
    zone3TreeHits:Math.max(0, zone3TreeHits|0),
    zone3TreeAwake:!!zone3TreeAwake,
    zone3TreeMet:!!zone3TreeMet,
    secret1NodeSpoken:!!secret1NodeSpoken
  };
}

function getRetryZoneLabel(zone){
  if(zone===2) return 'Zone 2';
  if(zone===3) return 'Zone 3';
  if(zone===ZONE_SECRET2) return 'Secret Zone 2';
  return 'Zone 1';
}

function queueRewardDialog(title, pages){
  if(!pages || !pages.length) return false;
  pendingRewardDialogs.push({
    title:title||'REWARD',
    pages:pages.map(page=>page.slice())
  });
  return true;
}
function openQueuedRewardDialog(){
  if(!pendingRewardDialogs.length) return false;
  const next=pendingRewardDialogs.shift();
  dialogTitle=next.title||'REWARD';
  dialogMode='reward';
  dialogPages=next.pages.map(page=>page.slice());
  dialogPageIndex=0;
  clearGameplayKeys();
  gState='dialog';
  return true;
}
function getMasterSwordRewardPages(){
  return [[
    'MASTER SWORD',
    'NEW RUNS START WITH',
    'SWORD LV '+MASTER_SWORD_START_LEVEL,
    'RANGE '+MASTER_SWORD_DISPLAY_RANGE,
    'MAX HEALTH'
  ]];
}
function queueWhirlwindLearnDialog(){
  if(whirlwindLearnDialogSeen) return false;
  whirlwindLearnDialogSeen=true;
  return queueRewardDialog('SKILL LEARNED', [[
    'WHIRLWIND SLASH',
    'HOLD ATTACK',
    'THEN RELEASE'
  ]]);
}
function queueShadowStepDialog(){
  return queueRewardDialog('SKILL LEARNED', [[
    'SHADOW STEP',
    'PRESS SHIFT TO DODGE',
    'BRIEF INVINCIBILITY'
  ]]);
}
function queuePotionAcquireDialog(){
  return queueRewardDialog('ITEM ACQUIRED', [[
    'HEALTH POTION',
    'PRESS P TO HEAL',
    'RESTORES 1 HEART'
  ]]);
}
function queueMasterSwordRewardDialog(){
  if(masterSwordDialogSeen) return false;
  masterSwordDialogSeen=true;
  queueRewardDialog('ITEM ACQUIRED', getMasterSwordRewardPages());
  if(!whirlwindLearnDialogSeen) queueWhirlwindLearnDialog();
  return true;
}
function startNgPlusDialog(){
  masterSwordDialogSeen=true;
  dialogTitle='ITEM ACQUIRED';
  dialogMode='reward';
  dialogPages=getMasterSwordRewardPages();
  dialogPageIndex=0;
  clearGameplayKeys();
  startupDialogPending=false;
  gState='dialog';
}

function openRetryPrompt(){
  if(!retryCheckpoint || retryCheckpoint.zone<2){
    startGame();
    return;
  }
  retryPromptMode = retryTaxPaid ? 'free' : 'cost';
  clearGameplayKeys();
  gState='retry_confirm';
}

function restoreRetryCheckpoint(){
  const cp=retryCheckpoint;
  if(!cp){
    startGame();
    return;
  }

  const scoreBase=Math.max(0, cp.score|0);
  if(!retryTaxPaid){
    score=Math.max(0, Math.floor(scoreBase*(1-RETRY_POINT_SACRIFICE)));
    retryTaxPaid=true;
  } else {
    score=scoreBase;
  }

  killCount=Math.max(0, cp.killCount|0);
  normalKillCount=Math.max(0, cp.normalKillCount|0);
  giantKillCount=Math.max(0, cp.giantKillCount|0);
  wizardKillCount=Math.max(0, cp.wizardKillCount|0);
  nextGiantAt=Math.max(GIANT_KILL_INTERVAL_START, cp.nextGiantAt|0);
  giantKillInterval=Math.max(GIANT_KILL_INTERVAL_MIN, cp.giantKillInterval|0);
  nextWizardAt=Math.max(WIZARD_KILL_INTERVAL_START, cp.nextWizardAt|0);
  wizardKillInterval=Math.max(WIZARD_KILL_INTERVAL_MIN, cp.wizardKillInterval|0);
  if(!cp.nextGiantAt || !cp.nextWizardAt) syncKillSpawnSchedulesFromCount();
  chest=null; clearKeyDrops();
  enemies=[]; pSpawns=[]; heartDrops=[]; potionDrops=[]; shockwaves=[]; fireballs=[]; parts=[];
  dragonBoss=null; dragonFlames=[]; dragonSwipe=null; bossDefeated=false; zone1MiniBossDefeated=false; pendingZone1DragonSpawn=false;
  shadowBoss=null; shadowWaves=[]; shadowBossDefeated=false; shadowWizardRespawns=[];
  bossClearTimer=0;
  zone1Broken=Array(ZONE1_DECOR_BREAK_RECTS.length).fill(false);
  zone1Rubble=[];
  zone2Broken=Array(ZONE2_DECOR_BREAK_RECTS.length).fill(false);
  zone3Broken=Array(ZONE3_DECOR_BREAK_RECTS.length).fill(false);
  secret1BlessingT=0;
  dialogPages=[];
  dialogPageIndex=0;
  leaveZonePromptData=null;
  pendingRewardDialogs=[];
  whirlwindChargeT=0;
  whirlwindSlashT=0;
  dodgeCooldownT=0;
  runSaved=false;
  runCompleted=false;
  runStartMs=performance.now();
  runTimeMs=0;
  pauseStartedMs=0;
  zone2IntroDialogShown=false;
  zone2Kill30DialogShown=false;
  zone3IntroDialogShown=false;
  zone3Kill80DialogShown=false;
  zone3BossDefeatDialogShown=false;

  if(cp.zone===2) enterZone2();
  else enterZone3();

  player.maxHp=cp.player.maxHp||player.maxHp;
  player.hp=player.maxHp;
  player.visibleHearts=Math.max(5, cp.player.visibleHearts||player.visibleHearts);
  player.swordReach=cp.player.swordReach||player.swordReach;
  player.swordLevel=cp.player.swordLevel||0;
  player.swordWidth=Math.max(1, cp.player.swordWidth||1);
  player.zone1DoorKey=!!cp.player.zone1DoorKey;
  player.secret1Key=!!cp.player.secret1Key;
  player.zone2Key=!!cp.player.zone2Key;
  player.shadowStep=!!cp.player.shadowStep;
  player.stepLevel=cp.player.stepLevel||0;
  player.dodgeInvulnT=0;
  potionCount=Math.max(0, cp.potionCount|0);
  zone3TreeHits=Math.max(0, cp.zone3TreeHits|0);
  zone3TreeAwake=!!cp.zone3TreeAwake;
  zone3TreeMet=!!cp.zone3TreeMet;
  secret1NodeSpoken=!!cp.secret1NodeSpoken;
  zone3TreeShakeT=0;
  player.shield=!!cp.player.shield;
  player.shieldLevel=cp.player.shieldLevel||0;
  player.speed=cp.player.speed||player.speed;
  player.speedLevel=cp.player.speedLevel||0;
  player.dir=cp.player.dir||'down';
  player.dead=false;
  player.hurtT=0;
  player.atkT=0;
  player.atkCD=10;

  clearGameplayKeys();
  gState='playing';
}

