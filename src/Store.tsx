import {useState} from "react";

type ArtifactMeta = {
  id: number,
  collected: boolean,
  collectedDate?: Date,
  hidden: boolean,
}

type Store = {
  data: StoreData,
  getLogEntry: (artifactId: number) => ArtifactMeta,
  isCollected: (artifactId: number) => boolean,
  toggle: (artifactId: number) => void,
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

  function toggle(artifactId: number) {
    const doesExist = data.collectionLog.entries.find(e => e.id === artifactId);
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
          if (e.id !== artifactId) {
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

  function isCollected(artifactId: number): boolean {
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
