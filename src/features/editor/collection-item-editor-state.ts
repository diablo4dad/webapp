import { CharacterClass, Chest, Zone } from "../../services/data";
import type {
  Collection,
  CollectionItem,
  CollectionItemRef,
  Item,
} from "../../services/data";
import { ItemGroup } from "../../shared/domain";
import { enumKeys } from "../../shared/lib/enums";
import { isPlayerTitle } from "./collection-item-selection";

type CollectionItemFormState = {
  claim: string;
  claimDescription: string;
  claimZone: string;
  claimChest: string;
  claimMonster: string;
  season: string;
  outOfRotation: boolean;
  premium: boolean;
  promotional: boolean;
  unobtainable: boolean;
  useBaseItemName: boolean;
};

type CollectionItemTextField =
  | "claim"
  | "claimDescription"
  | "claimZone"
  | "claimChest"
  | "claimMonster"
  | "season";

type CollectionItemBooleanField =
  | "outOfRotation"
  | "premium"
  | "promotional"
  | "unobtainable"
  | "useBaseItemName";

type EnumOption = {
  label: string;
  value: number;
};

type CollectionItemGroupOption = {
  label: string;
  itemTypes: string[];
  value: ItemGroup;
};

type CollectionOption = {
  disabled: boolean;
  id: string;
  label: string;
};

type CollectionItemEditorInitialState = {
  form: CollectionItemFormState;
  selectedItems: Item[];
  targetCollectionId: string;
};

const COLLECTION_ITEM_INITIAL_FORM: CollectionItemFormState = {
  claim: "",
  claimDescription: "",
  claimZone: "",
  claimChest: "",
  claimMonster: "",
  season: "",
  outOfRotation: false,
  premium: false,
  promotional: false,
  unobtainable: false,
  useBaseItemName: false,
};

const itemGroupLabels = new Map<ItemGroup, string>([
  [ItemGroup.MOUNTS, "Mounts"],
  [ItemGroup.HORSE_ARMOR, "Horse Armor"],
  [ItemGroup.TROPHIES, "Trophies"],
  [ItemGroup.BACK_TROPHIES, "Back Trophies"],
  [ItemGroup.ARMOR, "Armor"],
  [ItemGroup.WEAPONS, "Weapons"],
  [ItemGroup.BODY, "Body Markings"],
  [ItemGroup.EMOTES, "Emotes"],
  [ItemGroup.TOWN_PORTALS, "Town Portals"],
  [ItemGroup.HEADSTONES, "Headstones"],
  [ItemGroup.EMBLEMS, "Emblems"],
  [ItemGroup.PLAYER_TITLES, "Player Titles"],
  [ItemGroup.PETS, "Pets"],
]);

