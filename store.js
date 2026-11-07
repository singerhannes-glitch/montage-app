/* Speicher im Browser (IndexedDB): Berichte, Einstellungen, Ordner-Zugriff */
const Store = (() => {
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open('montage-app', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('reports')) db.createObjectStore('reports', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Speicher nicht verfügbar'));
      req.onblocked = () => reject(new Error('Speicher blockiert'));
      setTimeout(() => reject(new Error('Speicher antwortet nicht')), 4000);
    });
    return dbPromise;
  }

  async function run(storeName, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const st = tx.objectStore(storeName);
      const req = fn(st);
      tx.oncomplete = () => resolve(req ? req.result : undefined);
      tx.onerror = () => reject(tx.error || new Error('Speicherfehler'));
      tx.onabort = () => reject(tx.error || new Error('Speicher voll oder gesperrt'));
    });
  }

  return {
    saveReport: r => run('reports', 'readwrite', s => s.put(r)),
    getReport: async id => { const r = await run('reports', 'readonly', s => s.get(id)); return r ? normalizeReport(r) : r; },
    deleteReport: id => run('reports', 'readwrite', s => s.delete(id)),
    allReports: async () => {
      const list = await run('reports', 'readonly', s => s.getAll());
      return (list || []).map(normalizeReport).sort((a, b) => b.updated - a.updated);
    },
    getKv: key => run('kv', 'readonly', s => s.get(key)),
    setKv: (key, val) => run('kv', 'readwrite', s => s.put(val, key)),
    delKv: key => run('kv', 'readwrite', s => s.delete(key))
  };
})();

// Einstellungen (Schlüssel, Logo, Unterschrift ...) als ein Objekt
const Settings = {
  data: { apiKey: '', model: 'claude-sonnet-5-5', logo: '', signature: '', monteur: '', firmaName: 'Chairkit Fördertechnik GmbH' },
  async load() {
    const s = await Store.getKv('settings');
    if (s) Object.assign(this.data, s);
  },
  async save() {
    await Store.setKv('settings', this.data);
  }
};

// Ordner für fertige Berichte (z. B. OneDrive). Nur in Edge/Chrome verfügbar.
const Folder = {
  supported: () => typeof window.showDirectoryPicker === 'function',
  async get(askPermission) {
    const handle = await Store.getKv('folder');
    if (!handle) return null;
    let perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted' && askPermission) perm = await handle.requestPermission({ mode: 'readwrite' });
    return perm === 'granted' ? handle : null;
  },
  async choose() {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await Store.setKv('folder', handle);
    return handle;
  },
  async writeFile(dir, name, blob) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(blob);
    await w.close();
  }
};

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
