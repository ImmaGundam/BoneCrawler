// Maps - zone-renders
// Purpose: Dungeon/zone renderers for Zone 1, Zone 2, Zone 3, Secret Zone 1, Secret Zone 2, decor, backgrounds.
// ── Dungeon background ────────────────────────────────────────
function drawDungeonZone1(){
  fr(0,0,GW,GH,C.W2);
  for(let y=0;y<GH;y+=4){
    fr(0,y,GW,1,C.W3);
    const off=(Math.floor(y/4)%2)*4;
    for(let x=off;x<GW;x+=8) fr(x,y,1,4,C.W3);
  }
  for(let y=1;y<GH;y+=4) fr(0,y,GW,1,C.W1);
  fr(PX,PY,PW,PH,C.FL);
  for(let y=PY+5;y<PY+PH;y+=7) fr(PX,y,PW,1,C.FL2);
  for(let x=PX+10;x<PX+PW;x+=14) fr(x,PY,1,PH,C.FL2);
  for(const d of BONE_DECALS){
    ctx.globalAlpha=0.54;
    if(d.type==='s') ds(S.mskull,d.x,d.y);
    else if(d.type==='h'){fr(d.x,d.y,2,1,d.col);fr(d.x+1,d.y+1,1,1,d.col);}
    else{fr(d.x,d.y,1,2,d.col);fr(d.x+1,d.y+1,1,1,d.col);}
  }
  ctx.globalAlpha=1;
  fr(PX-1,PY-1,PW+2,1,C.WH);
  fr(PX-1,PY-1,1,PH+2,C.WH);
  fr(PX-1,PY+PH,PW+2,1,C.W3);
  fr(PX+PW,PY-1,1,PH+2,C.W3);
}

function drawZone3DoorBlockage(){
  const doorX=GW/2-6;

  // sealed arch / frame
  fr(doorX-4, PY-1, 20, 3, '#7f6a51');
  fr(doorX-2, PY+1, 16, 10, '#3e3125');
  fr(doorX-1, PY+2, 14, 8, '#241c16');
  fr(doorX-2, PY+10, 16, 2, '#2b221a');

  // two nailed planks over the doorway
  fr(doorX-1, PY+3, 14, 2, '#7d5f3e');
  fr(doorX,   PY+6, 13, 2, '#6f5335');
  fr(doorX+1, PY+3, 1, 2, C.SI3); fr(doorX+11, PY+3, 1, 2, C.SI3);
  fr(doorX+2, PY+6, 1, 2, C.SI3); fr(doorX+10, PY+6, 1, 2, C.SI3);

  // scattered stones and rubble in front of the sealed exit
  const rocks=[
    [doorX-6,PY+11,4,3,'#6b5a46'],
    [doorX-2,PY+13,5,3,'#544638'],
    [doorX+4,PY+12,4,3,'#72604b'],
    [doorX+9,PY+14,5,3,'#5d4d3d'],
    [doorX+14,PY+11,3,3,'#6f5c47'],
  ];
  for(const [rx,ry,rw,rh,col] of rocks){
    fr(rx,ry,rw,rh,col);
    fr(rx,ry,rw,1,'#8b745b');
    fr(rx+1,ry+rh-1,Math.max(1,rw-2),1,'#3b3026');
  }
  fr(doorX-8,PY+15,24,2,'#332920');
}


function drawZone3BrokenTreeCluster(){
  const shake=zone3TreeShakeT>0 ? (((zone3TreeShakeT%4)<2)?-1:1) : 0;
  const mainX=PX+21+shake, mainY=PY+PH-18;

  ctx.globalAlpha=0.20;
  fr(PX+9,PY+PH-12,24,3,'#5a4330');
  fr(PX+14,PY+PH-20,16,2,'#4a3526');
  ctx.globalAlpha=1;

  // chopped stump: upper half removed
  fr(mainX-5, mainY-1, 10, 9, C.TB2);
  fr(mainX-4, mainY, 8, 7, C.TB);
  fr(mainX-5, mainY+1, 10, 1, C.BN3);
  fr(mainX-2, mainY+1, 1, 5, C.BN3);
  fr(mainX+2, mainY+2, 1, 4, C.BN3);
  fr(mainX-4, mainY-2, 8, 2, '#2c2219');
  fr(mainX-3, mainY-3, 2, 1, C.BN3);
  fr(mainX+1, mainY-3, 2, 1, C.BN3);
  fr(mainX-1, mainY-2, 1, 1, '#8b7350');
  fr(mainX+1, mainY-1, 1, 1, '#8b7350');

  const roots=[
    [[mainX-2,mainY+8],[mainX-7,mainY+10],[mainX-12,mainY+12]],
    [[mainX+1,mainY+8],[mainX+6,mainY+10],[mainX+11,mainY+12]],
    [[mainX-4,mainY+6],[mainX-9,mainY+7],[mainX-14,mainY+8]],
  ];
  for(const root of roots){
    for(const [rx,ry] of root){
      fr(rx,ry,3,1,C.TB2);
      if((rx+ry)%2===0) fr(rx+1,ry-1,1,1,'#8b7350');
    }
  }

  if(zone3TreeAwake){
    fr(mainX-2,mainY+1,1,1,C.WH);
    fr(mainX+1,mainY+1,1,1,C.WH);
    fr(mainX-2,mainY+2,1,1,C.MG2);
    fr(mainX+1,mainY+2,1,1,C.MG2);
    fr(mainX-1,mainY+4,2,1,'#2c2219');
  }

  fr(mainX-10, mainY+9, 2,1, C.BN3);
  fr(mainX-7,  mainY+11,1,1, C.TB);
  fr(mainX+8,  mainY+10,2,1, C.BN3);
  fr(mainX+5,  mainY+12,1,1, C.TB2);
}

