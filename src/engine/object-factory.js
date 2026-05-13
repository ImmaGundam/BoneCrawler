// object-factory
// Purpose: generic factory and normalizer for world objects used by the engine.
(function(){
  'use strict';
  if(window.GameObjectFactory) return;
  if(!window.GameContent) return;

  function rect(x,y,w,h){ return {x:Number(x)||0,y:Number(y)||0,w:Number(w)||0,h:Number(h)||0}; }
  function normalizeRect(r){ return r ? rect(r.x,r.y,r.w,r.h) : null; }

  function normalizeEntity(config){
    const entity = Object.assign({
      id:'',
      type:'entity',
      kind:'entity',
      label:'Entity',
      category:'prop',
      group:'generic',
      tags:[],
      rect:null,
      breakRect:null,
      blockRect:null,
      interactRect:null,
      triggerRect:null,
      overlayRect:null,
      broken:null,
      render:null,
      dialogId:null,
      soundCue:null,
      animationId:null,
      events:null,
      meta:null
    }, GameContent.clone(config || {}));

    entity.rect = normalizeRect(entity.rect || entity.breakRect || entity.blockRect || entity.interactRect || entity.triggerRect);
    entity.breakRect = normalizeRect(entity.breakRect);
    entity.blockRect = normalizeRect(entity.blockRect);
    entity.interactRect = normalizeRect(entity.interactRect);
    entity.triggerRect = normalizeRect(entity.triggerRect);
    entity.overlayRect = normalizeRect(entity.overlayRect);
    if(entity.render && entity.render.overlayRect){
      entity.render.overlayRect = normalizeRect(entity.render.overlayRect);
      if(!entity.overlayRect) entity.overlayRect = GameContent.cloneRect(entity.render.overlayRect);
    }
    if(entity.broken && entity.broken.rect) entity.broken.rect = normalizeRect(entity.broken.rect);
    if(!Array.isArray(entity.tags)) entity.tags = entity.tags ? [entity.tags] : [];
    return entity;
  }

  function create(type, config){
    const factory = GameContent.getObjectTypeFactory(type);
    if(typeof factory !== 'function'){
      throw new Error('GameObjectFactory: unregistered object type "' + String(type || '') + '"');
    }
    return normalizeEntity(factory(GameContent.clone(config || {})) || {});
  }

  window.GameObjectFactory = {
    createEntity: normalizeEntity,
    create: create,
    normalizeEntity: normalizeEntity,
    normalizeRect: normalizeRect,
    rect: rect
  };
})();
