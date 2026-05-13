// Zone 2 scene definition
(function(){
  'use strict';
  if(!window.SceneEngine || !window.GameContent) return;
  const r = GameContent.rect;
  function floorLantern(id, lx, ly, label){
    return GameObjectFactory.create('lantern', {
      id, label, breakRect:r(lx-2, ly-3, 12, 12), blockRect:r(lx+1, ly+1, 4, 5),
      render:{sprite:'floorLantern',x:lx,y:ly,layer:'lights'}, broken:{sprite:'smallFlame',x:lx+2,y:ly+2,layer:'lights'}, breakEffect:'lanternFlame'
    });
  }
  const scene = {
    id:2,
    label:'ZONE 2',
    type:'map',
    render:function(){ drawDungeonZone2(); },
    objective:function(){ if(player && !player.zone2Key) return 'Clear the room and earn the Zone 2 key.'; return 'Zone 3 path is open.'; },
    objects:[
      GameObjectFactory.create('bookshelf',{id:'zone2.bookshelf0',label:'Zone 2 Bookshelf 1',breakRect:r(GW/2-14,PY+7,6,17),blockRect:r(GW/2-14,PY+18,6,6),render:{sprite:'bookshelf',x:GW/2-14,y:PY+7,variant:0,layer:'back',overlayRect:r(GW/2-14,PY+12,6,12)},broken:{sprite:'rubble',x:GW/2-11,y:PY+23,variant:0}}),
      GameObjectFactory.create('bookshelf',{id:'zone2.bookshelf1',label:'Zone 2 Bookshelf 2',breakRect:r(GW/2-6,PY+7,6,17),blockRect:r(GW/2-6,PY+18,6,6),render:{sprite:'bookshelf',x:GW/2-6,y:PY+7,variant:0,layer:'back',overlayRect:r(GW/2-6,PY+12,6,12)},broken:{sprite:'rubble',x:GW/2-3,y:PY+23,variant:0}}),
      GameObjectFactory.create('bookshelf',{id:'zone2.bookshelf2',label:'Zone 2 Bookshelf 3',breakRect:r(GW/2+2,PY+7,6,17),blockRect:r(GW/2+2,PY+18,6,6),render:{sprite:'bookshelf',x:GW/2+2,y:PY+7,variant:0,layer:'back',overlayRect:r(GW/2+2,PY+12,6,12)},broken:{sprite:'rubble',x:GW/2+5,y:PY+23,variant:0}}),
      GameObjectFactory.create('bookshelf',{id:'zone2.bookshelf3',label:'Zone 2 Bookshelf 4',breakRect:r(GW/2+10,PY+7,6,17),blockRect:r(GW/2+10,PY+18,6,6),render:{sprite:'bookshelf',x:GW/2+10,y:PY+7,variant:1,layer:'back',overlayRect:r(GW/2+10,PY+12,6,12)},broken:{sprite:'rubble',x:GW/2+13,y:PY+23,variant:0}}),
      GameObjectFactory.create('crate',{id:'zone2.crate0',label:'Zone 2 Crate',breakRect:r(PX+PW-30,PY+12,7,7),blockRect:r(PX+PW-30,PY+12,7,7),render:{sprite:'crate',x:PX+PW-30,y:PY+12,variant:true,layer:'back'},broken:{sprite:'rubble',x:PX+PW-26,y:PY+19,variant:3}}),
      GameObjectFactory.create('barrel',{id:'zone2.barrel0',label:'Zone 2 Barrel 1',breakRect:r(PX+PW-22,PY+10,6,8),blockRect:r(PX+PW-22,PY+10,6,8),render:{sprite:'barrel',x:PX+PW-22,y:PY+10,variant:2,layer:'back'},broken:{sprite:'rubble',x:PX+PW-19,y:PY+18,variant:3}}),
      GameObjectFactory.create('barrel',{id:'zone2.barrel1',label:'Zone 2 Barrel 2',breakRect:r(PX+PW-14,PY+12,6,8),blockRect:r(PX+PW-14,PY+12,6,8),render:{sprite:'barrel',x:PX+PW-14,y:PY+12,variant:1,layer:'back'},broken:{sprite:'rubble',x:PX+PW-11,y:PY+19,variant:3}}),
      floorLantern('zone2.lantern0',GW/2-23,PY+23,'Zone 2 Lantern'),
      GameObjectFactory.create('bookshelf',{id:'zone2.bookshelf4',label:'Zone 2 Side Bookshelf 1',breakRect:r(PX+6,PY+7,6,17),blockRect:r(PX+6,PY+18,6,6),render:{sprite:'bookshelf',x:PX+6,y:PY+7,variant:0,layer:'late',overlayRect:r(PX+6,PY+12,6,12)},broken:{sprite:'rubble',x:PX+9,y:PY+23,variant:0}}),
      GameObjectFactory.create('bookshelf',{id:'zone2.bookshelf5',label:'Zone 2 Side Bookshelf 2',breakRect:r(PX+14,PY+7,6,17),blockRect:r(PX+14,PY+18,6,6),render:{sprite:'bookshelf',x:PX+14,y:PY+7,variant:0,layer:'late',overlayRect:r(PX+14,PY+12,6,12)},broken:{sprite:'rubble',x:PX+17,y:PY+23,variant:0}}),
      GameObjectFactory.create('bookshelf',{id:'zone2.bookshelf6',label:'Zone 2 Side Bookshelf 3',breakRect:r(PX+PW-20,PY+7,6,17),blockRect:r(PX+PW-20,PY+18,6,6),render:{sprite:'bookshelf',x:PX+PW-20,y:PY+7,variant:1,layer:'late',overlayRect:r(PX+PW-20,PY+12,6,12)},broken:{sprite:'rubble',x:PX+PW-17,y:PY+23,variant:0}}),
      GameObjectFactory.create('bookshelf',{id:'zone2.bookshelf7',label:'Zone 2 Side Bookshelf 4',breakRect:r(PX+PW-12,PY+7,6,17),blockRect:r(PX+PW-12,PY+18,6,6),render:{sprite:'bookshelf',x:PX+PW-12,y:PY+7,variant:1,layer:'late',overlayRect:r(PX+PW-12,PY+12,6,12)},broken:{sprite:'rubble',x:PX+PW-9,y:PY+23,variant:0}})
    ],
    environment:[
      GameObjectFactory.create('rootBarrier',{id:'zone2.treeTrunk',label:'Zone 2 Tree Trunk',rect:r(GW/2-5,PY+46,10,15),group:'treeBlocker'}),
      GameObjectFactory.create('rootBarrier',{id:'zone2.root0',label:'Zone 2 Root 1',rect:r(GW/2-13,PY+53,26,8),group:'treeBlocker'}),
      GameObjectFactory.create('rootBarrier',{id:'zone2.root1',label:'Zone 2 Root 2',rect:r(GW/2-7,PY+59,14,5),group:'treeBlocker'}),
      GameObjectFactory.create('rootBarrier',{id:'zone2.root2',label:'Zone 2 Root 3',rect:r(GW/2-23,PY+53,13,6),group:'treeBlocker'}),
      GameObjectFactory.create('rootBarrier',{id:'zone2.root3',label:'Zone 2 Root 4',rect:r(GW/2+10,PY+53,13,6),group:'treeBlocker'}),
      GameObjectFactory.create('rockObstacle',{id:'zone2.rock0',label:'Zone 2 Rock 1',rect:r(PX+15,PY+PH-24,4,4),group:'holeBlocker'}),
      GameObjectFactory.create('rockObstacle',{id:'zone2.rock1',label:'Zone 2 Rock 2',rect:r(PX+PW-27,PY+PH-25,4,4),group:'holeBlocker'})
    ],
    collides:function(box){
      box = SceneEngine.boxFromArgs(box);
      const g = SceneRuntime.getGeometry();
      return g.ZONE2_TREE_BLOCKERS.some(r=>ov(box,r)) || g.ZONE2_HOLE_BLOCKERS.some(r=>ov(box,r)) || g.ZONE2_DECOR_BLOCKERS.some((r,i)=>!zone2Broken[i]&&ov(box,r));
    },
    collidesTree:function(box){
      box = SceneEngine.boxFromArgs(box);
      return SceneRuntime.getGeometry().ZONE2_TREE_BLOCKERS.some(r=>ov(box,r));
    }
  };
  SceneEngine.register(scene);
})();
