// Secret Zone 2 scene definition
(function(){
  'use strict';
  if(!window.SceneEngine || !window.GameContent) return;
  const r = GameContent.rect;
  const scene = {
    id: 102,
    label: '????',
    type: 'secret',
    render: function(){ drawDungeonSecret2(); },
    objective: function(){ return "Who's the dead guy?"; },
    environment:[
      GameNpcFactory.create('woundedStranger',{id:'secret2.woundedStranger',label:'Wounded Stranger',rect:r(GW/2-18,PY+68,12,8),interactRect:r(GW/2-22,PY+64,20,16),dialogId:'npc.woundedStranger.initial'}),
      GameObjectFactory.create('interactableProp',{id:'secret2.masterSword',label:'Master Sword',kind:'sword',rect:r(GW/2-6,PY+24,12,24),interactRect:r(GW/2-10,PY+20,20,32)}),
      GameObjectFactory.create('portal',{id:'secret2.returnPortal',label:'Return Portal',rect:r(PX+PW-18,PY+70,12,12),triggerRect:r(PX+PW-18,PY+70,12,12)}),
      GameObjectFactory.create('blocker',{id:'secret2.stone0',label:'Shrine Base Blocker',rect:r(GW/2-5,PY+42,10,7),group:'stoneBlocker'})
    ],
    collides: function(box){
      box = SceneEngine.boxFromArgs(box);
      return SceneRuntime.getGeometry().SECRET2_STONE_BLOCKERS.some(function(r){ return ov(box,r); });
    }
  };
  SceneEngine.register(scene);
})();
