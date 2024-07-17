import { FirebaseData, StoreData, VersionMeta } from "../store";
import migration130 from "./migrate1d3d0.json";
import migration140 from "./migrate1d4d0.json";
import migration141 from "./migrate1d4d1.json";
import { VERSION } from "../config";
import { MasterGroup } from "../common";
import { ArtifactMeta, ItemFlag } from "../collection/type";
import {
  getStoreData,
  getVersion,
  saveCollection,
  saveVersion,
} from "../store/local";

type FirestoreData1d2d0 = {
  entries: ArtifactMeta[];
};

function isFirestoreData1d2d0(
  data: FirestoreData1d2d0 | FirebaseData,
): data is FirestoreData1d2d0 {
  return data.hasOwnProperty("entries");
}

function isPatchNeeded(
  data: VersionMeta,
  major: number,
  minor: number,
  revision: number,
): boolean {
  if (data.version === undefined) return true;
  if (data.version.major < major) return true;
  if (data.version.minor < minor) return true;
  if (data.version.revision < revision) return true;
  return false;
}

export function runFirestoreMigrations(
  data: FirestoreData1d2d0 | FirebaseData,
): FirebaseData {
  if (isFirestoreData1d2d0(data)) {
    // is collection is empty, nothing to migrate
    if (!Array.isArray(data.entries) || data.entries.length === 0) {
      console.log("Collection log empty; migrating to latest.");

      return {
        version: VERSION,
        collectionLog: {
          entries: [],
          collected: [],
          hidden: [],
        },
      };
    }

    // check pre v1.2.0
    if (data.entries[0].flags !== undefined) {
      console.log("Running Firestore v1.0.0 migration...");
      return {
        collectionLog: {
          entries: data.entries,
          collected: [],
          hidden: [],
        },
        version: {
          major: 1,
          minor: 0,
          revision: 0,
        },
      };
    }

    // otherwise, it's v1.2.0
    console.log("Running Firestore v1.2.0 migration...");
    return {
      collectionLog: {
        entries: data.entries ?? [],
        collected: [],
        hidden: [],
      },
      version: {
        major: 1,
        minor: 2,
        revision: 0,
      },
    };
  }

  // adds collected and hidden arrays
  if (isPatchNeeded(data, 1, 6, 10)) {
    console.log("Running Firestore v1.6.10 migration...");
    return {
      ...data,
      collectionLog: {
        ...data.collectionLog,
        collected: [],
        hidden: [],
      },
    };
  }

  // no migrations needed
  return data as FirebaseData;
}

export async function runStoreMigrations(store: StoreData): Promise<StoreData> {
  if (isPatchNeeded(store, 1, 2, 0)) {
    console.log("Running v1.2.0 migration...");

    // convert flags to booleans
    store.collectionLog.entries = store.collectionLog.entries?.map((i) => {
      // this the preferred format for firestore queries
      if (i.flags) {
        i.collected = i.flags.includes(ItemFlag.COLLECTED);
        i.hidden = i.flags.includes(ItemFlag.HIDDEN);
        delete i.flags;
      }

      return i;
    });

    // bump schema
    store.version = {
      major: 1,
      minor: 2,
      revision: 0,
    };
  }

  if (isPatchNeeded(store, 1, 3, 0)) {
    console.log("Running v1.3.0 migration...");

    // don't use default field anymore
    delete store.default;

    // remove junk entries
    store.collectionLog.entries = store.collectionLog.entries?.filter(
      // eslint-disable-next-line eqeqeq
      (i) => migration130.filter((m) => m.iid == i.id).length,
    );

    // remap collection items
    store.collectionLog.entries = store.collectionLog.entries?.map((i) => {
      // this the preferred format for firestore queries
      const migrationItem = migration130.filter((m) => m.iid == i.id);
      if (!migrationItem.length) {
        console.warn("Unable to locate migration mapping...", i.id);
        return i;
      }

      // remap item -> collection item
      const item = migrationItem[0];
      return {
        ...i,
        id: item.cid,
      };
    });

    // bump schema
    store.version = {
      major: 1,
      minor: 3,
      revision: 0,
    };
  }

  if (isPatchNeeded(store, 1, 4, 0)) {
    console.log("Running v1.4.0 migration...");

    // append "group" to every collection item
    store.collectionLog.entries = store.collectionLog.entries
      ?.map((cl) => {
        const updatedCl = { ...cl };

        if (migration140.general.includes(cl.id)) {
          updatedCl.group = MasterGroup.GENERAL;
        } else if (migration140.promotional.includes(cl.id)) {
          updatedCl.group = MasterGroup.PROMOTIONAL;
        } else {
          console.warn(
            "Collection item not present in migration path. This will be deleted.",
            cl,
          );
        }

        return updatedCl;
      })
      .filter((cl) => cl.group !== undefined);

    // bump schema
    store.version = {
      major: 1,
      minor: 4,
      revision: 0,
    };
  }

  if (isPatchNeeded(store, 1, 4, 1)) {
    console.log("Running v1.4.1 migration...");

    // delete merged player titles
    store.collectionLog.entries = store.collectionLog.entries?.filter(
      (cl) => !migration141.titles.includes(cl.id),
    );

    // bump schema
    store.version = {
      major: 1,
      minor: 4,
      revision: 1,
    };
  }

  if (isPatchNeeded(store, 1, 6, 10)) {
    console.log("Running v1.6.10 migration...");

    const migration1610 = await import("./migrate1d6d10.json");
    const collected = new Set<number>();
    const hidden = new Set<number>();

    store.collectionLog.entries?.forEach((e) => {
      // @ts-ignore
      const lookup = migration1610[String(e.id)];
      if (!lookup) {
        console.error("Could not map CMS item to item ID.", e);
        return;
      }

      if (e.collected) {
        lookup.map((v: String) => collected.add(Number(v)));
      }

      if (e.hidden) {
        lookup.map((v: String) => hidden.add(Number(v)));
      }
    });

    store.collectionLog = {
      entries: [],
      collected: Array.from(collected),
      hidden: Array.from(hidden),
    };

    // bump schema
    store.version = {
      major: 1,
      minor: 6,
      revision: 10,
    };
  }

  return store;
}

export function runLocalStorageMigrations() {
  const version = getVersion();
  if (version === null) {
    console.log("Running v1.7.0 local storage migration...");

    // Intentionally throw away settings and view model
    const storeData = getStoreData();
    saveCollection(storeData.collectionLog);
    saveVersion(VERSION);
  }
}