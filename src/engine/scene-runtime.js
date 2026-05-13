// scene-runtime
// Purpose: compile scene content into reusable runtime views and editor-friendly geometry.
(function(){
  'use strict';
  if(window.SceneRuntime) return;

  function clone(value){
    try{ return JSON.parse(JSON.stringify(value)); }
    catch(err){ return value; }
  }
  function rect(x,y,w,h){ return {x:Number(x)||0,y:Number(y)||0,w:Number(w)||0,h:Number(h)||0}; }
  function cloneRect(r){ return r ? rect(r.x,r.y,r.w,r.h) : null; }
  function clearAndAssign(target, values){
    target.splice(0, target.length);
    (values || []).forEach(v => target.push(v));
    return target;
  }

  const geometry = {
    ZONE1_DOOR_RECT: null,
    ZONE1_DECOR_BREAK_RECTS: [],
    ZONE1_DECOR_BLOCKERS: [],
    ZONE1_EXTRA_BLOCKERS: [],
    ZONE2_TREE_BLOCKERS: [],
    ZONE2_HOLE_BLOCKERS: [],
    ZONE2_DECOR_BREAK_RECTS: [],
    ZONE2_DECOR_BLOCKERS: [],
    ZONE3_DOOR_RECT: null,
    ZONE3_TREE_RECT: null,
    ZONE3_TREE_INTERACT_RECT: null,
    ZONE3_TREE_BLOCKERS: [],
    ZONE3_EXTRA_BLOCKERS: [],
    ZONE3_SECRET2_PORTAL_RECT: null,
    ZONE3_DECOR_BREAK_RECTS: [],
    ZONE3_DECOR_OBJECT_BLOCKERS: [],
    ZONE3_DECOR_BLOCKERS: [],
    SECRET1_ENTRANCE_RECT: null,
    SECRET1_EXIT_DOOR_RECT: null,
    SECRET1_POOL_BLOCKERS: [],
    SECRET1_POOL_WATER_RECT: null,
    SECRET1_RAT_RECT: null,
    SECRET1_RAT_INTERACT_RECT: null,
    SECRET1_CHEESE_RECT: null,
    SECRET2_NPC_RECT: null,
    SECRET2_SWORD_RECT: null,
    SECRET2_RETURN_PORTAL_RECT: null,
    SECRET2_STONE_BLOCKERS: []
  };

  const sceneIndex = {};
  const entityIndex = {};
  const breakablesByScene = {};

  function allScenes(){
    if(window.SceneEngine && typeof SceneEngine.getAll === 'function') return SceneEngine.getAll();
    return [];
  }

  function indexScene(scene){
    if(!scene || scene.id == null) return;
    const entities = [];
    ['objects','environment','npcs','triggers','items'].forEach(key => {
      const list = Array.isArray(scene[key]) ? scene[key] : [];
      list.forEach(item => {
        if(!item) return;
        item.sceneId = Number(scene.id);
        entities.push(item);
        if(item.id) entityIndex[item.id] = item;
      });
    });
    scene.entities = entities;
    sceneIndex[Number(scene.id)] = scene;
    breakablesByScene[Number(scene.id)] = entities.filter(item => item.breakRect);
    breakablesByScene[Number(scene.id)].forEach(function(item, index){ item.index=index; item.zone=Number(scene.id); });
  }

  function buildIndexes(){
    Object.keys(sceneIndex).forEach(k => delete sceneIndex[k]);
    Object.keys(entityIndex).forEach(k => delete entityIndex[k]);
    Object.keys(breakablesByScene).forEach(k => delete breakablesByScene[k]);
    allScenes().forEach(indexScene);
  }

  function byGroup(sceneId, group){
    const scene = sceneIndex[Number(sceneId)];
    if(!scene) return [];
    return (scene.entities || []).filter(item => item.group === group);
  }

  function firstRect(id, field){
    const entity = entityIndex[id];
    if(!entity) return null;
    return entity[field || 'rect'] || entity.rect || entity.breakRect || entity.blockRect || entity.interactRect || entity.triggerRect || null;
  }

  function buildGeometry(){
    buildIndexes();

    geometry.ZONE1_DOOR_RECT = firstRect('zone1.door', 'rect');
    clearAndAssign(geometry.ZONE1_DECOR_BREAK_RECTS, breakablesByScene[1].map(item => item.breakRect));
    clearAndAssign(geometry.ZONE1_DECOR_BLOCKERS, breakablesByScene[1].map(item => item.blockRect || item.breakRect));
    clearAndAssign(geometry.ZONE1_EXTRA_BLOCKERS, byGroup(1, 'extraBlocker').map(item => item.blockRect || item.rect));
    geometry.SECRET1_ENTRANCE_RECT = firstRect('zone1.secretEntrance', 'triggerRect');

    clearAndAssign(geometry.ZONE2_TREE_BLOCKERS, byGroup(2, 'treeBlocker').map(item => item.blockRect || item.rect));
    clearAndAssign(geometry.ZONE2_HOLE_BLOCKERS, byGroup(2, 'holeBlocker').map(item => item.blockRect || item.rect));
    clearAndAssign(geometry.ZONE2_DECOR_BREAK_RECTS, breakablesByScene[2].map(item => item.breakRect));
    clearAndAssign(geometry.ZONE2_DECOR_BLOCKERS, breakablesByScene[2].map(item => item.blockRect || item.breakRect));

    geometry.ZONE3_DOOR_RECT = firstRect('zone3.door', 'rect');
    geometry.ZONE3_TREE_RECT = firstRect('zone3.tree', 'breakRect');
    geometry.ZONE3_TREE_INTERACT_RECT = firstRect('zone3.tree', 'interactRect');
    geometry.ZONE3_SECRET2_PORTAL_RECT = firstRect('zone3.secret2Portal', 'triggerRect');
    clearAndAssign(geometry.ZONE3_TREE_BLOCKERS, byGroup(3, 'treeBlocker').map(item => item.blockRect || item.rect));
    clearAndAssign(geometry.ZONE3_EXTRA_BLOCKERS, byGroup(3, 'extraBlocker').map(item => item.blockRect || item.rect));
    clearAndAssign(geometry.ZONE3_DECOR_BREAK_RECTS, breakablesByScene[3].map(item => item.breakRect));
    clearAndAssign(geometry.ZONE3_DECOR_OBJECT_BLOCKERS, breakablesByScene[3].map(item => item.blockRect || item.breakRect));
    clearAndAssign(geometry.ZONE3_DECOR_BLOCKERS, geometry.ZONE3_DECOR_OBJECT_BLOCKERS.concat(geometry.ZONE3_TREE_BLOCKERS, geometry.ZONE3_EXTRA_BLOCKERS));

    geometry.SECRET1_EXIT_DOOR_RECT = firstRect('secret1.exitDoor', 'rect');
    geometry.SECRET1_POOL_WATER_RECT = firstRect('secret1.poolWater', 'triggerRect');
    clearAndAssign(geometry.SECRET1_POOL_BLOCKERS, byGroup(101, 'waterBlocker').map(item => item.blockRect || item.rect));
    geometry.SECRET1_RAT_RECT = firstRect('secret1.rat', 'rect');
    geometry.SECRET1_RAT_INTERACT_RECT = firstRect('secret1.rat', 'interactRect');
    geometry.SECRET1_CHEESE_RECT = firstRect('secret1.cheese', 'rect');

    geometry.SECRET2_NPC_RECT = firstRect('secret2.woundedStranger', 'rect');
    geometry.SECRET2_SWORD_RECT = firstRect('secret2.masterSword', 'rect');
    geometry.SECRET2_RETURN_PORTAL_RECT = firstRect('secret2.returnPortal', 'triggerRect');
    clearAndAssign(geometry.SECRET2_STONE_BLOCKERS, byGroup(102, 'stoneBlocker').map(item => item.blockRect || item.rect));

    return geometry;
  }

  buildGeometry();

  window.SceneRuntime = {
    geometry,
    rebuild: buildGeometry,
    getScene: function(id){ return sceneIndex[Number(id)] || null; },
    getSceneEntities: function(id){ const scene = sceneIndex[Number(id)]; return scene ? (scene.entities || []) : []; },
    getEntity: function(id){ return entityIndex[id] || null; },
    getRect: firstRect,
    getBreakable: function(sceneId, index){ const list = breakablesByScene[Number(sceneId)] || []; return list[Number(index)] || null; },
    getBreakables: function(sceneId){ return (breakablesByScene[Number(sceneId)] || []).slice(); },
    getBreakablesByLayer: function(sceneId, layer){ return (breakablesByScene[Number(sceneId)] || []).filter(item => item.render && item.render.layer === layer); },
    getOverlayBreakables: function(sceneId){ return (breakablesByScene[Number(sceneId)] || []).filter(item => item.render && item.render.overlayRect); },
    getGeometry: function(){ return geometry; },
    cloneGeometry: function(){ return clone(geometry); }
  };
})();
