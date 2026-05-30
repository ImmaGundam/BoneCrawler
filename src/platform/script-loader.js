export function loadScriptsSequentially(paths, options = {}) {
  const list = Array.isArray(paths) ? paths : [];
  const continueOnError = options.continueOnError !== false;
  const parent = options.parent || document.body || document.head || document.documentElement;

  return list.reduce((promise, path) => {
    return promise.then(() => new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = path;
      script.async = false;
      script.dataset.manifestTag = options.tag || '';
      script.onload = () => {
        if (typeof options.onLoad === 'function') options.onLoad(path);
        resolve(path);
      };
      script.onerror = () => {
        const error = new Error(`Failed to load ${path}`);
        if (typeof options.onError === 'function') options.onError(path, error);
        if (continueOnError) {
          console.warn(`[BoneCrawler] continuing after failed script: ${path}`);
          resolve(path);
        } else {
          reject(error);
        }
      };
      parent.appendChild(script);
    }));
  }, Promise.resolve());
}
