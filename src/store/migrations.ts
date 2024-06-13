import { ArtifactMeta, FirebaseData, ItemFlag, StoreData } from "./index";
import migration130 from "./migrate1d3d0.json";
import migration140 from "./migrate1d4d0.json";
import migration141 from "./migrate1d4d1.json";
import { VERSION } from "../config";
import { MasterGroup } from "../common";

type FirestoreData1d2d0 = {
  entries: ArtifactMeta[];
};

function isFirestoreData1d2d0(
  data: FirestoreData1d2d0 | FirebaseData,
): data is FirestoreData1d2d0 {
  return data.hasOwnProperty("entries");
}

function isPatchNeeded(
  data: StoreData,
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
        },
      };
    }

    // check pre v1.2.0
    if (data.entries[0].flags !== undefined) {
      console.log("Running Firestore v1.0.0 migration...");
      return {
        collectionLog: { entries: data.entries },
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
      collectionLog: { entries: data.entries ?? [] },
      version: {
        major: 1,
        minor: 2,
        revision: 0,
      },
    };
  }

  // no migrations needed
  return data as FirebaseData;
}

export function runStoreMigrations(store: StoreData): StoreData {
  if (isPatchNeeded(store, 1, 2, 0)) {
    console.log("Running v1.2.0 migration...");

    // convert flags to booleans
    store.collectionLog.entries = store.collectionLog.entries.map((i) => {
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
    store.collectionLog.entries = store.collectionLog.entries.filter(
      (i) => migration130.filter((m) => m.iid == i.id).length,
    );

    // remap collection items
    store.collectionLog.entries = store.collectionLog.entries.map((i) => {
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
      .map((cl) => {
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
    store.collectionLog.entries = store.collectionLog.entries.filter(
      (cl) => !migration141.titles.includes(cl.id),
    );

    // bump schema
    store.version = {
      major: 1,
      minor: 4,
      revision: 1,
    };
  }

  return store;
}
