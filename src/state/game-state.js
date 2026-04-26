// BoneCrawler safe split module
// Purpose: Global runtime state variables, zone IDs, boss constants, item constants, and secret-zone geometry.
// Source: app.js lines 1260-1471
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Game state ────────────────────────────────────────────────
const ZONE_TRANSITION_CONTINUE_BTN={x:35,y:99,w:50,h:10};
const RETRY_CONFIRM_YES_BTN={x:24,y:92,w:28,h:10};
const RETRY_CONFIRM_NO_BTN={x:68,y:92,w:28,h:10};
const SECRET2_SWORD_CONFIRM_YES_BTN={x:24,y:92,w:28,h:10};
const SECRET2_SWORD_CONFIRM_NO_BTN={x:68,y:92,w:28,h:10};
const LEAVE_ZONE_CONFIRM_YES_BTN={x:24,y:92,w:28,h:10};
const LEAVE_ZONE_CONFIRM_NO_BTN={x:68,y:92,w:28,h:10};
const RETRY_POINT_SACRIFICE=0.30;
const WHIRLWIND_HOLD_FRAMES=24;
const WHIRLWIND_COOLDOWN_FRAMES=5*60;

let gState='title';
let player, enemies, parts, pSpawns, frame, score, prevSpc;
let killCount, nextChestAt, nextGiantAt, chest, floatTexts, heartDrops, potionDrops, shockwaves, keyDrop, currentZone;
let zone1Broken, zone1Rubble, zone2Broken, zone3Broken;
let fireballs, nextWizardAt, giantKillInterval, wizardKillInterval;
let normalKillCount=0, giantKillCount=0, wizardKillCount=0;
let zone3TreeHits=0, zone3TreeShakeT=0, zone3TreeAwake=false, zone3TreeMet=false;
let pendingZoneTransition=0;
let zoneTransitionInfo=null;
let leaveZonePromptData=null;
let dragonBoss=null, dragonFlames=[], dragonSwipe=null, bossDefeated=false, zone1MiniBossDefeated=false, pendingZone1DragonSpawn=false;
let shadowBoss=null, shadowWaves=[], shadowBossDefeated=false, shadowWizardRespawns=[];
let bossClearTimer=0;
let secret1BlessingT=0;
let secret2NpcMet=false;
let secret1RatTalkCount=0;
let secret1NodeSpoken=false;
let zone1DoorKeyDialogShown=false;
let zone1Kill90DialogShown=false;
let zone1Kill109DialogShown=false;
let zone2IntroDialogShown=false;
let zone2Kill30DialogShown=false;
let zone3IntroDialogShown=false;
let zone3Kill80DialogShown=false;
let zone3BossDefeatDialogShown=false;
let startupDialogCompletedThisRun=false;
let dialogPages=[];
let dialogPageIndex=0;
let dialogTitle='WOUNDED STRANGER';
let dialogMode='npc';
let currentPlayerName=loadPlayerName()||'Player';
let scoreboardEntries=loadScores();
let scoreboardPage=0;
let runStartMs=0, runSaved=false, runTimeMs=0, pauseStartedMs=0, runCompleted=false;
let zone1KillStart=0;
let zone2KillStart=0;
let zone3KillStart=0;
let introStartMs=0;
let introPage=0;
let introSeenThisPage=false;
let introFadeT=0, introFadeMax=20;
let startupSceneFadeT=0, startupSceneFadeMax=20;
let startupScenePauseStartMs=0;
const STARTUP_SCENE_DIALOG_DELAY_MS=1500;
const INTRO_PAGE_COUNT=3;
const STARTUP_GAME_DIALOG_PAGES=[
  {speaker:'NODE',lines:['Welcome BoneCrawler..!','This dungeon will serve as your','training since waking up.','Good luck.']},
  {speaker:'NODE',lines:['.. and if you see a Dragon,','well..',"I'm glad I mentioned it now."]},
  {speaker:'PLAYER',lines:["I don't deal with dragons."]},
  {speaker:'NODE',lines:['You do now.', ".. and don't forget the corrupted."]},     
  {speaker:'PLAYER',lines:["That's great..",'I need to get out of this room.','There should be a key somewhere..']},
];
let mouseAttackQueued=false;
let mouseAttackHeld=false;
let touchMoveActive=false;
let touchStartX=0, touchStartY=0, touchX=0, touchY=0, touchStartTime=0;
let touchIdentifier=null;
let touchAttackChargeActive=false;
let touchAttackReleaseQueued=false;
let touchAttackCancelQueued=false;
let touchAttackMoved=false;
const TOUCH_ATTACK_CANCEL_MOVE_PX=18;
let devGodMode=false;
let retryCheckpoint=null;
let retryTaxPaid=false;
let retryPromptMode='';
let secret1UnlockAlertShown=false;
let secret1UnlockAlertT=0;
let startupDialogPending=false;
let newGamePlus=false;
let masterSwordOwned=false;
let whirlwindUnlocked=false;
let masterSwordDialogSeen=false;
let whirlwindLearnDialogSeen=false;
let pendingRewardDialogs=[];
let whirlwindChargeT=0;
let whirlwindCooldownT=0;
let whirlwindSlashT=0;
let dodgeCooldownT=0;
let potionCount=0;
let potionDialogSeenThisRun=false;
const DEV_GOD_SPEED_MULT=1.85;

