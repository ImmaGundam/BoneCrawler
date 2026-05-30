// game loop
// Purpose: Fixed-timestep simulation with configurable render cap.
// ── Loop ──────────────────────────────────────────────────────

let __bcLoopStarted = false;
let __bcLoopLastMs = 0;
let __bcUpdateAccumulatorMs = 0;
let __bcRenderAccumulatorMs = 0;

function resetLoopClock(now=performance.now()){
  __bcLoopLastMs = now;
  __bcUpdateAccumulatorMs = 0;
  __bcRenderAccumulatorMs = getRenderStepMs();
}

function loop(now){
  tickSceneClock(now);

  if(!__bcLoopLastMs){
    resetLoopClock(now);
  }

  let deltaMs = now - __bcLoopLastMs;
  __bcLoopLastMs = now;

  if(!Number.isFinite(deltaMs) || deltaMs < 0) deltaMs = 0;
  const maxDeltaMs = getGameMaxDeltaMs();
  if(deltaMs > maxDeltaMs) deltaMs = maxDeltaMs;

  __bcUpdateAccumulatorMs += deltaMs;
  __bcRenderAccumulatorMs += deltaMs;

  const simulationStepMs = getSimulationStepMs();
  const renderStepMs = getRenderStepMs();
  const maxCatchUpSteps = getGameMaxCatchUpSteps();

  let steps = 0;
  while(__bcUpdateAccumulatorMs >= simulationStepMs && steps < maxCatchUpSteps){
    update();
    __bcUpdateAccumulatorMs -= simulationStepMs;
    steps++;
  }

  if(steps >= maxCatchUpSteps && __bcUpdateAccumulatorMs >= simulationStepMs){
    __bcUpdateAccumulatorMs = 0;
  }

  if(__bcRenderAccumulatorMs >= renderStepMs){
    render();
    __bcRenderAccumulatorMs %= renderStepMs;
  }

  requestAnimationFrame(loop);
}

function startLoop(){
  if (__bcLoopStarted) return;
  __bcLoopStarted = true;
  resetLoopClock();
  requestAnimationFrame(loop);
}

window.addEventListener('focus', () => resetLoopClock());
document.addEventListener('visibilitychange', () => {
  if(!document.hidden) resetLoopClock();
});

// Start immediately
startLoop();
