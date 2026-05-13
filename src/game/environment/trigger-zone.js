(function(){
  'use strict';
  if(!window.GameContent) return;
  GameContent.defineObjectType('triggerZone', function(cfg){
    return {
      id: cfg.id || '',
      type: 'triggerZone',
      kind: cfg.kind || 'trigger',
      label: cfg.label || 'Trigger Zone',
      category: 'trigger',
      group: cfg.group || 'trigger',
      rect: GameContent.cloneRect(cfg.rect || cfg.triggerRect),
      triggerRect: GameContent.cloneRect(cfg.triggerRect || cfg.rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
