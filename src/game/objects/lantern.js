(function(){
  'use strict';
  if(!window.GameContent) return;
  GameContent.defineObjectType('lantern', function(cfg){
    return {
      id: cfg.id || '',
      type: 'lantern',
      kind: 'lantern',
      label: cfg.label || 'Lantern',
      category: 'prop',
      group: cfg.group || 'decorBreakable',
      breakRect: GameContent.cloneRect(cfg.breakRect),
      blockRect: GameContent.cloneRect(cfg.blockRect || cfg.breakRect),
      render: GameContent.clone(cfg.render || null),
      broken: GameContent.clone(cfg.broken || null),
      soundCue: cfg.soundCue || 'wood_break_small',
      animationId: cfg.animationId || 'lanternFlame',
      breakEffect: cfg.breakEffect || 'lanternFlame',
      dropsHalfHeart: cfg.dropsHalfHeart !== false,
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
