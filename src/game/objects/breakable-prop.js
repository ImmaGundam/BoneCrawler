(function(){
  'use strict';
  if(!window.GameContent) return;
  GameContent.defineObjectType('breakableProp', function(cfg){
    return {
      id: cfg.id || '',
      type: 'breakableProp',
      kind: cfg.kind || 'decor',
      label: cfg.label || 'Breakable Prop',
      category: 'prop',
      group: cfg.group || 'decorBreakable',
      breakRect: GameContent.cloneRect(cfg.breakRect),
      blockRect: GameContent.cloneRect(cfg.blockRect || cfg.breakRect),
      render: GameContent.clone(cfg.render || null),
      broken: GameContent.clone(cfg.broken || null),
      soundCue: cfg.soundCue || 'wood_break_small',
      animationId: cfg.animationId || 'crumble',
      breakEffect: cfg.breakEffect || 'wood',
      dropsHalfHeart: cfg.dropsHalfHeart !== false,
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
