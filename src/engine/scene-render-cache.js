// scene-render-cache
// Purpose: cache expensive static scene rendering to offscreen canvases and redraw only when scene visuals change.
(function(){
  'use strict';
  if(window.SceneRenderCache) return;

  const entries = Object.create(null);

  function makeCanvas(){
    const canvas = document.createElement('canvas');
    canvas.width = GW * SCALE;
    canvas.height = GH * SCALE;
    return canvas;
  }

  function ensure(zone, signature, buildFn){
    const key = String(zone);
    let entry = entries[key];
    const width = GW * SCALE;
    const height = GH * SCALE;
    if(!entry) entry = entries[key] = { canvas: makeCanvas(), signature: null };
    if(entry.canvas.width !== width || entry.canvas.height !== height){
      entry.canvas.width = width;
      entry.canvas.height = height;
      entry.signature = null;
    }
    if(entry.signature !== signature){
      const renderCtx = entry.canvas.getContext('2d');
      renderCtx.clearRect(0, 0, width, height);
      const prev = window.__renderCtxOverride || null;
      window.__renderCtxOverride = renderCtx;
      try{
        buildFn(renderCtx, entry.canvas);
      } finally {
        window.__renderCtxOverride = prev;
      }
      entry.signature = signature;
    }
    return entry.canvas;
  }

  function invalidate(zone){
    if(zone == null){
      Object.keys(entries).forEach(function(key){ delete entries[key]; });
      return;
    }
    delete entries[String(zone)];
  }

  window.SceneRenderCache = {
    ensure,
    invalidate,
    clear: function(){ invalidate(null); },
    stats: function(){
      return Object.keys(entries).reduce(function(out, key){
        out[key] = { signature: entries[key].signature, width: entries[key].canvas.width, height: entries[key].canvas.height };
        return out;
      }, {});
    }
  };
})();
