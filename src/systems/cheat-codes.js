// cheat-codes
// Purpose: name-entry cheat codes separate from menu/startup and spawn/progression internals.
(function(){
  if(window.BoneCrawlerCheatCodes) return;

  const codeMap = {
    'link':'link',
    'doodoorocks':'doodoorocks',
    'circa90x':'circa90x',
    'itsasecret':'itsasecret',
    'devsecret':'devsecret',
    'whydragons':'whydragons',
    'zone2':'zone2',
    'zone3':'zone3'
  };

  function normalize(value){
    return String(value || '').trim().toLowerCase();
  }

  function detect(name){
    return codeMap[normalize(name)] || null;
  }

  function apply(code){
    code = detect(code) || normalize(code);
    if(!code || !player) return false;
    const p = player;

    if(code === 'link'){
      p.swordLevel=3; p.swordReach=11+3*6; p.swordWidth=1;
      p.speedLevel=3; p.speed=PLAYER_BASE_SPEED+3*SPEED_UP_STEP;
      p.shield=true; p.shieldLevel=3;
      p.shadowStep=true; p.stepLevel=3;
      p.hp=p.maxHp; p.visibleHearts=5;
      masterSwordOwned=true; whirlwindUnlocked=true;
      p.swordLevel=Math.max(p.swordLevel,MASTER_SWORD_START_LEVEL);
      p.swordReach=Math.max(p.swordReach,MASTER_SWORD_START_REACH);
      p.swordWidth=Math.max(p.swordWidth,MASTER_SWORD_START_WIDTH);
      potionCount=1;
      return true;
    }

    if(code === 'doodoorocks'){
      p.swordLevel=7; p.swordReach=11+7*6;
      p.speedLevel=7; p.speed=Math.min(MAX_PLAYER_SPEED,PLAYER_BASE_SPEED+7*SPEED_UP_STEP);
      return true;
    }

    if(code === 'circa90x'){
      p.shield=true; p.shieldLevel=1;
      p.hp=1; p.visibleHearts=3;
      return true;
    }

    return false;
  }

  function beginCheatRun(){
    clearGameplayKeys();
    if(startupDialogPending) beginStartupSceneTransition();
    else beginPlayableRun();
  }

  function beginWhyDragonsRunDirect(){
    clearGameplayKeys();
    startupDialogPending = false;
    startupDialogCompletedThisRun = true;
    startupSceneFadeT = 0;
    startupScenePauseStartMs = 0;
    dialogPages = [];
    dialogPageIndex = 0;
    dialogMode = '';
    beginPlayableRun();
  }

  function spawnWhyDragonsKey(){
    if(!player || player.zone1DoorKey || hasKeyDropKind('zone1Door')) return false;
    const x = Math.max(PX+2, Math.min(PX+PW-6, Math.round(player.x + player.w + 3)));
    const y = Math.max(PY+2, Math.min(PY+PH-6, Math.round(player.y + player.h/2 - 3)));
    spawnKeyDrop(x, y, 'zone1Door');
    floatTexts.push({x:x+3,y:y-8,text:'ZONE 1 KEY!',life:70,max:70,col:C.FR1});
    return true;
  }

  function runWhyDragons(){
    currentZone = 1;
    if(window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.enterZone === 'function'){
      BoneCrawlerZoneSpawn.enterZone(1);
    }
    beginWhyDragonsRunDirect();
    spawnWhyDragonsKey();

    if(typeof spawnDragonBoss === 'function' && !dragonBoss && !zone1MiniBossDefeated){
      spawnDragonBoss();
    }
    if(typeof spawnWhyDragonsBoss === 'function' && !whyDragonsBoss){
      spawnWhyDragonsBoss();
    }
    floatTexts.push({x:GW/2,y:PY+34,text:'WHY DRAGONS?',life:90,max:90,col:C.MG2});
    return true;
  }

  function start(code){
    code = detect(code) || normalize(code);
    if(!code) return false;

    if(code === 'itsasecret'){
      clearGameplayKeys();
      enterSecretZone1();
      if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun();
      return true;
    }
    if(code === 'devsecret'){
      clearGameplayKeys();
      enterSecretZone2();
      if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun();
      return true;
    }
    if(code === 'whydragons') return runWhyDragons();
    if(code === 'zone2'){
      enterZone2();
      clearGameplayKeys();
      if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun();
      return true;
    }
    if(code === 'zone3'){
      enterZone3();
      clearGameplayKeys();
      if(startupDialogPending) beginStartupSceneTransition(); else beginPlayableRun();
      return true;
    }

    if(introSeenThisPage){
      introStartMs=0;
      introPage=0;
      if(startupDialogPending) beginStartupSceneTransition();
      else beginPlayableRun();
    } else {
      introStartMs=performance.now();
      introPage=0;
      gState='intro';
    }
    return true;
  }

  window.BoneCrawlerCheatCodes = {detect, get:detect, apply, start, runWhyDragons};
})();
