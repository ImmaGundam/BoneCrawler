(function(){
  'use strict';
  if(!window.GameContent) return;
  GameContent.defineObjectType('blocker', function(cfg){
    return {
      id: cfg.id || '',
      type: 'blocker',
      kind: cfg.kind || 'blocker',
      label: cfg.label || 'Blocker',
      category: 'environment',
      group: cfg.group || 'blocker',
      rect: GameContent.cloneRect(cfg.rect || cfg.blockRect),
      blockRect: GameContent.cloneRect(cfg.blockRect || cfg.rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