function labelFromEnumKey(key: string): string {
  return key
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function enumOptions(enumValue: Record<string, string | number>): EnumOption[] {
  return Object.entries(enumValue)
    .filter(
      ([key, value]) => Number.isNaN(Number(key)) && typeof value === "number",
    )
    .map(([key, value]) => ({
      label: labelFromEnumKey(key),
      value: Number(value),
    }));
}

function getItemDisplayName(item: Item): string {
  return item.name;
}

function buildCollectionItemRef(
  form: CollectionItemFormState,
  selectedItems: Item[],
): CollectionItemRef {
  const claimDescription = form.claimDescription.trim();
  const collectionItem: CollectionItemRef = {
    claim: form.claim.trim(),
    outOfRotation: form.outOfRotation,
    premium: form.premium,
    promotional: form.promotional,
    unobtainable: form.unobtainable,
    useBaseItemName: form.useBaseItemName,
    items: selectedItems.map((item) => item.id),
  };

  if (claimDescription.length > 0) {
    collectionItem.claimDescription = claimDescription;
  }

  if (form.claimZone !== "") {
    collectionItem.claimZone = Number(form.claimZone) as Zone;
  }

  if (form.claimChest !== "") {
    collectionItem.claimChest = Number(form.claimChest) as Chest;
  }

  const claimMonster = form.claimMonster.trim();
  if (claimMonster.length > 0) {
    collectionItem.claimMonster = claimMonster;
  }

  if (form.season.trim() !== "") {
    collectionItem.season = Number(form.season);
  }

  return collectionItem;
}

function buildCollectionItem(
  form: CollectionItemFormState,
  selectedItems: Item[],
): CollectionItem {
  return {
    ...buildCollectionItemRef(form, selectedItems),
    id: -1,
    items: selectedItems,
  };
}

function createInitialState(
  collectionItem?: CollectionItem,
  collectionId = "",
): CollectionItemEditorInitialState {
  if (!collectionItem) {
    return {
      form: COLLECTION_ITEM_INITIAL_FORM,
      selectedItems: [],
      targetCollectionId: collectionId,
    };
  }

  return {
    form: {
      claim: collectionItem.claim ?? "",
      claimDescription: collectionItem.claimDescription ?? "",
      claimZone:
        collectionItem.claimZone === undefined
          ? ""
          : String(collectionItem.claimZone),
      claimChest:
        collectionItem.claimChest === undefined
          ? ""
          : String(collectionItem.claimChest),
      claimMonster: collectionItem.claimMonster ?? "",
      season:
        collectionItem.season === undefined
          ? ""
          : String(collectionItem.season),
      outOfRotation: collectionItem.outOfRotation ?? false,
      premium: collectionItem.premium ?? false,
      promotional: collectionItem.promotional ?? false,
      unobtainable: collectionItem.unobtainable ?? false,
      useBaseItemName: collectionItem.useBaseItemName ?? false,
    },
    selectedItems: collectionItem.items,
    targetCollectionId: collectionId,
  };
}

function hasEditorChanges(
  initialState: CollectionItemEditorInitialState,
  form: CollectionItemFormState,
  selectedItems: Item[],
  targetCollectionId: string,
): boolean {
  return (
    JSON.stringify(initialState.form) !== JSON.stringify(form) ||
    initialState.selectedItems.map((item) => item.id).join(",") !==
      selectedItems.map((item) => item.id).join(",") ||
    initialState.targetCollectionId !== targetCollectionId
  );
}

function getItemGroupLabel(itemGroup: ItemGroup): string {
  return itemGroupLabels.get(itemGroup) ?? itemGroup;
}

function buildCandidateCollectionItem(
  form: CollectionItemFormState,
  item: Item,
): CollectionItem {
  return buildCollectionItem(form, [item]);
}

function sortItems(a: Item, b: Item): number {
  return getItemDisplayName(a).localeCompare(getItemDisplayName(b));
}

function itemUsableBy(characterClass: CharacterClass, item: Item): boolean {
  return item.usableByClass?.[characterClass] === 1;
}

function getSingleUsableClass(item: Item): CharacterClass | undefined {
  const usableClasses = enumKeys(CharacterClass)
    .map((characterClassKey) => CharacterClass[characterClassKey])
    .filter((characterClass) => itemUsableBy(characterClass, item));

  return usableClasses.length === 1 ? usableClasses[0] : undefined;
}

function getPreviewName(
  collectionItem: CollectionItem | undefined,
  focusItem: Item | undefined,
): string {
  if (!collectionItem || !focusItem) {
    return "No item selected";
  }

  if (collectionItem.items.length > 1 && isPlayerTitle(focusItem)) {
    return collectionItem.items.map((item) => item.name).join(" ");
  }

  return getItemDisplayName(focusItem);
}

function getCollectionCategory(collection?: Collection): string | undefined {
  return collection?.rootCategory ?? collection?.category;
}

function buildCollectionOptions(
  collections: Collection[],
  activeCollection?: Collection,
): CollectionOption[] {
  const activeCategory = getCollectionCategory(activeCollection);

  if (!activeCategory) {
    return [];
  }

  return collections
    .filter((collection) => getCollectionCategory(collection) === activeCategory)
    .flatMap((collection) => {
      const options: CollectionOption[] = [
        {
          disabled: collection.subcollections.length > 0,
          id: collection.id,
          label: collection.name,
        },
      ];

      return [
        ...options,
        ...collection.subcollections.map((subcollection) => ({
          disabled: subcollection.subcollections.length > 0,
          id: subcollection.id,
          label: `${collection.name} / ${subcollection.name}`,
        })),
      ];
    });
}

export {
  COLLECTION_ITEM_INITIAL_FORM,
  buildCandidateCollectionItem,
  buildCollectionItemRef,
  buildCollectionOptions,
  createInitialState,
  enumOptions,
  getItemDisplayName,
  getItemGroupLabel,
  getPreviewName,
  getSingleUsableClass,
  hasEditorChanges,
  itemUsableBy,
  sortItems,
};
export type {
  CollectionItemBooleanField,
  CollectionItemEditorInitialState,
  CollectionItemFormState,
  CollectionItemGroupOption,
  CollectionItemTextField,
};
