// render-menus
// Purpose: Upgrade menu, title screen, intro, scoreboard, dialogs, pause, game over, confirmation overlays.
// ── Upgrade Menu ─────────────────────────────────────────────
function rUpgrade(){
  // Dark overlay
  ctx.fillStyle='rgba(6,4,2,0.93)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  // Title
  pt('YOU FOUND A CHEST!',GW*SCALE/2,10*SCALE,6,C.FR1,'center',C.DK);
  pt('CHOOSE YOUR UPGRADE',GW*SCALE/2,22*SCALE,6,C.BN1,'center',C.DK);

  // Three option buttons
  if(!currentUpgradeBtns.length) rollUpgradeChoices();
  for(const btn of currentUpgradeBtns) _upBtn(btn);

  // Hint
  pt('PRESS  1  2  3',GW*SCALE/2,100*SCALE,5,C.BN1,'center',C.DK);
  pt('OR CLICK',GW*SCALE/2,106*SCALE,5,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function _upBtn(btn){
  drawPanelFrame(btn.x,btn.y,btn.w,btn.h,{edge:btn.border,fill:'rgba(3,3,4,0.94)',inner:'rgba(28,20,10,0.26)',glow:btn.border,ornate:false});

  if(btn.icon==='shieldIcon') ds(S.shieldIcon,btn.x+4,btn.y+4);
  else if(btn.icon==='upSword') ds(S.upSword,btn.x+2,btn.y+3);
  else if(btn.icon==='upSpeed') ds(S.upSpeed,btn.x+2,btn.y+3);
  else if(btn.icon==='shadowStepIcon') ds(S.shadowStepIcon,btn.x+3,btn.y+4);
  else if(btn.icon==='pointsIcon'){
    pt('+', (btn.x+6)*SCALE, (btn.y+1)*SCALE, 10, C.FR1, 'center', C.DK);
    pt('PTS', (btn.x+6)*SCALE, (btn.y+10)*SCALE, 6, C.BN1, 'center', C.DK);
  }
  else ds(S[btn.icon],btn.x+4,btn.y+4);

  const textCx=(btn.x+btn.w/2+5)*SCALE;
  pt(btn.num+'  '+btn.label,textCx,(btn.y+3)*SCALE,(btn.labelFs||7),btn.text,'center',C.DK);
  pt(btn.sub,textCx,(btn.y+10)*SCALE,(btn.subFs||5),C.BN1,'center',C.DK);
  if(btn.type==='heart' && isHealthFull()){
    pt('MAX', (btn.x+btn.w-8)*SCALE, (btn.y+2)*SCALE, 4, C.FR1, 'center', C.DK);
  }
}

function drawPanelFrame(x,y,w,h,opt={}){
  const edge=opt.edge||C.WH;
  const fill=opt.fill||C.BG;
  const inner=opt.inner||'rgba(255,255,255,0.02)';
  const glow=opt.glow||edge;
  const ornate=opt.ornate!==false;
  ctx.save();
  ctx.globalAlpha=0.22;
  ctx.fillStyle=glow;
  ctx.fillRect((x-1)*SCALE,(y-1)*SCALE,(w+2)*SCALE,(h+2)*SCALE);
  ctx.globalAlpha=1;
  fr(x,y,w,h,C.DK);
  ctx.fillStyle=fill;
  ctx.fillRect((x+1)*SCALE,(y+1)*SCALE,(w-2)*SCALE,(h-2)*SCALE);
  ctx.fillStyle=inner;
  ctx.fillRect((x+2)*SCALE,(y+2)*SCALE,(w-4)*SCALE,(h-4)*SCALE);
  ctx.fillStyle=edge;
  ctx.fillRect(x*SCALE,y*SCALE,w*SCALE,SCALE);
  ctx.fillRect(x*SCALE,(y+h-1)*SCALE,w*SCALE,SCALE);
  ctx.fillRect(x*SCALE,y*SCALE,SCALE,h*SCALE);
  ctx.fillRect((x+w-1)*SCALE,y*SCALE,SCALE,h*SCALE);
  ctx.fillStyle='rgba(255,255,255,0.08)';
  ctx.fillRect((x+1)*SCALE,(y+1)*SCALE,(w-2)*SCALE,SCALE);
  if(ornate){
    const cs=[[x+1,y+1],[x+w-3,y+1],[x+1,y+h-3],[x+w-3,y+h-3]];
    for(const [cx,cy] of cs){
      fr(cx,cy,2,1,edge); fr(cx,cy+1,1,1,edge);
    }
  }
  ctx.restore();
}

function drawMenuChains(){
  ctx.globalAlpha=0.35;
  for(let i=0;i<7;i++){ fr(51+(i%2),i*2,1,1,C.SI2); fr(67-(i%2),i*2,1,1,C.SI2); }
  ctx.globalAlpha=1;
}

function drawWallSkull(lx,ly,small=false){
  const spr=small?S.mskull:S.skull;
  ds(spr,lx,ly);
  ctx.save();
  ctx.globalAlpha=0.9;
  if(!small){
    // chipped crown / cheek / jaw
    fr(lx+1,ly+1,1,1,C.DK);
    fr(lx+9,ly+2,1,1,C.DK);
    fr(lx+3,ly+4,1,1,C.DK);
    fr(lx+8,ly+7,1,1,C.DK);
    fr(lx+6,ly+9,1,1,C.DK);
    // cracks
    fr(lx+4,ly+2,1,1,C.BN3);
    fr(lx+5,ly+3,1,1,C.DK);
    fr(lx+5,ly+4,1,1,C.BN3);
    fr(lx+7,ly+5,1,1,C.DK);
    fr(lx+8,ly+6,1,1,C.BN3);
    // missing tooth / jaw chip
    fr(lx+4,ly+9,1,2,C.DK);
  }else{
    fr(lx+1,ly,1,1,C.DK);
    fr(lx+2,ly+2,1,1,C.BN3);
    fr(lx+3,ly+3,1,1,C.DK);
  }
  ctx.restore();
}

// ── Title screen ──────────────────────────────────────────────
const MENU_HERO_IMAGE_SRC = 'assets/title.jpg';
const menuHeroImg = new Image();
let menuHeroReady = false;
menuHeroImg.onload = ()=>{ menuHeroReady = true; };
menuHeroImg.src = MENU_HERO_IMAGE_SRC;

function drawMenuBgFallback(){
  // dark dungeon chamber
  fr(0,0,GW,GH,C.DK);
  fr(0,0,GW,74,'#121822');
  fr(0,74,GW,GH-74,'#23170f');

  // rear stone wall
  for(let y=4;y<72;y+=8){
    fr(0,y,GW,1,C.WH);
    const off=((y/8)%2)*5;
    for(let x=off;x<GW;x+=12){
      fr(x,y+1,7,4,C.W1);
      fr(x+7,y+1,5,4,C.W2);
      fr(x,y+5,12,2,C.W3);
      if(((x+y)>>2)%4===0) fr(x+2,y+2,2,1,C.WH);
      if(((x+y)>>2)%5===0) fr(x+8,y+3,2,1,C.DK);
      if(((x+y)>>1)%7===0) fr(x+5,y+5,1,1,C.DK);
    }
  }

  // side pillars / chamber framing
  fr(6,6,8,68,'#1d242d'); fr(7,7,6,66,'#2a3542'); fr(9,8,2,64,C.W3);
  fr(GW-14,6,8,68,'#1d242d'); fr(GW-13,7,6,66,'#2a3542'); fr(GW-11,8,2,64,C.W3);

  // arched alcove in the center back wall
  fr(32,12,56,50,'#1b211f');
  fr(34,14,52,46,'#31403f');
  fr(38,18,44,38,'#4b3022');
  fr(40,20,40,36,C.TB);
  for(let x=42;x<79;x+=6) fr(x,20,1,36,C.TB2);
  fr(36,12,48,3,C.W1); fr(39,15,42,2,C.WH);

  // iron gate inside the alcove
  fr(52,30,16,12,C.DK);
  fr(53,31,14,10,C.W2);
  for(let gx=55;gx<=65;gx+=4) fr(gx,31,1,10,C.SI2);
  for(let gy=33;gy<=39;gy+=2) fr(53,gy,14,1,C.SI2);

  // cracks on the wall
  const cracks=[
    [[18,22],[19,25],[17,28],[18,31],[16,35]],
    [[95,18],[94,21],[96,24],[95,27],[97,30]],
    [[59,10],[58,14],[60,17],[59,20],[61,23]],
    [[26,40],[28,43],[27,46],[29,49]],
    [[86,41],[85,44],[87,48],[86,51]]
  ];
  for(const crack of cracks){
    for(let i=0;i<crack.length;i++){
      fr(crack[i][0],crack[i][1],1,1,C.DK);
      if(i%2===0) fr(crack[i][0]+1,crack[i][1],1,1,C.W3);
    }
  }

  // upper trim
  fr(0,0,GW,2,C.WH);
  fr(0,2,GW,1,C.W3);

  // floor boards / stone
  fr(0,72,GW,GH-72,C.FL);
  for(let y=72;y<GH;y+=7) fr(0,y,GW,1,C.FL2);
  for(let x=0;x<GW;x+=16) fr(x,82,1,GH-82,C.TB2);

  // long runner / ritual carpet leading to center
  fr(48,60,24,8,'#3c1414');
  fr(46,68,28,10,'#521b1a');
  fr(44,78,32,18,'#671f1d');
  fr(42,96,36,26,'#7a2521');
  fr(45,123,30,12,'#521b1a');
  for(let y=61;y<133;y+=8) fr(50,y,20,1,'#9e8562');
  fr(55,72,10,1,'#2c0a0a'); fr(54,95,12,1,'#2c0a0a'); fr(56,116,8,1,'#2c0a0a');

  // circular platform behind the title banner
  fr(38,54,44,4,C.W3);
  fr(36,58,48,4,C.W2);
  fr(34,62,52,4,C.W1);
  fr(37,66,46,2,'#5d6a69');

  // central standing figure, player-like silhouette
  const px=58, py=46;
  fr(px+2,py,4,1,C.BN1);
  fr(px+1,py+1,6,2,C.SI2);
  fr(px+2,py+3,4,2,C.SI3);
  fr(px+3,py+5,2,6,C.WH);
  fr(px+2,py+6,1,4,C.SI2); fr(px+5,py+6,1,4,C.SI2);
  fr(px+1,py+7,1,4,C.SI2); fr(px+6,py+7,1,4,C.SI2);
  fr(px+2,py+11,1,5,C.SI2); fr(px+5,py+11,1,5,C.SI2);
  fr(px+1,py+16,2,1,C.BN3); fr(px+5,py+16,2,1,C.BN3);
  fr(px+7,py+6,1,7,C.SI2); fr(px+8,py+6,1,7,C.SI1);
  fr(px+6,py+6,3,1,C.BN1);
  ctx.globalAlpha=0.16+0.05*Math.sin(frame*0.08);
  fr(px-3,py-2,14,20,C.WH);
  ctx.globalAlpha=1;

  // surrounding skeletons
  const skels=[[26,52,false],[34,86,true],[88,54,true],[82,88,false],[16,100,false],[100,100,true]];
  for(const [sx,sy,flip] of skels){
    ctx.globalAlpha=0.88;
    dsMap(S.mskull,sx,sy,{1:C.BN1,2:C.BN2,3:C.WH,4:C.DK,5:C.SI3},flip);
    fr(sx+3,sy+6,2,5,C.BN2);
    fr(sx+1,sy+8,1,4,C.BN2); fr(sx+6,sy+8,1,4,C.BN2);
    fr(sx+2,sy+11,1,4,C.BN3); fr(sx+5,sy+11,1,4,C.BN3);
    fr(sx+1,sy+15,2,1,C.BN3); fr(sx+5,sy+15,2,1,C.BN3);
  }
  ctx.globalAlpha=1;

  // debris / bones near the floor edges
  const piles=[[12,127],[22,122],[96,125],[106,120],[18,111],[101,109]];
  ctx.globalAlpha=0.42;
  for(const [bx,by] of piles){
    fr(bx,by,3,1,C.BN2); fr(bx+1,by+1,1,1,C.BN3); fr(bx+3,by+1,1,1,C.BN2);
  }
  ctx.globalAlpha=1;

  // torches
  drawMenuTorch(6,34);
  drawMenuTorch(GW-10,34);

  // chains and skull ornaments
  drawMenuChains();
  drawWallSkull(GW/2-6,7);
  drawWallSkull(8,22);
  drawWallSkull(GW-20,22);
}

function drawMenuBg(){
  if(!menuHeroReady || !menuHeroImg.complete || !menuHeroImg.naturalWidth){
    drawMenuBgFallback();
    return;
  }

  const w = GW*SCALE;
  const h = GH*SCALE;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = C.DK;
  ctx.fillRect(0,0,w,h);

  const heroZoom = 1.10;
  const drawW = Math.ceil(w * heroZoom);
  const drawH = Math.ceil(h * heroZoom);
  const drawX = Math.floor((w - drawW) / 2) - 1 * SCALE;
  const drawY = Math.floor((h - drawH) / 2) - 3 * SCALE;

  ctx.drawImage(menuHeroImg,0,0,menuHeroImg.naturalWidth || menuHeroImg.width,menuHeroImg.naturalHeight || menuHeroImg.height,drawX,drawY,drawW,drawH);

  // overall dark pass so the framed title and buttons stay readable
  ctx.fillStyle = 'rgba(0,0,0,0.24)';
  ctx.fillRect(0,0,w,h);

  // subtle top shade for the title banner area
  const topShade = ctx.createLinearGradient(0,0,0,84*SCALE);
  topShade.addColorStop(0,'rgba(0,0,0,0.26)');
  topShade.addColorStop(0.55,'rgba(0,0,0,0.08)');
  topShade.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = topShade;
  ctx.fillRect(0,0,w,84*SCALE);

  // stronger bottom gradient so the button stack remains clear
  const bottomShade = ctx.createLinearGradient(0,72*SCALE,0,h);
  bottomShade.addColorStop(0,'rgba(0,0,0,0)');
  bottomShade.addColorStop(0.45,'rgba(0,0,0,0.18)');
  bottomShade.addColorStop(0.75,'rgba(0,0,0,0.42)');
  bottomShade.addColorStop(1,'rgba(0,0,0,0.74)');
  ctx.fillStyle = bottomShade;
  ctx.fillRect(0,0,w,h);

  // side vignette to hold the eye in the center hero composition
  const sideShade = ctx.createLinearGradient(0,0,w,0);
  sideShade.addColorStop(0,'rgba(0,0,0,0.36)');
  sideShade.addColorStop(0.12,'rgba(0,0,0,0.10)');
  sideShade.addColorStop(0.50,'rgba(0,0,0,0)');
  sideShade.addColorStop(0.88,'rgba(0,0,0,0.10)');
  sideShade.addColorStop(1,'rgba(0,0,0,0.36)');
  ctx.fillStyle = sideShade;
  ctx.fillRect(0,0,w,h);

  // faint panel support behind the button column
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = C.DK;
  ctx.fillRect(21*SCALE,73*SCALE,78*SCALE,39*SCALE);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function rMenuBtn(btn,label){
  drawPanelFrame(btn.x,btn.y,btn.w,btn.h,{edge:C.BN2,fill:'rgba(6,6,7,0.92)',inner:'rgba(28,44,52,0.18)',glow:C.WH});

  // Cool inner glow strip
  ctx.globalAlpha=0.16;
  ctx.fillStyle=C.WH;
  ctx.fillRect((btn.x+2)*SCALE,(btn.y+2)*SCALE,(btn.w-4)*SCALE,2*SCALE);
  ctx.globalAlpha=1;

  // Corner rune pixel marks (2×2 bright dots)
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.55;
  ctx.fillRect((btn.x+2)*SCALE,(btn.y+2)*SCALE,2*SCALE,2*SCALE);
  ctx.fillRect((btn.x+btn.w-4)*SCALE,(btn.y+2)*SCALE,2*SCALE,2*SCALE);
  ctx.fillRect((btn.x+2)*SCALE,(btn.y+btn.h-4)*SCALE,2*SCALE,2*SCALE);
  ctx.fillRect((btn.x+btn.w-4)*SCALE,(btn.y+btn.h-4)*SCALE,2*SCALE,2*SCALE);
  ctx.globalAlpha=1;

  // Horizontal hairline divider near bottom of button
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.22;
  ctx.fillRect((btn.x+3)*SCALE,(btn.y+btn.h-3)*SCALE,(btn.w-6)*SCALE,SCALE);
  ctx.globalAlpha=1;

  let fs=10;
  if(label==='SCOREBOARD') fs=7;
  else if(label.startsWith('NAME:')) fs=8;
  else if(label.length>=10) fs=8;

  const cx=(btn.x+btn.w/2)*SCALE;
  const cy=(btn.y+btn.h/2)*SCALE;
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.font=fs+'px "Press Start 2P",monospace';
  ctx.fillStyle=C.DK;
  ctx.fillText(label,cx+1,cy);
  ctx.fillText(label,cx-1,cy);
  ctx.fillText(label,cx,cy+1);
  ctx.fillText(label,cx,cy-1);
  ctx.fillStyle=C.BN1;
  ctx.fillText(label,cx,cy);
  ctx.textBaseline='top';
}

function drawDevKitNodeIcon(lx,ly,pulseCol){
  // Tiny Node-style profile icon
  const furDark = '#24170f';
  const furDeep = '#3a2417';
  const furMid = '#6b4a2e';
  const furWarm = '#927046';
  const furLight = '#d0a86a';
  const earInner = '#b66b5c';
  const eye = '#050403';
  const nose = '#120b07';
  const whisker = '#d9c083';
  const brass = '#c59b4d';

  // Back / front ears.
  fr(lx+1,ly+3,3,5,furDark);
  fr(lx+2,ly+4,1,3,earInner);
  fr(lx+5,ly+0,5,7,furDark);
  fr(lx+6,ly+1,3,5,furWarm);
  fr(lx+7,ly+2,1,3,earInner);

  // Head and cheek mass, side-profile facing right.
  fr(lx+4,ly+6,9,2,furDark);
  fr(lx+3,ly+8,12,4,furMid);
  fr(lx+5,ly+12,9,3,furDeep);
  fr(lx+6,ly+8,7,3,furWarm);
  fr(lx+7,ly+11,5,1,furLight);

  // Snout / nose.
  fr(lx+13,ly+7,5,2,furDark);
  fr(lx+14,ly+9,6,3,furWarm);
  fr(lx+15,ly+12,4,1,furDeep);
  fr(lx+17,ly+9,3,1,furLight);
  fr(lx+20,ly+9,1,2,nose);

  // Eye / brow.
  fr(lx+10,ly+6,1,1,furLight);
  fr(lx+11,ly+6,1,1,eye);
  fr(lx+10,ly+5,3,1,furDark);
  if(((sceneFrame/34)|0) % 2 === 0) fr(lx+11,ly+6,1,1,pulseCol);

  // Collar / harness hints.
  fr(lx+5,ly+15,8,2,furDeep);
  fr(lx+7,ly+15,1,1,brass);
  fr(lx+11,ly+15,1,1,brass);

  // Whiskers.
  fr(lx+17,ly+7,5,1,whisker);
  fr(lx+17,ly+11,5,1,'#a98452');
}

function drawDevKitPulseText(text,x,y,size,mainCol,glowCol,align='center'){
  ctx.save();
  const pulse = 0.65 + 0.35*Math.sin(sceneTime*3.3);
  ctx.globalAlpha = 0.26 + 0.14*pulse;
  ptHeavy(text,x,y,size,glowCol,align,C.DK);
  ctx.globalAlpha = 1;
  ptHeavy(text,x,y,size,mainCol,align,glowCol);
  ctx.restore();
}

function rDevKitTitleButton(){
  if(!shouldShowDevKitTitleButton()) return;

  const btn = DEVKIT_TITLE_BTN;

  const t = sceneTime * 1.8;
  const pulse = 0.5 + 0.5 * Math.sin(t);
  const ember = `rgb(${Math.round(165 + 55*Math.sin(t))},${Math.round(68 + 34*Math.sin(t+1.1))},${Math.round(24 + 18*Math.sin(t+2.2))})`;
  const gold = `rgb(${Math.round(202 + 36*Math.sin(t+0.7))},${Math.round(156 + 34*Math.sin(t+1.8))},${Math.round(66 + 22*Math.sin(t+3.0))})`;
  const rune = `rgb(${Math.round(78 + 32*Math.sin(t+2.4))},${Math.round(122 + 48*Math.sin(t+3.5))},${Math.round(62 + 26*Math.sin(t+4.4))})`;
  const pale = 'rgb(238,222,170)';

  const cx = (btn.x + btn.w/2) * SCALE;
  const iconX = btn.x + 7;
  const iconY = btn.y + 0;

  ctx.save();

  ctx.globalAlpha = 0.16 + pulse * 0.16;
  fr(btn.x+5,btn.y+3,24,4,gold);
  ctx.globalAlpha = 0.10 + (1-pulse) * 0.18;
  fr(btn.x+8,btn.y+0,18,14,ember);
  ctx.globalAlpha = 0.10 + pulse * 0.15;
  fr(btn.x+10,btn.y+5,14,18,rune);

  for(let i=0;i<10;i++){
    const sx = btn.x + 2 + (((sceneFrame/18) + i*5) % Math.max(1, btn.w-4));
    const sy = btn.y + 1 + ((i*3 + Math.sin(t*1.4+i)*8) | 0);
    ctx.globalAlpha = 0.28 + 0.24 * (0.5 + 0.5 * Math.sin(t*2.2 + i));
    fr(sx|0,sy|0,1,1,i%3===0?rune:(i%2?gold:ember));
  }

  ctx.globalAlpha = 1;
  drawDevKitNodeIcon(iconX,iconY,gold);

  drawDevKitPulseText('DEV KIT!',cx,(btn.y+18)*SCALE,6,pale,ember,'center');
  drawDevKitPulseText('CLICK HERE!',cx,(btn.y+26)*SCALE,5,gold,rune,'center');

  ctx.restore();
}

function rTitle(){
  drawMenuBg();
  rDevKitTitleButton();

  // Horizontal rule lines inside title panel
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.38;
  ctx.fillRect(16*SCALE,42*SCALE,88*SCALE,SCALE); // top outer line
  ctx.fillRect(16*SCALE,60*SCALE,88*SCALE,SCALE); // bottom outer line
  ctx.fillRect(19*SCALE,43*SCALE,84*SCALE,SCALE); // top inner line
  ctx.fillRect(19*SCALE,59*SCALE,84*SCALE,SCALE); // bottom inner line
  ctx.globalAlpha=1;


  ptHeavy('BONECRAWLER',GW*SCALE/2,50*SCALE,10,C.SI1,'center',C.DK);

  rMenuBtn(MENU_PLAY,'PLAY');
  rMenuBtn(MENU_SCORE,'SCOREBOARD');
  rMenuBtn(NAME_BTN,'NAME: '+(currentPlayerName||'PLAYER').toUpperCase().slice(0,12));

  // Bottom panel chain decorations (pixel chain links)
  ctx.globalAlpha=0.28;
  for(let cx2=18;cx2<=100;cx2+=6){ fr(cx2,65,1,1,C.BN2); fr(cx2+1,65,1,1,C.SI2); }
  ctx.globalAlpha=1;

  ctx.textAlign='left';
}

function rIntro(){
  drawMenuBg();
  drawPanelFrame(2,10,116,80,{edge:C.BN2,fill:'rgba(5,5,7,0.92)',inner:'rgba(36,52,58,0.14)',glow:C.WH});

  const nm=((currentPlayerName||'PLAYER').toUpperCase().slice(0,14))||'PLAYER';
  let lines = [];
  let size = 6;
  let startY = 24;
  let stepY = 7;

  if(introPage===0){
    lines = [
      'THE KING SOUGHT THE AID',
      'OF THE BONECRAWLERS.',
      'YOU DO NOT LOOK FOR',
      'A WELCOME HERE, '+nm+'.'
    ];
    size = 7;
    startY = 24;
    stepY = 11;
  } else if(introPage===1){
    lines = [
      'SOLIDARITY IS BORN OF',
      'NECESSITY, AND THE HIERARCHY',
      'IS WRITTEN IN THE SPEED',
      'OF A VANISHING BREATH.',
      'IN THIS LAND, PEACE IS',
      'ACHIEVED THROUGH PASSIVE',
      'ACKNOWLEDGEMENT — A SILENCE',
      'THAT MUST NEVER BE BROKEN.'
    ];
    size = 6;
    startY = 16;
    stepY = 9;
  } else {
    lines = [
      'YOU ARE SENT TO EXTINGUISH THE',
      'UNQUIET THAT RATTLES IN THE DARK,',
      'SILENCING THE REVENANT OF AN',
      'ANCIENT EVIL THAT FEEDS ON THE',
      'DISTRESS OF THE KINGDOM.',
      'A GRIM TASK TO JOIN THEIR',
      'SKELETAL RANKS.',
      '"MOVE WITH HASTE; TO BE SEEN',
      'IS TO FAIL THE SILENCE; TO',
      'BE KNOWN IS TO CEASE TO EXIST."'
    ];
    size = 6;
    startY = 14;
    stepY = 7;
  }

  for(let i=0;i<lines.length;i++){
    pt(lines[i],GW*SCALE/2,(startY + i*stepY)*SCALE,size,C.BN1,'center',C.DK);
  }

  pt('ENTER / CLICK',GW*SCALE/2,84*SCALE,5,C.WH,'center',C.DK);
  ctx.textAlign='left';
}

function rScoreboard(){
  drawMenuBg();

  drawPanelFrame(6,22,108,82,{edge:C.BN2,fill:'rgba(4,4,5,0.95)',inner:'rgba(33,45,40,0.12)',glow:C.WH});

  ctx.globalAlpha=0.26;
  ctx.fillStyle=C.BN2;
  ctx.fillRect(12*SCALE,27*SCALE,96*SCALE,11*SCALE);
  ctx.fillRect(12*SCALE,40*SCALE,96*SCALE,8*SCALE);
  ctx.globalAlpha=1;

  // Panel horizontal rules
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.40;
  ctx.fillRect(9*SCALE,25*SCALE,102*SCALE,SCALE);  // below top border
  ctx.fillRect(9*SCALE,39*SCALE,102*SCALE,SCALE);  // between title and player
  ctx.fillRect(9*SCALE,49*SCALE,102*SCALE,SCALE);  // below player / above rows
  ctx.globalAlpha=0.18;
  ctx.fillRect(11*SCALE,26*SCALE,98*SCALE,SCALE);
  ctx.fillRect(11*SCALE,50*SCALE,98*SCALE,SCALE);
  ctx.globalAlpha=1;

  // Skull markers flanking SCOREBOARD title
  ds(S.mskull,8,30);
  ds(S.mskull,108,30);

  // Side tick marks on panel
  for(let ty=32;ty<=96;ty+=8){
    fr(6,ty,2,1,C.BN2); fr(112,ty,2,1,C.BN2);
  }

  ptHeavy('SCOREBOARD',GW*SCALE/2,28*SCALE,9,C.BN1,'center',C.DK);
  ptHeavy('PLAYER: '+(currentPlayerName||'PLAYER').toUpperCase(),GW*SCALE/2,41*SCALE,6,C.SI1,'center',C.DK);

  const rows=scorePageEntries();

  if(!rows.length){
    ptHeavy('NO RUNS SAVED YET',GW*SCALE/2,58*SCALE,7,C.BN1,'center',C.DK);
  } else {
    ctx.textAlign='left';
    for(let i=0;i<rows.length;i++){
      const row=rows[i];
      const y=50+i*9;
      const nm=(row.name||'Player').toUpperCase().slice(0,8);
      const line=nm+' - '+row.kills+' - '+formatTime(row.timeMs)+(row.finished?' *':'');
      ptHeavy(line,11*SCALE,y*SCALE,6,(row.finished?C.FR1:(i===0?C.BN1:C.SI1)),'left',C.DK);
      ctx.fillStyle=C.W2;
      ctx.fillRect(10*SCALE,(y+7)*SCALE,100*SCALE,SCALE);
    }
  }

  const totalPages=totalScorePages();
  ptHeavy('PAGE '+(scoreboardPage+1)+' / '+totalPages,GW*SCALE/2,89*SCALE,6,C.BN1,'center',C.DK);

  ptHeavy('NAME - KILLS - GAMETIME *',GW*SCALE/2,96*SCALE,5,C.BN1,'center',C.DK);

  rMenuBtn({x:8,y:105,w:24,h:9},'BACK');
  rMenuBtn({x:88,y:105,w:11,h:9},'<');
  rMenuBtn({x:102,y:105,w:11,h:9},'>');

  ctx.textAlign='left';
  if(currentZone===ZONE_SECRET2 && canInteractSecret2Npc() && gState==='playing'){
    const pulse=0.55+0.45*Math.sin(frame*0.22);
    ctx.globalAlpha=0.25*pulse;
    fr(SECRET2_NPC_RECT.x-2,SECRET2_NPC_RECT.y-8,SECRET2_NPC_RECT.w+4,5,C.MG);
    ctx.globalAlpha=1;
    pt('ENTER',(SECRET2_NPC_RECT.x+SECRET2_NPC_RECT.w/2)*SCALE,(SECRET2_NPC_RECT.y-9)*SCALE,4,C.BN1,'center',C.DK);
    ctx.textAlign='left';
  }
}

function rZoneTransition(){
  const info=zoneTransitionInfo || buildZoneTransitionInfo(pendingZoneTransition||2);
  const messageLines=info.messageLines||[];
  const hideStats=!!info.hideStats;
  const statText=hideStats ? '????' : null;

  ctx.fillStyle='rgba(6,5,3,0.90)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(13,15,94,96,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:C.FR1});

  ptHeavy(info.title || 'ZONE CLEAR',GW*SCALE/2,18*SCALE,8,C.FR1,'center',C.DK);

  if(messageLines.length===1){
    ptHeavy(messageLines[0],GW*SCALE/2,30*SCALE,7,C.WH,'center',C.DK);
  }else if(messageLines.length>=2){
    ptHeavy(messageLines[0],GW*SCALE/2,29*SCALE,6,C.WH,'center',C.DK);
    ptHeavy(messageLines[1],GW*SCALE/2,37*SCALE,6,C.WH,'center',C.DK);
  }

  ptHeavy('KILLS:',20*SCALE,46*SCALE,7,C.BN1,'left',C.DK);
  ptHeavy('SKELETONS',24*SCALE,56*SCALE,6,C.SI1,'left',C.DK);
  ptHeavy(hideStats ? statText : String(normalKillCount),93*SCALE,56*SCALE,7,C.SI1,'right',C.DK);
  ptHeavy('GIANTS',24*SCALE,66*SCALE,6,C.FR1,'left',C.DK);
  ptHeavy(hideStats ? statText : String(giantKillCount),93*SCALE,66*SCALE,7,C.FR1,'right',C.DK);
  ptHeavy('WIZARDS',24*SCALE,76*SCALE,6,C.MG2,'left',C.DK);
  ptHeavy(hideStats ? statText : String(wizardKillCount),93*SCALE,76*SCALE,7,C.MG2,'right',C.DK);

  ptHeavy('SCORE:',20*SCALE,86*SCALE,7,C.BN1,'left',C.DK);
  ptHeavy(hideStats ? statText : String(score),93*SCALE,86*SCALE,7,C.BN1,'right',C.DK);
  ptHeavy('RANK:',20*SCALE,94*SCALE,7,C.BN1,'left',C.DK);
  ptHeavy(hideStats ? statText : String(info.rank||'?'),93*SCALE,94*SCALE,7,C.BN1,'right',C.DK);

  rMenuBtn(ZONE_TRANSITION_CONTINUE_BTN,'CONTINUE');
  pt('PRESS CONTINUE . . .',GW*SCALE/2,110*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rDialog(){
  const rawPage=dialogPages[dialogPageIndex];
  const isObjectPage=!!rawPage && !Array.isArray(rawPage) && Array.isArray(rawPage.lines);
  const page=isObjectPage ? rawPage.lines : (Array.isArray(rawPage) ? rawPage : ['....']);
  const whisperCol='#5f7f9d';
  const isSwordDialog=dialogMode==='sword';
  const isRewardDialog=dialogMode==='reward';
  const isOpeningDialog=dialogMode==='opening';
  const rawSpeaker=isObjectPage ? String(rawPage.speaker||'NODE').trim() : '';
  const pageSpeaker=rawSpeaker.toUpperCase();
  const openingPlayerSpeaker=((currentPlayerName||'Player').trim()||'Player');
  const resolvedSpeaker=pageSpeaker==='PLAYER' ? openingPlayerSpeaker : (rawSpeaker||pageSpeaker||'NODE');
  const panelTitle=isRewardDialog
    ? (dialogTitle||'REWARD')
    : (isOpeningDialog
      ? resolvedSpeaker
      : (isObjectPage ? resolvedSpeaker : (dialogTitle||(isRewardDialog?'REWARD':'WOUNDED STRANGER'))));

  ctx.fillStyle='rgba(8,6,3,0.72)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  const longestLine=Math.max(panelTitle?panelTitle.length:0, ...page.map(line=>String(line||'').length));
  const lineH=isSwordDialog ? 8 : (isRewardDialog ? 8 : 7);
  const charW=isSwordDialog ? 5.2 : (isRewardDialog ? 5.0 : 4.8);
  const minW=isRewardDialog ? 62 : 58;
  const maxW=isRewardDialog ? 112 : 108;
  const panelW=Math.max(minW, Math.min(maxW, Math.round(longestLine*charW)+24));
  const panelH=Math.max(isRewardDialog ? 44 : 38, 24 + page.length*lineH + 10);
  const panelX=Math.round((GW-panelW)/2);
  const panelY=isRewardDialog ? Math.round((GH-panelH)/2)-4 : Math.max(42, GH-panelH-10);
  const panelGlow=isRewardDialog ? C.SH : C.MG;
  const fill=isRewardDialog ? 'rgba(4,4,5,0.96)' : 'rgba(4,4,5,0.92)';
  const inner=isRewardDialog ? 'rgba(40,52,62,0.14)' : 'rgba(53,39,28,0.10)';

  drawPanelFrame(panelX,panelY,panelW,panelH,{edge:C.BN2,fill,inner,glow:panelGlow});
  ptHeavy(panelTitle,GW*SCALE/2,(panelY+7)*SCALE,7,C.BN1,'center',C.DK);
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.35;
  ctx.fillRect((panelX+4)*SCALE,(panelY+14)*SCALE,(panelW-8)*SCALE,SCALE);
  ctx.globalAlpha=1;

  for(let i=0;i<page.length;i++){
    const line=page[i];
    const y=(panelY+19+i*lineH)*SCALE;

    if(line==='......' || line==='.....' || line==='....'){
      pt(line,GW*SCALE/2,y,6,whisperCol,'center',C.DK);
      continue;
    }

    if(line==="There's a name engraved on his sword"){
      ctx.save();
      ctx.textBaseline='top';
      ctx.textAlign='center';
      ctx.font='italic 5px "Press Start 2P",monospace';
      ctx.fillStyle=C.DK;
      ctx.fillText(line,GW*SCALE/2+1,y);
      ctx.fillText(line,GW*SCALE/2-1,y);
      ctx.fillText(line,GW*SCALE/2,y+1);
      ctx.fillText(line,GW*SCALE/2,y-1);
      ctx.fillStyle=whisperCol;
      ctx.fillText(line,GW*SCALE/2,y);
      ctx.restore();
      continue;
    }

    if(line==='ImmaGundam'){
      const bob=Math.sin(frame*0.10)*1.2;
      const pulse=0.72 + 0.28*Math.sin(frame*0.16);
      const baseX=GW*SCALE/2;
      const baseY=y+bob;
      const r1=Math.round(155 + 100*Math.sin(frame*0.08));
      const g1=Math.round(120 + 110*Math.sin(frame*0.08 + 2.09));
      const b1=Math.round(155 + 100*Math.sin(frame*0.08 + 4.18));
      const r2=Math.round(110 + 80*Math.sin(frame*0.11 + 0.8));
      const g2=Math.round(110 + 80*Math.sin(frame*0.11 + 2.9));
      const b2=Math.round(180 + 70*Math.sin(frame*0.11 + 4.5));
      const rgbA=`rgb(${r1},${g1},${b1})`;
      const rgbB=`rgb(${r2},${g2},${b2})`;
      ctx.save();
      ctx.globalAlpha=0.24 + 0.14*pulse;
      ptHeavy(line,baseX,baseY,6,rgbA,'center',C.DK);
      ctx.globalAlpha=0.16 + 0.10*pulse;
      ptHeavy(line,baseX,baseY,6,rgbB,'center',C.DK);
      ctx.globalAlpha=1;
      ptHeavy(line,baseX,baseY,6,'rgb(235,225,190)','center',rgbA);
      ctx.restore();
      for(let j=0;j<4;j++){
        const ang=frame*0.045 + j*1.57;
        const px=Math.round((GW/2 + Math.cos(ang)*10 + Math.sin(frame*0.03+j)*2)*SCALE);
        const py=Math.round((y/SCALE - 2 + Math.sin(ang*1.25)*3)*SCALE);
        ctx.globalAlpha=0.42 + 0.28*Math.sin(frame*0.14+j);
        ctx.fillStyle='rgb(150,220,255)';
        ctx.fillRect(px,py,2,2);
        ctx.fillStyle='rgb(225,245,255)';
        ctx.fillRect(px+1,py-1,1,1);
      }
      for(let j=0;j<3;j++){
        const ang=frame*0.06 + j*2.2 + 1.1;
        const px=Math.round((GW/2 + Math.cos(ang)*6 - Math.sin(frame*0.025+j)*5)*SCALE);
        const py=Math.round((y/SCALE + 3 + Math.sin(ang*1.8)*4)*SCALE);
        ctx.globalAlpha=0.30 + 0.22*Math.sin(frame*0.18 + j*1.6);
        ctx.fillStyle='rgb(105,185,245)';
        ctx.fillRect(px,py,1,3);
        ctx.fillStyle='rgb(185,235,255)';
        ctx.fillRect(px-1,py+1,3,1);
      }
      ctx.globalAlpha=1;
      continue;
    }

    if(isSwordDialog){
      ctx.save();
      ctx.textBaseline='top';
      ctx.textAlign='center';
      ctx.font='italic 7px "Press Start 2P",monospace';
      ctx.fillStyle=C.DK;
      ctx.fillText(line,GW*SCALE/2+1,y);
      ctx.fillText(line,GW*SCALE/2-1,y);
      ctx.fillText(line,GW*SCALE/2,y+1);
      ctx.fillText(line,GW*SCALE/2,y-1);
      ctx.fillStyle=whisperCol;
      ctx.fillText(line,GW*SCALE/2,y);
      ctx.restore();
      continue;
    }

    if(isRewardDialog){
      const isNameLine=(line==='MASTER SWORD' || line==='WHIRLWIND SLASH' || line==='SHADOW STEP' || line==='HEALTH POTION');
      const fs=isNameLine ? 8 : 6;
      const col=isNameLine ? C.SH : C.BN1;
      ptHeavy(line,GW*SCALE/2,y,fs,col,'center',C.DK);
      continue;
    }

    pt(line,GW*SCALE/2,y,6,C.BN1,'center',C.DK);
  }

  pt('ENTER',GW*SCALE/2,(panelY+panelH-6)*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rPaused(){
  ctx.fillStyle='rgba(8,6,3,0.68)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  const p=player||{};
  const items=[];
  if(masterSwordOwned) items.push({spr:S.upSword,val:'x1',col:C.SH});
  if(potionCount>0) items.push({spr:S.potionIcon,val:'x'+potionCount,col:C.HP1});
  if(playerHasAnyKey(p)) items.push({spr:S.key,val:'x1',col:C.BN1});
  if(p.shield) items.push({spr:S.shieldIcon,val:'x'+Math.max(1,p.shieldLevel||1),col:C.SH});
  if(!items.length) items.push({spr:S.mskull,val:'x0',col:C.BN1});

  const skills=[
    {spr:S.upSword,val:'x'+Math.max(1,(p.swordLevel||0)+1),col:C.BN1},
    {spr:p.shadowStep?S.shadowStepIcon:S.stepIcon,val:'x'+Math.max(1,p.shadowStep?(p.stepLevel||1):1),col:p.shadowStep?C.MG2:C.SI1},
    {spr:S.upSpeed,val:'x'+Math.max(1,(p.speedLevel||0)+1),col:C.FR1},
  ];
  if(whirlwindUnlocked) skills.push({spr:S.whirlwindIcon,val:'x1',col:C.SH});

  const drawInlineStatRow=(entries,startY,textSize)=>{
    const slotW=22;
    const iconOffsetY=1;
    const textOffsetX=10;
    const textOffsetY=2;
    const startX=Math.round((GW - entries.length*slotW)/2);
    entries.forEach((entry,idx)=>{
      const x=startX + idx*slotW;
      ds(entry.spr,x,startY+iconOffsetY);
      ptHeavy(entry.val,(x+textOffsetX)*SCALE,(startY+textOffsetY)*SCALE,textSize,entry.col,'left',C.DK);
    });
  };

  drawPanelFrame(12,12,96,97,{edge:C.BN2,fill:'rgba(4,4,5,0.90)',inner:'rgba(53,39,28,0.10)',glow:C.FR1});
  ctx.globalAlpha=0.18+0.10*Math.sin(frame*0.07);
  ctx.fillStyle=C.FR1;
  ctx.fillRect(55*SCALE,12*SCALE,10*SCALE,6*SCALE);
  ctx.globalAlpha=1;
  ds(S.mskull,57,13);

  ptHeavy('PAUSED',GW*SCALE/2,24*SCALE,12,C.FR1,'center',C.DK);
  if(devGodMode) pt('DEV GOD ON',GW*SCALE/2,35*SCALE,6,C.MG2,'center',C.W3);
  ptHeavy('ENTER / ESC = RESUME',GW*SCALE/2,43*SCALE,6,C.BN1,'center',C.DK);

  ctx.fillStyle=C.BN2; ctx.globalAlpha=0.45;
  ctx.fillRect(18*SCALE,46*SCALE,84*SCALE,SCALE);
  ctx.fillRect(18*SCALE,69*SCALE,84*SCALE,SCALE);
  ctx.globalAlpha=1;
  fr(12,46,3,1,C.BN2); fr(105,46,3,1,C.BN2);
  fr(12,69,3,1,C.BN2); fr(105,69,3,1,C.BN2);

  ptHeavy('ITEMS',GW*SCALE/2,51*SCALE,6,C.BN1,'center',C.DK);
  drawInlineStatRow(items,57,5);

  ptHeavy('SKILLS',GW*SCALE/2,73*SCALE,6,C.BN1,'center',C.DK);
  drawInlineStatRow(skills,79,5);

  rMenuBtn(GAMEOVER_RETRY,'RETRY');
  rMenuBtn(GAMEOVER_MENU,'MENU');
  pt('R = RETRY   M = MENU',GW*SCALE/2,107*SCALE,5,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

// ── Game-over overlay ─────────────────────────────────────────
function rOver(){
  ctx.fillStyle='rgba(8,6,3,0.88)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(21,27,78,75,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:C.FR1});

  const skX=GW/2-6, skY=14;

  // Animated double glow ring around skull
  const t=Date.now();
  const rp=0.38+0.12*Math.sin(t/300);
  const rp2=0.15+0.08*Math.sin(t/220+1);
  ctx.globalAlpha=rp2;
  ctx.fillStyle=C.FR1;
  ctx.fillRect((skX-3)*SCALE,(skY-2)*SCALE,18*SCALE,16*SCALE);
  ctx.globalAlpha=rp;
  fr(skX+3,skY+2,6,3,C.GR);
  ctx.globalAlpha=1;
  ds(S.skull,skX,skY);

  // Horizontal separator below GAME OVER
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.42;
  ctx.fillRect(25*SCALE,52*SCALE,70*SCALE,SCALE);
  ctx.globalAlpha=0.16;
  ctx.fillRect(27*SCALE,53*SCALE,66*SCALE,SCALE);
  ctx.globalAlpha=1;
  // Tick marks on separator
  fr(21,52,3,1,C.BN2); fr(96,52,3,1,C.BN2);

  // Second separator above buttons
  ctx.fillStyle=C.BN2;
  ctx.globalAlpha=0.35;
  ctx.fillRect(25*SCALE,94*SCALE,70*SCALE,SCALE);
  ctx.globalAlpha=1;
  fr(21,94,3,1,C.BN2); fr(96,94,3,1,C.BN2);

  // Side tick marks on panel
  for(let ty=36;ty<=90;ty+=9){
    fr(21,ty,2,1,C.BN2); fr(98,ty,2,1,C.BN2);
  }

  pt('GAME OVER',GW*SCALE/2,40*SCALE,10,C.BN1,'center',C.DK);

  pt('SCORE: '+score,GW*SCALE/2,63*SCALE,7,C.BN1,'center',C.DK);
  pt('KILLS: '+killCount,GW*SCALE/2,74*SCALE,7,C.SI1,'center',C.DK);
  pt('TIME: '+formatTime(runTimeMs),GW*SCALE/2,85*SCALE,7,C.SI1,'center',C.DK);

  rMenuBtn(GAMEOVER_RETRY,'RETRY');
  rMenuBtn(GAMEOVER_MENU,'MENU');

  const retryHint=(retryCheckpoint && retryCheckpoint.zone>=2)
    ? 'ZONE RETRY / MENU'
    : 'RESTART / MENU';
  pt(retryHint,GW*SCALE/2,103*SCALE,5,C.BN1,'center',C.DK);
  pt('ENTER/R = RETRY   ESC/M = MENU',GW*SCALE/2,109*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rSecret2SwordConfirm(){
  ctx.fillStyle='rgba(8,6,3,0.78)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(16,26,88,74,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:C.SH});
  ptHeavy('MASTER SWORD',GW*SCALE/2,34*SCALE,8,C.SH,'center',C.DK);
  ptHeavy('THE BLADE HUMS WITH',GW*SCALE/2,52*SCALE,5,C.BN1,'center',C.DK);
  ptHeavy('ANCIENT POWER . . .',GW*SCALE/2,62*SCALE,5,C.BN1,'center',C.DK);
  ptHeavy('PULL THE SWORD?',GW*SCALE/2,74*SCALE,6,C.WH,'center',C.DK);

  rMenuBtn(SECRET2_SWORD_CONFIRM_YES_BTN,'YES');
  rMenuBtn(SECRET2_SWORD_CONFIRM_NO_BTN,'NO');
  pt('ENTER / Y = YES',GW*SCALE/2,108*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rLeaveZoneConfirm(){
  const target=leaveZonePromptData||{};
  const goingSecret=target.nextZone===ZONE_SECRET1 || target.nextZone===ZONE_SECRET2;
  const heading=target.nextZone===-1 ? 'LEAVE ZONE?' : (goingSecret ? 'ENTER SECRET ZONE?' : 'LEAVE ZONE?');
  ctx.fillStyle='rgba(8,6,3,0.82)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(18,28,84,70,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:goingSecret?C.MG2:C.SH});
  ptHeavy(heading,GW*SCALE/2,38*SCALE,8,goingSecret?C.MG2:C.SH,'center',C.DK);
  ptHeavy('YES / NO',GW*SCALE/2,66*SCALE,6,C.WH,'center',C.DK);

  rMenuBtn(LEAVE_ZONE_CONFIRM_YES_BTN,'YES');
  rMenuBtn(LEAVE_ZONE_CONFIRM_NO_BTN,'NO');
  pt('ENTER / Y = YES',GW*SCALE/2,108*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

function rRetryConfirm(){
  ctx.fillStyle='rgba(8,6,3,0.90)';
  ctx.fillRect(0,0,GW*SCALE,GH*SCALE);

  drawPanelFrame(18,28,84,70,{edge:C.BN2,fill:'rgba(3,3,4,0.96)',inner:'rgba(56,39,25,0.12)',glow:C.SH});
  ptHeavy('RETRY',GW*SCALE/2,36*SCALE,10,C.SH,'center',C.DK);

  const zoneName=getRetryZoneLabel(retryCheckpoint ? retryCheckpoint.zone : currentZone);
  if(retryPromptMode==='cost'){
    ptHeavy('SACRIFICE 30% POINTS',GW*SCALE/2,56*SCALE,5,C.BN1,'center',C.DK);
    ptHeavy('TO RESTART '+zoneName.toUpperCase()+'?',GW*SCALE/2,66*SCALE,5,C.BN1,'center',C.DK);
  } else {
    ptHeavy("EHH.. DON'T WORRY",GW*SCALE/2,56*SCALE,5,C.BN1,'center',C.DK);
    ptHeavy('ABOUT IT.',GW*SCALE/2,66*SCALE,5,C.BN1,'center',C.DK);
  }

  rMenuBtn(RETRY_CONFIRM_YES_BTN,'YES');
  rMenuBtn(RETRY_CONFIRM_NO_BTN,'NO');
  pt('ENTER / Y = YES',GW*SCALE/2,108*SCALE,4,C.BN1,'center',C.DK);
  ctx.textAlign='left';
}

