// progression rules
// Purpose: separates progression, transitions, rewards, dialog triggers, and object events from zone map/spawn logic.
(function(){
  if(window.EventEngine) return;

  function clone(value){ try{ return JSON.parse(JSON.stringify(value)); }catch(err){ return value; } }
  function asList(value){ return Array.isArray(value) ? value : (value ? [value] : []); }

  function currentZoneValue(){ try{ return Number(currentZone); }catch(err){ return 0; } }
  function playerValue(name){ try{ return player ? player[name] : undefined; }catch(err){ return undefined; } }

  function getActiveSpawnSystem(zone){
    try{
      const z = Number(zone || currentZoneValue());
      if(window.BoneCrawlerZoneSpawn && typeof BoneCrawlerZoneSpawn.getRuntimeSpawnMode === 'function'){
        return String(BoneCrawlerZoneSpawn.getRuntimeSpawnMode(z) || '');
      }
      if(window.BoneCrawlerZoneBindings && typeof BoneCrawlerZoneBindings.get === 'function'){
        const binding = BoneCrawlerZoneBindings.get(z) || {};
        return String((binding.spawn && binding.spawn.system) || '');
      }
    }catch(err){}
    return '';
  }

  function getGlobalValue(name){
    try{
      switch(String(name || '')){
        case 'currentZone': return currentZone;
        case 'score': return score;
        case 'killCount': return killCount;
        case 'secret1BlessingT': return secret1BlessingT;
        case 'shadowBossDefeated': return shadowBossDefeated;
        case 'bossDefeated': return bossDefeated;
        case 'zone1MiniBossDefeated': return zone1MiniBossDefeated;
        case 'zone3TreeAwake': return zone3TreeAwake;
        case 'zone3TreeMet': return zone3TreeMet;
        case 'masterSwordOwned': return masterSwordOwned;
        case 'secret2NpcMet': return secret2NpcMet;
        case 'secret1RatTalkCount': return secret1RatTalkCount;
        case 'secret1NodeSpoken': return secret1NodeSpoken;
        case 'zone1DoorKeyDialogShown': return zone1DoorKeyDialogShown;
        case 'zone1Kill90DialogShown': return zone1Kill90DialogShown;
        case 'zone1Kill109DialogShown': return zone1Kill109DialogShown;
        case 'zone2IntroDialogShown': return zone2IntroDialogShown;
        case 'zone2Kill30DialogShown': return zone2Kill30DialogShown;
        case 'zone3IntroDialogShown': return zone3IntroDialogShown;
        case 'zone3Kill80DialogShown': return zone3Kill80DialogShown;
        case 'zone3BossDefeatDialogShown': return zone3BossDefeatDialogShown;
        default: return window[name];
      }
    }catch(err){ return undefined; }
  }

  function setGlobalValue(name, value){
    try{
      switch(String(name || '')){
        case 'secret2NpcMet': secret2NpcMet = value; return true;
        case 'secret1NodeSpoken': secret1NodeSpoken = value; return true;
        case 'zone1DoorKeyDialogShown': zone1DoorKeyDialogShown = value; return true;
        case 'zone1Kill90DialogShown': zone1Kill90DialogShown = value; return true;
        case 'zone1Kill109DialogShown': zone1Kill109DialogShown = value; return true;
        case 'zone2IntroDialogShown': zone2IntroDialogShown = value; return true;
        case 'zone2Kill30DialogShown': zone2Kill30DialogShown = value; return true;
        case 'zone3IntroDialogShown': zone3IntroDialogShown = value; return true;
        case 'zone3Kill80DialogShown': zone3Kill80DialogShown = value; return true;
        case 'zone3BossDefeatDialogShown': zone3BossDefeatDialogShown = value; return true;
        default: window[name] = value; return true;
      }
    }catch(err){ return false; }
  }

  function getWorldFlag(name){
    try{
      const key = String(name || '');
      if(key.indexOf('zone1Broken.') === 0) return !!zone1Broken[Number(key.split('.')[1])];
      if(key.indexOf('zone2Broken.') === 0) return !!zone2Broken[Number(key.split('.')[1])];
      if(key.indexOf('zone3Broken.') === 0) return !!zone3Broken[Number(key.split('.')[1])];
      if(key === 'zone3TreeAwake') return !!zone3TreeAwake;
      return !!window[key];
    }catch(err){ return false; }
  }

  function getRectByName(name){
    try{
      switch(String(name || '')){
        case 'ZONE1_DOOR_RECT': return ZONE1_DOOR_RECT;
        case 'SECRET1_ENTRANCE_RECT': return SECRET1_ENTRANCE_RECT;
        case 'SECRET1_EXIT_DOOR_RECT': return SECRET1_EXIT_DOOR_RECT;
        case 'ZONE3_DOOR_RECT': return ZONE3_DOOR_RECT;
        case 'ZONE3_SECRET2_PORTAL_RECT': return ZONE3_SECRET2_PORTAL_RECT;
        case 'SECRET2_RETURN_PORTAL_RECT': return SECRET2_RETURN_PORTAL_RECT;
        case 'SECRET2_NPC_RECT': return SECRET2_NPC_RECT;
        case 'SECRET2_SWORD_RECT': return SECRET2_SWORD_RECT;
        case 'ZONE3_TREE_INTERACT_RECT': return ZONE3_TREE_INTERACT_RECT;
        case 'SECRET1_RAT_RECT': return SECRET1_RAT_RECT;
        case 'SECRET1_RAT_INTERACT_RECT': return SECRET1_RAT_INTERACT_RECT;
        default: return window[name];
      }
    }catch(err){ return null; }
  }

  function getRectByObjectId(objectId, field){
    try{
      if(window.SceneRuntime && typeof SceneRuntime.getEntity === 'function'){
        const entity = SceneRuntime.getEntity(String(objectId || ''));
        if(!entity) return null;
        if(field && entity[field]) return entity[field];
        return entity.rect || entity.breakRect || entity.blockRect || entity.interactRect || entity.triggerRect || null;
      }
    }catch(err){}
    return null;
  }

  function nearRect(rectName, pad){
    try{
      if(!player) return false;
      const rect = typeof rectName === 'string' ? getRectByName(rectName) : rectName;
      if(!rect || typeof ov !== 'function') return false;
      pad = Number(pad == null ? 4 : pad) || 0;
      const zone = {x:rect.x-pad, y:rect.y-pad, w:rect.w+pad*2, h:rect.h+pad*2};
      return ov({x:player.x,y:player.y,w:player.w,h:player.h}, zone);
    }catch(err){ return false; }
  }

  function compare(actual, cond){
    if(cond == null) return !!actual;
    if(Object.prototype.hasOwnProperty.call(cond, 'equals')) return actual === cond.equals;
    if(Object.prototype.hasOwnProperty.call(cond, 'notEquals')) return actual !== cond.notEquals;
    if(Object.prototype.hasOwnProperty.call(cond, 'atLeast')) return Number(actual) >= Number(cond.atLeast);
    if(Object.prototype.hasOwnProperty.call(cond, 'lte')) return Number(actual) <= Number(cond.lte);
    if(Object.prototype.hasOwnProperty.call(cond, 'gt')) return Number(actual) > Number(cond.gt);
    if(Object.prototype.hasOwnProperty.call(cond, 'lt')) return Number(actual) < Number(cond.lt);
    return !!actual;
  }

  function evalCondition(cond, payload){
    if(!cond) return true;
    if(cond.all) return asList(cond.all).every(item => evalCondition(item, payload));
    if(cond.any) return asList(cond.any).some(item => evalCondition(item, payload));
    if(cond.not) return !evalCondition(cond.not, payload);

    switch(String(cond.type || '')){
      case 'zone':
      case 'currentZone': return compare(currentZoneValue(), cond);
      case 'payload': return compare(payload ? payload[cond.name] : undefined, cond);
      case 'playerFlag': return compare(!!playerValue(cond.name), cond);
      case 'playerValue': return compare(playerValue(cond.name), cond);
      case 'globalFlag': return compare(!!getGlobalValue(cond.name), cond);
      case 'globalValue': return compare(getGlobalValue(cond.name), cond);
      case 'spawnSystem': return compare(getActiveSpawnSystem(cond.zone || (payload && payload.zoneId) || currentZoneValue()), cond);
      case 'globalAtLeast': return Number(getGlobalValue(cond.name)) >= Number(cond.value || cond.atLeast || 0);
      case 'worldFlag': return compare(getWorldFlag(cond.name), cond);
      case 'nearRect': return nearRect(cond.rect, cond.pad);
      case 'nearObject': return nearRect(getRectByObjectId(cond.objectId, cond.field), cond.pad);
      case 'keyDropKind': return typeof hasKeyDropKind === 'function' ? hasKeyDropKind(cond.kind) : false;
      case 'noKeyDropKind': return typeof hasKeyDropKind === 'function' ? !hasKeyDropKind(cond.kind) : true;
      case 'zoneKillsAtLeast': return typeof getZoneProgressKills === 'function' ? getZoneProgressKills(cond.zone || currentZoneValue()) >= Number(cond.value || cond.atLeast || 0) : false;
      default: return true;
    }
  }

  function evaluateRequires(requires, payload){
    if(!requires) return true;
    return evalCondition(requires, payload || {});
  }

  function promptFromRect(rectName, yPad){
    const rect = typeof rectName === 'string' ? (getRectByObjectId(rectName) || getRectByName(rectName)) : rectName;
    if(!rect) return {promptX:60, promptY:30};
    return {promptX:rect.x + rect.w / 2, promptY:rect.y - (yPad == null ? 4 : yPad)};
  }

  const __eventData = (window.GameContent && typeof GameContent.getEventData === 'function') ? GameContent.getEventData() : {transitionRules:[], interactionRules:[], scriptedDialogRules:[], runtimeEventRules:[]};
  const transitionRules = __eventData.transitionRules || [];
  const interactionRules = __eventData.interactionRules || [];
  const scriptedDialogRules = __eventData.scriptedDialogRules || [];
  const eventRules = __eventData.runtimeEventRules || [];

  function resolveRuleRect(rule){
    if(rule.objectId) return getRectByObjectId(rule.objectId, rule.field);
    if(rule.rect) return getRectByName(rule.rect);
    return null;
  }

  function getActiveTransition(){
    for(const rule of transitionRules){
      if(!evaluateRequires(rule.requires)) continue;
      const resolvedRect = resolveRuleRect(rule);
      const prompt = rule.objectId ? promptFromRect(rule.objectId, 4) : promptFromRect(rule.rect, 4);
      return {
        id: rule.id,
        rect: resolvedRect,
        promptX: prompt.promptX,
        promptY: prompt.promptY,
        nextZone: rule.nextZone,
        transitionOpts: clone(rule.transitionOpts || {fromZone:rule.fromZone})
      };
    }
    return null;
  }

  function getActiveInteractionTarget(){
    for(const rule of interactionRules){
      if(!evaluateRequires(rule.requires)) continue;
      const prompt = rule.objectId ? promptFromRect(rule.objectId, rule.yPad) : promptFromRect(rule.rect, rule.yPad);
      return {type:rule.type, promptX:prompt.promptX, promptY:prompt.promptY, ruleId:rule.id};
    }
    return null;
  }

  function maybeTriggerScriptedDialog(){
    try{ if(typeof gState !== 'undefined' && gState !== 'playing') return false; }catch(err){}
    for(const rule of scriptedDialogRules){
      if(rule.onceFlag && getGlobalValue(rule.onceFlag)) continue;
      if(!evaluateRequires(rule.requires)) continue;
      if(rule.onceFlag) setGlobalValue(rule.onceFlag, true);
      const dialog = rule.dialogId && window.GameContent && typeof GameContent.getDialog === 'function' ? GameContent.getDialog(rule.dialogId) : null;
      const pages = dialog ? clone(dialog.pages || []) : (typeof rule.pages === 'function' ? rule.pages() : clone(rule.pages || []));
      if(typeof openDialogSequence === 'function'){
        openDialogSequence((dialog && dialog.title) || rule.title || 'NODE', pages, (dialog && dialog.mode) || rule.mode || 'npc');
        return true;
      }
    }
    return false;
  }

  function resolveActionNumber(action, key, payload, fallback){
    const value = action[key];
    const offset = Number(action[key + 'Offset'] || 0) || 0;
    if(typeof value === 'number') return value + offset;
    if(typeof value === 'string' && payload && typeof payload[value] === 'number') return payload[value] + offset;
    if(payload && typeof payload[key] === 'number') return payload[key] + offset;
    return (Number(fallback) || 0) + offset;
  }

  function showText(action, payload){
    try{
      if(typeof floatTexts === 'undefined' || !Array.isArray(floatTexts)) return false;
      const x = resolveActionNumber(action, 'x', payload, (typeof GW !== 'undefined' ? GW / 2 : 60));
      const y = resolveActionNumber(action, 'y', payload, (typeof PY !== 'undefined' ? PY : 17) + Number(action.yBase || 0));
      floatTexts.push({x, y, text:String(action.text || ''), life:action.life || 70, max:action.life || 70, col:action.col || ((typeof C !== 'undefined' && C.BN1) ? C.BN1 : '#fff')});
      return true;
    }catch(err){ return false; }
  }

  function runAction(action, payload){
    if(!action || typeof action !== 'object') return false;
    if(action.requires && !evaluateRequires(action.requires, payload)) return false;
    switch(String(action.type || '')){
      case 'spawnObject':
        if(window.ObjectSpawnEngine && typeof ObjectSpawnEngine.spawn === 'function') return ObjectSpawnEngine.spawn(action, payload || {});
        return false;
      case 'showText': return showText(action, payload || {});
      case 'setGlobalFlag': return setGlobalValue(action.name, action.value !== false);
      case 'grantPlayerFlag':
        try{ if(player && action.name){ player[action.name] = action.value !== false; return true; } }catch(err){}
        return false;
      case 'openDialog':
        if(typeof openDialogSequence === 'function'){ const dialog = action.dialogId && window.GameContent && typeof GameContent.getDialog === 'function' ? GameContent.getDialog(action.dialogId) : null; openDialogSequence((dialog && dialog.title) || action.title || 'NODE', clone((dialog && dialog.pages) || action.pages || []), (dialog && dialog.mode) || action.mode || 'npc'); return true; }
        return false;
      case 'call':
        try{ if(typeof window[action.name] === 'function') return !!window[action.name](...(action.args || [])); }catch(err){}
        return false;
      default: return false;
    }
  }

  function handleEvent(name, payload){
    let handled = false;
    for(const rule of eventRules){
      if(rule.on !== name) continue;
      if(!evaluateRequires(rule.requires, payload || {})) continue;
      for(const action of asList(rule.actions)){
        handled = runAction(action, payload || {}) || handled;
      }
    }
    return handled;
  }

  function emit(name, payload){
    if(window.EventBus && typeof EventBus.emit === 'function') return EventBus.emit(name, payload || {});
    return {handled:handleEvent(name, payload || {}), results:[]};
  }

  if(window.EventBus && typeof EventBus.on === 'function'){
    EventBus.on('*', function(payload, name){ return handleEvent(name, payload); });
  }

  window.EventEngine = {
    evaluateRequires,
    evalCondition,
    getActiveTransition,
    getActiveInteractionTarget,
    maybeTriggerScriptedDialog,
    handleEvent,
    emit,
    runAction,
    rules:{transitionRules, interactionRules, scriptedDialogRules, eventRules}
  };
})();
