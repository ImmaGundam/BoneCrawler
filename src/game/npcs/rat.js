(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildRatRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x, y: baseRect.y + 1, w: 9, h: 4 } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineNpcType('rat', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect);
    return {
      id: cfg.id || 'secret1.rat',
      type: 'rat',
      kind: 'npc',
      label: cfg.label || 'Rat',
      category: 'npc',
      group: cfg.group || 'npc',
      rect: rect,
      interactRect: GameContent.cloneRect(cfg.interactRect || cfg.rect),
      dialogId: cfg.dialogId || 'npc.rat.initial',
      render: buildRatRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
