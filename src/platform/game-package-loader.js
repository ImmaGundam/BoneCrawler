// game-package-loader
// Purpose: Optional package manifest reader for editor/pipeline runtime contracts.
(function(){
  const runtimeApi = window.GameRuntimeApi || null;
  const app=(runtimeApi && runtimeApi.lookup('app', ['BoneCrawlerApp'])) || window.BoneCrawlerApp;
  if(!app) return;
  if(app.services && app.services.gamePackage) return;

  const params=new URLSearchParams(window.location.search||'');
  const rawPackage=params.get('package');
  const disabled=rawPackage && /^(0|false|off|none)$/i.test(rawPackage);
  const defaultUrl='packages/bonecrawler/game.manifest.json';
  const packageUrl=rawPackage && !disabled ? rawPackage : defaultUrl;

  const state={
    status:disabled ? 'disabled' : 'loading',
    url:packageUrl,
    manifest:null,
    error:null,
    loadedAt:null,
  };

  function publish(){
    if(runtimeApi && typeof runtimeApi.register === 'function') runtimeApi.register('package', api, { legacy: ['BoneCrawlerPackage'] });
    else window.BoneCrawlerPackage=api;
    app.runtime.package=state;
  }

  const api={
    get status(){ return state.status; },
    get url(){ return state.url; },
    get manifest(){ return state.manifest; },
    get error(){ return state.error; },
    getState(){ return {...state}; },
    whenReady(){ return app.runtime.packagePromise || Promise.resolve(null); },
  };

  app.services.gamePackage=api;
  publish();

  if(disabled){
    app.runtime.packagePromise=Promise.resolve(null);
    app.emit('package.disabled',{url:packageUrl});
    return;
  }

  app.runtime.packagePromise=fetch(packageUrl,{cache:'no-store'})
    .then(response=>{
      if(!response.ok) throw new Error('HTTP '+response.status);
      return response.json();
    })
    .then(manifest=>{
      state.status='ready';
      state.manifest=manifest;
      state.loadedAt=Date.now();
      publish();
      const game=manifest && manifest.game ? manifest.game : {};
      if(runtimeApi && typeof runtimeApi.syncProjectMeta === 'function') runtimeApi.syncProjectMeta(game);
      console.info('[BoneCrawler] package loaded:', game.title||game.id||packageUrl, game.version||'');
      app.emit('package.loaded',{url:packageUrl,manifest});
      return manifest;
    })
    .catch(error=>{
      state.status='fallback';
      state.error=error && error.message ? error.message : String(error);
      publish();
      console.warn('[BoneCrawler] package unavailable; using JS runtime defaults.', state.url, state.error);
      app.emit('package.fallback',{url:packageUrl,error:state.error});
      return null;
    });
})();
