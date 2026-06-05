// BoneCrawler title screen module
(function(){
  'use strict';
  const runtimeApi = window.GameRuntimeApi || null;

  const originalTitleRenderer = window.rTitle;
  let activeLastFrame = false;
  let titleLoadErrorShown = false;

  function isTitleState(){
    try{
      return gState === 'title' || gState === 'intro' || gState === 'intro_fade' || gState === 'scoreboard';
    }catch(err){
      return false;
    }
  }

  function enter(){
    activeLastFrame = true;
    window.BoneCrawlerActiveScreen = 'title';
  }

  function leave(){
    activeLastFrame = false;
    if(window.BoneCrawlerActiveScreen === 'title') window.BoneCrawlerActiveScreen = '';
  }

  function beforeRender(){
    if(isTitleState()) enter();
    else if(activeLastFrame) leave();
  }

  function render(){
    beforeRender();
    if(typeof originalTitleRenderer === 'function'){
      originalTitleRenderer();
      return;
    }
    if(!titleLoadErrorShown){
      titleLoadErrorShown = true;
      console.error('Title image load error');
    }
  }

  const api = {
    id: 'title',
    label: 'TITLE SCREEN',
    isActive: isTitleState,
    enter,
    leave,
    beforeRender,
    render,
  };
  if(runtimeApi && typeof runtimeApi.register === 'function') runtimeApi.register('titleScreen', api, { legacy: ['BoneCrawlerTitleScreen'] });
  else window.BoneCrawlerTitleScreen = api;

  function wrappedTitleRenderer(){
    const titleScreen = (runtimeApi && runtimeApi.lookup('titleScreen', ['BoneCrawlerTitleScreen'])) || window.BoneCrawlerTitleScreen || api;
    return titleScreen.render();
  }

  try{ rTitle = wrappedTitleRenderer; }catch(err){}
  window.rTitle = wrappedTitleRenderer;
})();
