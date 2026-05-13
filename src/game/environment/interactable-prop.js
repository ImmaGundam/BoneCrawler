(function(){
  'use strict';
  if(!window.GameContent) return;
  function buildInteractableRender(cfg, baseRect){
    const render = GameContent.clone(cfg.render || {}) || {};
    let source = GameContent.cloneRect((render && render.overlayRect) ? render.overlayRect : null);
    if(!source && baseRect){
      if((cfg.kind || '') === 'sword'){
        source = { x: baseRect.x - 1, y: baseRect.y + 4, w: 14, h: 18 };
      } else {
        source = GameContent.cloneRect(baseRect);
      }
    }
    if(source) render.overlayRect = source;
    return Object.keys(render).length ? render : null;
  }
  GameContent.defineObjectType('interactableProp', function(cfg){
    const rect = GameContent.cloneRect(cfg.rect);
    return {
      id: cfg.id || '',
      type: 'interactableProp',
      kind: cfg.kind || 'interactable',
      label: cfg.label || 'Interactable Prop',
      category: cfg.category || 'prop',
      group: cfg.group || 'interactable',
      rect: rect,
      interactRect: GameContent.cloneRect(cfg.interactRect || cfg.rect),
      dialogId: cfg.dialogId || null,
      render: buildInteractableRender(cfg, rect),
      meta: GameContent.clone(cfg.meta || null)
    };
  });
})();
