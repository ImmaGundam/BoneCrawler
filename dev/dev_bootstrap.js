// BoneCrawler combined dev bootstrap + editor bridge
// Drop-in dev/dev_bootstrap.js.
// This file merges bootstrap responsibilities with the editor bridge,
// so the combined toolkit can talk to a single runtime listener.

(function(){
  if(window.__bonecrawlerCombinedBridgeLoaded) return;
  window.__bonecrawlerCombinedBridgeLoaded = true;

  const EDITOR_SOURCE = 'bonecrawler-editor';
  const DEV_PANEL_SOURCE = 'bonecrawler-dev-panel';
  const DEV_GAME_SOURCE = 'bonecrawler-dev';

  const editorSpawnStore = {
    0: [],
    1: [],
    2: [],
    3: [],
    101: [],
    102: []
  };

  const editorZoneSettings = {
    0: { spawnSystem: 'none', resourceFile: 'data/title_scene.json', mapResource: 'data/title_scene.json', progressionSystem: 'none', progressionResource: null, objectResource: 'data/title_scene_objects.json', dialogResource: 'data/title_scene_dialog.json' },
    1: { spawnSystem: 'waves', resourceFile: 'data/zone_1.json', mapResource: 'data/zone_1.json', progressionSystem: 'rules', progressionResource: 'data/zone_1_progression.json', objectResource: 'data/zone_1_objects.json', dialogResource: 'data/zone_1_dialog.json' },
    2: { spawnSystem: 'waves', resourceFile: 'data/zone_2.json', mapResource: 'data/zone_2.json', progressionSystem: 'rules', progressionResource: 'data/zone_2_progression.json', objectResource: 'data/zone_2_objects.json', dialogResource: 'data/zone_2_dialog.json' },
    3: { spawnSystem: 'waves', resourceFile: 'data/zone_3.json', mapResource: 'data/zone_3.json', progressionSystem: 'rules', progressionResource: 'data/zone_3_progression.json', objectResource: 'data/zone_3_objects.json', dialogResource: 'data/zone_3_dialog.json' },
    101: { spawnSystem: 'none', resourceFile: 'data/secret_zone_1.json', mapResource: 'data/secret_zone_1.json', progressionSystem: 'rules', progressionResource: 'data/secret_zone_1_progression.json', objectResource: 'data/secret_zone_1_objects.json', dialogResource: 'data/secret_zone_1_dialog.json' },
    102: { spawnSystem: 'none', resourceFile: 'data/secret_zone_2.json', mapResource: 'data/secret_zone_2.json', progressionSystem: 'rules', progressionResource: 'data/secret_zone_2_progression.json', objectResource: 'data/secret_zone_2_objects.json', dialogResource: 'data/secret_zone_2_dialog.json' }
  };

  const editorWaveStore = {
    0: [],
    1: [],
    2: [],
    3: [],
    101: [],
    102: []
  };

  const editorStandardSpawnStore = {
    1: null,
    2: null,
    3: null
  };

  const editorObjectStore = Object.create(null);
  const labels = {
    zone1Break: [
      'Left Bookshelf', 'Right Bookshelf', 'Broken Table Corner',
      'Top-Right Barrel', 'Bottom-Right Barrel A', 'Bottom-Right Barrel B',
      'Bottom-Right Barrel C', 'Bottom-Right Barrel D', 'Bottom-Right Barrel E'
    ],
    zone2Books: [
      'Left Bookshelf', 'Right Bookshelf'
    ],
    zone2Roots: [
      'Tree Trunk', 'Root Mass Center', 'Lower Root', 'Left Root', 'Right Root'
    ],
    zone3Break: [
      'Left Bookshelf', 'Right Bookshelf', 'Broken Round Table'
    ],
    zone3Trees: [
      'Broken Tree Trunk', 'Broken Tree Root Mass', 'Wall Tree Trunk', 'Wall Tree Root Mass'
    ]
  };

  const zoneNameMap = {
    title: 0,
    title_scene: 0,
    titlescreen: 0,
    scene_title: 0,
    zone0: 0,
    zone1: 1,
    zone2: 2,
    zone3: 3,
    secret1: 101,
    secret2: 102,
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    101: 101,
    102: 102
  };

  const devState = window.__bonecrawlerDevState || (window.__bonecrawlerDevState = {
    godMode: null,
    lastCommand: null,
    lastResult: null
  });

  let registeredDevApi = null;

  function normalizeRegisteredDevApi(api){
    if(!api || typeof api !== 'object') return null;
    const out = {};
    const names = ['toggleGodMode','setGodMode','spawnChest','advanceProgress','skipBossPhase','setStats','gotoZone','getSnapshot'];
    names.forEach(name => {
      if(typeof api[name] === 'function') out[name] = api[name];
    });
    return Object.keys(out).length ? out : null;
  }

  function registerDevApi(api){
    registeredDevApi = normalizeRegisteredDevApi(api);
    window.__bonecrawlerRegisteredDevApi = registeredDevApi;
    return registeredDevApi;
  }

  function getRegisteredDevApi(){
    return registeredDevApi || normalizeRegisteredDevApi(window.__bonecrawlerRegisteredDevApi) || normalizeRegisteredDevApi(window.__bonecrawlerDevApi);
  }

  function callRegisteredDev(method, args){
    const api = getRegisteredDevApi();
    if(!api || typeof api[method] !== 'function') return { called:false, value:undefined };
    try{
      return { called:true, value:api[method].apply(api, Array.isArray(args) ? args : []) };
    }catch(err){
      return { called:false, value:undefined };
    }
  }

  function zoneToApiName(zone){
    const normalized = normalizeZone(zone);
    if(normalized === 1) return 'zone1';
    if(normalized === 2) return 'zone2';
    if(normalized === 3) return 'zone3';
    if(normalized === 101) return 'secret1';
    if(normalized === 102) return 'secret2';
    return null;
  }

  window.__registerBoneCrawlerDevHooks = function(api){
    registerDevApi(api);
    try{ postSnapshot(window.parent); }catch(err){}
    return registeredDevApi;
  };

  window.addEventListener('bonecrawler-dev-api-ready', function(){
    try{ registerDevApi(window.__bonecrawlerDevApi); }catch(err){}
    try{ postSnapshot(window.parent); }catch(err){}
  });

  function deepClone(value){
    if(value == null) return value;
    try { return JSON.parse(JSON.stringify(value)); }
    catch(err){ return value; }
  }

  function isPlainObject(value){
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function deepMerge(base, patch){
    const out = isPlainObject(base) ? deepClone(base) : {};
    if(!isPlainObject(patch)) return out;
    Object.keys(patch).forEach(key => {
      const next = patch[key];
      if(isPlainObject(next) && isPlainObject(out[key])){
        out[key] = deepMerge(out[key], next);
      } else {
        out[key] = deepClone(next);
      }
    });
    return out;
  }

  function cloneRect(r){
    if(!r) return null;
    return {x:r.x, y:r.y, w:r.w, h:r.h};
  }

  function zoneLabel(zone){
    if(Number(zone) === 0) return 'Title Screen';
    if(Number(zone) === 1) return 'Zone 1';
    if(Number(zone) === 2) return 'Zone 2';
    if(Number(zone) === 3) return 'Zone 3';
    if(Number(zone) === 101) return 'Secret Zone 1';
    if(Number(zone) === 102) return 'Secret Zone 2';
    return 'Zone';
  }

  function getCanvasRectData(){
    if(!window.gameCanvas || !window.gameCanvas.getBoundingClientRect) return null;
    const rect = window.gameCanvas.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  function getPlayerRef(){
    if(typeof player !== 'undefined' && player) return player;
    return null;
  }

  function setIfDefined(name, value){
    try{
      if(typeof window[name] !== 'undefined'){
        window[name] = value;
        return true;
      }
    }catch(err){}
    return false;
  }

  function safeCall(names, args){
    const list = Array.isArray(names) ? names : [names];
    for(const name of list){
      try{
        const fn = window[name];
        if(typeof fn === 'function'){
          return { called:true, value:fn.apply(window, args || []) };
        }
      }catch(err){}
    }
    return { called:false, value:undefined };
  }

  function pushRuntimeMessage(text, color){
    try{
      if(typeof pushDevFloat === 'function'){
        pushDevFloat(text, color || ((window.C && C.BN1) ? C.BN1 : '#fff'));
      }
    }catch(err){}
  }

  function normalizeZone(value){
    if(value == null) return null;
    if(typeof value === 'string' && Object.prototype.hasOwnProperty.call(zoneNameMap, value)){
      return zoneNameMap[value];
    }
    const num = Number(value);
    if(Number.isFinite(num) && Object.prototype.hasOwnProperty.call(zoneNameMap, String(num))){
      return zoneNameMap[String(num)];
    }
    return null;
  }

  function ensureObjectStore(id){
    if(!editorObjectStore[id]) editorObjectStore[id] = {};
    return editorObjectStore[id];
  }

  function applyStoredFields(item, stored){
    if(!stored) return item;
    if(isPlainObject(stored.meta)) item.meta = deepMerge(item.meta || {}, stored.meta);
    if(isPlainObject(stored.data)) item.data = deepClone(stored.data);
    if(stored.dialog != null) item.dialog = deepClone(stored.dialog);
    if(stored.conditions != null) item.conditions = deepClone(stored.conditions);
    if(stored.eventType != null) item.eventType = deepClone(stored.eventType);
    if(stored.target != null) item.target = deepClone(stored.target);
    return item;
  }

  function pushItem(list, registry, zone, id, category, label, ref, meta){
    const stored = editorObjectStore[id];
    const item = {
      id,
      zone,
      category,
      label,
      rect: cloneRect(ref),
      meta: deepClone(meta || {})
    };
    applyStoredFields(item, stored);
    list.push(item);
    registry[id] = {
      rectRef: ref,
      zone,
      category,
      label
    };
  }

  function buildZoneObjects(zone, registry){
    const list = [];

    if(zone === 1){
      if(typeof ZONE1_DECOR_BREAK_RECTS !== 'undefined'){
        for(let i=0;i<ZONE1_DECOR_BREAK_RECTS.length;i++){
          pushItem(
            list, registry, zone,
            'zone1-break-' + i,
            'prop',
            labels.zone1Break[i] || ('Zone 1 Prop ' + (i + 1)),
            ZONE1_DECOR_BREAK_RECTS[i],
            {group:'breakable'}
          );
        }
      }
      if(typeof ZONE1_DOOR_RECT !== 'undefined'){
        pushItem(list, registry, zone, 'zone1-door', 'door', 'Zone 1 Door', ZONE1_DOOR_RECT, {group:'door'});
      }
      if(typeof SECRET1_ENTRANCE_RECT !== 'undefined'){
        pushItem(list, registry, zone, 'secret1-entrance', 'trigger', 'Secret Zone 1 Entrance', SECRET1_ENTRANCE_RECT, {group:'trigger'});
      }
    } else if(zone === 2){
      const zone2Objects=(window.BoneCrawlerZoneObjects && typeof BoneCrawlerZoneObjects.getBreakables === 'function')
        ? BoneCrawlerZoneObjects.getBreakables(2)
        : [];
      zone2Objects.forEach((obj,i) => {
        pushItem(
          list, registry, zone,
          obj.id || ('zone2-break-' + i),
          'prop',
          obj.label || labels.zone2Books[i] || ('Zone 2 Breakable ' + (i + 1)),
          obj.breakRect || ZONE2_DECOR_BREAK_RECTS[i],
          {group:'breakable', kind:obj.kind || 'decor'}
        );
      });
      if(typeof ZONE2_TREE_BLOCKERS !== 'undefined'){
        for(let i=0;i<ZONE2_TREE_BLOCKERS.length;i++){
          pushItem(
            list, registry, zone,
            'zone2-root-' + i,
            'prop',
            labels.zone2Roots[i] || ('Zone 2 Prop ' + (i + 1)),
            ZONE2_TREE_BLOCKERS[i],
            {group:'tree'}
          );
        }
      }
    } else if(zone === 3){
      const zone3Objects=(window.BoneCrawlerZoneObjects && typeof BoneCrawlerZoneObjects.getBreakables === 'function')
        ? BoneCrawlerZoneObjects.getBreakables(3)
        : [];
      zone3Objects.forEach((obj,i) => {
        pushItem(
          list, registry, zone,
          obj.id || ('zone3-break-' + i),
          'prop',
          obj.label || labels.zone3Break[i] || ('Zone 3 Breakable ' + (i + 1)),
          obj.breakRect || ZONE3_DECOR_BREAK_RECTS[i],
          {group:'breakable', kind:obj.kind || 'decor'}
        );
      });
      if(typeof ZONE3_TREE_BLOCKERS !== 'undefined'){
        for(let i=0;i<ZONE3_TREE_BLOCKERS.length;i++){
          pushItem(
            list, registry, zone,
            'zone3-tree-' + i,
            'prop',
            labels.zone3Trees[i] || ('Zone 3 Tree Prop ' + (i + 1)),
            ZONE3_TREE_BLOCKERS[i],
            {group:'tree'}
          );
        }
      }
      if(typeof ZONE3_DOOR_RECT !== 'undefined'){
        pushItem(list, registry, zone, 'zone3-door', 'door', 'Zone 3 Door', ZONE3_DOOR_RECT, {group:'door'});
      }
    } else if(zone === 101){
      if(typeof SECRET1_EXIT_DOOR_RECT !== 'undefined'){
        pushItem(list, registry, zone, 'secret1-exit-door', 'door', 'Secret Zone 1 Exit Door', SECRET1_EXIT_DOOR_RECT, {group:'door'});
      }
      if(typeof SECRET1_POOL_WATER_RECT !== 'undefined'){
        pushItem(list, registry, zone, 'secret1-water', 'trigger', 'Secret Zone 1 Pool Water', SECRET1_POOL_WATER_RECT, {group:'trigger'});
      }
    } else if(zone === 102){
      if(typeof SECRET2_SWORD_RECT !== 'undefined'){
        pushItem(list, registry, zone, 'secret2-sword', 'prop', 'Master Sword', SECRET2_SWORD_RECT, {group:'interactable'});
      }
      if(typeof SECRET2_NPC_RECT !== 'undefined'){
        pushItem(list, registry, zone, 'secret2-npc', 'prop', 'Wounded Stranger', SECRET2_NPC_RECT, {group:'interactable'});
      }
      if(typeof SECRET2_RETURN_PORTAL_RECT !== 'undefined'){
        pushItem(list, registry, zone, 'secret2-portal', 'trigger', 'Return Portal', SECRET2_RETURN_PORTAL_RECT, {group:'trigger'});
      }
      if(typeof SECRET2_STONE_BLOCKERS !== 'undefined'){
        for(let i=0;i<SECRET2_STONE_BLOCKERS.length;i++){
          pushItem(list, registry, zone, 'secret2-stone-' + i, 'prop', 'Shrine Base Blocker', SECRET2_STONE_BLOCKERS[i], {group:'blocker'});
        }
      }
    }

    const spawns = editorSpawnStore[zone] || [];
    for(let i=0;i<spawns.length;i++){
      const spawn = spawns[i];
      const stored = editorObjectStore[spawn.id];
      const item = {
        id: spawn.id,
        zone,
        category: 'spawn',
        label: zoneLabel(zone) + ' Spawn (' + spawn.kind + ')',
        rect: cloneRect(spawn),
        meta: {kind: spawn.kind}
      };
      applyStoredFields(item, stored);
      list.push(item);
      registry[spawn.id] = {
        rectRef: spawn,
        zone,
        category: 'spawn',
        label: item.label
      };
    }

    return list;
  }

  function getActiveEditorZone(){
    const state = typeof gState !== 'undefined' ? String(gState) : 'title';

    // Treat menu-only states as their own editor scene so Zone 1 props do not
    // outline over the title screen in the Dev Kit preview. 
    if(state === 'title' || state === 'scoreboard'){
      return 0;
    }

    return typeof currentZone !== 'undefined' ? currentZone : 1;
  }

  function buildEditorState(){
    const registry = {};
    const zones = [0, 1, 2, 3, 101, 102];
    const byZone = {};
    for(const zone of zones){
      byZone[zone] = buildZoneObjects(zone, registry);
    }

    window.__bonecrawlerEditorRegistry = registry;

    return {
      source: EDITOR_SOURCE,
      activeZone: getActiveEditorZone(),
      runtimeZone: typeof currentZone !== 'undefined' ? currentZone : 1,
      gState: typeof gState !== 'undefined' ? gState : 'title',
      player: getPlayerRef() ? {
        x:getPlayerRef().x,
        y:getPlayerRef().y,
        w:getPlayerRef().w,
        h:getPlayerRef().h
      } : null,
      canvasRect: getCanvasRectData(),
      logical: {
        gw: typeof GW !== 'undefined' ? GW : 120,
        gh: typeof GH !== 'undefined' ? GH : 120,
        scale: typeof SCALE !== 'undefined' ? SCALE : 2,
        px: typeof PX !== 'undefined' ? PX : 0,
        py: typeof PY !== 'undefined' ? PY : 0,
        pw: typeof PW !== 'undefined' ? PW : 0,
        ph: typeof PH !== 'undefined' ? PH : 0
      },
      displayZoom: typeof displayZoom !== 'undefined' ? displayZoom : 1,
      zones: byZone,
      editorResources: {
        zoneSettings: deepClone(editorZoneSettings),
        zoneBindings: (window.BoneCrawlerZoneRuntime && typeof BoneCrawlerZoneRuntime.getEditorSnapshot === 'function') ? BoneCrawlerZoneRuntime.getEditorSnapshot() : null,
        spawnSystems: (window.BoneCrawlerSpawnSystems && typeof BoneCrawlerSpawnSystems.list === 'function') ? BoneCrawlerSpawnSystems.list() : null,
        waves: deepClone(editorWaveStore),
        standardSpawns: deepClone(editorStandardSpawnStore),
        waveSystems: (() => {
          const out = {};
          try{
            if(window.BoneCrawlerZoneSpawnConfig && BoneCrawlerZoneSpawnConfig.zones){
              Object.keys(BoneCrawlerZoneSpawnConfig.zones).forEach(zone => {
                const cfg = BoneCrawlerZoneSpawnConfig.zones[zone];
                if(cfg && cfg.waveSystem) out[zone] = deepClone(cfg.waveSystem);
              });
            }
          }catch(err){}
          return out;
        })()
      },
      thresholds: {
        dragonZone2LocalKills: typeof DRAGON_BOSS_TRIGGER_KILLS !== 'undefined' ? DRAGON_BOSS_TRIGGER_KILLS : null,
        zone3BossKills: typeof ZONE3_BOSS_TRIGGER_KILLS !== 'undefined' ? ZONE3_BOSS_TRIGGER_KILLS : null,
        secret2Score: typeof SECRET2_SCORE_REQ !== 'undefined' ? SECRET2_SCORE_REQ : null
      }
    };
  }

  function postEditorState(target){
    const payload = {
      type: 'bc_editor_state',
      state: buildEditorState()
    };
    (target || window.parent).postMessage(payload, '*');
  }

  function ensureSpawnZone(zone){
    zone = Number(zone);
    if(!editorSpawnStore[zone]) editorSpawnStore[zone] = [];
    return editorSpawnStore[zone];
  }

  function ensureZoneSettings(zone){
    zone = Number(zone);
    if(!editorZoneSettings[zone]) editorZoneSettings[zone] = { spawnSystem: 'standard', resourceFile: null, progressionSystem: 'rules', progressionResource: null, objectResource: null, dialogResource: null };
    return editorZoneSettings[zone];
  }

  function ensureWaveZone(zone){
    zone = Number(zone);
    if(!editorWaveStore[zone]) editorWaveStore[zone] = [];
    return editorWaveStore[zone];
  }

  function cloneSpawnPoint(spawn){
    if(!spawn) return null;
    return {
      id: spawn.id,
      label: spawn.label || spawn.id,
      x: Math.round(Number(spawn.x) || 0),
      y: Math.round(Number(spawn.y) || 0),
      w: Math.max(1, Math.round(Number(spawn.w) || 8)),
      h: Math.max(1, Math.round(Number(spawn.h) || 8)),
      kind: spawn.kind || 'normal',
      mode: spawn.mode || 'map',
      side: spawn.side || null,
      defaultAnimation: spawn.defaultAnimation || null,
      allowedEnemies: Array.isArray(spawn.allowedEnemies) ? deepClone(spawn.allowedEnemies) : undefined
    };
  }

  function normalizeWave(wave, zone){
    const out = isPlainObject(wave) ? deepClone(wave) : {};
    if(!out.id) out.id = 'wave-' + zone + '-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    if(!out.name) out.name = 'New Wave';
    if(!Array.isArray(out.spawns)) out.spawns = [];
    if(!out.clearCondition) out.clearCondition = 'allEnemiesDefeated';
    return out;
  }

  function applyImportedZoneData(zone, zoneData){
    zone = normalizeZone(zone);
    if(zone == null || !isPlainObject(zoneData)) return false;

    const settings = ensureZoneSettings(zone);
    if(zoneData.spawnSystem != null) settings.spawnSystem = String(zoneData.spawnSystem || 'standard');
    if(zoneData.resourceFile != null) settings.resourceFile = String(zoneData.resourceFile || '');
    if(zoneData.mapResource != null) settings.mapResource = String(zoneData.mapResource || '');
    if(zoneData.progressionSystem != null) settings.progressionSystem = String(zoneData.progressionSystem || 'rules');
    if(zoneData.progressionResource != null) settings.progressionResource = String(zoneData.progressionResource || '');
    if(zoneData.objectResource != null) settings.objectResource = String(zoneData.objectResource || '');
    if(zoneData.dialogResource != null) settings.dialogResource = String(zoneData.dialogResource || '');

    const incomingSpawns = Array.isArray(zoneData.spawnPoints) ? zoneData.spawnPoints :
      (Array.isArray(zoneData.spawns) ? zoneData.spawns : null);

    if(incomingSpawns){
      editorSpawnStore[zone] = incomingSpawns.map((spawn, index) => ({
        id: spawn.id || ('spawn-' + zone + '-' + Date.now() + '-' + index),
        label: spawn.label || spawn.id || ('Spawn ' + (index + 1)),
        x: Math.round(Number(spawn.x) || 0),
        y: Math.round(Number(spawn.y) || 0),
        w: Math.max(1, Math.round(Number(spawn.w) || 8)),
        h: Math.max(1, Math.round(Number(spawn.h) || 8)),
        kind: spawn.kind || spawn.enemyKind || 'normal',
        mode: spawn.mode || 'map',
        side: spawn.side || null,
        defaultAnimation: spawn.defaultAnimation || spawn.animation || null,
        allowedEnemies: Array.isArray(spawn.allowedEnemies) ? deepClone(spawn.allowedEnemies) : undefined
      }));
    }

    if(Array.isArray(zoneData.waves)){
      editorWaveStore[zone] = zoneData.waves.map(wave => normalizeWave(wave, zone));
    }
    if(zoneData.standardSpawn && typeof zoneData.standardSpawn === 'object'){
      editorStandardSpawnStore[zone] = deepClone(zoneData.standardSpawn);
      try{
        if(window.BoneCrawlerZoneSpawnConfig && BoneCrawlerZoneSpawnConfig.zones){
          if(!BoneCrawlerZoneSpawnConfig.zones[zone]) BoneCrawlerZoneSpawnConfig.zones[zone] = {};
          BoneCrawlerZoneSpawnConfig.zones[zone].standard = deepClone(zoneData.standardSpawn);
        }
      }catch(err){}
    }

    if(zoneData.statScaling && typeof zoneData.statScaling === 'object'){
      try{
        if(window.BoneCrawlerZoneSpawnConfig && BoneCrawlerZoneSpawnConfig.zones){
          if(!BoneCrawlerZoneSpawnConfig.zones[zone]) BoneCrawlerZoneSpawnConfig.zones[zone] = {};
          BoneCrawlerZoneSpawnConfig.zones[zone].statScaling = deepClone(zoneData.statScaling);
        }
      }catch(err){}
    }

    if(zoneData.waveSystem && typeof zoneData.waveSystem === 'object'){
      try{
        if(window.BoneCrawlerZoneSpawnConfig && BoneCrawlerZoneSpawnConfig.zones){
          if(!BoneCrawlerZoneSpawnConfig.zones[zone]) BoneCrawlerZoneSpawnConfig.zones[zone] = {};
          BoneCrawlerZoneSpawnConfig.zones[zone].waveSystem = deepClone(zoneData.waveSystem);
        }
      }catch(err){}
    }

    try{
      if(window.BoneCrawlerZoneRuntime && typeof BoneCrawlerZoneRuntime.patchBinding === 'function'){
        BoneCrawlerZoneRuntime.patchBinding(zone, {
          map: {resource: settings.mapResource || settings.resourceFile || null},
          spawn: {system: settings.spawnSystem || 'standard', resource: settings.resourceFile || null},
          progression: {system: settings.progressionSystem || 'rules', resource: settings.progressionResource || null},
          objects: {resource: settings.objectResource || null},
          dialog: {resource: settings.dialogResource || null}
        });
      }
    }catch(err){}

    if(Array.isArray(zoneData.objects)){
      zoneData.objects.forEach(item => {
        if(!item || !item.id) return;
        const stored = ensureObjectStore(item.id);
        if(item.data != null) stored.data = deepClone(item.data);
        if(item.meta != null) stored.meta = deepClone(item.meta);
        if(item.dialog != null) stored.dialog = deepClone(item.dialog);
        if(item.conditions != null) stored.conditions = deepClone(item.conditions);
        if(item.eventType != null) stored.eventType = deepClone(item.eventType);
        if(item.target != null) stored.target = deepClone(item.target);
      });
    }

    return true;
  }

  function addWave(zone, wave){
    zone = normalizeZone(zone);
    if(zone == null) return null;
    const item = normalizeWave(wave || {}, zone);
    ensureWaveZone(zone).push(item);
    return item;
  }

  function removeWave(zone, waveId){
    zone = normalizeZone(zone);
    if(zone == null || !waveId) return false;
    const list = ensureWaveZone(zone);
    const next = list.filter(wave => wave.id !== waveId);
    const removed = next.length !== list.length;
    editorWaveStore[zone] = next;
    return removed;
  }

  function setWaves(zone, waves){
    zone = normalizeZone(zone);
    if(zone == null) return false;
    editorWaveStore[zone] = Array.isArray(waves) ? waves.map(wave => normalizeWave(wave, zone)) : [];
    return true;
  }

  function addSpawnMarker(zone, kind, x, y){
    const list = ensureSpawnZone(zone);
    const marker = {
      id: 'spawn-' + zone + '-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      x: Math.round(Number(x) || 0),
      y: Math.round(Number(y) || 0),
      w: 8,
      h: 8,
      kind: kind || 'normal'
    };
    list.push(marker);
    return marker;
  }

  function removeSpawnMarker(id){
    for(const zoneKey of Object.keys(editorSpawnStore)){
      const list = editorSpawnStore[zoneKey];
      const idx = list.findIndex(item => item.id === id);
      if(idx >= 0){
        list.splice(idx, 1);
        delete editorObjectStore[id];
        return true;
      }
    }
    return false;
  }

  function spawnImmediate(kind, x, y){
    if(typeof enemies === 'undefined' || !Array.isArray(enemies)) return false;
    const baseScore = typeof score !== 'undefined' ? score : 0;
    const spd = Math.min(0.68, 0.22 + Math.sqrt(baseScore) * 0.035);

    if(kind === 'wizard'){
      enemies.push({
        x:Math.round(x), y:Math.round(y), w:8, h:8, speed:spd*0.45, dir:'left',
        atkT:0, atkCD:160+(Math.random()*60|0), walkF:0,
        hp:1, points:3, giant:false, wizard:true, hurtT:0, shootCD:0
      });
    } else if(kind === 'giant'){
      enemies.push({
        x:Math.round(x), y:Math.round(y), w:18, h:18, speed:spd*0.65, dir:'left',
        atkT:0, atkCD:95+(Math.random()*50|0), walkF:0,
        hp:3, points:5, giant:true, hurtT:0, variant:Math.random()<0.5?'old':'new'
      });
    } else {
      const normalVariants=['old','new','classic'];
      enemies.push({
        x:Math.round(x), y:Math.round(y), w:9, h:9, speed:spd, dir:'left',
        atkT:0, atkCD:92+(Math.random()*55|0), walkF:0,
        hp:1, points:1, giant:false, hurtT:0,
        variant:normalVariants[(Math.random()*normalVariants.length)|0]
      });
    }
    pushRuntimeMessage('SPAWNED ' + String(kind || 'normal').toUpperCase());
    return true;
  }

  function updateObjectRect(id, patch){
    const registry = window.__bonecrawlerEditorRegistry || {};
    const record = registry[id];
    const ref = record && record.rectRef;
    if(!ref) return false;
    ['x', 'y', 'w', 'h'].forEach(key => {
      if(Object.prototype.hasOwnProperty.call(patch || {}, key)){
        const value = Number(patch[key]);
        if(Number.isFinite(value)) ref[key] = Math.round(value);
      }
    });
    return true;
  }

  function updateObjectData(id, data, mode){
    const store = ensureObjectStore(id);
    if(mode === 'replace'){
      store.data = isPlainObject(data) ? deepClone(data) : {};
      if(store.data.dialog != null) store.dialog = deepClone(store.data.dialog);
      if(store.data.conditions != null) store.conditions = deepClone(store.data.conditions);
      if(store.data.eventType != null) store.eventType = deepClone(store.data.eventType);
      if(store.data.target != null) store.target = deepClone(store.data.target);
      return true;
    }
    if(mode === 'patch'){
      store.data = deepMerge(store.data || {}, data || {});
      if(store.data.dialog != null) store.dialog = deepClone(store.data.dialog);
      if(store.data.conditions != null) store.conditions = deepClone(store.data.conditions);
      if(store.data.eventType != null) store.eventType = deepClone(store.data.eventType);
      if(store.data.target != null) store.target = deepClone(store.data.target);
      return true;
    }
    if(mode === 'meta'){
      store.meta = deepMerge(store.meta || {}, data || {});
      store.data = deepMerge(store.data || {}, data || {});
      if(store.data.dialog != null) store.dialog = deepClone(store.data.dialog);
      if(store.data.conditions != null) store.conditions = deepClone(store.data.conditions);
      if(store.data.eventType != null) store.eventType = deepClone(store.data.eventType);
      if(store.data.target != null) store.target = deepClone(store.data.target);
      return true;
    }
    return false;
  }

  function exportZoneObjects(zone){
    const registry = {};
    return buildZoneObjects(zone, registry).map(item => ({
      id: item.id,
      zone: item.zone,
      category: item.category,
      label: item.label,
      rect: cloneRect(item.rect),
      meta: deepClone(item.meta || {}),
      data: deepClone(item.data || undefined),
      dialog: deepClone(item.dialog || undefined),
      conditions: deepClone(item.conditions || undefined),
      eventType: item.eventType,
      target: item.target
    }));
  }

  function exportZoneData(zone){
    const settings = ensureZoneSettings(zone);
    const spawnPoints = (editorSpawnStore[zone] || []).map(cloneSpawnPoint);

    const base = {
      zoneId: zone,
      name: zoneLabel(zone),
      resourceFile: settings.resourceFile || null,
      spawnSystem: settings.spawnSystem || 'standard',
      mapResource: settings.mapResource || settings.resourceFile || null,
      progressionSystem: settings.progressionSystem || 'rules',
      progressionResource: settings.progressionResource || null,
      objectResource: settings.objectResource || null,
      dialogResource: settings.dialogResource || null,
      spawnPoints,
      statScaling: deepClone(window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.getZoneConfig === 'function' && BoneCrawlerZoneSpawn.getZoneConfig(zone) ? BoneCrawlerZoneSpawn.getZoneConfig(zone).statScaling || null : null),
      waveSystem: deepClone(window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.getZoneConfig === 'function' && BoneCrawlerZoneSpawn.getZoneConfig(zone) ? BoneCrawlerZoneSpawn.getZoneConfig(zone).waveSystem || null : null),
      standardSpawn: deepClone(editorStandardSpawnStore[zone] || (window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.getStandardConfig === 'function' ? BoneCrawlerZoneSpawn.getStandardConfig(zone) : null)),
      waves: deepClone(editorWaveStore[zone] || []),
      objects: exportZoneObjects(zone)
    };

    if(zone === 1){
      base.breakables = typeof ZONE1_DECOR_BREAK_RECTS !== 'undefined' ? ZONE1_DECOR_BREAK_RECTS.map(cloneRect) : [];
      base.door = typeof ZONE1_DOOR_RECT !== 'undefined' ? cloneRect(ZONE1_DOOR_RECT) : null;
      base.secretEntrance = typeof SECRET1_ENTRANCE_RECT !== 'undefined' ? cloneRect(SECRET1_ENTRANCE_RECT) : null;
    } else if(zone === 2){
      base.props = typeof ZONE2_TREE_BLOCKERS !== 'undefined' ? ZONE2_TREE_BLOCKERS.map(cloneRect) : [];
      base.breakables = typeof ZONE2_DECOR_BREAK_RECTS !== 'undefined' ? ZONE2_DECOR_BREAK_RECTS.map(cloneRect) : [];
    } else if(zone === 3){
      base.breakables = typeof ZONE3_DECOR_BREAK_RECTS !== 'undefined' ? ZONE3_DECOR_BREAK_RECTS.map(cloneRect) : [];
      base.treeProps = typeof ZONE3_TREE_BLOCKERS !== 'undefined' ? ZONE3_TREE_BLOCKERS.map(cloneRect) : [];
      base.door = typeof ZONE3_DOOR_RECT !== 'undefined' ? cloneRect(ZONE3_DOOR_RECT) : null;
    } else if(zone === 101){
      base.exitDoor = typeof SECRET1_EXIT_DOOR_RECT !== 'undefined' ? cloneRect(SECRET1_EXIT_DOOR_RECT) : null;
      base.poolWater = typeof SECRET1_POOL_WATER_RECT !== 'undefined' ? cloneRect(SECRET1_POOL_WATER_RECT) : null;
    } else if(zone === 102){
      base.sword = typeof SECRET2_SWORD_RECT !== 'undefined' ? cloneRect(SECRET2_SWORD_RECT) : null;
      base.npc = typeof SECRET2_NPC_RECT !== 'undefined' ? cloneRect(SECRET2_NPC_RECT) : null;
      base.portal = typeof SECRET2_RETURN_PORTAL_RECT !== 'undefined' ? cloneRect(SECRET2_RETURN_PORTAL_RECT) : null;
      base.blockers = typeof SECRET2_STONE_BLOCKERS !== 'undefined' ? SECRET2_STONE_BLOCKERS.map(cloneRect) : [];
    }

    // Legacy alias, kept so older toolkit code that expects `spawns` still works.
    base.spawns = spawnPoints.map(point => ({...cloneRect(point), kind: point.kind, id: point.id}));

    return base;
  }

  function exportLayout(){
    const zones = {
      0: exportZoneData(0),
      1: exportZoneData(1),
      2: exportZoneData(2),
      3: exportZoneData(3),
      101: exportZoneData(101),
      102: exportZoneData(102)
    };

    return {
      resourceType: 'bonecrawler-project-data',
      version: 2,
      exportedAt: new Date().toISOString(),
      editor: {
        source: EDITOR_SOURCE,
        format: 'resource-data',
        zoneSettings: deepClone(editorZoneSettings)
      },
      zones
    };
  }

  function getSnapshot(){
    const apiSnapshot = callRegisteredDev('getSnapshot', []);
    if(apiSnapshot.called && apiSnapshot.value && typeof apiSnapshot.value === 'object'){
      const snap = deepClone(apiSnapshot.value);
      const p = getPlayerRef();
      const snapState = snap.state != null ? snap.state : (typeof gState !== 'undefined' ? gState : 'title');
      const snapRuntimeZone = snap.zone != null ? snap.zone : (typeof currentZone !== 'undefined' ? currentZone : 1);
      return {
        state: snapState,
        zone: (snapState === 'title' || snapState === 'scoreboard') ? 0 : snapRuntimeZone,
        runtimeZone: snapRuntimeZone,
        score: snap.score != null ? snap.score : 0,
        kills: snap.kills != null ? snap.kills : 0,
        normalKills: snap.normalKills != null ? snap.normalKills : 0,
        giantKills: snap.giantKills != null ? snap.giantKills : 0,
        wizardKills: snap.wizardKills != null ? snap.wizardKills : 0,
        swordLevel: snap.swordLevel != null ? snap.swordLevel : 0,
        speedLevel: snap.speedLevel != null ? snap.speedLevel : 0,
        playerSpeed: snap.playerSpeed != null ? snap.playerSpeed : (p && typeof p.speed !== 'undefined' ? p.speed : null),
        dragonActive: snap.dragonActive != null ? !!snap.dragonActive : false,
        dragonPhase: snap.dragonPhase != null ? snap.dragonPhase : null,
        dragonHp: snap.dragonHp != null ? snap.dragonHp : null,
        bossDefeated: snap.bossDefeated != null ? !!snap.bossDefeated : false,
        godMode: snap.godMode != null ? !!snap.godMode : false,
        playerHp: snap.playerHp != null ? snap.playerHp : (p && typeof p.hp !== 'undefined' ? p.hp : null),
        playerMaxHp: snap.playerMaxHp != null ? snap.playerMaxHp : (p && typeof p.maxHp !== 'undefined' ? p.maxHp : null),
        playerX: snap.playerX != null ? snap.playerX : (p && typeof p.x !== 'undefined' ? p.x : null),
        playerY: snap.playerY != null ? snap.playerY : (p && typeof p.y !== 'undefined' ? p.y : null),
        available: {
          toggleGod: true,
          gotoZone: true,
          setStats: true,
          advanceProgress: true,
          spawnChest: true,
          skipBossPhase: true
        }
      };
    }

    const p = getPlayerRef();
    const localGodMode = (
      typeof devGodMode !== 'undefined' ? !!devGodMode :
      typeof godMode !== 'undefined' ? !!godMode :
      typeof GOD_MODE !== 'undefined' ? !!GOD_MODE :
      typeof invincible !== 'undefined' ? !!invincible :
      (p && (p.godMode || p.invincible || p.invuln)) ? true :
      devState.godMode === null ? false : !!devState.godMode
    );

    const runtimeZone = typeof currentZone !== 'undefined' ? currentZone : 1;
    return {
      state: typeof gState !== 'undefined' ? gState : 'title',
      zone: getActiveEditorZone(),
      runtimeZone,
      score: typeof score !== 'undefined' ? score : 0,
      kills: typeof killCount !== 'undefined' ? killCount : (typeof kills !== 'undefined' ? kills : 0),
      normalKills: typeof normalKillCount !== 'undefined' ? normalKillCount : (typeof normalKills !== 'undefined' ? normalKills : (typeof skeletonKills !== 'undefined' ? skeletonKills : 0)),
      giantKills: typeof giantKillCount !== 'undefined' ? giantKillCount : (typeof giantKills !== 'undefined' ? giantKills : 0),
      wizardKills: typeof wizardKillCount !== 'undefined' ? wizardKillCount : (typeof wizardKills !== 'undefined' ? wizardKills : 0),
      swordLevel: (p && typeof p.swordLevel !== 'undefined') ? p.swordLevel : (typeof swordLevel !== 'undefined' ? swordLevel : 0),
      speedLevel: (p && typeof p.speedLevel !== 'undefined') ? p.speedLevel : (typeof speedLevel !== 'undefined' ? speedLevel : 0),
      playerSpeed: (p && typeof p.speed !== 'undefined') ? p.speed : (typeof playerSpeed !== 'undefined' ? playerSpeed : null),
      dragonActive: typeof dragonBoss !== 'undefined' ? !!dragonBoss : (typeof dragonActive !== 'undefined' ? !!dragonActive : (typeof bossActive !== 'undefined' ? !!bossActive : false)),
      dragonPhase: typeof dragonBoss !== 'undefined' && dragonBoss ? dragonBoss.phase : (typeof dragonPhase !== 'undefined' ? dragonPhase : (typeof bossPhase !== 'undefined' ? bossPhase : null)),
      dragonHp: typeof dragonBoss !== 'undefined' && dragonBoss ? dragonBoss.hp : (typeof dragonHp !== 'undefined' ? dragonHp : (typeof bossHp !== 'undefined' ? bossHp : null)),
      bossDefeated: typeof bossDefeated !== 'undefined' ? !!bossDefeated : (typeof dragonDefeated !== 'undefined' ? !!dragonDefeated : false),
      godMode: localGodMode,
      playerHp: p && typeof p.hp !== 'undefined' ? p.hp : (typeof playerHp !== 'undefined' ? playerHp : null),
      playerMaxHp: p && typeof p.maxHp !== 'undefined' ? p.maxHp : (typeof playerMaxHp !== 'undefined' ? playerMaxHp : null),
      playerX: p && typeof p.x !== 'undefined' ? p.x : null,
      playerY: p && typeof p.y !== 'undefined' ? p.y : null,
      available: {
        toggleGod: true,
        gotoZone: true,
        setStats: true,
        advanceProgress: true,
        spawnChest: true,
        skipBossPhase: true
      }
    };
  }

  function postSnapshot(target){
    const payload = {
      source: DEV_GAME_SOURCE,
      type: 'snapshot',
      snapshot: getSnapshot()
    };
    (target || window.parent).postMessage(payload, '*');
  }

  function applyGodMode(enabled){
    devState.godMode = !!enabled;

    const apiSet = callRegisteredDev('setGodMode', [!!enabled]);
    if(apiSet.called){
      pushRuntimeMessage('GOD MODE ' + (enabled ? 'ON' : 'OFF'));
      return true;
    }

    const apiToggle = callRegisteredDev('toggleGodMode', []);
    if(apiToggle.called){
      pushRuntimeMessage('GOD MODE TOGGLED');
      return true;
    }

    safeCall(['setDevGodMode'], [!!enabled]);
    setIfDefined('devGodMode', !!enabled);
    setIfDefined('godMode', !!enabled);
    setIfDefined('GOD_MODE', !!enabled);
    setIfDefined('invincible', !!enabled);
    const p = getPlayerRef();
    if(p){
      try{ p.godMode = !!enabled; }catch(err){}
      try{ p.invincible = !!enabled; }catch(err){}
      try{ p.invuln = !!enabled; }catch(err){}
      try{ if(!!enabled && typeof p.maxHp !== 'undefined') p.hp = p.maxHp; }catch(err){}
      try{ p.dead = false; }catch(err){}
    }
    pushRuntimeMessage('GOD MODE ' + (enabled ? 'ON' : 'OFF'));
    return true;
  }

  function toggleGodMode(){
    const current = getSnapshot().godMode;
    return applyGodMode(!current);
  }

  function transportToZone(zoneInput){
    const zone = normalizeZone(zoneInput);
    if(zone == null) return false;

    const apiZoneName = zoneToApiName(zone);
    if(apiZoneName){
      const apiMove = callRegisteredDev('gotoZone', [apiZoneName]);
      if(apiMove.called){
        pushRuntimeMessage('MOVED TO ' + zoneLabel(zone).toUpperCase());
        return true;
      }
    }

    try{
      if(typeof resetGame === 'function') resetGame();
    }catch(err){}
    try{
      if(zone === 1){
        if(typeof devGotoZone === 'function') devGotoZone('zone1');
        else if(typeof currentZone !== 'undefined') currentZone = 1;
      } else if(zone === 2){
        if(typeof devGotoZone === 'function') devGotoZone('zone2');
        else if(typeof enterZone2 === 'function') enterZone2();
        else if(typeof currentZone !== 'undefined') currentZone = 2;
      } else if(zone === 3){
        if(typeof devGotoZone === 'function') devGotoZone('zone3');
        else if(typeof enterZone3 === 'function') enterZone3();
        else if(typeof currentZone !== 'undefined') currentZone = 3;
      } else if(zone === 101){
        if(typeof devGotoZone === 'function') devGotoZone('secret1');
        else if(typeof enterSecretZone1 === 'function') enterSecretZone1();
        else if(typeof currentZone !== 'undefined') currentZone = 101;
      } else if(zone === 102){
        if(typeof devGotoZone === 'function') devGotoZone('secret2');
        else if(typeof enterSecretZone2 === 'function') enterSecretZone2();
        else if(typeof currentZone !== 'undefined') currentZone = 102;
      }
      if(typeof clearGameplayKeys === 'function') clearGameplayKeys();
      if(typeof gState !== 'undefined') gState = 'playing';
      pushRuntimeMessage('MOVED TO ' + zoneLabel(zone).toUpperCase());
      return true;
    }catch(err){
      return false;
    }
  }

  function setStats(stats){
    const payload = isPlainObject(stats) ? stats : {};

    const apiSet = callRegisteredDev('setStats', [payload]);
    if(apiSet.called){
      pushRuntimeMessage('STATS UPDATED');
      return true;
    }

    const direct = safeCall(['devSetEditableStats'], [payload]);
    if(direct.called){
      pushRuntimeMessage('STATS UPDATED');
      return true;
    }

    const p = getPlayerRef();

    if(Object.prototype.hasOwnProperty.call(payload, 'sword')){
      const value = Math.max(0, Math.floor(Number(payload.sword) || 0));
      if(p && typeof p.swordLevel !== 'undefined') p.swordLevel = value;
      setIfDefined('swordLevel', value);
    }

    if(Object.prototype.hasOwnProperty.call(payload, 'speed')){
      const value = Math.max(0, Math.floor(Number(payload.speed) || 0));
      if(p && typeof p.speedLevel !== 'undefined') p.speedLevel = value;
      setIfDefined('speedLevel', value);
    }

    if(Object.prototype.hasOwnProperty.call(payload, 'points')){
      const value = Math.max(0, Math.floor(Number(payload.points) || 0));
      setIfDefined('score', value);
    }

    if(Object.prototype.hasOwnProperty.call(payload, 'kills')){
      const value = Math.max(0, Math.floor(Number(payload.kills) || 0));
      setIfDefined('killCount', value);
      setIfDefined('kills', value);
      safeCall(['syncDevKillThresholds'], []);
    }

    safeCall(['refreshPlayerStats', 'recalculateStats', 'applyUpgradeStats'], []);
    pushRuntimeMessage('STATS UPDATED');
    return true;
  }

  function advanceProgress(){
    const apiAdvance = callRegisteredDev('advanceProgress', []);
    if(apiAdvance.called) return true;
    const current = normalizeZone(typeof currentZone !== 'undefined' ? currentZone : 1) || 1;
    const explicit = safeCall(['advanceProgress', 'advanceRunProgress', 'skipAhead', 'advanceToNextZone', 'devAdvanceProgress'], []);
    if(explicit.called) return true;
    if(current === 1) return transportToZone(2);
    if(current === 2) return transportToZone(3);
    if(current === 3) return transportToZone(102);
    return false;
  }

  function spawnChest(){
    const apiSpawn = callRegisteredDev('spawnChest', []);
    if(apiSpawn.called) return true;
    const direct = safeCall(['spawnChest', 'spawnTreasureChest', 'devSpawnChest', 'devSpawnChestAtPlayer'], []);
    if(direct.called) return true;
    const p = getPlayerRef();
    if(Array.isArray(window.chests) && p){
      window.chests.push({
        x: Math.round(p.x + 8),
        y: Math.round(p.y),
        w: 10,
        h: 10,
        opened: false,
        devSpawned: true
      });
      pushRuntimeMessage('CHEST SPAWNED');
      return true;
    }
    return false;
  }

  function skipBossPhase(){
    const apiSkip = callRegisteredDev('skipBossPhase', []);
    if(apiSkip.called) return true;
    const direct = safeCall(['skipBossPhase', 'devSkipBossPhase'], []);
    if(direct.called) return true;
    let changed = false;
    if(typeof dragonPhase !== 'undefined'){
      window.dragonPhase = Number(dragonPhase || 0) + 1;
      changed = true;
    } else if(typeof bossPhase !== 'undefined'){
      window.bossPhase = Number(bossPhase || 0) + 1;
      changed = true;
    }
    if(changed){
      pushRuntimeMessage('BOSS PHASE SKIPPED');
      return true;
    }
    return false;
  }

  function handleDevCommand(command, replyTarget){
    const cmd = isPlainObject(command) ? command : {};
    devState.lastCommand = deepClone(cmd);
    let handled = false;

    if(cmd.type === 'request_snapshot'){
      handled = true;
    } else if(cmd.type === 'toggle_god_mode'){
      handled = toggleGodMode();
    } else if(cmd.type === 'goto_zone'){
      handled = transportToZone(cmd.zone);
    } else if(cmd.type === 'set_stats'){
      handled = setStats(cmd.stats);
    } else if(cmd.type === 'advance_progress'){
      handled = advanceProgress();
    } else if(cmd.type === 'spawn_chest'){
      handled = spawnChest();
    } else if(cmd.type === 'skip_boss_phase'){
      handled = skipBossPhase();
    }

    devState.lastResult = handled;
    postSnapshot(replyTarget);
    return handled;
  }

  function extractDevCommandFromMessage(data){
    if(!data || typeof data !== 'object') return null;
    if(data.source !== DEV_PANEL_SOURCE) return null;
    if(isPlainObject(data.command)) return data.command;
    if(data.type === 'bonecrawler_dev_command' && isPlainObject(data.command)) return data.command;
    const possible = [
      'request_snapshot',
      'toggle_god_mode',
      'goto_zone',
      'set_stats',
      'advance_progress',
      'spawn_chest',
      'skip_boss_phase'
    ];
    if(typeof data.type === 'string' && possible.indexOf(data.type) >= 0){
      return deepClone(data);
    }
    return null;
  }

  function handleEditorMessage(data, replyTarget){
    if(!data || data.source !== EDITOR_SOURCE) return false;

    if(data.type === 'bc_editor_request_state'){
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_set_zone'){
      transportToZone(data.zone);
      postEditorState(replyTarget);
      postSnapshot(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_update_object'){
      updateObjectRect(data.id, data.patch || {});
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_update_object_data'){
      updateObjectData(data.id, data.data || {}, 'replace');
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_update_object_meta'){
      updateObjectData(data.id, data.meta || {}, 'meta');
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_patch_object_data'){
      updateObjectData(data.id, data.patch || {}, 'patch');
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_add_spawn'){
      addSpawnMarker(data.zone, data.kind, data.x, data.y);
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_remove_spawn'){
      removeSpawnMarker(data.id);
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_spawn_now'){
      spawnImmediate(data.kind, data.x, data.y);
      postEditorState(replyTarget);
      postSnapshot(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_set_spawn_system'){
      const zone = normalizeZone(data.zone);
      if(zone != null){
        const settings = ensureZoneSettings(zone);
        settings.spawnSystem = data.spawnSystem || 'standard';
        if(data.progressionSystem != null) settings.progressionSystem = data.progressionSystem || 'rules';
        if(data.progressionResource != null) settings.progressionResource = data.progressionResource || null;
        if(data.objectResource != null) settings.objectResource = data.objectResource || null;
        if(data.dialogResource != null) settings.dialogResource = data.dialogResource || null;
        try{
          if(window.BoneCrawlerZoneRuntime && typeof BoneCrawlerZoneRuntime.patchBinding === 'function'){
            BoneCrawlerZoneRuntime.patchBinding(zone, {
              spawn: {system: settings.spawnSystem || 'standard', resource: settings.resourceFile || null},
              progression: {system: settings.progressionSystem || 'rules', resource: settings.progressionResource || null},
              objects: {resource: settings.objectResource || null},
              dialog: {resource: settings.dialogResource || null}
            });
            if(window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.enterZone === 'function' && typeof currentZone !== 'undefined' && Number(currentZone) === Number(zone)){
              BoneCrawlerZoneSpawn.enterZone(zone, {spawnSystemChanged:true});
            }
          }
        }catch(err){}
      }
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_set_waves'){
      setWaves(data.zone, data.waves || []);
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_add_wave'){
      addWave(data.zone, data.wave || null);
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_remove_wave'){
      removeWave(data.zone, data.waveId);
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_import_resource'){
      const resource = isPlainObject(data.resource) ? data.resource : {};
      if(isPlainObject(resource.zones)){
        Object.keys(resource.zones).forEach(zoneKey => applyImportedZoneData(zoneKey, resource.zones[zoneKey]));
      } else if(resource.zoneId != null){
        applyImportedZoneData(resource.zoneId, resource);
      }
      postEditorState(replyTarget);
      return true;
    }

    if(data.type === 'bc_editor_export'){
      (replyTarget || window.parent).postMessage({
        type: 'bc_editor_export_result',
        source: EDITOR_SOURCE,
        exportData: exportLayout()
      }, '*');
      return true;
    }

    return false;
  }

  function handleMessageEvent(event){
    const data = event && event.data ? event.data : {};
    if(handleEditorMessage(data, event.source)) return;
    const cmd = extractDevCommandFromMessage(data);
    if(cmd) handleDevCommand(cmd, event.source);
  }

  function handleDevEventObject(detail){
    const cmd = isPlainObject(detail) ? detail : null;
    if(cmd) handleDevCommand(cmd, window.parent);
  }

  if(typeof doSpawn === 'function' && !window.__bonecrawlerSpawnOverridden){
    window.__bonecrawlerSpawnOverridden = true;
    const defaultDoSpawn = doSpawn;
    window.doSpawn = function(giant, wizard){
      const zone = typeof currentZone !== 'undefined' ? currentZone : 1;
      const markers = ensureSpawnZone(zone);
      let pool = markers;
      if(wizard){
        const filtered = markers.filter(item => item.kind === 'wizard');
        if(filtered.length) pool = filtered;
      } else if(giant){
        const filtered = markers.filter(item => item.kind === 'giant');
        if(filtered.length) pool = filtered;
      } else {
        const filtered = markers.filter(item => item.kind === 'normal');
        if(filtered.length) pool = filtered;
      }

      if(pool && pool.length && typeof enemies !== 'undefined'){
        const marker = pool[Math.floor(Math.random() * pool.length)];
        return spawnImmediate(wizard ? 'wizard' : (giant ? 'giant' : 'normal'), marker.x, marker.y);
      }

      return defaultDoSpawn.apply(this, arguments);
    };
  }

  window.BoneCrawlerEditorAPI = {
    buildEditorState,
    transportToZone,
    updateObjectRect,
    updateObjectData,
    addSpawnMarker,
    removeSpawnMarker,
    addWave,
    removeWave,
    setWaves,
    applyImportedZoneData,
    spawnImmediate,
    exportZoneData,
    exportLayout
  };

  window.__bonecrawlerReceiveDevCommand = function(command){
    return handleDevCommand(command, window.parent);
  };
  window.handleBoneCrawlerDevCommand = window.__bonecrawlerReceiveDevCommand;
  window.BoneCrawlerDevAPI = {
    getSnapshot,
    postSnapshot,
    handleDevCommand,
    toggleGodMode,
    setStats,
    transportToZone,
    advanceProgress,
    spawnChest,
    skipBossPhase
  };

  window.addEventListener('message', handleMessageEvent);
  window.addEventListener('bonecrawler-dev-command', function(event){
    handleDevEventObject(event && event.detail);
  });
  if(document && document.addEventListener){
    document.addEventListener('bonecrawler-dev-command', function(event){
      handleDevEventObject(event && event.detail);
    });
  }

  function initialPing(){
    try{ registerDevApi(window.__bonecrawlerDevApi); }catch(err){}
    try{
      postSnapshot(window.parent);
      postEditorState(window.parent);
    }catch(err){}
  }

  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(initialPing, 60);
  } else {
    window.addEventListener('load', function(){
      setTimeout(initialPing, 60);
    });
  }
})();
