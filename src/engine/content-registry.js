// content-registry
// Purpose: generic registry for game content definitions used by the engine.
(function(){
  'use strict';
  if(window.GameContent) return;

  function clone(value){
    try{ return JSON.parse(JSON.stringify(value)); }
    catch(err){ return value; }
  }

  function rect(x,y,w,h){ return {x:Number(x)||0,y:Number(y)||0,w:Number(w)||0,h:Number(h)||0}; }
  function cloneRect(r){ return r ? rect(r.x,r.y,r.w,r.h) : null; }

  const objectTypes = new Map();
  const npcTypes = new Map();
  const dialogEntries = new Map();
  const eventBundles = [];

  function defineObjectType(type, factory){
    if(!type || typeof factory !== 'function') return false;
    objectTypes.set(String(type), factory);
    return true;
  }

  function defineNpcType(type, factory){
    if(!type || typeof factory !== 'function') return false;
    npcTypes.set(String(type), factory);
    return true;
  }

  function getObjectTypeFactory(type){
    return objectTypes.get(String(type || '')) || null;
  }

  function getNpcTypeFactory(type){
    return npcTypes.get(String(type || '')) || null;
  }

  function registerDialog(id, entry){
    if(!id) return false;
    dialogEntries.set(String(id), clone(entry));
    return true;
  }

  function getDialog(id, payload){
    const entry = dialogEntries.get(String(id || ''));
    if(typeof entry === 'function') return clone(entry(payload || {}));
    return clone(entry);
  }

  function registerEventBundle(bundle){
    if(!bundle || typeof bundle !== 'object') return false;
    eventBundles.push(clone(bundle));
    return true;
  }

  function getEventData(){
    const out = {transitionRules:[], interactionRules:[], scriptedDialogRules:[], runtimeEventRules:[]};
    eventBundles.forEach(bundle => {
      Object.keys(out).forEach(key => {
        if(Array.isArray(bundle[key])) out[key].push.apply(out[key], clone(bundle[key]));
      });
    });
    return out;
  }

  window.GameContent = {
    rect,
    clone,
    cloneRect,
    defineObjectType,
    defineNpcType,
    getObjectTypeFactory,
    getNpcTypeFactory,
    registerDialog,
    getDialog,
    registerEventBundle,
    getEventData,
    getObjectTypes: function(){ return Array.from(objectTypes.keys()); },
    getNpcTypes: function(){ return Array.from(npcTypes.keys()); }
  };
})();
