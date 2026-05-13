// object-spawn-engine
// Purpose: generic spawn dispatcher for content-driven events.
(function(){
  'use strict';
  if(window.ObjectSpawnEngine) return;

  function readPayloadNumber(def, key, payload, fallback){
    const value = def && def[key];
    const offset = Number((def && def[key + 'Offset']) || 0) || 0;
    if(typeof value === 'number') return value + offset;
    if(typeof value === 'string' && payload && typeof payload[value] === 'number') return payload[value] + offset;
    if(payload && typeof payload[key] === 'number') return payload[key] + offset;
    return (Number(fallback) || 0) + offset;
  }

  function spawnKey(def, payload){
    const kind = (def && (def.kind || def.objectId || def.id)) || 'zone3';
    const x = readPayloadNumber(def, 'x', payload, 0);
    const y = readPayloadNumber(def, 'y', payload, 0);
    try{
      if(typeof spawnKeyDrop === 'function'){
        spawnKeyDrop(Math.round(x), Math.round(y), kind);
        return true;
      }
    }catch(err){}
    return false;
  }

  function spawnItem(def, payload){
    const itemType = String((def && (def.itemType || def.type)) || '').toLowerCase();
    const x = readPayloadNumber(def, 'x', payload, 0);
    const y = readPayloadNumber(def, 'y', payload, 0);
    try{
      if(itemType === 'key') return spawnKey(def, payload);
      if(itemType === 'heart' && typeof spawnHeartDrop === 'function'){ spawnHeartDrop(Math.round(x), Math.round(y), def.kind || 'full'); return true; }
      if(itemType === 'halfheart' && typeof spawnHalfHeartDrop === 'function'){ spawnHalfHeartDrop(Math.round(x), Math.round(y)); return true; }
      if(itemType === 'potion' && typeof spawnPotionDrop === 'function'){ spawnPotionDrop(Math.round(x), Math.round(y)); return true; }
      if(itemType === 'chest' && typeof spawnChest === 'function'){ spawnChest(def || {}); return true; }
    }catch(err){}
    return false;
  }

  function spawnBoss(def){
    const id = String((def && (def.objectId || def.id || def.bossId)) || '').toLowerCase();
    try{
      if(id === 'zone1dragon' || id === 'zonedragon' || id === 'dragonboss' || id === 'dragon'){
        if(typeof spawnDragonBoss === 'function' && typeof dragonBoss !== 'undefined' && !dragonBoss) return spawnDragonBoss() !== false;
      }
      if(id === 'shadowboss' || id === 'corrupted' || id === 'zone3shadow'){
        if(typeof spawnShadowBoss === 'function' && typeof shadowBoss !== 'undefined' && !shadowBoss) return spawnShadowBoss() !== false;
      }
    }catch(err){}
    return false;
  }

  function spawnEnemy(def){
    const enemy = (def && (def.enemy || def.enemyType || def.objectId || def.id)) || 'normalEnemy1';
    try{
      if(window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.spawnAtPoint === 'function'){
        return BoneCrawlerZoneSpawn.spawnAtPoint(Object.assign({}, def || {}, {enemy}));
      }
      if(typeof doSpawn === 'function'){
        doSpawn(enemy === 'giantEnemy1', enemy === 'wizardEnemy1', enemy);
        return true;
      }
    }catch(err){}
    return false;
  }

  function spawnNpc(def){ return !!def; }

  function spawn(def, payload){
    if(!def || typeof def !== 'object') return false;
    const type = String(def.objectType || def.type || '').toLowerCase();
    if(type === 'item' || type === 'key' || type === 'heart' || type === 'potion' || type === 'chest') return spawnItem(def, payload || {});
    if(type === 'boss') return spawnBoss(def, payload || {});
    if(type === 'enemy') return spawnEnemy(def, payload || {});
    if(type === 'npc') return spawnNpc(def, payload || {});
    return false;
  }

  window.ObjectSpawnEngine = {spawn, spawnItem, spawnKey, spawnBoss, spawnEnemy, spawnNpc};
})();
