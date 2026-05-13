(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildPortalRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x - 2, y: baseRect.y - 2, w: baseRect.w + 4, h: baseRect.h + 4 } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineObjectType('portal', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect || cfg.triggerRect);
    return {
      id: cfg.id || '',
      type: 'portal',
      kind: cfg.kind || 'portal',
      label: cfg.label || 'Portal',
      category: 'trigger',
      group: cfg.group || 'portal',
      rect: rect,
      triggerRect: GameContent.cloneRect(cfg.triggerRect || cfg.rect),
      soundCue: cfg.soundCue || null,
      animationId: cfg.animationId || null,
      render: buildPortalRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
