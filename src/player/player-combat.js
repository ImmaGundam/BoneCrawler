// player-combat
// Purpose: Player attacks, sword hit detection, whirlwind slash, and attack effects.
function performPlayerAttack(strength=1){
  const p=player;
  if(!p || p.atkCD>0 || p.atkT>0) return false;
  p.atkT=14;
  p.atkCD=30;
  try{ if(window.AudioEvents) AudioEvents.playerAttack(); }catch(err){}
  const dmg = devGodMode ? 999 : Math.max(1, strength|0);
  const box=atkBox(p, p.swordReach);
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e || e.spawnInvulnerable) continue;
    if(ov(box,{x:e.x,y:e.y,w:e.w,h:e.h})){
      e.hp -= dmg;
      try{ if(window.AudioEvents) AudioEvents.enemyHit(); }catch(err){}
      burst(e.x+e.w/2, e.y+e.h/2);
      if(e.hp<=0){
        handleEnemyDefeat(i,e,false);
      } else {
        e.hurtT=10;
      }
    }
  }
  if(dragonBoss && dragonBoss.howlT<=0 && ov(box,getDragonHurtBox())){
    damageDragonBoss(devGodMode ? 10 : strength,false);
  }
  if(whyDragonsBoss && whyDragonsBoss.howlT<=0 && ov(box,getDragonHurtBox(whyDragonsBoss))){
    damageWhyDragonsBoss(devGodMode ? 10 : strength,false);
  }
  if(shadowBoss && shadowBoss.howlT<=0 && ov(box,getShadowHurtBox())){
    damageShadowBoss(devGodMode ? 10 : strength,false);
    const sc=getShadowCenter();
    const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
    if(Math.hypot(pcx-sc.x,pcy-sc.y)<18 && Math.random()<0.85){
      triggerShadowCounter();
    }
  }
  if(currentZone===1){
    for(let i=0;i<ZONE1_DECOR_BLOCKERS.length;i++){
      if(!zone1Broken[i] && ov(box, ZONE1_DECOR_BREAK_RECTS[i])) breakZone1Decor(i);
    }
  }
  if(currentZone===2){
    for(let i=0;i<ZONE2_DECOR_BREAK_RECTS.length;i++){
      if(!zone2Broken[i] && ov(box, ZONE2_DECOR_BREAK_RECTS[i])) breakZone2Decor(i);
    }
  }
  if(currentZone===3){
    if(!zone3TreeAwake && ov(box, ZONE3_TREE_RECT)){
      zone3TreeHits=Math.min(ZONE3_TREE_HITS_TO_WAKE, zone3TreeHits+1);
      zone3TreeShakeT=10;
      burstDecor(ZONE3_TREE_RECT.x+ZONE3_TREE_RECT.w/2, ZONE3_TREE_RECT.y+ZONE3_TREE_RECT.h/2);
      if(zone3TreeHits>=ZONE3_TREE_HITS_TO_WAKE){
        zone3TreeAwake=true;
        floatTexts.push({x:ZONE3_TREE_RECT.x+ZONE3_TREE_RECT.w/2,y:ZONE3_TREE_RECT.y-6,text:'DEKU',life:60,max:60,col:C.MG2});
      }
    }
    for(let i=0;i<ZONE3_DECOR_BREAK_RECTS.length;i++){
      if(!zone3Broken[i] && ov(box, ZONE3_DECOR_BREAK_RECTS[i])) breakZone3Decor(i);
    }
  }
  return true;
}

function performWhirlwindSlash(){
  const p=player;
  if(!p || whirlwindCooldownT>0 || p.dead) return false;
  const cx=p.x+p.w/2, cy=p.y+p.h/2;
  const radius=18 + Math.max(0, p.swordWidth||0);
  whirlwindSlashT=16;
  whirlwindCooldownT=WHIRLWIND_COOLDOWN_FRAMES;
  try{ if(window.AudioEvents) AudioEvents.playerAttack(); }catch(err){}
  p.atkT=18;
  p.atkCD=30;

  for(let i=0;i<18;i++){
    const a=(i/18)*Math.PI*2;
    const s=0.5+Math.random()*1.6;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:16+(Math.random()*8|0),max:22,col:Math.random()<0.5?'#d8f6ff':'#7ccfff'});
  }

  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    if(!e || e.spawnInvulnerable) continue;
    const ex=e.x+e.w/2, ey=e.y+e.h/2;
    if(Math.hypot(ex-cx,ey-cy) <= radius + Math.max(e.w,e.h)/2){
      e.hp -= devGodMode ? 999 : 2;
      try{ if(window.AudioEvents) AudioEvents.enemyHit(); }catch(err){}
      burst(ex, ey);
      if(e.hp<=0){
        handleEnemyDefeat(i,e,false);
      } else {
        e.hurtT=12;
      }
    }
  }

  if(dragonBoss && dragonBoss.howlT<=0){
    const b=getDragonCenter();
    if(Math.hypot(b.x-cx,b.y-cy)<=radius+18) damageDragonBoss(devGodMode ? 10 : 2,false);
  }
  if(whyDragonsBoss && whyDragonsBoss.howlT<=0){
    const b=getDragonCenter(whyDragonsBoss);
    if(Math.hypot(b.x-cx,b.y-cy)<=radius+18) damageWhyDragonsBoss(devGodMode ? 10 : 2,false);
  }
  if(shadowBoss && shadowBoss.howlT<=0){
    const s=getShadowCenter();
    if(Math.hypot(s.x-cx,s.y-cy)<=radius+12) damageShadowBoss(devGodMode ? 10 : 2,false);
  }

  floatTexts.push({x:cx,y:cy-8,text:'WHIRLWIND',life:36,max:36,col:C.SH});
  return true;
}