function drawDungeonZone3(){
  const wallDark='#201710';
  const wallMid ='#2f2219';
  const wallLight='#5a4734';
  const wallMortar='#17110d';
  const floorBase='#17120f';
  const floorLine='#241c17';
  const floorAccent='#34281f';
  const floorGlow='#584531';

  fr(0,0,GW,GH,wallDark);
  for(let y=0;y<GH;y+=4){
    fr(0,y,GW,1,wallMid);
    const off=(Math.floor(y/4)%2)*4;
    for(let x=off;x<GW;x+=8){
      const col=((x+y)>>2)%3===0 ? wallDark : '#3d3025';
      fr(x,y,1,4,col);
      if(((x+y)>>2)%5===0) fr(x+2,y+1,1,1,wallLight);
    }
  }
  for(let y=1;y<GH;y+=4) fr(0,y,GW,1,'#5b4937');

  ctx.globalAlpha=0.05+0.02*Math.sin(frame*0.028);
  ctx.fillStyle='#5d4734';
  ctx.fillRect(0, 0, GW*SCALE, Math.floor(GH*0.46)*SCALE);
  ctx.globalAlpha=0.04+0.03*Math.sin(frame*0.034+1.4);
  ctx.fillStyle='#31261d';
  ctx.fillRect(0, Math.floor(GH*0.34)*SCALE, GW*SCALE, Math.floor(GH*0.66)*SCALE);
  ctx.globalAlpha=1;

  fr(PX,PY,PW,PH,floorBase);
  for(let y=PY+5;y<PY+PH;y+=7) fr(PX,y,PW,1,floorLine);
  for(let x=PX+10;x<PX+PW;x+=14) fr(x,PY,1,PH,floorAccent);

  ctx.globalAlpha=0.04+0.02*Math.sin(frame*0.03+0.8);
  ctx.fillStyle=floorGlow;
  ctx.fillRect(PX*SCALE, PY*SCALE, PW*SCALE, PH*SCALE);
  ctx.globalAlpha=1;

  ctx.globalAlpha=0.28;
  for(const d of BONE_DECALS){
    if(d.type==='s') ds(S.mskull,d.x,d.y);
    else if(d.type==='h'){fr(d.x,d.y,2,1,C.BN2);fr(d.x+1,d.y+1,1,1,C.BN3);}
    else{fr(d.x,d.y,1,2,C.BN3);fr(d.x+1,d.y+1,1,1,C.BN2);}
  }
  ctx.globalAlpha=1;

  drawZone3DoorBlockage();

  // torn carpet / old chamber runner beneath the center table
  drawTornCarpetPatch(GW/2, PY+22);

  drawZoneBreakablesByLayer(3, 'main');

  drawZone3BrokenTreeCluster();

  if(shadowBossDefeated && score>=SECRET2_SCORE_REQ){
    const rx=ZONE3_SECRET2_PORTAL_RECT.x, ry=ZONE3_SECRET2_PORTAL_RECT.y;
    const pulse=0.22 + 0.08*Math.sin(frame*0.12);
    ctx.globalAlpha=pulse;
    fr(rx-3,ry-3,ZONE3_SECRET2_PORTAL_RECT.w+6,ZONE3_SECRET2_PORTAL_RECT.h+6,C.MG2);
    ctx.globalAlpha=0.30 + 0.10*Math.sin(frame*0.15+1.1);
    fr(rx-1,ry-1,ZONE3_SECRET2_PORTAL_RECT.w+2,ZONE3_SECRET2_PORTAL_RECT.h+2,C.SH);
    ctx.globalAlpha=1;
    fr(rx+1,ry+1,10,10,'#36414b');
    fr(rx+2,ry+2,8,8,'#101923');
    fr(rx+3,ry+3,6,6,'#43295b');
    fr(rx+4,ry+4,4,4,'#a75dff');
    fr(rx+5 + Math.round(Math.sin(frame*0.09)),ry+5,1,1,'#f0ddff');
    fr(rx+6 + Math.round(Math.cos(frame*0.11)),ry+6,1,1,C.MG2);
  }

  // dead roots / dried growth where zone 1 and 2 aesthetics meet
  for(let vy=PY+10;vy<PY+PH-8;vy+=10){
    fr(PX+4,vy,1,5,'#715b42');
    fr(PX+5,vy+2,2,1,'#8c7557');
  }
  for(let vy=PY+14;vy<PY+PH-12;vy+=12){
    fr(PX+PW-6,vy,1,4,'#5d4c39');
    fr(PX+PW-8,vy+2,2,1,'#8a7254');
  }

  // bottom corners lit mostly by torch fire
  drawTorch(PX+8, PY+PH-19);
  ctx.globalAlpha=0.10+0.04*Math.sin(frame*0.18);
  fr(PX+1, PY+PH-28, 18, 16, '#6a4322');
  ctx.globalAlpha=1;
  drawTorch(PX+PW-12, PY+PH-19);
  ctx.globalAlpha=0.10+0.04*Math.sin(frame*0.18+1.3);
  fr(PX+PW-24, PY+PH-28, 18, 16, '#6a4322');
  ctx.globalAlpha=1;
  drawZoneBreakablesByLayer(3, 'lights');
  drawZoneBreakablesByLayer(3, 'bottom');
  drawCrate(PX+PW-18, PY+PH-11, true);

  fr(PX-1,PY-1,PW+2,1,wallLight);
  fr(PX-1,PY-1,1,PH+2,wallLight);
  fr(PX-1,PY+PH,PW+2,1,wallMortar);
  fr(PX+PW,PY-1,1,PH+2,wallMortar);
}
function drawDungeonSecret1(){
  fr(0,0,GW,GH,'#121028');
  for(let y=0;y<GH;y+=4){
    fr(0,y,GW,1,'#2f3158');
    const off=(Math.floor(y/4)%2)*4;
    for(let x=off;x<GW;x+=8) fr(x,y,1,4,'#26244a');
  }
  for(let y=1;y<GH;y+=4) fr(0,y,GW,1,'#433f78');
  fr(PX,PY,PW,PH,'#20314a');
  for(let y=PY+6;y<PY+PH;y+=8) fr(PX,y,PW,1,'#29405e');

  const fx=GW/2, fy=PY+39;

  // walkway leading up to the pond
  const walkX = fx-6, walkY = fy+15, walkW = 12, walkH = 18;
  fr(walkX-1, walkY-1, walkW+2, walkH+2, '#8e939f');
  fr(walkX, walkY, walkW, walkH, '#c8ccd3');
  for(let y=walkY+2; y<walkY+walkH; y+=4){
    fr(walkX+1, y, walkW-2, 1, '#9ea4b0');
  }
  for(let x=walkX+3; x<walkX+walkW; x+=4){
    fr(x, walkY+1, 1, walkH-2, '#b2b7c2');
  }

  // brick ring around the pond
  const poolOuter = {x:fx-32, y:fy-16, w:64, h:32};
  fr(poolOuter.x, poolOuter.y, poolOuter.w, poolOuter.h, '#aeb3bc');
  fr(poolOuter.x+1, poolOuter.y+1, poolOuter.w-2, poolOuter.h-2, '#d6d9df');
  for(let y=poolOuter.y+2; y<poolOuter.y+poolOuter.h-1; y+=4){
    const off=((y-poolOuter.y)/4)%2 ? 3 : 1;
    for(let x=poolOuter.x+off; x<poolOuter.x+poolOuter.w-3; x+=6){
      fr(x, y, 4, 2, '#bcc1cb');
      fr(x, y+2, 1, 1, '#8f95a2');
    }
  }

  // opening in the brickwork where the walkway joins
  fr(fx-7, fy+15, 14, 3, '#c8ccd3');

  // larger fairy pool
  ctx.globalAlpha=0.18+0.06*Math.sin(frame*0.028);
  fr(fx-29,fy-14,58,28,C.MG2);
  ctx.globalAlpha=0.38;
  fr(fx-25,fy-12,50,24,'#4e6fa0');
  ctx.globalAlpha=0.70;
  fr(fx-19,fy-9,38,18,'#6ca8cf');
  ctx.globalAlpha=1;
  fr(fx-13,fy-6,26,12,'#a6e8ff');

  // moving water stripes / shimmer (30% slower)
  const rippleA = Math.round(Math.sin(frame*0.056)*3);
  const rippleB = Math.round(Math.sin(frame*0.042 + 1.7)*4);
  ctx.globalAlpha=0.28;
  fr(fx-18+rippleA,fy-5,36,1,'#d8f6ff');
  fr(fx-16-rippleB,fy-1,32,1,'#d8f6ff');
  fr(fx-14+rippleB,fy+3,28,1,'#bfefff');
  ctx.globalAlpha=0.18;
  fr(fx-10-rippleA,fy-8,20,1,'#ffffff');
  fr(fx-11+rippleB,fy+6,22,1,'#ffffff');
  ctx.globalAlpha=1;

  // little animated sparkles in the water (also slower)
  const sparkleX = Math.round(Math.sin(frame*0.063)*6);
  fr(fx-8+sparkleX,fy-2,2,1,C.WH);
  fr(fx+4-sparkleX,fy+2,2,1,C.WH);
  fr(fx-1+Math.round(Math.cos(frame*0.049)*5),fy-6,1,1,C.WH);

  // fairies (30% slower)
  for(let i=0;i<5;i++){
    const ang=frame*0.035 + i*1.26;
    const ox=Math.cos(ang)*26;
    const oy=Math.sin(ang*1.4)*12;
    const sx=Math.round(fx+ox);
    const sy=Math.round(fy-13+oy);
    ctx.globalAlpha=0.5+0.35*Math.sin(frame*0.14+i);
    fr(sx,sy,2,2,C.MG2);
    fr(sx+1,sy-1,1,1,C.WH);
    ctx.globalAlpha=1;
  }

  // stone pillars around the fountain area
  drawStonePillar(fx-31, fy-18);
  drawStonePillar(fx+26, fy-18);
  drawStonePillar(fx-31, fy+8);
  drawStonePillar(fx+26, fy+8);

  // torchlight near the room corners
  drawTorch(PX+6, PY+10);
  drawTorch(PX+PW-10, PY+10);
  drawTorch(PX+6, PY+PH-14);
  drawTorch(PX+PW-10, PY+PH-14);

  // sun-speckled dust through the opening above the fountain
  ctx.globalAlpha=0.28;
  fr(fx-9 + Math.round(Math.sin(frame*0.04)*2), fy-11, 1, 1, '#f9fff2');
  fr(fx+2 + Math.round(Math.cos(frame*0.05)*2), fy-8, 1, 1, '#f9fff2');
  fr(fx+7 + Math.round(Math.sin(frame*0.03+0.8)*2), fy-2, 1, 1, '#f9fff2');
  fr(fx-13 + Math.round(Math.cos(frame*0.06+1.1)*2), fy+1, 1, 1, '#f9fff2');
  ctx.globalAlpha=1;

  // tiny rat and cheese in the upper-left corner
  const ratX=SECRET1_RAT_RECT.x, ratY=SECRET1_RAT_RECT.y;
  fr(SECRET1_CHEESE_RECT.x,SECRET1_CHEESE_RECT.y,SECRET1_CHEESE_RECT.w,SECRET1_CHEESE_RECT.h,'#f0d36a');
  fr(SECRET1_CHEESE_RECT.x+1,SECRET1_CHEESE_RECT.y+1,SECRET1_CHEESE_RECT.w-2,SECRET1_CHEESE_RECT.h-2,'#ffd98e');
  fr(SECRET1_CHEESE_RECT.x+1,SECRET1_CHEESE_RECT.y+1,1,1,'#b88b2d');
  fr(SECRET1_CHEESE_RECT.x+3,SECRET1_CHEESE_RECT.y+2,1,1,'#b88b2d');
  fr(ratX+1,ratY+2,5,2,'#7d7b86');
  fr(ratX+2,ratY+1,3,2,'#9694a2');
  fr(ratX+1,ratY+1,1,1,'#b7b5c2');
  fr(ratX+5,ratY+1,1,1,'#b7b5c2');
  fr(ratX,ratY+3,1,1,'#6d6b77');
  fr(ratX+6,ratY+3,2,1,'#6d6b77');
  fr(ratX+7,ratY+4,2,1,'#9694a2');
  fr(ratX+3,ratY+2,1,1,C.DK);
  if(secret1RatTalkCount>=2){
    ctx.globalAlpha=0.18+0.05*Math.sin(frame*0.12);
    fr(ratX-2,ratY-2,12,10,C.MG2);
    ctx.globalAlpha=1;
  }

  // larger decorative rocks with varied gray tones
  drawRockCluster(PX+8, PY+PH-18, 0);
  drawRockCluster(PX+PW-17, PY+PH-19, 1);
  drawRockCluster(PX+14, PY+11, 2);

  const dx=SECRET1_EXIT_DOOR_RECT.x, dy=SECRET1_EXIT_DOOR_RECT.y;
  fr(dx-1,dy,12,10,C.WH);
  fr(dx,dy+1,10,9,'#5a4c78');
  fr(dx+2,dy+2,6,7,'#05060a');
  fr(dx+1,dy+1,8,1,'#8d84bc');
  fr(dx+2,dy+2,6,1,'#b6b1d9');
  fr(dx,dy+3,2,5,'#6b5034');
  fr(dx+8,dy+3,2,5,'#6b5034');
  fr(dx,dy+3,1,5,'#8e6e48');
  fr(dx+9,dy+3,1,5,'#8e6e48');
  if(secret1BlessingT<=0){
    ctx.globalAlpha=0.16+0.06*Math.sin(frame*0.049);
    fr(dx+2,dy+8,6,3,C.WH);
    ctx.globalAlpha=1;
  }

  fr(PX-1,PY-1,PW+2,1,C.WH);
  fr(PX-1,PY-1,1,PH+2,C.WH);
  fr(PX-1,PY+PH,PW+2,1,'#2f3158');
  fr(PX+PW,PY-1,1,PH+2,'#2f3158');
}


