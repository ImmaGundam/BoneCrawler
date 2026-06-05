// startup-runtime
// Purpose: Core title/startup helpers required by the shipped player runtime.

function getCheatCode(name=currentPlayerName){
  const cheatCodes = (window.GameRuntimeApi && window.GameRuntimeApi.lookup('cheatCodes', ['BoneCrawlerCheatCodes'])) || window.BoneCrawlerCheatCodes;
  if(cheatCodes && typeof cheatCodes.detect === 'function') return cheatCodes.detect(name);
  const clean=String(name||'').trim().toLowerCase();
  const codes={
    'link':'link','doodoorocks':'doodoorocks','circa90x':'circa90x',
    'itsasecret':'itsasecret','devsecret':'devsecret',
    'whydragons':'whydragons','zone2':'zone2','zone3':'zone3',
  };
  return codes[clean]||null;
}

function applyCheatCode(code){
  const cheatCodes = (window.GameRuntimeApi && window.GameRuntimeApi.lookup('cheatCodes', ['BoneCrawlerCheatCodes'])) || window.BoneCrawlerCheatCodes;
  if(cheatCodes && typeof cheatCodes.apply === 'function'){
    cheatCodes.apply(code);
    return;
  }
}

function openStartupGameDialog(){
  startupDialogCompletedThisRun=false;
  startupDialogPending=false;
  startupScenePauseStartMs=0;
  if(typeof enterDialogState === 'function'){
    enterDialogState('NODE', STARTUP_GAME_DIALOG_PAGES, 'opening');
    return;
  }
  dialogTitle='NODE';
  dialogMode='opening';
  dialogPages=STARTUP_GAME_DIALOG_PAGES.map(page=>({
    speaker:(page.speaker||'NODE').toUpperCase(),
    lines:(page.lines||[]).slice()
  }));
  dialogPageIndex=0;
  clearGameplayKeys();
  dialogAdvanceUnlockUntilMs=performance.now()+DIALOG_ADVANCE_GRACE_MS;
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
  const cheatCodes = (window.GameRuntimeApi && window.GameRuntimeApi.lookup('cheatCodes', ['BoneCrawlerCheatCodes'])) || window.BoneCrawlerCheatCodes;
  if(cheatCodes && typeof cheatCodes.start === 'function'){
    if(cheatCodes.start(code)) return;
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

window.getCheatCode = getCheatCode;
window.applyCheatCode = applyCheatCode;
window.openStartupGameDialog = openStartupGameDialog;
window.beginStartupSceneTransition = beginStartupSceneTransition;
window.beginPlayableRun = beginPlayableRun;
window.startGameWithCheat = startGameWithCheat;
