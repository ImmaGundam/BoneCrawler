// items
// Purpose: Chest, heart, potion, key drop creation and item alpha/fade helper.
function getChestList(){
  if(typeof chests === 'undefined' || !Array.isArray(chests)) chests=[];

  // Legacy compatibility: only migrate the old single chest reference
  // when the new chest list is empty. Do not re-add a chest that was
  // just removed from chests[], or pickup collision will loop forever.
  if(chest && chests.length===0) chests.push(chest);

  chests=chests.filter(Boolean);
  chest=chests.length ? chests[0] : null;
  return chests;
}

function syncChestRef(){
  if(typeof chests === 'undefined' || !Array.isArray(chests)) chests=[];
  chests=chests.filter(Boolean);
  chest=chests.length ? chests[0] : null;
  return chests;
}

function clearChests(){
  chests=[];
  chest=null;
}

function removeChestAt(index){
  const list=getChestList();
  if(index>=0 && index<list.length){
    const removed=list.splice(index,1)[0];
    if(chest===removed) chest=null;
  }
  syncChestRef();
}

function spawnChest(opts={}){
  const maxActive=Math.max(1, Number(opts.maxActive ?? 2) || 2);
  const list=getChestList();
  const x=(PX+14+Math.random()*(PW-36))|0;
  const y=(PY+14+Math.random()*(PH-36))|0;
  while(list.length >= maxActive) list.shift();
  list.push({x,y,w:8,h:8});
  syncChestRef();
}

function spawnHeartDrop(x,y,kind='full'){
  heartDrops.push({
    x:(x|0),y:(y|0),w:7,h:7,
    kind,
    ttl:ITEM_TTL_FRAMES,
    maxTtl:ITEM_TTL_FRAMES,
    fadeFrames:ITEM_FADE_FRAMES,
    bobSeed:Math.random()*Math.PI*2,
  });
}
function spawnHalfHeartDrop(x,y){
  spawnHeartDrop(x,y,'half');
}
function spawnPotionDrop(x,y){
  potionDrops.push({
    x:(x|0),y:(y|0),w:7,h:7,
    ttl:POTION_ITEM_TTL_FRAMES,
    maxTtl:POTION_ITEM_TTL_FRAMES,
    fadeFrames:POTION_ITEM_FADE_FRAMES,
    bobSeed:Math.random()*Math.PI*2,
  });
}
function getGroundItemAlpha(item){
  if(!item || typeof item.ttl!=='number') return 1;
  const fadeFrames=item.fadeFrames||ITEM_FADE_FRAMES;
  if(item.ttl>fadeFrames) return 1;
  const t=Math.max(0, item.ttl/fadeFrames);
  const blink=item.ttl<90 ? (0.7+0.3*Math.sin(frame*0.55 + (item.bobSeed||0))) : 1;
  return Math.max(0, Math.min(1, t*t*blink));
}
function spawnKeyDrop(x,y,kind='zone3'){
  const list=getKeyDropList();
  list.push({x:(x|0),y:(y|0),w:7,h:7,kind});
  keyDrop=list;
}
