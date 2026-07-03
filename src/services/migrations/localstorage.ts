import {
  deleteStoreData,
  getStoreData,
  getUserCollectionLog,
  getVersion,
  isPreV170,
  saveCollection,
  saveVersion,
} from "../store/local";
import { VERSION } from "../config";
import { runCollectionLogMigrations } from "./index";

export function runLocalStorageMigrations() {
  // before v1.7.0
  if (isPreV170()) {
    console.log("Running v1.7.0 local storage migration...");
    const storeData = getStoreData();
    saveCollection(storeData.collectionLog);
    saveVersion(storeData.version);
    deleteStoreData();
  }

  // failsafe; new user...
  if (getVersion() == null) {
    console.log("Setting up local storage...");
    saveCollection({ collected: [], hidden: [] });
    saveVersion(VERSION);
    deleteStoreData();
  }

  // run migrations (if any)
  const version = getVersion() ?? VERSION;
  const collectionPre = getUserCollectionLog();
  const collectionPost = runCollectionLogMigrations(collectionPre, version);
  saveCollection(collectionPost);
  saveVersion(VERSION);
}
