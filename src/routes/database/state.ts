import Fuse from "fuse.js";
import {
  CharacterClass,
  DEFAULT_ITEM,
  MagicType,
  type CollectionItem,
  type CollectionItemRef,
  type CollectionRef,
  type DadDbRef,
  type Item,
  type ItemRef,
  type ItemType,
} from "../../services/data";
import { hydrateItem } from "../../services/data/factory";
import {
  coalesceCatalogItem,
  type CatalogItemDoc,
} from "../../services/store/catalog";
import i18n, { getItemDescription } from "../../services/i18n";
import { collectionGroupLabels } from "../../shared/domain";
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
  catalogItem?: CatalogItemDoc;
  idText: string;
  item: ItemRef;
  itemType?: ItemType;
  itemTypeName: string;
  searchText: string;
  source: ItemSource;
  staticItem?: ItemRef;
};

type FilterOption = {
  label: string;
  value: string;
};

type CollectionLogReference = {
  category: string;
  claim: string;
  claimDescription: string;
  collectionId: string;
  collectionName: string;
};

type CollectionReferenceContext = {
  category?: string;
  claim?: string;
  claimDescription?: string;
  claimZone?: CollectionRef["claimZone"];
  names: string[];
  outOfRotation?: boolean;
  premium?: boolean;
  promotional?: boolean;
  rootCategory?: string;
  season?: number;
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
const DEFAULT_SORT_MODE: SortMode = "none";
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
  return createExplorerItems(dadDbRef);
}

function createExplorerItems(
  dadDbRef: Pick<DadDbRef, "items" | "itemTypes">,
  catalogItems: CatalogItemDoc[] = [],
): ExplorerItem[] {
  const itemTypes = new Map(dadDbRef.itemTypes.map((itemType) => [
    itemType.id,
    itemType,
  ]));
  const catalogItemsById = new Map(
    catalogItems.map((catalogItem) => [catalogItem.itemId, catalogItem]),
  );
  const staticItemIds = new Set(dadDbRef.items.map((item) => item.id));

  return [
    ...dadDbRef.items.map((staticItem) => {
      const catalogItem = catalogItemsById.get(staticItem.id);
      const item = coalesceCatalogItem(staticItem, catalogItem);

      return {
        catalogItem,
        item,
        itemTypes,
        source: catalogItem ? ("catalog" as const) : ("static" as const),
        staticItem,
      };
    }),
    ...catalogItems
      .filter((catalogItem) => !staticItemIds.has(catalogItem.itemId))
      .map((catalogItem) => ({
        item: coalesceCatalogItem(undefined, catalogItem),
        itemTypes,
        source: "catalog" as const,
        catalogItem,
      })),
  ].map(createExplorerItem);
}

function createCollectionLogReferencesByItemId(
  dadDbRef: Pick<DadDbRef, "collections" | "itemTypes">,
  items: ExplorerItem[],
): Map<number, CollectionLogReference[]> {
  const itemLookup = createHydratedItemLookup(dadDbRef, items);
  const references = new Map<number, CollectionLogReference[]>();

  for (const collection of dadDbRef.collections) {
    addCollectionReferences(collection, itemLookup, references);
  }

  return references;
}

function createHydratedItemLookup(
  dadDbRef: Pick<DadDbRef, "itemTypes">,
  items: ExplorerItem[],
): Map<number, Item> {
  const itemTypes = new Map(dadDbRef.itemTypes.map((itemType) => [
    itemType.id,
    itemType,
  ]));
  const hydrate = hydrateItem(itemTypes);

  return new Map(
    items.map((item) => [item.item.id, hydrate(item.item)]),
  );
}

function addCollectionReferences(
  collection: CollectionRef,
  itemLookup: Map<number, Item>,
  references: Map<number, CollectionLogReference[]>,
  parentContext?: CollectionReferenceContext,
) {
  const context = createCollectionReferenceContext(collection, parentContext);

  for (const collectionItem of collection.collectionItems ?? []) {
    addCollectionItemReferences(collection, collectionItem, {
      context,
      itemLookup,
      references,
    });
  }

  for (const subcollection of collection.subcollections ?? []) {
    addCollectionReferences(
      subcollection,
      itemLookup,
      references,
      context,
    );
  }
}