function drawSecret2SwordOverlay(cx, cy){
  // top cap of plinth stays in front so the player can pass behind it
  fr(cx-3,cy,6,3,'#8a948d');
  fr(cx-2,cy-1,4,1,'#a4ada7');

  // smaller sword for better player proportion
  fr(cx-1,cy-8,2,8,C.SI1);
  fr(cx-2,cy-7,1,6,C.SI2);
  fr(cx+1,cy-7,1,6,C.WH);
  fr(cx-2,cy-9,4,1,C.SI1);

  // smaller purple hilt
  fr(cx-1,cy-13,2,4,'#5d2c83');
  fr(cx,cy-12,1,2,'#8f61c0');

  // guard and pommel
  fr(cx-2,cy-10,5,1,'#9fa9b2');
  fr(cx-1,cy-14,2,1,C.BN1);

  // sword glow, separate from sunlight beam
  ctx.globalAlpha=0.06 + 0.025*Math.sin(frame*0.08);
  fr(cx-3,cy-14,6,14,'#dff7ff');
  ctx.globalAlpha=1;

  // fairies around the blade
  for(let i=0;i<3;i++){
    const ang=frame*0.045 + i*2.1;
    const fx=Math.round(cx + Math.cos(ang)*6);
    const fy=Math.round(cy-12 + Math.sin(ang*1.2)*4);
    ctx.globalAlpha=0.45 + 0.30*Math.sin(frame*0.13+i);
    fr(fx,fy,2,2,C.MG2);
    fr(fx+1,fy-1,1,1,C.WH);
    ctx.globalAlpha=1;
  }
}

function drawDungeonSecret2(){
  fr(0,0,GW,GH,'#0a0e12');

  const wallH = 28;

  // back wall, darker than the floor
  fr(PX,PY,PW,wallH,'#151e24');
  for(let y=PY+1;y<PY+wallH;y+=4) fr(PX,y,PW,1,'#202b33');
  for(let x=PX+4;x<PX+PW;x+=9) fr(x,PY,1,wallH,'#0f151a');

  // crooked, splintered wall cracks
  const crackColor='#080b0e';
  const splinters=[
    [GW/2-23,PY+3,1,4],[GW/2-24,PY+6,2,1],[GW/2-22,PY+7,1,3],[GW/2-25,PY+10,3,1],
    [GW/2-23,PY+11,1,2],[GW/2-21,PY+13,2,1],[GW/2-22,PY+14,1,4],[GW/2-24,PY+17,3,1],
    [GW/2-20,PY+8,1,2],[GW/2-19,PY+9,2,1],
    [GW/2-2,PY+2,1,3],[GW/2-3,PY+4,2,1],[GW/2-1,PY+5,1,3],[GW/2+1,PY+7,2,1],
    [GW/2,PY+8,1,3],[GW/2-2,PY+10,2,1],[GW/2-1,PY+11,1,2],
    [GW/2+18,PY+4,1,4],[GW/2+17,PY+7,2,1],[GW/2+19,PY+8,1,3],[GW/2+16,PY+10,3,1],
    [GW/2+18,PY+11,1,2],[GW/2+20,PY+13,2,1],[GW/2+19,PY+14,1,4],[GW/2+17,PY+17,3,1],
    [GW/2+15,PY+9,1,2],[GW/2+14,PY+10,2,1]
  ];
  for(const s of splinters) fr(s[0],s[1],s[2],s[3],crackColor);

  // lots more vines creeping from those cracks
  const vine='#30443a';
  const vineHi='#58705f';
  const vineDark='#243229';
  const vines=[
    [GW/2-24,PY+1,1,16],[GW/2-23,PY+6,4,1],[GW/2-25,PY+12,3,1],[GW/2-22,PY+15,1,5],[GW/2-24,PY+18,4,1],
    [GW/2-20,PY+5,1,9],[GW/2-19,PY+9,3,1],[GW/2-18,PY+12,1,4],
    [GW/2-2,PY,1,12],[GW/2-3,PY+4,3,1],[GW/2,PY+6,3,1],[GW/2+1,PY+9,1,5],[GW/2-1,PY+13,3,1],
    [GW/2+18,PY+2,1,15],[GW/2+16,PY+7,4,1],[GW/2+19,PY+11,3,1],[GW/2+18,PY+14,1,5],[GW/2+16,PY+18,4,1],
    [GW/2+14,PY+6,1,8],[GW/2+13,PY+10,3,1],[GW/2+15,PY+13,1,4]
  ];
  for(const v of vines){
    fr(v[0],v[1],v[2],v[3],vine);
    if(v[2] >= 3) fr(v[0]+1,v[1],1,v[3],vineHi);
    if(v[3] >= 4) fr(v[0],v[1]+1,v[2],1,vineDark);
  }

  // floor, clearly different shade from the wall
  fr(PX,PY+wallH,PW,PH-wallH,'#1b2a36');
  for(let y=PY+wallH+2;y<PY+PH;y+=7) fr(PX,y,PW,1,'#24384a');
  for(let y=PY+wallH+5;y<PY+PH;y+=14) fr(PX,y,PW,1,'#16222c');

  const cx=GW/2, cy=PY+43;

  // sunlight opening and beam
  ctx.save();
  ctx.globalAlpha=0.13 + 0.04*Math.sin(frame*0.035);
  ctx.fillStyle='#f8fff0';
  ctx.beginPath();
  ctx.moveTo((cx-4)*SCALE, PY*SCALE);
  ctx.lineTo((cx+6)*SCALE, PY*SCALE);
  ctx.lineTo((cx+17)*SCALE, (cy+10)*SCALE);
  ctx.lineTo((cx-13)*SCALE, (cy+10)*SCALE);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.globalAlpha=0.10 + 0.03*Math.sin(frame*0.04);
  fr(cx-13,cy+5,26,10,'#f3f7e1');
  ctx.globalAlpha=1;

  ctx.globalAlpha=0.24;
  fr(cx-2 + Math.round(Math.sin(frame*0.04)*2), cy-17, 1, 1, C.WH);
  fr(cx+4 + Math.round(Math.cos(frame*0.05)*2), cy-12, 1, 1, C.WH);
  fr(cx-6 + Math.round(Math.sin(frame*0.03+1.3)*2), cy-7, 1, 1, C.WH);
  ctx.globalAlpha=1;

  // shrine platform with a more top-down view
  fr(cx-16,cy+4,32,7,'#cfd3cf');
  fr(cx-14,cy+5,28,5,'#e2e5e1');
  fr(cx-11,cy+3,22,2,'#f0f2ef');

  fr(cx-12,cy+3,24,1,'#9ca29c');
  fr(cx-16,cy+6,2,4,'#8b908b');
  fr(cx+14,cy+6,2,4,'#8b908b');

  // front steps tapering down
  fr(cx-12,cy+11,24,2,'#b3b8b3');
  fr(cx-9,cy+13,18,2,'#a0a59f');
  fr(cx-6,cy+15,12,2,'#8e938e');

  // lower plinth/body stays behind the player
  fr(cx-4,cy+1,8,5,'#667069');
  fr(cx-3,cy+2,6,3,'#788279');

  // wounded NPC - immagundam
  const nx=SECRET2_NPC_RECT.x, ny=SECRET2_NPC_RECT.y;
  ctx.globalAlpha=0.18;
  fr(nx-1,ny+6,14,3,C.DK);
  ctx.globalAlpha=1;
  fr(nx+2,ny+2,7,3,C.TB2);
  fr(nx+8,ny+2,3,2,C.TB);
  fr(nx+10,ny+1,2,1,C.BN3);
  fr(nx,ny+1,3,3,C.BN1);
  fr(nx+1,ny+2,1,1,C.DK);
  fr(nx+3,ny+5,2,2,C.TB);
  fr(nx+5,ny+5,2,2,C.TB);
  fr(nx+2,ny+4,1,2,C.BN3);
  fr(nx+6,ny+4,1,2,C.BN3);
  fr(nx+4,ny+1,1,1,C.BLD);

  // return portal - exit back to the main menu
  const rx=SECRET2_RETURN_PORTAL_RECT.x, ry=SECRET2_RETURN_PORTAL_RECT.y;
  const pulse=0.20 + 0.08*Math.sin(frame*0.12);
  ctx.globalAlpha=pulse;
  fr(rx-2,ry-2,SECRET2_RETURN_PORTAL_RECT.w+4,SECRET2_RETURN_PORTAL_RECT.h+4,C.MG2);
  ctx.globalAlpha=0.28 + 0.08*Math.sin(frame*0.15+1.1);
  fr(rx-1,ry-1,SECRET2_RETURN_PORTAL_RECT.w+2,SECRET2_RETURN_PORTAL_RECT.h+2,C.SH);
  ctx.globalAlpha=1;

  // stone base / frame
  fr(rx+1,ry+1,10,10,'#36414b');
  fr(rx+2,ry+2,8,8,'#101923');

  // glowing portal interior
  fr(rx+3,ry+3,6,6,'#1f3c63');
  fr(rx+4,ry+4,4,4,'#4ea2ff');
  fr(rx+5 + Math.round(Math.sin(frame*0.09)),ry+5,1,1,'#d8f6ff');
  fr(rx+6 + Math.round(Math.cos(frame*0.11)),ry+6,1,1,C.MG2);

  // tiny orbit sparks
  if(Math.floor(frame/10)%2===0){
    fr(rx+2,ry,1,1,'#9fd8ff');
    fr(rx+10,ry+2,1,1,'#bde9ff');
    fr(rx+1,ry+10,1,1,C.MG2);
  }

  fr(PX-1,PY-1,PW+2,1,C.WH);
  fr(PX-1,PY-1,1,PH+2,C.WH);
  fr(PX-1,PY+PH,PW+2,1,'#23313d');
  fr(PX+PW,PY-1,1,PH+2,'#23313d');
}

