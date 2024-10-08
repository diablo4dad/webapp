import { initStore, StoreData, VersionInfo } from "../store";
import migration130 from "./migrate1d3d0.json";
import migration140 from "./migrate1d4d0.json";
import migration141 from "./migrate1d4d1.json";
import migration1610 from "./migrate1d6d10.json";
import migration170 from "./migrate1d7d0.json";
import { MasterGroup } from "../common";
import { CollectionLog, ItemFlag } from "../collection/type";
import { hashCode } from "../common/hash";
import { isPatchNeeded } from "./util";

export function runCollectionLogMigrations(
  collection: CollectionLog,
  version: VersionInfo,
): CollectionLog {
  ({ collectionLog: collection, version } = runCollectionLogMigrationsPreV170({
    ...initStore(), // mixin legacy
    collectionLog: collection,
    version: version,
  }));

  // hashes collection item arrays
  if (isPatchNeeded({ version }, 1, 7, 0)) {
    console.log("Running v1.7.0 migration...");

    const migrate = (collection: number[]) => {
      const result: number[][] = [];

      migration170.forEach((v) => {
        const everyItemExists = v
          .map(Number)
          .every((i) => collection.includes(i));

        if (everyItemExists) {
          result.push(v);
        }
      });

      const resultFlat = result.flat();
      collection.forEach((i) => {
        if (!resultFlat.includes(i)) {
          result.push([i]);
        }
      });

      return result;
    };

    return {
      collected: migrate(collection.collected).map(hashCode),
      hidden: migrate(collection.hidden).map(hashCode),
    };
  }

  return collection;
}

function runCollectionLogMigrationsPreV170(store: StoreData): StoreData {
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

