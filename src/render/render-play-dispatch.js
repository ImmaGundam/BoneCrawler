// render-play-dispatch
// Purpose: Main render dispatch and active play-state renderer/HUD drawing.
// ── Main render dispatch ──────────────────────────────────────
function render(){
  syncMenuCredit();
  syncTouchPauseBtn();
  syncTouchActionBtns();
  if(gState==='title'){rTitle();return;}
  if(gState==='intro'){rIntro();return;}
  if(gState==='intro_fade'){rIntro();
    ctx.globalAlpha=1-(introFadeT/Math.max(1,introFadeMax));
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,GW*SCALE,GH*SCALE);
    ctx.globalAlpha=1;
    return;}
  if(gState==='startup_scene'){
    drawDungeon();
    rPlay();
    const fadeAlpha=Math.max(0, Math.min(1, startupSceneFadeT/Math.max(1,startupSceneFadeMax)));
    if(fadeAlpha>0){
      ctx.globalAlpha=fadeAlpha;
      ctx.fillStyle='#000';
      ctx.fillRect(0,0,GW*SCALE,GH*SCALE);
      ctx.globalAlpha=1;
    }
    return;
  }
  if(gState==='scoreboard'){rScoreboard();return;}
  if(gState==='retry_confirm'){rRetryConfirm();return;}
  if(gState==='leave_zone_confirm'){drawDungeon(); rPlay(); rLeaveZoneConfirm(); return;}
  if(gState==='secret2_sword_confirm'){drawDungeon(); rPlay(); rSecret2SwordConfirm(); return;}
  drawDungeon();
  rPlay();
  if(gState==='gameover') rOver();
  else if(gState==='upgrade') rUpgrade();
  else if(gState==='paused') rPaused();
  else if(gState==='dialog') rDialog();
  else if(gState==='zone_transition') rZoneTransition();
}

