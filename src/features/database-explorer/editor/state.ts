import {
  CharacterClass,
  type ItemRef,
  type ItemType,
} from "../../../services/data";
import type {
  CatalogItemDoc,
  CatalogItemWrite,
} from "../../../services/store/catalog";
import { enumKeys } from "../../../shared/lib/enums";

type StandaloneItemFormState = {
  description: string;
  icon: string;
  iconPreviewUrl: string;
  itemId: string;
  itemType: string;
  itemQuality: string;
  name: string;
  preferredZone: string;
  series: string;
  transmogName: string;
  usableByClass: number[];
};

type OverrideItemFormState = {
  description: string;
  hasUsableByClassOverride: boolean;
  icon: string;
  iconPreviewUrl: string;
  itemType: string;
  itemQuality: string;
  name: string;
  preferredZone: string;
  series: string;
  transmogName: string;
  usableByClass: number[];
};

type ImportedItemDraft = {
  icon?: {
    dataUrl: string;
  };
  item: Partial<ItemRef>;
  itemTypeName?: string;
};

type StandaloneWriteOptions = {
  existingItemIds?: Iterable<number>;
  random?: () => number;
};

const CUSTOM_ITEM_ID_BASE = 550000;
const CUSTOM_ITEM_ID_SUFFIX_COUNT = 10000;
const USABLE_BY_CLASS_DISABLED = 0;
const USABLE_BY_CLASS_ENABLED = 1;
const OVERRIDE_INITIAL_FORM: OverrideItemFormState = {
  description: "",
  hasUsableByClassOverride: false,
  icon: "",
  iconPreviewUrl: "",
  itemType: "",
  itemQuality: "",
  name: "",
  preferredZone: "",
  series: "",
  transmogName: "",
  usableByClass: createDefaultUsableByClass(),
};
const STANDALONE_INITIAL_FORM: StandaloneItemFormState = {
  description: "",
  icon: "",
  iconPreviewUrl: "",
  itemId: "",
  itemType: "",
  itemQuality: "",
  name: "",
  preferredZone: "",
  series: "",
  transmogName: "",
  usableByClass: createDefaultUsableByClass(),
};

function createOverrideForm(
  catalogItem?: CatalogItemDoc,
  fallbackItem?: ItemRef,
): OverrideItemFormState {
  if (!catalogItem) {
    return {
      ...OVERRIDE_INITIAL_FORM,
      usableByClass: createUsableByClassFormValue(
        fallbackItem?.usableByClass,
      ),
    };
  }

  return {
    description: catalogItem.description ?? "",
    hasUsableByClassOverride: catalogItem.usableByClass !== undefined,
    icon: catalogItem.icon === undefined ? "" : String(catalogItem.icon),
    iconPreviewUrl: "",
    itemType: catalogItem.itemType === undefined
      ? ""
      : String(catalogItem.itemType),
    itemQuality: catalogItem.itemQuality === undefined
      ? ""
      : String(catalogItem.itemQuality),
    name: catalogItem.name ?? "",
    preferredZone: catalogItem.preferredZone === undefined
      ? ""
      : String(catalogItem.preferredZone),
    series: catalogItem.series ?? "",
    transmogName: catalogItem.transmogName ?? "",
    usableByClass: createUsableByClassFormValue(
      catalogItem.usableByClass ?? fallbackItem?.usableByClass,
    ),
  };
}

function buildOverrideWrite(
  itemId: number,
  form: OverrideItemFormState,
  catalogItem?: CatalogItemDoc,
): CatalogItemWrite {
  const description = form.description.trim();
  const icon = parseOptionalIntegerField(form.icon, "Icon");
  const itemType = parseOptionalIntegerField(form.itemType, "Item type");
  const itemQuality = parseOptionalIntegerField(form.itemQuality, "Item quality");
  const name = form.name.trim();
  const preferredZone = parseOptionalIntegerField(
    form.preferredZone,
    "Preferred zone",
  );
  const series = form.series.trim();
  const transmogName = form.transmogName.trim();
  const usableByClass = form.hasUsableByClassOverride
    ? createUsableByClassWriteValue(form.usableByClass)
    : undefined;

  return {
    ...getPreservedOverrideFields(catalogItem),
    ...(description ? { description } : {}),
    ...(icon !== undefined ? { icon } : {}),
    itemId,
    ...(itemType !== undefined ? { itemType } : {}),
    ...(itemQuality !== undefined ? { itemQuality } : {}),
    ...(name ? { name } : {}),
    ...(preferredZone !== undefined ? { preferredZone } : {}),
    ...(series ? { series } : {}),
    ...(transmogName ? { transmogName } : {}),
    ...(usableByClass !== undefined ? { usableByClass } : {}),
  };
}

