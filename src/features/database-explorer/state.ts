import Fuse from "fuse.js";
import {
  CharacterClass,
  MagicType,
  Zone,
  type DadDbRef,
  type ItemRef,
  type ItemType,
} from "../../services/data";
import i18n from "../../services/i18n";
import {
  MAGIC_TYPE_NOT_SET,
  MAGIC_TYPE_NOT_SET_FILTER_VALUE,
  getMagicTypeSortRank,
  isMagicTypeNotSet,
} from "../../shared/domain/magic-types";
import { enumKeys } from "../../shared/lib/enums";

type ItemSource = "static" | "catalog";
type SourceFilter = "both" | ItemSource;
type SortMode = "nameAsc" | "nameDesc" | "none";
type FlagFilter =
  | "all"
  | "hasSimilarItems"
  | "hasVariants"
  | "isTransmog"
  | "lordOfHatred"
  | "salvageable"
  | "vesselOfHatred";

type Filters = {
  characterClass: string;
  flag: FlagFilter;
  itemTypeId: string;
  magicType: string;
  searchTerm: string;
  source: SourceFilter;
};

type ExplorerItem = {
  idText: string;
  item: ItemRef;
  itemType?: ItemType;
  itemTypeName: string;
  searchText: string;
  source: ItemSource;
};

type FilterOption = {
  label: string;
  value: string;
};

const ALL_OPTION_VALUE = "all";
const DEFAULT_FILTERS: Filters = {
  characterClass: ALL_OPTION_VALUE,
  flag: "all",
  itemTypeId: ALL_OPTION_VALUE,
  magicType: ALL_OPTION_VALUE,
  searchTerm: "",
  source: "both",
};
const DEFAULT_SORT_MODE: SortMode = "nameAsc";
const SOURCE_OPTIONS: FilterOption[] = [
  { label: "Both", value: "both" },
  { label: "Game data", value: "static" },
  { label: "Custom data", value: "catalog" },
];
const FLAG_OPTIONS: Array<FilterOption & { value: FlagFilter }> = [
  { label: "All", value: "all" },
  { label: "Transmog", value: "isTransmog" },
  { label: "Salvageable", value: "salvageable" },
  { label: "Vessel of Hatred", value: "vesselOfHatred" },
  { label: "Lord of Hatred", value: "lordOfHatred" },
  { label: "Icon variants", value: "hasVariants" },
  { label: "Similar items", value: "hasSimilarItems" },
];
const SEARCH_KEYS = [
  "idText",
  "item.name",
  "item.transmogName",
  "item.description",
  "item.series",
  "item.filename",
  "itemTypeName",
  "searchText",
];
const ITEM_NAME_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function createStaticExplorerItems(
  dadDbRef: Pick<DadDbRef, "items" | "itemTypes">,
): ExplorerItem[] {
  const itemTypes = new Map(dadDbRef.itemTypes.map((itemType) => [
    itemType.id,
    itemType,
  ]));

  return dadDbRef.items.map((item) => {
    const itemType = itemTypes.get(item.itemType);
    const itemTypeName = itemType?.name ?? "Missing item type";
    const idText = String(item.id);

    return {
      idText,
      item,
      itemType,
      itemTypeName,
      searchText: [
        idText,
        item.name,
        item.transmogName,
        item.description,
        item.series,
        item.filename,
        itemTypeName,
      ]
        .filter((value): value is string => typeof value === "string")
        .join(" "),
      source: "static",
    };
  });
}

function createSearchIndex(items: ExplorerItem[]): Fuse<ExplorerItem> {
  return new Fuse(items, {
    ignoreLocation: true,
    includeScore: false,
    keys: SEARCH_KEYS,
    threshold: 0.32,
  });
}

function filterExplorerItems(
  items: ExplorerItem[],
  filters: Filters,
  searchIndex = createSearchIndex(items),
): ExplorerItem[] {
  const searchTerm = filters.searchTerm.trim();
  const searchedItems =
    searchTerm.length === 0
      ? items
      : searchIndex.search(searchTerm).map((result) => result.item);

  return searchedItems.filter((explorerItem) =>
    matchesFilters(explorerItem, filters),
  );
}

function sortExplorerItems(
  items: ExplorerItem[],
  sortMode: SortMode,
): ExplorerItem[] {
  if (sortMode === "none") {
    return items;
  }

  return [...items].sort((a, b) => compareExplorerItems(a, b, sortMode));
}

function getExplorerItemKey(item: ExplorerItem): string {
  return `${item.source}:${item.item.id}`;
}

function getAvailableClasses(item: ItemRef): CharacterClass[] {
  if (item.usableByClass === undefined) {
    return enumKeys(CharacterClass).map(
      (characterClass) => CharacterClass[characterClass],
    );
  }

  return enumKeys(CharacterClass)
    .map((characterClass) => CharacterClass[characterClass])
    .filter((characterClass) => item.usableByClass?.[characterClass] === 1);
}

function getClassFilterOptions(): FilterOption[] {
  return [
    { label: "All classes", value: ALL_OPTION_VALUE },
    ...enumKeys(CharacterClass).map((characterClass) => {
      const value = CharacterClass[characterClass];

      return {
        label: i18n.characterClass[value],
        value: String(value),
      };
    }),
  ];
}

function getFlagFilterOptions(): FilterOption[] {
  return FLAG_OPTIONS;
}

function getItemTypeOptions(items: ExplorerItem[]): FilterOption[] {
  const options = new Map<string, FilterOption>();

  for (const item of items) {
    const value = String(item.item.itemType);
    options.set(value, {
      label: item.itemTypeName,
      value,
    });
  }

  return [
    { label: "All item types", value: ALL_OPTION_VALUE },
    ...Array.from(options.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    ),
  ];
}

