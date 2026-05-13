// object-event-system
// Purpose: bind object events to reusable animation and sound systems.
(function(){
  if(window.BoneCrawlerObjectEvents) return;

  function readBinding(owner, eventName){
    if(!owner || typeof owner !== 'object') return null;
    if(owner.events && owner.events[eventName]) return owner.events[eventName];
    if(owner.components && owner.components.events && owner.components.events[eventName]) return owner.components.events[eventName];
    return null;
  }

  function emit(owner, eventName, ctx){
    const binding = readBinding(owner, eventName);
    if(!binding || typeof binding !== 'object') return false;
    let handled = false;
    try{
      if(binding.animation && window.BoneCrawlerAnimationSystem && typeof BoneCrawlerAnimationSystem.playBinding === 'function'){
        handled = BoneCrawlerAnimationSystem.playBinding(owner, binding.animation, ctx || {}) || handled;
      }
    }catch(err){}
    try{
      if(binding.sound && window.BoneCrawlerSoundSystem && typeof BoneCrawlerSoundSystem.playBinding === 'function'){
        handled = BoneCrawlerSoundSystem.playBinding(owner, binding.sound, ctx || {}) || handled;
      }
    }catch(err){}
    return handled;
  }

  window.BoneCrawlerObjectEvents = { emit, readBinding };
})();
