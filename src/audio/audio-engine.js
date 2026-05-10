// BoneCrawler audio engine
// Purpose: small global audio service for SFX, ambience, and music.
(function(){
  if(window.BoneCrawlerAudio) return;

  const manifest={
    sfx:{
      'player.attack':{src:'assets/audio/sfx/player/attack.ogg',volume:0.70,cooldownMs:80},
      'player.hit':{src:'assets/audio/sfx/player/hit.ogg',volume:0.75,cooldownMs:120},
      'player.dodge':{src:'assets/audio/sfx/player/dodge.ogg',volume:0.45,cooldownMs:180},
      'player.shield':{src:'assets/audio/sfx/player/shield.ogg',volume:0.80,cooldownMs:250},
      'player.death':{src:'assets/audio/sfx/player/death.ogg',volume:0.80,cooldownMs:800},

      'enemy.hit':{src:'assets/audio/sfx/enemy/hit.ogg',volume:0.55,cooldownMs:60},
      'skeleton.spawn':{src:'assets/audio/sfx/skeleton/spawn.ogg',volume:0.45,cooldownMs:100},
      'skeleton.attack':{src:'assets/audio/sfx/skeleton/attack.ogg',volume:0.50,cooldownMs:120},
      'skeleton.hit':{src:'assets/audio/sfx/skeleton/hit.ogg',volume:0.50,cooldownMs:80},
      'skeleton.death':{src:'assets/audio/sfx/skeleton/death.ogg',volume:0.60,cooldownMs:80},
      'wizard.attack':{src:'assets/audio/sfx/wizard/attack.ogg',volume:0.65,cooldownMs:180},

      'dragon.roar':{src:'assets/audio/sfx/dragon/roar.ogg',volume:0.90,cooldownMs:900},
      'dragon.fireblast':{src:'assets/audio/sfx/dragon/fireblast.ogg',volume:0.90,cooldownMs:250},
      'dragon.hit':{src:'assets/audio/sfx/dragon/hit.ogg',volume:0.65,cooldownMs:150},
      'dragon.death':{src:'assets/audio/sfx/dragon/death.ogg',volume:1.00,cooldownMs:1000},

      'corrupted.attack':{src:'assets/audio/sfx/corrupted/attack.ogg',volume:0.70,cooldownMs:160},
      'corrupted.hit':{src:'assets/audio/sfx/corrupted/hit.ogg',volume:0.65,cooldownMs:130},
      'corrupted.screech':{src:'assets/audio/sfx/corrupted/screech.ogg',volume:0.95,cooldownMs:1000},
      'corrupted.death':{src:'assets/audio/sfx/corrupted/death.ogg',volume:0.95,cooldownMs:1000},

      'item.chest':{src:'assets/audio/sfx/items/chest.ogg',volume:0.70,cooldownMs:200},
      'item.key':{src:'assets/audio/sfx/items/key.ogg',volume:0.75,cooldownMs:200},
      'door.unlock':{src:'assets/audio/sfx/items/door_unlock.ogg',volume:0.80,cooldownMs:500}
    },
    ambience:{
      'zone1.ambience':{src:'assets/audio/ambience/zone1.ogg',volume:0.32,loop:true},
      'zone2.ambience':{src:'assets/audio/ambience/zone2.ogg',volume:0.34,loop:true},
      'zone3.ambience':{src:'assets/audio/ambience/zone3.ogg',volume:0.34,loop:true},
      'secret1.effect':{src:'assets/audio/ambience/secret1.ogg',volume:0.55,loop:true},
      'secret2.effect':{src:'assets/audio/ambience/secret2.ogg',volume:0.45,loop:true}
    },
    music:{
      'zone1.boss':{src:'assets/audio/music/zone1_boss.ogg',volume:0.52,loop:true},
      'zone2.boss':{src:'assets/audio/music/zone2_boss.ogg',volume:0.50,loop:true},
      'zone3.boss':{src:'assets/audio/music/zone3_boss.ogg',volume:0.60,loop:true}
    }
  };

  const cache=new Map();
  const lastPlayed=new Map();
  let unlocked=false;
  let masterVolume=Number(localStorage.getItem('bc_audio_master') || 1);
  let sfxVolume=Number(localStorage.getItem('bc_audio_sfx') || 1);
  let musicVolume=Number(localStorage.getItem('bc_audio_music') || 0.75);
  let ambienceVolume=Number(localStorage.getItem('bc_audio_ambience') || 0.80);
  let muted=localStorage.getItem('bc_audio_muted') === '1';
  let currentMusic=null;
  let currentMusicId='';
  let currentAmbience=null;
  let currentAmbienceId='';
  let pendingMusicId='';
  let pendingAmbienceId='';

  function entry(type,id){ return manifest[type] && manifest[type][id] ? manifest[type][id] : null; }
  function getAudio(src){
    if(!src) return null;
    if(!cache.has(src)){
      const audio=new Audio(src);
      audio.preload='auto';
      cache.set(src,audio);
    }
    return cache.get(src);
  }
  function volumeFor(type,e,override){
    const base=override!=null ? Number(override) : Number(e.volume==null?1:e.volume);
    const group=type==='music' ? musicVolume : (type==='ambience' ? ambienceVolume : sfxVolume);
    return Math.max(0, Math.min(1, base * masterVolume * group * (muted?0:1)));
  }
  function canPlay(id,e){
    const cd=Number(e.cooldownMs||0);
    if(!cd) return true;
    const now=performance.now();
    const last=lastPlayed.get(id)||0;
    if(now-last<cd) return false;
    lastPlayed.set(id,now);
    return true;
  }
  function playSfx(id,opts={}){
    if(!unlocked || muted) return false;
    const e=entry('sfx',id); if(!e || !canPlay(id,e)) return false;
    const base=getAudio(e.src); if(!base) return false;
    const a=base.cloneNode(true);
    a.loop=false;
    a.volume=volumeFor('sfx',e,opts.volume);
    a.play().catch(()=>{});
    return true;
  }
  function playLoop(type,id){
    if(type==='music') pendingMusicId=id || '';
    if(type==='ambience') pendingAmbienceId=id || '';
    if(!unlocked || muted) return false;
    const e=entry(type,id); if(!e) return false;
    const isMusic=type==='music';
    const current=isMusic?currentMusic:currentAmbience;
    const currentId=isMusic?currentMusicId:currentAmbienceId;
    if(current && currentId===id && !current.paused) return true;
    if(current){ current.pause(); current.currentTime=0; }
    const a=getAudio(e.src); if(!a) return false;
    a.loop=e.loop!==false;
    a.volume=volumeFor(type,e);
    a.currentTime=0;
    a.play().catch(()=>{});
    if(isMusic){ currentMusic=a; currentMusicId=id; }
    else { currentAmbience=a; currentAmbienceId=id; }
    return true;
  }
  function playMusic(id){ return playLoop('music',id); }
  function playAmbience(id){ return playLoop('ambience',id); }
  function stopMusic(){ if(currentMusic){ currentMusic.pause(); currentMusic.currentTime=0; } currentMusic=null; currentMusicId=''; pendingMusicId=''; }
  function stopAmbience(){ if(currentAmbience){ currentAmbience.pause(); currentAmbience.currentTime=0; } currentAmbience=null; currentAmbienceId=''; pendingAmbienceId=''; }
  function stopAll(){ stopMusic(); stopAmbience(); }
  function getZoneAmbienceId(zone){
    const z=Number(zone);
    if(z===1) return 'zone1.ambience';
    if(z===2) return 'zone2.ambience';
    if(z===3) return 'zone3.ambience';
    return '';
  }
  function playZoneAmbience(zone){
    const z=Number(zone);
    stopMusic();
    const ambienceId=getZoneAmbienceId(z);
    if(ambienceId) return playAmbience(ambienceId);
    if(z===101){ stopAmbience(); return playAmbience('secret1.effect'); }
    if(z===102){ stopAmbience(); return playAmbience('secret2.effect'); }
    return false;
  }
  function ensureZoneAmbience(zone){
    const ambienceId=getZoneAmbienceId(zone);
    if(!ambienceId || muted) return false;
    if(currentMusic && !currentMusic.paused) return false;
    if(currentAmbience && currentAmbienceId===ambienceId && !currentAmbience.paused) return true;
    return playAmbience(ambienceId);
  }
  function playBossMusic(zone){
    const z=Number(zone);
    stopAmbience();
    if(z===1) return playMusic('zone1.boss');
    if(z===2) return playMusic('zone2.boss');
    if(z===3) return playMusic('zone3.boss');
    return false;
  }
  function unlock(){
    if(unlocked) return;
    unlocked=true;
    if(pendingAmbienceId) playLoop('ambience', pendingAmbienceId);
    if(pendingMusicId) playLoop('music', pendingMusicId);
  }
  function setMuted(value){ muted=!!value; localStorage.setItem('bc_audio_muted',muted?'1':'0'); if(muted) stopAll(); }
  function setVolumes(next={}){
    if(next.master!=null){ masterVolume=Number(next.master); localStorage.setItem('bc_audio_master',String(masterVolume)); }
    if(next.sfx!=null){ sfxVolume=Number(next.sfx); localStorage.setItem('bc_audio_sfx',String(sfxVolume)); }
    if(next.music!=null){ musicVolume=Number(next.music); localStorage.setItem('bc_audio_music',String(musicVolume)); }
    if(next.ambience!=null){ ambienceVolume=Number(next.ambience); localStorage.setItem('bc_audio_ambience',String(ambienceVolume)); }
    if(currentMusic) currentMusic.volume=volumeFor('music',entry('music',currentMusicId)||{});
    if(currentAmbience) currentAmbience.volume=volumeFor('ambience',entry('ambience',currentAmbienceId)||{});
  }

  const api={manifest,unlock,playSfx,playMusic,stopMusic,playAmbience,stopAmbience,stopAll,playZoneAmbience,ensureZoneAmbience,playBossMusic,setMuted,setVolumes,isUnlocked:()=>unlocked,isMuted:()=>muted};
  const events={
    stopAll,
    enterZone:playZoneAmbience,
    ensureZoneAmbience,
    startBoss:playBossMusic,
    endBoss:function(zone){ stopMusic(); if(zone===1||zone===2||zone===3) playZoneAmbience(zone); },
    playerAttack:()=>playSfx('player.attack'),
    playerHit:()=>playSfx('player.hit'),
    playerDodge:()=>playSfx('player.dodge'),
    playerShield:()=>playSfx('player.shield'),
    playerDeath:()=>playSfx('player.death'),
    enemyHit:()=>playSfx('enemy.hit'),
    skeletonSpawn:()=>playSfx('skeleton.spawn'),
    skeletonAttack:()=>playSfx('skeleton.attack'),
    skeletonDeath:()=>playSfx('skeleton.death'),
    wizardAttack:()=>playSfx('wizard.attack'),
    dragonSpawn:function(zone){ playBossMusic(zone); playSfx('dragon.roar'); },
    dragonRoar:()=>playSfx('dragon.roar'),
    dragonFireblast:()=>playSfx('dragon.fireblast'),
    dragonHit:()=>playSfx('dragon.hit'),
    dragonDeath:()=>playSfx('dragon.death'),
    corruptedSpawn:function(){ playBossMusic(3); playSfx('corrupted.screech'); },
    corruptedAttack:()=>playSfx('corrupted.attack'),
    corruptedHit:()=>playSfx('corrupted.hit'),
    corruptedScreech:()=>playSfx('corrupted.screech'),
    corruptedDeath:()=>playSfx('corrupted.death'),
    chestOpen:()=>playSfx('item.chest'),
    keyPickup:()=>playSfx('item.key'),
    doorUnlock:()=>playSfx('door.unlock')
  };

  ['pointerdown','keydown','touchstart','mousedown'].forEach(type=>{
    window.addEventListener(type, unlock, {once:true, passive:true});
  });

  window.BoneCrawlerAudio=api;
  window.AudioEvents=events;
})();
