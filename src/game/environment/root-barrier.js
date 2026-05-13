(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x, y: baseRect.y, w: baseRect.w, h: baseRect.h } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineObjectType('rootBarrier', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect || cfg.blockRect);
    return {
      id: cfg.id || '',
      type: 'rootBarrier',
      kind: cfg.kind || 'rootBarrier',
      label: cfg.label || 'Root Barrier',
      category: 'environment',
      group: cfg.group || 'treeBlocker',
      rect: rect,
      blockRect: GameContent.cloneRect(cfg.blockRect || cfg.rect),
      render: buildRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
