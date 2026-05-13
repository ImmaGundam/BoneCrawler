(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildWoundedStrangerRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x - 1, y: baseRect.y + 1, w: 14, h: 8 } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineNpcType('woundedStranger', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect);
    return {
      id: cfg.id || 'secret2.woundedStranger',
      type: 'woundedStranger',
      kind: 'npc',
      label: cfg.label || 'Wounded Stranger',
      category: 'npc',
      group: cfg.group || 'npc',
      rect: rect,
      interactRect: GameContent.cloneRect(cfg.interactRect || cfg.rect),
      dialogId: cfg.dialogId || 'npc.woundedStranger.initial',
      render: buildWoundedStrangerRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
