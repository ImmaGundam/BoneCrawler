// performance-runtime
// Purpose: Fixed-step RAF throttling and visibility-aware loop pacing.
(function(){
  'use strict';
  if(window.BoneCrawlerPerformance) return;

  const TARGET_FPS = 60;
  const FRAME_MS = 1000 / TARGET_FPS;
  const MAX_CATCHUP_STEPS = 3;
  let pageVisible = !document.hidden;

  document.addEventListener('visibilitychange', function(){
    pageVisible = !document.hidden;
  });

  window.BoneCrawlerPerformance = {
    TARGET_FPS,
    FRAME_MS,
    MAX_CATCHUP_STEPS,
    isPageVisible(){ return pageVisible; }
  };
})();
