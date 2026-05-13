// Collision
// Purpose: Generic rectangle overlap and attack-box calculation helpers.

// ── Collision ─────────────────────────────────────────────────
function ov(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function atkBox(e,reach){
  const r=reach||11;
  const extra=e.swordWidth||0;
  const half=Math.floor(extra/2);
  if(e.dir==='right') return{x:e.x+e.w, y:e.y+1-half,   w:r,        h:(e.h-2)+extra};
  if(e.dir==='left')  return{x:e.x-r,   y:e.y+1-half,   w:r,        h:(e.h-2)+extra};
  if(e.dir==='up')    return{x:e.x+1-half, y:e.y-r,     w:(e.w-2)+extra, h:r};
  /*down*/             return{x:e.x+1-half, y:e.y+e.h,  w:(e.w-2)+extra, h:r};
}

