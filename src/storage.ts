interface SuccessEevetTarget extends EventTarget {
  result: IDBDatabase;
}

interface IDBObjectStoreEx extends IDBObjectStore {
  getAll(): IDBRequest;
}

const objectStoreKeyValueName = 'keyValue';
const objectStoreLogName = 'log';
const objectStoreMessagesName = 'messages';

let instance: IDBDatabase;

function getInstance(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (instance) {
      resolve(instance);
    }
    else {
      const request: IDBOpenDBRequest = indexedDB.open('PUSHWOOSH_SDK_STORE', 3);
      request.onsuccess = (event) => {
        const database: IDBDatabase = (event.target as SuccessEevetTarget).result;
        database.onversionchange = (event: any) => {
          console.info('onversionchange', event);
        };
        if (instance) {
          database.close();
          resolve(instance);
        }
        else {
          instance = database;
          resolve(database);
        }
      };
      request.onerror = (event) => {
        reject(event);
      };
      request.onupgradeneeded = (event) => {
        const database: IDBDatabase = (event.target as SuccessEevetTarget).result;
        database.onversionchange = (event: any) => {
          console.info('onversionchange', event);
        };
        if (!database.objectStoreNames.contains(objectStoreKeyValueName)) {
          database.createObjectStore(objectStoreKeyValueName, {
            keyPath: 'key'
          });
        }
        if (!database.objectStoreNames.contains(objectStoreLogName)) {
          const logStore = database.createObjectStore(objectStoreLogName, {
            keyPath: 'id',
            autoIncrement: true
          });
          logStore.createIndex('date', 'date', {unique: false});
          logStore.createIndex('type', 'type', {unique: false});
        }
        if (!database.objectStoreNames.contains(objectStoreMessagesName)) {
          const messagesStore = database.createObjectStore(objectStoreMessagesName, {
            keyPath: 'id',
            autoIncrement: true
          });
          messagesStore.createIndex('date', 'date', {unique: false});
          messagesStore.createIndex('type', 'type', {unique: false});
        }
      };
    }
  });
}

function getInstanceWithPromise(executor: any) {
  return getInstance().then(database => (
    new Promise((resolve, reject) => executor(database, resolve, reject))
  ));
}

function createKeyValue(name: string) {
  return {
    get(key: string) {
      return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
        const request = database.transaction(name).objectStore(name).get(key);
        request.onsuccess = () => {
          const {result} = request;
          resolve(result && result.value);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    },

    getAll() {
      return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
        const request = (database.transaction(name).objectStore(name) as IDBObjectStoreEx).getAll();
        request.onsuccess = () => {
          const {result} = request;
          resolve(result.reduce((acc: any, obj: any) => {
            acc[obj.key] = obj.value; // eslint-disable-line
            return acc;
          }, {}));
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    },

    set(key: string, value: any) {
      return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
        const request = database.transaction([name], 'readwrite').objectStore(name).put({key, value});
        request.onsuccess = () => {
          resolve(key);
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    }
  };
}

export const keyValue = createKeyValue(objectStoreKeyValueName);
