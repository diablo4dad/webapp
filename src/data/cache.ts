import { useCallback, useMemo, useState } from "react";
import { MasterGroup, catalogGroups } from "../shared/domain";
import { createGlobalCollection } from "./transforms";
import type { CollectionGroup, DadDb } from "./index";

type CatalogGroupSource = "bundle" | "firestore";
type CatalogCollectionsByGroup = Partial<Record<MasterGroup, CollectionGroup>>;
type CatalogGroupSources = Partial<Record<MasterGroup, CatalogGroupSource>>;

type CatalogDataState = {
  db: DadDb;
  collectionsByGroup: CatalogCollectionsByGroup;
  groupSources: CatalogGroupSources;
};

type UseCatalogDataResult = {
  catalogGroupSources: CatalogGroupSources;
  db: DadDb;
  group: MasterGroup;
  loadedCatalogGroups: MasterGroup[];
  setCatalogCategoryDb: (
    category: MasterGroup,
    dadDb: DadDb,
    source: CatalogGroupSource,
  ) => void;
  setDb: (dadDb: DadDb) => void;
  switchDb: (group: MasterGroup) => void;
};

const defaultDadDb: DadDb = {
  collections: [],
  items: [],
  itemTypes: [],
};

function isCatalogGroup(value?: string): value is MasterGroup {
  return catalogGroups.some((category) => category === value);
}

function getCatalogCollectionsByGroup(
  collections: CollectionGroup,
): CatalogCollectionsByGroup {
  return collections.reduce<CatalogCollectionsByGroup>(
    (collectionsByGroup, collection) => {
      if (!isCatalogGroup(collection.category)) {
        return collectionsByGroup;
      }

      return {
        ...collectionsByGroup,
        [collection.category]: [
          ...(collectionsByGroup[collection.category] ?? []),
          collection,
        ],
      };
    },
    {},
  );
}

function mergeCatalogCollections(
  collectionsByGroup: CatalogCollectionsByGroup,
): CollectionGroup {
  return catalogGroups.flatMap(
    (category) => collectionsByGroup[category] ?? [],
  );
}

function rebuildDadDbFromCatalogCache(
  dadDb: DadDb,
  collectionsByGroup: CatalogCollectionsByGroup,
): DadDb {
  const collections = mergeCatalogCollections(collectionsByGroup);

  return {
    ...dadDb,
    collections: [
      ...collections,
      ...createGlobalCollection(dadDb.itemTypes, collections),
    ],
  };
}

function useCatalogData(): UseCatalogDataResult {
  const [catalogData, setCatalogData] = useState<CatalogDataState>({
    collectionsByGroup: {},
    db: defaultDadDb,
    groupSources: {},
  });
  const [group, switchDb] = useState<MasterGroup>(MasterGroup.UNIVERSAL);
  const db = catalogData.db;
  const catalogGroupSources = catalogData.groupSources;
  const loadedCatalogGroups = useMemo(
    () =>
      catalogGroups.filter(
        (category) => catalogData.collectionsByGroup[category] !== undefined,
      ),
    [catalogData.collectionsByGroup],
  );
  const setDb = useCallback((dadDb: DadDb) => {
    setCatalogData((current) => {
      const groupedCollections = getCatalogCollectionsByGroup(
        dadDb.collections,
      );

      if (Object.keys(groupedCollections).length === 0) {
        return {
          ...current,
          db: dadDb,
        };
      }

      const collectionsByGroup = {
        ...current.collectionsByGroup,
        ...groupedCollections,
      };

      return {
        ...current,
        collectionsByGroup,
        db: rebuildDadDbFromCatalogCache(dadDb, collectionsByGroup),
      };
    });
  }, []);
  const setCatalogCategoryDb = useCallback(
    (category: MasterGroup, dadDb: DadDb, source: CatalogGroupSource) => {
      setCatalogData((current) => {
        const collectionsByGroup = {
          ...current.collectionsByGroup,
          [category]: dadDb.collections.filter(
            (collection) => collection.category === category,
          ),
        };

        return {
          collectionsByGroup,
          db: rebuildDadDbFromCatalogCache(dadDb, collectionsByGroup),
          groupSources: {
            ...current.groupSources,
            [category]: source,
          },
        };
      });
    },
    [],
  );

  return {
    catalogGroupSources,
    db,
    group,
    loadedCatalogGroups,
    setCatalogCategoryDb,
    setDb,
    switchDb,
  };
}

export {
  defaultDadDb,
  getCatalogCollectionsByGroup,
  mergeCatalogCollections,
  rebuildDadDbFromCatalogCache,
  useCatalogData,
  type CatalogCollectionsByGroup,
  type CatalogGroupSource,
  type CatalogGroupSources,
};
