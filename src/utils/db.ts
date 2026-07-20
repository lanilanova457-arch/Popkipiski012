const DB_NAME = "RoleplayAppDB";
const STORE_NAME = "images";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;
const memoryCache = new Map<string, string>();

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    try {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this environment"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (event: any) => {
        dbInstance = event.target.result;
        resolve(dbInstance!);
      };
      request.onerror = (event: any) => {
        reject(event.target.error || new Error("Failed to open IndexedDB"));
      };
    } catch (e) {
      reject(e);
    }
  });
}

export async function setDbItem(key: string, value: string): Promise<boolean> {
  // Always set in memory cache first for instant retrieval and fallback
  memoryCache.set(key, value);

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        console.warn(`Failed to store ${key} in IndexedDB`);
        resolve(false);
      };
    });
  } catch (e) {
    console.warn(`IndexedDB setDbItem error for key ${key}:`, e);
    return false;
  }
}

export async function getDbItem(key: string): Promise<string | null> {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result || null;
        if (result) {
          memoryCache.set(key, result);
        }
        resolve(result);
      };
      request.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn(`IndexedDB getDbItem error for key ${key}:`, e);
    return null;
  }
}

export async function deleteDbItem(key: string): Promise<boolean> {
  memoryCache.delete(key);

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn(`IndexedDB deleteDbItem error for key ${key}:`, e);
    return false;
  }
}

export async function clearDb(): Promise<boolean> {
  memoryCache.clear();

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  } catch (e) {
    console.warn("IndexedDB clear error:", e);
    return false;
  }
}
