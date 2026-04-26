// BoneCrawler safe split module
// Purpose: Deterministic bone decal generation used by dungeon rendering.
// Source: app.js lines 333-344
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Bone decals (deterministic) ──────────────────────────────
let _s = 42;
function _r(){_s=(_s*1664525+1013904223)>>>0;return _s/0xffffffff;}
const BONE_DECALS = [];
for(let i=0;i<55;i++){
  const x=PX+1+(_r()*(PW-4)|0), y=PY+1+(_r()*(PH-4)|0);
  const t=_r(), col=_r()<0.55?C.BN2:C.BN3;
  if(t<0.18) BONE_DECALS.push({type:'s',x,y,col});
  else if(t<0.55) BONE_DECALS.push({type:'h',x,y,col});
  else BONE_DECALS.push({type:'v',x,y,col});
}

