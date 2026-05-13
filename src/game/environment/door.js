(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildDoorRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x - 1, y: baseRect.y, w: baseRect.w + 2, h: baseRect.h } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineObjectType('door', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect);
    return {
      id: cfg.id || '',
      type: 'door',
      kind: cfg.kind || 'door',
      label: cfg.label || 'Door',
      category: 'door',
      group: cfg.group || 'door',
      rect: rect,
      triggerRect: GameContent.cloneRect(cfg.triggerRect || cfg.rect),
      render: buildDoorRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
