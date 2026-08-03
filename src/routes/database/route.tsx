import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEditor } from "../../features/editor";
import { useData, type DataContextType } from "../../services/data/context";
import { hydrateDadDb } from "../../services/data/factory";
import type { DadDbRef, ItemType } from "../../services/data";
import {
  fetchCatalogItems,
  fetchHybridDadDbRefsByCategory,
  fetchStaticDadDbRef,
  type CatalogItemSource,
} from "../../services/store/catalog";
import { catalogGroups, type MasterGroup } from "../../shared/domain";
import {
  DATABASE_SHELL_CONTROLS,
  useRootOutletContext,
  useRootShellControls,
} from "../root/outlet";
import { scrollRootToTop } from "../root/scroll";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT_MODE,
  createCollectionLogReferencesByItemId,
  createSearchIndex,
  createExplorerItems,
  filterExplorerItems,
  getClassFilterOptions,
  getItemTypeOptions,
  getItemQualityOptions,
  sortExplorerItems,
  type CollectionLogReference,
  type ExplorerItem,
  type Filters,
  type SortMode,
} from "./state";
import { View } from "./view";

type LoadState =
  | {
      collectionReferencesByItemId: Map<number, CollectionLogReference[]>;
      itemTypes: ItemType[];
      items: ExplorerItem[];
      status: "loaded";
    }
  | {
      error: string;
      status: "error";
    }
  | {
      status: "loading";
    };