const ITEM_TTL_FRAMES=15*60;
const ITEM_FADE_FRAMES=5*60;
const BREAKABLE_HALF_HEART_DROP_CHANCE=0.10;
const ZONE3_TREE_HITS_TO_WAKE=5;
const ZONE1_CHEST_KILL_STEP=10;
const ZONE2_CHEST_KILL_STEP=15;
const ZONE2_FIRST_CHEST_DELAY=18;
const ZONE1_ZONE2_KEY_KILLS=50;
const ZONE1_SECRET_KEY_KILLS=150;
const ZONE1_DRAGON_MINIBOSS_KILLS=300;
const ZONE1_DRAGON_PHASE_HITS=10;
const ZONE2_KEY_KILLS=50;
const DRAGON_BOSS_TRIGGER_KILLS=100;
const ZONE3_CHEST_KILL_STEP=18;
const ZONE3_FIRST_CHEST_DELAY=22;
const ZONE3_KEY_KILLS=300;
const ZONE3_BOSS_TRIGGER_KILLS=ZONE3_KEY_KILLS;
const SHADOW_PHASE_HITS=10;
const SHADOW_HOWL_FRAMES=180;
const SHADOW_WAVE_INTERVAL=18;
const SHADOW_PHASE1_LUNGE_BONUS_DISTANCE=2;
const SHADOW_PHASE2_LUNGE_BONUS_DISTANCE=1;
const SHADOW_SCREECH_STARTUP_FRAMES=2*60;
const SHADOW_SCREECH_DURATION_FRAMES=2*60;
const SHADOW_SCREECH_WAVE_INTERVAL=18;
const CRAWLER_WIZARD_RESPAWN_FRAMES=4*60;
const ZONE_SECRET1=101;
const ZONE_SECRET2=102;
const SECRET2_SCORE_REQ=999;
const SECRET1_BLESSING_FRAMES=170;
const ZONE3_DOOR_RECT={x:GW/2-5,y:PY-2,w:10,h:10};
const SECRET1_ENTRANCE_RECT={x:PX+3,y:PY+24,w:4,h:10};
const SECRET1_EXIT_DOOR_RECT={x:GW/2-5,y:PY-2,w:10,h:10};
function zone1SecretEntranceReady(){
  return currentZone===1 && !!player && !!player.secret1Key && !hasKeyDropKind('secret1') && enemies.length===0 && pSpawns.length===0;
}
const SECRET1_POOL_BLOCKERS=[];
const SECRET1_POOL_WATER_RECT={x:GW/2-25,y:PY+25,w:50,h:20};
const SECRET2_NPC_RECT={x:GW/2-18,y:PY+68,w:12,h:8};
const SECRET2_SWORD_RECT={x:GW/2-6,y:PY+24,w:12,h:24};
const ZONE3_TREE_RECT={x:PX+13,y:PY+PH-28,w:16,h:22};
const ZONE3_TREE_INTERACT_RECT={x:PX+8,y:PY+PH-26,w:22,h:18};
const ZONE3_SECRET2_PORTAL_RECT={x:GW/2-6,y:PY+57,w:12,h:12};
const SECRET1_RAT_RECT={x:PX+10,y:PY+10,w:8,h:6};
const SECRET1_RAT_INTERACT_RECT={x:PX+7,y:PY+7,w:15,h:12};
const SECRET1_CHEESE_RECT={x:PX+20,y:PY+12,w:6,h:4};
const SECRET2_RETURN_PORTAL_RECT={x:PX+PW-18,y:PY+70,w:12,h:12};
const SECRET2_STONE_BLOCKERS=[
  {x:GW/2-5,y:PY+42,w:10,h:7},
];
function isSecret1WaterZone(box){
  return !!box && ov(box, SECRET1_POOL_WATER_RECT);
}