function drawDungeon(){
  if(window.BoneCrawlerZones && typeof BoneCrawlerZones.getActiveZone === 'function'){
    const zone=BoneCrawlerZones.getActiveZone();
    if(zone && typeof zone.render === 'function'){ zone.render(); return; }
  }
  if(currentZone===2){ drawDungeonZone2(); return; }
  if(currentZone===3){ drawDungeonZone3(); return; }
  if(currentZone===ZONE_SECRET1){ drawDungeonSecret1(); return; }
  if(currentZone===ZONE_SECRET2){ drawDungeonSecret2(); return; }
  drawDungeonZone1();
}

function drawZone2Tree(){
  const tx=GW/2, ty=PY+48;
  const mossA='#4d5a41';
  const mossB='#5b6a4a';
  const rotA='#394332';
  const rotB='#2f3828';
  const thinGrass='#667052';

  // uprooted crater / root tear
  fr(tx-14,ty+10,28,6,C.DK);
  for(let i=0;i<12;i++){
    const ox=-20+i*3;
    fr(tx+ox,ty+8+((i%2)?1:0),2,2,(i%3===0)?C.W2:C.W3);
  }

  // half-dead tree trunk
  fr(tx-5,ty-10,10,30,C.TB2);
  fr(tx-4,ty-9,8,28,C.TB);
  fr(tx-1,ty-8,1,26,C.BN3);
  fr(tx+2,ty-5,1,18,C.BN3);
  fr(tx-5,ty+6,10,2,C.BN3);

  // decayed canopy / rot patches
  fr(tx-12,ty-16,8,4,rotA); fr(tx+1,ty-18,11,6,rotB); fr(tx-3,ty-20,5,3,mossA);
  fr(tx-10,ty-15,6,4,mossA); fr(tx-4,ty-17,4,3,mossB); fr(tx+3,ty-16,6,4,rotA); fr(tx+8,ty-13,4,3,mossA);
  fr(tx-15,ty-6,5,3,rotB); fr(tx+11,ty-7,5,3,mossA);
  fr(tx-18,ty+12,6,3,rotA); fr(tx+12,ty+13,7,3,mossB);
  fr(tx-23,ty+20,5,3,rotB); fr(tx+18,ty+22,6,3,mossA);
  fr(tx-28,ty+30,7,4,rotB); fr(tx+22,ty+31,8,4,rotA);
  fr(tx-8,ty+26,5,3,mossA); fr(tx+4,ty+27,5,3,rotA);
  fr(tx-2,ty-20,3,2,C.W3); fr(tx+7,ty-11,2,2,rotB);

  // thinner, sparser grass tufts
  const zone2Grass=[
    [tx-26,ty+16],[tx-22,ty+28],[tx-17,ty+33],[tx-9,ty+31],[tx-4,ty+34],
    [tx+6,ty+32],[tx+13,ty+27],[tx+20,ty+17],[tx+24,ty+31],[tx+28,ty+21],
    [PX+10,PY+PH-16],[PX+18,PY+PH-11],[PX+PW-24,PY+PH-15],[PX+PW-15,PY+PH-10]
  ];
  for(const [gx,gy] of zone2Grass){
    fr(gx,gy,1,4,thinGrass);
    if((gx+gy)%2===0) fr(gx-1,gy+2,1,2,rotA);
    fr(gx+1,gy+1,1,3,mossA);
  }

  // dead branches
  fr(tx-10,ty-6,6,1,C.BN3); fr(tx+4,ty-4,7,1,C.BN3); fr(tx+9,ty-6,1,5,C.BN3);
  fr(tx-7,ty-13,1,7,C.BN3); fr(tx-11,ty-14,5,1,C.BN3);

  // roots through the room
  const roots=[
    [[tx-1,ty+18],[tx-4,ty+21],[tx-9,ty+24],[tx-14,ty+26],[tx-20,ty+29]],
    [[tx+1,ty+18],[tx+5,ty+21],[tx+10,ty+23],[tx+16,ty+26],[tx+24,ty+30]],
    [[tx-3,ty+16],[tx-8,ty+17],[tx-14,ty+17],[tx-20,ty+18]],
    [[tx+3,ty+16],[tx+8,ty+17],[tx+14,ty+19],[tx+21,ty+20]],
  ];
  for(const root of roots){
    for(const [rx,ry] of root){
      fr(rx,ry,3,1,C.TB2);
      if((rx+ry)%2===0) fr(rx+1,ry-1,1,1,C.W3);
      if((rx+ry)%3===0) fr(rx+2,ry+1,1,1,rotA);
    }
  }
}


