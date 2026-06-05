// scene-flow-runtime
// Purpose: authoritative transition/interaction flow owner sitting between EventEngine rules and zone entry helpers.
(function(){
  'use strict';
  const runtimeApi = window.GameRuntimeApi || null;

  function currentTransition(){
    try{
      if(window.EventEngine && typeof EventEngine.getActiveTransition === 'function'){
        return EventEngine.getActiveTransition();
      }
    }catch(err){}
    return null;
  }

  function currentInteraction(){
    try{
      if(window.EventEngine && typeof EventEngine.getActiveInteractionTarget === 'function'){
        return EventEngine.getActiveInteractionTarget();
      }
    }catch(err){}
    return null;
  }

  function getCurrentInteractionTarget(){
    if(typeof gState !== 'undefined' && gState !== 'playing') return null;
    const target = currentInteraction();
    if(target) return target;
    const transition = currentTransition();
    if(transition) return {type:'transition', promptX:transition.promptX, promptY:transition.promptY, data:transition};
    return null;
  }

  function buildTransitionInfo(nextZone, opts={}){
    const fromZone = ('fromZone' in opts) ? opts.fromZone : (typeof currentZone !== 'undefined' ? currentZone : 0);
    const hideStats = ('hideStats' in opts) ? !!opts.hideStats : (typeof isSecretZone === 'function' ? !!isSecretZone(fromZone) : false);
    let rankInfo = { rank:'?', message:'Well done, Bonecrawler', lines:['Well done,','Bonecrawler'] };
    try{
      if(typeof getRankInfo === 'function') rankInfo = getRankInfo(typeof score !== 'undefined' ? score : 0, fromZone, nextZone) || rankInfo;
    }catch(err){}
    return {
      nextZone,
      fromZone,
      hideStats,
      title: opts.title || (hideStats ? '????' : ((typeof getZoneLabel === 'function' ? getZoneLabel(fromZone) : 'ZONE') + ' CLEAR')),
      messageLines: opts.messageLines || (hideStats ? ['Looks like you','found a secret. .'] : (rankInfo.lines || [rankInfo.message])),
      rank: hideStats ? '????' : (rankInfo.rank || '?'),
      resumePlay: !!opts.resumePlay
    };
  }

  function openZoneTransition(nextZone, opts={}){
    pendingZoneTransition = nextZone;
    zoneTransitionInfo = buildTransitionInfo(nextZone, opts || {});
    if(typeof clearGameplayKeys === 'function') clearGameplayKeys();
    gState = 'zone_transition';
    return zoneTransitionInfo;
  }

  function finishRunVictory(){
    try{
      const runFlow = (runtimeApi && runtimeApi.lookup('runFlow', ['BoneCrawlerRunFlow'])) || window.BoneCrawlerRunFlow;
      if(runFlow && typeof runFlow.goToTitleState === 'function'){
        runFlow.goToTitleState({clearAllSceneCaches:true, stopAudio:true});
      } else if(typeof goToTitleState === 'function') {
        goToTitleState({clearAllSceneCaches:true, stopAudio:true});
      } else if(window.AudioEvents && typeof AudioEvents.stopAll === 'function') {
        AudioEvents.stopAll();
      }
    }catch(err){}
    if(typeof runStartMs !== 'undefined' && runStartMs > 0 && typeof runTimeMs !== 'undefined' && runTimeMs <= 0) runTimeMs = performance.now() - runStartMs;
    const titleFlow = (runtimeApi && runtimeApi.lookup('titleFlow', ['BoneCrawlerTitleFlow'])) || window.BoneCrawlerTitleFlow || null;
    if(titleFlow && typeof titleFlow.saveRunIfNeeded === 'function') titleFlow.saveRunIfNeeded();
    else if(typeof saveRunIfNeeded === 'function') saveRunIfNeeded();
    pendingZoneTransition = 0;
    zoneTransitionInfo = null;
    if(typeof clearGameplayKeys === 'function') clearGameplayKeys();
    if(typeof retryTaxPaid !== 'undefined') retryTaxPaid = false;
    if(typeof retryPromptMode !== 'undefined') retryPromptMode = '';
    if(typeof startupDialogPending !== 'undefined' && typeof newGamePlus !== 'undefined') startupDialogPending = !!newGamePlus;
    const runFlow = (runtimeApi && runtimeApi.lookup('runFlow', ['BoneCrawlerRunFlow'])) || window.BoneCrawlerRunFlow;
    if((!runFlow || typeof runFlow.goToTitleState !== 'function') && typeof goToTitleState !== 'function') gState = 'title';
  }

  function continueZoneTransition(){
    if(gState !== 'zone_transition') return;
    const info = zoneTransitionInfo || {};
    const nextZone = pendingZoneTransition || 2;
    pendingZoneTransition = 0;
    zoneTransitionInfo = null;
    if(info.resumePlay){
      if(typeof clearGameplayKeys === 'function') clearGameplayKeys();
      gState = 'playing';
      return;
    }
    try{ if(window.AudioEvents && typeof AudioEvents.doorUnlock === 'function') AudioEvents.doorUnlock(); }catch(err){}
    if(nextZone === 2 && typeof enterZone2 === 'function') enterZone2();
    else if(nextZone === 3 && typeof enterZone3 === 'function') enterZone3();
    else if(typeof ZONE_SECRET1 !== 'undefined' && nextZone === ZONE_SECRET1 && typeof enterSecretZone1 === 'function') enterSecretZone1();
    else if(typeof ZONE_SECRET2 !== 'undefined' && nextZone === ZONE_SECRET2 && typeof enterSecretZone2 === 'function') enterSecretZone2();
    else if(nextZone === -1) return finishRunVictory();
    if(typeof clearGameplayKeys === 'function') clearGameplayKeys();
    gState = 'playing';
  }

  function startLeaveZoneConfirm(transition){
    if(!transition) return;
    leaveZonePromptData = transition;
    if(typeof clearGameplayKeys === 'function') clearGameplayKeys();
    gState = 'leave_zone_confirm';
  }

  function confirmLeaveZone(){
    if(gState !== 'leave_zone_confirm' || !leaveZonePromptData) return;
    const transition = leaveZonePromptData;
    if(transition.id === 'zone3_exit' || transition.id === 'secret2_return') runCompleted = true;
    leaveZonePromptData = null;
    openZoneTransition(transition.nextZone, transition.transitionOpts || {});
  }

  function cancelLeaveZone(){
    if(gState !== 'leave_zone_confirm') return;
    leaveZonePromptData = null;
    if(typeof clearGameplayKeys === 'function') clearGameplayKeys();
    gState = 'playing';
  }

  function interactionIs(type){
    const target = currentInteraction();
    return !!(target && target.type === type);
  }

  const api = {
    getCurrentInteractionTarget,
    getActiveZoneTransitionInteractable: currentTransition,
    buildTransitionInfo,
    openZoneTransition,
    continueZoneTransition,
    finishRunVictory,
    startLeaveZoneConfirm,
    confirmLeaveZone,
    cancelLeaveZone,
    interactionIs
  };
  if(runtimeApi && typeof runtimeApi.register === 'function') runtimeApi.register('sceneFlow', api, { legacy: ['BoneCrawlerSceneFlow'] });
  else window.BoneCrawlerSceneFlow = api;
})();
