// game state update
// Purpose: Main update tick: game-state progression, movement, collisions, items, enemy updates, and menu transitions.
// ── Update ────────────────────────────────────────────────────
function update(){
  frame++; // always tick so animations run on all screens
  syncVisibleHearts();
  if(gState==='intro_fade'){
    introFadeT=Math.max(0,introFadeT-1);
    if(introFadeT<=0){
      introSeenThisPage=true;
      introStartMs=0;
      introPage=0;
      beginStartupSceneTransition();
    }
    return;
  }
  if(gState==='startup_scene'){
    if(startupSceneFadeT>0){
      startupSceneFadeT=Math.max(0,startupSceneFadeT-1);
      if(startupSceneFadeT<=0) startupScenePauseStartMs=performance.now();
    } else if(startupDialogPending){
      if(!startupScenePauseStartMs) startupScenePauseStartMs=performance.now();
      if(performance.now()-startupScenePauseStartMs>=STARTUP_SCENE_DIALOG_DELAY_MS){
        openStartupGameDialog();
      }
    } else {
      beginPlayableRun();
    }
    return;
  }
  if(gState!=='playing') return;
  if(pendingRewardDialogs.length && openQueuedRewardDialog()) return;
  if(maybeTriggerScriptedZoneDialog()) return;

  if(!dragonBoss && !whyDragonsBoss && !shadowBoss && !isSecretZone(currentZone)){
    try{ if(window.AudioEvents && typeof AudioEvents.ensureZoneAmbience === 'function') AudioEvents.ensureZoneAmbience(currentZone); }catch(err){}
  }

  const zoneSpawnIntroBlocked = (() => {
    if(!window.BoneCrawlerZoneSpawn) return false;
    if(typeof BoneCrawlerZoneSpawn.updateZoneIntro === 'function') BoneCrawlerZoneSpawn.updateZoneIntro();
    return typeof BoneCrawlerZoneSpawn.isZoneStartBlocked === 'function' && BoneCrawlerZoneSpawn.isZoneStartBlocked(currentZone);
  })();

  // Spawn timers
  if(!zoneSpawnIntroBlocked && window.BoneCrawlerZoneSpawn && BoneCrawlerZoneSpawn.shouldOwnUpdate(currentZone)){
    BoneCrawlerZoneSpawn.update();
  } else if(!zoneSpawnIntroBlocked && !isSecretZone(currentZone)){
    for(let i=pSpawns.length-1;i>=0;i--){
      pSpawns[i].t--;
      if(pSpawns[i].t<=0){
        const g=pSpawns[i].giant; const wiz=pSpawns[i].wizard; const type=pSpawns[i].type;
        pSpawns.splice(i,1);
        doSpawn(g, wiz, type);
      }
    }
    if(currentZone===1 && pendingZone1DragonSpawn && !dragonBoss && !bossDefeated && !zone1MiniBossDefeated){
      pendingZone1DragonSpawn=false;
      spawnDragonBoss();
    }
    if(currentZone===2 && getZoneProgressKills(2)>=DRAGON_BOSS_TRIGGER_KILLS && !dragonBoss && !bossDefeated){
      spawnDragonBoss();
    }
    if(currentZone===1 && killCount>=ZONE1_DRAGON_MINIBOSS_KILLS && !dragonBoss && !bossDefeated && !zone1MiniBossDefeated){
      spawnDragonBoss();
    }
    if(currentZone===3 && getZoneProgressKills(3)>=ZONE3_BOSS_TRIGGER_KILLS && enemies.length===0 && pSpawns.length===0 && !shadowBoss && !shadowBossDefeated){
      spawnShadowBoss();
    }
    if(!dragonBoss && !shadowBoss && getZoneProgressKills(currentZone)<getZoneKillTarget(currentZone) && enemies.length<maxEnemies()&&pSpawns.length===0){
      qSpawn(regularSpawnDelay(), false, false, pickRegularEnemyType());
    }
  }

  if(updatePlayerRuntimeFrame()) return;

  const p=player;

  updateDragonBoss();
  updateWhyDragonsBoss();
  updateShadowBoss();

  // Enemy AI
  for(const e of enemies){
    if(e.spawnT>0){
      e.spawnT--;
      e.walkF++;
      if(e.spawnT<=0) e.spawnInvulnerable=false;
      if(e.spawnFreeze !== false) continue;
    }
    if(e.atkT>0) e.atkT--;
    if(e.atkCD>0) e.atkCD--;
    if(e.hurtT>0) e.hurtT--;
    e.walkF++;
    const cx=e.x+e.w/2, cy=e.y+e.h/2, pcx=p.x+4, pcy=p.y+4;
    const ddx=pcx-cx, ddy=pcy-cy;
    const dist=Math.hypot(ddx,ddy);
    if(dist>0) e.dir=Math.abs(ddx)>Math.abs(ddy)?(ddx>0?'right':'left'):(ddy>0?'down':'up');
    // ← reduced attack trigger box (was +2 each side, now +1)
    // Wizard Skeleton: shoot fireballs at player, try to keep distance
    if(e.wizard){
      if(e.shootCD>0) e.shootCD--;
      // Keep distance - move away if too close, drift sideways otherwise
      const preferDist=32;
      if(dist<preferDist){
        // Back away from player
        if(dist>0){e.x-=ddx/dist*e.speed*0.7;e.y-=ddy/dist*e.speed*0.7;}
      } else if(dist>preferDist+20){
        // Drift slowly closer
        if(dist>0){e.x+=ddx/dist*e.speed*0.4;e.y+=ddy/dist*e.speed*0.4;}
      }
      // Clamp to arena
      e.x=Math.max(PX,Math.min(PX+PW-e.w,e.x));
      e.y=Math.max(PY,Math.min(PY+PH-e.h,e.y));
      // Shoot fireball at player
      if(e.shootCD<=0 && dist<90){
        e.shootCD=150+(Math.random()*60|0);
        e.atkT=20;
        try{ if(window.AudioEvents) AudioEvents.wizardAttack(); }catch(err){}
        const spd=rollFireballSpeed(0.9);
        const fbDx=ddx/dist*spd, fbDy=ddy/dist*spd;
        spawnFireball({x:e.x+e.w/2-1,y:e.y+e.h/2-1,vx:fbDx,vy:fbDy,life:160});
      }
    } else {
    const near=ov({x:e.x,y:e.y,w:e.w,h:e.h},{x:p.x,y:p.y,w:p.w,h:p.h});
    if(near){
      if(e.atkCD<=0){
        e.atkT=20; e.atkCD=(e.giant?100:116)+(Math.random()*(e.giant?60:65)|0);
        try{ if(window.AudioEvents) AudioEvents.skeletonAttack(); }catch(err){}
        if(p.hurtT<=0){
          hurtPlayer(1);
        }
      }
    } else {
      if(dist>0){e.x+=ddx/dist*e.speed;e.y+=ddy/dist*e.speed;}
    }
    } // end non-wizard
  }

  // Fireballs
  for(let i=fireballs.length-1;i>=0;i--){
    const fb=fireballs[i];
    fb.x+=fb.vx; fb.y+=fb.vy;
    fb.life--;
    // Out of arena bounds - disappear
    if(fb.x<PX||fb.x>PX+PW||fb.y<PY||fb.y>PY+PH||fb.life<=0){
      releaseFireballAt(fireballs,i); continue;
    }
    // Hit player
    if(p.hurtT<=0 && ov({x:fb.x,y:fb.y,w:3,h:3},{x:p.x,y:p.y,w:p.w,h:p.h})){
      releaseFireballAt(fireballs,i);
      hurtPlayer(1);
      continue;
    }
  }

  // Particles
  for(let i=parts.length-1;i>=0;i--){
    const pt=parts[i];
    pt.x+=pt.vx; pt.y+=pt.vy; pt.vx*=0.82; pt.vy*=0.82;
    if(--pt.life<=0) releasePartAt(parts,i);
  }

  // Floating score texts
  for(let i=floatTexts.length-1;i>=0;i--){
    floatTexts[i].y-=0.25;
    if(--floatTexts[i].life<=0) releaseFloatTextAt(floatTexts,i);
  }

  for(let i=shockwaves.length-1;i>=0;i--){
    const sw=shockwaves[i];
    sw.r += (sw.maxR - sw.r) * 0.35;
    if(--sw.life<=0) releaseShockwaveAt(shockwaves,i);
  }
}


