(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x - 2, y: baseRect.y - 2, w: baseRect.w + 4, h: baseRect.h + 4 } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineObjectType('rockObstacle', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect || cfg.blockRect);
    return {
      id: cfg.id || '',
      type: 'rockObstacle',
      kind: cfg.kind || 'rockObstacle',
      label: cfg.label || 'Rock Obstacle',
      category: 'environment',
      group: cfg.group || 'rockBlocker',
      rect: rect,
      blockRect: GameContent.cloneRect(cfg.blockRect || cfg.rect),
      render: buildRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
