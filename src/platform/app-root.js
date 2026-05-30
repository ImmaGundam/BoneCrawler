export function createAppRoot() {
  const params = new URLSearchParams(window.location.search || '');
  const readFlag = (name, defaultValue = false) => {
    if (!params.has(name)) return defaultValue;
    const value = String(params.get(name) || '').toLowerCase();
    if (value === '' || value === '1' || value === 'true' || value === 'yes' || value === 'on') return true;
    if (value === '0' || value === 'false' || value === 'no' || value === 'off') return false;
    return defaultValue;
  };

  const commandMap = new Map();
  const eventMap = new Map();

  return {
    version: '2.9.4',
    flags: {
      editorEnabled: readFlag('editor', true),
      javaRuntimeEnabled: readFlag('javaRuntime', false),
      javaEditorEnabled: readFlag('javaEditor', false),
    },
    runtime: {
      isReady: false,
      mode: 'module',
      loadedManifests: [],
      loadedScripts: [],
      failedScripts: [],
    },
    services: Object.create(null),
    adapters: Object.create(null),
    state: Object.create(null),
    editor: Object.create(null),
    registerCommand(name, handler) {
      if (!name || typeof handler !== 'function') return false;
      commandMap.set(name, handler);
      return true;
    },
    dispatchCommand(name, payload) {
      const handler = commandMap.get(name);
      if (!handler) return { ok: false, reason: 'missing-command', name, payload };
      try {
        return { ok: true, name, payload, value: handler(payload, this) };
      } catch (error) {
        return { ok: false, reason: 'handler-error', name, payload, error };
      }
    },
    on(name, handler) {
      if (!name || typeof handler !== 'function') return () => {};
      const list = eventMap.get(name) || [];
      list.push(handler);
      eventMap.set(name, list);
      return () => {
        const current = eventMap.get(name) || [];
        eventMap.set(name, current.filter(fn => fn !== handler));
      };
    },
    emit(name, payload) {
      const list = eventMap.get(name) || [];
      for (const handler of list.slice()) {
        try { handler(payload, this); } catch (error) { console.error(`[BoneCrawler] event handler failed: ${name}`, error); }
      }
      return { name, payload, count: list.length };
    },
  };
}