function drawDragonBoss(b){
  if(!b) return;
  const x=Math.round(b.x), y=Math.round(b.y);
  const flip=b.dir!=='right';
  const bob=(Math.floor(b.walkF/10)%2);
  const zone1Mini=!!b.zone1Mini;
  const boneDark=zone1Mini ? '#6f675d' : C.BN1;
  const boneMid=zone1Mini ? '#948876' : C.BN2;
  const boneLite=zone1Mini ? '#b4a48c' : C.BN3;
  const bonePale=zone1Mini ? '#d3c6ae' : C.W3;
  const boneBright=zone1Mini ? '#e5dcc6' : C.WH;
  const wingShade=zone1Mini ? '#5b5b5b' : C.SI3;
  function px(dx,dy,w,h,col,alpha=1){
    const rx=flip ? x+b.w-dx-w : x+dx;
    const ry=y+dy+bob;
    const old=ctx.globalAlpha;
    if(alpha!==1) ctx.globalAlpha=old*alpha;
    fr(rx,ry,w,h,col);
    if(alpha!==1) ctx.globalAlpha=old;
  }

  ctx.globalAlpha=0.20;
  fr(x+4,y+b.h-1,b.w-8,3,C.DK);
  ctx.globalAlpha=1;

  if(b.hurtT>0){
    ctx.globalAlpha=0.28;
    fr(x+3,y+2,b.w-6,b.h-5,C.RD);
    ctx.globalAlpha=1;
  }

  // ragged skeletal wings behind the body, using the same dark-bone palette as the other skeletons
  px(2,5,1,11,boneDark); px(3,5,4,1,boneLite); px(3,8,5,1,bonePale); px(2,12,6,1,boneLite); px(3,15,5,1,bonePale);
  px(4,6,1,10,boneMid); px(6,7,1,8,boneMid); px(7,9,3,1,wingShade,0.75); px(7,13,2,1,wingShade,0.65);
  px(28,5,1,11,boneDark); px(24,5,4,1,boneLite); px(23,8,5,1,bonePale); px(22,12,6,1,boneLite); px(23,15,5,1,bonePale);
  px(26,6,1,10,boneMid); px(24,7,1,8,boneMid); px(20,9,3,1,wingShade,0.75); px(21,13,2,1,wingShade,0.65);

  // tail vertebrae
  const tailSegs=flip
    ? [[31,14,4,2],[28,15,3,2],[25,16,3,2],[22,17,3,1],[19,18,2,1]]
    : [[1,14,4,2],[5,15,3,2],[8,16,3,2],[11,17,3,1],[14,18,2,1]];
  for(let i=0;i<tailSegs.length;i++){
    const [dx,dy,w,h]=tailSegs[i];
    px(dx,dy,w,h,i%2===0?bonePale:boneMid);
    if(w>2) px(dx+1,dy,1,h,boneDark,0.9);
  }
  if(flip) px(33,15,2,1,boneDark); else px(0,15,2,1,boneDark);

  // hind / fore legs
  px(9,18,2,6,bonePale);  px(10,23,1,2,boneDark);
  px(15,19,2,5,bonePale); px(16,23,1,2,boneDark);
  px(21,18,2,6,bonePale); px(22,23,1,2,boneDark);
  px(25,17,2,6,bonePale); px(26,22,1,2,boneDark);
  px(8,20,4,1,boneLite); px(20,20,5,1,boneLite);

  // body / rib cage - closer to the existing skeleton silhouettes and colors
  px(9,9,18,8,bonePale);
  px(10,10,16,6,boneBright);
  px(11,11,14,4,bonePale);
  px(12,8,10,1,boneDark);
  px(12,16,13,1,boneLite);
  for(let i=0;i<6;i++){
    px(12+i*2,9,1,8,boneDark);
    if(i<5) px(13+i*2,11,1,3,boneMid,0.8);
  }
  px(14,12,8,1,boneLite);
  px(15,13,6,1,boneLite);

  // neck vertebrae
  px(24,7,2,2,bonePale); px(25,6,2,2,boneBright); px(26,5,2,2,bonePale); px(27,4,2,2,boneBright);

  // skull head / jaw
  px(27,4,6,5,bonePale);
  px(28,5,4,3,boneBright);
  px(31,6,3,2,bonePale);
  px(32,7,2,1,boneDark);
  px(29,9,4,1,boneDark);
  px(28,3,1,2,boneDark);
  px(30,2,2,1,boneDark);
  px(29,10,3,1,boneLite);
  px(31,10,2,1,boneLite);
  if(b.atkName==='tail'){
    px(28,10,4,1,boneDark);
    px(31,9,2,1,boneDark);
  }

  // eye socket glow
  const eyeCol=C.RD;
  px(30,6,1,1,eyeCol,1);
  px(31,6,1,1,eyeCol,(b.atkName==='fireball' || b.atkName==='fireblast') ? 1 : 0.82);

  // fire charge near the mouth
  if(b.atkName==='fireball' || b.atkName==='fireblast'){
    const pulse=0.24+0.22*Math.sin(frame*0.25);
    const hx=flip ? x+5 : x+b.w-10;
    ctx.globalAlpha=pulse;
    fr(hx,y+5,6,6,C.FR2);
    ctx.globalAlpha=pulse*0.95;
    fr(hx+1,y+6,4,4,C.FR1);
    ctx.globalAlpha=pulse*0.8;
    fr(hx+2,y+7,2,2,C.FB2);
    ctx.globalAlpha=1;
  }

  // howl aura stays simple and skeletal
  if(b.howlT>0){
    const pulse=0.16+0.14*Math.sin(frame*0.22);
    ctx.globalAlpha=pulse;
    fr(x+6,y+3,b.w-12,b.h-11,C.MG3);
    ctx.globalAlpha=pulse*0.65;
    fr(x+9,y+5,b.w-18,b.h-15,C.MG2);
    ctx.globalAlpha=1;
  }
}

