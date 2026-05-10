// Bosses
// Purpose: Dragon boss and corrupted/shadow boss spawning, AI updates, attacks, damage, and defeat flow.
function getDragonCenter(b=dragonBoss){
  return b ? {x:b.x+b.w/2, y:b.y+b.h/2} : {x:0,y:0};
}

function getDragonHurtBox(b=dragonBoss){
  if(!b) return {x:0,y:0,w:0,h:0};
  return {x:b.x+4,y:b.y+4,w:b.w-8,h:b.h-6};
}

function getDragonHazardOwner(b=dragonBoss){
  return b && b.bonus ? 'whyDragonsBoss' : 'dragonBoss';
}

function clearDragonHazards(owner){
  if(!owner){
    dragonFlames=[];
    dragonSwipe=null;
    fireballs=fireballs.filter(f=>!f.dragon);
    return;
  }
  dragonFlames=dragonFlames.filter(f=>f.owner!==owner);
  if(dragonSwipe && dragonSwipe.owner===owner) dragonSwipe=null;
  fireballs=fireballs.filter(f=>!(f.dragon && f.owner===owner));
}

function countDragonFightNormalAdds(){
  return enemies.filter(e=>!e.giant && !e.wizard).length;
}

function countDragonFightWizards(){
  return enemies.filter(e=>e.wizard).length;
}

function countShadowBossWizards(){
  return enemies.filter(e=>e.shadowBossWizard).length;
}

function spawnWizardNearShadow(){
  const b=shadowBoss;
  if(!b || shadowBossDefeated) return false;
  const c=getShadowCenter(b);
  const candidates=[
    {x:Math.round(c.x-18), y:Math.round(c.y-10)},
    {x:Math.round(c.x+10), y:Math.round(c.y-10)},
    {x:Math.round(c.x-18), y:Math.round(c.y+8)},
    {x:Math.round(c.x+10), y:Math.round(c.y+8)},
    {x:Math.round(c.x-4), y:Math.round(c.y-18)},
  ];
  for(const cand of candidates){
    const x=Math.max(PX, Math.min(PX+PW-8, cand.x));
    const y=Math.max(PY+2, Math.min(PY+PH-8, cand.y));
    const box={x,y,w:8,h:8};
    if(collidesZoneObstacles(x,y,8,8)) continue;
    if(ov(box,{x:player.x,y:player.y,w:player.w,h:player.h})) continue;
    if(enemies.some(e=>ov(box,{x:e.x,y:e.y,w:e.w,h:e.h}))) continue;
    enemies.push({x,y,w:8,h:8,speed:0.30,dir:'left',
      atkT:0,atkCD:140,walkF:0,hp:1,points:3,giant:false,wizard:true,hurtT:0,shootCD:64,
      shadowBossWizard:true});
    return true;
  }
  return false;
}

function ensureCrawlerWizardRespawns(){
  if(!shadowBoss || shadowBossDefeated) return;
  const desired = shadowBoss.phase===1 ? 1 : 2;
  let alive = countShadowBossWizards();
  for(let i=shadowWizardRespawns.length-1;i>=0;i--){
    shadowWizardRespawns[i]--;
    if(shadowWizardRespawns[i] <= 0){
      if(alive < desired && spawnWizardNearShadow()){
        shadowWizardRespawns.splice(i,1);
        alive++;
      } else {
        shadowWizardRespawns[i] = 30;
      }
    }
  }
}

function spawnWizardNearDragon(){
  const b=dragonBoss;
  if(!b || countDragonFightWizards()>=DRAGON_MAX_WIZARDS) return;
  const x=Math.max(PX, Math.min(PX+PW-8, b.x + (b.dir==='right' ? b.w-10 : 2)));
  const y=Math.max(PY, Math.min(PY+PH-8, b.y+b.h+2));
  enemies.push({x,y,w:8,h:8,speed:0.26,dir:'left',
    atkT:0,atkCD:150,walkF:0,hp:1,points:3,giant:false,wizard:true,hurtT:0,shootCD:70});
}

