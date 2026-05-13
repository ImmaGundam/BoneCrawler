// Secret Zone 1 scene definition
(function(){
  'use strict';
  if(!window.SceneEngine || !window.GameContent) return;
  const r = GameContent.rect;
  const scene = {
    id: 101,
    label: '????',
    type: 'secret',
    render: function(){ drawDungeonSecret1(); },
    objective: function(){ return 'Why is there a rat in here?'; },
    environment:[
      GameObjectFactory.create('door',{id:'secret1.exitDoor',label:'Secret Zone 1 Exit Door',rect:r(GW/2-5,PY-2,10,10)}),
      GameObjectFactory.create('water',{id:'secret1.poolWater',label:'Secret Zone 1 Pool Water',rect:r(GW/2-25,PY+25,50,20),triggerRect:r(GW/2-25,PY+25,50,20)}),
      GameNpcFactory.create('rat',{id:'secret1.rat',label:'Rat',rect:r(PX+10,PY+10,8,6),interactRect:r(PX+7,PY+7,15,12),dialogId:'npc.rat.initial'}),
      GameObjectFactory.create('interactableProp',{id:'secret1.cheese',label:'Cheese',kind:'cheese',rect:r(PX+20,PY+12,6,4),group:'prop'})
    ],
    collides: function(box){
      box = SceneEngine.boxFromArgs(box);
      return SceneRuntime.getGeometry().SECRET1_POOL_BLOCKERS.some(function(r){ return ov(box,r); });
    }
  };
  SceneEngine.register(scene);
})();
