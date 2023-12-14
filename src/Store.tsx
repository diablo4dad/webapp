import {useState} from "react";

type ArtifactMeta = {
  itemId: string,
  collected: boolean,
  collectedDate?: Date
}

type Store = {
  data: StoreData,
  getLogEntry: (artifactId: string) => ArtifactMeta,
  isCollected: (artifactId: string) => boolean,
  toggle: (artifactId: string) => void,
}

type StoreData = {
  collectionLog: CollectionLog
}

type CollectionLog = {
  entries: ArtifactMeta[]
}

function initArtifactMeta(artifactId: string): ArtifactMeta {
  return {
    itemId: artifactId,
    collected: false,
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

  function getLogEntry(artifactId: string): ArtifactMeta {
    const logEntry = data
      .collectionLog
      .entries
      .filter(l => l.itemId === artifactId)
      .pop();

    return logEntry ?? initArtifactMeta(artifactId);
  }

  function toggle(artifactId: string) {
    const doesExist = data.collectionLog.entries.find(e => e.itemId === artifactId);
    if (!doesExist) {
      const logEntry = initArtifactMeta(artifactId);
      logEntry.collected = true;
      logEntry.collectedDate = new Date();

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
          if (e.itemId !== artifactId) {
            return e;
          } else {
            console.log("Current State...", e.collected);
            return {
              ...e,
              collected: !e.collected,
              collectedDate: !e.collected ? undefined : new Date(),
            };
          }
        }),
      }
    };

    setData(updatedData);
    persistData(updatedData);
  }

  function isCollected(artifactId: string): boolean {
    return getLogEntry(artifactId).collected;
  }

  return {
    data,
    getLogEntry,
    toggle,
    isCollected,
  };
}

export default useStore;
export type { Store, StoreData };
