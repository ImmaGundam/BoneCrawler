// title-menu-runtime
// Purpose: Title/startup/name/scoreboard flow owner.
(function(){
  'use strict';

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
    const cheat=getCheatCode(currentPlayerName);
    if(cheat){
      applyCheatCode(cheat);
      startGameWithCheat(cheat);
      return;
    }
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

  function nextScorePage(){
    if(scoreboardPage<totalScorePages()-1) scoreboardPage++;
    return scoreboardPage;
  }

  function prevScorePage(){
    if(scoreboardPage>0) scoreboardPage--;
    return scoreboardPage;
  }

  const api = {
    beginRunFromIntro,
    startGame,
    promptForPlayerName,
    commitPlayerName,
    openScoreboard,
    saveRunIfNeeded,
    totalScorePages,
    scorePageEntries,
    nextScorePage,
    prevScorePage,
  };

  window.BoneCrawlerTitleFlow = api;
  window.beginRunFromIntro = beginRunFromIntro;
  window.startGame = startGame;
  window.promptForPlayerName = promptForPlayerName;
  window.commitPlayerName = commitPlayerName;
  window.openScoreboard = openScoreboard;
  window.saveRunIfNeeded = saveRunIfNeeded;
  window.totalScorePages = totalScorePages;
  window.scorePageEntries = scorePageEntries;
})();
