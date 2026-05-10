// game loop
// Purpose: Main requestAnimationFrame loop and font-ready startup.
// ── Loop ──────────────────────────────────────────────────────
function loop(now){ tickSceneClock(now); update(); render(); requestAnimationFrame(loop); }
document.fonts.ready.then(()=>{ loop(); }).catch(()=>{ loop(); });