function spawnNormalFromDragon(){
  const b=dragonBoss;
  if(!b || countDragonFightNormalAdds()>=DRAGON_MAX_NORMAL_ADDS) return;
  const normalVariants=['old','new','classic'];
  const x=Math.max(PX, Math.min(PX+PW-9, b.x + (b.dir==='right' ? 2 : b.w-11) + ((Math.random()*5)|0)));
  const y=Math.max(PY, Math.min(PY+PH-9, b.y+b.h-4 + ((Math.random()*4)|0)));
  enemies.push({x,y,w:9,h:9,speed:0.34,dir:b.dir,
    atkT:0,atkCD:90+(Math.random()*40|0),walkF:0,
    hp:1,points:1,giant:false,hurtT:0,variant:normalVariants[(Math.random()*normalVariants.length)|0]});
}

function spawnDragonBoss(){
  if((currentZone!==1 && currentZone!==2) || dragonBoss || bossDefeated) return false;
  try{ if(window.AudioEvents) AudioEvents.dragonSpawn(currentZone); }catch(err){}
  if(currentZone===1 && zone1MiniBossDefeated) return false;
  // Boss spawn is additive: do not clear enemies, queued spawns, drops,
  // chests, or active projectiles when the final-wave condition is met.
  dragonFlames=[]; dragonSwipe=null;
  const zone1Mini=currentZone===1;
  const phaseHp=zone1Mini ? ZONE1_DRAGON_PHASE_HITS : DRAGON_PHASE_HITS;
  dragonBoss={
    x:GW/2-18, y:PY+8, w:36, h:28,
    dir:'left', speed:0.18, walkF:0,
    phase:1, hp:phaseHp, maxHp:phaseHp,
    phaseHp,
    hurtT:0, atkT:0, atkName:'', howlT:0,
    fireballCD:110, fireblastCD:145, tailCD:52,
    summonT:DRAGON_SUMMON_INTERVAL, spawnLock:36,
    zone1Mini,
    points:zone1Mini?200:300,
  };
  floatTexts.push({x:GW/2,y:PY+12,text:(zone1Mini?'MINIBOSS: BONE DRAGON':'BOSS: SKELETON DRAGON'),life:85,max:85,col:C.FR1});
  return true;
}

function spawnWhyDragonsBoss(){
  if(whyDragonsBoss) return false;
  try{ if(window.AudioEvents) AudioEvents.dragonSpawn(2); }catch(err){}
  const phaseHp=DRAGON_PHASE_HITS;
  whyDragonsBoss={
    x:Math.max(PX, Math.min(PX+PW-36, GW/2+14)), y:PY+12, w:36, h:28,
    dir:'right', speed:0.18, walkF:0,
    phase:1, hp:phaseHp, maxHp:phaseHp,
    phaseHp,
    hurtT:0, atkT:0, atkName:'', howlT:0,
    fireballCD:96, fireblastCD:132, tailCD:48,
    summonT:DRAGON_SUMMON_INTERVAL, spawnLock:44,
    zone1Mini:false,
    bonus:true,
    points:300,
  };
  floatTexts.push({x:GW/2,y:PY+22,text:'BONUS: SKELETON DRAGON',life:90,max:90,col:C.MG2});
  return true;
}

function rollFireballSpeed(base){
  const slowerBase=base*0.5;
  const variance=0.8 + Math.random()*0.4;
  return slowerBase*variance;
}

function spawnDragonFireball(){
  const b=dragonBoss;
  if(!b) return;
  const {x:cx,y:cy}=getDragonCenter(b);
  const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
  const dx=pcx-cx, dy=pcy-cy;
  const baseAng=Math.atan2(dy,dx);
  const spread=[-0.22,0,0.22];
  const sx=cx+(b.dir==='right'?8:-8), sy=cy-6;
  const owner=getDragonHazardOwner(b);

  for(const off of spread){
    const ang=baseAng+off;
    const spd=rollFireballSpeed(0.92);
    fireballs.push({
      x:sx,y:sy,
      vx:Math.cos(ang)*spd,
      vy:Math.sin(ang)*spd,
      life:175,
      dragon:true,
      owner
    });
  }

  b.atkT=24;
  b.atkName='fireball';
}

