// items-runtime
// Purpose: Authoritative runtime owner for chests, heart drops, potion drops, and key drops.
(function(){
  'use strict';

  function ensureChestState(){
    if(typeof chests === 'undefined' || !Array.isArray(chests)) chests = [];
    const activeZone = (typeof currentZone !== 'undefined' && currentZone != null) ? Number(currentZone) : null;
    for(let i=chests.length-1;i>=0;i--){
      const item = chests[i];
      const keep = !!item && (
        activeZone == null ||
        !Number.isFinite(activeZone) ||
        item.zone == null ||
        Number(item.zone) === activeZone
      );
      if(!keep) chests.splice(i, 1);
    }
    chest = chests.length ? chests[0] : null;
    return chests;
  }

  function ensureHeartDrops(){
    if(typeof heartDrops === 'undefined' || !Array.isArray(heartDrops)) heartDrops = [];
    return heartDrops;
  }

  function ensurePotionDrops(){
    if(typeof potionDrops === 'undefined' || !Array.isArray(potionDrops)) potionDrops = [];
    return potionDrops;
  }

  function hasOwnedKeyKind(kind){
    try{
      if(typeof player === 'undefined' || !player) return false;
      if(kind === 'zone1Door') return !!player.zone1DoorKey;
      if(kind === 'secret1') return !!player.secret1Key;
      if(kind === 'zone2') return !!player.zone2Key;
      if(kind === 'zone3') return !!player.hasKey;
    }catch(err){}
    return false;
  }

  function ensureKeyDrops(){
    if(typeof keyDrop === 'undefined' || keyDrop == null) keyDrop = [];
    if(!Array.isArray(keyDrop)) keyDrop = [keyDrop];
    const activeZone = (typeof currentZone !== 'undefined' && currentZone != null) ? Number(currentZone) : null;
    const seenKinds = Object.create(null);
    keyDrop = keyDrop.filter(item => {
      if(!item) return false;
      if(activeZone != null && Number.isFinite(activeZone) && item.zone != null && Number(item.zone) !== activeZone) return false;
      if(item.kind && hasOwnedKeyKind(item.kind)) return false;
      if(item.kind && seenKinds[item.kind]) return false;
      if(item.kind) seenKinds[item.kind] = true;
      return true;
    });
    return keyDrop;
  }

  function clampToArena(x, y, w, h, pad=2){
    const minX = PX + pad;
    const minY = PY + pad;
    const maxX = PX + PW - w - pad;
    const maxY = PY + PH - h - pad;
    return {
      x: Math.max(minX, Math.min(maxX, Math.round(x))),
      y: Math.max(minY, Math.min(maxY, Math.round(y)))
    };
  }

  function canPlaceGroundItem(x, y, w, h){
    if(typeof collidesZoneObstacles === 'function' && collidesZoneObstacles(x, y, w, h)) return false;
    for(const existing of ensureChestState()){
      if(existing && ov({x,y,w,h}, {x:existing.x,y:existing.y,w:existing.w,h:existing.h})) return false;
    }
    return true;
  }

  function findNearestWalkableGroundPosition(x, y, w, h, options={}){
    const origin = clampToArena(x, y, w, h, options.pad ?? 2);
    if(canPlaceGroundItem(origin.x, origin.y, w, h)) return origin;
    const step = Math.max(2, Number(options.step) || 4);
    const maxRadius = Math.max(step, Number(options.maxRadius) || 36);
    for(let r=step; r<=maxRadius; r+=step){
      const points = [
        [origin.x + r, origin.y], [origin.x - r, origin.y], [origin.x, origin.y + r], [origin.x, origin.y - r],
        [origin.x + r, origin.y + r], [origin.x - r, origin.y + r], [origin.x + r, origin.y - r], [origin.x - r, origin.y - r],
        [origin.x + r, origin.y + r/2], [origin.x - r, origin.y + r/2], [origin.x + r, origin.y - r/2], [origin.x - r, origin.y - r/2],
        [origin.x + r/2, origin.y + r], [origin.x - r/2, origin.y + r], [origin.x + r/2, origin.y - r], [origin.x - r/2, origin.y - r],
      ];
      for(const [px, py] of points){
        const spot = clampToArena(px, py, w, h, options.pad ?? 2);
        if(canPlaceGroundItem(spot.x, spot.y, w, h)) return spot;
      }
    }
    return origin;
  }

  function getChestList(){
    return ensureChestState();
  }

  function syncChestRef(){
    return ensureChestState();
  }

  function clearChests(){
    chests = [];
    chest = null;
    return chests;
  }

  function removeChestAt(index){
    const list = ensureChestState();
    if(index >= 0 && index < list.length) list.splice(index, 1);
    return syncChestRef();
  }

  function spawnChest(opts={}){
    const list = ensureChestState();
    const maxActive = Math.max(1, Number(opts.maxActive ?? 2) || 2);
    const baseX = Number.isFinite(opts.x) ? Number(opts.x) : (PX + 14 + Math.random() * Math.max(8, PW - 36));
    const baseY = Number.isFinite(opts.y) ? Number(opts.y) : (PY + 14 + Math.random() * Math.max(8, PH - 36));
    const pos = findNearestWalkableGroundPosition(baseX, baseY, 8, 8, { maxRadius: 48, step: 4, pad: 2 });
    while(list.length >= maxActive) list.shift();
    list.push({ x: pos.x, y: pos.y, w:8, h:8, zone: currentZone });
    return syncChestRef();
  }

  function spawnHeartDrop(x,y,kind='full'){
    const list = ensureHeartDrops();
    const pos = findNearestWalkableGroundPosition(x, y, 7, 7, { maxRadius: 40, step: 4, pad: 2 });
    list.push({
      x:pos.x,y:pos.y,w:7,h:7,
      zone:currentZone,
      kind,
      ttl:ITEM_TTL_FRAMES,
      maxTtl:ITEM_TTL_FRAMES,
      fadeFrames:ITEM_FADE_FRAMES,
      bobSeed:Math.random()*Math.PI*2,
    });
    return list;
  }

  function spawnHalfHeartDrop(x,y){ return spawnHeartDrop(x,y,'half'); }

  function releaseHeartDropAt(index){
    const list = ensureHeartDrops();
    if(index>=0 && index<list.length) return list.splice(index,1)[0] || null;
    return null;
  }

  function clearHeartDrops(){
    heartDrops=[];
    return heartDrops;
  }

  function spawnPotionDrop(x,y){
    const list = ensurePotionDrops();
    const pos = findNearestWalkableGroundPosition(x, y, 7, 7, { maxRadius: 40, step: 4, pad: 2 });
    list.push({
      x:pos.x,y:pos.y,w:7,h:7,
      zone:currentZone,
      ttl:POTION_ITEM_TTL_FRAMES,
      maxTtl:POTION_ITEM_TTL_FRAMES,
      fadeFrames:POTION_ITEM_FADE_FRAMES,
      bobSeed:Math.random()*Math.PI*2,
    });
    return list;
  }

  function releasePotionDropAt(index){
    const list = ensurePotionDrops();
    if(index>=0 && index<list.length) return list.splice(index,1)[0] || null;
    return null;
  }

  function clearPotionDrops(){
    potionDrops=[];
    return potionDrops;
  }

  function getGroundItemAlpha(item){
    if(!item || typeof item.ttl!=='number') return 1;
    const fadeFrames=item.fadeFrames||ITEM_FADE_FRAMES;
    if(item.ttl>fadeFrames) return 1;
    const t=Math.max(0, item.ttl/fadeFrames);
    const blink=item.ttl<90 ? (0.7+0.3*Math.sin(frame*0.55 + (item.bobSeed||0))) : 1;
    return Math.max(0, Math.min(1, t*t*blink));
  }

  function getKeyDropList(){
    return ensureKeyDrops();
  }

  function hasAnyKeyDrop(){
    return ensureKeyDrops().length>0;
  }

  function hasKeyDropKind(kind){
    return ensureKeyDrops().some(drop=>drop && drop.kind===kind);
  }

  function clearKeyDrops(){
    keyDrop=[];
    return keyDrop;
  }

  function removeKeyDropAt(index){
    const list=ensureKeyDrops();
    if(index>=0 && index<list.length) list.splice(index,1);
    keyDrop=list;
    return list;
  }

  function buildRuntimeKey(kind, x, y){
    const rect = {x:Math.round(x), y:Math.round(y), w:7, h:7};
    try{
      if(window.GameObjectFactory && typeof GameObjectFactory.create === 'function'){
        const entity = GameObjectFactory.create('key', { kind, rect });
        entity.x = rect.x;
        entity.y = rect.y;
        entity.w = rect.w;
        entity.h = rect.h;
        entity.zone = currentZone;
        entity.kind = kind;
        return entity;
      }
    }catch(err){}
    return {x:rect.x,y:rect.y,w:rect.w,h:rect.h,kind,zone:currentZone, type:'item', objectType:'item', itemType:'key', category:'item', group:'key'};
  }

  function spawnKeyDrop(x,y,kind='zone3'){
    const list=ensureKeyDrops();
    const pos = findNearestWalkableGroundPosition(x, y, 7, 7, { maxRadius: 48, step: 4, pad: 2 });
    list.push(buildRuntimeKey(kind, pos.x, pos.y));
    keyDrop=list;
    return list;
  }

  function clearGroundItemPools(){
    clearChests();
    clearHeartDrops();
    clearPotionDrops();
    clearKeyDrops();
    return true;
  }

  window.findNearestWalkableGroundPosition = findNearestWalkableGroundPosition;
  window.getChestList = getChestList;
  window.syncChestRef = syncChestRef;
  window.clearChests = clearChests;
  window.removeChestAt = removeChestAt;
  window.spawnChest = spawnChest;
  window.spawnHeartDrop = spawnHeartDrop;
  window.spawnHalfHeartDrop = spawnHalfHeartDrop;
  window.releaseHeartDropAt = releaseHeartDropAt;
  window.clearHeartDrops = clearHeartDrops;
  window.spawnPotionDrop = spawnPotionDrop;
  window.releasePotionDropAt = releasePotionDropAt;
  window.clearPotionDrops = clearPotionDrops;
  window.getGroundItemAlpha = getGroundItemAlpha;
  window.getKeyDropList = getKeyDropList;
  window.hasAnyKeyDrop = hasAnyKeyDrop;
  window.hasKeyDropKind = hasKeyDropKind;
  window.clearKeyDrops = clearKeyDrops;
  window.removeKeyDropAt = removeKeyDropAt;
  window.spawnKeyDrop = spawnKeyDrop;
  window.spawnRuntimeKeyObject = spawnKeyDrop;
  window.clearGroundItemPools = clearGroundItemPools;
})();