function drawDungeonZone2(){
  const wallA='#24313a';
  const wallB='#1c2730';
  const wallC='#33434d';
  const floorA='#223548';
  const floorB='#1b2b39';
  const floorC='#2a4257';
  const mossA='#4e5d43';
  const mossB='#3f4c37';
  const mossC='#6b7459';
  const vineA='#485540';
  const vineB='#374233';
  const crackA='#0b1015';

  fr(0,0,GW,GH,wallB);
  for(let y=0;y<GH;y+=4){
    fr(0,y,GW,1,wallC);
    const off=(Math.floor(y/4)%2)*4;
    for(let x=off;x<GW;x+=8){
      fr(x,y,1,4,wallA);
      if(((x+y)>>2)%6===0) fr(x+2,y+1,1,1,'#566671');
      if(((x+y)>>2)%7===0) fr(x+5,y+2,2,1,wallB);
    }
  }
  for(let y=1;y<GH;y+=4) fr(0,y,GW,1,'#31424d');

  fr(PX,PY,PW,PH,floorA);
  for(let y=PY+5;y<PY+PH;y+=7) fr(PX,y,PW,1,floorC);
  for(let x=PX+10;x<PX+PW;x+=14) fr(x,PY,1,PH,floorB);

  fr(PX, PY, PW, 16, '#2c4156');
  for(let x=PX+1; x<PX+PW-1; x+=4){
    if(((x-PX)/4)%3===1) continue;
    const height = 2 + ((x*5)%4);
    const bend = (x%8===0)?1:0;
    fr(x, PY+16-height, 1, height, mossC);
    fr(x+1, PY+16-height+bend, 1, Math.max(1,height-1), mossA);
    if(x%12===0) fr(x-1, PY+15-height, 1, 1, '#88a2b8');
    if(x%16===0) fr(x+2, PY+17-height, 1, 1, mossB);
  }

  drawZoneBreakablesByLayer(2, 'back');
  drawZoneBreakablesByLayer(2, 'lights');

  const wallCracks = [
    [[PX+9,PY+10],[PX+10,PY+13],[PX+8,PY+16],[PX+10,PY+20],[PX+9,PY+24]],
    [[PX+PW-15,PY+8],[PX+PW-16,PY+11],[PX+PW-14,PY+14],[PX+PW-15,PY+18],[PX+PW-13,PY+21]],
    [[GW/2-24,PY+6],[GW/2-22,PY+9],[GW/2-23,PY+12],[GW/2-21,PY+15]],
    [[GW/2+24,PY+9],[GW/2+22,PY+12],[GW/2+23,PY+15],[GW/2+21,PY+18]]
  ];
  for(const crack of wallCracks){
    for(let i=0;i<crack.length;i++){
      const [cx,cy]=crack[i];
      fr(cx,cy,1,1,crackA);
      if(i%2===0) fr(cx+1,cy,1,1,'#54616a');
    }
  }

  const floorCracks = [
    [[PX+14,PY+PH-28],[PX+18,PY+PH-25],[PX+23,PY+PH-22],[PX+29,PY+PH-20]],
    [[PX+PW-18,PY+PH-30],[PX+PW-23,PY+PH-27],[PX+PW-28,PY+PH-24],[PX+PW-33,PY+PH-22]],
    [[GW/2-10,PY+PH-18],[GW/2-6,PY+PH-16],[GW/2-2,PY+PH-13],[GW/2+3,PY+PH-11]],
    [[GW/2+11,PY+PH-24],[GW/2+7,PY+PH-21],[GW/2+3,PY+PH-18],[GW/2-2,PY+PH-15]]
  ];
  for(const crack of floorCracks){
    for(let i=0;i<crack.length;i++){
      const [cx,cy]=crack[i];
      fr(cx,cy,2,1,crackA);
      if(i%2===0) fr(cx+1,cy-1,1,1,wallC);
    }
  }

  for(let vy=PY+8;vy<PY+PH-8;vy+=10){
    fr(PX+3,vy,1,5,vineA);
    fr(PX+4,vy+2,1,2,vineB);
  }
  for(let vy=PY+12;vy<PY+PH-12;vy+=12){
    fr(PX+PW-5,vy,1,4,vineA);
    fr(PX+PW-7,vy+2,2,1,vineB);
  }
  fr(PX+8,PY+12,3,1,mossA); fr(PX+PW-12,PY+16,4,1,mossB);
  fr(GW/2-18,PY+8,5,2,mossA); fr(GW/2+14,PY+12,4,2,mossB);

  const edgeGrass=[
    [PX+6,PY+PH-12],[PX+12,PY+PH-10],[PX+20,PY+PH-14],[PX+PW-22,PY+PH-13],[PX+PW-12,PY+PH-9],
    [GW/2-25,PY+PH-16],[GW/2-18,PY+PH-12],[GW/2+18,PY+PH-14],[GW/2+26,PY+PH-11],
    [PX+24,PY+PH-20],[PX+36,PY+PH-26],[PX+PW-36,PY+PH-22],[GW/2+28,PY+PH-24]
  ];
  for(const [gx,gy] of edgeGrass){
    fr(gx,gy,1,4,mossC);
    fr(gx+1,gy+1,1,3,mossA);
    if((gx+gy)%2===0) fr(gx-1,gy+2,1,2,mossB);
  }

  const floorGrassPatches=[
    [PX+9,PY+33],[PX+14,PY+41],[PX+22,PY+48],[PX+31,PY+38],[PX+39,PY+54],
    [GW/2-24,PY+43],[GW/2-12,PY+52],[GW/2+6,PY+46],[GW/2+20,PY+56],
    [PX+PW-40,PY+36],[PX+PW-31,PY+47],[PX+PW-20,PY+40],[PX+PW-14,PY+54]
  ];
  for(const [gx,gy] of floorGrassPatches){
    fr(gx,gy,1,3,mossC);
    fr(gx+1,gy+1,1,2,mossA);
    if((gx+gy)%3===0) fr(gx-1,gy+2,1,1,mossB);
  }

  // extra bookshelves tucked into the back grass and side wall pockets
  drawZoneBreakablesByLayer(2, 'late');

  // mushrooms around the tree and along the grassy back wall
  const mushSpots=[
    [GW/2-18,PY+15],[GW/2-10,PY+17],[GW/2+12,PY+15],[GW/2+20,PY+18],
    [GW/2-8,PY+PH-22],[GW/2+7,PY+PH-24],[GW/2-15,PY+PH-12],[GW/2+15,PY+PH-13],
    [PX+PW-30,PY+18],[PX+PW-22,PY+20]
  ];
  mushSpots.forEach(([mx,my],idx)=>drawMushroom(mx,my,idx%2===0?'#c84a8d':'#9b4bd1'));

  drawZone2TriHole(PX+15, PY+PH-24, false);
  drawZone2TriHole(PX+PW-27, PY+PH-25, true);

  for(const d of BONE_DECALS){
    ctx.globalAlpha=0.36;
    if(d.type==='s') ds(S.mskull,d.x,d.y);
    else if(d.type==='h'){fr(d.x,d.y,2,1,d.col);fr(d.x+1,d.y+1,1,1,d.col);}
    else{fr(d.x,d.y,1,2,d.col);fr(d.x+1,d.y+1,1,1,d.col);}
  }
  ctx.globalAlpha=1;

  drawZone2Tree();

  fr(PX-1,PY-1,PW+2,1,C.WH);
  fr(PX-1,PY-1,1,PH+2,C.WH);
  fr(PX-1,PY+PH,PW+2,1,C.W3);
  fr(PX+PW,PY-1,1,PH+2,C.W3);
}

function drawTorch(lx,ly){
  ds(S.torch,lx,ly);
  const f=Math.floor(frame/4)%2;
  ctx.globalAlpha=0.20+f*0.08;
  fr(lx-2,ly-1,8,5,C.FR2);
  ctx.globalAlpha=0.10+f*0.05;
  fr(lx-1,ly,6,4,C.FR1);
  ctx.globalAlpha=1;
}

function drawChainColumn(x,y,len){
  // iron wall bracket
  fr(x,   y-2, 2,1, C.BN3);
  fr(x+1, y-1, 2,1, C.SI3);

  for(let i=0;i<len;i++){
    const oy=y+i*4;

    // alternating iron links with darker centers
    fr(x+1,oy,  1,1,C.SI1);
    fr(x,  oy+1,1,1,C.SI2);
    fr(x+2,oy+1,1,1,C.SI2);
    fr(x+1,oy+2,1,1,C.SI1);
    fr(x+1,oy+1,1,1,C.SI3);

    if(i<len-1){
      fr(x+1,oy+3,1,1,C.SI3);
    }
  }
}

function drawSpiderWeb(cx,cy){
  fr(cx,cy,1,1,C.WH);
  fr(cx-1,cy,1,1,C.BN2); fr(cx+1,cy,1,1,C.BN2);
  fr(cx,cy-1,1,1,C.BN2); fr(cx,cy+1,1,1,C.BN2);
  fr(cx-1,cy-1,1,1,C.BN2); fr(cx+1,cy-1,1,1,C.BN2);
  fr(cx-1,cy+1,1,1,C.BN2); fr(cx+1,cy+1,1,1,C.BN2);
  fr(cx-2,cy-2,1,1,C.W3); fr(cx+2,cy-2,1,1,C.W3);
  fr(cx-2,cy,1,1,C.W3);   fr(cx+2,cy,1,1,C.W3);
}

function drawBarrel(lx,ly,variant=0){
  // soft floor shadow / warm reflected light
  ctx.globalAlpha=0.22;
  fr(lx-1,ly+8,8,1,'#7b5330');
  fr(lx,ly+9,6,1,'#5f3d24');
  ctx.globalAlpha=1;

  // common body
  fr(lx+1,ly,4,1,C.BN3);
  fr(lx,ly+1,6,6,C.TB2);
  fr(lx+1,ly+1,4,6,C.TB);
  fr(lx,ly+2,6,1,C.BN3);
  fr(lx,ly+5,6,1,C.BN3);
  fr(lx+2,ly+1,1,6,C.BN3);
  fr(lx+4,ly+1,1,6,C.BN3);
  fr(lx+1,ly+7,4,1,C.BN3);

  if(variant===1){
    // lighter staves / brighter banding
    fr(lx+1,ly+1,1,6,C.BN2);
    fr(lx+3,ly+1,1,6,C.BN2);
  } else if(variant===2){
    // darker older barrel with side highlight
    fr(lx+1,ly+1,4,6,C.TB2);
    fr(lx+1,ly+1,1,6,C.TB);
  } else if(variant===3){
    // one strap shifted and slightly dented top
    fr(lx,ly+3,6,1,C.BN3);
    fr(lx+4,ly,1,1,C.TB2);
  } else if(variant===4){
    // half-broken barrel
    fr(lx,ly+4,6,3,C.DK);
    fr(lx+1,ly+5,1,2,C.BN3);
    fr(lx+4,ly+5,1,2,C.BN3);
    fr(lx+2,ly+4,2,1,C.TB);
    fr(lx+2,ly+6,2,1,C.TB2);
    // spilled wood pieces
    fr(lx+6,ly+7,1,1,C.BN3);
    fr(lx+7,ly+8,1,1,C.TB);
    fr(lx-1,ly+7,1,1,C.BN3);
  } else if(variant===5){
    // extra bright front slats
    fr(lx+2,ly+1,1,6,C.BN2);
    fr(lx+4,ly+1,1,6,C.BN2);
    fr(lx+1,ly+3,4,1,C.TB2);
  }
}

