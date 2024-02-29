import {useCallback, useEffect, useRef, useState} from "react";
import {Configuration, DEFAULT_CONFIG} from "../ConfigSidebar";
import {isScreenSmall, VERSION} from "../config";
import {doc, getDoc, setDoc} from "firebase/firestore";
import {firestore} from "../firebase";
import {runFirestoreMigrations, runStoreMigrations} from "./migrations";


const DEFAULT_VIEW: ViewState = {
  ledger: {
    // empty
  }
}

enum ItemFlag {
  COLLECTED,
  HIDDEN,
}

type ArtifactMeta = {
  id: number,
  collected: boolean,
  hidden: boolean,
  // deprecated:
  flags?: ItemFlag[],
}

type ViewState = {
  ledger: LedgerState,
  lastSelected?: Selection,
}

type Selection = {
  collectionId: number,
  itemId: number,
}

type LedgerState = {
  [key: string]: CollectionState,
}

type CollectionState = {
  isOpen: boolean,
}

type VersionInfo = {
  major: number,
  minor: number,
  revision: number,
}

type Store = {
  data: StoreData,
  init: (uid?: string) => void,
  getLogEntry: (artifactId: number) => ArtifactMeta,
  isCollected: (artifactId: number) => boolean,
  isHidden: (artifactId: number) => boolean,
  toggle: (artifactId: number, flag?: ItemFlag, enabled?: boolean) => void,
  saveConfig: (config: Configuration) => void,
  loadConfig: () => Configuration,
  saveView: (view: ViewState) => void,
  loadView: () => ViewState,
  toggleCollectionOpen: (collectionId: number, isOpen: boolean) => void,
  isCollectionOpen: (collectionId: number) => boolean,
  setLastSelectedItem: (collectionId: number, itemId: number) => void,
  getLastSelectedItem: () => Selection | undefined,
}

type StoreData = {
  default: boolean,
  config: Configuration,
  collectionLog: CollectionLog,
  view: ViewState,
  version?: {
    major: number,
    minor: number,
    revision: number,
  },
}

type FirebaseData = {
  collectionLog: CollectionLog,
  version?: {
    major: number,
    minor: number,
    revision: number,
  },
}

type CollectionLog = {
  entries: ArtifactMeta[]
}

function initArtifactMeta(artifactId: number): ArtifactMeta {
  return {
    id: artifactId,
    collected: false,
    hidden: false,
  }
}

function initStore(): StoreData {
  return {
    default: true,
    version: VERSION,
    config: {
      ...DEFAULT_CONFIG,
      view: isScreenSmall(window) ? 'list' : 'card',
    },
    view: {
      ledger: {
        // empty
      }
    },
    collectionLog: {
      entries: [],
    },
  };
}

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

