// BoneCrawler safe split module
// Purpose: Low-level canvas drawing helpers: sprite drawing, fills, borders, pixel font text.
// Source: app.js lines 890-973
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

// ── Draw helpers ──────────────────────────────────────────────
function ds(spr, lx, ly, fx){
  const rows=spr.length, cols=spr[0].length;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const v=spr[r][fx?cols-1-c:c];
    if(!v) continue;
    ctx.fillStyle=PAL[v];
    ctx.fillRect((lx+c)*SCALE,(ly+r)*SCALE,SCALE,SCALE);
  }
}
// Draw sprite at 2× logical scale (giant skeleton)
function ds2(spr, lx, ly, fx){
  const rows=spr.length, cols=spr[0].length;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const v=spr[r][fx?cols-1-c:c];
    if(!v) continue;
    ctx.fillStyle=PAL[v];
    ctx.fillRect((lx+c*2)*SCALE,(ly+r*2)*SCALE,2*SCALE,2*SCALE);
  }
}
function dsScale(spr, lx, ly, scale, fx){
  const rows=spr.length, cols=spr[0].length;
  const tw=Math.max(1, Math.round(cols*scale));
  const th=Math.max(1, Math.round(rows*scale));
  for(let r=0;r<th;r++) for(let c=0;c<tw;c++){
    const sr=Math.min(rows-1, Math.floor(r/scale));
    const sc=Math.min(cols-1, Math.floor(c/scale));
    const v=spr[sr][fx?cols-1-sc:sc];
    if(!v) continue;
    ctx.fillStyle=PAL[v];
    ctx.fillRect((lx+c)*SCALE,(ly+r)*SCALE,SCALE,SCALE);
  }
}

function dsMap(spr, lx, ly, map={}, fx){
  const rows=spr.length, cols=spr[0].length;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const v=spr[r][fx?cols-1-c:c];
    if(!v) continue;
    ctx.fillStyle=(v in map) ? map[v] : PAL[v];
    ctx.fillRect((lx+c)*SCALE,(ly+r)*SCALE,SCALE,SCALE);
  }
}
function fr(lx,ly,lw,lh,col){
  ctx.fillStyle=col;
  ctx.fillRect(lx*SCALE,ly*SCALE,lw*SCALE,lh*SCALE);
}
// Draw pixel-perfect 1px border rect in logical coords
function frBorder(lx,ly,lw,lh,col,alpha){
  ctx.globalAlpha=alpha;
  ctx.fillStyle=col;
  ctx.fillRect(lx*SCALE,     ly*SCALE,          lw*SCALE, SCALE);        // top
  ctx.fillRect(lx*SCALE,     (ly+lh-1)*SCALE,   lw*SCALE, SCALE);        // bottom
  ctx.fillRect(lx*SCALE,     ly*SCALE,           SCALE,    lh*SCALE);     // left
  ctx.fillRect((lx+lw-1)*SCALE, ly*SCALE,        SCALE,    lh*SCALE);     // right
  ctx.globalAlpha=1;
}
function pt(text,x,y,size,color,align='left',shadow=C.DK){
  ctx.textBaseline='top';
  ctx.textAlign=align;
  ctx.font=size+'px "Press Start 2P",monospace';
  if(shadow){
    ctx.fillStyle=shadow;
    ctx.fillText(text,x+1,y);
    ctx.fillText(text,x-1,y);
    ctx.fillText(text,x,y+1);
    ctx.fillText(text,x,y-1);
  }
  ctx.fillStyle=color;
  ctx.fillText(text,x,y);
}
function ptHeavy(text,x,y,size,color,align='left',shadow=C.DK){
  ctx.textBaseline='top';
  ctx.textAlign=align;
  ctx.font=size+'px "Press Start 2P",monospace';
  if(shadow){
    ctx.fillStyle=shadow;
    const offs=[[2,0],[-2,0],[0,2],[0,-2],[1,1],[-1,1],[1,-1],[-1,-1]];
    for(const [ox,oy] of offs) ctx.fillText(text,x+ox,y+oy);
  }
  ctx.fillStyle=color;
  ctx.fillText(text,x,y);
}

