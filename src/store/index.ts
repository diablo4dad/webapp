import { useCallback, useEffect, useRef, useState } from "react";
import { VERSION } from "../config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import { runFirestoreMigrations, runStoreMigrations } from "./migrations";

import { isScreenSmall } from "../common/dom";
import { CollectionLog, ItemFlag } from "../collection/type";
import { LedgerView, Option, Settings } from "../settings/type";
import { initialState } from "../settings/context";

const DEFAULT_VIEW: ViewState = {
  ledger: {
    // empty
  },
};

const DEFAULT_LOG: CollectionLog = {
  // deprecated
  entries: [],
  // current
  collected: [],
  hidden: [],
};

type ViewState = {
  ledger: LedgerState;
  lastSelected?: Selection;
};

type Selection = {
  collectionId: number;
  itemId: number;
};

type LedgerState = {
  [key: string]: CollectionState;
};

type CollectionState = {
  isOpen: boolean;
};

type VersionInfo = {
  major: number;
  minor: number;
  revision: number;
};

type Store = {
  init: (uid?: string) => void;
  isCollected: (artifactId: number) => boolean;
  isHidden: (artifactId: number) => boolean;
  toggle: (artifactId: number, flag?: ItemFlag, enabled?: boolean) => void;
  saveConfig: (config: Settings) => void;
  loadConfig: () => Settings;
  saveView: (view: ViewState) => void;
  loadView: () => ViewState;
  toggleCollectionOpen: (collectionId: number, isOpen: boolean) => void;
  isCollectionOpen: (collectionId: number) => boolean;
  setLastSelectedItem: (collectionId: number, itemId: number) => void;
  getLastSelectedItem: () => Selection | undefined;
};

type VersionMeta = {
  version?: {
    major: number;
    minor: number;
    revision: number;
  };
};

type StoreData = VersionMeta & {
  settings: Settings;
  collectionLog: CollectionLog;
  view: ViewState;
  // deprecated
  default?: boolean;
};

type FirebaseData = VersionMeta & {
  collectionLog: CollectionLog;
};

function initStore(): StoreData {
  return {
    version: VERSION,
    settings: {
      ...initialState,
      [Option.LEDGER_VIEW]: isScreenSmall() ? LedgerView.LIST : LedgerView.CARD,
    },
    view: {
      ledger: {
        // empty
      },
    },
    collectionLog: {
      collected: [],
      hidden: [],
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
  const [data, setData] = useState(DEFAULT_LOG);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [config, setConfig] = useState<Settings>(initialState);

  const userId = useRef<string>();

  useEffect(() => {
    // don't save until initialised
    // this prevents overriding storage with defaults
    if (
      view === DEFAULT_VIEW &&
      config === initialState &&
      data === DEFAULT_LOG
    ) {
      return;
    }

    const store: StoreData = {
      view: view,
      settings: config,
      collectionLog: data,
      version: VERSION,
    };

    console.log("Saving to local storage...", store);

    localStorage.setItem("d4log", JSON.stringify(store));
  }, [view, config, data]);

  useEffect(() => {
    if (userId.current) {
      saveToFirestore(userId.current, data);
    }
  }, [data]);

  const saveToFirestore = useCallback(
    debounce((uid: string, data: CollectionLog) => {
      const firebaseData: FirebaseData = {
        version: VERSION,
        collectionLog: data,
      };

      const docRef = doc(firestore, "collections", uid);
      setDoc(docRef, firebaseData).then(() => {
        console.log("Firestore commit.");
      });
    }, 800),
    [],
  );

  function loadFromLocalStorage(): StoreData {
    const localData = localStorage.getItem("d4log");
    if (localData) {
      const parsedData: StoreData = JSON.parse(localData);

      console.log("Loaded local storage...", parsedData);

      return parsedData;
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
        getDoc(docRef).then(async (snapshot) => {
          // instantiate new collection
          if (!snapshot.exists()) {
            console.log("Collection is empty.");
            const newData = loadFromLocalStorage();
            const newDataPatched = await runStoreMigrations(newData);
            setData(newDataPatched.collectionLog);
            setView(newDataPatched.view);
            setConfig(newDataPatched.settings);
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

          const storeDataPatched = await runStoreMigrations(
            localStorageDataMerged,
          );

          console.log("Got Firestore Snapshot...", storeDataPatched);

          setData(storeDataPatched.collectionLog);
          setView(storeDataPatched.view);
          setConfig(storeDataPatched.settings);
          resolve(storeDataPatched);
        });
      } else {
        // offline
        const newData = loadFromLocalStorage();
        runStoreMigrations(newData).then((newDataPatched) => {
          setData(newDataPatched.collectionLog);
          setView(newDataPatched.view);
          setConfig(newDataPatched.settings);
          resolve(newDataPatched);
        });
      }
    });
  }

  function toggle(
    artifactId: number,
    flag: ItemFlag = ItemFlag.COLLECTED,
    enabled?: boolean,
  ) {
    function updateData(data: CollectionLog): CollectionLog {
      const workingSet = (() => {
        switch (flag) {
          case ItemFlag.COLLECTED:
            return new Set(data.collected);
          case ItemFlag.HIDDEN:
            return new Set(data.hidden);
          default:
            return new Set<number>();
        }
      })();

      if (enabled ?? !workingSet.has(artifactId)) {
        workingSet.add(artifactId);
      } else {
        workingSet.delete(artifactId);
      }

      switch (flag) {
        case ItemFlag.COLLECTED:
          return {
            ...data,
            collected: Array.from(workingSet),
          };
        case ItemFlag.HIDDEN:
          return {
            ...data,
            hidden: Array.from(workingSet),
          };
        default:
          return data;
      }
    }

    setData(updateData);
  }

  function isCollected(artifactId: number): boolean {
    return data.collected.includes(artifactId);
  }

  function isHidden(artifactId: number): boolean {
    return data.hidden.includes(artifactId);
  }

  function saveConfig(config: Settings) {
    setConfig((previousConfig) => ({ ...previousConfig, ...config }));
  }

  function loadConfig(): Settings {
    return { ...initialState, ...config };
  }

  function loadView(): ViewState {
    return {
      ...DEFAULT_VIEW,
      ...view,
    };
  }

  function saveView(view: ViewState) {
    setView((previousView) => ({ ...previousView, ...view }));
  }

  function toggleCollectionOpen(collectionId: number, isOpen: boolean) {
    const currentData = loadView();
    const updatedData: ViewState = {
      ...currentData,
      ledger: {
        ...currentData.ledger,
        [collectionId]: {
          isOpen,
        },
      },
    };

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
      },
    };

    const current = currentData.lastSelected;
    if (current?.collectionId !== collectionId || current?.itemId !== itemId) {
      saveView(updatedData);
    }
  }

  function getLastSelectedItem(): Selection | undefined {
    return loadView().lastSelected;
  }

  return {
    init,
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
export type {
  Store,
  StoreData,
  ViewState,
  VersionInfo,
  FirebaseData,
  VersionMeta,
};