function spawnDragonFireblast(){
  try{ if(window.AudioEvents) AudioEvents.dragonFireblast(); }catch(err){}
  const b=dragonBoss;
  if(!b) return;
  const owner=getDragonHazardOwner(b);
  for(let i=0;i<6;i++){
    const w=6+i*3;
    const h=5+i*2;
    const depth=4+i*5;
    const x=b.dir==='right' ? b.x+b.w-4+depth : b.x-depth-w+4;
    const y=b.y+10-Math.floor(h/2);
    dragonFlames.push({x,y,w,h,ttl:DRAGON_FIREBLAST_TTL,maxTtl:DRAGON_FIREBLAST_TTL,owner});
  }
  b.atkT=26;
  b.atkName='fireblast';
}

function spawnDragonTailSwipe(){
  const b=dragonBoss;
  if(!b) return;
  const owner=getDragonHazardOwner(b);
  const w=18, h=18;
  const x=b.dir==='right' ? b.x-16 : b.x+b.w-2;
  const y=b.y+8;
  dragonSwipe={x,y,w,h,ttl:DRAGON_TAIL_TTL,maxTtl:DRAGON_TAIL_TTL,owner};
  b.atkT=18;
  b.atkName='tail';
}

function startDragonPhase2(){
  try{ if(window.AudioEvents) AudioEvents.dragonRoar(); }catch(err){}
  const b=dragonBoss;
  if(!b) return;
  b.phase=2;
  b.hp=b.phaseHp||DRAGON_PHASE_HITS;
  b.maxHp=b.phaseHp||DRAGON_PHASE_HITS;
  b.howlT=0;
  b.spawnLock=50;
  b.fireballCD=36;
  b.fireblastCD=68;
  b.tailCD=32;
  b.summonT=DRAGON_SUMMON_INTERVAL;
  b.atkT=22;
  b.atkName='phase2';
  spawnWizardNearDragon();
  floatTexts.push({x:GW/2,y:PY+18,text:'PHASE 2',life:70,max:70,col:C.MG2});
}

function defeatDragonBoss(){
  try{ if(window.AudioEvents) AudioEvents.dragonDeath(); }catch(err){}
  const b=dragonBoss;
  if(!b) return;
  const {x:cx,y:cy}=getDragonCenter(b);
  for(let i=0;i<34;i++){
    const a=Math.random()*Math.PI*2, s=0.5+Math.random()*2.6;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:24+(Math.random()*16|0),max:40,col:Math.random()<0.45?C.WH:(Math.random()<0.6?C.BN1:C.FR1)});
  }
  score+=b.points||100;
  killCount++;
  giantKillCount++;
  clearDragonHazards();
  enemies=[];
  pSpawns=[];
  clearChests();
  let progressionHandled=false;
  try{
    if(window.BoneCrawlerProgression){
      const eventResult=BoneCrawlerProgression.emit('boss.defeated', {
        bossId:b.zone1Mini ? 'zone1Dragon' : 'dragonBoss',
        zoneId:currentZone,
        x:Math.round(cx),
        y:Math.round(cy)
      });
      progressionHandled=!!(eventResult && eventResult.handled);
    }
  }catch(err){}
  if(b.zone1Mini){
    // Progression rules own Zone 1 rewards. The normal Zone 1 door key
    // is awarded by kill-count progression; the dragon fallback only protects
    // the secret key if the progression runtime is unavailable.
    if(!progressionHandled){
      const keyY=Math.round(cy)-3;
      if(player && !player.secret1Key && !hasKeyDropKind('secret1')){
        spawnKeyDrop(Math.round(cx)+3,keyY,'secret1');
        floatTexts.push({x:GW/2,y:PY+28,text:'SECRET KEY!',life:70,max:70,col:C.BN1});
      }
    }
    zone1MiniBossDefeated=true;
    // Do NOT set bossDefeated or bossClearTimer — zone 1 resumes normal spawning
  } else {
    bossDefeated=true;
    bossClearTimer=120;
  }
  dragonBoss=null;
  if(!whyDragonsBoss){
    try{ if(window.AudioEvents) AudioEvents.endBoss(currentZone); }catch(err){}
  }
  floatTexts.push({x:GW/2,y:PY+16,text:'DRAGON SLAIN!',life:95,max:95,col:C.FR1});
}

