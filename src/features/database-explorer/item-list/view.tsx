import { useVirtualizer } from "@tanstack/react-virtual";
import classNames from "classnames";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { ItemQuality } from "../../../services/data";
import styles from "./view.module.css";

type ItemListItem = {
  item: {
    id: number;
    itemQuality?: number;
    name: string;
  };
  itemTypeName: string;
  source: string;
};

type Props<TItem extends ItemListItem> = {
  filterControls: FilterControlConfig[];
  filterOptionsRef: RefObject<HTMLDivElement | null>;
  headerAction?: ReactNode;
  items: TItem[];
  listRef: RefObject<HTMLDivElement | null>;
  onApplyFilter: (filterKey: FilterControlKey, value: string) => void;
  onSelectItem: (item: TItem) => void;
  onSortModeChange: (sortMode: SortMode) => void;
  onToggleFilter: (filterKey: FilterControlKey) => void;
  openFilterKey?: FilterControlKey;
  selectedItem?: TItem;
  shouldScrollToSelected: boolean;
  sortMode: SortMode;
  totalCount: number;
};

type FilterControlKey = "characterClass" | "itemTypeId" | "itemQuality";
type SortMode = "nameAsc" | "nameDesc" | "none";

type FilterOption = {
  label: string;
  value: string;
};

type FilterControlConfig = {
  key: FilterControlKey;
  label: string;
  options: FilterOption[];
  value: string;
};

type HeaderProps = {
  action?: ReactNode;
  onSortModeChange: (sortMode: SortMode) => void;
  sortMode: SortMode;
};

type FiltersProps = {
  filterControls: FilterControlConfig[];
  onToggleFilter: (filterKey: FilterControlKey) => void;
  openFilterKey?: FilterControlKey;
};

type FilterOptionsPanelProps = {
  filter: FilterControlConfig;
  filterOptionsRef: RefObject<HTMLDivElement | null>;
  onApplyFilter: (filterKey: FilterControlKey, value: string) => void;
};

type ResultsProps<TItem extends ItemListItem> = {
  items: TItem[];
  listRef: RefObject<HTMLDivElement | null>;
  onSelectItem: (item: TItem) => void;
  selectedItem?: TItem;
  shouldScrollToSelected: boolean;
};

type RowProps<TItem extends ItemListItem> = {
  isSelected: boolean;
  item: TItem;
  onSelectItem: (item: TItem) => void;
  style: CSSProperties;
};

const ALL_OPTION_VALUE = "all";
const itemQualityClassMap = new Map<ItemQuality, string>([
  [ItemQuality.TRANSMOG, styles.ViewItemQualityTransmog],
  [ItemQuality.JUNK, styles.ViewItemQualityJunk],
  [ItemQuality.COMMON, styles.ViewItemQualityCommon],
  [ItemQuality.MAGIC, styles.ViewItemQualityMagic],
  [ItemQuality.LEGENDARY, styles.ViewItemQualityLegendary],
  [ItemQuality.UNIQUE, styles.ViewItemQualityUnique],
  [ItemQuality.MYTHIC, styles.ViewItemQualityMythic],
  [ItemQuality.ICONIC_MYTHIC, styles.ViewItemQualityMythic],
  [ItemQuality.RARE, styles.ViewItemQualityRare],
]);

const ITEM_LIST_INITIAL_HEIGHT = 680;
const ITEM_LIST_OVERSCAN = 8;
const ITEM_LIST_ROW_HEIGHT = 68;

function ItemList<TItem extends ItemListItem>({
  filterControls,
  filterOptionsRef,
  headerAction,
  items,
  listRef,
  onApplyFilter,
  onSelectItem,
  onSortModeChange,
  onToggleFilter,
  openFilterKey,
  selectedItem,
  shouldScrollToSelected,
  sortMode,
  totalCount,
}: Props<TItem>) {
  const openFilter = filterControls.find(
    (control) => control.key === openFilterKey,
  );

  return (
    <div className={styles.View}>
      <div className={styles.ViewStickyControls}>
        <Header
          action={headerAction}
          onSortModeChange={onSortModeChange}
          sortMode={sortMode}
        />
        <Filters
          filterControls={filterControls}
          onToggleFilter={onToggleFilter}
          openFilterKey={openFilterKey}
        />
      </div>
      {openFilter ? (
        <FilterOptionsPanel
          filter={openFilter}
          filterOptionsRef={filterOptionsRef}
          onApplyFilter={onApplyFilter}
        />
      ) : (
        <Results
          items={items}
          listRef={listRef}
          onSelectItem={onSelectItem}
          selectedItem={selectedItem}
          shouldScrollToSelected={shouldScrollToSelected}
        />
      )}
      <section className={styles.ViewStats}>
        <span className={styles.ViewStatsResults}>
          {items.length.toLocaleString()} results
        </span>
        <span className={styles.ViewStatsIndexed}>
          {totalCount.toLocaleString()} indexed
        </span>
      </section>
    </div>
  );
}

function Header({
  action,
  onSortModeChange,
  sortMode,
}: HeaderProps) {
  const isNameSortActive = sortMode !== "none";
  const nextNameSortMode = getNextNameSortMode(sortMode);

  return (
    <header className={styles.ViewListHeader}>
      <h2 className={styles.ViewListTitle}>Database Explorer</h2>
      <div className={styles.ViewListHeaderActions}>
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
            Sort <span aria-hidden="true">{getNameSortGlyph(sortMode)}</span>
          </button>
        </div>
        {action}
      </div>
    </header>
  );
}

function Filters({
  filterControls,
  onToggleFilter,
  openFilterKey,
}: FiltersProps) {
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
      data-database-filter-options
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

function Results<TItem extends ItemListItem>({
  items,
  listRef,
  onSelectItem,
  selectedItem,
  shouldScrollToSelected,
}: ResultsProps<TItem>) {
  const [scrollMargin, setScrollMargin] = useState(0);
  const selectedKey = selectedItem ? getItemKey(selectedItem) : "";
  const itemIndexByKey = useMemo(
    () =>
      items.reduce((lookup, item, index) => {
        lookup.set(getItemKey(item), index);

        return lookup;
      }, new Map<string, number>()),
    [items],
  );
  const selectedIndex = selectedKey
    ? itemIndexByKey.get(selectedKey) ?? -1
    : -1;
  const getVirtualItemKey = useCallback(
    (index: number) => getItemKey(items[index]),
    [items],
  );
  const getScrollElement = useCallback(() => {
    const listElement = listRef.current;

    return listElement ? getScrollableAncestor(listElement) : null;
  }, [listRef]);
  const updateScrollMargin = useCallback(() => {
    const listElement = listRef.current;

    if (!listElement) {
      setScrollMargin(0);
      return;
    }

    const scrollElement = getScrollableAncestor(listElement);
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
      ? getScrollableAncestor(listElement)
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
  }, [items.length, listRef, updateScrollMargin]);

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
        data-database-list
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
      data-database-list
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
          const itemKey = getItemKey(item);

          return (
            <Row
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

function Row<TItem extends ItemListItem>({
  isSelected,
  item,
  onSelectItem,
  style,
}: RowProps<TItem>) {
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
            itemQualityClassMap.get(item.item.itemQuality as ItemQuality),
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

function getItemKey(item: ItemListItem): string {
  return `${item.source}:${item.item.id}`;
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
      return "\u2191";
    case "nameDesc":
      return "\u2193";
    case "none":
      return "\u2195";
  }
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

export { ItemList };
export type {
  FilterControlConfig,
  FilterControlKey,
  ItemListItem,
  SortMode,
};