const ZONE3_TREE_BLOCKERS=[
  {x:PX+15,y:PY+PH-20,w:12,h:10},
  {x:PX+10,y:PY+PH-12,w:20,h:7},
];
const ZONE3_EXTRA_BLOCKERS=[
  {x:PX+PW-18,y:PY+PH-11,w:7,h:7},
];
const ZONE3_DECOR_BREAK_RECTS=[
  {x:PX+2,y:PY+22,w:6,h:17},
  {x:PX+PW-8,y:PY+20,w:6,h:17},
  {x:GW/2-7,y:PY+35,w:15,h:13},
  {x:PX+PW-25,y:PY+PH-13,w:6,h:8},
  {x:PX+PW-10,y:PY+PH-12,w:6,h:8},
];
const ZONE3_DECOR_BLOCKERS=[
  {x:PX+2,y:PY+33,w:6,h:6},
  {x:PX+PW-8,y:PY+31,w:6,h:6},
  {x:GW/2-6,y:PY+41,w:12,h:8},
  {x:PX+PW-25,y:PY+PH-13,w:6,h:8},
  {x:PX+PW-10,y:PY+PH-12,w:6,h:8},
  ...ZONE3_TREE_BLOCKERS,
  ...ZONE3_EXTRA_BLOCKERS,
];
const DRAGON_PHASE_HITS=20;
const DRAGON_SUMMON_INTERVAL=7*60;
const DRAGON_MAX_NORMAL_ADDS=4;
const DRAGON_MAX_WIZARDS=2;
const DRAGON_FIREBLAST_TTL=40;
const DRAGON_TAIL_TTL=16;

function maxEnemies(){ return Math.min(6, 1+Math.floor(killCount/4)); }

function pushDevFloat(text,col=C.FR1){
  if(!floatTexts) return;
  floatTexts.push({x:GW/2,y:PY+12,text,life:55,max:55,col});
}

function setDevGodMode(enabled){
  devGodMode=!!enabled;
  if(player){
    player.dead=false;
    player.hp=player.maxHp;
    player.hurtT=0;
    player.shield=true;
    player.shieldBreakT=0;
    player.visibleHearts=Math.max(player.visibleHearts||3, Math.min(5, Math.ceil(player.hp/2)));
  }
  pushDevFloat(devGodMode?'GOD MODE ON':'GOD MODE OFF', devGodMode?C.MG2:C.WH);
}

function toggleDevGodMode(){
  setDevGodMode(!devGodMode);
}

function isGodName(name=currentPlayerName){
  const clean=String(name||'').trim().toLowerCase();
  return clean==='immagundam';
}
function syncNameGodMode(){
  const shouldEnable=isGodName(currentPlayerName);
  if(shouldEnable!==!!devGodMode) setDevGodMode(shouldEnable);
}

