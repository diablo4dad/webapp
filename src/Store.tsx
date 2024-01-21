import {useState} from "react";
import {Configuration, DEFAULT_CONFIG} from "./ConfigSidebar";

enum ItemFlag {
  COLLECTED,
  HIDDEN,
}

type ArtifactMeta = {
  id: number,
  flags: ItemFlag[],
}

type Store = {
  data: StoreData,
  getLogEntry: (artifactId: number) => ArtifactMeta,
  isCollected: (artifactId: number) => boolean,
  isHidden: (artifactId: number) => boolean,
  toggle: (artifactId: number, flag?: ItemFlag) => void,
  saveConfig: (config: Configuration) => void,
  loadConfig: () => Configuration | undefined,
}

type StoreData = {
  config: Configuration,
  collectionLog: CollectionLog
}

type CollectionLog = {
  entries: ArtifactMeta[]
}

function initArtifactMeta(artifactId: number): ArtifactMeta {
  return {
    id: artifactId,
    flags: [],
  }
}

function initStore(): StoreData {
  return {
    config: DEFAULT_CONFIG,
    collectionLog: {
      entries: [],
    },
  };
}

function persistData(data: StoreData) {
  console.log("Persisting Store...", data);
  localStorage.setItem("d4log", JSON.stringify(data));
}

function loadData(): StoreData {
  const localData = localStorage.getItem("d4log");
  if (localData) {
    const parsedData = JSON.parse(localData);
    console.log("Loaded Store...", parsedData);
    return parsedData;
  } else {
    console.log("Initialising Store...");
    return initStore();
  }
}

function useStore(): Store {
  const [data, setData] = useState(loadData());

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
      logEntry.flags.push(flag);

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
            const flagIndex = e.flags.indexOf(flag);

            return {
              ...e,
              flags: flagIndex === -1 ? [...e.flags, flag] : e.flags.filter((_, i) => i !== flagIndex),
            };
          }
        }),
      }
    };

    setData(updatedData);
    persistData(updatedData);
  }

  function isCollected(artifactId: number): boolean {
    return getLogEntry(artifactId).flags.includes(ItemFlag.COLLECTED);
  }

  function isHidden(artifactId: number): boolean {
    return getLogEntry(artifactId).flags.includes(ItemFlag.HIDDEN);
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

  return {
    data,
    getLogEntry,
    toggle,
    isCollected,
    isHidden,
    saveConfig,
    loadConfig,
  };
}

export default useStore;
export type { Store, StoreData };
export { ItemFlag };
