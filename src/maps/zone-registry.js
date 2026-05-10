// zone-registry
// Purpose: runtime definition for renderer/collision
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

  function register(zone){
    if(!zone || zone.id == null) return null;
    const id = Number(zone.id);
    const normalized = Object.assign({
      id,
      label: 'ZONE '+id,
      type: 'map',
      render: null,
      collides: null,
      collidesTree: null,
      objective: null,
    }, zone, {id});
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

  function isSecret(zoneId){
    const zone = get(zoneId);
    return !!(zone && zone.type === 'secret');
  }

  window.BoneCrawlerZones = {
    register,
    get,
    getAll: () => Array.from(registry.values()),
    getCurrentZoneId,
    getActiveZone,
    getLabel,
    isSecret,
    isTitleState,
    boxFromArgs,
  };
})();
