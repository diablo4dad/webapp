import { ArtifactMeta } from "../collection/type";
import { FirebaseData } from "../store";
import { VERSION } from "../config";

import { isPatchNeeded } from "./util";

type FirestoreData1d2d0 = {
  entries: ArtifactMeta[];
};

function isFirestoreData1d2d0(
  data: FirestoreData1d2d0 | FirebaseData,
): data is FirestoreData1d2d0 {
  return data.hasOwnProperty("entries");
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
    data = {
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

    data = {
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
