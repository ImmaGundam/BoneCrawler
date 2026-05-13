// game loop
// Purpose: Main requestAnimationFrame loop
// ── Loop ──────────────────────────────────────────────────────

let __bcLoopStarted = false;

function loop(now){
  tickSceneClock(now);
  update();
  render();
  requestAnimationFrame(loop);
}

function startLoop(){
  if (__bcLoopStarted) return;
  __bcLoopStarted = true;
  requestAnimationFrame(loop);
}

// Start immediately
startLoop();