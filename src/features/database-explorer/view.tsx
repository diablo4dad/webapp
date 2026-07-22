import { useVirtualizer } from "@tanstack/react-virtual";
import classNames from "classnames";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
  type ReactNode,
} from "react";
import { CharacterClass, MagicType, type ItemRef } from "../../services/data";
import { getIcon } from "../../services/bucket";
import { DATA_REPO } from "../../config";
import i18n from "../../services/i18n";
import Card from "../../shared/ui/Card";
import { ChevronLeft } from "../../shared/ui/Icons";
import { FallbackLazyImage } from "../../shared/ui/LazyLoadImageFallback";
import { classIconMap } from "../../shared/domain/item-assets";
import { fetchFormattedJson, getJsonErrorMessage } from "./json";
import {
  ALL_OPTION_VALUE,
  getAvailableClasses,
  getExplorerItemKey,
  getItemIconPath,
  getMagicTypeLabel,
  getZoneLabel,
  hasInventoryImages,
  type ExplorerItem,
  type FilterOption,
  type Filters,
  type SortMode,
} from "./state";
import styles from "./view.module.css";

type Props = {
  classOptions: FilterOption[];
  error?: string;
  filteredItems: ExplorerItem[];
  filters: Filters;
  isLoading: boolean;
  itemTypeOptions: FilterOption[];
  magicTypeOptions: FilterOption[];
  onFilterChange: (filters: Partial<Filters>) => void;
  onRetry: () => void;
  onSelectItem: (item: ExplorerItem) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  selectedItem?: ExplorerItem;
  showSelectedItemInitially?: boolean;
  sortMode: SortMode;
  totalCount: number;
};

type ItemListProps = {
  items: ExplorerItem[];
  listRef: RefObject<HTMLDivElement | null>;
  onSelectItem: (item: ExplorerItem) => void;
  selectedItem?: ExplorerItem;
  shouldScrollToSelected: boolean;
};

type ItemListHeaderProps = {
  onSortModeChange: (sortMode: SortMode) => void;
  sortMode: SortMode;
};

type ItemListFiltersProps = {
  filterControls: FilterControlConfig[];
  onToggleFilter: (filterKey: FilterControlKey) => void;
  openFilterKey?: FilterControlKey;
};

type FilterOptionsPanelProps = {
  filter: FilterControlConfig;
  filterOptionsRef: RefObject<HTMLDivElement | null>;
  onApplyFilter: (filterKey: FilterControlKey, value: string) => void;
};

type ItemListRowProps = {
  isSelected: boolean;
  item: ExplorerItem;
  onSelectItem: (item: ExplorerItem) => void;
  style: CSSProperties;
};

type ItemDetailProps = {
  item?: ExplorerItem;
  onBackToList: () => void;
};

type JsonPreviewState =
  | {
      status: "error";
      message: string;
    }
  | {
      status: "idle";
    }
  | {
      status: "loaded";
      formattedJson: string;
    }
  | {
      status: "loading";
    };

type FilterControlKey = "characterClass" | "itemTypeId" | "magicType";
type FilterScrollAction = "filterTop" | "listRestore";
type MobilePane = "detail" | "list";
type MobileScrollAction = "detailTop" | "listRestore";

type FilterControlConfig = {
  key: FilterControlKey;
  label: string;
  options: FilterOption[];
  value: string;
};

const magicTypeClassMap = new Map<MagicType, string>([
  [MagicType.COMMON, styles.ViewMagicTypeCommon],
  [MagicType.MAGIC, styles.ViewMagicTypeMagic],
  [MagicType.LEGENDARY, styles.ViewMagicTypeLegendary],
  [MagicType.UNIQUE, styles.ViewMagicTypeUnique],
  [MagicType.MYTHIC, styles.ViewMagicTypeMythic],
  [MagicType.RARE, styles.ViewMagicTypeRare],
]);