function drawBrokenRoundTableSet(lx,ly){
  // table shadow / lived-in grime
  ctx.globalAlpha=0.16;
  fr(lx-2,ly+10,15,2,'#6f4a28');
  fr(lx+1,ly+12,9,1,'#4f321c');
  ctx.globalAlpha=1;

  // broken round table top
  fr(lx+2,ly,7,1,C.BN3);
  fr(lx+1,ly+1,9,1,C.TB);
  fr(lx,ly+2,10,3,C.TB2);
  fr(lx+1,ly+5,8,1,C.TB);
  fr(lx+3,ly+6,4,1,C.BN3);

  // missing chunk / crack
  fr(lx+6,ly+1,3,2,C.DK);
  fr(lx+7,ly+3,2,1,C.DK);
  fr(lx+4,ly+2,1,3,C.BN3);

  // table pedestal / broken leg
  fr(lx+4,ly+7,2,3,C.BN3);
  fr(lx+3,ly+10,1,2,C.BN3);
  fr(lx+6,ly+9,1,1,C.BN3);

  // chair 1 (left)
  fr(lx-3,ly+3,3,1,C.BN3);
  fr(lx-4,ly+4,5,2,C.TB2);
  fr(lx-3,ly+6,3,2,C.TB);
  fr(lx-4,ly+8,1,2,C.BN3);
  fr(lx,ly+8,1,2,C.BN3);

  // chair 2 (bottom, knocked over)
  fr(lx+7,ly+10,4,1,C.BN3);
  fr(lx+8,ly+11,3,1,C.TB2);
  fr(lx+9,ly+12,2,1,C.TB);
  fr(lx+11,ly+11,1,2,C.BN3);

  // chair 3 (right, broken back)
  fr(lx+11,ly+2,1,4,C.BN3);
  fr(lx+12,ly+4,3,2,C.TB2);
  fr(lx+12,ly+6,2,2,C.TB);
  fr(lx+14,ly+2,1,1,C.BN3);
  fr(lx+14,ly+7,1,2,C.BN3);

  // scattered cup / debris for old lived-in feel
  fr(lx+1,ly+11,1,1,C.BN2);
  fr(lx+13,ly+10,1,1,C.BN2);
  fr(lx+2,ly+12,2,1,C.TB);
  fr(lx+12,ly+12,1,1,C.TB);
}

function drawTornCarpetPatch(cx,ty){
  const carpetX=cx-6;
  fr(carpetX, ty, 12, 3, '#6a1f1b');
  fr(carpetX+1, ty+3, 10, 4, '#7f2b24');
  fr(carpetX-1, ty+7, 13, 3, '#6a1f1b');
  fr(carpetX+1, ty+10, 9, 3, '#8d3329');

  fr(carpetX+3, ty+2, 4, 1, '#4c1210');
  fr(carpetX+2, ty+3, 6, 1, '#5c1714');
  fr(carpetX+5, ty+4, 2, 1, '#2f0909');
  fr(carpetX+2, ty+6, 5, 1, '#561612');
  fr(carpetX+4, ty+7, 3, 1, '#2f0909');
  fr(carpetX+6, ty+8, 4, 1, '#3f0e0d');

  fr(carpetX+1, ty+12, 2, 1, '#4d120f');
  fr(carpetX+5, ty+12, 1, 1, '#4d120f');
  fr(carpetX+8, ty+12, 2, 1, '#4d120f');

  fr(carpetX+2, ty+18, 8, 3, '#6a1f1b');
  fr(carpetX+1, ty+21, 10, 4, '#7f2b24');
  fr(carpetX+3, ty+25, 7, 4, '#8d3329');

  fr(carpetX+4, ty+19, 4, 1, '#40100d');
  fr(carpetX+3, ty+22, 5, 1, '#561612');
  fr(carpetX+6, ty+24, 3, 1, '#2f0909');
  fr(carpetX+4, ty+26, 3, 1, '#6a1b18');
  fr(carpetX+7, ty+27, 2, 1, '#390d0c');

  fr(carpetX+2, ty+17, 2, 1, '#4d120f');
  fr(carpetX+6, ty+17, 1, 1, '#4d120f');
  fr(carpetX+9, ty+18, 1, 1, '#4d120f');
  fr(carpetX+2, ty+28, 1, 1, '#4d120f');
  fr(carpetX+8, ty+28, 1, 1, '#4d120f');
}

function drawZone1SecretCrack(active=false, opened=false){
  const x=SECRET1_ENTRANCE_RECT.x-2;
  const y=SECRET1_ENTRANCE_RECT.y-2;

  // stone wall recess behind the bookshelf
  fr(x, y, 8, 14, '#4f4339');
  fr(x+1, y+1, 6, 12, '#68584b');

  // light chipped masonry around the hidden hatch
  fr(x+1,y+1,2,2,'#9ca2ad');
  fr(x+5,y+2,1,2,'#8e949f');
  fr(x+1,y+10,2,1,'#aeb4be');
  fr(x+4,y+11,2,1,'#9ca2ad');

  // cellar door frame
  fr(x+1,y+2,6,10,'#8f949d');
  fr(x+2,y+3,4,8,'#3d2a1b');

  // vertical wooden hatch planks
  fr(x+2,y+3,1,8,'#6e4a2c');
  fr(x+3,y+3,1,8,'#825636');
  fr(x+4,y+3,1,8,'#734c2f');
  fr(x+5,y+3,1,8,'#8c5d39');

  // iron braces / latch so it reads like a cellar hatch
  fr(x+2,y+5,4,1,'#7d8794');
  fr(x+2,y+8,4,1,'#6b7480');
  fr(x+5,y+6,1,2,'#a6afb8');
  fr(x+4,y+6,1,1,'#2a3138');

  // tiny seam line through the middle
  fr(x+4,y+3,1,8,'#23160f');

  // when opened, the hatch swings away and reveals a dark crawl opening
  if(opened){
    // open door leaf pushed aside / hanging
    fr(x+1,y+3,2,8,'#5b3b22');
    fr(x+1,y+5,2,1,'#727b86');
    fr(x+1,y+8,2,1,'#5f6975');

    // dark entrance behind it
    fr(x+3,y+3,3,8,'#050608');
    for(let yy=0;yy<4;yy++) fr(x+3,y+4+yy*2,3,1,'#202734');

    // chipped edge / debris
    fr(x+2,y+2,1,1,'#aeb4be');
    fr(x+6,y+10,1,1,'#8e949f');
    fr(x+2,y+11,2,1,'#6d727d');
    fr(x+5,y+11,1,1,'#8e949f');
  }

  // subtle ready-state pulse once the room is cleared
  if(active){
    ctx.globalAlpha=0.08+0.04*Math.sin(frame*0.10);
    fr(x-1,y-1,10,16,C.MG2);
    ctx.globalAlpha=1;
  }
}

function drawBrokenBookshelf(lx,ly,variant=0){
  // wall shadow
  ctx.globalAlpha=0.18;
  fr(lx-1,ly,8,18,'#3a2617');
  ctx.globalAlpha=1;

  // frame
  fr(lx,ly,6,17,C.BN3);
  fr(lx+1,ly+1,4,15,C.TB2);
  fr(lx+1,ly+4,4,1,C.BN3);
  fr(lx+1,ly+9,4,1,C.BN3);
  fr(lx+1,ly+14,4,1,C.BN3);

  if(variant===1){
    // more open gaps on the newer right-side shelf
    fr(lx+2,ly+1,2,4,C.DK);
    fr(lx+1,ly+6,3,2,C.DK);
    fr(lx+3,ly+11,2,2,C.DK);

    // a few remaining books tucked to one side
    fr(lx+4,ly+2,1,2,C.SI2);
    fr(lx+4,ly+6,1,2,C.BN2);
    fr(lx+1,ly+11,1,2,C.TB);

    // lots more books spilled on the floor
    fr(lx-2,ly+17,2,1,C.BN2);
    fr(lx,ly+18,2,1,C.TB);
    fr(lx+2,ly+17,1,2,C.GR);
    fr(lx+4,ly+18,2,1,C.SI2);
    fr(lx+6,ly+17,1,2,C.BN2);
    fr(lx+1,ly+19,2,1,C.TB2);
  } else {
    // damage variation
    fr(lx+1,ly+11,2,2,C.DK);
    fr(lx+2,ly+2,1,2,C.DK);

    // books on shelves
    fr(lx+1,ly+2,1,2,C.GR);
    fr(lx+2,ly+2,1,2,C.BN2);
    fr(lx+3,ly+2,1,2,C.SI2);
    fr(lx+4,ly+2,1,2,C.TB);

    fr(lx+1,ly+6,1,2,C.BN2);
    fr(lx+2,ly+6,1,2,C.TB);
    fr(lx+3,ly+6,1,2,C.GR);
    fr(lx+4,ly+6,1,2,C.BN2);

    fr(lx+1,ly+11,1,2,C.SI2);
    fr(lx+2,ly+11,1,2,C.BN2);
    fr(lx+3,ly+11,1,2,C.TB);

    // books on floor
    fr(lx-1,ly+17,2,1,C.BN2);
    fr(lx+2,ly+18,1,1,C.TB);
    fr(lx+5,ly+17,1,2,C.GR);
  }
}