function getPreservedOverrideFields(
  catalogItem: CatalogItemDoc | undefined,
): Partial<Omit<ItemRef, "id">> {
  if (!catalogItem) {
    return {};
  }

  const {
    description: _description,
    icon: _icon,
    itemId: _itemId,
    itemType: _itemType,
    itemQuality: _itemQuality,
    name: _name,
    preferredZone: _preferredZone,
    series: _series,
    transmogName: _transmogName,
    usableByClass: _usableByClass,
    ...preservedFields
  } = catalogItem;

  return preservedFields;
}

function buildStandaloneWrite(
  form: StandaloneItemFormState,
  options: StandaloneWriteOptions = {},
): CatalogItemWrite {
  const itemId = getStandaloneItemId(
    form.itemId,
    options.existingItemIds ?? [],
    options.random ?? Math.random,
  );
  const icon = parseRequiredIntegerField(
    form.icon,
    "Icon",
    "Icon is required. Import from URL or upload an icon.",
  );
  const itemType = parseRequiredIntegerField(
    form.itemType,
    "Item type",
    "Item type is required.",
  );
  const name = form.name.trim();
  const description = form.description.trim();
  const itemQuality = form.itemQuality.trim().length > 0
    ? parseIntegerField(form.itemQuality, "Item quality")
    : undefined;
  const preferredZone = form.preferredZone.trim().length > 0
    ? parseIntegerField(form.preferredZone, "Preferred zone")
    : undefined;
  const series = form.series.trim();
  const transmogName = form.transmogName.trim();
  const usableByClass = createUsableByClassWriteValue(form.usableByClass);

  if (name.length === 0) {
    throw new Error("Name is required.");
  }

  return {
    ...(description ? { description } : {}),
    icon,
    itemId,
    itemType,
    ...(itemQuality !== undefined ? { itemQuality } : {}),
    name,
    ...(preferredZone !== undefined ? { preferredZone } : {}),
    ...(series ? { series } : {}),
    ...(transmogName ? { transmogName } : {}),
    usableByClass,
  };
}

function getStandaloneItemId(
  value: string,
  existingItemIds: Iterable<number>,
  random: () => number,
): number {
  const existingItemIdSet = new Set(existingItemIds);

  if (value.trim().length > 0) {
    const itemId = parseIntegerField(value, "Item ID");

    if (existingItemIdSet.has(itemId)) {
      throw new Error("Item ID already exists.");
    }

    return itemId;
  }

  return generateCustomItemId(existingItemIdSet, random);
}

function generateCustomItemId(
  existingItemIds: ReadonlySet<number>,
  random: () => number,
): number {
  const startSuffix = getRandomCustomItemIdSuffix(random);

  for (let offset = 0; offset < CUSTOM_ITEM_ID_SUFFIX_COUNT; offset += 1) {
    const suffix = (startSuffix + offset) % CUSTOM_ITEM_ID_SUFFIX_COUNT;
    const itemId = CUSTOM_ITEM_ID_BASE + suffix;

    if (!existingItemIds.has(itemId)) {
      return itemId;
    }
  }

  throw new Error("No custom item IDs are available.");
}

function getRandomCustomItemIdSuffix(random: () => number): number {
  const value = random();
  const normalizedValue = Number.isFinite(value)
    ? Math.max(0, Math.min(value, 0.999999999))
    : 0;

  return Math.floor(normalizedValue * CUSTOM_ITEM_ID_SUFFIX_COUNT);
}

function applyImportedItemDraft(
  form: StandaloneItemFormState,
  draft: ImportedItemDraft,
  itemTypes: ItemType[],
): StandaloneItemFormState {
  return {
    ...form,
    iconPreviewUrl: draft.icon?.dataUrl ?? form.iconPreviewUrl,
    itemId: draft.item.id === undefined ? form.itemId : String(draft.item.id),
    itemType: draft.item.itemType === undefined
      ? resolveItemTypeValue(draft.itemTypeName, itemTypes) ?? form.itemType
      : String(draft.item.itemType),
    itemQuality: draft.item.itemQuality === undefined
      ? form.itemQuality
      : String(draft.item.itemQuality),
    name: draft.item.name ?? form.name,
    series: draft.item.series ?? form.series,
    transmogName: draft.item.transmogName ?? form.transmogName,
    usableByClass: draft.item.usableByClass === undefined
      ? form.usableByClass
      : createUsableByClassFormValue(draft.item.usableByClass),
  };
}

