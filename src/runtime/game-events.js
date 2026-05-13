// Runtime event bus - game-events.js
// Purpose: shared gameplay hooks for spawn systems, progression rules, objects, dialog, and editor/runtime bindings.
(function(){
  if(window.EventBus) return;

  const listeners = Object.create(null);
  const history = [];
  const HISTORY_LIMIT = 120;

  function normalizeEventName(name){
    return String(name || '').trim();
  }

  function on(name, handler){
    name = normalizeEventName(name);
    if(!name || typeof handler !== 'function') return function(){};
    if(!listeners[name]) listeners[name] = [];
    listeners[name].push(handler);
    return function off(){ remove(name, handler); };
  }

  function once(name, handler){
    if(typeof handler !== 'function') return function(){};
    const off = on(name, function(payload, eventName){
      off();
      return handler(payload, eventName);
    });
    return off;
  }

  function remove(name, handler){
    name = normalizeEventName(name);
    const list = listeners[name];
    if(!list || !list.length) return false;
    const idx = list.indexOf(handler);
    if(idx < 0) return false;
    list.splice(idx, 1);
    return true;
  }

  function emit(name, payload){
    name = normalizeEventName(name);
    if(!name) return {handled:false, results:[]};
    const eventPayload = payload && typeof payload === 'object' ? payload : {};
    const record = {name, payload:eventPayload, at:Date.now()};
    history.push(record);
    while(history.length > HISTORY_LIMIT) history.shift();

    const results = [];
    const direct = (listeners[name] || []).slice();
    const wildcard = (listeners['*'] || []).slice();
    for(const handler of direct.concat(wildcard)){
      try{ results.push(handler(eventPayload, name)); }
      catch(err){ results.push(false); }
    }
    return {handled:results.some(Boolean), results};
  }

  function getHistory(){ return history.slice(); }
  function clearHistory(){ history.length = 0; }

  window.EventBus = {on, once, off:remove, emit, getHistory, clearHistory};
})();
