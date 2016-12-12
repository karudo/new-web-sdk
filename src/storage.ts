interface IEevetTargetWithResult extends EventTarget {
  result: IDBDatabase;
}

interface IDBObjectStoreEx extends IDBObjectStore {
  getAll(): IDBRequest;
}

const objectStoreKeyValueName = 'keyValue';
const objectStoreLogName = 'log';
const objectStoreMessagesName = 'messages';


function onversionchange(event: any) {
  console.info('onversionchange', event);
}

let databasePromise: Promise<IDBDatabase>;
function getInstance(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request: IDBOpenDBRequest = indexedDB.open('PUSHWOOSH_SDK_STORE', 3);
      request.onsuccess = (event) => {
        const database: IDBDatabase = (event.target as IEevetTargetWithResult).result;
        database.onversionchange = onversionchange;
        resolve(database);
      };

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const database: IDBDatabase = (event.target as IEevetTargetWithResult).result;
        database.onversionchange = onversionchange;

        if (!database.objectStoreNames.contains(objectStoreKeyValueName)) {
          database.createObjectStore(objectStoreKeyValueName, {keyPath: 'key'});
        }

        const autoIncrementId = {keyPath: 'id', autoIncrement: true};
        const uniqueFalse = {unique: false};
        if (!database.objectStoreNames.contains(objectStoreLogName)) {
          const logStore = database.createObjectStore(objectStoreLogName, autoIncrementId);
          logStore.createIndex('date', 'date', uniqueFalse);
          logStore.createIndex('type', 'type', uniqueFalse);
        }
        if (!database.objectStoreNames.contains(objectStoreMessagesName)) {
          const messagesStore = database.createObjectStore(objectStoreMessagesName, autoIncrementId);
          messagesStore.createIndex('date', 'date', uniqueFalse);
        }
      };
    });
  }
  return databasePromise;
}

function getInstanceWithPromise(executor: any): any {
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
          resolve(request.result.reduce((acc: any, obj: any) => {
            acc[obj.key] = obj.value;
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

interface ILogStorage {
  add(type: string, message: any): Promise<void>;
  getAll(): Promise<any>
}

function createLog(name: string) {
  return {
    add(type: string, message: any) {
      return getInstanceWithPromise((database: IDBDatabase, resolve: any, reject: any) => {
        const request = database.transaction([name], 'readwrite').objectStore(name).add({type, message: `${message}`, date: new Date});
        request.onsuccess = () => {
          resolve();
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
          resolve(request.result.reduce((acc: any, obj: any) => {
            acc[obj.key] = obj.value;
            return acc;
          }, {}));
        };
        request.onerror = () => {
          reject(request.error);
        };
      });
    },
  }
}

export const keyValue = createKeyValue(objectStoreKeyValueName);
export const log: ILogStorage = createLog(objectStoreLogName);
