// zone-object-definitions
// Purpose: editor/runtime object records for breakables, lights, and map-owned objects that should not live in combat/render code.
(function(){
  if(window.BoneCrawlerZoneObjects) return;

  function rect(x,y,w,h){ return {x,y,w,h}; }
  function cloneRect(r){ return r ? {x:r.x,y:r.y,w:r.w,h:r.h} : null; }
  function cloneObj(obj){
    if(!obj || typeof obj !== 'object') return obj;
    if(Array.isArray(obj)) return obj.map(cloneObj);
    const out={};
    for(const k in obj) out[k]=cloneObj(obj[k]);
    return out;
  }

  function floorLantern(id, zone, lx, ly, opts={}){
    return {
      id,
      zone,
      type:'breakable',
      objectType:'prop',
      group:'breakable',
      kind:'lantern',
      breakRect: rect(lx-2, ly-3, 12, 12),
      blockRect: rect(lx+1, ly+1, 4, 5),
      render:{sprite:'floorLantern', x:lx, y:ly, layer:opts.layer || 'lights'},
      broken:{sprite:'smallFlame', x:lx+2, y:ly+2, layer:opts.layer || 'lights'},
      breakEffect:'lanternFlame',
      dropsHalfHeart:false,
      label: opts.label || 'Breakable Lantern'
    };
  }

  const zones={
    2:{
      breakables:[
        {id:'zone2.bookshelf0',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(GW/2-14,PY+7,6,17),blockRect:rect(GW/2-14,PY+18,6,6),render:{sprite:'bookshelf',x:GW/2-14,y:PY+7,variant:0,layer:'back',overlayRect:rect(GW/2-14,PY+12,6,12)},broken:{sprite:'rubble',x:GW/2-11,y:PY+23,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Bookshelf 1'},
        {id:'zone2.bookshelf1',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(GW/2-6,PY+7,6,17),blockRect:rect(GW/2-6,PY+18,6,6),render:{sprite:'bookshelf',x:GW/2-6,y:PY+7,variant:0,layer:'back',overlayRect:rect(GW/2-6,PY+12,6,12)},broken:{sprite:'rubble',x:GW/2-3,y:PY+23,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Bookshelf 2'},
        {id:'zone2.bookshelf2',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(GW/2+2,PY+7,6,17),blockRect:rect(GW/2+2,PY+18,6,6),render:{sprite:'bookshelf',x:GW/2+2,y:PY+7,variant:0,layer:'back',overlayRect:rect(GW/2+2,PY+12,6,12)},broken:{sprite:'rubble',x:GW/2+5,y:PY+23,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Bookshelf 3'},
        {id:'zone2.bookshelf3',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(GW/2+10,PY+7,6,17),blockRect:rect(GW/2+10,PY+18,6,6),render:{sprite:'bookshelf',x:GW/2+10,y:PY+7,variant:1,layer:'back',overlayRect:rect(GW/2+10,PY+12,6,12)},broken:{sprite:'rubble',x:GW/2+13,y:PY+23,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Bookshelf 4'},
        {id:'zone2.crate0',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'crate',breakRect:rect(PX+PW-30,PY+12,7,7),blockRect:rect(PX+PW-30,PY+12,7,7),render:{sprite:'crate',x:PX+PW-30,y:PY+12,variant:true,layer:'back'},broken:{sprite:'rubble',x:PX+PW-26,y:PY+19,variant:3},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Crate'},
        {id:'zone2.barrel0',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'barrel',breakRect:rect(PX+PW-22,PY+10,6,8),blockRect:rect(PX+PW-22,PY+10,6,8),render:{sprite:'barrel',x:PX+PW-22,y:PY+10,variant:2,layer:'back'},broken:{sprite:'rubble',x:PX+PW-19,y:PY+18,variant:3},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Barrel 1'},
        {id:'zone2.barrel1',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'barrel',breakRect:rect(PX+PW-14,PY+12,6,8),blockRect:rect(PX+PW-14,PY+12,6,8),render:{sprite:'barrel',x:PX+PW-14,y:PY+12,variant:1,layer:'back'},broken:{sprite:'rubble',x:PX+PW-11,y:PY+19,variant:3},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Barrel 2'},
        floorLantern('zone2.lantern0',2,GW/2-23,PY+23,{layer:'lights',label:'Zone 2 Lantern'}),
        {id:'zone2.bookshelf4',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(PX+6,PY+7,6,17),blockRect:rect(PX+6,PY+18,6,6),render:{sprite:'bookshelf',x:PX+6,y:PY+7,variant:0,layer:'late',overlayRect:rect(PX+6,PY+12,6,12)},broken:{sprite:'rubble',x:PX+9,y:PY+23,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Side Bookshelf 1'},
        {id:'zone2.bookshelf5',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(PX+14,PY+7,6,17),blockRect:rect(PX+14,PY+18,6,6),render:{sprite:'bookshelf',x:PX+14,y:PY+7,variant:0,layer:'late',overlayRect:rect(PX+14,PY+12,6,12)},broken:{sprite:'rubble',x:PX+17,y:PY+23,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Side Bookshelf 2'},
        {id:'zone2.bookshelf6',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(PX+PW-20,PY+7,6,17),blockRect:rect(PX+PW-20,PY+18,6,6),render:{sprite:'bookshelf',x:PX+PW-20,y:PY+7,variant:1,layer:'late',overlayRect:rect(PX+PW-20,PY+12,6,12)},broken:{sprite:'rubble',x:PX+PW-17,y:PY+23,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Side Bookshelf 3'},
        {id:'zone2.bookshelf7',zone:2,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(PX+PW-12,PY+7,6,17),blockRect:rect(PX+PW-12,PY+18,6,6),render:{sprite:'bookshelf',x:PX+PW-12,y:PY+7,variant:1,layer:'late',overlayRect:rect(PX+PW-12,PY+12,6,12)},broken:{sprite:'rubble',x:PX+PW-9,y:PY+23,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 2 Side Bookshelf 4'}
      ]
    },
    3:{
      breakables:[
        {id:'zone3.bookshelf0',zone:3,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(PX+2,PY+22,6,17),blockRect:rect(PX+2,PY+33,6,6),render:{sprite:'bookshelf',x:PX+2,y:PY+22,variant:0,layer:'main',overlayRect:rect(PX+2,PY+22,6,11)},broken:{sprite:'rubble',x:PX+5,y:PY+39,variant:0},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 3 Bookshelf 1'},
        {id:'zone3.bookshelf1',zone:3,type:'breakable',objectType:'prop',group:'breakable',kind:'bookshelf',breakRect:rect(PX+PW-8,PY+20,6,17),blockRect:rect(PX+PW-8,PY+31,6,6),render:{sprite:'bookshelf',x:PX+PW-8,y:PY+20,variant:1,layer:'main',overlayRect:rect(PX+PW-8,PY+20,6,11)},broken:{sprite:'rubble',x:PX+PW-5,y:PY+37,variant:1},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 3 Bookshelf 2'},
        {id:'zone3.table0',zone:3,type:'breakable',objectType:'prop',group:'breakable',kind:'table',breakRect:rect(GW/2-7,PY+35,15,13),blockRect:rect(GW/2-6,PY+41,12,8),render:{sprite:'roundTableSet',x:GW/2-4,y:PY+35,layer:'main',overlayRect:rect(GW/2-8,PY+35,16,7)},broken:{sprite:'rubble',x:GW/2,y:PY+48,variant:2},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 3 Table Set'},
        {id:'zone3.barrel0',zone:3,type:'breakable',objectType:'prop',group:'breakable',kind:'barrel',breakRect:rect(PX+PW-25,PY+PH-13,6,8),blockRect:rect(PX+PW-25,PY+PH-13,6,8),render:{sprite:'barrel',x:PX+PW-25,y:PY+PH-13,variant:1,layer:'bottom'},broken:{sprite:'rubble',x:PX+PW-22,y:PY+PH-6,variant:3},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 3 Barrel 1'},
        {id:'zone3.barrel1',zone:3,type:'breakable',objectType:'prop',group:'breakable',kind:'barrel',breakRect:rect(PX+PW-10,PY+PH-12,6,8),blockRect:rect(PX+PW-10,PY+PH-12,6,8),render:{sprite:'barrel',x:PX+PW-10,y:PY+PH-12,variant:2,layer:'bottom'},broken:{sprite:'rubble',x:PX+PW-7,y:PY+PH-5,variant:3},breakEffect:'wood',dropsHalfHeart:true,label:'Zone 3 Barrel 2'},
        floorLantern('zone3.lantern0',3,GW/2-24,PY+PH-15,{layer:'lights',label:'Zone 3 Lantern 1'}),
        floorLantern('zone3.lantern1',3,GW/2+16,PY+PH-17,{layer:'lights',label:'Zone 3 Lantern 2'}),
        floorLantern('zone3.lantern2',3,GW/2-4,PY+PH-22,{layer:'lights',label:'Zone 3 Lantern 3'})
      ]
    }
  };

  function getZone(zone){ return zones[Number(zone)] || {breakables:[]}; }
  function getBreakables(zone){ return (getZone(zone).breakables || []).map(cloneObj); }
  function getBreakable(zone, index){ return cloneObj((getZone(zone).breakables || [])[Number(index)] || null); }
  function getBreakRects(zone){ return (getZone(zone).breakables || []).map(o => cloneRect(o.breakRect)); }
  function getBlockerRects(zone){ return (getZone(zone).breakables || []).map(o => cloneRect(o.blockRect || o.breakRect)); }
  function getBreakablesByLayer(zone, layer){
    return (getZone(zone).breakables || []).map((o,i)=>Object.assign({index:i}, cloneObj(o))).filter(o => !layer || (o.render && o.render.layer) === layer);
  }
  function getOverlayBreakables(zone){
    return (getZone(zone).breakables || []).map((o,i)=>Object.assign({index:i}, cloneObj(o))).filter(o => o.render && o.render.overlayRect);
  }

  window.BoneCrawlerZoneObjects={
    zones,
    getBreakables,
    getBreakable,
    getBreakRects,
    getBlockerRects,
    getBreakablesByLayer,
    getOverlayBreakables
  };

  try{ if(typeof syncZone2ObjectGeometry === 'function') syncZone2ObjectGeometry(); }catch(err){}
})();
