import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStaticDadDbRef } from "../../services/store/catalog";
import {
  DEFAULT_FILTERS,
  DEFAULT_SORT_MODE,
  createSearchIndex,
  createStaticExplorerItems,
  filterExplorerItems,
  getClassFilterOptions,
  getItemTypeOptions,
  getMagicTypeOptions,
  sortExplorerItems,
  type ExplorerItem,
  type Filters,
  type SortMode,
} from "./state";
import { View } from "./view";

type Props = {
  onSelectItemIdChange?: (
    itemId: number,
    options?: { replace?: boolean },
  ) => void;
  searchTerm: string;
  selectedItemId?: number;
};

type LoadState =
  | {
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

function DatabaseExplorer({
  onSelectItemIdChange,
  searchTerm,
  selectedItemId,
}: Props) {
  const [loadState, setLoadState] = useState<LoadState>({
    status: "loading",
  });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortMode, setSortMode] = useState<SortMode>(DEFAULT_SORT_MODE);
  const activeFilters = useMemo<Filters>(
    () => ({
      ...filters,
      searchTerm,
    }),
    [filters, searchTerm],
  );

  useEffect(() => {
    let cancelled = false;

    setLoadState({ status: "loading" });

    void fetchStaticDadDbRef()
      .then((dadDbRef) => {
        if (!cancelled) {
          setLoadState({
            items: createStaticExplorerItems(dadDbRef),
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
  }, []);

  const items = loadState.status === "loaded" ? loadState.items : [];
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
  const magicTypeOptions = useMemo(() => getMagicTypeOptions(items), [items]);
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
  const handleSelectItem = useCallback(
    (item: ExplorerItem) => onSelectItemIdChange?.(item.item.id),
    [onSelectItemIdChange],
  );

  useEffect(() => {
    if (!selectedItem || selectedItem.item.id === selectedItemId) {
      return;
    }

    onSelectItemIdChange?.(selectedItem.item.id, {
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
    setLoadState({ status: "loading" });
    void fetchStaticDadDbRef()
      .then((dadDbRef) => {
        setLoadState({
          items: createStaticExplorerItems(dadDbRef),
          status: "loaded",
        });
      })
      .catch((error) => {
        setLoadState({
          error: getLoadErrorMessage(error),
          status: "error",
        });
      });
  }

  return (
    <View
      classOptions={getClassFilterOptions()}
      error={loadState.status === "error" ? loadState.error : undefined}
      filteredItems={sortedItems}
      filters={activeFilters}
      isLoading={loadState.status === "loading"}
      itemTypeOptions={itemTypeOptions}
      magicTypeOptions={magicTypeOptions}
      onFilterChange={onFilterChange}
      onRetry={onRetry}
      onSelectItem={handleSelectItem}
      onSortModeChange={setSortMode}
      selectedItem={selectedItem}
      showSelectedItemInitially={selectedItemId !== undefined}
      sortMode={sortMode}
      totalCount={items.length}
    />
  );
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

function getLoadErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Failed to load database.";
}

export { DatabaseExplorer };
