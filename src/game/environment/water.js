(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildWaterRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x - 7, y: baseRect.y - 6, w: baseRect.w + 14, h: baseRect.h + 12 } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineObjectType('water', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect || cfg.triggerRect);
    return {
      id: cfg.id || '',
      type: 'water',
      kind: cfg.kind || 'water',
      label: cfg.label || 'Water',
      category: 'environment',
      group: cfg.group || 'water',
      rect: rect,
      triggerRect: GameContent.cloneRect(cfg.triggerRect || cfg.rect),
      blockRect: GameContent.cloneRect(cfg.blockRect || null),
      render: buildWaterRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
