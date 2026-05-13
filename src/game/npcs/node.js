(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildNodeRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    const source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null) ||
      (baseRect ? { x: baseRect.x - 1, y: baseRect.y - 1, w: Math.max(8, baseRect.w + 2), h: Math.max(8, baseRect.h + 2) } : null);
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineNpcType('node', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect || null);
    return {
      id: cfg.id || 'node',
      type: 'node',
      kind: 'npc',
      label: cfg.label || 'Node',
      category: 'npc',
      group: cfg.group || 'npc',
      dialogId: cfg.dialogId || 'npc.node.startup',
      rect: rect,
      interactRect: GameContent.cloneRect(cfg.interactRect || cfg.rect || null),
      render: buildNodeRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
