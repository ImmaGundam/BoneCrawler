// Zone 1 scene definition
(function(){
  'use strict';
  if(!window.SceneEngine || !window.GameContent) return;
  const r = GameContent.rect;
  const scene = {
    id: 1,
    label: 'ZONE 1',
    type: 'map',
    render: function(){ drawDungeonZone1(); },
    objective: function(){
      if(player && !player.zone1DoorKey) return 'Survive the waves. Find the Zone Key.';
      if(player && !player.secret1Key) return 'Use the Zone Key or defeat the dragon.';
      return 'Secret zone unlocked. Break the bookshelf.';
    },
    objects: [
      GameObjectFactory.create('breakableProp', {id:'zone1.break0', label:'Zone 1 Bookshelf 1', kind:'bookshelf', breakRect:r(PX+2,PY+22,6,17), blockRect:r(PX+2,PY+33,6,6), breakEffect:'wood'}),
      GameObjectFactory.create('breakableProp', {id:'zone1.break1', label:'Zone 1 Bookshelf 2', kind:'bookshelf', breakRect:r(PX+PW-8,PY+20,6,17), blockRect:r(PX+PW-8,PY+31,6,6), breakEffect:'wood'}),
      GameObjectFactory.create('breakableProp', {id:'zone1.break2', label:'Zone 1 Broken Table Corner', kind:'table', breakRect:r(PX+7,PY+11,19,15), blockRect:r(PX+7,PY+11,19,15), breakEffect:'wood'}),
      GameObjectFactory.create('breakableProp', {id:'zone1.break3', label:'Zone 1 Broken Barrel', kind:'barrel', breakRect:r(PX+PW-14,PY+8,6,8), blockRect:r(PX+PW-14,PY+8,6,8), breakEffect:'wood'}),
      GameObjectFactory.create('breakableProp', {id:'zone1.break4', label:'Zone 1 Barrel 1', kind:'barrel', breakRect:r(PX+PW-24,PY+PH-22,6,8), blockRect:r(PX+PW-24,PY+PH-22,6,8), breakEffect:'wood'}),
      GameObjectFactory.create('breakableProp', {id:'zone1.break5', label:'Zone 1 Barrel 2', kind:'barrel', breakRect:r(PX+PW-16,PY+PH-20,6,8), blockRect:r(PX+PW-16,PY+PH-20,6,8), breakEffect:'wood'}),
      GameObjectFactory.create('breakableProp', {id:'zone1.break6', label:'Zone 1 Barrel 3', kind:'barrel', breakRect:r(PX+PW-9,PY+PH-23,6,8), blockRect:r(PX+PW-9,PY+PH-23,6,8), breakEffect:'wood'}),
      GameObjectFactory.create('breakableProp', {id:'zone1.break7', label:'Zone 1 Barrel 4', kind:'barrel', breakRect:r(PX+PW-18,PY+PH-13,6,8), blockRect:r(PX+PW-18,PY+PH-13,6,8), breakEffect:'wood'}),
      GameObjectFactory.create('breakableProp', {id:'zone1.break8', label:'Zone 1 Barrel 5', kind:'barrel', breakRect:r(PX+PW-10,PY+PH-12,6,8), blockRect:r(PX+PW-10,PY+PH-12,6,8), breakEffect:'wood'})
    ],
    environment: [
      GameObjectFactory.create('door', {id:'zone1.door', label:'Zone 1 Door', rect:r(GW/2-5,PY-2,10,10)}),
      GameObjectFactory.create('triggerZone', {id:'zone1.secretEntrance', label:'Secret Zone 1 Entrance', rect:r(PX+3,PY+24,4,10), triggerRect:r(PX+3,PY+24,4,10), group:'trigger'}),
      GameObjectFactory.create('blocker', {id:'zone1.weaponRack', label:'Broken Weapon Rack', rect:r(PX+9,PY+PH-16,8,6), group:'extraBlocker'}),
      GameObjectFactory.create('blocker', {id:'zone1.trainingDummy', label:'Training Dummy', rect:r(PX+19,PY+PH-18,7,10), group:'extraBlocker'})
    ],
    npcs: [GameNpcFactory.create('node', {id:'zone1.node', dialogId:'npc.node.startup'})],
    collides: function(box){
      box = SceneEngine.boxFromArgs(box);
      return SceneRuntime.getGeometry().ZONE1_DECOR_BLOCKERS.some(function(r,i){ return !zone1Broken[i] && ov(box,r); }) ||
        SceneRuntime.getGeometry().ZONE1_EXTRA_BLOCKERS.some(function(r){ return ov(box,r); });
    }
  };
  SceneEngine.register(scene);
})();
