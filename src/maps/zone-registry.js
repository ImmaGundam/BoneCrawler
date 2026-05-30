// zone-registry
// Purpose: generic scene registry for renderer/collision.
(function(){
  'use strict';

  const registry = new Map();
  const titleStates = new Set(['title','intro','intro_fade','scoreboard']);

  function readGlobal(name, fallback){
    try{ return typeof window[name] !== 'undefined' ? window[name] : fallback; }
    catch(err){ return fallback; }
  }

  function boxFromArgs(x,y,w,h){
    if(typeof x === 'object' && x) return x;
    return {x:x||0,y:y||0,w:w||0,h:h||0};
  }

  function register(scene){
    if(!scene || scene.id == null) return null;
    const id = Number(scene.id);
    const normalized = Object.assign({
      id,
      label: 'ZONE '+id,
      type: 'map',
      render: null,
      collides: null,
      collidesTree: null,
      objective: null,
      objects: [],
      environment: [],
      npcs: [],
      triggers: [],
      items: []
    }, scene, {id});
    registry.set(id, normalized);
    return normalized;
  }

  function get(zoneId){
    return registry.get(Number(zoneId)) || null;
  }

  function getCurrentZoneId(){
    return Number(readGlobal('currentZone', 1)) || 1;
  }

  function isTitleState(state){
    return titleStates.has(String(state || readGlobal('gState','title')));
  }

  function getActiveZone(){
    if(isTitleState()) return null;
    return get(getCurrentZoneId());
  }

  function getLabel(zoneId){
    const zone = get(zoneId);
    return zone ? zone.label : 'ZONE';
  }

  function getType(zoneId){
    const zone = get(zoneId);
    return zone ? String(zone.type || 'map') : 'map';
  }

  function isSecret(zoneId){
    const zone = get(zoneId);
    return !!(zone && zone.type === 'secret');
  }

  function render(zoneId){
    const zone = zoneId == null ? getActiveZone() : get(zoneId);
    if(zone && typeof zone.render === 'function'){
      zone.render();
      return true;
    }
    return false;
  }

  function collides(zoneId, box){
    const zone = zoneId == null ? getActiveZone() : get(zoneId);
    if(zone && typeof zone.collides === 'function'){
      return !!zone.collides(boxFromArgs(box));
    }
    return false;
  }

  function collidesTree(zoneId, box){
    const zone = zoneId == null ? getActiveZone() : get(zoneId);
    if(zone && typeof zone.collidesTree === 'function'){
      return !!zone.collidesTree(boxFromArgs(box));
    }
    return false;
  }

  window.SceneEngine = {
    register,
    get,
    getAll: () => Array.from(registry.values()),
    getCurrentZoneId,
    getActiveZone,
    getLabel,
    getType,
    isSecret,
    isTitleState,
    render,
    collides,
    collidesTree,
    boxFromArgs
  };
})();
