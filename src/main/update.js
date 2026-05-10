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

  const p=player;
  if(p.dead) return;
  if(currentZone===2 && bossDefeated && !dragonBoss && bossClearTimer>0){
    bossClearTimer--;
    if(bossClearTimer<=0){
      openZoneTransition(3);
      return;
    }
  }


  if(devGodMode){
    p.hp=p.maxHp;
    p.hurtT=0;
    p.shield=true;
    p.shieldBreakT=0;
    p.visibleHearts=Math.max(p.visibleHearts||3, Math.min(5, Math.ceil(p.hp/2)));
  }

  if(p.shieldBreakT>0) p.shieldBreakT--;

  for(let i=heartDrops.length-1;i>=0;i--){
    const h=heartDrops[i];
    if(typeof h.ttl==='number'){
      h.ttl--;
      if(h.ttl<=0) heartDrops.splice(i,1);
    }
  }
  for(let i=potionDrops.length-1;i>=0;i--){
    const d=potionDrops[i];
    if(typeof d.ttl==='number'){
      d.ttl--;
      if(d.ttl<=0) potionDrops.splice(i,1);
    }
  }
  if(zone3TreeShakeT>0) zone3TreeShakeT--;

  // Movement
  let dx=0,dy=0;
  const waterBox={x:p.x,y:p.y,w:p.w,h:p.h};
  const inSecret1Water=currentZone===ZONE_SECRET1 && isSecret1WaterZone(waterBox);
  const terrainSpeedMult=inSecret1Water ? 0.58 : 1;
  const moveSpeed=(devGodMode ? p.speed*DEV_GOD_SPEED_MULT : p.speed)*terrainSpeedMult;
  if(isKeyDown('ArrowLeft','KeyA')){dx-=moveSpeed;p.dir='left';}
  if(isKeyDown('ArrowRight','KeyD')){dx+=moveSpeed;p.dir='right';}
  if(isKeyDown('ArrowUp','KeyW')){dy-=moveSpeed;p.dir='up';}
  if(isKeyDown('ArrowDown','KeyS')){dy+=moveSpeed;p.dir='down';}

  if(touchMoveActive){
    const tdx=touchX-touchStartX;
    const tdy=touchY-touchStartY;
    const dist=Math.hypot(tdx,tdy);
    if(dist>10){
      const nx=tdx/dist, ny=tdy/dist;
      dx += nx*moveSpeed;
      dy += ny*moveSpeed;
      if(Math.abs(tdx)>Math.abs(tdy)) p.dir = tdx<0 ? 'left' : 'right';
      else p.dir = tdy<0 ? 'up' : 'down';
    }
  }

  if(dx&&dy){dx*=0.707;dy*=0.707;}
  let nx=Math.max(PX,Math.min(PX+PW-p.w,p.x+dx));
  if(collidesZoneObstacles(nx,p.y,p.w,p.h)) nx=p.x;
  p.x=nx;
  let ny=Math.max(PY,Math.min(PY+PH-p.h,p.y+dy));
  if(collidesZoneObstacles(p.x,ny,p.w,p.h)) ny=p.y;
  p.y=ny;
  if(dx||dy) p.walkF += inSecret1Water ? 0.45 : 1;

  if(inSecret1Water && (dx||dy) && frame%6===0){
    const px=p.x+p.w/2;
    const py=p.y+p.h-1;
    parts.push({x:px-2+Math.random()*4,y:py,vx:(Math.random()*0.5-0.25),vy:-0.10-Math.random()*0.18,
      life:10+(Math.random()*5|0),max:16,col:Math.random()<0.5?'#d8f6ff':'#8fd8ff'});
    parts.push({x:px-2+Math.random()*4,y:py+1,vx:(Math.random()*0.4-0.2),vy:-0.04-Math.random()*0.10,
      life:8+(Math.random()*4|0),max:14,col:'#6ec3e7'});
  }

  if(secret1UnlockAlertT>0) secret1UnlockAlertT--;
  if(currentZone===1 && zone1SecretEntranceReady()){
    if(!secret1UnlockAlertShown){
      secret1UnlockAlertShown=true;
      secret1UnlockAlertT=135;
      floatTexts.push({x:GW/2,y:PY+60,text:'SECRET ZONE 1',life:72,max:72,col:C.MG2});
      floatTexts.push({x:GW/2,y:PY+68,text:'UNLOCKED! (INTERACT)',life:72,max:72,col:C.BN1});
    }
  }


  // Key pickup + door unlock to zone 2
  if(hasAnyKeyDrop()){
    const drops=getKeyDropList();
    for(let i=drops.length-1;i>=0;i--){
      const drop=drops[i];
      if(!ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:drop.x,y:drop.y,w:drop.w,h:drop.h})) continue;
      try{ if(window.AudioEvents) AudioEvents.keyPickup(); }catch(err){}
      if(drop.kind==='zone1Door') p.zone1DoorKey=true;
      else if(drop.kind==='secret1'){ p.secret1Key=true; breakZone1Decor(0); }
      else if(drop.kind==='zone2') p.zone2Key=true;
      else p.hasKey=true;
      drops.splice(i,1);
      floatTexts.push({x:p.x+4,y:p.y-6,text:drop.kind==='secret1'?'SECRET KEY':(drop.kind==='zone1Door'?'ZONE 2 KEY':'KEY'),life:40,max:40,col:drop.kind==='secret1'?C.MG2:C.BN1});
    }
    keyDrop=drops;
  }
  if(currentZone===ZONE_SECRET1){
    if(secret1BlessingT>0) secret1BlessingT--;
    if(secret1BlessingT===80){
      floatTexts.push({x:GW/2,y:PY+72,text:'THE FAIRIES SEND YOU ONWARD',life:70,max:70,col:C.MG2});
    }
  }

  // Chest collision → pause for upgrade
  const activeChests = typeof getChestList === 'function' ? getChestList() : (chest ? [chest] : []);
  for(let i=activeChests.length-1;i>=0;i--){
    const c=activeChests[i];
    if(!c || !ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:c.x,y:c.y,w:c.w,h:c.h})) continue;
    if(typeof removeChestAt === 'function') removeChestAt(i);
    else chest=null;
    try{ if(window.AudioEvents) AudioEvents.chestOpen(); }catch(err){}
    rollUpgradeChoices();
    gState='upgrade';
    return;
  }

  // Heart pickups
  for(let i=heartDrops.length-1;i>=0;i--){
    const h=heartDrops[i];
    if(ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:h.x,y:h.y,w:h.w,h:h.h})){
      if(h.kind==='half') grantHalfHeartReward(h.x+4,h.y);
      else grantHeartReward(h.x+4,h.y);
      for(let j=0;j<6;j++){
        const a=Math.random()*Math.PI*2, s=0.4+Math.random()*1.3;
        parts.push({x:h.x+3.5,y:h.y+3.5,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
          life:18+(Math.random()*10|0),max:28,col:Math.random()<0.5?C.HP1:C.HP2});
      }
      heartDrops.splice(i,1);
    }
  }

  // Potion pickups stay on the field until the player can carry one again
  if(potionCount < POTION_MAX_COUNT){
    for(let i=potionDrops.length-1;i>=0;i--){
      const d=potionDrops[i];
      if(ov({x:p.x,y:p.y,w:p.w,h:p.h},{x:d.x,y:d.y,w:d.w,h:d.h})){
        potionCount=Math.min(POTION_MAX_COUNT, potionCount+1);
        burst(d.x+3.5, d.y+3.5);
        floatTexts.push({x:d.x+3,y:d.y-5,text:'POTION',life:34,max:34,col:C.HP1});
        if(!potionDialogSeenThisRun){
          potionDialogSeenThisRun=true;
          queuePotionAcquireDialog();
        }
        potionDrops.splice(i,1);
      }
    }
  }

  // Attack
  const keyboardSpcNow=isKeyDown('Space');
  const touchSpcNow=touchAttackChargeActive && !touchAttackMoved;
  const mouseSpcNow=mouseAttackHeld && whirlwindUnlocked;
  const spcNow=keyboardSpcNow || touchSpcNow || mouseSpcNow;
  const touchChargeCanceled=touchAttackCancelQueued && !spcNow && prevSpc;
  const spcJust=spcNow&&!prevSpc;
  const spcRelease=((!spcNow&&prevSpc&&!touchChargeCanceled) || touchAttackReleaseQueued || mouseAttackReleaseQueued);
  const clickJust=mouseAttackQueued;
  prevSpc=spcNow;
  mouseAttackQueued=false;
  mouseAttackReleaseQueued=false;
  touchAttackReleaseQueued=false;
  touchAttackCancelQueued=false;

  if(whirlwindCooldownT>0) whirlwindCooldownT--;
  if(whirlwindSlashT>0) whirlwindSlashT--;
  if(dodgeCooldownT>0) dodgeCooldownT--;
  if(p.dodgeInvulnT>0) p.dodgeInvulnT--;

  if(whirlwindUnlocked){
    if(spcJust && p.atkCD<=0 && p.atkT<=0){
      whirlwindChargeT=1;
    } else if(spcNow && whirlwindChargeT>0){
      whirlwindChargeT++;
      if(whirlwindChargeT>=WHIRLWIND_HOLD_FRAMES){
        p.atkT=Math.max(p.atkT,2);
      }
    } else if(spcRelease && whirlwindChargeT>0){
      if(whirlwindChargeT>=WHIRLWIND_HOLD_FRAMES && whirlwindCooldownT<=0){
        performWhirlwindSlash();
      } else if(p.atkCD<=0 && p.atkT<=0){
        performPlayerAttack(1);
      }
      whirlwindChargeT=0;
    } else if((!spcNow && whirlwindChargeT>0 && !spcRelease) || touchChargeCanceled){
      whirlwindChargeT=0;
    }
  } else if(spcJust && p.atkCD<=0 && p.atkT<=0){
    performPlayerAttack(1);
  }

  if(clickJust && p.atkCD<=0 && p.atkT<=0){
    performPlayerAttack(1);
  }

  if(p.atkT>0) p.atkT--;
  if(p.atkCD>0) p.atkCD--;
  if(p.hurtT>0) p.hurtT--;

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
        fireballs.push({x:e.x+e.w/2-1,y:e.y+e.h/2-1,vx:fbDx,vy:fbDy,life:160});
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
      fireballs.splice(i,1); continue;
    }
    // Hit player
    if(p.hurtT<=0 && ov({x:fb.x,y:fb.y,w:3,h:3},{x:p.x,y:p.y,w:p.w,h:p.h})){
      fireballs.splice(i,1);
      hurtPlayer(1);
      continue;
    }
  }

  // Particles
  for(let i=parts.length-1;i>=0;i--){
    const pt=parts[i];
    pt.x+=pt.vx; pt.y+=pt.vy; pt.vx*=0.82; pt.vy*=0.82;
    if(--pt.life<=0) parts.splice(i,1);
  }

  // Floating score texts
  for(let i=floatTexts.length-1;i>=0;i--){
    floatTexts[i].y-=0.25;
    if(--floatTexts[i].life<=0) floatTexts.splice(i,1);
  }

  for(let i=shockwaves.length-1;i>=0;i--){
    const sw=shockwaves[i];
    sw.r += (sw.maxR - sw.r) * 0.35;
    if(--sw.life<=0) shockwaves.splice(i,1);
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