// ── Play render ───────────────────────────────────────────────
function rPlay(){
  const p=player;

  // HUD bar
  fr(0,0,GW,PY-2,C.W3);
  fr(0,PY-3,GW,1,C.WH);
  fr(0,PY-2,GW,1,C.W2);
  drawTorch(PX+6,PY-8);
  drawTorch(PX+PW-9,PY-8);

  // Zone doors / room markers on the HUD bar
  if(currentZone===1 || currentZone===3){
    dsScale(S.hudDoor, GW/2-6, 2, 1.3);

    const eyePulse=0.22+0.14*Math.sin(frame*0.16);
    const eyeCol=currentZone===3 ? C.MG2 : C.RD;
    ctx.globalAlpha=eyePulse;
    fr(GW/2-2,0,1,1,eyeCol);
    fr(GW/2+1,0,1,1,eyeCol);
    fr(GW/2-3,1,2,1,eyeCol);
    fr(GW/2+1,1,2,1,eyeCol);
    ctx.globalAlpha=1;

    dsScale(S.hangSkull, GW/2-4, -1, 0.75);
    if(currentZone===1) drawZone1DoorDecor();
    else {
      drawChainColumn(GW/2-18,2,5);
      drawChainColumn(GW/2+18,2,5);
      drawSpiderWeb(PX+14,PY+10);
      drawSpiderWeb(PX+PW-15,PY+10);
    }
  }

  // HP hearts (reveals 4th/5th heart slots once earned by healing)
  const numHearts=Math.max(3, Math.min(5, p.visibleHearts||3));
  for(let i=0;i<numHearts;i++){
    const rem=Math.max(0,Math.min(2,p.hp-i*2));
    ds(rem>=2?S.heartFull:rem===1?S.heartHalf:S.heartEmpty, 3+i*9, 2);
  }


  // Tiny translucent inventory for run items
  const inventoryIcons=[];
  if(masterSwordOwned) inventoryIcons.push({spr:S.upSword, scale:0.68, alpha:0.92, passive:true});
  if(potionCount>0) inventoryIcons.push({spr:S.potionIcon, scale:0.74, alpha:0.92, count:potionCount});
  if(playerHasAnyKey(p)) inventoryIcons.push({spr:S.key, scale:0.74, alpha:0.92, count:1});
  const invX=3, invY=11, slotW=7, gap=1;
  const hasInventory=inventoryIcons.length>0;
  const invW=hasInventory ? inventoryIcons.length*(slotW+gap)-gap+4 : 0;
  if(hasInventory){
    ctx.save();
    ctx.globalAlpha=0.22;
    fr(invX-1,invY-1,invW,9,'#ced9df');
    ctx.globalAlpha=0.38;
    fr(invX,invY,invW-2,7,'#0c0f12');
    inventoryIcons.forEach((icon,idx)=>{
      const sx=invX+1+idx*(slotW+gap);
      ctx.globalAlpha=0.10;
      fr(sx-1,invY+1,slotW,5,'#d8e4ea');
      ctx.globalAlpha=icon.alpha;
      dsScale(icon.spr,sx,invY+1,icon.scale);
      if(icon.count){
        pt(String(icon.count), (sx+5)*SCALE, (invY+2)*SCALE, 4, C.BN1, 'center', C.DK);
      }
    });
    ctx.restore();
  }

  // Skill icons — moved beside the item tray underneath the health bar
  const skillIcons=[];
  if(p.shield){
    skillIcons.push({
      spr:S.shieldIcon,
      edge:C.SH2,
      pulse:0.50+0.18*Math.sin(frame*0.10),
      alpha:0.80
    });
  }
  skillIcons.push({
    spr:p.shadowStep ? S.shadowStepIcon : S.stepIcon,
    edge:p.shadowStep ? C.MG2 : C.SI2,
    pulse:dodgeCooldownT>0 ? 0.26 : (0.44+0.12*Math.sin(frame*0.12)),
    alpha:dodgeCooldownT>0 ? 0.44 : 0.72,
    cd:dodgeCooldownT>0 ? Math.max(1, Math.ceil(dodgeCooldownT/60)) : 0
  });
  if(whirlwindUnlocked){
    skillIcons.push({
      spr:S.whirlwindIcon,
      edge:C.SH2,
      pulse:whirlwindCooldownT>0 ? 0.28 : (0.48+0.12*Math.sin(frame*0.12)),
      alpha:whirlwindCooldownT>0 ? 0.42 : 0.68,
      cd:whirlwindCooldownT>0 ? Math.max(1, Math.ceil(whirlwindCooldownT/60)) : 0
    });
  }
  if(skillIcons.length){
    const skillX=(hasInventory ? (invX+invW+3) : 3);
    const skillY=11;
    const skillSlotW=7;
    const skillGap=1;
    skillIcons.forEach((icon,idx)=>{
      const iconX=skillX+idx*(skillSlotW+skillGap);
      const iconY=skillY;
      ctx.save();
      ctx.globalAlpha=icon.pulse;
      fr(iconX-1,iconY-1,9,9,icon.edge);
      ctx.globalAlpha=0.55;
      fr(iconX,iconY,7,7,C.DK);
      ctx.globalAlpha=icon.alpha;
      ds(icon.spr, iconX, iconY);
      ctx.restore();
      if(icon.cd){
        pt(String(icon.cd), (iconX+3)*SCALE, (iconY+8)*SCALE, 4, C.BN1, 'center', C.DK);
      }
    });
  }

  // Score + kill count aligned in two clean HUD rows, slightly larger for readability
  const hudLabelX=(GW-29)*SCALE;
  const hudValueX=(GW-4)*SCALE;
  ptHeavy('Score:',hudLabelX,3*SCALE,5,C.BN1,'left',C.DK);
  ptHeavy(String(score),hudValueX,3*SCALE,5,C.BN1,'right',C.DK);
  ptHeavy('Kills:',hudLabelX,10*SCALE,5,C.BN1,'left',C.DK);
  ptHeavy(String(killCount),hudValueX,10*SCALE,5,C.BN1,'right',C.DK);
  if(newGamePlus) pt('NG+',78*SCALE,4*SCALE,5,C.SH,'left',C.W3);
  if(devGodMode) pt('GOD',3*SCALE,(GH-4)*SCALE,5,C.MG2,'left',C.W3);
  if(dragonBoss && !bossDefeated){
    const bw=46, bh=4, bx=((GW-bw)/2)|0, by=10;
    ctx.save();
    ctx.globalAlpha=0.66;
    fr(bx-1,by-1,bw+2,bh+2,C.DK);
    fr(bx,by,bw,bh,C.W3);
    const fill=Math.max(0, Math.round((dragonBoss.hp/dragonBoss.maxHp)*bw));
    fr(bx,by,fill,bh,dragonBoss.phase===2?C.FR1:C.BN1);
    ctx.restore();

    pt('DRAGON', GW*SCALE/2, 15, 5, C.WH, 'center', C.DK);
    if(dragonBoss.phase===2){
      pt('PHASE 2', GW*SCALE/2, 21, 4, C.BN1, 'center', C.DK);
    }
    if(dragonBoss.howlT>0) pt('HOWL', GW*SCALE/2, 15, 5, C.MG2, 'center', C.DK);
  } else if(shadowBoss && !shadowBossDefeated){
    const bw=46, bh=4, bx=((GW-bw)/2)|0, by=10;
    ctx.save();
    ctx.globalAlpha=0.66;
    fr(bx-1,by-1,bw+2,bh+2,C.DK);
    fr(bx,by,bw,bh,C.W3);
    const fill=Math.max(0, Math.round((shadowBoss.hp/shadowBoss.maxHp)*bw));
    fr(bx,by,fill,bh,shadowBoss.phase===2?C.FR1:C.MG2);
    ctx.restore();

    pt('CRAWLER', GW*SCALE/2, 15, 5, C.WH, 'center', C.DK);
    if(shadowBoss.phase===2){
      pt('PHASE 2', GW*SCALE/2, 21, 4, C.FR1, 'center', C.DK);
    }
    if(shadowBoss.screechStartupT>0 || shadowBoss.screechT>0) pt('SCREECH', GW*SCALE/2, 15, 5, C.FR1, 'center', C.DK);
    else if(shadowBoss.howlT>0) pt('HOWL', GW*SCALE/2, 15, 5, C.FR1, 'center', C.DK);
  } else if(currentZone===2 && bossDefeated){
    pt('DRAGON SLAIN', GW*SCALE/2, 8, 5, C.FR1, 'center', C.DK);
  } else if(currentZone===3 && shadowBossDefeated){
    pt('CORRUPTION SILENCED', GW*SCALE/2, 8, 5, C.MG2, 'center', C.DK);
  }
  if(hasAnyKeyDrop()){
    ctx.globalAlpha=0.28+0.12*Math.sin(frame*0.14);
    fr(GW-18,2,7,7,C.FR1);
    ctx.globalAlpha=1;
  }
  ctx.textAlign='left';

  // ── Chests on floor ──
  const floorChests = typeof getChestList === 'function' ? getChestList() : (chest ? [chest] : []);
  for(const c of floorChests){
    const glow=0.22+0.18*Math.sin(frame*0.19);
    ctx.globalAlpha=glow;
    fr(c.x-2,c.y-2,c.w+4,c.h+4,C.FR1);
    ctx.globalAlpha=1;
    ds(S.chest,c.x,c.y);
    // glint pixel
    if(Math.floor(frame/8)%3===0){
      ctx.globalAlpha=0.9;
      fr(c.x+3,c.y-1,1,1,C.BN1);
      ctx.globalAlpha=1;
    }
  }

  // Heart drops
  for(const h of heartDrops){
    const bob=Math.sin(frame*0.12 + (h.bobSeed||0))*0.75;
    const alpha=getGroundItemAlpha(h);
    const sprite=h.kind==='half' ? S.halfHeartDrop : S.heartDrop;
    ctx.globalAlpha=(0.22+0.14*Math.sin(frame*0.18))*alpha;
    fr(h.x-1,h.y-1,h.w+2,h.h+2,C.HP2);
    ctx.globalAlpha=alpha;
    ds(sprite,h.x,Math.round(h.y+bob));
    ctx.globalAlpha=1;
  }
  for(const d of potionDrops){
    const bob=Math.sin(frame*0.11 + (d.bobSeed||0))*0.6;
    const alpha=getGroundItemAlpha(d);
    ctx.globalAlpha=(0.18+0.10*Math.sin(frame*0.14))*alpha;
    fr(d.x-1,d.y-1,d.w+2,d.h+2,C.HP1);
    ctx.globalAlpha=alpha;
    ds(S.potionIcon,d.x,Math.round(d.y+bob));
    ctx.globalAlpha=1;
  }

  // Key drop
  if(hasAnyKeyDrop()){
    const bob=Math.floor(frame/14)%2;
    for(const drop of getKeyDropList()){
      const col=drop.kind==='secret1' ? C.MG2 : (drop.kind==='zone1Door' ? C.FR1 : C.BN1);
      ctx.globalAlpha=0.18+0.12*Math.sin(frame*0.16);
      fr(drop.x-1,drop.y-1,drop.w+2,drop.h+2,col);
      ctx.globalAlpha=1;
      ds(S.key,drop.x,drop.y+bob);
    }
  }

  // Particles
  for(const pt of parts){
    ctx.globalAlpha=pt.life/pt.max;
    ctx.fillStyle=pt.col;
    ctx.fillRect(Math.round(pt.x)*SCALE,Math.round(pt.y)*SCALE,SCALE,SCALE);
  }
  ctx.globalAlpha=1;

  // Fireballs (Wizard Skeleton projectiles)
  for(const fb of fireballs){
    const pulse=0.7+0.3*Math.sin(frame*0.4);
    ctx.globalAlpha=pulse*0.95;
    fr(Math.round(fb.x)-1,Math.round(fb.y)-1,5,5,C.FB);
    ctx.globalAlpha=pulse;
    fr(Math.round(fb.x),Math.round(fb.y),3,3,C.FB2);
    ctx.globalAlpha=1;
  }

  for(const flame of dragonFlames){
    const alpha=(flame.ttl/flame.maxTtl)*(0.72+0.28*Math.sin(frame*0.45));
    ctx.globalAlpha=Math.max(0.1,alpha*0.8);
    fr(flame.x,flame.y,flame.w,flame.h,C.FB);
    ctx.globalAlpha=Math.max(0.1,alpha);
    fr(flame.x+1,flame.y+1,Math.max(1,flame.w-2),Math.max(1,flame.h-2),C.FB2);
    ctx.globalAlpha=1;
  }
  if(dragonSwipe){
    const alpha=(dragonSwipe.ttl/dragonSwipe.maxTtl)*(0.6+0.4*Math.sin(frame*0.6));
    ctx.globalAlpha=Math.max(0.12,alpha*0.6);
    fr(dragonSwipe.x,dragonSwipe.y,dragonSwipe.w,dragonSwipe.h,C.WH);
    ctx.globalAlpha=Math.max(0.12,alpha);
    fr(dragonSwipe.x+1,dragonSwipe.y+1,Math.max(1,dragonSwipe.w-2),Math.max(1,dragonSwipe.h-2),C.BN1);
    ctx.globalAlpha=1;
  }

  // Shield shockwaves
  for(const sw of shockwaves){
    const t=sw.life/sw.maxLife;
    ctx.globalAlpha=Math.max(0.15, t*0.6);
    ctx.strokeStyle=C.SH;
    ctx.lineWidth=SCALE;
    ctx.beginPath();
    ctx.arc(sw.x*SCALE, sw.y*SCALE, sw.r*SCALE, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha=Math.max(0.08, t*0.35);
    ctx.strokeStyle=C.SI1;
    ctx.beginPath();
    ctx.arc(sw.x*SCALE, sw.y*SCALE, Math.max(0, sw.r-2)*SCALE, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha=1;
  }

  // Float texts (e.g. +5 for giant kill)
  ctx.textBaseline='top'; ctx.textAlign='center';
  for(const ft of floatTexts){
    ctx.globalAlpha=ft.life/ft.max;
    pt(ft.text,Math.round(ft.x)*SCALE,Math.round(ft.y)*SCALE,7,ft.col,'center',C.DK);
  }
  ctx.globalAlpha=1; ctx.textAlign='left';

  // ── Enemies ──
  for(const e of enemies){
    const rx=Math.round(e.x), ry=Math.round(e.y);
    const spr=getSkeletonSprite(e);
    const flip=e.dir==='right';
    const spawning=e.spawnT>0 && e.spawnMax>0;
    const spawnRatio=spawning ? Math.max(0, Math.min(1, e.spawnT/e.spawnMax)) : 0;
    const spawnIn=1-spawnRatio;
    let drawY=ry;
    let spriteAlpha=1;

    if(spawning){
      if(e.spawnAnim==='rise'){
        const pulse=0.20+0.10*Math.sin(frame*0.36);
        const groundY=ry+e.h-2;
        ctx.globalAlpha=0.30+pulse;
        fr(rx-3,groundY,e.w+6,2,C.FR2);
        ctx.globalAlpha=0.18+spawnIn*0.28;
        fr(rx-1,groundY-1,e.w+2,1,C.FR1);
        ctx.globalAlpha=0.16+spawnIn*0.20;
        fr(rx+1,groundY-3,Math.max(2,e.w-2),1,C.FB2);
        ctx.globalAlpha=1;
        drawY=ry+Math.ceil(7*spawnRatio);
        spriteAlpha=0.28+spawnIn*0.72;
      } else if(e.spawnAnim==='portal'){
        const pulse=0.35+0.20*Math.sin(frame*0.42);
        frBorder(rx-3,ry-3,e.w+6,e.h+6,C.FR1,pulse);
        frBorder(rx-5,ry-5,e.w+10,e.h+10,C.FR2,pulse*0.45);
        spriteAlpha=0.20+spawnIn*0.80;
      } else if(e.spawnAnim==='walkIn'){
        const pulse=0.16+0.10*Math.sin(frame*0.30);
        frBorder(rx-2,ry-2,e.w+4,e.h+4,C.FR1,0.20+spawnIn*0.22);
        ctx.globalAlpha=0.16+pulse;
        fr(rx-1,ry+e.h-1,e.w+2,1,C.FR2);
        ctx.globalAlpha=1;
        spriteAlpha=0.55+spawnIn*0.45;
      } else {
        frBorder(rx-2,ry-2,e.w+4,e.h+4,C.FR1,0.22+spawnIn*0.35);
        spriteAlpha=0.30+spawnIn*0.70;
      }
    }

    if(e.giant){
      if(currentZone===3){
        ctx.globalAlpha=0.12+0.06*Math.sin(frame*0.12 + rx*0.1);
        fr(rx-3,drawY-3,e.w+6,e.h+6,C.FR1);
        ctx.globalAlpha=1;
      }
      // Red hit flash behind sprite
      if(e.hurtT>0){
        ctx.globalAlpha=0.55;
        fr(rx,drawY,e.w,e.h,C.RD);
        ctx.globalAlpha=1;
      }
      // Giant at 2× (each sprite pixel = 2 logical px)
      const bob=Math.floor(e.walkF/10)%2 *2;
      ctx.globalAlpha=spriteAlpha;
      ds2(spr,rx,drawY+bob,flip);
      drawEnemyBrokenSword(e,rx,drawY,bob,flip);
      ctx.globalAlpha=1;
      // HP pips above head
      if(!spawning){
        for(let h=0;h<3;h++){
          fr(rx+h*5+1,drawY-4,4,2,h<e.hp?C.GR:C.W3);
        }
      }
    } else {
      if(currentZone===3 && !e.wizard){
        ctx.globalAlpha=0.10+0.05*Math.sin(frame*0.16 + rx*0.1);
        fr(rx-2,drawY-2,e.w+4,e.h+4,C.FR1);
        ctx.globalAlpha=1;
      }
      if(e.hurtT>0){
        ctx.globalAlpha=0.5;
        fr(rx,drawY,e.w,e.h,C.RD);
        ctx.globalAlpha=1;
      }
      // Wizard aura glow
      if(e.wizard){
        const glowA=0.25+0.15*Math.sin(frame*0.18);
        ctx.globalAlpha=glowA;
        fr(rx-2,drawY-2,e.w+4,e.h+4,C.MG);
        ctx.globalAlpha=glowA*0.5;
        fr(rx-3,drawY-3,e.w+6,e.h+6,C.MG3);
        ctx.globalAlpha=1;
      }
      const bob=Math.floor(e.walkF/10)%2;
      ctx.globalAlpha=spriteAlpha;
      ds(spr,rx,drawY+bob,flip);
      drawEnemyBrokenSword(e,rx,drawY,bob,flip);
      ctx.globalAlpha=1;
    }
  }
  if(dragonBoss && !bossDefeated) drawDragonBoss(dragonBoss);
  if(whyDragonsBoss) drawDragonBoss(whyDragonsBoss);
  if(shadowBoss && !shadowBossDefeated) drawShadowBoss(shadowBoss);

  // ── Player ──
  const flash=p.hurtT>0&&Math.floor(p.hurtT/4)%2===1;
  if(!flash){
    const moving=isKeyDown('ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyS','KeyW','KeyD');
    const wb=moving?Math.floor(p.walkF/8)%2:0;
    const flip=p.dir==='left';
    const spr=p.dir==='up'?S.plrU:p.dir==='down'?S.plrD:S.plrR;

    // Shield visual (drawn before sprite so it appears around it)
    if(currentZone===3){
      const glow=0.14+0.06*Math.sin(frame*0.18);
      ctx.globalAlpha=glow;
      fr(p.x-4,p.y-4,p.w+8,p.h+8,p.shadowStep?C.MG2:C.SH);
      ctx.globalAlpha=1;
    }
    if((p.dodgeInvulnT||0)>0){
      const pulse=0.40+0.25*Math.sin(frame*0.35);
      frBorder(p.x-2,p.y-2,p.w+4,p.h+4,C.MG2,pulse);
      frBorder(p.x-3,p.y-3,p.w+6,p.h+6,C.SH,pulse*0.45);
    } else if(p.shield){
      const pulse=0.5+0.3*Math.sin(frame*0.28);
      frBorder(p.x-2,p.y-2,p.w+4,p.h+4,C.SH,pulse);
      frBorder(p.x-3,p.y-3,p.w+6,p.h+6,C.SH2,pulse*0.4);
    } else if(p.shieldBreakT>0){
      // Expanding / fading shatter border
      const t=p.shieldBreakT/24;
      const exp=(1-t)*5;
      frBorder(p.x-2-exp,p.y-2-exp,p.w+4+exp*2,p.h+4+exp*2,C.SI1,t*0.7);
      frBorder(p.x-3-exp,p.y-3-exp,p.w+6+exp*2,p.h+6+exp*2,C.SH,t*0.3);
    }

    ds(spr,Math.round(p.x),Math.round(p.y)+wb,flip);

    if(currentZone===ZONE_SECRET1 && isSecret1WaterZone({x:p.x,y:p.y,w:p.w,h:p.h})){
      ctx.globalAlpha=0.32+0.08*Math.sin(frame*0.10);
      fr(p.x-1,p.y+5,p.w+2,3,'#bfefff');
      ctx.globalAlpha=0.20+0.06*Math.sin(frame*0.13+0.7);
      fr(p.x,p.y+6,p.w,2,'#76c8e8');
      ctx.globalAlpha=1;
    }

    // Sword sweep flash
    if(p.atkT>0){
      const box=atkBox(p,p.swordReach);
      const a=p.atkT/18;
      ctx.globalAlpha=a*0.72; fr(box.x,box.y,box.w,box.h,C.SI1);
      ctx.globalAlpha=a*0.38; fr(box.x+1,box.y+1,box.w-2,box.h-2,C.BN1);
      if(masterSwordOwned){
        const glow=0.22+0.18*Math.sin(frame*0.26);
        ctx.globalAlpha=glow;
        fr(box.x-2,box.y-2,box.w+4,box.h+4,C.SH);
        ctx.globalAlpha=glow*0.7;
        fr(box.x-3,box.y-3,box.w+6,box.h+6,'#d8f6ff');
      }
      ctx.globalAlpha=1;
    }
    if(whirlwindChargeT>=WHIRLWIND_HOLD_FRAMES){
      const holdBox=atkBox(p, p.swordReach+2);
      const pulse=0.25+0.18*Math.sin(frame*0.30);
      ctx.globalAlpha=pulse;
      fr(holdBox.x-1,holdBox.y-1,holdBox.w+2,holdBox.h+2,C.SH);
      ctx.globalAlpha=1;
    }
    if(whirlwindSlashT>0){
      const cx=p.x+p.w/2, cy=p.y+p.h/2;
      const rr=10+(16-whirlwindSlashT)*1.8;
      ctx.globalAlpha=0.24+0.18*Math.sin(frame*0.30);
      fr(cx-rr,cy-1,rr*2,2,C.SH);
      fr(cx-1,cy-rr,2,rr*2,C.SH);
      ctx.globalAlpha=0.18;
      fr(cx-rr+2,cy-rr+2,rr*2-4,rr*2-4,'#d8f6ff');
      ctx.globalAlpha=1;
    }
  }

  if(gState==='playing'){
    const interactTarget=getCurrentInteractionTarget();
    if(interactTarget) drawInteractPrompt(interactTarget.promptX, interactTarget.promptY);
  }

  if(currentZone===1 && secret1UnlockAlertT>0){
    const pulse=0.55+0.45*Math.sin(frame*0.18);
    ctx.globalAlpha=0.20*pulse;
    fr(19,93,82,14,C.MG2);
    ctx.globalAlpha=1;
    ptHeavy('SECRET ZONE 1',GW*SCALE/2,95*SCALE,6,C.BN1,'center',C.DK);
    ptHeavy('UNLOCKED!  (CLICK!)',GW*SCALE/2,103*SCALE,4,C.WH,'center',C.DK);
  }

  drawZoneFrontOverlays();
}

