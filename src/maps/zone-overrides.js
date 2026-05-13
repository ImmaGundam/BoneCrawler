// zone-overrides
// Purpose: Route shared render/collision calls through registered scene modules.
(function(){
  'use strict';
  if(!window.SceneEngine) return;

  const original = {
    drawDungeon: window.drawDungeon,
    collidesZoneObstacles: window.collidesZoneObstacles,
    collidesZone2Tree: window.collidesZone2Tree,
    getZoneLabel: window.getZoneLabel,
    isSecretZone: window.isSecretZone,
  };

  function modularDrawDungeon(){
    const zone = SceneEngine.getActiveZone();
    if(zone && typeof zone.render === 'function'){
      zone.render();
      return;
    }
    if(typeof original.drawDungeon === 'function') original.drawDungeon();
  }

  function modularCollidesZoneObstacles(x,y,w,h){
    const zone = SceneEngine.getActiveZone();
    if(zone && typeof zone.collides === 'function'){
      return !!zone.collides(SceneEngine.boxFromArgs(x,y,w,h));
    }
    return typeof original.collidesZoneObstacles === 'function' ? !!original.collidesZoneObstacles(x,y,w,h) : false;
  }

  function modularCollidesZone2Tree(x,y,w,h){
    const zone = SceneEngine.get(2);
    if(Number(currentZone) !== 2) return false;
    if(zone && typeof zone.collidesTree === 'function'){
      return !!zone.collidesTree(SceneEngine.boxFromArgs(x,y,w,h));
    }
    return typeof original.collidesZone2Tree === 'function' ? !!original.collidesZone2Tree(x,y,w,h) : false;
  }

  function modularGetZoneLabel(zoneId){
    const zone = SceneEngine.get(Number(zoneId));
    if(zone) return zone.label;
    return typeof original.getZoneLabel === 'function' ? original.getZoneLabel(zoneId) : 'ZONE';
  }

  function modularIsSecretZone(zoneId){
    const zone = SceneEngine.get(Number(zoneId));
    if(zone) return zone.type === 'secret';
    return typeof original.isSecretZone === 'function' ? !!original.isSecretZone(zoneId) : false;
  }

  try{ drawDungeon = modularDrawDungeon; }catch(err){}
  try{ collidesZoneObstacles = modularCollidesZoneObstacles; }catch(err){}
  try{ collidesZone2Tree = modularCollidesZone2Tree; }catch(err){}
  try{ getZoneLabel = modularGetZoneLabel; }catch(err){}
  try{ isSecretZone = modularIsSecretZone; }catch(err){}

  window.drawDungeon = modularDrawDungeon;
  window.collidesZoneObstacles = modularCollidesZoneObstacles;
  window.collidesZone2Tree = modularCollidesZone2Tree;
  window.getZoneLabel = modularGetZoneLabel;
  window.isSecretZone = modularIsSecretZone;
})();
