// animation-templates
// Purpose: reusable effect templates for object and enemy events.
(function(){
  if(window.BoneCrawlerAnimationTemplates) return;

  function clone(value){
    if(value == null) return value;
    try{ return JSON.parse(JSON.stringify(value)); }
    catch(err){ return value; }
  }

  const templates = {
    crumble: {
      id: 'crumble',
      label: 'Crumble',
      kind: 'particleBurst',
      defaults: {
        material: 'wood',
        scaleMode: 'owner',
        count: 14,
        lifetime: 28,
        speedMin: 0.40,
        speedMax: 1.75,
        spread: 1.0,
        lift: 0.05,
        gravity: 0.035,
        sizeMin: 1,
        sizeMax: 2,
        colorSet: 'wood'
      }
    },
    lanternFlame: {
      id: 'lanternFlame',
      label: 'Lantern Flame',
      kind: 'particleBurst',
      defaults: {
        material: 'flame',
        scaleMode: 'owner',
        count: 18,
        lifetime: 30,
        speedMin: 0.25,
        speedMax: 1.45,
        spread: 1.0,
        lift: 0.35,
        gravity: 0.012,
        sizeMin: 1,
        sizeMax: 2,
        colorSet: 'flame'
      }
    },
    enemyDeath: {
      id: 'enemyDeath',
      label: 'Enemy Death',
      kind: 'particleBurst',
      defaults: {
        material: 'bone',
        scaleMode: 'owner',
        count: 10,
        lifetime: 24,
        speedMin: 0.45,
        speedMax: 1.85,
        spread: 1.0,
        lift: 0.12,
        gravity: 0.04,
        sizeMin: 1,
        sizeMax: 2,
        colorSet: 'bone'
      }
    },
    pickupPop: {
      id: 'pickupPop',
      label: 'Pickup Pop',
      kind: 'particleBurst',
      defaults: {
        material: 'magic',
        scaleMode: 'owner',
        count: 8,
        lifetime: 18,
        speedMin: 0.25,
        speedMax: 1.10,
        spread: 0.85,
        lift: 0.18,
        gravity: 0.015,
        sizeMin: 1,
        sizeMax: 2,
        colorSet: 'magic'
      }
    },
    portalPulse: {
      id: 'portalPulse',
      label: 'Portal Pulse',
      kind: 'particleBurst',
      defaults: {
        material: 'magic',
        scaleMode: 'owner',
        count: 12,
        lifetime: 26,
        speedMin: 0.15,
        speedMax: 0.95,
        spread: 1.2,
        lift: -0.02,
        gravity: 0,
        sizeMin: 1,
        sizeMax: 2,
        colorSet: 'portal'
      }
    }
  };

  window.BoneCrawlerAnimationTemplates = {
    get(id){ return clone(templates[id] || null); },
    list(){ return Object.keys(templates).map(key => clone(templates[key])); },
    has(id){ return !!templates[id]; },
    templates
  };
})();