function damageDragonBoss(amount=1, fromShockwave=false){
  const b=dragonBoss;
  if(!b || bossDefeated || b.howlT>0) return false;
  b.hp-=amount;
  try{ if(window.AudioEvents) AudioEvents.dragonHit(); }catch(err){}
  b.hurtT=10;
  const {x:cx,y:cy}=getDragonCenter(b);
  burst(cx,cy);
  if(fromShockwave){
    floatTexts.push({x:cx,y:b.y-6,text:'-1',life:24,max:24,col:C.SH});
  }
  if(b.hp<=0){
    clearDragonHazards(getDragonHazardOwner(b));
    if(b.phase===1){
      b.hp=0;
      b.howlT=160;
      b.atkT=26;
      b.atkName='howl';
      floatTexts.push({x:GW/2,y:PY+16,text:'THE DRAGON HOWLS!',life:80,max:80,col:C.WH});
    } else {
      defeatDragonBoss();
    }
  }
  return true;
}


function defeatWhyDragonsBoss(){
  try{ if(window.AudioEvents) AudioEvents.dragonDeath(); }catch(err){}
  const b=whyDragonsBoss;
  if(!b) return;
  const {x:cx,y:cy}=getDragonCenter(b);
  for(let i=0;i<30;i++){
    const a=Math.random()*Math.PI*2, sp=0.5+Math.random()*2.4;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,
      life:22+(Math.random()*16|0),max:38,col:Math.random()<0.45?C.MG2:(Math.random()<0.7?C.BN1:C.FR1)});
  }
  score+=b.points||300;
  killCount++;
  giantKillCount++;
  clearDragonHazards(getDragonHazardOwner(b));
  whyDragonsBoss=null;
  if(!dragonBoss && !shadowBoss){
    try{ if(window.AudioEvents) AudioEvents.endBoss(currentZone); }catch(err){}
  }
  floatTexts.push({x:GW/2,y:PY+24,text:'BONUS DRAGON SLAIN!',life:95,max:95,col:C.MG2});
}

function damageWhyDragonsBoss(amount=1, fromShockwave=false){
  const b=whyDragonsBoss;
  if(!b || b.howlT>0) return false;
  b.hp-=amount;
  try{ if(window.AudioEvents) AudioEvents.dragonHit(); }catch(err){}
  b.hurtT=10;
  const {x:cx,y:cy}=getDragonCenter(b);
  burst(cx,cy);
  if(fromShockwave){
    floatTexts.push({x:cx,y:b.y-6,text:'-1',life:24,max:24,col:C.SH});
  }
  if(b.hp<=0){
    clearDragonHazards(getDragonHazardOwner(b));
    if(b.phase===1){
      b.hp=0;
      b.howlT=160;
      b.atkT=26;
      b.atkName='howl';
      floatTexts.push({x:GW/2,y:PY+22,text:'THE BONUS DRAGON HOWLS!',life:80,max:80,col:C.WH});
    } else {
      defeatWhyDragonsBoss();
    }
  }
  return true;
}

function chooseDragonAttack(b, dist, playerBehind){
  const options=[];
  if(playerBehind && dist<34 && b.tailCD<=0) options.push(['tail',8]);

  // Prevents fireblast spam
  if(b.fireblastCD<=0){
    if(dist<24) options.push(['fireblast',2]);
    else if(dist<50) options.push(['fireblast',3]);
    else options.push(['fireblast',1]);
  }

  // Fireball wave
  if(b.fireballCD<=0){
    if(dist>60) options.push(['fireball',4]);
    else if(dist>34) options.push(['fireball',2]);
    else options.push(['fireball',1]);
  }

  if(!options.length) return '';
  let total=0;
  for(const [,w] of options) total+=w;
  let roll=Math.random()*total;
  for(const [name,w] of options){
    roll-=w;
    if(roll<=0) return name;
  }
  return options[0][0];
}

