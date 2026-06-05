export function ensureGameRuntimeApi() {
  const runtime = (window.GameRuntime && typeof window.GameRuntime === 'object')
    ? window.GameRuntime
    : Object.create(null);

  if (!runtime.meta || typeof runtime.meta !== 'object') runtime.meta = Object.create(null);
  if (!runtime.services || typeof runtime.services !== 'object') runtime.services = Object.create(null);
  if (!runtime.aliases || typeof runtime.aliases !== 'object') runtime.aliases = Object.create(null);

  function sanitizeNamespace(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    let alias = raw.replace(/[^A-Za-z0-9_$]/g, '');
    if (!alias) return '';
    if (!/^[A-Za-z_$]/.test(alias)) alias = 'Game' + alias;
    return alias;
  }

  if (typeof runtime.register !== 'function') {
    runtime.register = function register(key, value, options = {}) {
      if (!key) return value;
      runtime.services[key] = value;
      runtime[key] = value;
      if (options.meta && typeof options.meta === 'object') {
        runtime.meta[key] = Object.assign({}, runtime.meta[key] || {}, options.meta);
      }
      const legacy = Array.isArray(options.legacy) ? options.legacy : [];
      for (const name of legacy) {
        if (name) window[name] = value;
      }
      return value;
    };
  }

  if (typeof runtime.lookup !== 'function') {
    runtime.lookup = function lookup(key, legacy = []) {
      if (key && Object.prototype.hasOwnProperty.call(runtime, key) && runtime[key]) return runtime[key];
      if (key && runtime.services[key]) return runtime.services[key];
      for (const name of legacy) {
        if (name && window[name]) return window[name];
      }
      return null;
    };
  }

  if (typeof runtime.bindProjectNamespace !== 'function') {
    runtime.bindProjectNamespace = function bindProjectNamespace(namespace, target) {
      const alias = sanitizeNamespace(namespace);
      if (!alias) return null;
      const value = target || runtime;
      runtime.aliases[alias] = value;
      window[alias] = value;
      return alias;
    };
  }

  if (typeof runtime.syncProjectMeta !== 'function') {
    runtime.syncProjectMeta = function syncProjectMeta(game) {
      const next = Object.assign({}, runtime.meta.project || {}, game || {});
      runtime.meta.project = next;
      if (next.namespace) runtime.bindProjectNamespace(next.namespace, runtime);
      return next;
    };
  }

  window.GameRuntime = runtime;
  window.GameRuntimeApi = runtime;
  return runtime;
}
