import {useState} from "react";
import {Configuration, DEFAULT_CONFIG} from "./ConfigSidebar";
import {isScreenSmall, VERSION} from "./config";

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

type Store = {
  data: StoreData,
  init: () => void,
  getLogEntry: (artifactId: number) => ArtifactMeta,
  isCollected: (artifactId: number) => boolean,
  isHidden: (artifactId: number) => boolean,
  toggle: (artifactId: number, flag?: ItemFlag) => void,
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
  config: Configuration,
  collectionLog: CollectionLog,
  view: ViewState,
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

function persistData(data: StoreData) {
  console.log("Saving...");
  localStorage.setItem("d4log", JSON.stringify(data));
}

function isPatchNeeded(data: StoreData) {
  if (data.version === undefined) {
    return true;
  }

  if (data.version.major < VERSION.major) {
    return true;
  }

  if (data.version.minor < VERSION.minor) {
    return true;
  }

  if (data.version.revision < VERSION.revision) {
    return true;
  }

  return false;
}


function loadData(): StoreData {
  const localData = localStorage.getItem("d4log");
  if (localData) {
    const parsedData: StoreData = JSON.parse(localData);
    console.log("Collection loaded from HTML5 Storage.");

    // patch <1.2.0 collections
    if (isPatchNeeded(parsedData)) {
      console.log("Migrating collection to 1.2.0...");

      // convert flags to booleans
      parsedData.collectionLog.entries = parsedData.collectionLog.entries.map(i => {
        // this the preferred format for firestore queries
        if (i.flags) {
          i.collected = i.flags.includes(ItemFlag.COLLECTED);
          i.hidden = i.flags.includes(ItemFlag.HIDDEN);
          delete i.flags;
        }

        return i;
      });

      // bump schema
      parsedData.version = {
        major: 1,
        minor: 2,
        revision: 0,
      };

      // save changes
      persistData(parsedData);
    }

    return parsedData;
  } else {
    console.log("Initialising New Collection...");
    return initStore();
  }
}

function useStore(): Store {
  const [data, setData] = useState(initStore());

  function init() {
    setData(loadData());
  }

  function getLogEntry(artifactId: number): ArtifactMeta {
    const logEntry = data
      .collectionLog
      .entries
      .filter(l => l.id === artifactId)
      .pop();

    return logEntry ?? initArtifactMeta(artifactId);
  }

  function toggle(artifactId: number, flag: ItemFlag = ItemFlag.COLLECTED) {
    const doesExist = data.collectionLog.entries.find(e => e.id === artifactId);
    if (!doesExist) {
      const logEntry = initArtifactMeta(artifactId);

      switch (flag) {
        case ItemFlag.COLLECTED:
          logEntry.collected = true;
          break;
        case ItemFlag.HIDDEN:
          logEntry.hidden = true;
          break;
      }

      const updatedData = {
        ...data,
        collectionLog: {
          entries: [
            ...data.collectionLog.entries,
            logEntry,
          ],
        }
      };

      setData(updatedData);
      persistData(updatedData);
      return;
    }

    const updatedData ={
      ...data,
      collectionLog: {
        entries: data.collectionLog.entries.map(e => {
          if (e.id !== artifactId) {
            return e;
          } else {
            switch (flag) {
              case ItemFlag.COLLECTED:
                e.collected = !e.collected;
                break;
              case ItemFlag.HIDDEN:
                e.hidden = !e.hidden;
                break;
            }

            return e;
          }
        }),
      }
    };

    setData(updatedData);
    persistData(updatedData);
  }

  function isCollected(artifactId: number): boolean {
    return getLogEntry(artifactId).collected;
  }

  function isHidden(artifactId: number): boolean {
    return getLogEntry(artifactId).hidden;
  }

  function saveConfig(configuration: Configuration) {
    const updatedData = {
      ...data,
      config: configuration,
    };

    setData(updatedData);
    persistData(updatedData);
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
    const updatedData = {
      ...data,
      view,
    }

    setData(updatedData);
    persistData(updatedData);
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
export type { Store, StoreData };
export { ItemFlag };
