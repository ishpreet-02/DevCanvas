const DATABASE_NAME = "DevCanvasDB";
const DATABASE_VERSION = 3;

const PROJECT_STORE = "projects";
const SETTINGS_STORE = "settings";

export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION
    );

    request.onupgradeneeded = event => {
      const database = event.target.result;

      if (!database.objectStoreNames.contains(PROJECT_STORE)) {
        const projectStore = database.createObjectStore(
          PROJECT_STORE,
          {
            keyPath: "id"
          }
        );

        projectStore.createIndex(
          "name",
          "name",
          {
            unique: false
          }
        );

        projectStore.createIndex(
          "updatedAt",
          "updatedAt",
          {
            unique: false
          }
        );

        projectStore.createIndex(
          "lastOpenedAt",
          "lastOpenedAt",
          {
            unique: false
          }
        );
      }

      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(
          SETTINGS_STORE,
          {
            keyPath: "id"
          }
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };

    request.onblocked = () => {
      reject(
        new Error(
          "Database upgrade blocked. Close other DevCanvas tabs and reload."
        )
      );
    };
  });
}

export async function saveProjectRecord(project) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      PROJECT_STORE,
      "readwrite"
    );

    const store = transaction.objectStore(PROJECT_STORE);

    store.put(project);

    transaction.oncomplete = () => {
      database.close();
      resolve(project);
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function getProjectRecord(projectId) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      PROJECT_STORE,
      "readonly"
    );

    const store = transaction.objectStore(PROJECT_STORE);
    const request = store.get(projectId);

    request.onsuccess = () => {
      const project = request.result || null;

      database.close();

      resolve(project);
    };

    request.onerror = () => {
      database.close();

      reject(request.error);
    };
  });
}

export async function getAllProjectRecords() {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      PROJECT_STORE,
      "readonly"
    );

    const store = transaction.objectStore(PROJECT_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const projects = request.result;

      database.close();

      resolve(projects);
    };

    request.onerror = () => {
      database.close();

      reject(request.error);
    };
  });
}

export async function deleteProjectRecord(projectId) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      PROJECT_STORE,
      "readwrite"
    );

    const store = transaction.objectStore(PROJECT_STORE);

    store.delete(projectId);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();

      reject(transaction.error);
    };
  });
}

export async function saveSettingsRecord(settings) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      SETTINGS_STORE,
      "readwrite"
    );

    const store = transaction.objectStore(SETTINGS_STORE);

    store.put(settings);

    transaction.oncomplete = () => {
      database.close();

      resolve(settings);
    };

    transaction.onerror = () => {
      database.close();

      reject(transaction.error);
    };
  });
}

export async function getSettingsRecord(settingsId) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      SETTINGS_STORE,
      "readonly"
    );

    const store = transaction.objectStore(SETTINGS_STORE);
    const request = store.get(settingsId);

    request.onsuccess = () => {
      const settings = request.result || null;

      database.close();

      resolve(settings);
    };

    request.onerror = () => {
      database.close();

      reject(request.error);
    };
  });
}