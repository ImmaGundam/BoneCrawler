// zone-bindings
// Purpose: keeps map identity separate from spawn, progression, object, and dialog resources.
(function(){
  if(window.BoneCrawlerZoneRuntime) return;

  const defaultBindings = {
    0: {
      zoneId: 0,
      label: 'Title Scene',
      map: {id:'title_scene', resource:'data/title_scene.json'},
      spawn: {system:'none', resource:'data/title_scene_spawns.json'},
      progression: {system:'none', resource:null},
      objects: {resource:'data/title_scene_objects.json'},
      dialog: {resource:'data/title_scene_dialog.json'}
    },
    1: {
      zoneId: 1,
      label: 'Zone 1',
      map: {id:'zone_1', resource:'src/maps/zones-and-interactions.js#zone1'},
      spawn: {system:'waves', resource:'src/enemies/zone-spawn-config-baseline.js#zones.1'},
      progression: {system:'rules', resource:'src/runtime/progression-rules.js#zone1'},
      objects: {resource:'src/objects/object-factory.js#zone1'},
      dialog: {resource:'src/runtime/progression-rules.js#dialog.zone1'}
    },
    2: {
      zoneId: 2,
      label: 'Zone 2',
      map: {id:'zone_2', resource:'src/maps/zones-and-interactions.js#zone2'},
      spawn: {system:'waves', resource:'src/enemies/zone-spawn-config-baseline.js#zones.2'},
      progression: {system:'rules', resource:'src/runtime/progression-rules.js#zone2'},
      objects: {resource:'src/objects/object-factory.js#zone2'},
      dialog: {resource:'src/runtime/progression-rules.js#dialog.zone2'}
    },
    3: {
      zoneId: 3,
      label: 'Zone 3',
      map: {id:'zone_3', resource:'src/maps/zones-and-interactions.js#zone3'},
      spawn: {system:'waves', resource:'src/enemies/zone-spawn-config-baseline.js#zones.3'},
      progression: {system:'rules', resource:'src/runtime/progression-rules.js#zone3'},
      objects: {resource:'src/objects/object-factory.js#zone3'},
      dialog: {resource:'src/runtime/progression-rules.js#dialog.zone3'}
    },
    101: {
      zoneId: 101,
      label: 'Secret Zone 1',
      map: {id:'secret_zone_1', resource:'src/maps/zones-and-interactions.js#secret1'},
      spawn: {system:'none', resource:'src/enemies/zone-spawn-config-baseline.js#zones.101'},
      progression: {system:'rules', resource:'src/runtime/progression-rules.js#secret1'},
      objects: {resource:'src/objects/object-factory.js#secret1'},
      dialog: {resource:'src/runtime/progression-rules.js#dialog.secret1'}
    },
    102: {
      zoneId: 102,
      label: 'Secret Zone 2',
      map: {id:'secret_zone_2', resource:'src/maps/zones-and-interactions.js#secret2'},
      spawn: {system:'none', resource:'src/enemies/zone-spawn-config-baseline.js#zones.102'},
      progression: {system:'rules', resource:'src/runtime/progression-rules.js#secret2'},
      objects: {resource:'src/objects/object-factory.js#secret2'},
      dialog: {resource:'src/runtime/progression-rules.js#dialog.secret2'}
    }
  };

  const bindings = window.BoneCrawlerZoneBindings || defaultBindings;
  window.BoneCrawlerZoneBindings = bindings;

  function clone(value){
    try{ return JSON.parse(JSON.stringify(value)); }catch(err){ return value; }
  }

  function normalizeZone(zone){
    const n = Number(zone);
    return Number.isFinite(n) ? n : 0;
  }

  function getBinding(zone){
    zone = normalizeZone(zone);
    return bindings[zone] || bindings[String(zone)] || null;
  }

  function setBinding(zone, binding){
    zone = normalizeZone(zone);
    bindings[zone] = Object.assign({zoneId:zone}, binding || {});
    return bindings[zone];
  }

  function patchBinding(zone, patch){
    const current = getBinding(zone) || {zoneId:normalizeZone(zone)};
    const next = Object.assign({}, current, patch || {});
    ['map','spawn','progression','objects','dialog'].forEach(key => {
      if(current[key] || (patch && patch[key])) next[key] = Object.assign({}, current[key] || {}, (patch && patch[key]) || {});
    });
    return setBinding(zone, next);
  }

  function getSpawnSystem(zone){
    const binding = getBinding(zone);
    if(binding && binding.spawn && binding.spawn.system) return String(binding.spawn.system).toLowerCase();
    try{
      if(window.BoneCrawlerZoneSpawnConfig){
        const cfg = BoneCrawlerZoneSpawnConfig.zones && (BoneCrawlerZoneSpawnConfig.zones[zone] || BoneCrawlerZoneSpawnConfig.zones[String(zone)]);
        if(cfg && cfg.spawnSystem) return String(cfg.spawnSystem).toLowerCase();
      }
    }catch(err){}
    return 'legacy';
  }

  function getEditorSnapshot(){
    return clone(bindings);
  }

  window.BoneCrawlerZoneRuntime = {
    getBinding,
    setBinding,
    patchBinding,
    getSpawnSystem,
    getEditorSnapshot,
    bindings
  };
})();