function updateDragonHazards(){
  for(let i=dragonFlames.length-1;i>=0;i--){
    const f=dragonFlames[i];
    f.ttl--;
    if(f.ttl<=0){ dragonFlames.splice(i,1); continue; }
    if(ov({x:player.x,y:player.y,w:player.w,h:player.h},f)) hurtPlayer(1);
  }
  if(dragonSwipe){
    dragonSwipe.ttl--;
    if(dragonSwipe.ttl<=0) dragonSwipe=null;
    else if(ov({x:player.x,y:player.y,w:player.w,h:player.h},dragonSwipe)) hurtPlayer(1);
  }
}

function updateDragonBoss(options){
  const b=dragonBoss;
  if(!b || bossDefeated) return;
  if(b.hurtT>0) b.hurtT--;
  if(b.atkT>0) b.atkT--;
  if(b.fireballCD>0) b.fireballCD--;
  if(b.fireblastCD>0) b.fireblastCD--;
  if(b.tailCD>0) b.tailCD--;
  if(b.spawnLock>0) b.spawnLock--;
  b.walkF++;

  if(!(options && options.skipHazards)) updateDragonHazards();

  const {x:cx,y:cy}=getDragonCenter(b);
  const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
  const ddx=pcx-cx, ddy=pcy-cy;
  const dist=Math.hypot(ddx,ddy)||1;
  b.dir = ddx>=0 ? 'right' : 'left';

  if(b.howlT>0){
    if(frame%12===0){
      parts.push({x:cx+(Math.random()*10-5),y:b.y+4,vx:Math.random()*0.4-0.2,vy:-0.6-Math.random()*0.4,
        life:18,max:24,col:Math.random()<0.5?C.WH:C.MG2});
    }
    b.howlT--;
    if(b.howlT<=0) startDragonPhase2();
    return;
  }

  if(b.phase===2){
    b.summonT--;
    if(b.summonT<=0){
      if(countDragonFightNormalAdds()<DRAGON_MAX_NORMAL_ADDS) spawnNormalFromDragon();
      b.summonT=DRAGON_SUMMON_INTERVAL;
    }
  }

  const ideal=b.phase===1 ? 50 : 42;
  let mvx=Math.sin(frame*0.03)*0.05, mvy=Math.cos(frame*0.025)*0.04;
  if(dist>ideal){
    mvx+=ddx/dist*b.speed;
    mvy+=ddy/dist*b.speed*0.7;
  } else if(dist<18){
    mvx-=ddx/dist*b.speed*0.7;
    mvy-=ddy/dist*b.speed*0.5;
  }
  b.x=Math.max(PX,Math.min(PX+PW-b.w,b.x+mvx));
  b.y=Math.max(PY+2,Math.min(PY+PH-b.h-2,b.y+mvy));

  if(b.spawnLock<=0 && b.atkT<=0){
    const playerBehind=(b.dir==='right') ? (pcx < b.x+10) : (pcx > b.x+b.w-10);
    const attack=chooseDragonAttack(b, dist, playerBehind);
    if(attack==='tail'){
      b.tailCD=b.phase===2?64:82;
      spawnDragonTailSwipe();
    } else if(attack==='fireblast'){
      b.fireblastCD=b.phase===2?118:155;
      spawnDragonFireblast();
    } else if(attack==='fireball'){
      b.fireballCD=b.phase===2?92:128;
      spawnDragonFireball();
    }
  }
}


function updateWhyDragonsBoss(){
  if(!whyDragonsBoss) return;
  if(!dragonBoss) updateDragonHazards();
  const savedDragonBoss=dragonBoss;
  dragonBoss=whyDragonsBoss;
  updateDragonBoss({skipHazards:true});
  whyDragonsBoss=dragonBoss;
  dragonBoss=savedDragonBoss;
}

function getShadowCenter(b=shadowBoss){
  return b ? {x:b.x+b.w/2, y:b.y+b.h/2} : {x:0,y:0};
}

