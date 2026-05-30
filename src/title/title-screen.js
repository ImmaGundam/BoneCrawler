// BoneCrawler title screen module
(function(){
  'use strict';

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

  window.BoneCrawlerTitleScreen = {
    id: 'title',
    label: 'TITLE SCREEN',
    isActive: isTitleState,
    enter,
    leave,
    beforeRender,
    render,
  };

  function wrappedTitleRenderer(){
    return window.BoneCrawlerTitleScreen.render();
  }

  try{ rTitle = wrappedTitleRenderer; }catch(err){}
  window.rTitle = wrappedTitleRenderer;
})();