function Component() {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { searchTerm } = useRootOutletContext();
  const { canEditCatalog, isEditMode } = useEditor();
  const { loadedCatalogGroups, setCatalogCategoryDb } = useData();
  const catalogItemSource = getCatalogItemSource(canEditCatalog);
  useRootShellControls(DATABASE_SHELL_CONTROLS);
  const selectedItemId = getSelectedItemId(itemId);
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT_MODE);
  const activeFilters = useMemo<Filters>(
    () => ({
      ...filters,
      searchTerm,
    }),
    [filters, searchTerm],
  );

  useLayoutEffect(() => {
    if (hasDatabaseScrollResetState(location.state)) {
      scrollRootToTop();
    }
  }, [location.key, location.state]);

  useEffect(() => {
    let cancelled = false;

    setLoadState((currentState) =>
      currentState.status === "loaded"
        ? currentState
        : { status: "loading" },
    );

    void Promise.all([
      fetchStaticDadDbRef(),
      fetchDatabaseCatalogItems(catalogItemSource),
    ])
      .then(async ([dadDbRef, catalogItems]) => {
        const items = createExplorerItems(dadDbRef, catalogItems);
        const collectionReferencesByItemId =
          await fetchDatabaseCollectionReferences({
            dadDbRef,
            items,
            source: catalogItemSource,
          });

        if (!cancelled) {
          setLoadState({
            collectionReferencesByItemId,
            itemTypes: dadDbRef.itemTypes,
            items,
            status: "loaded",
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadState({
            error: getLoadErrorMessage(error),
            status: "error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalogItemSource, refreshKey]);

  const items = loadState.status === "loaded" ? loadState.items : [];
  const itemTypes = loadState.status === "loaded" ? loadState.itemTypes : [];
  const collectionReferencesByItemId = loadState.status === "loaded"
    ? loadState.collectionReferencesByItemId
    : new Map<number, CollectionLogReference[]>();
  const existingItemIds = useMemo(
    () => items.map((item) => item.item.id),
    [items],
  );
  const searchIndex = useMemo(() => createSearchIndex(items), [items]);
  const filteredItems = useMemo(
    () => filterExplorerItems(items, activeFilters, searchIndex),
    [activeFilters, items, searchIndex],
  );
  const sortedItems = useMemo(
    () => sortExplorerItems(filteredItems, sortMode),
    [filteredItems, sortMode],
  );
  const itemTypeOptions = useMemo(() => getItemTypeOptions(items), [items]);
  const itemQualityOptions = useMemo(() => getItemQualityOptions(items), [items]);
  const itemsById = useMemo(() => getItemsById(items), [items]);
  const filteredItemsById = useMemo(
    () => getFirstItemsById(sortedItems),
    [sortedItems],
  );
  const selectedItem = getSelectedItem({
    filteredItemsById,
    filteredItems: sortedItems,
    itemsById,
    selectedItemId,
  });
  const selectedItemCollectionReferences = selectedItem
    ? collectionReferencesByItemId.get(selectedItem.item.id) ?? []
    : [];
  const onSelectItemIdChange = useCallback(
    (nextItemId: number, options?: { replace?: boolean }) => {
      void navigate(`/database/${nextItemId}`, {
        replace: options?.replace,
      });
    },
    [navigate],
  );
  const handleSelectItem = useCallback(
    (item: ExplorerItem) => onSelectItemIdChange(item.item.id),
    [onSelectItemIdChange],
  );

  useEffect(() => {
    if (!selectedItem || selectedItem.item.id === selectedItemId) {
      return;
    }

    onSelectItemIdChange(selectedItem.item.id, {
      replace: selectedItemId === undefined,
    });
  }, [onSelectItemIdChange, selectedItem, selectedItemId]);

  function onFilterChange(nextFilters: Partial<Filters>) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...nextFilters,
    }));
  }

  function onRetry() {
    setRefreshKey((current) => current + 1);
  }

  function onRefreshItems() {
    setRefreshKey((current) => current + 1);
    void refreshLoadedCatalogGroupsFromFirestore({
      loadedCatalogGroups,
      setCatalogCategoryDb,
    });
  }

  return (
    <View
      canEditCatalog={canEditCatalog}
      classOptions={getClassFilterOptions()}
      error={loadState.status === "error" ? loadState.error : undefined}
      filteredItems={sortedItems}
      filters={activeFilters}
      isLoading={loadState.status === "loading"}
      existingItemIds={existingItemIds}
      itemTypeOptions={itemTypeOptions}
      itemQualityOptions={itemQualityOptions}
      collectionReferences={selectedItemCollectionReferences}
      onFilterChange={onFilterChange}
      onRefreshItems={onRefreshItems}
      onRetry={onRetry}
      onSelectItem={handleSelectItem}
      onSelectItemId={onSelectItemIdChange}
      onSortModeChange={setSortMode}
      selectedItem={selectedItem}
      showSelectedItemInitially={selectedItemId !== undefined}
      sortMode={sortMode}
      totalCount={items.length}
      isEditMode={isEditMode}
      itemTypes={itemTypes}
    />
  );
}

async function refreshLoadedCatalogGroupsFromFirestore({
  loadedCatalogGroups,
  setCatalogCategoryDb,
}: {
  loadedCatalogGroups: readonly MasterGroup[];
  setCatalogCategoryDb: DataContextType["setCatalogCategoryDb"];
}): Promise<void> {
  if (loadedCatalogGroups.length === 0) {
    return;
  }

  try {
    const refreshedGroups = await fetchHybridDadDbRefsByCategory(
      [...loadedCatalogGroups],
      { source: "firestore" },
    );

    refreshedGroups.forEach((refreshedGroup) => {
      setCatalogCategoryDb(
        refreshedGroup.category as MasterGroup,
        hydrateDadDb(refreshedGroup.dadDbRef),
        "firestore",
      );
    });
  } catch (error) {
    console.warn(
      "[Catalog] Failed to refresh loaded catalog groups after item update.",
      error,
    );
  }
}

function getCatalogItemSource(
  canEditCatalog: boolean,
): CatalogItemSource {
  return canEditCatalog ? "firestore" : "bundle";
}

async function fetchDatabaseCatalogItems(
  source: CatalogItemSource,
) {
  try {
    return await fetchCatalogItems({ source });
  } catch (error) {
    if (source === "firestore") {
      throw error;
    }

    console.warn(
      "[Catalog] Failed to load catalog item overrides. Continuing with static database items.",
      error,
    );

    return [];
  }
}

async function fetchDatabaseCollectionReferences({
  dadDbRef,
  items,
  source,
}: {
  dadDbRef: DadDbRef;
  items: ExplorerItem[];
  source: CatalogItemSource;
}): Promise<Map<number, CollectionLogReference[]>> {
  try {
    const resolvedGroups = await fetchHybridDadDbRefsByCategory(
      [...catalogGroups],
      { source },
    );

    return createCollectionLogReferencesByItemId(
      {
        collections: resolvedGroups.flatMap(
          (resolvedGroup) => resolvedGroup.dadDbRef.collections,
        ),
        itemTypes: dadDbRef.itemTypes,
      },
      items,
    );
  } catch (error) {
    console.warn(
      "[Catalog] Failed to load collection log references. Falling back to static database collections.",
      error,
    );

    return createCollectionLogReferencesByItemId(dadDbRef, items);
  }
}

function getSelectedItem({
  filteredItemsById,
  filteredItems,
  itemsById,
  selectedItemId,
}: {
  filteredItemsById: Map<number, ExplorerItem>;
  filteredItems: ExplorerItem[];
  itemsById: Map<number, ExplorerItem[]>;
  selectedItemId?: number;
}): ExplorerItem | undefined {
  if (selectedItemId !== undefined) {
    return (
      filteredItemsById.get(selectedItemId) ??
      itemsById.get(selectedItemId)?.[0]
    );
  }

  return filteredItems[0];
}

function getFirstItemsById(items: ExplorerItem[]): Map<number, ExplorerItem> {
  return items.reduce((lookup, item) => {
    if (!lookup.has(item.item.id)) {
      lookup.set(item.item.id, item);
    }

    return lookup;
  }, new Map<number, ExplorerItem>());
}

function getItemsById(items: ExplorerItem[]): Map<number, ExplorerItem[]> {
  return items.reduce((lookup, item) => {
    const group = lookup.get(item.item.id) ?? [];
    group.push(item);
    lookup.set(item.item.id, group);

    return lookup;
  }, new Map<number, ExplorerItem[]>());
}

function getSelectedItemId(itemId?: string): number | undefined {
  if (itemId === undefined) {
    return undefined;
  }

  const parsedItemId = Number(itemId);

  return Number.isInteger(parsedItemId) ? parsedItemId : undefined;
}

function getLoadErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Failed to load database.";
}

function hasDatabaseScrollResetState(
  state: unknown,
): state is { resetDatabaseScroll: true } {
  return (
    typeof state === "object" &&
    state !== null &&
    "resetDatabaseScroll" in state &&
    state.resetDatabaseScroll === true
  );
}

export { Component };
