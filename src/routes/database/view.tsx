import classNames from "classnames";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ItemType } from "../../services/data";
import Card from "../../shared/ui/Card";
import { DatabaseItemCreator } from "../../features/database-explorer/editor";
import {
  ItemList,
  type FilterControlConfig,
  type FilterControlKey,
} from "../../features/database-explorer/item-list";
import itemListStyles from "../../features/database-explorer/item-list/view.module.css";
import {
  ItemView,
  type JsonPath,
  type JsonPreviewState,
} from "../../features/database-explorer/item-view";
import {
  fetchJson,
  getDataminedFileUrl,
  getJsonErrorMessage,
  replaceJsonValueAtPath,
} from "./json";
import {
  type CollectionLogReference,
  type ExplorerItem,
  type FilterOption,
  type Filters,
  type SortMode,
} from "./state";
import { Layout } from "./layout";
import { DatabaseSkeleton } from "./skeleton";
import styles from "./view.module.css";

type Props = {
  canEditCatalog?: boolean;
  classOptions: FilterOption[];
  collectionReferences?: CollectionLogReference[];
  error?: string;
  filteredItems: ExplorerItem[];
  filters: Filters;
  isEditMode?: boolean;
  isLoading: boolean;
  existingItemIds?: number[];
  itemTypes?: ItemType[];
  itemTypeOptions: FilterOption[];
  magicTypeOptions: FilterOption[];
  onFilterChange: (filters: Partial<Filters>) => void;
  onRefreshItems?: () => void;
  onRetry: () => void;
  onSelectItem: (item: ExplorerItem) => void;
  onSelectItemId?: (itemId: number) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  selectedItem?: ExplorerItem;
  showSelectedItemInitially?: boolean;
  sortMode: SortMode;
  totalCount: number;
};

type FilterScrollAction = "filterTop" | "listRestore";
type MobilePane = "detail" | "list";
type MobileScrollAction = "detailTop" | "listRestore";

