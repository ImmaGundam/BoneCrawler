// object-pools
// Purpose: Reusable recycle()/reuse() pools for high-churn transient runtime objects.
(function(){
  'use strict';
  const runtimeApi = window.GameRuntimeApi || null;
  if((runtimeApi && runtimeApi.lookup('pools', ['BoneCrawlerPools'])) || window.BoneCrawlerPools) return;

  function buildPool(name, create, reuse, recycle, prewarm){
    const free = [];
    function acquire(props){
      const item = free.length ? free.pop() : create();
      item.__bcPoolName = name;
      item.__bcActive = true;
      reuse(item, props || {});
      return item;
    }
    function release(item){
      if(!item || item.__bcPoolName !== name || item.__bcActive === false) return;
      item.__bcActive = false;
      recycle(item);
      free.push(item);
    }
    for(let i=0;i<(prewarm||0);i++) free.push(create());
    return {
      name,
      acquire,
      release,
      size(){ return free.length; }
    };
  }

  function assignTextFields(target, props){
    target.x = Number(props.x) || 0;
    target.y = Number(props.y) || 0;
    target.text = props.text != null ? String(props.text) : '';
    target.life = Number(props.life) || 0;
    target.max = Number(props.max) || target.life || 0;
    target.col = props.col || '#fff';
    return target;
  }

  const pools = {
    part: buildPool(
      'part',
      function(){ return {__bcPoolName:'part', __bcActive:false, x:0, y:0, vx:0, vy:0, life:0, max:0, col:'#fff'}; },
      function(item, props){
        item.x = Number(props.x) || 0;
        item.y = Number(props.y) || 0;
        item.vx = Number(props.vx) || 0;
        item.vy = Number(props.vy) || 0;
        item.life = Number(props.life) || 0;
        item.max = Number(props.max) || item.life || 0;
        item.col = props.col || '#fff';
      },
      function(item){
        item.x = 0; item.y = 0; item.vx = 0; item.vy = 0;
        item.life = 0; item.max = 0; item.col = '#fff';
      },
      96
    ),
    floatText: buildPool(
      'floatText',
      function(){ return {__bcPoolName:'floatText', __bcActive:false, x:0, y:0, text:'', life:0, max:0, col:'#fff'}; },
      assignTextFields,
      function(item){
        item.x = 0; item.y = 0; item.text = ''; item.life = 0; item.max = 0; item.col = '#fff';
      },
      40
    ),
    fireball: buildPool(
      'fireball',
      function(){ return {__bcPoolName:'fireball', __bcActive:false, x:0, y:0, vx:0, vy:0, life:0, maxLife:0, dragon:false, owner:null, friendly:false}; },
      function(item, props){
        item.x = Number(props.x) || 0;
        item.y = Number(props.y) || 0;
        item.vx = Number(props.vx) || 0;
        item.vy = Number(props.vy) || 0;
        item.life = Number(props.life) || 0;
        item.maxLife = Number(props.maxLife) || item.life || 0;
        item.dragon = !!props.dragon;
        item.owner = props.owner != null ? props.owner : null;
        item.friendly = !!props.friendly;
      },
      function(item){
        item.x = 0; item.y = 0; item.vx = 0; item.vy = 0;
        item.life = 0; item.maxLife = 0; item.dragon = false; item.owner = null; item.friendly = false;
      },
      20
    ),
    shockwave: buildPool(
      'shockwave',
      function(){ return {__bcPoolName:'shockwave', __bcActive:false, x:0, y:0, r:0, maxR:0, life:0, maxLife:0}; },
      function(item, props){
        item.x = Number(props.x) || 0;
        item.y = Number(props.y) || 0;
        item.r = Number(props.r) || 0;
        item.maxR = Number(props.maxR) || 0;
        item.life = Number(props.life) || 0;
        item.maxLife = Number(props.maxLife) || item.life || 0;
      },
      function(item){
        item.x = 0; item.y = 0; item.r = 0; item.maxR = 0; item.life = 0; item.maxLife = 0;
      },
      16
    ),
    dragonFlame: buildPool(
      'dragonFlame',
      function(){ return {__bcPoolName:'dragonFlame', __bcActive:false, x:0, y:0, w:0, h:0, ttl:0, maxTtl:0, owner:null}; },
      function(item, props){
        item.x = Number(props.x) || 0;
        item.y = Number(props.y) || 0;
        item.w = Number(props.w) || 0;
        item.h = Number(props.h) || 0;
        item.ttl = Number(props.ttl) || 0;
        item.maxTtl = Number(props.maxTtl) || item.ttl || 0;
        item.owner = props.owner != null ? props.owner : null;
      },
      function(item){
        item.x = 0; item.y = 0; item.w = 0; item.h = 0; item.ttl = 0; item.maxTtl = 0; item.owner = null;
      },
      12
    ),
    shadowWave: buildPool(
      'shadowWave',
      function(){ return {__bcPoolName:'shadowWave', __bcActive:false, x:0, y:0, r:0, maxR:0, life:0, maxLife:0}; },
      function(item, props){
        item.x = Number(props.x) || 0;
        item.y = Number(props.y) || 0;
        item.r = Number(props.r) || 0;
        item.maxR = Number(props.maxR) || 0;
        item.life = Number(props.life) || 0;
        item.maxLife = Number(props.maxLife) || item.life || 0;
      },
      function(item){
        item.x = 0; item.y = 0; item.r = 0; item.maxR = 0; item.life = 0; item.maxLife = 0;
      },
      12
    )
  };

  function ensureList(list){
    return Array.isArray(list) ? list : [];
  }
  function spawnToList(list, pool, props){
    const target = ensureList(list);
    const item = pool.acquire(props);
    target.push(item);
    return item;
  }
  function releaseAt(list, index, pool){
    if(!Array.isArray(list) || index < 0 || index >= list.length) return null;
    const item = list[index];
    pool.release(item);
    list.splice(index, 1);
    return item;
  }
  function clearList(list, pool){
    if(!Array.isArray(list) || !list.length) return list;
    for(let i=list.length-1;i>=0;i--) pool.release(list[i]);
    list.length = 0;
    return list;
  }
  function clearMatching(list, predicate, pool){
    if(!Array.isArray(list) || !list.length) return list;
    for(let i=list.length-1;i>=0;i--){
      const item = list[i];
      if(predicate(item, i)) releaseAt(list, i, pool);
    }
    return list;
  }

  const api = {
    pools,
    spawnPart(props){ parts = ensureList(typeof parts !== 'undefined' ? parts : []); return spawnToList(parts, pools.part, props); },
    spawnFloatText(props){ floatTexts = ensureList(typeof floatTexts !== 'undefined' ? floatTexts : []); return spawnToList(floatTexts, pools.floatText, props); },
    spawnFireball(props){ fireballs = ensureList(typeof fireballs !== 'undefined' ? fireballs : []); return spawnToList(fireballs, pools.fireball, props); },
    spawnShockwave(props){ shockwaves = ensureList(typeof shockwaves !== 'undefined' ? shockwaves : []); return spawnToList(shockwaves, pools.shockwave, props); },
    spawnDragonFlame(props){ dragonFlames = ensureList(typeof dragonFlames !== 'undefined' ? dragonFlames : []); return spawnToList(dragonFlames, pools.dragonFlame, props); },
    spawnShadowWave(props){ shadowWaves = ensureList(typeof shadowWaves !== 'undefined' ? shadowWaves : []); return spawnToList(shadowWaves, pools.shadowWave, props); },

    releasePartAt(list, index){ return releaseAt(list, index, pools.part); },
    releaseFloatTextAt(list, index){ return releaseAt(list, index, pools.floatText); },
    releaseFireballAt(list, index){ return releaseAt(list, index, pools.fireball); },
    releaseShockwaveAt(list, index){ return releaseAt(list, index, pools.shockwave); },
    releaseDragonFlameAt(list, index){ return releaseAt(list, index, pools.dragonFlame); },
    releaseShadowWaveAt(list, index){ return releaseAt(list, index, pools.shadowWave); },

    clearParts(){ if(typeof parts !== 'undefined') clearList(parts, pools.part); return parts; },
    clearFloatTexts(){ if(typeof floatTexts !== 'undefined') clearList(floatTexts, pools.floatText); return floatTexts; },
    clearFireballs(){ if(typeof fireballs !== 'undefined') clearList(fireballs, pools.fireball); return fireballs; },
    clearShockwaves(){ if(typeof shockwaves !== 'undefined') clearList(shockwaves, pools.shockwave); return shockwaves; },
    clearDragonFlames(){ if(typeof dragonFlames !== 'undefined') clearList(dragonFlames, pools.dragonFlame); return dragonFlames; },
    clearShadowWaves(){ if(typeof shadowWaves !== 'undefined') clearList(shadowWaves, pools.shadowWave); return shadowWaves; },

    clearFireballsMatching(predicate){ if(typeof fireballs !== 'undefined') clearMatching(fireballs, predicate, pools.fireball); return fireballs; },
    clearDragonFlamesMatching(predicate){ if(typeof dragonFlames !== 'undefined') clearMatching(dragonFlames, predicate, pools.dragonFlame); return dragonFlames; },

    clearTransientEffectPools(){
      if(typeof parts !== 'undefined') clearList(parts, pools.part);
      if(typeof fireballs !== 'undefined') clearList(fireballs, pools.fireball);
      if(typeof shockwaves !== 'undefined') clearList(shockwaves, pools.shockwave);
      if(typeof dragonFlames !== 'undefined') clearList(dragonFlames, pools.dragonFlame);
      if(typeof shadowWaves !== 'undefined') clearList(shadowWaves, pools.shadowWave);
      return true;
    },

    stats(){
      return {
        part:pools.part.size(),
        floatText:pools.floatText.size(),
        fireball:pools.fireball.size(),
        shockwave:pools.shockwave.size(),
        dragonFlame:pools.dragonFlame.size(),
        shadowWave:pools.shadowWave.size()
      };
    }
  };

  if(runtimeApi && typeof runtimeApi.register === 'function') runtimeApi.register('pools', api, { legacy: ['BoneCrawlerPools'] });
  else window.BoneCrawlerPools = api;
})();

