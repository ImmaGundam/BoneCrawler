// player-ability-runtime
// Purpose: package-aware runtime registry for player move and upgrade handlers.
(function(){
  const runtimeApi = window.GameRuntimeApi || null;
  if((runtimeApi && runtimeApi.lookup('playerAbilities', ['BoneCrawlerPlayerAbilities'])) || window.BoneCrawlerPlayerAbilities) return;

  const fallbackManifest={
    player:{
      moves:[
        {id:'attack',label:'Attack',input:['Space','MouseLeft','Tap'],runtimeHandler:'player.attack'},
        {id:'block',label:'Block',input:['KeyF','TouchBlock'],runtimeHandler:'player.block'},
        {id:'dodge',label:'Dodge',input:['ShiftLeft','ShiftRight','TouchDodge'],runtimeHandler:'player.dodge'},
        {id:'interact',label:'Interact',input:['Enter','KeyE','TouchInteract'],runtimeHandler:'player.interact'}
      ]
    },
    progression:{
      upgrades:[
        {id:'heart',label:'Heart',stacking:'bounded',runtimeHandler:'upgrade.heart'},
        {id:'sword',label:'Sword',stacking:'linear',runtimeHandler:'upgrade.sword'},
        {id:'shield',label:'Magic Shield',stacking:'linear',runtimeHandler:'upgrade.shield'},
        {id:'speed',label:'Speed',stacking:'bounded',runtimeHandler:'upgrade.speed'},
        {id:'shadowstep',label:'Shadow Step',stacking:'linear',runtimeHandler:'upgrade.shadowstep'},
        {id:'reflect',label:'Reflect',requiresMove:'block',stacking:'unlock',runtimeHandler:'upgrade.reflect'},
        {id:'mirror',label:'Mirror',requiresUpgrade:'reflect',stacking:'cooldown-reduction',cooldownSeconds:4,minimumCooldownSeconds:2,runtimeHandler:'upgrade.mirror'},
        {id:'points',label:'Points',stacking:'reward-roll',runtimeHandler:'upgrade.points'}
      ]
    }
  };

  const moveHandlers=new Map();
  const upgradeHandlers=new Map();

  function getManifest(){
    try{
      const gamePackage = runtimeApi && typeof runtimeApi.lookup === 'function'
        ? runtimeApi.lookup('package', ['BoneCrawlerPackage'])
        : window.BoneCrawlerPackage;
      if(gamePackage && gamePackage.manifest) return gamePackage.manifest;
    }catch(err){}
    return fallbackManifest;
  }

  function listMoves(){
    const manifest=getManifest();
    return manifest && manifest.player && Array.isArray(manifest.player.moves) ? manifest.player.moves.slice() : fallbackManifest.player.moves.slice();
  }

  function listUpgrades(){
    const manifest=getManifest();
    return manifest && manifest.progression && Array.isArray(manifest.progression.upgrades) ? manifest.progression.upgrades.slice() : fallbackManifest.progression.upgrades.slice();
  }

  function getMove(id){
    return listMoves().find(entry=>entry && entry.id===id) || null;
  }

  function getUpgrade(id){
    return listUpgrades().find(entry=>entry && entry.id===id) || null;
  }

  function resolveMoveHandlerKey(id){
    const move=getMove(id);
    return (move && move.runtimeHandler) || id;
  }

  function resolveUpgradeHandlerKey(id){
    const upgrade=getUpgrade(id);
    return (upgrade && upgrade.runtimeHandler) || id;
  }

  function registerMoveHandler(name, handler){
    if(!name || typeof handler!=='function') return false;
    moveHandlers.set(String(name), handler);
    return true;
  }

  function registerUpgradeHandler(name, handler){
    if(!name || typeof handler!=='function') return false;
    upgradeHandlers.set(String(name), handler);
    return true;
  }

  function performMove(id, payload){
    const key=resolveMoveHandlerKey(id);
    const handler=moveHandlers.get(String(key)) || moveHandlers.get(String(id));
    if(typeof handler!=='function') return false;
    return !!handler(payload||{}, getMove(id));
  }

  function applyUpgrade(id, payload){
    const key=resolveUpgradeHandlerKey(id);
    const handler=upgradeHandlers.get(String(key)) || upgradeHandlers.get(String(id));
    if(typeof handler!=='function') return false;
    return !!handler(payload||{}, getUpgrade(id));
  }

  const api = {
    getManifest,
    getMoves:listMoves,
    getMove,
    getUpgrades:listUpgrades,
    getUpgrade,
    registerMoveHandler,
    registerUpgradeHandler,
    performMove,
    applyUpgrade
  };
  if(runtimeApi && typeof runtimeApi.register === 'function') runtimeApi.register('playerAbilities', api, { legacy: ['BoneCrawlerPlayerAbilities'] });
  else window.BoneCrawlerPlayerAbilities = api;
})();