function drawDecorRubble(cx,cy,kind){
  // small static rubble pile after breaking zone 1 props
  ctx.globalAlpha=0.22;
  fr(cx-4,cy+3,8,1,'#6a4528');
  ctx.globalAlpha=1;

  if(kind===0 || kind===1){
    // shelf planks + books
    fr(cx-3,cy,3,1,C.BN3);
    fr(cx+1,cy+1,3,1,C.BN3);
    fr(cx-1,cy+2,1,1,C.GR);
    fr(cx+2,cy+2,1,1,C.BN2);
    fr(cx-3,cy+2,1,1,C.TB);
  } else if(kind===2){
    // table/chair debris
    fr(cx-3,cy,2,1,C.BN3);
    fr(cx,cy,2,1,C.BN3);
    fr(cx-1,cy+1,1,2,C.TB);
    fr(cx+2,cy+2,1,1,C.BN2);
  } else {
    // barrel debris
    fr(cx-2,cy,2,1,C.BN3);
    fr(cx+1,cy,2,1,C.BN3);
    fr(cx-1,cy+1,1,2,C.TB);
    fr(cx+2,cy+1,1,1,C.TB2);
  }
}


function drawCrate(lx,ly,broken=false){
  ctx.globalAlpha=0.20;
  fr(lx-1,ly+7,9,1,'#6b4a2c');
  ctx.globalAlpha=1;
  fr(lx,ly,7,7,C.TB2);
  fr(lx+1,ly+1,5,5,C.TB);
  fr(lx,ly+3,7,1,C.BN3);
  fr(lx+3,ly,1,7,C.BN3);
  fr(lx+1,ly+1,5,1,'#8b7350');
  if(broken){
    fr(lx+4,ly+4,2,2,C.DK);
    fr(lx+6,ly+5,1,1,C.BN3);
    fr(lx-1,ly+5,1,1,C.BN3);
  }
}

function drawBrokenWeaponRack(lx,ly,small=false){
  const h = small ? 8 : 10;
  ctx.globalAlpha=0.18;
  fr(lx-1,ly+h,10,1,'#5b3f29');
  ctx.globalAlpha=1;
  fr(lx,ly,1,h,C.BN3);
  fr(lx+6,ly+1,1,h-1,C.BN3);
  fr(lx,ly+2,7,1,C.TB2);
  fr(lx+1,ly+5,6,1,C.TB);
  fr(lx+2,ly+7,4,1,C.TB2);
  // snapped rails and scattered weapons
  fr(lx+4,ly+2,3,1,C.DK);
  fr(lx+1,ly+h+1,2,1,C.BN3);
  fr(lx+4,ly+h,2,1,C.SI2);
  fr(lx+6,ly+h+1,1,2,C.TB);
  fr(lx+3,ly+h+2,1,1,C.BN2);
  if(!small){
    fr(lx+2,ly+1,1,5,C.SI2);
    fr(lx+5,ly+2,1,4,C.BN2);
  }
}

function drawTrainingDummy(lx,ly){
  ctx.globalAlpha=0.20;
  fr(lx-2,ly+10,10,2,'#6b4a2c');
  ctx.globalAlpha=1;
  fr(lx+2,ly+1,2,10,'#8b7350');
  fr(lx,ly+9,6,1,C.BN3);
  fr(lx-1,ly+10,8,1,C.TB2);
  fr(lx+1,ly,4,1,'#d2c48b');
  fr(lx,ly+1,6,5,'#bda66d');
  fr(lx+1,ly+2,4,3,'#d7c58f');
  fr(lx+2,ly+1,1,5,'#e5d7a8');
  fr(lx-2,ly+3,3,1,C.TB);
  fr(lx+5,ly+3,3,1,C.TB);
  fr(lx-1,ly+4,2,1,C.TB2);
  fr(lx+5,ly+4,2,1,C.TB2);
}

function drawFloorLantern(lx,ly){
  const glow=0.17 + 0.05*Math.sin(frame*0.05 + lx*0.08 + ly*0.05);
  ctx.globalAlpha=0.18+glow;
  fr(lx-4,ly-3,12,10,C.FR2);
  ctx.globalAlpha=0.10+glow*0.8;
  fr(lx-2,ly-2,8,8,C.FR1);
  ctx.globalAlpha=0.05+glow*0.4;
  fr(lx-6,ly-5,16,14,'#d8f6ff');
  ctx.globalAlpha=1;
  fr(lx+1,ly+1,4,4,'#3d4649');
  fr(lx+2,ly+2,2,2,'#f7d889');
  fr(lx+2,ly,2,1,'#6c7377');
  fr(lx+1,ly+5,4,1,'#1a1f22');
  if(Math.sin(frame*0.05 + lx*0.08)>0.25) fr(lx+2,ly+2,1,1,C.WH);
}

function drawBrokenFloorLantern(lx,ly){
  const flicker=0.16 + 0.06*Math.sin(frame*0.17 + lx*0.11 + ly*0.07);
  ctx.globalAlpha=0.10+flicker;
  fr(lx-2,ly-1,10,8,C.FR2);
  ctx.globalAlpha=0.08+flicker*0.6;
  fr(lx,ly,6,6,C.FR1);
  ctx.globalAlpha=1;
  fr(lx+1,ly+5,5,1,'#1a1f22');
  fr(lx+1,ly+4,2,1,'#3d4649');
  fr(lx+4,ly+4,2,1,'#2b3133');
  const f=Math.sin(frame*0.21 + lx*0.03);
  fr(lx+2,ly+2,2,2,C.FR2);
  fr(lx+3,ly+1+(f>0?0:1),1,2,C.FR1);
  if(f>0.15) fr(lx+3,ly,1,1,C.BN1);
}

function isZoneBreakableBroken(zone, idx){
  if(zone===2) return !!(zone2Broken && zone2Broken[idx]);
  if(zone===3) return !!(zone3Broken && zone3Broken[idx]);
  return false;
}

function getZoneBreakableRenderDefs(zone, layer){
  try{
    if(window.BoneCrawlerZoneObjects && typeof BoneCrawlerZoneObjects.getBreakablesByLayer === 'function'){
      return BoneCrawlerZoneObjects.getBreakablesByLayer(zone, layer);
    }
  }catch(err){}
  return [];
}

function drawZoneBreakableObject(def){
  if(!def || !def.render) return;
  const r=def.render;
  const broken=isZoneBreakableBroken(def.zone, def.index);
  if(!broken){
    if(r.sprite==='bookshelf') drawBrokenBookshelf(r.x, r.y, r.variant||0);
    else if(r.sprite==='crate') drawCrate(r.x, r.y, !!r.variant);
    else if(r.sprite==='barrel') drawBarrel(r.x, r.y, r.variant||0);
    else if(r.sprite==='roundTableSet') drawBrokenRoundTableSet(r.x, r.y);
    else if(r.sprite==='floorLantern') drawFloorLantern(r.x, r.y);
    return;
  }
  const b=def.broken || {};
  if(b.sprite==='smallFlame') drawBrokenFloorLantern(b.x, b.y);
  else drawDecorRubble(b.x || r.x, b.y || r.y, b.variant || 0);
}

function drawZoneBreakablesByLayer(zone, layer){
  const defs=getZoneBreakableRenderDefs(zone, layer);
  for(const def of defs) drawZoneBreakableObject(def);
}

function drawZoneBreakableOverlays(zone){
  let defs=[];
  try{
    if(window.BoneCrawlerZoneObjects && typeof BoneCrawlerZoneObjects.getOverlayBreakables === 'function'){
      defs=BoneCrawlerZoneObjects.getOverlayBreakables(zone);
    }
  }catch(err){}
  for(const def of defs){
    if(!def || !def.render || !def.render.overlayRect || isZoneBreakableBroken(def.zone, def.index)) continue;
    const o=def.render.overlayRect;
    withClipRect(o.x,o.y,o.w,o.h,()=>{
      if(def.render.sprite==='bookshelf') drawBrokenBookshelf(def.render.x, def.render.y, def.render.variant||0);
      else if(def.render.sprite==='roundTableSet') drawBrokenRoundTableSet(def.render.x, def.render.y);
    });
  }
}


function drawMushroom(lx,ly,cap='#c84a8d', stem='#d9d0c3'){
  fr(lx+1,ly+2,1,2,stem);
  fr(lx,ly+1,3,1,cap);
  fr(lx+1,ly,1,1,'#f2d6e8');
}
function drawZone2TriHole(lx,ly,flip=false){
  const edgeA='#a3adb6', edgeB='#858f98', edgeC='#68727a', edgeD='#4d565e';
  fr(lx-2,ly+1,1,1,edgeD); fr(lx-1,ly,2,1,edgeB); fr(lx,ly-1,2,1,edgeA);
  fr(lx+2,ly-1,2,1,edgeB); fr(lx+4,ly,1,1,edgeC); fr(lx+5,ly+1,1,1,edgeD);
  fr(lx-1,ly+2,1,1,edgeC); fr(lx+5,ly+2,1,1,edgeC); fr(lx,ly+4,2,1,edgeD);
  fr(lx+2,ly+4,2,1,edgeB); fr(lx+4,ly+3,1,1,edgeD);
  fr(lx-3,ly+2,1,1,edgeB); fr(lx+6,ly+2,1,1,edgeB);
  fr(lx-2,ly+3,2,1,edgeD); fr(lx+5,ly+3,2,1,edgeD);
  fr(lx+1,ly+5,1,1,edgeC); fr(lx+3,ly+5,1,1,edgeC);
  if(!flip){
    fr(lx+1,ly+1,2,1,'#06080a');
    fr(lx+1,ly+2,3,1,'#050608');
    fr(lx+2,ly+3,1,1,'#050608');
  } else {
    fr(lx+2,ly+1,2,1,'#06080a');
    fr(lx+1,ly+2,3,1,'#050608');
    fr(lx+2,ly+3,1,1,'#050608');
  }
  fr(lx+2,ly+2,1,1,'#1d252c');
  fr(lx-1,ly+1,1,2,'#57616a');
  fr(lx+4,ly+1,1,2,'#57616a');
  fr(lx+1,ly+4,3,1,'#57616a');
}

