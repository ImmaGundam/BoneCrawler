// BoneCrawler safe split module
// Purpose: Main requestAnimationFrame loop and font-ready startup.
// Source: app.js lines 7616-7619
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Loop ──────────────────────────────────────────────────────
function loop(){ update(); render(); requestAnimationFrame(loop); }
document.fonts.ready.then(()=>{ loop(); }).catch(()=>{ loop(); });