function View({
  canEditCatalog = false,
  classOptions,
  collectionReferences = [],
  error,
  filteredItems,
  filters,
  isEditMode = false,
  isLoading,
  existingItemIds = [],
  itemTypes = [],
  itemTypeOptions,
  magicTypeOptions,
  onFilterChange,
  onRefreshItems = () => undefined,
  onRetry,
  onSelectItem,
  onSelectItemId = () => undefined,
  onSortModeChange,
  selectedItem,
  showSelectedItemInitially = false,
  sortMode,
  totalCount,
}: Props) {
  const viewRef = useRef<HTMLElement>(null);
  const filterOptionsRef = useRef<HTMLDivElement>(null);
  const itemListRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const jsonReferenceAbortControllerRef = useRef<
    AbortController | undefined
  >(undefined);
  const savedFilterListScrollTopRef = useRef(0);
  const savedListScrollTopRef = useRef(0);
  const pendingFilterScrollActionRef = useRef<
    FilterScrollAction | undefined
  >(undefined);
  const pendingMobileScrollActionRef = useRef<
    MobileScrollAction | undefined
  >(undefined);
  const [jsonPreview, setJsonPreview] = useState<JsonPreviewState>({
    status: "idle",
  });
  const [openFilterKey, setOpenFilterKey] = useState<FilterControlKey>();
  const [mobilePane, setMobilePane] = useState<MobilePane>(() =>
    showSelectedItemInitially ? "detail" : "list",
  );
  const filterControls = createFilterControls({
    classOptions,
    filters,
    itemTypeOptions,
    magicTypeOptions,
  });
  const selectedItemFileName = selectedItem?.item.filename;
  const createItemAction = canEditCatalog && isEditMode
    ? (
        <DatabaseItemCreator
          existingItemIds={existingItemIds}
          itemTypes={itemTypes}
          triggerClassName={itemListStyles.ViewListAddButton}
          triggerLabel="Add +"
          onSaved={(createdItemId) => {
            onRefreshItems();
            onSelectItemId(createdItemId);
          }}
        />
      )
    : undefined;
  const isListPaneVisible = mobilePane === "list";
  const isDetailPaneVisible = mobilePane === "detail";
  const shouldSyncSelectedListScroll = !isMobileExplorerLayout();

  useEffect(() => {
    abortControllerRef.current?.abort();
    jsonReferenceAbortControllerRef.current?.abort();
    setJsonPreview({ status: "idle" });
  }, [selectedItemFileName]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      jsonReferenceAbortControllerRef.current?.abort();
    };
  }, []);

  useLayoutEffect(() => {
    if (!isMobileExplorerLayout()) {
      pendingMobileScrollActionRef.current = undefined;
      return;
    }

    const pendingMobileScrollAction = pendingMobileScrollActionRef.current;

    if (
      pendingMobileScrollAction === "detailTop" &&
      mobilePane === "detail"
    ) {
      scrollElementToChildTop(viewRef.current);
      pendingMobileScrollActionRef.current = undefined;
      return;
    }

    if (
      pendingMobileScrollAction === "listRestore" &&
      mobilePane === "list"
    ) {
      scrollElementToTop(
        viewRef.current,
        savedListScrollTopRef.current,
      );
      pendingMobileScrollActionRef.current = undefined;
    }
  }, [mobilePane]);

  useLayoutEffect(() => {
    const pendingFilterScrollAction =
      pendingFilterScrollActionRef.current;

    if (
      pendingFilterScrollAction === "filterTop" &&
      openFilterKey
    ) {
      scrollFilterOptionsToTop(filterOptionsRef.current, viewRef.current);
      pendingFilterScrollActionRef.current = undefined;
      return;
    }

    if (
      pendingFilterScrollAction === "listRestore" &&
      !openFilterKey
    ) {
      restoreItemListScrollTop(
        itemListRef.current,
        viewRef.current,
        savedFilterListScrollTopRef.current,
      );
      pendingFilterScrollActionRef.current = undefined;
    }
  }, [openFilterKey]);

  function toggleFilter(filterKey: FilterControlKey) {
    if (openFilterKey === filterKey) {
      pendingFilterScrollActionRef.current = "listRestore";
      setOpenFilterKey(undefined);
      return;
    }

    if (!openFilterKey) {
      savedFilterListScrollTopRef.current = getItemListScrollTop(
        itemListRef.current,
        viewRef.current,
      );
    }

    pendingFilterScrollActionRef.current = "filterTop";
    setOpenFilterKey(filterKey);
  }

  function closeFilterOptions() {
    pendingFilterScrollActionRef.current = "listRestore";
    setOpenFilterKey(undefined);
  }

  function applyFilter(filterKey: FilterControlKey, value: string) {
    onFilterChange(createFilterUpdate(filterKey, value));
    closeFilterOptions();
  }

  function selectItem(item: ExplorerItem) {
    if (isMobileExplorerLayout()) {
      savedListScrollTopRef.current = getScrollElementScrollTop(
        viewRef.current,
      );
      pendingMobileScrollActionRef.current = "detailTop";
    }

    onSelectItem(item);
    setMobilePane("detail");
  }

  function showItemList() {
    if (isMobileExplorerLayout()) {
      pendingMobileScrollActionRef.current = "listRestore";
    }

    setMobilePane("list");
  }

  function toggleJsonPreview(filename: string) {
    if (jsonPreview.status === "loaded") {
      jsonReferenceAbortControllerRef.current?.abort();
      setJsonPreview({ status: "idle" });
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current?.abort();
    jsonReferenceAbortControllerRef.current?.abort();
    abortControllerRef.current = abortController;
    setJsonPreview({ status: "loading" });

    let dataminedFileUrl;

    try {
      dataminedFileUrl = getDataminedFileUrl(filename);
    } catch (fetchError) {
      setJsonPreview({
        message: getJsonErrorMessage(fetchError),
        status: "error",
      });
      return;
    }

    void fetchJson(dataminedFileUrl, abortController.signal)
      .then((value) => {
        if (!abortController.signal.aborted) {
          setJsonPreview({
            status: "loaded",
            value,
          });
        }
      })
      .catch((fetchError) => {
        if (!abortController.signal.aborted) {
          setJsonPreview({
            message: getJsonErrorMessage(fetchError),
            status: "error",
          });
        }
      });
  }

  function resolveJsonReference(path: JsonPath, targetFileName: string) {
    const abortController = new AbortController();
    jsonReferenceAbortControllerRef.current?.abort();
    jsonReferenceAbortControllerRef.current = abortController;

    setJsonPreview((currentPreview) =>
      currentPreview.status === "loaded"
        ? {
            ...currentPreview,
            loadingReferencePath: path,
            referenceError: undefined,
          }
        : currentPreview
    );

    let dataminedFileUrl;

    try {
      dataminedFileUrl = getDataminedFileUrl(targetFileName);
    } catch (fetchError) {
      setJsonPreview((currentPreview) =>
        currentPreview.status === "loaded"
          ? {
              ...currentPreview,
              loadingReferencePath: undefined,
              referenceError: {
                message: getJsonErrorMessage(fetchError),
                path,
              },
            }
          : currentPreview
      );
      return;
    }

    void fetchJson(dataminedFileUrl, abortController.signal)
      .then((value) => {
        if (abortController.signal.aborted) {
          return;
        }

        setJsonPreview((currentPreview) =>
          currentPreview.status === "loaded"
            ? {
                ...currentPreview,
                loadingReferencePath: undefined,
                referenceError: undefined,
                value: replaceJsonValueAtPath(
                  currentPreview.value,
                  path,
                  value,
                ),
              }
            : currentPreview
        );
      })
      .catch((fetchError) => {
        if (abortController.signal.aborted) {
          return;
        }

        setJsonPreview((currentPreview) =>
          currentPreview.status === "loaded"
            ? {
                ...currentPreview,
                loadingReferencePath: undefined,
                referenceError: {
                  message: getJsonErrorMessage(fetchError),
                  path,
                },
              }
            : currentPreview
        );
      });
  }

  if (isLoading) {
    return <DatabaseSkeleton />;
  }

  return (
    <Layout viewRef={viewRef} isListPaneVisible={isListPaneVisible}>
      {error && (
        <StatePanel
          actionLabel="Retry"
          label={error}
          onAction={onRetry}
        />
      )}
      {!error && (
        <>
          <section
            data-database-results-pane
            className={classNames(styles.ViewResultsPane, {
              [styles.ViewResultsPaneMobileHidden]: !isListPaneVisible,
            })}
          >
            <ItemList
              filterControls={filterControls}
              filterOptionsRef={filterOptionsRef}
              headerAction={createItemAction}
              items={filteredItems}
              listRef={itemListRef}
              onApplyFilter={applyFilter}
              onSelectItem={selectItem}
              onSortModeChange={onSortModeChange}
              onToggleFilter={toggleFilter}
              openFilterKey={openFilterKey}
              selectedItem={selectedItem}
              shouldScrollToSelected={shouldSyncSelectedListScroll}
              sortMode={sortMode}
              totalCount={totalCount}
            />
          </section>
          <section
            className={classNames(styles.ViewItemPane, {
              [styles.ViewItemPaneMobileHidden]: !isDetailPaneVisible,
            })}
          >
            <ItemView
              canEditCatalog={canEditCatalog}
              collectionReferences={collectionReferences}
              isEditMode={isEditMode}
              item={selectedItem}
              itemTypes={itemTypes}
              jsonPreview={jsonPreview}
              onBackToList={showItemList}
              onRefreshItems={onRefreshItems}
              onResolveJsonReference={resolveJsonReference}
              onToggleJsonPreview={toggleJsonPreview}
            />
          </section>
        </>
      )}
    </Layout>
  );
}