function hasOverrideFormChanges(
  form: OverrideItemFormState,
  initialForm: OverrideItemFormState,
): boolean {
  return !areOverrideFormsEqual(form, initialForm);
}

function hasStandaloneFormChanges(form: StandaloneItemFormState): boolean {
  return !areStandaloneFormsEqual(form, STANDALONE_INITIAL_FORM);
}

function areOverrideFormsEqual(
  first: OverrideItemFormState,
  second: OverrideItemFormState,
): boolean {
  return first.description === second.description &&
    first.hasUsableByClassOverride === second.hasUsableByClassOverride &&
    first.icon === second.icon &&
    first.iconPreviewUrl === second.iconPreviewUrl &&
    first.itemType === second.itemType &&
    first.itemQuality === second.itemQuality &&
    first.name === second.name &&
    first.preferredZone === second.preferredZone &&
    first.series === second.series &&
    first.transmogName === second.transmogName &&
    areNumberArraysEqual(first.usableByClass, second.usableByClass);
}

function areStandaloneFormsEqual(
  first: StandaloneItemFormState,
  second: StandaloneItemFormState,
): boolean {
  return first.description === second.description &&
    first.icon === second.icon &&
    first.iconPreviewUrl === second.iconPreviewUrl &&
    first.itemId === second.itemId &&
    first.itemType === second.itemType &&
    first.itemQuality === second.itemQuality &&
    first.name === second.name &&
    first.preferredZone === second.preferredZone &&
    first.series === second.series &&
    first.transmogName === second.transmogName &&
    areNumberArraysEqual(first.usableByClass, second.usableByClass);
}

function areNumberArraysEqual(
  first: readonly number[],
  second: readonly number[],
): boolean {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((value, index) => value === second[index]);
}

function createDefaultUsableByClass(): number[] {
  return getCharacterClassValues().map(() => USABLE_BY_CLASS_ENABLED);
}

function createUsableByClassFormValue(value?: readonly number[]): number[] {
  if (value === undefined) {
    return createDefaultUsableByClass();
  }

  return getCharacterClassValues().map((characterClass) =>
    value[characterClass] === USABLE_BY_CLASS_ENABLED
      ? USABLE_BY_CLASS_ENABLED
      : USABLE_BY_CLASS_DISABLED,
  );
}

function createUsableByClassWriteValue(value: readonly number[]): number[] {
  return getCharacterClassValues().map((characterClass) =>
    value[characterClass] === USABLE_BY_CLASS_ENABLED
      ? USABLE_BY_CLASS_ENABLED
      : USABLE_BY_CLASS_DISABLED,
  );
}

function getCharacterClassValues(): CharacterClass[] {
  return enumKeys(CharacterClass).map(
    (characterClassKey) => CharacterClass[characterClassKey],
  );
}

function resolveItemTypeValue(
  itemTypeName: string | undefined,
  itemTypes: ItemType[],
): string | undefined {
  if (!itemTypeName) {
    return undefined;
  }

  const normalizedName = normalizeMatchText(itemTypeName);
  const match = itemTypes.find(
    (itemType) => normalizeMatchText(itemType.name) === normalizedName,
  );

  return match ? String(match.id) : undefined;
}

function normalizeMatchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseOptionalIntegerField(
  value: string,
  label: string,
): number | undefined {
  if (value.trim().length === 0) {
    return undefined;
  }

  return parseIntegerField(value, label);
}

function parseRequiredIntegerField(
  value: string,
  label: string,
  message: string,
): number {
  if (value.trim().length === 0) {
    throw new Error(message);
  }

  return parseIntegerField(value, label);
}

function parseIntegerField(value: string, label: string): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    throw new Error(`${label} must be an integer.`);
  }

  return parsedValue;
}

export {
  OVERRIDE_INITIAL_FORM,
  STANDALONE_INITIAL_FORM,
  applyImportedItemDraft,
  buildOverrideWrite,
  buildStandaloneWrite,
  createOverrideForm,
  hasOverrideFormChanges,
  hasStandaloneFormChanges,
};
export type {
  ImportedItemDraft,
  OverrideItemFormState,
  StandaloneItemFormState,
};