function addCollectionItemReferences(
  collection: CollectionRef,
  collectionItem: CollectionItemRef,
  {
    context,
    itemLookup,
    references,
  }: {
    context: CollectionReferenceContext;
    itemLookup: Map<number, Item>;
    references: Map<number, CollectionLogReference[]>;
  },
) {
  const reference = createCollectionLogReference(
    collection,
    collectionItem,
    context,
    itemLookup,
  );

  for (const itemId of collectionItem.items) {
    const itemReferences = references.get(itemId) ?? [];
    itemReferences.push(reference);
    references.set(itemId, itemReferences);
  }
}

function createCollectionReferenceContext(
  collection: CollectionRef,
  parentContext?: CollectionReferenceContext,
): CollectionReferenceContext {
  const rootCategory = collection.rootCategory ??
    parentContext?.rootCategory ??
    collection.category;
  const category = collection.category ??
    collection.rootCategory ??
    parentContext?.category ??
    rootCategory;

  return {
    category,
    claim: collection.claim ?? parentContext?.claim,
    claimDescription:
      collection.claimDescription ?? parentContext?.claimDescription,
    claimZone: collection.claimZone ?? parentContext?.claimZone,
    names: [...(parentContext?.names ?? []), collection.name],
    outOfRotation: collection.outOfRotation ?? parentContext?.outOfRotation,
    premium: collection.premium ?? parentContext?.premium,
    promotional: collection.promotional ?? parentContext?.promotional,
    rootCategory,
    season: collection.season ?? parentContext?.season,
  };
}

function createCollectionLogReference(
  collection: CollectionRef,
  collectionItem: CollectionItemRef,
  context: CollectionReferenceContext,
  itemLookup: Map<number, Item>,
): CollectionLogReference {
  const claim = collectionItem.claim || context.claim || "Not set";
  const hydratedCollectionItem: CollectionItem = {
    ...collectionItem,
    claim,
    claimDescription:
      collectionItem.claimDescription ?? context.claimDescription,
    claimZone: collectionItem.claimZone ?? context.claimZone,
    id: -1,
    items: collectionItem.items.map(
      (itemId) => itemLookup.get(itemId) ?? DEFAULT_ITEM,
    ),
    outOfRotation:
      collectionItem.outOfRotation ?? context.outOfRotation,
    premium: collectionItem.premium ?? context.premium,
    promotional: collectionItem.promotional ?? context.promotional,
    season: collectionItem.season ?? context.season,
  };

  return {
    category: getCollectionReferenceCategory(context),
    claim,
    claimDescription: getItemDescription(hydratedCollectionItem),
    collectionId: String(collection.id),
    collectionName: context.names.join(" / "),
  };
}

function getCollectionReferenceCategory(
  context: CollectionReferenceContext,
): string {
  const category = context.category ?? context.rootCategory;

  if (!category) {
    return "Uncategorized";
  }

  return getCollectionGroupLabel(category) ?? category;
}

function getCollectionGroupLabel(category: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(collectionGroupLabels, category)
    ? collectionGroupLabels[
        category as keyof typeof collectionGroupLabels
      ]
    : undefined;
}

function createExplorerItem({
  catalogItem,
  item,
  itemTypes,
  source,
  staticItem,
}: {
  catalogItem?: CatalogItemDoc;
  item: ItemRef;
  itemTypes: Map<number, ItemType>;
  source: ItemSource;
  staticItem?: ItemRef;
}): ExplorerItem {
  const itemType = itemTypes.get(item.itemType);
  const itemTypeName = itemType?.name ?? "Missing item type";
  const idText = String(item.id);

  return {
    catalogItem,
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
    source,
    staticItem,
  };
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

function getMagicTypeLabel(magicType?: number): string {
  if (isMagicTypeNotSet(magicType)) {
    return "Not Set";
  }

  return i18n.magicType[magicType as MagicType] ?? `Unknown (${magicType})`;
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
  createCollectionLogReferencesByItemId,
  createSearchIndex,
  createExplorerItems,
  createStaticExplorerItems,
  filterExplorerItems,
  getClassFilterOptions,
  getItemTypeOptions,
  getMagicTypeOptions,
  sortExplorerItems,
};
export type {
  CollectionLogReference,
  ExplorerItem,
  FilterOption,
  Filters,
  FlagFilter,
  ItemSource,
  SourceFilter,
  SortMode,
};
