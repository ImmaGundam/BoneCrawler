(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildTreeRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x - 5, y: baseRect.y, w: baseRect.w + 12, h: baseRect.h } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineObjectType('tree', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect || cfg.breakRect);
    return {
      id: cfg.id || '',
      type: 'tree',
      kind: cfg.kind || 'tree',
      label: cfg.label || 'Tree',
      category: 'environment',
      group: cfg.group || 'tree',
      rect: rect,
      breakRect: GameContent.cloneRect(cfg.breakRect || cfg.rect),
      blockRect: GameContent.cloneRect(cfg.blockRect || cfg.rect),
      interactRect: GameContent.cloneRect(cfg.interactRect || null),
      render: buildTreeRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