function __poolRuntime(){
  return (window.GameRuntimeApi && window.GameRuntimeApi.lookup('pools', ['BoneCrawlerPools'])) || window.BoneCrawlerPools;
}

function spawnPart(props){ return __poolRuntime().spawnPart(props); }
function spawnFloatText(props){ return __poolRuntime().spawnFloatText(props); }
function spawnFireball(props){ return __poolRuntime().spawnFireball(props); }
function spawnShockwave(props){ return __poolRuntime().spawnShockwave(props); }
function spawnDragonFlame(props){ return __poolRuntime().spawnDragonFlame(props); }
function spawnShadowWave(props){ return __poolRuntime().spawnShadowWave(props); }

function releasePartAt(list,index){ return __poolRuntime().releasePartAt(list,index); }
function releaseFloatTextAt(list,index){ return __poolRuntime().releaseFloatTextAt(list,index); }
function releaseFireballAt(list,index){ return __poolRuntime().releaseFireballAt(list,index); }
function releaseShockwaveAt(list,index){ return __poolRuntime().releaseShockwaveAt(list,index); }
function releaseDragonFlameAt(list,index){ return __poolRuntime().releaseDragonFlameAt(list,index); }
function releaseShadowWaveAt(list,index){ return __poolRuntime().releaseShadowWaveAt(list,index); }

function clearFloatTexts(){ return __poolRuntime().clearFloatTexts(); }
function clearTransientEffectPools(){ return __poolRuntime().clearTransientEffectPools(); }
function clearFireballsMatching(predicate){ return __poolRuntime().clearFireballsMatching(predicate); }
function clearDragonFlames(){ return __poolRuntime().clearDragonFlames(); }
function clearDragonFlamesMatching(predicate){ return __poolRuntime().clearDragonFlamesMatching(predicate); }
function clearShadowWaves(){ return __poolRuntime().clearShadowWaves(); }