function getShadowHurtBox(b=shadowBoss){
  if(!b) return {x:0,y:0,w:0,h:0};
  return {x:b.x+1,y:b.y+1,w:b.w-2,h:b.h-1};
}

function getShadowSlashBox(b=shadowBoss){
  if(!b) return {x:0,y:0,w:0,h:0};
  if(b.dir==='left') return {x:b.x-6,y:b.y+1,w:7,h:6};
  if(b.dir==='right') return {x:b.x+b.w-1,y:b.y+1,w:7,h:6};
  if(b.dir==='up') return {x:b.x+1,y:b.y-6,w:6,h:7};
  return {x:b.x+1,y:b.y+b.h-1,w:6,h:7};
}

function spawnShadowWave(){
  const b=shadowBoss;
  if(!b) return;
  const c=getShadowCenter(b);
  shadowWaves.push({x:c.x,y:c.y,r:3,maxR:15,life:18,maxLife:18});
}

function triggerShadowCounter(){
  const b=shadowBoss;
  if(!b || shadowBossDefeated || b.howlT>0) return;
  b.counterT=14;
}

function startShadowPhase2(){
  try{ if(window.AudioEvents) AudioEvents.corruptedScreech(); }catch(err){}
  const b=shadowBoss;
  if(!b) return;
  b.phase=2;
  b.hp=SHADOW_PHASE_HITS;
  b.maxHp=SHADOW_PHASE_HITS;
  b.speed=0.40;
  b.atkT=0;
  b.atkName='';
  b.counterT=0;
  b.lungeCD=48;
  b.slashCD=22;
  b.screechCD=90;
  b.screechStartupT=0;
  b.screechT=0;
  b.screechWaveT=SHADOW_SCREECH_WAVE_INTERVAL;
  while(countShadowBossWizards()<2 && spawnWizardNearShadow()){}
  floatTexts.push({x:GW/2,y:PY+18,text:'PHASE 2',life:70,max:70,col:C.FR1});
}

function spawnShadowBoss(){
  if(currentZone!==3 || shadowBoss || shadowBossDefeated) return false;
  try{ if(window.AudioEvents) AudioEvents.corruptedSpawn(); }catch(err){}
  // Boss spawn is additive: do not clear enemies, queued spawns, drops,
  // chests, or active projectiles when the final-wave condition is met.
  shadowWaves=[];
  shadowBoss={
    x:GW/2-4, y:PY+12, w:8, h:8,
    dir:'down', speed:0.34, walkF:0,
    phase:1, hp:SHADOW_PHASE_HITS, maxHp:SHADOW_PHASE_HITS,
    hurtT:0, atkT:0, atkName:'', howlT:0,
    lungeCD:72, slashCD:30, counterT:0, waveT:SHADOW_WAVE_INTERVAL,
    screechCD:0, screechStartupT:0, screechT:0, screechWaveT:SHADOW_SCREECH_WAVE_INTERVAL,
    lungeVX:0, lungeVY:0
  };
  shadowWizardRespawns=[];
  floatTexts.push({x:GW/2,y:PY+12,text:'BOSS: CORRUPTED CRAWLER',life:95,max:95,col:C.MG2});
  return true;
}

