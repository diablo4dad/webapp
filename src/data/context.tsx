import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getDefaultItemId } from "./getters";
import { CollectionGroup, DadDb } from "./index";
import { useCollection } from "../collection/context";
import { useSettings } from "../settings/context";
import { filterDb } from "./filters";
import { createGlobalCollection } from "./transforms";
import {
  DEFAULT_SIDEBAR_VISIBILITY,
  DUAL_SIDEBAR_MIN_WIDTH,
  MasterGroup,
  SidebarVisibility,
  catalogGroups,
  constrainSidebarVisibility,
  getSidebarVisibilityPreference,
} from "../common";
import { useDebounceValue } from "usehooks-ts";
import { useEditor } from "../editor/context";

const defaultDadDb: DadDb = {
  collections: [],
  items: [],
  itemTypes: [],
};

const dualSidebarMediaQuery = `(min-width: ${DUAL_SIDEBAR_MIN_WIDTH}px)`;

export type CatalogGroupSource = "bundle" | "firestore";
type CatalogCollectionsByGroup = Partial<Record<MasterGroup, CollectionGroup>>;
type CatalogGroupSources = Partial<Record<MasterGroup, CatalogGroupSource>>;

type CatalogDataState = {
  db: DadDb;
  collectionsByGroup: CatalogCollectionsByGroup;
  groupSources: CatalogGroupSources;
};

function canShowDualSidebars(): boolean {
  return (
    typeof window === "undefined" ||
    !window.matchMedia ||
    window.matchMedia(dualSidebarMediaQuery).matches
  );
}

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

const defaultContext: DataContextType = {
  catalogGroupSources: {},
  db: defaultDadDb,
  group: MasterGroup.UNIVERSAL,
  loadedCatalogGroups: [],
  sidebarVisibility: DEFAULT_SIDEBAR_VISIBILITY,
  setCatalogCategoryDb: () => undefined,
  setSidebarVisibility: () => undefined,
  setDb: () => undefined,
  switchDb: () => undefined,
  filteredDb: [],
  countedDb: [],
  searchTerm: "",
  setSearchTerm: () => undefined,
  focusItemId: -1,
  setFocusItemId: () => undefined,
  focusCollectionId: undefined,
  setFocusCollectionId: () => undefined,
};

export type DataContextType = {
  catalogGroupSources: CatalogGroupSources;
  db: DadDb;
  group: MasterGroup;
  loadedCatalogGroups: MasterGroup[];
  sidebarVisibility: SidebarVisibility;
  setCatalogCategoryDb: (
    category: MasterGroup,
    dadDb: DadDb,
    source: CatalogGroupSource,
  ) => void;
  setSidebarVisibility: (sidebarVisibility: SidebarVisibility) => void;
  setDb: (dadDb: DadDb) => void;
  switchDb: (group: MasterGroup) => void;
  countedDb: CollectionGroup;
  filteredDb: CollectionGroup;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  focusItemId: number;
  setFocusItemId: (itemId: number) => void;
  focusCollectionId?: string;
  setFocusCollectionId: (collectionId: string | undefined) => void;
};

export const DataContext = createContext<DataContextType>(defaultContext);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: PropsWithChildren) {
  const log = useCollection();
  const settings = useSettings();
  const { isEditMode } = useEditor();

  const [catalogData, setCatalogData] = useState<CatalogDataState>({
    collectionsByGroup: {},
    db: defaultDadDb,
    groupSources: {},
  });
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
  const [group, switchDb] = useState<MasterGroup>(MasterGroup.UNIVERSAL);
  const [sidebarVisibility, setRawSidebarVisibility] =
    useState<SidebarVisibility>(() =>
      constrainSidebarVisibility(
        DEFAULT_SIDEBAR_VISIBILITY,
        canShowDualSidebars(),
      ),
    );
  const setSidebarVisibility = useCallback(
    (nextSidebarVisibility: SidebarVisibility) => {
      setRawSidebarVisibility((currentSidebarVisibility) =>
        constrainSidebarVisibility(
          nextSidebarVisibility,
          canShowDualSidebars(),
          getSidebarVisibilityPreference(
            currentSidebarVisibility,
            nextSidebarVisibility,
          ),
        ),
      );
    },
    [],
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
  const [focusItemId, setFocusItemId] = useState(-1);
  const [focusCollectionId, setFocusCollectionId] = useState<string>();
  const filteredDb = useMemo(() => {
    const filteredDb = filterDb(
      db.collections,
      settings,
      log,
      group,
      debouncedSearchTerm,
      false,
      isEditMode,
    );

    if (focusItemId === -1) {
      setFocusItemId(getDefaultItemId(filteredDb));
    }

    return filteredDb;
  }, [db, settings, log, group, debouncedSearchTerm, isEditMode]);
  const countedDb = useMemo(
    () => filterDb(db.collections, settings, log, group, null, true),
    [db, settings, log, group],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia(dualSidebarMediaQuery);
    const enforceCurrentBreakpoint = (canShowBoth: boolean) => {
      if (!canShowBoth) {
        setRawSidebarVisibility((currentSidebarVisibility) =>
          constrainSidebarVisibility(currentSidebarVisibility, false),
        );
      }
    };
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      enforceCurrentBreakpoint(event.matches);
    };

    enforceCurrentBreakpoint(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", onBreakpointChange);

      return () => {
        mediaQueryList.removeEventListener("change", onBreakpointChange);
      };
    }

    mediaQueryList.addListener(onBreakpointChange);

    return () => {
      mediaQueryList.removeListener(onBreakpointChange);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      catalogGroupSources,
      db,
      group,
      loadedCatalogGroups,
      sidebarVisibility,
      setCatalogCategoryDb,
      setSidebarVisibility,
      setDb,
      switchDb,
      filteredDb,
      countedDb,
      searchTerm,
      setSearchTerm,
      focusItemId,
      setFocusItemId,
      focusCollectionId,
      setFocusCollectionId,
    }),
    [
      catalogGroupSources,
      db,
      filteredDb,
      loadedCatalogGroups,
      sidebarVisibility,
      setCatalogCategoryDb,
      setSidebarVisibility,
      setDb,
      countedDb,
      group,
      searchTerm,
      focusItemId,
      focusCollectionId,
    ],
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}
