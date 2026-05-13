// zone-spawn-system
// Purpose: swappable zone-owned spawn routing for legacy, wave, and passthrough zones.
(function(){
  if(window.BoneCrawlerZoneSpawn) return;

  const SECRET_ZONE_1 = 101;
  const SECRET_ZONE_2 = 102;

  const state = {
    zone: null,
    waveIndex: 0,
    waveActive: false,
    waveComplete: false,
    breakT: 0,
    queue: [],
    pressureT: 0,
    pressureBursts: 0,
    zoneGateT: 0,
    entryTextT: 0,
    entryTextShown: false,
    waveIntro: null,
    waveStartKills: 0,
    lastIntroTickFrame: null,
    waveSpawnCooldownT: 0,
    placementCursor: Object.create(null),
    standardInitialized: false,
    standardComplete: false,
    standardRewardsClaimed: Object.create(null),
    secretBonusAwarded: Object.create(null),
    lastCompleteZone: null,
    finalWaveCompleteEmitted: false
  };

  function getConfig(){ return window.BoneCrawlerZoneSpawnConfig || { zones: {} }; }
  function zoneKey(zone){ return String(Number(zone)); }
  function getZoneConfig(zone){
    const cfg = getConfig();
    const zones = cfg.zones || {};
    return zones[zoneKey(zone)] || zones[zone] || { spawnSystem: 'legacy' };
  }
  function getSpawnMode(zone){
    try{
      if(window.BoneCrawlerZoneRuntime && typeof BoneCrawlerZoneRuntime.getSpawnSystem === 'function'){
        return String(BoneCrawlerZoneRuntime.getSpawnSystem(zone) || 'legacy').toLowerCase();
      }
    }catch(err){}
    return String(getZoneConfig(zone).spawnSystem || 'legacy').toLowerCase();
  }
  function getRuntimeSpawnMode(zone){
    const mode = getSpawnMode(zone);
    try{
      if(window.BoneCrawlerSpawnSystems && typeof BoneCrawlerSpawnSystems.get === 'function'){
        const spec = BoneCrawlerSpawnSystems.get(mode);
        if(spec && spec.runtime) return String(spec.runtime).toLowerCase();
      }
    }catch(err){}
    if(mode === 'killcount') return 'standard';
    return mode;
  }
  function isStandardMode(zone){ return getRuntimeSpawnMode(zone) === 'standard'; }
  function isSecretZoneId(zone){ return Number(zone) === SECRET_ZONE_1 || Number(zone) === SECRET_ZONE_2; }
  function usesManagedSpawns(zone){
    const mode = getSpawnMode(zone);
    if(window.BoneCrawlerSpawnSystems && typeof BoneCrawlerSpawnSystems.isManaged === 'function'){
      return BoneCrawlerSpawnSystems.isManaged(mode);
    }
    return mode !== 'legacy';
  }
  function shouldOwnUpdate(zone){
    const mode = getRuntimeSpawnMode(zone);
    return mode === 'waves' || mode === 'standard' || mode === 'none' || mode === 'passthrough';
  }

  const DEFAULT_TICKS_PER_SECOND = 60;
  function ticksPerSecond(){
    const value = Number(window.BoneCrawlerTicksPerSecond || window.BONECRAWLER_TICKS_PER_SECOND || DEFAULT_TICKS_PER_SECOND);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_TICKS_PER_SECOND;
  }
  function readTicks(obj, tickKey, secKey, fallback){
    if(obj && obj[secKey] != null){
      const sec = Number(obj[secKey]);
      if(Number.isFinite(sec)) return Math.max(0, Math.round(sec * ticksPerSecond()));
    }
    if(obj && obj[tickKey] != null){
      const ticks = Number(obj[tickKey]);
      if(Number.isFinite(ticks)) return Math.max(0, Math.round(ticks));
    }
    return Math.max(0, Math.round(Number(fallback) || 0));
  }

  function getTemplate(name){
    try{
      const cfg = getConfig();
      return cfg && cfg.configTemplates && cfg.configTemplates[name] ? cfg.configTemplates[name] : {};
    }catch(err){ return {}; }
  }
  function cloneObject(value){
    if(!value || typeof value !== 'object') return value;
    try{ return JSON.parse(JSON.stringify(value)); }catch(err){ return Object.assign({}, value); }
  }
  function deepMerge(base, override){
    const out = cloneObject(base) || {};
    if(!override || typeof override !== 'object') return out;
    Object.keys(override).forEach(key => {
      const value = override[key];
      if(value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) out[key] = deepMerge(out[key], value);
      else out[key] = cloneObject(value);
    });
    return out;
  }
  function getStandardConfig(zone){
    const zoneCfg = getZoneConfig(zone);
    const tpl = getTemplate('standard');
    const fallback = {
      enabled: true,
      targetKills: 300,
      maxActiveChests: 1,
      initialSpawns: [],
      regularSpawn: { enabled:true, delayEarly:112, delayLate:56, lateAtZoneKills:100 },
      chest: { enabled:true },
      statScaling: {
        progressSource:'zoneKills',
        curve:'sqrt',
        baseSpeed:0.22,
        maxSpeed:0.68,
        factor:0.035,
        typeMultipliers:{ normalEnemy1:1, normalEnemy2:0.9, normalEnemy3:0.55, giantEnemy1:0.65, wizardEnemy1:0.45 },
        minSpeeds:{ normalEnemy1:0.08, normalEnemy2:0.14, normalEnemy3:0.08, giantEnemy1:0.18, wizardEnemy1:0.14 }
      },
      specials: {
        giant: { enabled:true, firstAt:20, intervalStart:20, intervalMin:12, delayEarly:120, delayLate:60, lateAtZoneKills:100 },
        wizard: { enabled:true, firstAt:30, intervalStart:30, intervalMin:10, delayEarly:112, delayLate:56, lateAtZoneKills:100 }
      },
      killRewards: []
    };
    return deepMerge(deepMerge(fallback, tpl), (zoneCfg && zoneCfg.standard) || {});
  }
  function getZoneKills(zone){
    try{ return typeof getZoneProgressKills === 'function' ? getZoneProgressKills(zone) : (typeof killCount !== 'undefined' ? killCount : 0); }catch(err){ return 0; }
  }
  function readMetric(metric, zone){
    if(String(metric || 'zoneKills') === 'runKills') return typeof killCount !== 'undefined' ? killCount : 0;
    return getZoneKills(zone);
  }

  function defaultWaveStatScaling(){
    return {
      // Wave mode owns its speed curve. It scales by authored wave number,
      // not score or zone kill totals, so high-count waves do not spike speed.
      progressSource:'waveNumber',
      curve:'linear',
      baseSpeed:0.14,
      maxSpeed:0.36,
      factor:0.020,
      typeMultipliers:{ normalEnemy1:1, normalEnemy2:0.86, normalEnemy3:0.52, giantEnemy1:0.56, wizardEnemy1:0.40 },
      minSpeeds:{ normalEnemy1:0.07, normalEnemy2:0.10, normalEnemy3:0.06, giantEnemy1:0.12, wizardEnemy1:0.10 }
    };
  }
  function defaultStandardStatScaling(){
    return {
      progressSource:'zoneKills',
      curve:'sqrt',
      baseSpeed:0.22,
      maxSpeed:0.68,
      factor:0.035,
      typeMultipliers:{ normalEnemy1:1, normalEnemy2:0.9, normalEnemy3:0.55, giantEnemy1:0.65, wizardEnemy1:0.45 },
      minSpeeds:{ normalEnemy1:0.08, normalEnemy2:0.14, normalEnemy3:0.08, giantEnemy1:0.18, wizardEnemy1:0.14 }
    };
  }
  function getWaveKills(zone){
    return Math.max(0, getZoneKills(zone) - (Number(state.waveStartKills) || 0));
  }
  function readStatProgress(scaling, zone, context){
    const source = String((scaling && scaling.progressSource) || 'zoneKills');
    if(source === 'score') return typeof score !== 'undefined' ? score : 0;
    if(source === 'runKills' || source === 'totalKills') return typeof killCount !== 'undefined' ? killCount : 0;
    if(source === 'waveKills') return getWaveKills(zone);
    if(source === 'waveIndex') return Number(state.waveIndex) || 0;
    if(source === 'waveNumber') return (Number(state.waveIndex) || 0) + 1;
    if(source === 'fixed' || source === 'none') return 0;
    if(context && context.progress != null){
      const value = Number(context.progress);
      if(Number.isFinite(value)) return value;
    }
    return getZoneKills(zone);
  }
  function computeScaledBaseSpeed(scaling, progress){
    const cfg = scaling || {};
    const base = Number.isFinite(Number(cfg.baseSpeed)) ? Number(cfg.baseSpeed) : 0.22;
    const max = Number.isFinite(Number(cfg.maxSpeed)) ? Number(cfg.maxSpeed) : 0.68;
    const factor = Number.isFinite(Number(cfg.factor)) ? Number(cfg.factor) : 0.035;
    const curve = String(cfg.curve || 'sqrt').toLowerCase();
    const safeProgress = Math.max(0, Number(progress) || 0);
    const curveValue = curve === 'linear' ? safeProgress : curve === 'none' ? 0 : Math.sqrt(safeProgress);
    return Math.min(max, base + curveValue * factor);
  }
  function getWaveStatScaling(zone, context){
    const cfg = getZoneConfig(zone);
    const wave = context && context.wave ? context.wave : getCurrentWave();
    const base = defaultWaveStatScaling();
    const zoneStats = (cfg && cfg.waveSystem && cfg.waveSystem.statScaling) || (cfg && cfg.statScaling) || {};
    const waveStats = (wave && wave.statScaling) || {};
    const payloadStats = (context && context.statScaling) || {};
    return deepMerge(deepMerge(deepMerge(base, zoneStats), waveStats), payloadStats);
  }
  function defaultWavePlacement(){
    return {
      mode:'roundRobin',
      rotatePoints:true,
      spreadRadius:7,
      edgeSpread:10,
      attempts:7,
      minEnemySpacing:7,
      avoidPlayerRadius:22,
      clampToPlayfield:true,
      usePointPools:true,
      pointPools:{}
    };
  }
  function defaultWaveSpawnBudget(){
    return {
      maxSpawnsPerTick:1,
      minTicksBetweenSpawns:8,
      maxActiveEnemies:12,
      maxActivePerSpawnPoint:4,
      holdWhenCapped:true
    };
  }
  function getWaveSystemSettings(zone, key, fallbackFactory){
    const cfg = getZoneConfig(zone);
    const wave = getCurrentWave();
    const base = fallbackFactory ? fallbackFactory() : {};
    const zoneValue = (cfg && cfg.waveSystem && cfg.waveSystem[key]) || {};
    const waveValue = (wave && wave.waveSystem && wave.waveSystem[key]) || (wave && wave[key]) || {};
    return deepMerge(deepMerge(base, zoneValue), waveValue);
  }
  function getWavePlacement(zone, entry, wave){
    const cfg = getZoneConfig(zone);
    const base = defaultWavePlacement();
    const zoneValue = (cfg && cfg.waveSystem && cfg.waveSystem.placement) || {};
    const waveValue = (wave && wave.waveSystem && wave.waveSystem.placement) || (wave && wave.placement) || {};
    const entryValue = (entry && entry.placement) || {};
    return deepMerge(deepMerge(deepMerge(base, zoneValue), waveValue), entryValue);
  }
  function getWaveSpawnBudget(zone){
    return getWaveSystemSettings(zone, 'spawnBudget', defaultWaveSpawnBudget);
  }
  function getEnemyPoolKey(enemyType){
    const kind = String(enemyType || 'normalEnemy1');
    if(kind === 'giantEnemy1') return 'giant';
    if(kind === 'wizardEnemy1') return 'wizard';
    if(kind === 'normalEnemy3') return 'rise';
    return 'normal';
  }
  function normalizePointList(list){
    if(!Array.isArray(list)) return [];
    return list.map(item => typeof item === 'string' ? item : (item && item.id)).filter(Boolean);
  }
  function getEntrySpawnPointList(entry, wave, index, placement){
    const zone = state.zone;
    const cfg = getZoneConfig(zone);
    if(entry && Array.isArray(entry.spawnPoints) && entry.spawnPoints.length) return normalizePointList(entry.spawnPoints);
    const enemy = entry && (entry.enemy || entry.type);
    const pools = (placement && placement.pointPools) || {};
    const poolKey = getEnemyPoolKey(enemy);
    if(placement && placement.usePointPools !== false){
      const exact = normalizePointList(pools[enemy]);
      if(exact.length) return exact;
      const pooled = normalizePointList(pools[poolKey]);
      if(pooled.length) return pooled;
    }
    if(entry && (entry.spawnPoint || entry.point)) return [entry.spawnPoint || entry.point];
    const all = Array.isArray(cfg.spawnPoints) ? cfg.spawnPoints.map(point => point && point.id).filter(Boolean) : [];
    return all.length ? all : [null];
  }
  function selectSpawnPointForEntry(entry, wave, groupIndex, spawnIndex){
    const placement = getWavePlacement(state.zone, entry, wave);
    const list = getEntrySpawnPointList(entry, wave, groupIndex, placement);
    if(!list.length) return null;
    if(placement.rotatePoints === false || list.length === 1) return list[0];
    const key = [state.zone, wave && wave.id || state.waveIndex, groupIndex, entry && (entry.enemy || entry.type) || 'enemy'].join(':');
    const start = Number(state.placementCursor[key]) || 0;
    const selected = list[(start + spawnIndex) % list.length];
    if(spawnIndex === 0) state.placementCursor[key] = (start + 1) % list.length;
    return selected;
  }
  function clamp(value, min, max){ return Math.max(min, Math.min(max, value)); }
  function getPlayerCenter(){
    try{ if(typeof player !== 'undefined' && player) return {x:player.x + (player.w || 8) / 2, y:player.y + (player.h || 8) / 2}; }catch(err){}
    return null;
  }
  function distanceSq(a, b){
    const dx = Number(a.x) - Number(b.x);
    const dy = Number(a.y) - Number(b.y);
    return dx * dx + dy * dy;
  }
  function isEnemySpacingClear(pos, enemyType, placement, pointId){
    const minSpacing = Math.max(0, Number(placement && placement.minEnemySpacing) || 0);
    const avoidPlayer = Math.max(0, Number(placement && placement.avoidPlayerRadius) || 0);
    const center = {x:pos.x + getEnemySize(enemyType).w / 2, y:pos.y + getEnemySize(enemyType).h / 2};
    if(avoidPlayer > 0){
      const pc = getPlayerCenter();
      if(pc && distanceSq(center, pc) < avoidPlayer * avoidPlayer) return false;
    }
    if(minSpacing <= 0) return true;
    try{
      if(typeof enemies !== 'undefined' && Array.isArray(enemies)){
        for(const enemy of enemies){
          if(!enemy) continue;
          const other = {x:enemy.x + (enemy.w || 8) / 2, y:enemy.y + (enemy.h || 8) / 2};
          if(distanceSq(center, other) < minSpacing * minSpacing) return false;
        }
      }
    }catch(err){}
    return true;
  }
  function countActiveEnemies(){
    try{ return typeof enemies !== 'undefined' && Array.isArray(enemies) ? enemies.length : 0; }catch(err){ return 0; }
  }
  function countActiveAtSpawnPoint(pointId){
    if(!pointId) return 0;
    let count = 0;
    try{
      if(typeof enemies !== 'undefined' && Array.isArray(enemies)){
        for(const enemy of enemies){
          if(enemy && enemy.spawnPointId === pointId) count++;
        }
      }
    }catch(err){}
    return count;
  }
  function canSpawnWaveItem(item){
    const budget = getWaveSpawnBudget(state.zone);
    const maxActive = Number(budget.maxActiveEnemies);
    if(Number.isFinite(maxActive) && maxActive > 0 && countActiveEnemies() >= maxActive) return false;
    const maxAtPoint = Number(budget.maxActivePerSpawnPoint);
    if(Number.isFinite(maxAtPoint) && maxAtPoint > 0 && item && item.spawnPoint && countActiveAtSpawnPoint(item.spawnPoint) >= maxAtPoint) return false;
    return true;
  }

  function getStandardStatScaling(zone){
    const cfg = getStandardConfig(zone);
    return deepMerge(defaultStandardStatScaling(), (cfg && cfg.statScaling) || {});
  }
  function resolveEnemyStats(enemyType, context){
    const zone = Number((context && (context.zoneId ?? context.zone)) || (typeof currentZone !== 'undefined' ? currentZone : state.zone) || 1);
    const runtimeMode = getRuntimeSpawnMode(zone);
    const scaling = runtimeMode === 'waves' ? getWaveStatScaling(zone, context || {}) : runtimeMode === 'standard' ? getStandardStatScaling(zone) : defaultStandardStatScaling();
    const progress = readStatProgress(scaling, zone, context || {});
    const baseSpeed = computeScaledBaseSpeed(scaling, progress);
    return {
      sourceSystem: runtimeMode,
      zoneId: zone,
      enemyType: enemyType || 'normalEnemy1',
      progress,
      progressSource: scaling.progressSource || 'zoneKills',
      baseSpeed,
      typeStats: scaling.typeStats || {},
      typeMultipliers: scaling.typeMultipliers || {},
      minSpeeds: scaling.minSpeeds || {},
      hp: scaling.hp,
      hps: scaling.hps,
      hpAdd: scaling.hpAdd,
      hpAdds: scaling.hpAdds,
      hpMultiplier: scaling.hpMultiplier,
      hpMultipliers: scaling.hpMultipliers,
      points: scaling.points,
      pointsByType: scaling.pointsByType || scaling.pointss,
      pointsAdd: scaling.pointsAdd,
      pointsAdds: scaling.pointsAdds,
      pointsMultiplier: scaling.pointsMultiplier,
      pointsMultipliers: scaling.pointsMultipliers
    };
  }

  function showFloat(x, y, text, life, col){
    try{
      if(typeof floatTexts !== 'undefined' && Array.isArray(floatTexts)){
        floatTexts.push({x, y, text:String(text || ''), life:life || 60, max:life || 60, col:col || ((window.C && C.BN1) ? C.BN1 : '#fff')});
      }
    }catch(err){}
  }
  function showCenterText(text, yOffset, life, color){
    showFloat((typeof GW !== 'undefined' ? GW / 2 : 60), (typeof PY !== 'undefined' ? PY : 17) + (yOffset || 14), text, life || 60, color);
  }
  function resolveColor(name, fallback){
    try{
      if(!name) return fallback;
      if(String(name).charAt(0) === '#') return String(name);
      if(window.C && C[name]) return C[name];
    }catch(err){}
    return fallback;
  }
  function shouldShowWaveText(cfg, wave){
    return cfg && cfg.showWaveText === true || wave && wave.showText === true;
  }
  function shouldShowPressureText(cfg, pressure){
    return cfg && cfg.showPressureText === true || pressure && pressure.showText === true;
  }
  function addScore(points, label){
    const value = Math.max(0, Number(points) || 0);
    if(!value) return;
    try{ if(typeof score !== 'undefined') score += value; }catch(err){}
    showCenterText(label || ('+' + value), 16, 70, (window.C && C.BN1) ? C.BN1 : '#fff');
  }
  function spawnWaveChest(){
    try{
      if(typeof spawnChest === 'function' && !isSecretZoneId(state.zone)){
        const cfg = getZoneConfig(state.zone);
        const maxActive = Math.max(1, Number(cfg.maxActiveChests ?? 2) || 2);
        spawnChest({maxActive});
        return true;
      }
    }catch(err){}
    return false;
  }
  function awardEntryBonus(zone){
    const cfg = getZoneConfig(zone);
    const points = Math.max(0, Number(cfg.entryBonusPoints) || 0);
    if(!points) return;
    const once = cfg.entryBonusOncePerRun !== false;
    const key = zoneKey(zone);
    if(once && state.secretBonusAwarded[key]) return;
    state.secretBonusAwarded[key] = true;
    addScore(points, cfg.entryBonusLabel || ('+' + points));
  }

  function resetWaveState(zone){
    const cfg = getZoneConfig(zone);
    state.zone = Number(zone);
    state.waveIndex = 0;
    state.waveActive = false;
    state.waveComplete = false;
    state.breakT = readTicks(cfg, 'startDelay', 'startDelaySec', 0);
    state.queue = [];
    state.pressureT = 0;
    state.pressureBursts = 0;
    state.zoneGateT = readTicks(cfg, 'activationDelay', 'activationDelaySec', 0);
    state.entryTextT = cfg.entryText ? readTicks(cfg, 'entryTextDelay', 'entryTextDelaySec', 0) : 0;
    state.entryTextShown = !cfg.entryText;
    state.waveIntro = null;
    state.waveStartKills = getZoneKills(zone);
    state.lastIntroTickFrame = null;
    state.waveSpawnCooldownT = 0;
    state.placementCursor = Object.create(null);
    state.standardInitialized = false;
    state.standardComplete = false;
    state.standardRewardsClaimed = Object.create(null);
    state.lastCompleteZone = null;
    state.finalWaveCompleteEmitted = false;
  }
  function beginRun(zone){
    state.secretBonusAwarded = Object.create(null);
    enterZone(zone || 1, { newRun: true });
  }
  function enterZone(zone, opts){
    const cfg = getZoneConfig(zone);
    const mode = getSpawnMode(zone);
    state.zone = Number(zone);
    state.queue = [];
    state.lastCompleteZone = null;
    const runtimeMode = getRuntimeSpawnMode(zone);
    if(runtimeMode === 'waves') resetWaveState(zone);
    else {
      state.waveIndex = 0;
      state.waveActive = false;
      state.waveComplete = runtimeMode === 'none' || runtimeMode === 'passthrough';
      state.breakT = 0;
      state.pressureT = 0;
      state.pressureBursts = 0;
      state.zoneGateT = readTicks(cfg, 'activationDelay', 'activationDelaySec', 0);
      state.entryTextT = cfg.entryText ? readTicks(cfg, 'entryTextDelay', 'entryTextDelaySec', 0) : 0;
      state.entryTextShown = !cfg.entryText;
      state.waveIntro = null;
      state.waveStartKills = getZoneKills(zone);
      state.lastIntroTickFrame = null;
      state.waveSpawnCooldownT = 0;
      state.placementCursor = Object.create(null);
      state.standardInitialized = false;
      state.standardComplete = false;
      state.standardRewardsClaimed = Object.create(null);
      state.finalWaveCompleteEmitted = false;
      if(runtimeMode === 'standard') resetStandardState(zone);
    }
    if(isSecretZoneId(zone)) awardEntryBonus(zone);

  }
  function clear(){
    state.queue = [];
    state.waveActive = false;
    state.waveComplete = false;
    state.breakT = 0;
    state.pressureT = 0;
    state.pressureBursts = 0;
    state.zoneGateT = 0;
    state.entryTextT = 0;
    state.entryTextShown = true;
    state.waveIntro = null;
    state.waveStartKills = getZoneKills(state.zone);
    state.lastIntroTickFrame = null;
    state.waveSpawnCooldownT = 0;
    state.placementCursor = Object.create(null);
    state.standardInitialized = false;
    state.standardComplete = false;
    state.standardRewardsClaimed = Object.create(null);
    state.lastCompleteZone = null;
    state.finalWaveCompleteEmitted = false;
  }

  function isDialogBlockingZoneStart(){
    try{
      if(typeof gState !== 'undefined' && gState !== 'playing') return true;
      if(typeof dialogPages !== 'undefined' && Array.isArray(dialogPages) && dialogPages.length > 0) return true;
    }catch(err){}
    return false;
  }

  function updateZoneIntro(){
    const zone = typeof currentZone !== 'undefined' ? Number(currentZone) : state.zone;
    if(state.zone !== zone) enterZone(zone);

    const frameId = typeof frame !== 'undefined' ? frame : Date.now();
    if(state.lastIntroTickFrame === frameId) return;
    state.lastIntroTickFrame = frameId;

    const cfg = getZoneConfig(zone);
    if(cfg.waitForDialogClear !== false && isDialogBlockingZoneStart()) return;

    if(!state.entryTextShown){
      if(state.entryTextT > 0) state.entryTextT--;
      else {
        showCenterText(cfg.entryText, cfg.entryTextYOffset || 12, cfg.entryTextLife || 60, (window.C && C.BN1) ? C.BN1 : '#fff');
        state.entryTextShown = true;
      }
    }

    if(state.zoneGateT > 0) state.zoneGateT--;
  }

  function isZoneStartBlocked(zone){
    const z = zone == null ? (typeof currentZone !== 'undefined' ? Number(currentZone) : state.zone) : Number(zone);
    if(state.zone !== z) enterZone(z);
    return state.zoneGateT > 0;
  }

  function safePickRegularEnemyType() {
    try{ if(typeof pickRegularEnemyType === 'function') return pickRegularEnemyType(); }catch(err){}
    return 'normalEnemy1';
  }
  function spawnLegacy(enemyType){
    const kind = enemyType || safePickRegularEnemyType();
    try{
      if(typeof doSpawn === 'function'){
        doSpawn(kind === 'giantEnemy1', kind === 'wizardEnemy1', kind);
        return true;
      }
    }catch(err){}
    return false;
  }
  function getSpawnPoint(id, zone){
    if(!id) return null;
    const points = Array.isArray(getZoneConfig(zone).spawnPoints) ? getZoneConfig(zone).spawnPoints : [];
    return points.find(point => point && point.id === id) || null;
  }
  function getEnemySize(enemyType){
    if(enemyType === 'giantEnemy1') return { w: 18, h: 18 };
    if(enemyType === 'wizardEnemy1') return { w: 8, h: 8 };
    return { w: 9, h: 9 };
  }
  function resolveSpawnPosition(point, enemyType, placement){
    const size = getEnemySize(enemyType);
    const px = typeof PX !== 'undefined' ? PX : 4;
    const py = typeof PY !== 'undefined' ? PY : 17;
    const pw = typeof PW !== 'undefined' ? PW : 112;
    const ph = typeof PH !== 'undefined' ? PH : 99;
    function basePosition(){
      if(!point) return { x: px + pw / 2 - size.w / 2, y: py - size.h - 4 };
      if(point.mode === 'edge'){
        if(point.side === 'top') return { x: Number.isFinite(point.x) ? point.x : px + pw / 2 - size.w / 2, y: py - size.h - 4 };
        if(point.side === 'bottom') return { x: Number.isFinite(point.x) ? point.x : px + pw / 2 - size.w / 2, y: py + ph + 4 };
        if(point.side === 'left') return { x: px - size.w - 4, y: Number.isFinite(point.y) ? point.y : py + ph / 2 - size.h / 2 };
        if(point.side === 'right') return { x: px + pw + 4, y: Number.isFinite(point.y) ? point.y : py + ph / 2 - size.h / 2 };
      }
      return {x: Number.isFinite(point.x) ? point.x : px + pw / 2 - size.w / 2, y: Number.isFinite(point.y) ? point.y : py + ph / 2 - size.h / 2};
    }
    const cfg = placement || {};
    const attempts = Math.max(1, Math.round(Number(cfg.attempts) || 1));
    const spread = Math.max(0, Number(cfg.spreadRadius) || 0);
    const edgeSpread = Math.max(0, Number(cfg.edgeSpread ?? cfg.spreadRadius) || 0);
    let fallback = basePosition();
    for(let i = 0; i < attempts; i++){
      const pos = basePosition();
      if(point && point.mode === 'edge'){
        const amount = (Math.random() * 2 - 1) * edgeSpread;
        if(point.side === 'top' || point.side === 'bottom') pos.x += amount;
        else pos.y += amount;
      } else if(spread > 0){
        pos.x += (Math.random() * 2 - 1) * spread;
        pos.y += (Math.random() * 2 - 1) * spread;
      }
      if(cfg.clampToPlayfield !== false && (!point || point.mode !== 'edge')){
        pos.x = clamp(pos.x, px, px + pw - size.w);
        pos.y = clamp(pos.y, py, py + ph - size.h);
      }
      if(i === 0) fallback = pos;
      if(isEnemySpacingClear(pos, enemyType, cfg, point && point.id)) return pos;
    }
    return fallback;
  }
  function createEnemy(enemyType, x, y, zone, payload){
    const kind = enemyType || safePickRegularEnemyType();
    try{
      if(typeof createStandardEnemyGameObject === 'function'){
        return createStandardEnemyGameObject(kind, x, y, Number(zone), {
          source:'zone-spawn-system',
          zoneId:Number(zone),
          spawnSystem:getRuntimeSpawnMode(zone),
          waveIndex:state.waveIndex,
          waveNumber:state.waveIndex + 1,
          wave:getCurrentWave(),
          waveKills:getWaveKills(zone),
          statScaling:payload && payload.statScaling
        });
      }
    }catch(err){}
    return null;
  }
  function getFallbackSpawnAnimation(zone, point, payload){
    if(payload && (payload.animation || payload.anim)) return payload.animation || payload.anim;
    if(point && (point.defaultAnimation || point.anim)) return point.defaultAnimation || point.anim;
    const cfg = getZoneConfig(zone);
    if(cfg && cfg.defaultSpawnAnimation) return cfg.defaultSpawnAnimation;
    if(point && point.mode === 'edge') return 'walkIn';
    return 'rise';
  }

  function applySpawnAnimation(enemy, animation, ticks, opts){
    if(!enemy || !animation || animation === 'none') return;
    const duration = Math.max(1, Number(ticks) || 32);
    enemy.spawnAnim = animation;
    enemy.spawnT = duration;
    enemy.spawnMax = duration;
    enemy.spawnInvulnerable = !(opts && opts.invulnerable === false);
    enemy.spawnFreeze = !(opts && opts.freeze === false);
  }
  function readSpawnAnimTicks(payload, point){
    if(payload && payload.spawnAnimSec != null){
      const sec = Number(payload.spawnAnimSec);
      if(Number.isFinite(sec)) return Math.max(1, Math.round(sec * ticksPerSecond()));
    }
    if(payload && payload.spawnAnimTicks != null){
      const ticks = Number(payload.spawnAnimTicks);
      if(Number.isFinite(ticks)) return Math.max(1, Math.round(ticks));
    }
    if(point && point.spawnAnimSec != null){
      const sec = Number(point.spawnAnimSec);
      if(Number.isFinite(sec)) return Math.max(1, Math.round(sec * ticksPerSecond()));
    }
    if(point && point.spawnAnimTicks != null){
      const ticks = Number(point.spawnAnimTicks);
      if(Number.isFinite(ticks)) return Math.max(1, Math.round(ticks));
    }
    return 32;
  }
  function spawnAtPoint(payload){
    const zone = Number(payload.zone || (typeof currentZone !== 'undefined' ? currentZone : 1));
    const enemyType = payload.enemy || safePickRegularEnemyType();
    const point = getSpawnPoint(payload.spawnPoint, zone);
    if(!point || payload.mode === 'legacy') return spawnLegacy(enemyType);
    const placement = deepMerge(getWavePlacement(zone, payload || {}, getCurrentWave() || {}), (payload && payload.placement) || {});
    const pos = resolveSpawnPosition(point, enemyType, placement);
    const enemy = createEnemy(enemyType, pos.x, pos.y, zone, payload);
    if(!enemy) return false;
    enemy.spawnPointId = point.id || null;
    enemy.spawnSource = payload.source || getRuntimeSpawnMode(zone);
    enemy.spawnGroupIndex = payload.groupIndex ?? null;
    enemy.spawnWaveId = payload.waveId || null;
    const anim = getFallbackSpawnAnimation(zone, point, payload);
    applySpawnAnimation(enemy, anim, readSpawnAnimTicks(payload, point), { freeze: anim !== 'walkIn' });
    try{ if(typeof enemies !== 'undefined' && Array.isArray(enemies)){ enemies.push(enemy); if(window.AudioEvents) AudioEvents.skeletonSpawn(); return true; } }catch(err){}
    return false;
  }

  function resetStandardState(zone){
    state.zone = Number(zone);
    state.queue = [];
    state.waveActive = false;
    state.waveComplete = false;
    state.standardInitialized = false;
    state.standardComplete = false;
    state.standardRewardsClaimed = Object.create(null);
    try{ if(typeof pSpawns !== 'undefined' && Array.isArray(pSpawns)) pSpawns.length = 0; }catch(err){}
    queueStandardInitialSpawns(zone);
  }
  function queueStandardInitialSpawns(zone){
    const cfg = getStandardConfig(zone);
    const list = Array.isArray(cfg.initialSpawns) ? cfg.initialSpawns : [];
    for(let i = 0; i < list.length; i++){
      const entry = list[i] || {};
      qStandardSpawn(readTicks(entry, 'delay', 'delaySec', i * 12), entry.enemy || entry.type || safePickRegularEnemyType());
    }
    state.standardInitialized = true;
  }
  function readStandardDelay(config, zone, fallbackEarly, fallbackLate){
    const progress = getZoneKills(zone);
    const lateAt = Number(config && config.lateAtZoneKills);
    const useLate = Number.isFinite(lateAt) ? progress >= lateAt : progress >= 100;
    const tickKey = useLate ? 'delayLate' : 'delayEarly';
    const secKey = useLate ? 'delayLateSec' : 'delayEarlySec';
    const fallback = useLate ? fallbackLate : fallbackEarly;
    return readTicks(config || {}, tickKey, secKey, fallback);
  }
  function qStandardSpawn(delay, enemyType){
    const kind = enemyType || safePickRegularEnemyType();
    try{
      if(typeof qSpawn === 'function'){
        qSpawn(Math.max(0, Math.round(Number(delay) || 0)), kind === 'giantEnemy1', kind === 'wizardEnemy1', kind);
        return true;
      }
    }catch(err){}
    return false;
  }
  function processStandardQueue(){
    try{
      if(typeof pSpawns === 'undefined' || !Array.isArray(pSpawns)) return;
      for(let i = pSpawns.length - 1; i >= 0; i--){
        pSpawns[i].t--;
        if(pSpawns[i].t <= 0){
          const g = pSpawns[i].giant;
          const wiz = pSpawns[i].wizard;
          const type = pSpawns[i].type;
          pSpawns.splice(i, 1);
          if(typeof doSpawn === 'function') doSpawn(g, wiz, type);
        }
      }
    }catch(err){}
  }
  function getStandardTargetKills(zone){
    const cfg = getStandardConfig(zone);
    const explicit = Number(cfg.targetKills);
    if(Number.isFinite(explicit)) return Math.max(0, explicit);
    try{ return typeof getZoneKillTarget === 'function' ? getZoneKillTarget(zone) : 0; }catch(err){ return 0; }
  }
  function isStandardBossBlocked(){
    try{ if(typeof dragonBoss !== 'undefined' && dragonBoss) return true; }catch(err){}
    try{ if(typeof shadowBoss !== 'undefined' && shadowBoss) return true; }catch(err){}
    return false;
  }
  function isStandardComplete(zone){
    const target = getStandardTargetKills(zone);
    return target > 0 && getZoneKills(zone) >= target;
  }
  function runStandardReward(reward, enemy){
    if(!reward || !reward.action) return false;
    const zone = typeof currentZone !== 'undefined' ? Number(currentZone) : state.zone;
    const x = enemy ? enemy.x + Math.floor((enemy.w || 8) / 2) - 3 : (typeof GW !== 'undefined' ? GW / 2 : 60);
    const y = enemy ? enemy.y + Math.floor((enemy.h || 8) / 2) - 3 : (typeof PY !== 'undefined' ? PY + 40 : 60);
    if(reward.requireEnemiesClear){
      try{ if((typeof enemies !== 'undefined' && enemies.length > 0) || (typeof pSpawns !== 'undefined' && pSpawns.length > 0)) return false; }catch(err){}
    }
    if(reward.action === 'spawnKeyDrop'){
      try{
        if(reward.kind && typeof hasKeyDropKind === 'function' && hasKeyDropKind(reward.kind)) return true;
        if(typeof player !== 'undefined' && player){
          if(reward.kind === 'zone1Door' && player.zone1DoorKey) return true;
          if(reward.kind === 'secret1' && player.secret1Key) return true;
          if(reward.kind === 'zone2' && player.zone2Key) return true;
          if(reward.kind === 'zone3' && player.hasKey) return true;
        }
        if(typeof spawnKeyDrop === 'function') spawnKeyDrop(x, y, reward.kind || 'zone');
        if(reward.text) showFloat(enemy ? enemy.x + (enemy.w || 8) / 2 : x, enemy ? enemy.y - 10 : y - 8, reward.text, reward.life || 52, resolveColor(reward.color, (window.C && C.BN1) ? C.BN1 : '#fff'));
        try{ if(window.EventEngine) EventEngine.emit('standard.reward', {zoneId:zone, rewardId:reward.id || null, action:reward.action, kind:reward.kind || null, x, y}); }catch(err){}
        return true;
      }catch(err){ return false; }
    }
    if(reward.action === 'spawnBoss'){
      const bossId = reward.bossId || reward.boss || (zone === 3 ? 'shadowBoss' : 'dragonBoss');
      try{
        if(bossId === 'shadowBoss'){
          if(typeof shadowBoss !== 'undefined' && !shadowBoss && !shadowBossDefeated && typeof spawnShadowBoss === 'function') spawnShadowBoss();
        } else {
          if(typeof dragonBoss !== 'undefined' && !dragonBoss && !bossDefeated && !(zone === 1 && zone1MiniBossDefeated) && typeof spawnDragonBoss === 'function') spawnDragonBoss();
        }
        try{ if(window.EventEngine) EventEngine.emit('standard.boss.spawned', {zoneId:zone, bossId}); }catch(err){}
        return true;
      }catch(err){ return false; }
    }
    if(reward.action === 'emit'){
      try{ if(window.EventEngine) EventEngine.emit(reward.event || 'standard.event', Object.assign({zoneId:zone, rewardId:reward.id || null}, reward.payload || {})); return true; }catch(err){ return false; }
    }
    return false;
  }
  function checkStandardRewards(enemy){
    const zone = typeof currentZone !== 'undefined' ? Number(currentZone) : state.zone;
    const cfg = getStandardConfig(zone);
    const rewards = Array.isArray(cfg.killRewards) ? cfg.killRewards : [];
    let handled = false;
    for(let i = 0; i < rewards.length; i++){
      const reward = rewards[i] || {};
      const id = reward.id || (reward.action + ':' + (reward.kind || reward.bossId || i));
      const key = zone + ':' + id;
      if(reward.once !== false && state.standardRewardsClaimed[key]) continue;
      const at = Number(reward.at ?? reward.atKills ?? reward.killCount);
      if(Number.isFinite(at) && readMetric(reward.metric, zone) < at) continue;
      const ok = runStandardReward(reward, enemy);
      if(ok){
        handled = true;
        if(reward.once !== false) state.standardRewardsClaimed[key] = true;
      }
    }
    return handled;
  }
  function scheduleStandardSpecials(){
    const zone = typeof currentZone !== 'undefined' ? Number(currentZone) : state.zone;
    if(isSecretZoneId(zone) || isStandardComplete(zone)) return;
    const cfg = getStandardConfig(zone);
    const specials = cfg.specials || {};
    try{
      const giantCfg = specials.giant || {};
      if(giantCfg.enabled !== false && typeof killCount !== 'undefined' && killCount >= nextGiantAt){
        qStandardSpawn(readStandardDelay(giantCfg, zone, 120, 60), 'giantEnemy1');
        giantKillInterval = Math.max(Number(giantCfg.intervalMin ?? GIANT_KILL_INTERVAL_MIN) || GIANT_KILL_INTERVAL_MIN, giantKillInterval - 1);
        nextGiantAt += Math.max(Number(giantCfg.intervalMin ?? GIANT_KILL_INTERVAL_MIN) || GIANT_KILL_INTERVAL_MIN, giantKillInterval);
      }
      const wizardCfg = specials.wizard || {};
      if(wizardCfg.enabled !== false && typeof killCount !== 'undefined' && killCount >= nextWizardAt){
        qStandardSpawn(readStandardDelay(wizardCfg, zone, 112, 56), 'wizardEnemy1');
        wizardKillInterval = Math.max(Number(wizardCfg.intervalMin ?? WIZARD_KILL_INTERVAL_MIN) || WIZARD_KILL_INTERVAL_MIN, wizardKillInterval - 1);
        nextWizardAt += Math.max(Number(wizardCfg.intervalMin ?? WIZARD_KILL_INTERVAL_MIN) || WIZARD_KILL_INTERVAL_MIN, wizardKillInterval);
      }
    }catch(err){}
  }
  function onEnemyDefeated(payload){
    const zone = typeof currentZone !== 'undefined' ? Number(currentZone) : state.zone;
    if(!isStandardMode(zone)) return false;
    const enemy = payload && payload.enemy ? payload.enemy : payload;
    if(isStandardBossBlocked()) return true;
    try{
      if(typeof pSpawns !== 'undefined' && Array.isArray(pSpawns)){
        for(const spawn of pSpawns){
          spawn.t = Math.min(spawn.t, spawn.giant ? readStandardDelay(((getStandardConfig(zone).specials || {}).giant || {}), zone, 120, 60) : readStandardDelay(getStandardConfig(zone).regularSpawn || {}, zone, 112, 56));
        }
      }
    }catch(err){}
    checkStandardRewards(enemy);
    const cfg = getStandardConfig(zone);
    try{
      const chestCfg = cfg.chest || {};
      if(chestCfg.enabled !== false && typeof killCount !== 'undefined' && killCount >= nextChestAt && !isSecretZoneId(zone)){
        const hasChest = (typeof chest !== 'undefined' && chest) || (typeof chests !== 'undefined' && Array.isArray(chests) && chests.length >= Math.max(1, Number(cfg.maxActiveChests) || 1));
        if(!hasChest && typeof spawnChest === 'function'){
          spawnChest({maxActive:Math.max(1, Number(cfg.maxActiveChests) || 1)});
          nextChestAt += typeof getChestKillStepForZone === 'function' ? getChestKillStepForZone(zone) : 10;
        }
      }
    }catch(err){}
    scheduleStandardSpecials();
    if(isStandardComplete(zone) && !state.standardComplete){
      state.standardComplete = true;
      try{ if(window.EventEngine) EventEngine.emit('standard.completed', {zoneId:zone, zoneKills:getZoneKills(zone), runKills:typeof killCount !== 'undefined' ? killCount : 0}); }catch(err){}
    }
    return true;
  }
  function updateStandardSpawn(){
    const zone = typeof currentZone !== 'undefined' ? Number(currentZone) : state.zone;
    if(!state.standardInitialized) resetStandardState(zone);
    processStandardQueue();
    if(isSecretZoneId(zone)) return;
    if(isStandardBossBlocked()) return;
    checkStandardRewards(null);
    const cfg = getStandardConfig(zone);
    const regular = cfg.regularSpawn || {};
    if(regular.enabled === false) return;
    if(isStandardComplete(zone)) return;
    try{
      const activeEnemies = typeof enemies !== 'undefined' && Array.isArray(enemies) ? enemies.length : 0;
      const queued = typeof pSpawns !== 'undefined' && Array.isArray(pSpawns) ? pSpawns.length : 0;
      const cap = typeof maxEnemies === 'function' ? maxEnemies() : Number(cfg.maxEnemies || 8) || 8;
      if(activeEnemies < cap && queued === 0){
        qStandardSpawn(readStandardDelay(regular, zone, 112, 56), safePickRegularEnemyType());
      }
    }catch(err){}
  }

  function queueWaveSpawn(entry, wave, i){
    entry = entry || {};
    const count = Math.max(1, Number(entry.count) || 1);
    const placement = getWavePlacement(state.zone, entry, wave);
    const gap = readTicks(entry, 'gap', 'gapSec', readTicks(placement, 'defaultGap', 'defaultGapSec', 0));
    const delay = readTicks(entry, 'delay', 'delaySec', 0);
    for(let n = 0; n < count; n++){
      const spawnPoint = selectSpawnPointForEntry(entry, wave, i, n);
      state.queue.push({
        t: delay + n * gap,
        enemy: entry.enemy || entry.type || safePickRegularEnemyType(),
        spawnPoint,
        spawnPoints: getEntrySpawnPointList(entry, wave, i, placement),
        mode: entry.mode || null,
        animation: entry.animation || entry.anim || null,
        spawnAnimSec: entry.spawnAnimSec,
        spawnAnimTicks: entry.spawnAnimTicks,
        statScaling: entry.statScaling || null,
        placement,
        source:'waves',
        waveId: wave.id || null,
        groupIndex: i
      });
    }
  }
  function getWaveIntroSettings(cfg, wave){
    const local = Object.assign({}, (cfg && cfg.waveIntro) || {}, (wave && wave.waveIntro) || {});
    const enabled = local.enabled != null ? local.enabled !== false : shouldShowWaveText(cfg, wave);
    return {
      enabled,
      waveText: String(local.waveText || (wave && wave.name) || ('Wave ' + (state.waveIndex + 1))).toUpperCase(),
      readyText: String(local.readyText || 'Ready?'),
      goText: String(local.goText || 'GO!'),
      waveTextLife: readTicks(local, 'waveTextLife', 'waveTextLifeSec', 120),
      readyTextLife: readTicks(local, 'readyTextLife', 'readyTextLifeSec', 60),
      goTextLife: readTicks(local, 'goTextLife', 'goTextLifeSec', 45),
      waveTextYOffset: Number.isFinite(Number(local.waveTextYOffset ?? local.yOffset)) ? Number(local.waveTextYOffset ?? local.yOffset) : 14,
      readyTextYOffset: Number.isFinite(Number(local.readyTextYOffset ?? local.yOffset)) ? Number(local.readyTextYOffset ?? local.yOffset) : 14,
      goTextYOffset: Number.isFinite(Number(local.goTextYOffset ?? local.yOffset)) ? Number(local.goTextYOffset ?? local.yOffset) : 14,
      color: local.color || ((window.C && C.BN1) ? C.BN1 : '#fff'),
      readyColor: local.readyColor || ((window.C && C.BN1) ? C.BN1 : '#fff'),
      goColor: local.goColor || ((window.C && C.FR1) ? C.FR1 : ((window.C && C.BN1) ? C.BN1 : '#fff'))
    };
  }
  function beginWaveIntro(cfg, wave){
    const intro = getWaveIntroSettings(cfg, wave);
    if(!intro.enabled) return false;
    state.waveIntro = { phase: 'wave', t: intro.waveTextLife, shown: false, settings: intro, waveId: wave.id || null };
    try{ if(window.EventEngine) EventEngine.emit('wave.announced', {zoneId:state.zone, waveIndex:state.waveIndex, waveId:wave.id || null}); }catch(err){}
    return true;
  }
  function setWaveIntroPhase(phase, life){
    if(!state.waveIntro) return;
    state.waveIntro.phase = phase;
    state.waveIntro.t = Math.max(1, Number(life) || 1);
    state.waveIntro.shown = false;
  }
  function updateWaveIntro(){
    const intro = state.waveIntro;
    if(!intro) return false;
    const settings = intro.settings || {};
    if(!intro.shown){
      if(intro.phase === 'wave') showCenterText(settings.waveText || ('WAVE ' + (state.waveIndex + 1)), settings.waveTextYOffset, settings.waveTextLife, settings.color);
      else if(intro.phase === 'ready') showCenterText(settings.readyText || 'READY?', settings.readyTextYOffset, settings.readyTextLife, settings.readyColor);
      else if(intro.phase === 'go') showCenterText(settings.goText || 'GO!', settings.goTextYOffset, settings.goTextLife, settings.goColor);
      intro.shown = true;
    }
    intro.t--;
    if(intro.t > 0) return true;
    if(intro.phase === 'wave'){ setWaveIntroPhase('ready', settings.readyTextLife); return true; }
    if(intro.phase === 'ready'){ setWaveIntroPhase('go', settings.goTextLife); return true; }
    state.waveIntro = null;
    beginWaveSpawns();
    return true;
  }
  function beginWaveSpawns(){
    const cfg = getZoneConfig(state.zone);
    const waves = Array.isArray(cfg.waves) ? cfg.waves : [];
    const wave = waves[state.waveIndex];
    if(!wave){ completeWaves(); return; }
    state.waveActive = true;
    state.waveSpawnCooldownT = 0;
    state.waveStartKills = getZoneKills(state.zone);
    if(wave.dropChest !== false) spawnWaveChest();
    state.pressureT = readTicks((wave.pressure || {}), 'interval', 'intervalSec', 0);
    state.pressureBursts = 0;
    const spawns = Array.isArray(wave.spawns) ? wave.spawns : [];
    for(let i = 0; i < spawns.length; i++) queueWaveSpawn(spawns[i], wave, i);
    try{ if(window.EventEngine) EventEngine.emit('wave.started', {zoneId:state.zone, waveIndex:state.waveIndex, waveId:wave.id || null}); }catch(err){}
  }
  function startWave(){
    const cfg = getZoneConfig(state.zone);
    const waves = Array.isArray(cfg.waves) ? cfg.waves : [];
    const wave = waves[state.waveIndex];
    if(!wave){ completeWaves(); return; }
    if(beginWaveIntro(cfg, wave)) return;
    beginWaveSpawns();
  }
  function updateQueue(){
    if(state.waveSpawnCooldownT > 0){ state.waveSpawnCooldownT--; }
    for(let i = 0; i < state.queue.length; i++){
      if(state.queue[i].t > 0) state.queue[i].t--;
    }
    const budget = getWaveSpawnBudget(state.zone);
    const maxThisTick = Math.max(1, Math.round(Number(budget.maxSpawnsPerTick) || 1));
    const cooldown = Math.max(0, Math.round(Number(budget.minTicksBetweenSpawns) || 0));
    let spawned = 0;
    for(let i = state.queue.length - 1; i >= 0; i--){
      if(spawned >= maxThisTick) break;
      if(state.waveSpawnCooldownT > 0) break;
      const item = state.queue[i];
      if(!item || item.t > 0) continue;
      if(!canSpawnWaveItem(item)) continue;
      state.queue.splice(i, 1);
      const ok = spawnAtPoint({zone: state.zone, enemy: item.enemy, spawnPoint: item.spawnPoint, mode: item.mode, animation: item.animation, spawnAnimSec: item.spawnAnimSec, spawnAnimTicks: item.spawnAnimTicks, statScaling: item.statScaling, placement: item.placement, source:item.source, waveId:item.waveId, groupIndex:item.groupIndex});
      if(ok){
        spawned++;
        if(cooldown > 0) state.waveSpawnCooldownT = cooldown;
      }
    }
  }
  function getCurrentWave(){
    const cfg = getZoneConfig(state.zone);
    const waves = Array.isArray(cfg.waves) ? cfg.waves : [];
    return waves[state.waveIndex] || null;
  }
  function queueSpawnGroups(groups, wave){
    const list = Array.isArray(groups) ? groups : [];
    for(let i = 0; i < list.length; i++) queueWaveSpawn(list[i], wave || getCurrentWave() || {}, i);
  }
  function getPressureBurstStages(wave){
    return wave && Array.isArray(wave.pressureBursts) ? wave.pressureBursts : [];
  }
  function getPressureMaxBursts(wave, pressure){
    const stages = getPressureBurstStages(wave);
    if(stages.length > 0) return stages.length;
    const maxBursts = Number(pressure && pressure.maxBursts);
    if(!Number.isFinite(maxBursts)) return 0;
    return Math.max(0, maxBursts);
  }
  function getPressureBurstStage(wave, index){
    const stages = getPressureBurstStages(wave);
    if(!stages.length) return null;
    const safeIndex = Math.max(0, Math.min(stages.length - 1, Math.round(Number(index) || 0)));
    return stages[safeIndex] || null;
  }
  function getPressureBurstSpawns(wave, index){
    const stage = getPressureBurstStage(wave, index);
    if(Array.isArray(stage)) return stage;
    if(stage && Array.isArray(stage.spawns)) return stage.spawns;
    if(stage && Array.isArray(stage.pressureSpawns)) return stage.pressureSpawns;
    if(stage && Array.isArray(stage.reinforcements)) return stage.reinforcements;
    return wave && (wave.pressureSpawns || wave.reinforcements) || [];
  }
  function getPressureBurstInterval(pressure, stage){
    const base = readTicks(pressure || {}, 'interval', 'intervalSec', 0);
    if(stage && !Array.isArray(stage)){
      return readTicks(stage, 'interval', 'intervalSec', base);
    }
    return base;
  }
  function getPressureBurstLabel(pressure, stage){
    if(stage && !Array.isArray(stage) && stage.label) return stage.label;
    return pressure && pressure.label;
  }
  function pressureDone(wave){
    const pressure = wave && wave.pressure;
    if(!pressure || pressure.enabled === false) return true;
    return state.pressureBursts >= getPressureMaxBursts(wave, pressure);
  }
  function updatePressureSpawns(){
    const wave = getCurrentWave();
    const pressure = wave && wave.pressure;
    if(!wave || !pressure || pressure.enabled === false) return;

    if(state.pressureBursts >= getPressureMaxBursts(wave, pressure)) return;

    if(state.pressureT > 0) state.pressureT--;

    const timerReached = state.pressureT <= 0;
    const enemiesCleared = !hasActiveEnemies() && state.queue.length === 0;
    const trigger = String(pressure.trigger || 'clearedOrTimer');
    const shouldBurst = trigger === 'timer' ? timerReached : trigger === 'cleared' ? enemiesCleared : (timerReached || enemiesCleared);
    if(!shouldBurst) return;

    const burstIndex = state.pressureBursts;
    const stage = getPressureBurstStage(wave, burstIndex);
    state.pressureBursts++;
    state.pressureT = getPressureBurstInterval(pressure, stage);
    queueSpawnGroups(getPressureBurstSpawns(wave, burstIndex), wave);
    if(pressure.dropChest !== false && (!stage || Array.isArray(stage) || stage.dropChest !== false) && wave.dropPressureChest !== false) spawnWaveChest();

    const cfg = getZoneConfig(state.zone);
    const label = getPressureBurstLabel(pressure, stage);
    if(label && shouldShowPressureText(cfg, pressure)){
      showCenterText(String(label).toUpperCase(), 24, 50, (window.C && C.BN1) ? C.BN1 : '#fff');
    }
  }
  function hasActiveEnemies(){
    try{ return typeof enemies !== 'undefined' && Array.isArray(enemies) && enemies.length > 0; }catch(err){ return false; }
  }
  function isFinalWave(){
    const cfg = getZoneConfig(state.zone);
    const waves = Array.isArray(cfg.waves) ? cfg.waves : [];
    return waves.length > 0 && state.waveIndex === waves.length - 1;
  }
  function isWaveSpawnSequenceComplete(){
    const wave = getCurrentWave();
    return state.waveActive && state.queue.length === 0 && pressureDone(wave);
  }
  function emitFinalWaveComplete(){
    if(state.finalWaveCompleteEmitted) return false;
    const wave = getCurrentWave();
    if(!wave) return false;
    state.finalWaveCompleteEmitted = true;
    state.waveComplete = true;
    state.waveActive = false;
    state.waveIntro = null;
    const payload = {
      zoneId: state.zone,
      waveIndex: state.waveIndex,
      waveNumber: state.waveIndex + 1,
      waveId: wave.id || null,
      finalWave: true,
      activeEnemies: (typeof enemies !== 'undefined' && Array.isArray(enemies)) ? enemies.length : 0,
      queuedSpawns: state.queue.length
    };
    try{ if(window.EventEngine) EventEngine.emit('wave.completed', payload); }catch(err){}
    try{ if(window.EventEngine) EventEngine.emit('waves.finalWaveComplete', payload); }catch(err){}
    try{ if(window.EventEngine) EventEngine.emit('waves.completed', payload); }catch(err){}
    return true;
  }
  function maybeCompleteFinalWave(){
    if(!isFinalWave()) return false;
    if(!isWaveSpawnSequenceComplete()) return false;
    return emitFinalWaveComplete();
  }
  function isWaveCleared(){
    const wave = getCurrentWave();
    return state.queue.length === 0 && !hasActiveEnemies() && pressureDone(wave);
  }
  function advanceWave(){
    const cfg = getZoneConfig(state.zone);
    const waves = Array.isArray(cfg.waves) ? cfg.waves : [];
    try{ if(window.EventEngine) EventEngine.emit('wave.completed', {zoneId:state.zone, waveIndex:state.waveIndex, waveId:(getCurrentWave() && getCurrentWave().id) || null}); }catch(err){}
    state.waveIndex++;
    if(state.waveIndex >= waves.length){ completeWaves(); return; }
    const next = waves[state.waveIndex];
    state.waveActive = false;
    state.waveIntro = null;
    state.waveSpawnCooldownT = 0;
    state.breakT = readTicks(next, 'startDelay', 'startDelaySec', readTicks(cfg, 'betweenWaveDelay', 'betweenWaveDelaySec', readTicks(cfg, 'startDelay', 'startDelaySec', 0)));
    state.pressureT = 0;
    state.pressureBursts = 0;
  }
  function grantZone1DoorKey(){
    try{
      if(typeof player !== 'undefined' && player && !player.zone1DoorKey){
        player.zone1DoorKey = true;
        showCenterText('ZONE 2 KEY!', 24, 70, (window.C && C.FR1) ? C.FR1 : '#fff');
      }
    }catch(err){}
  }
  function runCompletionEvent(event){
    if(!event || !event.type) return;
    if(event.type === 'emit'){
      try{ if(window.EventEngine) EventEngine.emit(event.event || 'progression.event', Object.assign({zoneId:state.zone}, event.payload || {})); }catch(err){}
      return;
    }
    if(event.type === 'grantZone1DoorKey'){ grantZone1DoorKey(); return; }
    if(event.type === 'spawnZone1Dragon' || event.type === 'spawnDragonBoss'){
      try{ if(typeof spawnDragonBoss === 'function' && !dragonBoss && !zone1MiniBossDefeated) spawnDragonBoss(); }catch(err){}
      return;
    }
    if(event.type === 'spawnShadowBoss'){
      try{ if(typeof spawnShadowBoss === 'function' && !shadowBoss && !shadowBossDefeated) spawnShadowBoss(); }catch(err){}
      return;
    }
    if(event.type === 'setFlag'){
      try{ window[event.name] = event.value !== false; }catch(err){}
    }
  }
  function completeWaves(){
    const cfg = getZoneConfig(state.zone);
    state.waveComplete = true;
    state.waveActive = false;
    state.waveIntro = null;
    // Do not clear queued or active enemies here. Wave/progression completion
    // should not erase spawned game objects.
    if(state.lastCompleteZone === state.zone) return;
    state.lastCompleteZone = state.zone;
    try{ if(window.EventEngine) EventEngine.emit('waves.completed', {zoneId:state.zone, waveIndex:state.waveIndex}); }catch(err){}
    const events = Array.isArray(cfg.onComplete) ? cfg.onComplete : (cfg.onComplete ? [cfg.onComplete] : []);
    for(const event of events) runCompletionEvent(event);
  }
  function update(){
    const zone = typeof currentZone !== 'undefined' ? Number(currentZone) : state.zone;
    const mode = getSpawnMode(zone);
    if(state.zone !== zone) enterZone(zone);
    updateZoneIntro();
    const runtimeMode = getRuntimeSpawnMode(zone);
    if(runtimeMode === 'none' || runtimeMode === 'passthrough') return;
    if(isZoneStartBlocked(zone)) return;
    if(runtimeMode === 'standard'){ updateStandardSpawn(); return; }
    if(runtimeMode !== 'waves') return;
    if(state.waveComplete) return;
    if(state.waveIntro){ updateWaveIntro(); return; }
    updateQueue();
    if(state.waveActive) updatePressureSpawns();
    if(state.waveActive && maybeCompleteFinalWave()) return;
    if(state.breakT > 0){ state.breakT--; return; }
    if(!state.waveActive){ startWave(); return; }
    if(isWaveCleared()) advanceWave();
  }
  function getDebugState(){
    return {zone: state.zone, spawnSystem: getSpawnMode(state.zone), runtimeSpawnSystem: getRuntimeSpawnMode(state.zone), waveIndex: state.waveIndex, waveActive: state.waveActive, waveComplete: state.waveComplete, finalWaveCompleteEmitted: state.finalWaveCompleteEmitted, waveIntroPhase: state.waveIntro ? state.waveIntro.phase : null, waveKills:getWaveKills(state.zone), standardInitialized: state.standardInitialized, standardComplete: state.standardComplete, queuedSpawns: state.queue.length, waveSpawnCooldownT: state.waveSpawnCooldownT, waveSpawnBudget:getWaveSpawnBudget(state.zone), legacyQueuedSpawns:(typeof pSpawns !== 'undefined' && Array.isArray(pSpawns)) ? pSpawns.length : 0, breakT: state.breakT, zoneGateT: state.zoneGateT, entryTextT: state.entryTextT, entryTextShown: state.entryTextShown, pressureT: state.pressureT, pressureBursts: state.pressureBursts, configName: getConfig().name || 'unnamed'};
  }

  window.BoneCrawlerZoneSpawn = {beginRun, enterZone, clear, update, updateZoneIntro, isZoneStartBlocked, getConfig, getZoneConfig, getSpawnMode, getRuntimeSpawnMode, isStandardMode, getStandardConfig, resolveEnemyStats, usesManagedSpawns, shouldOwnUpdate, awardEntryBonus, spawnAtPoint, spawnLegacy, spawnWaveChest, onEnemyDefeated, getDebugState};
})();