function updateShadowBoss(){
  const b=shadowBoss;
  if(!b || shadowBossDefeated) return;
  if(b.hurtT>0) b.hurtT--;
  if(b.atkT>0) b.atkT--;
  if(b.lungeCD>0) b.lungeCD--;
  if(b.slashCD>0) b.slashCD--;
  if(b.counterT>0) b.counterT--;
  b.walkF++;

  const box={x:player.x,y:player.y,w:player.w,h:player.h};

  ensureCrawlerWizardRespawns();

  for(let i=shadowWaves.length-1;i>=0;i--){
    const sw=shadowWaves[i];
    sw.r += (sw.maxR - sw.r) * 0.35;
    const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
    const dist=Math.hypot(pcx-sw.x,pcy-sw.y);
    if(Math.abs(dist-sw.r) <= 3) hurtPlayer(1);
    if(--sw.life<=0) shadowWaves.splice(i,1);
  }

  if(b.howlT>0){
    b.howlT--;
    b.waveT--;
    if(b.waveT<=0){
      spawnShadowWave();
      b.waveT=SHADOW_WAVE_INTERVAL;
    }
    if(frame%10===0){
      const c=getShadowCenter(b);
      parts.push({x:c.x+(Math.random()*6-3),y:c.y-2,vx:Math.random()*0.5-0.25,vy:-0.5-Math.random()*0.4,
        life:16,max:22,col:Math.random()<0.5?C.MG2:C.FR1});
    }
    if(b.howlT<=0) startShadowPhase2();
    return;
  }

  if(b.screechStartupT>0){
    b.screechStartupT--;
    if(frame%8===0){
      const c=getShadowCenter(b);
      parts.push({x:c.x+(Math.random()*8-4),y:c.y-1,vx:Math.random()*0.7-0.35,vy:-0.55-Math.random()*0.45,
        life:18,max:26,col:Math.random()<0.5?C.FR1:C.MG2});
    }
    if(b.screechStartupT<=0){
      b.screechT=SHADOW_SCREECH_DURATION_FRAMES;
      try{ if(window.AudioEvents) AudioEvents.corruptedScreech(); }catch(err){}
      b.screechWaveT=1;
      b.atkName='screech';
    }
    return;
  }

  if(b.screechT>0){
    b.screechT--;
    b.screechWaveT--;
    if(b.screechWaveT<=0){
      spawnShadowWave();
      b.screechWaveT=SHADOW_SCREECH_WAVE_INTERVAL;
    }
    if(frame%8===0){
      const c=getShadowCenter(b);
      parts.push({x:c.x+(Math.random()*9-4.5),y:c.y-2,vx:Math.random()*0.8-0.4,vy:-0.60-Math.random()*0.55,
        life:18,max:24,col:Math.random()<0.5?C.FR1:C.WH});
    }
    if(b.screechT<=0){
      b.atkName='';
      b.screechCD=6*60;
    }
    return;
  }

  const c=getShadowCenter(b);
  const pcx=player.x+player.w/2, pcy=player.y+player.h/2;
  const ddx=pcx-c.x, ddy=pcy-c.y;
  const dist=Math.hypot(ddx,ddy)||1;

  if(Math.abs(ddx)>Math.abs(ddy)) b.dir=ddx>0?'right':'left';
  else b.dir=ddy>0?'down':'up';

  const slashBox=getShadowSlashBox(b);

  if(b.atkName==='lunge' && b.atkT>0){
    b.x=Math.max(PX,Math.min(PX+PW-b.w,b.x+b.lungeVX));
    b.y=Math.max(PY+2,Math.min(PY+PH-b.h-2,b.y+b.lungeVY));
    if(ov(box, slashBox)) hurtPlayer(1);
    if(b.atkT<=0) b.atkName='';
    return;
  }
  if(b.atkName==='slash' && b.atkT>0){
    if(ov(box, slashBox)) hurtPlayer(1);
    if(b.atkT<=0) b.atkName='';
  }

  const prefer=b.phase===1 ? 30 : 24;
  if(dist<prefer){
    b.x-=ddx/dist*b.speed*0.75;
    b.y-=ddy/dist*b.speed*0.75;
  } else if(dist>prefer+18){
    b.x+=ddx/dist*b.speed*0.45;
    b.y+=ddy/dist*b.speed*0.45;
  } else {
    b.x+=Math.sin(frame*0.05)*0.08;
    b.y+=Math.cos(frame*0.04)*0.06;
  }
  b.x=Math.max(PX,Math.min(PX+PW-b.w,b.x));
  b.y=Math.max(PY+2,Math.min(PY+PH-b.h-2,b.y));

  if(b.counterT>0 && dist<18 && b.atkT<=0 && b.slashCD<=0){
    b.atkT=16;
    b.atkName='slash';
    try{ if(window.AudioEvents) AudioEvents.corruptedAttack(); }catch(err){}
    b.slashCD=b.phase===1?36:24;
    return;
  }

  if(b.phase===2 && b.atkT<=0 && b.screechCD<=0 && dist<66){
    b.screechStartupT=SHADOW_SCREECH_STARTUP_FRAMES;
    b.screechT=0;
    b.screechWaveT=SHADOW_SCREECH_WAVE_INTERVAL;
    b.atkName='screech';
    return;
  }

  if(b.atkT<=0 && b.lungeCD<=0 && dist<60){
    b.atkT=b.phase===1?14:16;
    b.atkName='lunge';
    try{ if(window.AudioEvents) AudioEvents.corruptedAttack(); }catch(err){}
    const duration=b.atkT;
    const baseSpeed=b.phase===1?1.15:1.35;
    const bonusDistance=b.phase===1?SHADOW_PHASE1_LUNGE_BONUS_DISTANCE:SHADOW_PHASE2_LUNGE_BONUS_DISTANCE;
    const sp=baseSpeed + (bonusDistance/Math.max(1,duration));
    b.lungeVX=ddx/dist*sp;
    b.lungeVY=ddy/dist*sp;
    b.lungeCD=b.phase===1?76:54;
    return;
  }

  if(b.atkT<=0 && dist<14 && b.slashCD<=0){
    b.atkT=14;
    b.atkName='slash';
    try{ if(window.AudioEvents) AudioEvents.corruptedAttack(); }catch(err){}
    b.slashCD=b.phase===1?34:22;
  }
}