function drawShadowBoss(b){
  if(!b) return;
  const x=Math.round(b.x), y=Math.round(b.y);
  const flip=b.dir==='left';
  const bob=Math.floor(b.walkF/8)%2;
  const aura1=b.phase===1 ? C.MG : C.MG;
  const aura2=b.phase===1 ? C.MG3 : C.FR1;

  ctx.globalAlpha=0.18 + 0.08*Math.sin(frame*0.16);
  fr(x-2,y-2,b.w+4,b.h+4,aura1);
  ctx.globalAlpha=0.10 + 0.05*Math.sin(frame*0.11+1.1);
  fr(x-3,y-3,b.w+6,b.h+6,aura2);
  ctx.globalAlpha=1;

  if(b.hurtT>0){
    ctx.globalAlpha=0.35;
    fr(x-1,y-1,b.w+2,b.h+2,C.FR1);
    ctx.globalAlpha=1;
  }

  const spr=b.dir==='up'?S.plrU:b.dir==='down'?S.plrD:S.plrR;
  const map={
    4: b.phase===1 ? C.MG3 : '#5a2742',
    5: b.phase===1 ? C.MG2 : '#a0567d',
    6: C.SI3,
    7: C.FR1,
    8: b.phase===1 ? '#6a4a9a' : '#7a2538',
    9: b.phase===1 ? '#3e255f' : '#4b1522'
  };
  dsMap(spr,x,y+bob,map,flip);

  if(flip){ fr(x+1,y+2+bob,1,1,C.FR1); fr(x+3,y+2+bob,1,1,C.MG2); }
  else { fr(x+4,y+2+bob,1,1,C.FR1); fr(x+6,y+2+bob,1,1,C.MG2); }

  if(b.atkT>0 && (b.atkName==='lunge' || b.atkName==='slash')){
    const sb=getShadowSlashBox(b);
    const alpha=(b.atkT/(b.atkName==='lunge'?16:14));
    ctx.globalAlpha=Math.max(0.12,alpha*0.6);
    fr(sb.x,sb.y,sb.w,sb.h,b.phase===1?C.MG2:C.FR1);
    ctx.globalAlpha=Math.max(0.08,alpha*0.35);
    fr(sb.x+1,sb.y+1,Math.max(1,sb.w-2),Math.max(1,sb.h-2),C.WH);
    ctx.globalAlpha=1;
  }

  if(b.screechStartupT>0 || b.screechT>0){
    const pulse=0.22 + 0.10*Math.sin(frame*0.42);
    ctx.globalAlpha=pulse;
    fr(x-6,y-6,b.w+12,b.h+12,C.FR1);
    ctx.globalAlpha=Math.max(0.10,pulse*0.65);
    fr(x-8,y-8,b.w+16,b.h+16,C.MG2);
    ctx.globalAlpha=1;
  }

  if(b.howlT>0){
    ctx.globalAlpha=0.18 + 0.08*Math.sin(frame*0.45);
    fr(x-5,y-5,b.w+10,b.h+10,C.FR1);
    ctx.globalAlpha=0.12 + 0.06*Math.sin(frame*0.36);
    fr(x-6,y-6,b.w+12,b.h+12,C.MG2);
    ctx.globalAlpha=1;
  }
}