const ITEM_LIST_INITIAL_HEIGHT = 680;
const ITEM_LIST_OVERSCAN = 8;
const ITEM_LIST_ROW_HEIGHT = 68;

function View({
  classOptions,
  error,
  filteredItems,
  filters,
  isLoading,
  itemTypeOptions,
  magicTypeOptions,
  onFilterChange,
  onRetry,
  onSelectItem,
  onSortModeChange,
  selectedItem,
  showSelectedItemInitially = false,
  sortMode,
  totalCount,
}: Props) {
  const viewRef = useRef<HTMLElement>(null);
  const filterOptionsRef = useRef<HTMLDivElement>(null);
  const itemListRef = useRef<HTMLDivElement>(null);
  const savedFilterListScrollTopRef = useRef(0);
  const savedListScrollTopRef = useRef(0);
  const pendingFilterScrollActionRef = useRef<
    FilterScrollAction | undefined
  >(undefined);
  const pendingMobileScrollActionRef = useRef<
    MobileScrollAction | undefined
  >(undefined);
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
  const openFilter = filterControls.find(
    (control) => control.key === openFilterKey,
  );
  const isListPaneVisible = mobilePane === "list";
  const isDetailPaneVisible = mobilePane === "detail";
  const shouldSyncSelectedListScroll = !isMobileExplorerLayout();

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

  return (
    <main ref={viewRef} className={styles.View}>
      <section
        className={classNames(styles.ViewBody, {
          [styles.ViewBodyListMode]: isListPaneVisible,
        })}
      >
        {isLoading && <StatePanel label="Loading database" />}
        {error && (
          <StatePanel
            actionLabel="Retry"
            label={error}
            onAction={onRetry}
          />
        )}
        {!isLoading && !error && (
          <>
            <section
              className={classNames(styles.ViewResultsPane, {
                [styles.ViewResultsPaneMobileHidden]: !isListPaneVisible,
              })}
            >
              <div className={styles.ViewResultsCard}>
                <div className={styles.ViewListStickyControls}>
                  <ItemListHeader
                    onSortModeChange={onSortModeChange}
                    sortMode={sortMode}
                  />
                  <ItemListFilters
                    filterControls={filterControls}
                    onToggleFilter={toggleFilter}
                    openFilterKey={openFilterKey}
                  />
                </div>
                {openFilter ? (
                  <FilterOptionsPanel
                    filter={openFilter}
                    filterOptionsRef={filterOptionsRef}
                    onApplyFilter={applyFilter}
                  />
                ) : (
                  <ItemList
                    items={filteredItems}
                    listRef={itemListRef}
                    onSelectItem={selectItem}
                    selectedItem={selectedItem}
                    shouldScrollToSelected={shouldSyncSelectedListScroll}
                  />
                )}
                <section className={styles.ViewStats}>
                  <span className={styles.ViewStatsResults}>
                    {filteredItems.length.toLocaleString()} results
                  </span>
                  <span className={styles.ViewStatsIndexed}>
                    {totalCount.toLocaleString()} indexed
                  </span>
                </section>
              </div>
            </section>
            <section
              className={classNames(styles.ViewItemPane, {
                [styles.ViewItemPaneMobileHidden]: !isDetailPaneVisible,
              })}
            >
              <ItemDetail item={selectedItem} onBackToList={showItemList} />
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function ItemListHeader({
  onSortModeChange,
  sortMode,
}: ItemListHeaderProps) {
  const isNameSortActive = sortMode !== "none";
  const nextNameSortMode = getNextNameSortMode(sortMode);

  return (
    <header className={styles.ViewListHeader}>
      <h2 className={styles.ViewListTitle}>Database Explorer</h2>
      <div
        className={styles.ViewListSortControls}
        role="group"
        aria-label="Sort results"
      >
        <button
          aria-pressed={isNameSortActive}
          className={classNames(styles.ViewListSortButton, {
            [styles.ViewListSortButtonActive]: isNameSortActive,
          })}
          type="button"
          onClick={() => onSortModeChange(nextNameSortMode)}
        >
          Name <span aria-hidden="true">{getNameSortGlyph(sortMode)}</span>
        </button>
      </div>
    </header>
  );
}

function ItemListFilters({
  filterControls,
  onToggleFilter,
  openFilterKey,
}: ItemListFiltersProps) {
  return (
    <section
      className={styles.ViewFilterControls}
      role="region"
      aria-label="Database filters"
    >
      <div className={styles.ViewFilterControlList}>
        {filterControls.map((control) => {
          const isActive = control.value !== ALL_OPTION_VALUE;
          const isOpen = control.key === openFilterKey;
          const valueLabel = getFilterControlValueLabel(control);

          return (
            <button
              key={control.key}
              aria-controls={
                isOpen ? `database-filter-options-${control.key}` : undefined
              }
              aria-expanded={isOpen}
              aria-label={`${control.label}: ${valueLabel}`}
              className={classNames(styles.ViewFilterControl, {
                [styles.ViewFilterControlActive]: isActive,
                [styles.ViewFilterControlOpen]: isOpen,
              })}
              type="button"
              onClick={() => onToggleFilter(control.key)}
            >
              <span className={styles.ViewFilterControlLabel}>
                {control.label}
              </span>
              <span className={styles.ViewFilterControlValue}>
                {valueLabel}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FilterOptionsPanel({
  filter,
  filterOptionsRef,
  onApplyFilter,
}: FilterOptionsPanelProps) {
  return (
    <div
      ref={filterOptionsRef}
      id={`database-filter-options-${filter.key}`}
      className={styles.ViewFilterOptions}
      role="region"
      aria-label={`${filter.label} filter options`}
    >
      <div className={styles.ViewFilterOptionsHeader}>
        {getFilterInstructionLabel(filter)}
      </div>
      <div className={styles.ViewFilterOptionList}>
        {filter.options.map((option) => {
          const isSelected = option.value === filter.value;
          const label = getFilterOptionLabel(option);

          return (
            <button
              key={option.value}
              aria-pressed={isSelected}
              className={classNames(styles.ViewFilterOption, {
                [styles.ViewFilterOptionSelected]: isSelected,
              })}
              type="button"
              onClick={() => onApplyFilter(filter.key, option.value)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
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

function getFilterControlValueLabel(control: FilterControlConfig): string {
  if (control.value === ALL_OPTION_VALUE) {
    return "Show all";
  }

  return (
    control.options.find((option) => option.value === control.value)?.label ??
    control.value
  );
}

function getFilterOptionLabel(option: FilterOption): string {
  return option.value === ALL_OPTION_VALUE ? "Show all" : option.label;
}

function getFilterInstructionLabel(filter: FilterControlConfig): string {
  return `Choose ${filter.label} to Show`;
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

function getNextNameSortMode(sortMode: SortMode): SortMode {
  switch (sortMode) {
    case "nameAsc":
      return "nameDesc";
    case "nameDesc":
      return "none";
    case "none":
      return "nameAsc";
  }
}

function getNameSortGlyph(sortMode: SortMode): string {
  switch (sortMode) {
    case "nameAsc":
      return "↑";
    case "nameDesc":
      return "↓";
    case "none":
      return "↕";
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

function ItemList({
  items,
  listRef,
  onSelectItem,
  selectedItem,
  shouldScrollToSelected,
}: ItemListProps) {
  const [scrollMargin, setScrollMargin] = useState(0);
  const selectedKey = selectedItem ? getExplorerItemKey(selectedItem) : "";
  const itemIndexByKey = useMemo(
    () =>
      items.reduce((lookup, item, index) => {
        lookup.set(getExplorerItemKey(item), index);

        return lookup;
      }, new Map<string, number>()),
    [items],
  );
  const selectedIndex = selectedKey
    ? itemIndexByKey.get(selectedKey) ?? -1
    : -1;
  const getVirtualItemKey = useCallback(
    (index: number) => getExplorerItemKey(items[index]),
    [items],
  );
  const getScrollElement = useCallback(() => {
    const listElement = listRef.current;

    return listElement ? getVirtualizerScrollElement(listElement) : null;
  }, [listRef]);
  const updateScrollMargin = useCallback(() => {
    const listElement = listRef.current;

    if (!listElement) {
      setScrollMargin(0);
      return;
    }

    const scrollElement = getVirtualizerScrollElement(listElement);
    setScrollMargin(getElementScrollMargin(listElement, scrollElement));
  }, [listRef]);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    estimateSize: () => ITEM_LIST_ROW_HEIGHT,
    getItemKey: getVirtualItemKey,
    getScrollElement,
    initialRect: {
      height: ITEM_LIST_INITIAL_HEIGHT,
      width: 0,
    },
    overscan: ITEM_LIST_OVERSCAN,
    scrollMargin,
  });

  useLayoutEffect(() => {
    updateScrollMargin();

    const listElement = listRef.current;
    const scrollElement = listElement
      ? getVirtualizerScrollElement(listElement)
      : undefined;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScrollMargin)
        : undefined;

    if (listElement) {
      resizeObserver?.observe(listElement);
    }

    if (scrollElement && scrollElement !== listElement) {
      resizeObserver?.observe(scrollElement);
    }

    window.addEventListener("resize", updateScrollMargin);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollMargin);
    };
  }, [items.length, updateScrollMargin]);

  useEffect(() => {
    if (shouldScrollToSelected && selectedIndex >= 0) {
      rowVirtualizer.scrollToIndex(selectedIndex, {
        align: "auto",
      });
    }
  }, [
    rowVirtualizer,
    scrollMargin,
    selectedIndex,
    shouldScrollToSelected,
  ]);

  if (items.length === 0) {
    return (
      <div
        ref={listRef}
        className={styles.ViewList}
        aria-label="Database item results"
      >
        <div className={styles.ViewEmptyList}>No items found.</div>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className={styles.ViewList}
      aria-label="Database item results"
    >
      <div
        className={styles.ViewListVirtualItems}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          const itemKey = getExplorerItemKey(item);

          return (
            <ItemListRow
              key={virtualItem.key}
              isSelected={itemKey === selectedKey}
              item={item}
              onSelectItem={onSelectItem}
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${
                  virtualItem.start - scrollMargin
                }px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const ItemListRow = memo(function ItemListRow({
  isSelected,
  item,
  onSelectItem,
  style,
}: ItemListRowProps) {
  const handleClick = useCallback(() => {
    onSelectItem(item);
  }, [item, onSelectItem]);

  return (
    <button
      className={classNames(styles.ViewListItem, {
        [styles.ViewListItemSelected]: isSelected,
      })}
      style={style}
      type="button"
      onClick={handleClick}
    >
      <span className={styles.ViewListItemBody}>
        <span
          className={classNames(
            styles.ViewListItemName,
            magicTypeClassMap.get(item.item.magicType as MagicType),
          )}
        >
          {item.item.name}
        </span>
        <span className={styles.ViewListItemMeta}>
          {item.itemTypeName} | {item.item.id}
        </span>
      </span>
    </button>
  );
});

function ItemDetail({ item, onBackToList }: ItemDetailProps) {
  if (!item) {
    return (
      <div className={styles.ViewDetail}>
        <MobileBackButton onBackToList={onBackToList} />
        <Card className={styles.ViewDetailCard}>
          <div className={styles.ViewEmptyDetail}>Select an item.</div>
        </Card>
      </div>
    );
  }

  const rawItem = item.item;

  return (
    <article className={styles.ViewDetail}>
      <MobileBackButton onBackToList={onBackToList} />
      <Card className={styles.ViewDetailCard}>
        <header className={styles.ViewDetailHeader}>
          <FallbackLazyImage
            className={styles.ViewDetailIcon}
            src={getIcon(getItemIconPath(rawItem.icon))}
            alt=""
          />
          <div className={styles.ViewDetailHeading}>
            <Field label="Name" value={rawItem.name} />
            <Field label="Item ID" value={rawItem.id} />
            <Field
              label="Item Type"
              value={`${item.itemTypeName} (${rawItem.itemType})`}
            />
          </div>
          <div className={styles.ViewDetailMetaColumn}>
            {rawItem.series && (
              <Field
                label="Series"
                value={rawItem.series.replaceAll('"', "")}
              />
            )}
            {rawItem.description && (
              <Field label="Description" value={rawItem.description} />
            )}
            {rawItem.transmogName && (
              <Field label="Transmog Name" value={rawItem.transmogName} />
            )}
            <Field
              label="Item Quality"
              value={<MagicTypeText magicType={rawItem.magicType} />}
            />
            <Field
              label="Preferred Zone"
              value={getZoneLabel(rawItem.preferredZone)}
            />
          </div>
        </header>
      </Card>
      <Card className={styles.ViewDetailCard}>
        <section className={styles.ViewDetailSection}>
          <h3>Usable by Classes</h3>
          <ClassIconList item={rawItem} />
        </section>
      </Card>
      {hasInventoryImages(rawItem) && (
        <Card className={styles.ViewDetailCard}>
          <section className={styles.ViewDetailSection}>
            <h3>Inventory Images</h3>
            <InventoryImageGrid item={rawItem} />
          </section>
        </Card>
      )}
      {rawItem.filename && (
        <DataminedFileCard filename={rawItem.filename} />
      )}
    </article>
  );
}

function MobileBackButton({ onBackToList }: { onBackToList: () => void }) {
  return (
    <button
      aria-label="Back to item list"
      className={styles.ViewMobileBackButton}
      type="button"
      onClick={onBackToList}
    >
      <ChevronLeft />
      <span>Item List</span>
    </button>
  );
}

function DataminedFileCard({ filename }: { filename: string }) {
  const [jsonPreview, setJsonPreview] = useState<JsonPreviewState>({
    status: "idle",
  });
  const abortControllerRef = useRef<AbortController | undefined>(undefined);
  const fileUrl = getDataminedFileUrl(filename);

  useEffect(() => {
    abortControllerRef.current?.abort();
    setJsonPreview({ status: "idle" });
  }, [fileUrl]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  function onToggleJsonPreview() {
    if (jsonPreview.status === "loaded") {
      setJsonPreview({ status: "idle" });
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current?.abort();
    abortControllerRef.current = abortController;
    setJsonPreview({ status: "loading" });

    void fetchFormattedJson(fileUrl, abortController.signal)
      .then((formattedJson) => {
        if (!abortController.signal.aborted) {
          setJsonPreview({
            formattedJson,
            status: "loaded",
          });
        }
      })
      .catch((error) => {
        if (!abortController.signal.aborted) {
          setJsonPreview({
            message: getJsonErrorMessage(error),
            status: "error",
          });
        }
      });
  }

  return (
    <Card className={styles.ViewDetailCard}>
      <section className={styles.ViewDetailSection}>
        <div className={styles.ViewDetailSectionHeader}>
          <h3>Datamined File</h3>
          <button
            aria-label={getJsonPreviewActionLabel(jsonPreview)}
            className={styles.ViewDetailAction}
            disabled={jsonPreview.status === "loading"}
            title={getJsonPreviewActionLabel(jsonPreview)}
            type="button"
            onClick={onToggleJsonPreview}
          >
            <span aria-hidden="true">
              {getJsonPreviewActionGlyph(jsonPreview)}
            </span>
          </button>
        </div>
        <span className={styles.ViewDataminedFileName}>
          {filename}
        </span>
        {jsonPreview.status === "loading" && (
          <div className={styles.ViewJsonStatus}>Loading JSON...</div>
        )}
        {jsonPreview.status === "error" && (
          <div className={styles.ViewJsonError} role="alert">
            {jsonPreview.message}
          </div>
        )}
        {jsonPreview.status === "loaded" && (
          <pre
            aria-label="Datamined file JSON"
            className={styles.ViewJsonPreview}
            tabIndex={0}
          >
            {jsonPreview.formattedJson}
          </pre>
        )}
      </section>
    </Card>
  );
}

function getDataminedFileUrl(filename: string): string {
  return `${DATA_REPO}/${filename}.json`;
}

function getJsonPreviewActionLabel(jsonPreview: JsonPreviewState): string {
  switch (jsonPreview.status) {
    case "error":
      return "Retry JSON";
    case "idle":
      return "Show JSON";
    case "loaded":
      return "Hide JSON";
    case "loading":
      return "Loading JSON";
  }
}

function getJsonPreviewActionGlyph(jsonPreview: JsonPreviewState): string {
  switch (jsonPreview.status) {
    case "error":
      return "↻";
    case "idle":
      return "▸";
    case "loaded":
      return "▾";
    case "loading":
      return "...";
  }
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.ViewField}>
      <div className={styles.ViewFieldLabel}>{label}</div>
      <div className={styles.ViewFieldValue}>{value}</div>
    </div>
  );
}

function MagicTypeText({ magicType }: { magicType?: number }) {
  return (
    <span
      className={classNames(
        styles.ViewMagicType,
        magicTypeClassMap.get(magicType as MagicType),
      )}
    >
      {getMagicTypeLabel(magicType)}
    </span>
  );
}

function ClassIconList({
  compact = false,
  item,
}: {
  compact?: boolean;
  item: ItemRef;
}) {
  const availableClasses = getAvailableClasses(item);

  if (availableClasses.length === 0) {
    return <span>None</span>;
  }

  return (
    <span
      className={classNames(styles.ViewClassList, {
        [styles.ViewClassListCompact]: compact,
      })}
    >
      {availableClasses.map((characterClass) => (
        <span
          key={characterClass}
          className={styles.ViewClassChip}
          title={i18n.characterClass[characterClass]}
        >
          <img
            className={styles.ViewClassIcon}
            src={classIconMap.get(characterClass)}
            alt={i18n.characterClass[characterClass]}
          />
          {!compact && <span>{i18n.characterClass[characterClass]}</span>}
        </span>
      ))}
    </span>
  );
}

function InventoryImageGrid({ item }: { item: ItemRef }) {
  const rows = (item.invImages ?? [])
    .map((images, index) => ({
      characterClass: index as CharacterClass,
      femaleIconId: images[1],
      maleIconId: images[0],
    }))
    .filter((row) => row.maleIconId > 0 || row.femaleIconId > 0);

  if (rows.length === 0) {
    return <span>None</span>;
  }

  return (
    <div className={styles.ViewInventoryGrid}>
      {rows.map((row) => (
        <div key={row.characterClass} className={styles.ViewInventoryRow}>
          <span className={styles.ViewInventoryClass}>
            {i18n.characterClass[row.characterClass] ??
              `Class ${row.characterClass}`}
          </span>
          <InventoryImage
            iconId={row.maleIconId}
            label="Male"
          />
          <InventoryImage
            iconId={row.femaleIconId}
            label="Female"
          />
        </div>
      ))}
    </div>
  );
}

function InventoryImage({
  iconId,
  label,
}: {
  iconId: number;
  label: string;
}) {
  if (iconId <= 0) {
    return <span className={styles.ViewInventoryMissing}>{label}: none</span>;
  }

  return (
    <span className={styles.ViewInventoryImage}>
      <FallbackLazyImage
        className={classNames(
          styles.ViewInlineIcon,
          styles.ViewInventoryInlineIcon,
        )}
        src={getIcon(getItemIconPath(iconId))}
        alt=""
      />
      {label}: {iconId}
    </span>
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
    return getVirtualizerScrollElement(listElement);
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

function getVirtualizerScrollElement(
  listElement: HTMLElement,
): HTMLElement {
  return getScrollableAncestor(listElement);
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