function getMagicTypeOptions(items: ExplorerItem[]): FilterOption[] {
  const options = new Map<string, number>();

  for (const item of items) {
    const magicType = item.item.magicType;

    if (isMagicTypeNotSet(magicType)) {
      options.set(MAGIC_TYPE_NOT_SET_FILTER_VALUE, MAGIC_TYPE_NOT_SET);
    } else {
      options.set(String(magicType), magicType);
    }
  }

  return [
    { label: "All magic types", value: ALL_OPTION_VALUE },
    ...Array.from(options.entries())
      .map(([value, magicType]) => ({
        label: getMagicTypeLabel(magicType),
        sortRank: getMagicTypeSortRank(magicType),
        value,
      }))
      .sort(compareMagicTypeOptions)
      .map(({ label, value }) => ({
        label,
        value,
      })),
  ];
}

function getItemIconPath(iconId?: number): string {
  return `icons/${iconId && iconId > 0 ? iconId : 0}.webp`;
}

function getMagicTypeLabel(magicType?: number): string {
  if (isMagicTypeNotSet(magicType)) {
    return "Not Set";
  }

  return i18n.magicType[magicType as MagicType] ?? `Unknown (${magicType})`;
}

function getSourceLabel(source: ItemSource): string {
  return source === "catalog" ? "Custom data" : "Game data";
}

function getZoneLabel(zone?: number): string {
  if (zone === undefined || zone === -1) {
    return "Not set";
  }

  return i18n.region[zone as Zone] ?? `Unknown (${zone})`;
}

function hasInventoryImages(item: ItemRef): boolean {
  return (
    item.invImages?.some((genderImages) =>
      genderImages.some((iconId) => iconId > 0),
    ) ?? false
  );
}

function matchesFilters(
  explorerItem: ExplorerItem,
  filters: Filters,
): boolean {
  const item = explorerItem.item;

  if (filters.source !== "both" && explorerItem.source !== filters.source) {
    return false;
  }

  if (
    filters.itemTypeId !== ALL_OPTION_VALUE &&
    String(item.itemType) !== filters.itemTypeId
  ) {
    return false;
  }

  if (!matchesMagicTypeFilter(item, filters.magicType)) {
    return false;
  }

  if (
    filters.characterClass !== ALL_OPTION_VALUE &&
    !getAvailableClasses(item).includes(Number(filters.characterClass))
  ) {
    return false;
  }

  return matchesFlagFilter(item, filters.flag);
}

function matchesMagicTypeFilter(item: ItemRef, magicTypeFilter: string): boolean {
  if (magicTypeFilter === ALL_OPTION_VALUE) {
    return true;
  }

  if (magicTypeFilter === MAGIC_TYPE_NOT_SET_FILTER_VALUE) {
    return isMagicTypeNotSet(item.magicType);
  }

  return String(item.magicType) === magicTypeFilter;
}

function compareMagicTypeOptions(
  a: FilterOption & { sortRank: number },
  b: FilterOption & { sortRank: number },
): number {
  if (a.sortRank !== b.sortRank) {
    return a.sortRank - b.sortRank;
  }

  return a.label.localeCompare(b.label);
}

function matchesFlagFilter(item: ItemRef, flag: FlagFilter): boolean {
  switch (flag) {
    case "all":
      return true;
    case "hasSimilarItems":
      return (item.similarItems?.length ?? 0) > 0;
    case "hasVariants":
      return hasInventoryImages(item);
    case "isTransmog":
      return item.isTransmog === true;
    case "lordOfHatred":
      return item.lohItem === true;
    case "salvageable":
      return item.salvageable === true;
    case "vesselOfHatred":
      return item.vohItem === true;
  }
}

function compareExplorerItems(
  a: ExplorerItem,
  b: ExplorerItem,
  sortMode: SortMode,
): number {
  switch (sortMode) {
    case "nameAsc":
      return compareByName(a, b, "asc");
    case "nameDesc":
      return compareByName(a, b, "desc");
    case "none":
      return 0;
  }
}

function compareByName(
  a: ExplorerItem,
  b: ExplorerItem,
  direction: "asc" | "desc",
): number {
  const aNameRank = getNameSortRank(a.item.name);
  const bNameRank = getNameSortRank(b.item.name);

  if (aNameRank !== bNameRank) {
    return aNameRank - bNameRank;
  }

  if (aNameRank > 0) {
    return a.item.id - b.item.id;
  }

  const nameDelta =
    ITEM_NAME_COLLATOR.compare(a.item.name, b.item.name) *
    (direction === "asc" ? 1 : -1);

  return nameDelta === 0 ? a.item.id - b.item.id : nameDelta;
}

function getNameSortRank(name: string): number {
  const firstCharacter = name.trim().charAt(0).toLowerCase();

  return firstCharacter >= "a" && firstCharacter <= "z" ? 0 : 1;
}

export {
  ALL_OPTION_VALUE,
  DEFAULT_FILTERS,
  DEFAULT_SORT_MODE,
  SOURCE_OPTIONS,
  createSearchIndex,
  createStaticExplorerItems,
  filterExplorerItems,
  getAvailableClasses,
  getClassFilterOptions,
  getExplorerItemKey,
  getFlagFilterOptions,
  getItemIconPath,
  getItemTypeOptions,
  getMagicTypeLabel,
  getMagicTypeOptions,
  getSourceLabel,
  getZoneLabel,
  hasInventoryImages,
  sortExplorerItems,
};
export type {
  ExplorerItem,
  FilterOption,
  Filters,
  FlagFilter,
  ItemSource,
  SourceFilter,
  SortMode,
};
