import {useState} from "react";

enum ItemFlag {
  COLLECTED,
  HIDDEN,
}

type ArtifactMeta = {
  id: number,
  collected: boolean,
  collectedDate?: Date,
  hidden: boolean,
  flags: ItemFlag[],
}

type Store = {
  data: StoreData,
  getLogEntry: (artifactId: number) => ArtifactMeta,
  isCollected: (artifactId: number) => boolean,
  isHidden: (artifactId: number) => boolean,
  toggle: (artifactId: number, flag?: ItemFlag) => void,
}

type StoreData = {
  collectionLog: CollectionLog
}

type CollectionLog = {
  entries: ArtifactMeta[]
}

function initArtifactMeta(artifactId: number): ArtifactMeta {
  return {
    id: artifactId,
    collected: false,
    hidden: false,
    flags: [],
  }
}

function initStore(): StoreData {
  return {
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
      logEntry.collected = true;
      logEntry.collectedDate = new Date();
      logEntry.flags.push(ItemFlag.COLLECTED);

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
            console.log("Current State...", e.collected);
            const flagIndex = e.flags.indexOf(flag);
            return {
              ...e,
              collected: !e.collected,
              collectedDate: !e.collected ? undefined : new Date(),
              flags: flagIndex === -1 ? [...e.flags, flag] : e.flags.splice(flagIndex, flagIndex),
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

  return {
    data,
    getLogEntry,
    toggle,
    isCollected,
    isHidden,
  };
}

export default useStore;
export type { Store, StoreData };
export { ItemFlag };
