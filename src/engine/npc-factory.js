// npc-factory
// Purpose: generic factory and normalizer for NPC content used by the engine.
(function(){
  'use strict';
  if(window.GameNpcFactory) return;
  if(!window.GameContent || !window.GameObjectFactory) return;

  function create(type, config){
    const factory = GameContent.getNpcTypeFactory(type);
    if(typeof factory !== 'function'){
      throw new Error('GameNpcFactory: unregistered npc type "' + String(type || '') + '"');
    }
    const npcConfig = factory(GameContent.clone(config || {})) || {};
    return GameObjectFactory.createEntity(Object.assign({category:'npc', kind:'npc'}, npcConfig));
  }

  window.GameNpcFactory = {
    create: create
  };
})();
