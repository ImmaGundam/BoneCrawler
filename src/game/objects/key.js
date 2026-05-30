(function(){
  'use strict';
  if(!window.GameContent) return;

  function labelForKind(kind){
    switch(String(kind || '')){
      case 'zone1Door': return 'Zone 1 Key';
      case 'secret1': return 'Secret Key';
      case 'zone2': return 'Zone 2 Key';
      case 'zone3': return 'Zone 3 Key';
      default: return 'Key';
    }
  }

  GameContent.defineObjectType('key', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect);
    const kind = cfg.kind || 'zone3';
    return {
      id: cfg.id || ('key.' + String(kind)),
      type: 'item',
      objectType: 'item',
      itemType: 'key',
      kind,
      label: cfg.label || labelForKind(kind),
      category: 'item',
      group: cfg.group || 'key',
      rect,
      interactRect: GameContent.cloneRect(cfg.interactRect || rect),
      triggerRect: GameContent.cloneRect(cfg.triggerRect || rect),
      render: GameContent.clone(cfg.render || null),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
