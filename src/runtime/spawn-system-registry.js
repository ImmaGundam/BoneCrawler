// spawn-system-registry
// Purpose: editor/runtime list of selectable spawn subsystems.
(function(){
  if(window.BoneCrawlerSpawnSystems) return;

  const systems = Object.create(null);

  function normalizeId(id){ return String(id || '').trim().toLowerCase(); }
  function register(id, spec){
    id = normalizeId(id);
    if(!id) return null;
    systems[id] = Object.assign({id}, spec || {});
    return systems[id];
  }
  function get(id){ return systems[normalizeId(id)] || null; }
  function list(){ return Object.keys(systems).sort().map(id => systems[id]); }
  function isManaged(id){
    const spec = get(id);
    return !!(spec && spec.managed);
  }

  register('standard', {
    label:'Standard Spawn',
    description:'Selectable kill-count spawn subsystem. Uses the original queue, thresholds, special spawns, chests, and boss triggers through explicit zone config.',
    managed:true,
    configShape:'standard'
  });
  register('killcount', {
    label:'Kill Count Spawn',
    description:'Alias-style selectable mode for the Standard Spawn subsystem.',
    managed:true,
    runtime:'standard',
    configShape:'standard'
  });
  register('legacy', {
    label:'Legacy Fallback Spawn',
    description:'Original fallback branch. Kept for compatibility; prefer standard for editor-selectable kill-count spawning.',
    managed:false,
    configShape:'legacy'
  });
  register('waves', {
    label:'Wave Spawn',
    description:'Uses zone-owned waves, spawn points, pressure bursts, and wave completion events.',
    managed:true,
    configShape:'waves'
  });
  register('none', {
    label:'No Enemy Spawns',
    description:'Zone does not spawn enemies; useful for title, secret, story, and reward rooms.',
    managed:true,
    configShape:'none'
  });
  register('passthrough', {
    label:'Passthrough',
    description:'Zone runtime owns the zone but does not create enemies.',
    managed:true,
    configShape:'none'
  });

  window.BoneCrawlerSpawnSystems = {register, get, list, isManaged, systems};
})();
