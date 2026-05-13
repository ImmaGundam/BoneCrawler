// Zone 3 scene definition
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
    id:3,
    label:'ZONE 3',
    type:'map',
    render:function(){ drawDungeonZone3(); },
    objective:function(){ return 'Reach the dungeon exit and defeat the corrupted.'; },
    objects:[
      GameObjectFactory.create('bookshelf',{id:'zone3.bookshelf0',label:'Zone 3 Bookshelf 1',breakRect:r(PX+2,PY+22,6,17),blockRect:r(PX+2,PY+33,6,6),render:{sprite:'bookshelf',x:PX+2,y:PY+22,variant:0,layer:'main',overlayRect:r(PX+2,PY+22,6,11)},broken:{sprite:'rubble',x:PX+5,y:PY+39,variant:0}}),
      GameObjectFactory.create('bookshelf',{id:'zone3.bookshelf1',label:'Zone 3 Bookshelf 2',breakRect:r(PX+PW-8,PY+20,6,17),blockRect:r(PX+PW-8,PY+31,6,6),render:{sprite:'bookshelf',x:PX+PW-8,y:PY+20,variant:1,layer:'main',overlayRect:r(PX+PW-8,PY+20,6,11)},broken:{sprite:'rubble',x:PX+PW-5,y:PY+37,variant:1}}),
      GameObjectFactory.create('table',{id:'zone3.table0',label:'Zone 3 Table Set',breakRect:r(GW/2-7,PY+35,15,13),blockRect:r(GW/2-6,PY+41,12,8),render:{sprite:'roundTableSet',x:GW/2-4,y:PY+35,layer:'main',overlayRect:r(GW/2-8,PY+35,16,7)},broken:{sprite:'rubble',x:GW/2,y:PY+48,variant:2}}),
      GameObjectFactory.create('barrel',{id:'zone3.barrel0',label:'Zone 3 Barrel 1',breakRect:r(PX+PW-25,PY+PH-13,6,8),blockRect:r(PX+PW-25,PY+PH-13,6,8),render:{sprite:'barrel',x:PX+PW-25,y:PY+PH-13,variant:1,layer:'bottom'},broken:{sprite:'rubble',x:PX+PW-22,y:PY+PH-6,variant:3}}),
      GameObjectFactory.create('barrel',{id:'zone3.barrel1',label:'Zone 3 Barrel 2',breakRect:r(PX+PW-10,PY+PH-12,6,8),blockRect:r(PX+PW-10,PY+PH-12,6,8),render:{sprite:'barrel',x:PX+PW-10,y:PY+PH-12,variant:2,layer:'bottom'},broken:{sprite:'rubble',x:PX+PW-7,y:PY+PH-5,variant:3}}),
      floorLantern('zone3.lantern0',GW/2-24,PY+PH-15,'Zone 3 Lantern 1'),
      floorLantern('zone3.lantern1',GW/2+16,PY+PH-17,'Zone 3 Lantern 2'),
      floorLantern('zone3.lantern2',GW/2-4,PY+PH-22,'Zone 3 Lantern 3')
    ],
    environment:[
      GameObjectFactory.create('door',{id:'zone3.door',label:'Zone 3 Door',rect:r(GW/2-5,PY-2,10,10)}),
      GameObjectFactory.create('tree',{id:'zone3.tree',label:'Zone 3 Tree',group:'treeBlocker',rect:r(PX+13,PY+PH-28,16,22),breakRect:r(PX+13,PY+PH-28,16,22),blockRect:r(PX+15,PY+PH-20,12,10),interactRect:r(PX+8,PY+PH-26,22,18)}),
      GameObjectFactory.create('blocker',{id:'zone3.treeRootBase',label:'Zone 3 Tree Roots',rect:r(PX+10,PY+PH-12,20,7),group:'treeBlocker'}),
      GameObjectFactory.create('blocker',{id:'zone3.extraBlocker',label:'Zone 3 Extra Blocker',rect:r(PX+PW-18,PY+PH-11,7,7),group:'extraBlocker'}),
      GameObjectFactory.create('portal',{id:'zone3.secret2Portal',label:'Zone 3 Secret 2 Portal',rect:r(GW/2-6,PY+57,12,12),triggerRect:r(GW/2-6,PY+57,12,12),group:'portal'})
    ],
    collides:function(box){
      box = SceneEngine.boxFromArgs(box);
      const g = SceneRuntime.getGeometry();
      return g.ZONE3_DECOR_BLOCKERS.some(function(r,i){ return ((i >= g.ZONE3_DECOR_BREAK_RECTS.length) || !zone3Broken[i]) && ov(box,r); });
    }
  };
  SceneEngine.register(scene);
})();
