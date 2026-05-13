// sound-system
// Purpose: execute reusable sound cues against the existing audio service.
(function(){
  if(window.BoneCrawlerSoundSystem) return;

  function getCue(id){
    try{
      if(window.BoneCrawlerSoundCues && typeof BoneCrawlerSoundCues.get === 'function') return BoneCrawlerSoundCues.get(id);
    }catch(err){}
    return null;
  }

  function playCue(id, owner, params){
    const cue = getCue(id);
    if(!cue) return false;
    try{
      if(cue.audioEvent && window.AudioEvents && typeof AudioEvents[cue.audioEvent] === 'function'){
        AudioEvents[cue.audioEvent](owner, params || {});
        return true;
      }
    }catch(err){}
    try{
      if(cue.sfxId && window.BoneCrawlerAudio && typeof BoneCrawlerAudio.playSfx === 'function'){
        BoneCrawlerAudio.playSfx(cue.sfxId, params || {});
        return true;
      }
    }catch(err){}
    return false;
  }

  function playBinding(owner, binding, ctx){
    if(!binding || typeof binding !== 'object') return false;
    const cueId = binding.cue || binding.id || binding.name || '';
    if(!cueId) return false;
    return playCue(cueId, owner, ctx || {});
  }

  window.BoneCrawlerSoundSystem = {
    playCue,
    playBinding
  };
})();
