// BoneCrawler safe split module
// Purpose: Chest, heart, potion, key drop creation and item alpha/fade helper.
// Source: app.js lines 2391-2431
// Migration note: loaded as a classic script, not ES module, so existing top-level bindings remain shared.

function spawnChest(){
  const x=(PX+14+Math.random()*(PW-36))|0;
  const y=(PY+14+Math.random()*(PH-36))|0;
  chest={x,y,w:8,h:8};
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