function useStore(): Store {
  const [data, setData] = useState(initStore());
  const userId = useRef<string>();

  const commitToFirebase = useCallback(
      debounce((uid: string, data: StoreData) => {
        const firebaseData: FirebaseData = {
          version: data.version,
          collectionLog: data.collectionLog,
        }

        const docRef = doc(firestore, "collections", uid);
        setDoc(docRef, firebaseData).then(() => {
          console.log("Wrote Collection to Firestore.")
        });
      }, 800)
      , []);

  const persistData = useCallback((context: StoreData, uid?: string) => {
    if (!context.default) {
      console.log("Saving...");
      localStorage.setItem("d4log", JSON.stringify(context));

      if (uid) {
        commitToFirebase(uid, context);
      }
    }
  }, [commitToFirebase]);

  useEffect(() => {
    persistData(data, userId.current);
  }, [persistData, data]);

  function loadFromLocalStorage(): StoreData {
    const localData = localStorage.getItem("d4log");
    if (localData) {
      const parsedData: StoreData = JSON.parse(localData);

      console.log("Collection loaded from HTML5 Storage.");

      return {
        ...parsedData,
        default: false,
      };
    } else {
      console.log("Initialising New Collection...");
      return initStore();
    }
  }

  function init(uid?: string): Promise<StoreData> {
    return new Promise((resolve, reject) => {
      userId.current = uid;

      if (uid) {
        const docRef = doc(firestore, "collections", uid);
        getDoc(docRef).then((snapshot) => {
          // instantiate new collection
          if (!snapshot.exists()) {
            console.log("Collection is empty.");
            const newData = loadFromLocalStorage();
            const newDataPatched = runStoreMigrations(newData);
            persistData(newDataPatched, uid);
            setData(newDataPatched);
            resolve(newDataPatched);
            return;
          }

          // sync with firestore
          const firestoreData = snapshot.data() as FirebaseData;
          const firestoreDataSanitised = runFirestoreMigrations(firestoreData);

          const localStorageData = loadFromLocalStorage();
          const localStorageDataMerged = {
            ...localStorageData,
            ...firestoreDataSanitised,
          };

          const storeDataPatched = runStoreMigrations(localStorageDataMerged);

          console.log("Got Collection Snapshot.", firestoreData);

          setData(storeDataPatched);
          resolve(storeDataPatched);
        });
      } else {
        // offline
        const newData = loadFromLocalStorage();
        const newDataPatched = runStoreMigrations(newData);
        setData(newDataPatched);
        resolve(newDataPatched);
      }
    });
  }

  function getLogEntry(artifactId: number): ArtifactMeta {
    if (data.collectionLog.entries === undefined) {
      console.log("Is undefined!!!!", data);
    }

    const logEntry = data
        .collectionLog
        .entries
        .filter(l => l.id === artifactId)
        .pop();

    return logEntry ?? initArtifactMeta(artifactId);
  }

  function toggle(artifactId: number, flag: ItemFlag = ItemFlag.COLLECTED, enabled?: boolean) {
    function updateData(data: StoreData) {
      const doesExist = data.collectionLog.entries.find(e => e.id === artifactId);
      if (!doesExist) {
        const logEntry = initArtifactMeta(artifactId);

        switch (flag) {
          case ItemFlag.COLLECTED:
            logEntry.collected = enabled ?? true;
            break;
          case ItemFlag.HIDDEN:
            logEntry.hidden = enabled ?? true;
            break;
        }

        return {
          ...data,
          default: false,
          collectionLog: {
            ...data.collectionLog,
            entries: [
              ...data.collectionLog.entries,
              logEntry,
            ],
          }
        };
      }

      return {
        ...data,
        default: false,
        collectionLog: {
          entries: data.collectionLog.entries.map(e => {
            if (e.id !== artifactId) {
              return e;
            } else {
              switch (flag) {
                case ItemFlag.COLLECTED:
                  e.collected = enabled ?? !e.collected;
                  break;
                case ItemFlag.HIDDEN:
                  e.hidden = enabled ?? !e.hidden;
                  break;
              }

              return e;
            }
          }),
        }
      };
    }

    setData(updateData);
  }

  function isCollected(artifactId: number): boolean {
    return getLogEntry(artifactId).collected;
  }

  function isHidden(artifactId: number): boolean {
    return getLogEntry(artifactId).hidden;
  }

  function saveConfig(configuration: Configuration) {
    setData(data => ({
      ...data,
      default: false,
      config: configuration,
    }));
  }

  function loadConfig(): Configuration {
    return { ...DEFAULT_CONFIG, ...data.config };
  }

  function loadView(): ViewState {
    return {
      ...DEFAULT_VIEW,
      ...data.view,
    };
  }

  function saveView(view: ViewState) {
    setData(data => ({
      ...data,
      default: false,
      view,
    }));
  }

  function toggleCollectionOpen(collectionId: number, isOpen: boolean) {
    const currentData = loadView();
    const updatedData: ViewState = {
      ...currentData,
      ledger: {
        ...currentData.ledger,
        [collectionId]: {
          isOpen
        }
      }
    }

    if (isCollectionOpen(collectionId) !== isOpen) {
      saveView(updatedData);
    }
  }

  function isCollectionOpen(collectionId: number): boolean {
    return loadView().ledger[collectionId]?.isOpen ?? false;
  }

  function setLastSelectedItem(collectionId: number, itemId: number) {
    const currentData = loadView();
    const updatedData: ViewState = {
      ...currentData,
      lastSelected: {
        collectionId,
        itemId,
      }
    }

    const current = currentData.lastSelected;
    if (current?.collectionId !== collectionId || current?.itemId !== itemId) {
      saveView(updatedData);
    }
  }

  function getLastSelectedItem(): Selection | undefined {
    return loadView().lastSelected;
  }

  return {
    data,
    init,
    getLogEntry,
    toggle,
    isCollected,
    isHidden,
    saveConfig,
    loadConfig,
    loadView,
    saveView,
    toggleCollectionOpen,
    isCollectionOpen,
    setLastSelectedItem,
    getLastSelectedItem,
  };
}

export default useStore;
export type { Store, StoreData, ArtifactMeta, CollectionLog, ViewState, VersionInfo, FirebaseData };
export { ItemFlag };