function drawStonePillar(px,py){
  fr(px,py,5,12,'#6f757c');
  fr(px+1,py+1,3,10,'#969ca2');
  fr(px,py,5,1,'#b7bcc1');
  fr(px,py+11,5,1,'#555c63');
  fr(px+2,py+2,1,8,'#c7ccd0');
}

function drawRockCluster(rx,ry,size=0){
  const cols=[['#666c73','#8a9096'],['#575e66','#7b838b'],['#6f767d','#949aa0']][size%3];
  fr(rx,ry,6,4,cols[0]);
  fr(rx+1,ry+1,4,2,cols[1]);
  fr(rx+2,ry,2,1,'#4d535a');
}

function drawZone1DoorDecor(){
  const doorX=GW/2-6;

  // spread chains farther from the doorway and add a little wall hardware
  drawChainColumn(doorX-12,2,5);
  drawChainColumn(doorX+22,2,5);
  fr(doorX-6,9,3,1,C.SI3);
  fr(doorX+13,9,3,1,C.SI3);

  // more spread-out web detail
  drawSpiderWeb(doorX-7,5);
  drawSpiderWeb(doorX+18,5);
  drawSpiderWeb(doorX+17,13);
  drawSpiderWeb(doorX+25,9);
  drawSpiderWeb(PX+14,PY+10);

  // ripped carpet halves, separated around the middle
  const carpetX=GW/2-6;
  // upper half near the door
  fr(carpetX, PY, 12, 3, '#6a1f1b');
  fr(carpetX+1, PY+3, 10, 4, '#7f2b24');
  fr(carpetX-1, PY+7, 13, 3, '#6a1f1b');
  fr(carpetX+1, PY+10, 9, 3, '#8d3329');

  fr(carpetX+3, PY+2, 4, 1, '#4c1210');
  fr(carpetX+2, PY+3, 6, 1, '#5c1714');
  fr(carpetX+5, PY+4, 2, 1, '#2f0909');
  fr(carpetX+2, PY+6, 5, 1, '#561612');
  fr(carpetX+4, PY+7, 3, 1, '#2f0909');
  fr(carpetX+6, PY+8, 4, 1, '#3f0e0d');

  // torn edge
  fr(carpetX+1, PY+12, 2, 1, '#4d120f');
  fr(carpetX+5, PY+12, 1, 1, '#4d120f');
  fr(carpetX+8, PY+12, 2, 1, '#4d120f');

  // lower half farther away on the floor
  fr(carpetX+2, PY+18, 8, 3, '#6a1f1b');
  fr(carpetX+1, PY+21, 10, 4, '#7f2b24');
  fr(carpetX+3, PY+25, 7, 4, '#8d3329');

  fr(carpetX+4, PY+19, 4, 1, '#40100d');
  fr(carpetX+3, PY+22, 5, 1, '#561612');
  fr(carpetX+6, PY+24, 3, 1, '#2f0909');
  fr(carpetX+4, PY+26, 3, 1, '#6a1b18');
  fr(carpetX+7, PY+27, 2, 1, '#390d0c');

  // ragged lower torn edge / wear
  fr(carpetX+2, PY+17, 2, 1, '#4d120f');
  fr(carpetX+6, PY+17, 1, 1, '#4d120f');
  fr(carpetX+9, PY+18, 1, 1, '#4d120f');
  fr(carpetX+2, PY+28, 1, 1, '#4d120f');
  fr(carpetX+8, PY+28, 1, 1, '#4d120f');

  // opposite-side runner pieces pulling toward the room center
  fr(carpetX-24, PY+48, 9, 3, '#6a1f1b');
  fr(carpetX-22, PY+51, 10, 4, '#7f2b24');
  fr(carpetX-18, PY+55, 7, 3, '#8d3329');
  fr(carpetX+27, PY+48, 9, 3, '#6a1f1b');
  fr(carpetX+26, PY+51, 10, 4, '#7f2b24');
  fr(carpetX+27, PY+55, 7, 3, '#8d3329');

  drawZone1SecretCrack(zone1SecretEntranceReady(), zone1Broken[0]);

  // bookshelves along the walls (breakable)
  if(!zone1Broken[0]) drawBrokenBookshelf(PX+2, PY+22, 0);
  else drawDecorRubble(PX+5, PY+39, 0);

  if(!zone1Broken[1]) drawBrokenBookshelf(PX+PW-8, PY+20, 1);
  else drawDecorRubble(PX+PW-5, PY+37, 1);

  // broken rack beside the added right shelf
  drawBrokenWeaponRack(PX+PW-17, PY+28, true);

  // lone broken barrel near the upper-right
  if(!zone1Broken[3]) drawBarrel(PX+PW-14, PY+8, 4);
  else drawDecorRubble(PX+PW-11, PY+15, 3);

  // barrels grouped together at the bottom-right
  if(!zone1Broken[4]) drawBarrel(PX+PW-24, PY+PH-22, 2);
  else drawDecorRubble(PX+PW-21, PY+PH-15, 4);

  if(!zone1Broken[5]) drawBarrel(PX+PW-16, PY+PH-20, 0);
  else drawDecorRubble(PX+PW-13, PY+PH-13, 5);

  if(!zone1Broken[6]) drawBarrel(PX+PW-9,  PY+PH-23, 5);
  else drawDecorRubble(PX+PW-6, PY+PH-16, 6);

  if(!zone1Broken[7]) drawBarrel(PX+PW-18, PY+PH-13, 3);
  else drawDecorRubble(PX+PW-15, PY+PH-6, 7);

  if(!zone1Broken[8]) drawBarrel(PX+PW-10, PY+PH-12, 1);
  else drawDecorRubble(PX+PW-7, PY+PH-5, 8);

  if(!zone1Broken[2]) drawBrokenRoundTableSet(PX+10,PY+11);
  else drawDecorRubble(PX+17, PY+22, 2);

  // bottom-left training nook
  drawBrokenWeaponRack(PX+10, PY+PH-17, false);
  drawTrainingDummy(PX+20, PY+PH-18);

}

function drawMenuTorch(lx,ly){
  ds(S.torch,lx,ly);

  // broad static wall glow
  ctx.globalAlpha=0.20;
  fr(lx-8,ly-8,20,16,C.FR2);
  ctx.globalAlpha=0.14;
  fr(lx-6,ly-6,16,12,C.FR1);
  ctx.globalAlpha=0.10;
  fr(lx-4,ly-3,12,8,C.BN1);

  // fixed flame shape
  fr(lx+1,ly-2,3,1,C.BN1);
  fr(lx,ly-1,5,2,C.FR2);
  fr(lx+1,ly+1,3,2,C.FR1);
  fr(lx+2,ly-3,1,1,C.WH);
  fr(lx+2,ly-2,1,1,C.BN1);
  fr(lx+1,ly,1,1,C.FR2);
  fr(lx+3,ly,1,1,C.FR2);

  // little static ember accents
  ctx.globalAlpha=0.32;
  fr(lx-1,ly+1,1,1,C.FR1);
  fr(lx+5,ly,1,1,C.BN1);
  ctx.globalAlpha=1;
}

function withClipRect(x,y,w,h,fn){
  ctx.save();
  ctx.beginPath();
  ctx.rect(x*SCALE,y*SCALE,w*SCALE,h*SCALE);
  ctx.clip();
  fn();
  ctx.restore();
}

function drawZoneFrontOverlays(){
  if(currentZone===1){
    if(!zone1Broken[0]) withClipRect(PX+2,PY+22,6,11,()=>drawBrokenBookshelf(PX+2, PY+22, 0));
    if(!zone1Broken[1]) withClipRect(PX+PW-8,PY+20,6,11,()=>drawBrokenBookshelf(PX+PW-8, PY+20, 1));
    return;
  }
  if(currentZone===2){
    drawZoneBreakableOverlays(2);
    withClipRect(GW/2-14,PY+30,29,24,()=>drawZone2Tree());
    return;
  }
  if(currentZone===3){
    drawZoneBreakableOverlays(3);
    withClipRect(PX+8,PY+PH-28,28,22,()=>drawZone3BrokenTreeCluster());
    return;
  }
  if(currentZone===ZONE_SECRET2){
    const cx=GW/2, cy=PY+43;
    if(!masterSwordOwned) withClipRect(cx-7, cy-15, 14, 18, ()=>drawSecret2SwordOverlay(cx, cy));
  }
}

