// runtime-entity-manager
// Purpose: generic registry/view over transient runtime entities such as enemies, drops, and chests.
(function(){
  'use strict';
  if(window.RuntimeEntityManager) return;

  let nextRuntimeId = 1;
  let idMaps = {
    enemy: new WeakMap(),
    item: new WeakMap(),
    boss: new WeakMap()
  };

  function clone(value){
    try{ return JSON.parse(JSON.stringify(value)); }
    catch(err){ return value; }
  }
  function rect(x,y,w,h){ return {x:Number(x)||0,y:Number(y)||0,w:Number(w)||0,h:Number(h)||0}; }
  function deepMerge(base, patch){
    const out = clone(base) || {};
    if(!patch || typeof patch !== 'object') return out;
    Object.keys(patch).forEach(key => {
      const value = patch[key];
      if(value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) out[key] = deepMerge(out[key], value);
      else out[key] = clone(value);
    });
    return out;
  }
  function getStableId(prefix, bucket, obj){
    if(!obj || typeof obj !== 'object') return prefix + '.' + (nextRuntimeId++);
    let id = bucket.get(obj);
    if(!id){
      id = prefix + '.' + (nextRuntimeId++);
      bucket.set(obj, id);
    }
    return id;
  }
  function activeZone(){
    const value = Number(typeof currentZone !== 'undefined' ? currentZone : 0);
    return Number.isFinite(value) ? value : 0;
  }
  function zoneOf(source, fallback){
    const value = Number(source && source.zone != null ? source.zone : fallback);
    if(Number.isFinite(value) && value !== 0) return value;
    return activeZone();
  }
  function sanitizeRect(source, fallbackZone){
    if(!source) return null;
    const x = Number(source.x);
    const y = Number(source.y);
    const w = Number(source.w);
    const h = Number(source.h);
    if(!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return rect(x, y, Number.isFinite(w) ? w : 0, Number.isFinite(h) ? h : 0);
  }
  function labelForEnemy(enemy, boss){
    if(boss){
      if(enemy && enemy.bossId) return 'Boss · ' + String(enemy.bossId);
      if(enemy === window.dragonBoss) return 'Boss · Dragon';
      if(enemy === window.shadowBoss) return 'Boss · Shadow';
      return 'Boss';
    }
    const type = String((enemy && enemy.enemyType) || '').toLowerCase();
    if(type === 'wizardenemy1' || enemy.wizard) return 'Enemy · Wizard';
    if(type === 'giantenemy1' || enemy.giant) return 'Enemy · Giant Skeleton';
    if(type === 'normalenemy2') return 'Enemy · Skeleton (New)';
    if(type === 'normalenemy3') return 'Enemy · Skeleton (Classic)';
    return 'Enemy · Skeleton';
  }
  function dataForEnemy(enemy, zone, boss){
    return clone({
      runtimeType: boss ? 'boss' : 'enemy',
      zone,
      enemyType: enemy && enemy.enemyType ? enemy.enemyType : (boss ? 'boss' : 'normalEnemy1'),
      hp: enemy && enemy.hp != null ? enemy.hp : null,
      speed: enemy && enemy.speed != null ? enemy.speed : null,
      points: enemy && enemy.points != null ? enemy.points : null,
      giant: !!(enemy && enemy.giant),
      wizard: !!(enemy && enemy.wizard),
      dir: enemy && enemy.dir != null ? enemy.dir : null,
      bossId: enemy && enemy.bossId ? enemy.bossId : null,
      spawnSystem: enemy && enemy.spawnSystem ? enemy.spawnSystem : null
    });
  }
  function buildEnemyEntry(enemy, opts){
    if(!enemy) return null;
    const boss = !!(opts && opts.boss);
    const zone = zoneOf(enemy, activeZone());
    const bounds = sanitizeRect(enemy, zone);
    if(!bounds) return null;
    const id = getStableId(boss ? 'runtime.boss' : 'runtime.enemy', boss ? idMaps.boss : idMaps.enemy, enemy);
    return {
      id,
      zone,
      category: 'enemy',
      label: labelForEnemy(enemy, boss),
      rect: bounds,
      meta: {
        transient: true,
        runtimeEntity: true,
        rectMode: 'runtimeRect',
        rectModeLabel: boss ? 'Runtime Boss Bounds' : 'Runtime Enemy Bounds',
        kind: boss ? 'boss' : 'enemy',
        sourceType: boss ? 'boss' : 'enemy'
      },
      data: dataForEnemy(enemy, zone, boss),
      sourceRef: enemy
    };
  }
  function labelForItem(kind, item){
    if(kind === 'chest') return 'Item · Chest';
    if(kind === 'potion') return 'Item · Potion';
    if(kind === 'key') return 'Item · Key (' + String(item && item.kind || 'key') + ')';
    if(kind === 'heart') return item && item.kind === 'half' ? 'Item · Half Heart' : 'Item · Full Heart';
    return 'Item';
  }
  function dataForItem(kind, item, zone){
    return clone({
      runtimeType: kind,
      zone,
      kind: item && item.kind != null ? item.kind : kind,
      ttl: item && item.ttl != null ? item.ttl : null,
      fadeFrames: item && item.fadeFrames != null ? item.fadeFrames : null,
      bobSeed: item && item.bobSeed != null ? item.bobSeed : null
    });
  }
  function buildItemEntry(kind, item){
    if(!item) return null;
    const zone = zoneOf(item, activeZone());
    const bounds = sanitizeRect(item, zone);
    if(!bounds) return null;
    const id = getStableId('runtime.item', idMaps.item, item);
    return {
      id,
      zone,
      category: 'item',
      label: labelForItem(kind, item),
      rect: bounds,
      meta: {
        transient: true,
        runtimeEntity: true,
        rectMode: 'runtimeRect',
        rectModeLabel: 'Runtime Item Bounds',
        kind,
        sourceType: kind
      },
      data: dataForItem(kind, item, zone),
      sourceRef: item
    };
  }
  function collectEnemies(zone, out){
    if(typeof enemies !== 'undefined' && Array.isArray(enemies)){
      enemies.forEach(enemy => {
        const entry = buildEnemyEntry(enemy, {boss:false});
        if(entry && (zone == null || Number(entry.zone) === Number(zone))) out.push(entry);
      });
    }
    if(typeof dragonBoss !== 'undefined' && dragonBoss){
      const entry = buildEnemyEntry(dragonBoss, {boss:true});
      if(entry && (zone == null || Number(entry.zone) === Number(zone))) out.push(entry);
    }
    if(typeof shadowBoss !== 'undefined' && shadowBoss){
      const entry = buildEnemyEntry(shadowBoss, {boss:true});
      if(entry && (zone == null || Number(entry.zone) === Number(zone))) out.push(entry);
    }
  }
  function collectItems(zone, out){
    const pushIfZone = (entry) => {
      if(entry && (zone == null || Number(entry.zone) === Number(zone))) out.push(entry);
    };
    if(typeof heartDrops !== 'undefined' && Array.isArray(heartDrops)) heartDrops.forEach(item => pushIfZone(buildItemEntry('heart', item)));
    if(typeof potionDrops !== 'undefined' && Array.isArray(potionDrops)) potionDrops.forEach(item => pushIfZone(buildItemEntry('potion', item)));
    try{
      const chestList = typeof getChestList === 'function' ? getChestList() : ((typeof chests !== 'undefined' && Array.isArray(chests)) ? chests : []);
      if(Array.isArray(chestList)) chestList.forEach(item => pushIfZone(buildItemEntry('chest', item)));
    }catch(err){}
    try{
      const drops = typeof getKeyDropList === 'function' ? getKeyDropList() : ((typeof keyDrop !== 'undefined' && Array.isArray(keyDrop)) ? keyDrop : []);
      if(Array.isArray(drops)) drops.forEach(item => pushIfZone(buildItemEntry('key', item)));
    }catch(err){}
  }
  function getEditorEntities(zone){
    const out = [];
    collectEnemies(zone, out);
    collectItems(zone, out);
    return out;
  }
  function getEntitiesByZone(){
    const out = {};
    getEditorEntities(null).forEach(entry => {
      const key = String(entry.zone);
      if(!out[key]) out[key] = [];
      out[key].push(entry);
    });
    return out;
  }
  function resolveSourceRef(id){
    const all = getEditorEntities(null);
    for(let i=0;i<all.length;i++){
      if(all[i].id === id) return all[i].sourceRef || null;
    }
    return null;
  }
  function patchEntityData(id, patch, mode){
    const source = resolveSourceRef(id);
    if(!source || typeof source !== 'object') return false;
    if(mode === 'replace'){
      const keepRect = { x: source.x, y: source.y, w: source.w, h: source.h, zone: source.zone };
      Object.keys(source).forEach(key => { delete source[key]; });
      Object.assign(source, keepRect, clone(patch || {}));
      return true;
    }
    const next = deepMerge(source, patch || {});
    Object.keys(next).forEach(key => { source[key] = next[key]; });
    return true;
  }
  function clear(){
    idMaps = { enemy:new WeakMap(), item:new WeakMap(), boss:new WeakMap() };
    nextRuntimeId = 1;
  }

  window.RuntimeEntityManager = {
    rect,
    clone,
    getEditorEntities,
    getEntitiesByZone,
    resolveSourceRef,
    patchEntityData,
    clear
  };
})();
