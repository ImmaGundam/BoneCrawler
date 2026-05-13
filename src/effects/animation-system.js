// animation-system
// Purpose: execute reusable animation/effect templates against object or enemy data.
(function(){
  if(window.BoneCrawlerAnimationSystem) return;

  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function number(value, fallback){
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function clone(value){
    if(value == null) return value;
    try{ return JSON.parse(JSON.stringify(value)); }
    catch(err){ return value; }
  }
  function merge(base, patch){
    const out = clone(base) || {};
    if(!patch || typeof patch !== 'object' || Array.isArray(patch)) return out;
    Object.keys(patch).forEach(key => {
      const next = patch[key];
      if(next && typeof next === 'object' && !Array.isArray(next) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])){
        out[key] = merge(out[key], next);
      } else {
        out[key] = clone(next);
      }
    });
    return out;
  }

  function getTemplate(id){
    try{
      if(window.BoneCrawlerAnimationTemplates && typeof BoneCrawlerAnimationTemplates.get === 'function') return BoneCrawlerAnimationTemplates.get(id);
    }catch(err){}
    return null;
  }

  function getPalette(setName){
    const palette = {
      wood: [window.C && C.TB || '#7b5c34', window.C && C.BN3 || '#9a7a4b', window.C && C.BN2 || '#bca37a'],
      flame: [window.C && C.FR1 || '#f39a45', window.C && C.FR2 || '#f2c15a', window.C && C.BN1 || '#f0e0b0'],
      bone: [window.C && C.BN1 || '#ddd6c8', window.C && C.SI2 || '#b8b0a3', window.C && C.BN2 || '#a69b86'],
      magic: [window.C && C.MG2 || '#ae7ae8', window.C && C.SI1 || '#89a7e8', window.C && C.BN1 || '#f1e5c7'],
      portal: [window.C && C.MG2 || '#ae7ae8', window.C && C.SI1 || '#89a7e8', window.C && C.FR2 || '#f2c15a']
    };
    return palette[setName] || palette.wood;
  }

  function resolveOwnerBounds(owner, ctx){
    const rect = ctx && ctx.rect;
    if(rect && typeof rect.x === 'number') return { x:rect.x, y:rect.y, w:number(rect.w, 8), h:number(rect.h, 8) };
    if(owner && owner.breakRect) return { x:owner.breakRect.x, y:owner.breakRect.y, w:number(owner.breakRect.w, 8), h:number(owner.breakRect.h, 8) };
    if(owner && owner.blockRect) return { x:owner.blockRect.x, y:owner.blockRect.y, w:number(owner.blockRect.w, 8), h:number(owner.blockRect.h, 8) };
    if(owner && owner.render){
      return { x:number(owner.render.x, 0), y:number(owner.render.y, 0), w:number(owner.render.w, owner.w || 8), h:number(owner.render.h, owner.h || 8) };
    }
    if(owner && typeof owner.x === 'number') return { x:owner.x, y:number(owner.y, 0), w:number(owner.w, 8), h:number(owner.h, 8) };
    return { x:number(ctx && ctx.x, 0), y:number(ctx && ctx.y, 0), w:8, h:8 };
  }

  function resolveOwnerScale(owner, params, bounds){
    if(params && params.scaleMode === 'fixed') return Math.max(1, number(params.scale || 1, 1));
    const w = Math.max(1, number(bounds && bounds.w, owner && owner.w, 8));
    const h = Math.max(1, number(bounds && bounds.h, owner && owner.h, 8));
    const span = Math.max(w, h);
    return clamp(span / 8, 0.85, 3.5);
  }

  function pushParticle(particle){
    try{
      if(typeof parts !== 'undefined' && Array.isArray(parts)){
        parts.push(particle);
        return true;
      }
    }catch(err){}
    return false;
  }

  function particleBurst(template, owner, params, ctx){
    const bounds = resolveOwnerBounds(owner, ctx);
    const scale = resolveOwnerScale(owner, params, bounds);
    const cfg = merge(template.defaults || {}, params || {});
    const palette = getPalette(cfg.colorSet || cfg.material || 'wood');
    const centerX = number(cfg.originX, (ctx && typeof ctx.x === 'number') ? ctx.x : (bounds.x + bounds.w / 2));
    const centerY = number(cfg.originY, (ctx && typeof ctx.y === 'number') ? ctx.y : (bounds.y + bounds.h / 2));
    const count = Math.max(1, Math.round(number(cfg.count, 10) * (cfg.scaleMode === 'owner' ? Math.max(1, scale * 0.85) : 1)));
    const speedMin = Math.max(0.01, number(cfg.speedMin, 0.35));
    const speedMax = Math.max(speedMin, number(cfg.speedMax, 1.2));
    const lifetime = Math.max(4, Math.round(number(cfg.lifetime, 20)));
    const gravity = number(cfg.gravity, 0.03);
    const lift = number(cfg.lift, 0);
    const spread = Math.max(0.01, number(cfg.spread, 1));
    const sizeMin = Math.max(1, Math.round(number(cfg.sizeMin, 1)));
    const sizeMax = Math.max(sizeMin, Math.round(number(cfg.sizeMax, 2) * Math.max(1, scale * 0.75)));
    let pushed = 0;

    for(let i=0;i<count;i++){
      const angle = Math.random() * Math.PI * 2;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const size = sizeMin + ((Math.random() * (sizeMax - sizeMin + 1)) | 0);
      const col = palette[(Math.random() * palette.length) | 0];
      if(pushParticle({
        x:centerX,
        y:centerY,
        vx:Math.cos(angle) * speed * spread,
        vy:Math.sin(angle) * speed * spread - lift,
        life:lifetime + ((Math.random() * 8) | 0),
        max:lifetime + 8,
        col,
        size,
        gravity
      })) pushed++;
    }
    return pushed > 0;
  }

  function playTemplate(id, owner, params, ctx){
    const template = getTemplate(id);
    if(!template) return false;
    if(template.kind === 'particleBurst') return particleBurst(template, owner, params || {}, ctx || {});
    return false;
  }

  function playBinding(owner, binding, ctx){
    if(!binding || typeof binding !== 'object') return false;
    const templateId = binding.template || binding.id || binding.name || '';
    if(!templateId) return false;
    return playTemplate(templateId, owner, binding.params || {}, ctx || {});
  }

  window.BoneCrawlerAnimationSystem = {
    playTemplate,
    playBinding,
    resolveOwnerBounds
  };
})();
