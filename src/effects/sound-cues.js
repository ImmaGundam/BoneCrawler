// sound-cues
// Purpose: reusable sound cue mappings for object and enemy events.
(function(){
  if(window.BoneCrawlerSoundCues) return;

  function clone(value){
    if(value == null) return value;
    try{ return JSON.parse(JSON.stringify(value)); }
    catch(err){ return value; }
  }

  const cues = {
    'prop.break.wood': {
      id: 'prop.break.wood',
      label: 'Wood Break',
      audioEvent: 'enemyHit',
      sfxId: 'enemy.hit'
    },
    'prop.break.lantern': {
      id: 'prop.break.lantern',
      label: 'Lantern Break',
      audioEvent: 'enemyHit',
      sfxId: 'enemy.hit'
    },
    'enemy.death.skeleton': {
      id: 'enemy.death.skeleton',
      label: 'Skeleton Death',
      audioEvent: 'skeletonDeath',
      sfxId: 'skeleton.death'
    },
    'enemy.death.dragon': {
      id: 'enemy.death.dragon',
      label: 'Dragon Death',
      audioEvent: 'dragonDeath',
      sfxId: 'dragon.death'
    },
    'pickup.heart': {
      id: 'pickup.heart',
      label: 'Heart Pickup',
      audioEvent: 'keyPickup',
      sfxId: 'item.key'
    },
    'pickup.potion': {
      id: 'pickup.potion',
      label: 'Potion Pickup',
      audioEvent: 'keyPickup',
      sfxId: 'item.key'
    },
    'portal.magic': {
      id: 'portal.magic',
      label: 'Portal Magic',
      audioEvent: 'playerShield',
      sfxId: 'player.shield'
    }
  };

  window.BoneCrawlerSoundCues = {
    get(id){ return clone(cues[id] || null); },
    list(){ return Object.keys(cues).map(key => clone(cues[key])); },
    has(id){ return !!cues[id]; },
    cues
  };
})();
