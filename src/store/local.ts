import { initStore, StoreData, VersionMeta } from "./index";
import { Settings } from "../settings/type";
import { defaultSettings } from "../settings/context";
import { CollectionLog } from "../collection/type";
import { defaultCollection } from "../collection/context";
import { ViewModel } from "../Application";

const VM_KEY = "vm";
const VERSION_KEY = "version";
const SETTINGS_KEY = "settings";
const COLLECTION_KEY = "collection";

// deprecated
const STORE_KEY = "d4log";

export function getUserCollectionLog(): CollectionLog {
  return getValueFromStorage(COLLECTION_KEY, defaultCollection);
}

export function saveCollection(collection: CollectionLog) {
  setValueInStorage(COLLECTION_KEY, collection);
}

export function getUserSettings(): Settings {
  return getValueFromStorage(SETTINGS_KEY, defaultSettings);
}

export function saveSettings(settings: Settings) {
  setValueInStorage(SETTINGS_KEY, settings);
}

export function getViewModel(): ViewModel {
  return getValueFromStorage(VM_KEY, {
    openCollections: [],
  });
}

export function saveViewModel(vm: ViewModel) {
  setValueInStorage(VM_KEY, vm);
}

export function getVersion(): VersionMeta | null {
  return getValueFromStorage(VERSION_KEY, null);
}

export function saveVersion(version: VersionMeta) {
  setValueInStorage(VERSION_KEY, version);
}

// deprecated
export function getStoreData(): StoreData {
  return getValueFromStorage(STORE_KEY, initStore());
}

function getValueFromStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return fallback;
    }

    return JSON.parse(value);
  } catch (e) {
    if (e instanceof DOMException) {
      console.error("Unable to read value from localStorage.", e.stack);
    } else if (e instanceof SyntaxError) {
      console.error("Unable to parse JSON value.", e.stack);
    } else if (e instanceof Error) {
      console.error("Unexpected error occurred.", e.stack);
    }

    return fallback;
  }
}

function setValueInStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e instanceof DOMException) {
      console.error("Unable to save value to localStorage.", e.stack);
    } else if (e instanceof TypeError) {
      console.error("Unable to stringify value to JSON.", e.stack);
    } else if (e instanceof Error) {
      console.error("Unexpected error occurred.", e.stack);
    }
  }
}