function createFilterControls({
  classOptions,
  filters,
  itemTypeOptions,
  magicTypeOptions,
}: {
  classOptions: FilterOption[];
  filters: Filters;
  itemTypeOptions: FilterOption[];
  magicTypeOptions: FilterOption[];
}): FilterControlConfig[] {
  return [
    {
      key: "itemTypeId",
      label: "Item Type",
      options: itemTypeOptions,
      value: filters.itemTypeId,
    },
    {
      key: "magicType",
      label: "Item Quality",
      options: magicTypeOptions,
      value: filters.magicType,
    },
    {
      key: "characterClass",
      label: "Class",
      options: classOptions,
      value: filters.characterClass,
    },
  ];
}

function createFilterUpdate(
  filterKey: FilterControlKey,
  value: string,
): Partial<Filters> {
  switch (filterKey) {
    case "characterClass":
      return { characterClass: value };
    case "itemTypeId":
      return { itemTypeId: value };
    case "magicType":
      return { magicType: value };
  }
}

function StatePanel({
  actionLabel,
  label,
  onAction,
}: {
  actionLabel?: string;
  label: string;
  onAction?: () => void;
}) {
  return (
    <Card className={styles.ViewStatePanel}>
      <div>{label}</div>
      {actionLabel && onAction && (
        <button
          className={styles.ViewPrimaryAction}
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </Card>
  );
}

function isMobileExplorerLayout(): boolean {
  return typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    !window.matchMedia("(min-width: 1200px)").matches;
}

function scrollFilterOptionsToTop(
  filterOptionsElement: HTMLElement | null,
  viewElement: HTMLElement | null,
) {
  if (filterOptionsElement) {
    filterOptionsElement.scrollTop = 0;
  }

  if (isMobileExplorerLayout()) {
    scrollElementToChildTop(viewElement);
  }
}

function getItemListScrollTop(
  listElement: HTMLElement | null,
  fallbackElement: HTMLElement | null,
): number {
  return getItemListScrollElement(listElement, fallbackElement)?.scrollTop ?? 0;
}

function restoreItemListScrollTop(
  listElement: HTMLElement | null,
  fallbackElement: HTMLElement | null,
  scrollTop: number,
) {
  const scrollElement = getItemListScrollElement(
    listElement,
    fallbackElement,
  );

  if (scrollElement) {
    scrollElement.scrollTop = scrollTop;
  }
}

function getItemListScrollElement(
  listElement: HTMLElement | null,
  fallbackElement: HTMLElement | null,
): HTMLElement | undefined {
  if (listElement) {
    return getScrollableAncestor(listElement);
  }

  return fallbackElement ? getScrollableAncestor(fallbackElement) : undefined;
}

function scrollElementToChildTop(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  const scrollElement = getScrollableAncestor(element);
  scrollElement.scrollTop = getElementScrollMargin(element, scrollElement);
}

function scrollElementToTop(
  element: HTMLElement | null,
  scrollTop: number,
) {
  if (!element) {
    return;
  }

  getScrollableAncestor(element).scrollTop = scrollTop;
}

function getScrollElementScrollTop(element: HTMLElement | null): number {
  if (!element) {
    return 0;
  }

  return getScrollableAncestor(element).scrollTop;
}

function getScrollableAncestor(element: HTMLElement): HTMLElement {
  let currentElement: HTMLElement | null = element;

  while (currentElement) {
    if (isVerticalScrollContainer(currentElement)) {
      return currentElement;
    }

    currentElement = currentElement.parentElement;
  }

  return element;
}

function isVerticalScrollContainer(element: HTMLElement): boolean {
  const overflowY = window.getComputedStyle(element).overflowY;

  return overflowY === "auto" || overflowY === "scroll";
}

function getElementScrollMargin(
  element: HTMLElement,
  scrollElement: HTMLElement,
): number {
  if (element === scrollElement) {
    return 0;
  }

  const elementRect = element.getBoundingClientRect();
  const scrollElementRect = scrollElement.getBoundingClientRect();

  return Math.max(
    0,
    elementRect.top - scrollElementRect.top + scrollElement.scrollTop,
  );
}

export { View };
