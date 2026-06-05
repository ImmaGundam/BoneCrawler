// java-runtime-bridge
// Purpose: Optional in-game control bridge for the packaged runtime.
(function(){
  const runtimeApi = window.GameRuntimeApi || null;
  const app = (runtimeApi && runtimeApi.lookup('app', ['BoneCrawlerApp'])) || window.BoneCrawlerApp;
  const endpoint = '/__bc_runtime';
  const tokenParam = 'bc_runtime_token';
  const state = {
    available: false,
    status: null,
    error: null,
    panel: null,
    els: null,
    transport: 'http',
  };
  const SCOREBOARD_KEY = 'boneCrawlerScoreboard_v1';

  function stripLaunchToken(){
    try{
      const url = new URL(window.location.href);
      if(!url.searchParams.has(tokenParam)) return;
      url.searchParams.delete(tokenParam);
      const next = url.pathname + (url.search ? url.search : '') + url.hash;
      window.history.replaceState(null, document.title, next);
    }catch(error){}
  }

  function hasCefBridge(){
    return typeof window.cefQuery === 'function';
  }

  function titleFlowApi(){
    return (runtimeApi && runtimeApi.lookup('titleFlow', ['BoneCrawlerTitleFlow'])) || window.BoneCrawlerTitleFlow || null;
  }

  function requestViaCef(path, options){
    return new Promise(function(resolve, reject){
      if(!hasCefBridge()){
        reject(new Error('cef bridge unavailable'));
        return;
      }
      const method = options && options.method ? options.method : 'GET';
      window.cefQuery({
        request: 'runtime:' + method + ':' + path,
        persistent: false,
        onSuccess: function(response){
          if(!response){
            resolve({ok:true});
            return;
          }
          try{
            resolve(JSON.parse(response));
          }catch(error){
            resolve({ok:true, response:response});
          }
        },
        onFailure: function(code, message){
          reject(new Error(message || ('CEF ' + code)));
        }
      });
    });
  }

  async function request(path, options){
    if(hasCefBridge()){
      state.transport = 'cef';
      return requestViaCef(path, options);
    }
    state.transport = 'http';
    const response = await fetch(endpoint + path, {
      method: options && options.method ? options.method : 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
    });
    let body = null;
    try{ body = await response.json(); }catch(error){}
    if(!response.ok){
      const message = body && body.error ? body.error : ('HTTP ' + response.status);
      throw new Error(message);
    }
    return body || {ok:true};
  }

  function formatUptime(ms){
    const total = Math.max(0, Math.floor((Number(ms)||0)/1000));
    const minutes = Math.floor(total/60);
    const seconds = total%60;
    if(minutes >= 60){
      const hours = Math.floor(minutes/60);
      return hours + 'h ' + String(minutes%60).padStart(2,'0') + 'm';
    }
    return minutes + 'm ' + String(seconds).padStart(2,'0') + 's';
  }

  function ensurePanel(){
    if(state.panel && state.panel.isConnected) return state.panel;
    const host = document.getElementById('screenExtensionPanel');
    if(!host) return null;

    const panel = document.createElement('div');
    panel.className = 'screen-extension-section bc-runtime-panel';
    panel.setAttribute('data-bc-runtime-panel','');
    panel.innerHTML = [
      '<div class="screen-extension-label">BoneCrawler - Java Edition</div>',
      '<div class="bc-runtime-line">',
        '<strong data-bc-runtime-state>Runtime Stats</strong>',
        '<span data-bc-runtime-detail>Checking...</span>',
      '</div>',
      '<div class="bc-runtime-actions">',
        '<button type="button" class="bc-runtime-btn" data-bc-runtime-reload>RELOAD</button>',
        '<button type="button" class="bc-runtime-btn" data-bc-runtime-fullscreen>FULLSCREEN</button>',
        '<button type="button" class="bc-runtime-btn" data-bc-runtime-reset-scoreboard>RESET SCOREBOARD</button>',
        '<button type="button" class="bc-runtime-btn bc-runtime-btn-danger" data-bc-runtime-stop>EXIT GAME</button>',
      '</div>'
    ].join('');

    state.els = {
      state: panel.querySelector('[data-bc-runtime-state]'),
      detail: panel.querySelector('[data-bc-runtime-detail]'),
      reload: panel.querySelector('[data-bc-runtime-reload]'),
      fullscreen: panel.querySelector('[data-bc-runtime-fullscreen]'),
      resetScoreboard: panel.querySelector('[data-bc-runtime-reset-scoreboard]'),
      stop: panel.querySelector('[data-bc-runtime-stop]'),
    };

    state.els.reload.addEventListener('click', async function(){
      state.els.reload.disabled = true;
      try{
        state.els.detail.textContent = 'Reloading game...';
        await api.reloadGame();
      }catch(error){
        state.els.detail.textContent = 'Reload failed: ' + (error && error.message ? error.message : 'unknown');
      }finally{
        state.els.reload.disabled = false;
      }
    });

    state.els.fullscreen.addEventListener('click', async function(){
      state.els.fullscreen.disabled = true;
      try{
        state.els.detail.textContent = 'Toggling fullscreen...';
        await api.fullscreen();
        window.setTimeout(function(){ refreshStatus(); }, 260);
      }catch(error){
        state.els.detail.textContent = 'Fullscreen failed: ' + (error && error.message ? error.message : 'unknown');
      }finally{
        window.setTimeout(function(){
          if(state.els && state.els.fullscreen) state.els.fullscreen.disabled = false;
        }, 280);
      }
    });

    state.els.resetScoreboard.addEventListener('click', async function(){
      const ok = window.confirm('Reset the local scoreboard?\n\nThis clears saved scoreboard entries for this browser container.');
      if(!ok) return;
      state.els.resetScoreboard.disabled = true;
      try{
        state.els.detail.textContent = 'Resetting scoreboard...';
        await api.resetScoreboard();
        state.els.detail.textContent = 'Scoreboard reset.';
      }catch(error){
        state.els.detail.textContent = 'Reset failed: ' + (error && error.message ? error.message : 'unknown');
      }finally{
        state.els.resetScoreboard.disabled = false;
      }
    });

    state.els.stop.addEventListener('click', async function(){
      const ok = window.confirm('Stop the BoneCrawler Java runtime?\n\nThis will close the game!');
      if(!ok) return;
      state.els.stop.disabled = true;
      state.els.detail.textContent = 'Stopping runtime...';
      try{
        await api.stop();
      }catch(error){
        state.els.detail.textContent = 'Stop failed: ' + (error && error.message ? error.message : 'unknown');
        state.els.stop.disabled = false;
      }
    });

    host.appendChild(panel);
    state.panel = panel;
    return panel;
  }

  function renderStatus(status){
    const panel = ensurePanel();
    if(!panel || !state.els) return;
    panel.hidden = false;
    state.els.state.textContent = 'Runtime Stats';
    const uptime = status && status.uptimeMs != null ? formatUptime(status.uptimeMs) : '0m 00s';
    state.els.detail.textContent = 'Runtime: ' + uptime;
    if(state.els.fullscreen){
      state.els.fullscreen.textContent = status && status.fullscreen ? 'WINDOWED' : 'FULLSCREEN';
    }
  }

  async function refreshStatus(){
    try{
      const status = await api.status();
      if(!status || !status.ok) throw new Error('runtime unavailable');
      state.available = true;
      state.status = status;
      state.error = null;
      renderStatus(status);
      return status;
    }catch(error){
      state.error = error && error.message ? error.message : String(error);
      if(!state.available && state.panel) state.panel.hidden = true;
      return null;
    }
  }

  const api = {
    get available(){ return state.available; },
    get state(){ return {...state}; },
    status(){ return request('/status'); },
    openPackageFolder(){ return request('/open-package-folder', {method:'POST'}); },
    reloadGame(){ return request('/reload', {method:'POST'}); },
    fullscreen(){ return request('/fullscreen', {method:'POST'}); },
    stop(){ return request('/stop', {method:'POST'}); },
    hide(){ return request('/hide', {method:'POST'}); },
    async resetScoreboard(){
      const titleFlow = titleFlowApi();
      if(titleFlow && typeof titleFlow.resetScoreboard === 'function'){
        titleFlow.resetScoreboard();
        return {ok:true};
      }
      try{ localStorage.removeItem(SCOREBOARD_KEY); }catch(error){}
      try{
        if(Array.isArray(window.scoreboardEntries)) window.scoreboardEntries.length = 0;
        if(typeof window.scoreboardPage === 'number') window.scoreboardPage = 0;
      }catch(error){}
      return {ok:true};
    },
    refresh: refreshStatus,
  };

  stripLaunchToken();
  if(runtimeApi && typeof runtimeApi.register === 'function') runtimeApi.register('javaRuntime', api, { legacy: ['BoneCrawlerJavaRuntime'] });
  else window.BoneCrawlerJavaRuntime = api;
  if(app && app.services) app.services.javaRuntime = api;

  function boot(){
    refreshStatus().then(function(status){
      if(status && app && typeof app.emit === 'function') app.emit('java-runtime.ready', status);
    });
    window.setInterval(function(){
      if(state.available) refreshStatus();
    }, 5000);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
