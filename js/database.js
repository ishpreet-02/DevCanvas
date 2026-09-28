const DATABASE_NAME = "DevCanvasDB";
const DATABASE_VERSION = 1;
const PROJECT_STORE = "projects";

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = event => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        const store = database.createObjectStore(PROJECT_STORE, {
          keyPath: "id"
        });

        store.createIndex("name", "name", {
          unique: false
        });

        store.createIndex("updatedAt", "updatedAt", {
          unique: false
        });

        store.createIndex("lastOpenedAt", "lastOpenedAt", {
          unique: false
        });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveProjectRecord(project) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE, "readwrite");
    const store = transaction.objectStore(PROJECT_STORE);

    store.put(project);

    transaction.oncomplete = () => {
      resolve(project);
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}

export async function getProjectRecord(projectId) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE, "readonly");
    const store = transaction.objectStore(PROJECT_STORE);
    const request = store.get(projectId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function getAllProjectRecords() {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE, "readonly");
    const store = transaction.objectStore(PROJECT_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function deleteProjectRecord(projectId) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE, "readwrite");
    const store = transaction.objectStore(PROJECT_STORE);

    store.delete(projectId);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };
  });
}