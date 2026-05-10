// progression rules
// Purpose: separates progression, transitions, rewards, dialog triggers, and object events from zone map/spawn logic.
(function(){
  if(window.BoneCrawlerProgression) return;

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
    const rect = getRectByName(rectName);
    if(!rect) return {promptX:60, promptY:30};
    return {promptX:rect.x + rect.w / 2, promptY:rect.y - (yPad == null ? 4 : yPad)};
  }

  const transitionRules = [
    {
      id:'zone1_secret1', fromZone:1, nextZone:101, rect:'SECRET1_ENTRANCE_RECT', transitionOpts:{fromZone:1},
      requires:{all:[
        {type:'zone', equals:1},
        {type:'playerFlag', name:'secret1Key', equals:true},
        {type:'worldFlag', name:'zone1Broken.0', equals:true},
        {type:'noKeyDropKind', kind:'secret1'},
        {type:'nearRect', rect:'SECRET1_ENTRANCE_RECT', pad:4}
      ]}
    },
    {
      id:'zone1_zone2', fromZone:1, nextZone:2, rect:'ZONE1_DOOR_RECT', transitionOpts:{fromZone:1},
      requires:{all:[
        {type:'zone', equals:1},
        {type:'playerFlag', name:'zone1DoorKey', equals:true},
        {type:'nearRect', rect:'ZONE1_DOOR_RECT', pad:4}
      ]}
    },
    {
      id:'secret1_exit', fromZone:101, nextZone:2, rect:'SECRET1_EXIT_DOOR_RECT', transitionOpts:{fromZone:101, secret:true},
      requires:{all:[
        {type:'zone', equals:101},
        {type:'globalValue', name:'secret1BlessingT', lte:0},
        {type:'nearRect', rect:'SECRET1_EXIT_DOOR_RECT', pad:4}
      ]}
    },
    {
      id:'zone3_exit', fromZone:3, nextZone:-1, rect:'ZONE3_DOOR_RECT',
      transitionOpts:{fromZone:3,title:'ZONE CLEAR',messageLines:['Well done,','Bonecrawler'],hideStats:false},
      requires:{all:[
        {type:'zone', equals:3},
        {type:'playerFlag', name:'hasKey', equals:true},
        {type:'nearRect', rect:'ZONE3_DOOR_RECT', pad:4}
      ]}
    },
    {
      id:'zone3_secret2', fromZone:3, nextZone:102, rect:'ZONE3_SECRET2_PORTAL_RECT', transitionOpts:{fromZone:3},
      requires:{all:[
        {type:'zone', equals:3},
        {type:'globalFlag', name:'shadowBossDefeated', equals:true},
        {type:'globalAtLeast', name:'score', value:999},
        {type:'nearRect', rect:'ZONE3_SECRET2_PORTAL_RECT', pad:4}
      ]}
    },
    {
      id:'secret2_return', fromZone:102, nextZone:-1, rect:'SECRET2_RETURN_PORTAL_RECT',
      transitionOpts:{fromZone:3,title:'ZONE CLEAR',messageLines:['Well done,','Bonecrawler'],hideStats:false},
      requires:{all:[
        {type:'zone', equals:102},
        {type:'nearRect', rect:'SECRET2_RETURN_PORTAL_RECT', pad:4}
      ]}
    }
  ];

  const interactionRules = [
    {id:'secret2Sword', type:'secret2Sword', zone:102, rect:'SECRET2_SWORD_RECT', yPad:3, requires:{all:[{type:'zone',equals:102},{type:'globalFlag',name:'masterSwordOwned',equals:false},{type:'nearRect',rect:'SECRET2_SWORD_RECT',pad:4}]}},
    {id:'secret2Npc', type:'secret2Npc', zone:102, rect:'SECRET2_NPC_RECT', yPad:6, requires:{all:[{type:'zone',equals:102},{type:'nearRect',rect:'SECRET2_NPC_RECT',pad:4}]}},
    {id:'zone3Tree', type:'zone3Tree', zone:3, rect:'ZONE3_TREE_INTERACT_RECT', yPad:4, requires:{all:[{type:'zone',equals:3},{type:'globalFlag',name:'zone3TreeAwake',equals:true},{type:'nearRect',rect:'ZONE3_TREE_INTERACT_RECT',pad:0}]}},
    {id:'secret1Rat', type:'secret1Rat', zone:101, rect:'SECRET1_RAT_RECT', yPad:5, requires:{all:[{type:'zone',equals:101},{type:'nearRect',rect:'SECRET1_RAT_INTERACT_RECT',pad:0}]}}
  ];

  const scriptedDialogRules = [
    {id:'zone1_key_drop_hint', onceFlag:'zone1DoorKeyDialogShown', requires:{all:[{type:'zone',equals:1},{type:'keyDropKind',kind:'zone1Door'}]}, title:'NODE', pages:[{speaker:'NODE',lines:['Grab the key!']}]},
    {id:'zone1_secret_hint', onceFlag:'zone1Kill90DialogShown', requires:{all:[{type:'zone',equals:1},{type:'zoneKillsAtLeast',zone:1,value:90}]}, title:'NODE', pages:[{speaker:'NODE',lines:["There's a grate to the left..",'It looks locked..',"Maybe there's a way to unlock it?"]}]},
    {id:'zone1_dragon_hint', onceFlag:'zone1Kill109DialogShown', requires:{all:[{type:'zone',equals:1},{type:'zoneKillsAtLeast',zone:1,value:109}]}, title:'NODE', pages:[{speaker:'NODE',lines:['I hear something..']},{speaker:'NODE',lines:['.. keep fighting.']}]},
    {id:'zone2_intro', onceFlag:'zone2IntroDialogShown', requires:{all:[{type:'zone',equals:2}]}, title:'NODE', pages:[{speaker:'NODE',lines:['Seeesh. How many skellys was that?']},{speaker:'PLAYER',lines:['Too many.']},{speaker:'NODE',lines:['Yeah. Good job!','.... Now do it again!']},{speaker:'PLAYER',lines:['Here they come..']}]},
    {id:'zone2_dragon_hint', onceFlag:'zone2Kill30DialogShown', requires:{all:[{type:'zone',equals:2},{type:'zoneKillsAtLeast',zone:2,value:25}]}, title:'NODE', pages:function(){ return [{speaker:'NODE',lines:['Shh.. do you hear that?','I smell a dragon!']},{speaker:'PLAYER',lines:[getGlobalValue('secret1NodeSpoken') ? 'Rats can smell dragons?' : 'Wait, what? Are you here?']},{speaker:'NODE',lines:['....']},{speaker:'PLAYER',lines:['Here we go again..']}]; }},
    {id:'zone3_intro', onceFlag:'zone3IntroDialogShown', requires:{all:[{type:'zone',equals:3}]}, title:'NODE', pages:[{speaker:'NODE',lines:['I smell an evil soul..',"it's in here somewhere"]}]},
    {id:'zone3_push', onceFlag:'zone3Kill80DialogShown', requires:{all:[{type:'zone',equals:3},{type:'zoneKillsAtLeast',zone:3,value:80}]}, title:'NODE', pages:[{speaker:'NODE',lines:["Don't give up!"]}]},
    {id:'zone3_boss_defeat', onceFlag:'zone3BossDefeatDialogShown', requires:{all:[{type:'zone',equals:3},{type:'globalFlag',name:'shadowBossDefeated',equals:true}]}, title:'NODE', pages:[{speaker:'NODE',lines:['Good job..',"You'll do good Bonecrawler."]},{speaker:'NODE',lines:['See ya next game.']}]}
  ];

  const eventRules = [
    {id:'zone1_wave_drop_zone1_key_80', on:'enemy.defeated', requires:{all:[{type:'payload',name:'zoneId',equals:1},{type:'spawnSystem',equals:'waves'},{type:'zoneKillsAtLeast',zone:1,value:80},{type:'playerFlag',name:'zone1DoorKey',equals:false},{type:'noKeyDropKind',kind:'zone1Door'}]}, actions:[{type:'spawnObject', objectType:'item', itemType:'key', kind:'zone1Door', x:'x', y:'y', xOffset:-3, yOffset:-3},{type:'showText', text:'ZONE 1 KEY!', y:28}]},
    {id:'zone1_final_wave_spawn_dragon', on:'waves.finalWaveComplete', requires:{all:[{type:'payload',name:'zoneId',equals:1}]}, actions:[{type:'spawnObject', objectType:'boss', objectId:'zone1Dragon'}]},
    {id:'zone2_final_wave_spawn_dragon', on:'waves.finalWaveComplete', requires:{all:[{type:'payload',name:'zoneId',equals:2}]}, actions:[{type:'spawnObject', objectType:'boss', objectId:'dragonBoss'}]},
    {id:'zone3_final_wave_spawn_shadow', on:'waves.finalWaveComplete', requires:{all:[{type:'payload',name:'zoneId',equals:3}]}, actions:[{type:'spawnObject', objectType:'boss', objectId:'shadowBoss'}]},
    {id:'zone1_dragon_drop_secret_key', on:'boss.defeated', requires:{all:[{type:'payload',name:'bossId',equals:'zone1Dragon'},{type:'playerFlag',name:'secret1Key',equals:false},{type:'noKeyDropKind',kind:'secret1'}]}, actions:[{type:'spawnObject', objectType:'item', itemType:'key', kind:'secret1', x:'x', y:'y', xOffset:3, yOffset:-3},{type:'showText', text:'SECRET KEY!', y:28}]},
    {id:'zone3_shadow_drop_key', on:'boss.defeated', requires:{all:[{type:'payload',name:'bossId',equals:'shadowBoss'},{type:'noKeyDropKind',kind:'zone3'}]}, actions:[{type:'spawnObject', objectType:'item', itemType:'key', kind:'zone3', x:'x', y:'y', xOffset:-3, yOffset:-3}]}
  ];

  function getActiveTransition(){
    for(const rule of transitionRules){
      if(!evaluateRequires(rule.requires)) continue;
      const prompt = promptFromRect(rule.rect, 4);
      return {
        id: rule.id,
        rect: getRectByName(rule.rect),
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
      const prompt = promptFromRect(rule.rect, rule.yPad);
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
      const pages = typeof rule.pages === 'function' ? rule.pages() : clone(rule.pages || []);
      if(typeof openDialogSequence === 'function'){
        openDialogSequence(rule.title || 'NODE', pages, rule.mode || 'npc');
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
        if(window.BoneCrawlerObjects && typeof BoneCrawlerObjects.spawn === 'function') return BoneCrawlerObjects.spawn(action, payload || {});
        return false;
      case 'showText': return showText(action, payload || {});
      case 'setGlobalFlag': return setGlobalValue(action.name, action.value !== false);
      case 'grantPlayerFlag':
        try{ if(player && action.name){ player[action.name] = action.value !== false; return true; } }catch(err){}
        return false;
      case 'openDialog':
        if(typeof openDialogSequence === 'function'){ openDialogSequence(action.title || 'NODE', clone(action.pages || []), action.mode || 'npc'); return true; }
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
    if(window.BoneCrawlerEvents && typeof BoneCrawlerEvents.emit === 'function') return BoneCrawlerEvents.emit(name, payload || {});
    return {handled:handleEvent(name, payload || {}), results:[]};
  }

  if(window.BoneCrawlerEvents && typeof BoneCrawlerEvents.on === 'function'){
    BoneCrawlerEvents.on('*', function(payload, name){ return handleEvent(name, payload); });
  }

  window.BoneCrawlerProgression = {
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