function damageShadowBoss(amount=1, fromShockwave=false){
  const b=shadowBoss;
  if(!b || shadowBossDefeated || b.howlT>0) return false;
  b.hp-=amount;
  try{ if(window.AudioEvents) AudioEvents.corruptedHit(); }catch(err){}
  b.hurtT=10;
  const c=getShadowCenter(b);
  burst(c.x,c.y);
  if(fromShockwave){
    floatTexts.push({x:c.x,y:b.y-6,text:'-1',life:24,max:24,col:C.SH});
  }
  if(b.hp<=0){
    if(b.phase===1){
      b.hp=0;
      b.howlT=SHADOW_HOWL_FRAMES;
      b.atkT=0;
      b.atkName='howl';
      b.waveT=1;
      floatTexts.push({x:GW/2,y:PY+16,text:'THE CRAWLER HOWLS!',life:80,max:80,col:C.WH});
    } else {
      defeatShadowBoss();
    }
  }
  return true;
}

function defeatShadowBoss(){
  try{ if(window.AudioEvents) AudioEvents.corruptedDeath(); }catch(err){}
  const b=shadowBoss;
  if(!b) return;
  const c=getShadowCenter(b);
  for(let i=0;i<28;i++){
    const a=Math.random()*Math.PI*2, s=0.5+Math.random()*2.2;
    parts.push({x:c.x,y:c.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:24+(Math.random()*16|0),max:40,col:Math.random()<0.4?C.MG2:(Math.random()<0.7?C.FR1:C.WH)});
  }
  score+=500;
  killCount++;
  wizardKillCount++;
  let progressionHandled=false;
  try{
    if(window.BoneCrawlerProgression){
      const eventResult=BoneCrawlerProgression.emit('boss.defeated', {bossId:'shadowBoss', zoneId:3, x:Math.round(c.x), y:Math.round(c.y)});
      progressionHandled=!!(eventResult && eventResult.handled);
    }
  }catch(err){}
  if(!progressionHandled){
    spawnKeyDrop(Math.round(c.x)-3,Math.round(c.y)-3,'zone3');
  }
  shadowWaves=[];
  shadowWizardRespawns=[];
  enemies=enemies.filter(e=>!e.shadowBossWizard);
  shadowBossDefeated=true;
  shadowBoss=null;
  try{ if(window.AudioEvents) AudioEvents.endBoss(3); }catch(err){}
  runCompleted=true;
  runTimeMs=performance.now()-runStartMs;
  floatTexts.push({x:GW/2,y:PY+16,text:'CORRUPTION SILENCED',life:95,max:95,col:C.FR1});
  floatTexts.push({x:Math.round(c.x),y:Math.round(c.y)-10,text:'KEY!',life:54,max:54,col:C.BN1});
  bossClearTimer=0;
}
