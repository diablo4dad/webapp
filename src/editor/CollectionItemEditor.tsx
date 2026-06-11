import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addCatalogCollectionItem,
  fetchHybridDadDbRef,
} from "../store/catalog";
import {
  CharacterClass,
  Chest,
  CollectionItem,
  CollectionItemRef,
  Item,
  Zone,
} from "../data";
import { Close, Plus } from "../components/Icons";
import { getIcon } from "../bucket";
import { hydrateDadDb } from "../data/factory";
import { useData } from "../data/context";
import { useEditor } from "./context";
import { ItemGroup, itemGroups } from "../common";
import { enumKeys } from "../common/enums";
import { createCollectionItemSettingsFilter } from "../data/filters";
import {
  doesHaveWardrobePlaceholder,
  isVesselOfHatredItem,
} from "../data/predicates";
import { useSettings } from "../settings/context";
import i18n from "../i18n";
import barbarian from "../image/classes/barbarian.webp";
import druid from "../image/classes/druid.webp";
import necromancer from "../image/classes/necromancer.webp";
import paladin from "../image/classes/paladin.png";
import rogue from "../image/classes/rogue.webp";
import sorceress from "../image/classes/sorcerer.webp";
import spiritborn from "../image/classes/spiritborn.webp";
import warlock from "../image/classes/warlock.webp";
import expansion from "../image/logo/d4ico_x1.png";
import unobtainable from "../image/miniico/mystery.webp";
import premium from "../image/miniico/purse.webp";
import season from "../image/miniico/season.webp";
import series from "../image/miniico/series.webp";
import oor from "../image/miniico/skull.webp";
import wardrobe from "../image/miniico/wardrobe.webp";
import placeholder from "../image/placeholder.webp";
import styles from "./CollectionItemEditor.module.css";

type FormState = {
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
};

type TextField =
  | "claim"
  | "claimDescription"
  | "claimZone"
  | "claimChest"
  | "claimMonster"
  | "season";

type BooleanField =
  | "outOfRotation"
  | "premium"
  | "promotional"
  | "unobtainable";

type EnumOption = {
  label: string;
  value: number;
};

type ItemGroupOption = {
  label: string;
  itemTypes: string[];
  value: ItemGroup;
};

type PreviewTag = {
  icon: string;
  label: string;
};

const initialForm: FormState = {
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
};

const classIconMap = new Map<CharacterClass, string>([
  [CharacterClass.BARBARIAN, barbarian],
  [CharacterClass.DRUID, druid],
  [CharacterClass.ROGUE, rogue],
  [CharacterClass.SORCERER, sorceress],
  [CharacterClass.NECROMANCER, necromancer],
  [CharacterClass.SPIRITBORN, spiritborn],
  [CharacterClass.PALADIN, paladin],
  [CharacterClass.WARLOCK, warlock],
]);

function hashCollectionItemId(input: string): number {
  return input.split("").reduce((hash, char) => {
    const nextHash = (hash << 5) - hash + char.charCodeAt(0);
    return nextHash & nextHash;
  }, 0);
}

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
  return item.transmogName ?? item.name;
}

function isPlayerTitle(item: Item): boolean {
  return (
    item.itemType.name === "Player Title" ||
    item.itemType.name.startsWith("Player Title ")
  );
}

function getGeneratedName(items: Item[]): string {
  return items.map((item) => item.name).join(", ");
}

function buildCollectionItemRef(
  form: FormState,
  selectedItems: Item[],
): CollectionItemRef {
  const name = getGeneratedName(selectedItems);
  const claimDescription = form.claimDescription.trim();
  const collectionItem: CollectionItemRef = {
    id: hashCollectionItemId(`${name}${claimDescription}`),
    name,
    claim: form.claim.trim(),
    outOfRotation: form.outOfRotation,
    premium: form.premium,
    promotional: form.promotional,
    unobtainable: form.unobtainable,
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
  form: FormState,
  selectedItems: Item[],
): CollectionItem {
  return {
    ...buildCollectionItemRef(form, selectedItems),
    items: selectedItems,
  };
}

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

function getItemGroupLabel(itemGroup: ItemGroup): string {
  return itemGroupLabels.get(itemGroup) ?? itemGroup;
}

function buildCandidateCollectionItem(
  form: FormState,
  item: Item,
): CollectionItem {
  return buildCollectionItem(form, [item]);
}

function sortItems(a: Item, b: Item): number {
  return getItemDisplayName(a).localeCompare(getItemDisplayName(b));
}

function usableBy(
  characterClass: CharacterClass,
  collectionItem: CollectionItem,
): boolean {
  return collectionItem.items.some(
    (item) => item.usableByClass?.[characterClass] === 1,
  );
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

function getPreviewType(
  collectionItem: CollectionItem | undefined,
  focusItem: Item | undefined,
): string {
  if (!collectionItem || !focusItem) {
    return "Select an item";
  }

  if (collectionItem.items.length > 1 && isPlayerTitle(focusItem)) {
    return "Player Title";
  }

  return focusItem.itemType.name;
}

function getPreviewTags(
  collectionItem: CollectionItem | undefined,
  focusItem: Item | undefined,
): PreviewTag[] {
  if (!collectionItem || !focusItem) {
    return [];
  }

  const tags: PreviewTag[] = [];

  if (focusItem.series) {
    tags.push({ icon: series, label: focusItem.series.replaceAll('"', "") });
  }

  return tags;
}

function CollectionItemEditor() {
  const { db, setDb } = useData();
  const { activeCollection, closeCollectionItemEditor } = useEditor();
  const settings = useSettings();
  const [form, setForm] = useState<FormState>(initialForm);
  const [itemGroup, setItemGroup] = useState<ItemGroup | "">("");
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setForm(initialForm);
    setItemGroup("");
    setItemSearch("");
    setSelectedItems([]);
    setError(undefined);
    setSaving(false);
  }, [activeCollection?.id]);

  const itemGroupOptions = useMemo(
    () =>
      Array.from(itemGroups.entries()).map(([value, itemTypes]) => ({
        label: getItemGroupLabel(value),
        itemTypes,
        value,
      })),
    [],
  );
  const selectedItemTypes = useMemo(() => {
    if (itemGroup === "") {
      return itemGroupOptions.flatMap((option) => option.itemTypes);
    }

    return itemGroups.get(itemGroup) ?? [];
  }, [itemGroup, itemGroupOptions]);
  const zoneOptions = useMemo(() => enumOptions(Zone), []);
  const chestOptions = useMemo(() => enumOptions(Chest), []);
  const normalizedSearch = itemSearch.trim().toLowerCase();
  const matchingItems = useMemo(() => {
    const collectionItemFilter = createCollectionItemSettingsFilter(
      settings,
      undefined,
      { itemTypes: selectedItemTypes },
    );

    return db.items
      .filter((item) =>
        collectionItemFilter(buildCandidateCollectionItem(form, item)),
      )
      .filter((item) => item.name !== "")
      .filter((item) => {
        if (normalizedSearch.length === 0) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(normalizedSearch) ||
          getItemDisplayName(item).toLowerCase().includes(normalizedSearch)
        );
      })
      .sort(sortItems);
  }, [db.items, form, normalizedSearch, selectedItemTypes, settings]);

  const previewItem = selectedItems[0];
  const previewCollectionItem =
    selectedItems.length > 0
      ? buildCollectionItem(form, selectedItems)
      : undefined;
  const previewTags = getPreviewTags(previewCollectionItem, previewItem);
  const canSave = selectedItems.length > 0 && form.claim.trim().length > 0;

  const updateTextField =
    (field: TextField) =>
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const updateBooleanField =
    (field: BooleanField) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.checked,
      }));
    };

  function selectItem(item: Item) {
    setSelectedItems((current) => {
      if (!isPlayerTitle(item)) {
        return [item];
      }

      if (current.some((selectedItem) => selectedItem.id === item.id)) {
        return current;
      }

      if (current.length === 0 || current.every(isPlayerTitle)) {
        return [...current, item].slice(-2);
      }

      return [item];
    });
  }

  function removeSelectedItem(itemId: number) {
    setSelectedItems((current) =>
      current.filter((selectedItem) => selectedItem.id !== itemId),
    );
  }

  async function saveCollectionItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCollection || !canSave) {
      return;
    }

    setSaving(true);
    setError(undefined);

    try {
      const collectionItem = buildCollectionItemRef(form, selectedItems);
      await addCatalogCollectionItem(activeCollection.id, collectionItem);
      const dadDbRef = await fetchHybridDadDbRef();
      setDb(hydrateDadDb(dadDbRef));
      closeCollectionItemEditor();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save collection item.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!activeCollection) {
    return null;
  }

  return (
    <div className={styles.Overlay} onClick={closeCollectionItemEditor}>
      <aside
        className={styles.Panel}
        onClick={(event) => event.stopPropagation()}
      >
        <form className={styles.Form} onSubmit={saveCollectionItem}>
          <header className={styles.Header}>
            <div className={styles.HeaderText}>
              <div className={styles.Kicker}>Add Item</div>
              <h2 className={styles.Title}>{activeCollection.name}</h2>
            </div>
            <button
              type="button"
              className={styles.CloseButton}
              onClick={closeCollectionItemEditor}
              aria-label="Close item editor"
            >
              <Close />
            </button>
          </header>

          <div className={styles.Body}>
            <div className={styles.Preview}>
              <div className={styles.PreviewImage}>
                <img
                  src={previewItem ? getIcon(previewItem.icon) : placeholder}
                  alt={previewItem ? getItemDisplayName(previewItem) : ""}
                />
              </div>
              <div className={styles.PreviewMeta}>
                <div className={styles.PreviewName}>
                  {getPreviewName(previewCollectionItem, previewItem)}
                </div>
                <div className={styles.PreviewTypeRow}>
                  <span className={styles.PreviewType}>
                    {getPreviewType(previewCollectionItem, previewItem)}
                  </span>
                  {previewTags.length > 0 && (
                    <span className={styles.PreviewTags}>
                      {previewTags.map((tag) => (
                        <span key={tag.label} className={styles.PreviewTag}>
                          <img src={tag.icon} alt="" />
                          <span>{tag.label}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                {previewCollectionItem && (
                  <div className={styles.PreviewClasses}>
                    {enumKeys(CharacterClass)
                      .sort((a, b) => CharacterClass[a] - CharacterClass[b])
                      .map((characterClassKey) => {
                        const characterClass =
                          CharacterClass[characterClassKey];
                        const isUsable = usableBy(
                          characterClass,
                          previewCollectionItem,
                        );

                        return (
                          <span
                            key={characterClass}
                            className={
                              isUsable
                                ? styles.PreviewClassActive
                                : styles.PreviewClass
                            }
                            title={i18n.characterClass[characterClass] ?? ""}
                          >
                            <img
                              src={classIconMap.get(characterClass) ?? ""}
                              alt={i18n.characterClass[characterClass] ?? ""}
                            />
                          </span>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <section className={styles.Section}>
              <label className={styles.Label} htmlFor="collection-item-group">
                Item Group
              </label>
              <select
                id="collection-item-group"
                className={styles.Input}
                value={itemGroup}
                onChange={(event) =>
                  setItemGroup(event.target.value as ItemGroup | "")
                }
              >
                <option value="">All item groups</option>
                {itemGroupOptions.map((option: ItemGroupOption) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className={styles.Label} htmlFor="collection-item-search">
                Item
              </label>
              <input
                id="collection-item-search"
                className={styles.Input}
                value={itemSearch}
                onChange={(event) => setItemSearch(event.target.value)}
                placeholder="Search items"
                autoComplete="off"
              />

              <div className={styles.Results}>
                {matchingItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.Result}
                    onClick={() => selectItem(item)}
                  >
                    <span className={styles.ResultName}>
                      {getItemDisplayName(item)}
                    </span>
                    <span className={styles.ResultType}>
                      {item.itemType.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className={styles.SelectedItems}>
                {selectedItems.map((item) => (
                  <span key={item.id} className={styles.SelectedItem}>
                    <span>{getItemDisplayName(item)}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedItem(item.id)}
                      aria-label={`Remove ${getItemDisplayName(item)}`}
                    >
                      <Close />
                    </button>
                  </span>
                ))}
              </div>
            </section>

            <section className={styles.Section}>
              <label className={styles.Label} htmlFor="collection-item-claim">
                Claim
              </label>
              <input
                id="collection-item-claim"
                className={styles.Input}
                value={form.claim}
                onChange={updateTextField("claim")}
                required
              />

              <label
                className={styles.Label}
                htmlFor="collection-item-claim-description"
              >
                Claim Description
              </label>
              <textarea
                id="collection-item-claim-description"
                className={styles.TextArea}
                value={form.claimDescription}
                onChange={updateTextField("claimDescription")}
                rows={3}
              />

              <div className={styles.FieldGrid}>
                <div>
                  <label
                    className={styles.Label}
                    htmlFor="collection-item-claim-zone"
                  >
                    Claim Zone
                  </label>
                  <select
                    id="collection-item-claim-zone"
                    className={styles.Input}
                    value={form.claimZone}
                    onChange={updateTextField("claimZone")}
                  >
                    <option value="">None</option>
                    {zoneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={styles.Label}
                    htmlFor="collection-item-claim-chest"
                  >
                    Claim Chest
                  </label>
                  <select
                    id="collection-item-claim-chest"
                    className={styles.Input}
                    value={form.claimChest}
                    onChange={updateTextField("claimChest")}
                  >
                    <option value="">None</option>
                    {chestOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label
                className={styles.Label}
                htmlFor="collection-item-claim-monster"
              >
                Claim Monster
              </label>
              <input
                id="collection-item-claim-monster"
                className={styles.Input}
                value={form.claimMonster}
                onChange={updateTextField("claimMonster")}
              />

              <label className={styles.Label} htmlFor="collection-item-season">
                Season
              </label>
              <input
                id="collection-item-season"
                className={styles.Input}
                type="number"
                min="0"
                value={form.season}
                onChange={updateTextField("season")}
              />
            </section>

            <section className={styles.ToggleGrid}>
              <label className={styles.Toggle}>
                <input
                  type="checkbox"
                  checked={form.outOfRotation}
                  onChange={updateBooleanField("outOfRotation")}
                />
                <span>Out of Rotation</span>
              </label>
              <label className={styles.Toggle}>
                <input
                  type="checkbox"
                  checked={form.premium}
                  onChange={updateBooleanField("premium")}
                />
                <span>Premium</span>
              </label>
              <label className={styles.Toggle}>
                <input
                  type="checkbox"
                  checked={form.promotional}
                  onChange={updateBooleanField("promotional")}
                />
                <span>Promotional</span>
              </label>
              <label className={styles.Toggle}>
                <input
                  type="checkbox"
                  checked={form.unobtainable}
                  onChange={updateBooleanField("unobtainable")}
                />
                <span>Unobtainable</span>
              </label>
            </section>
          </div>

          <footer className={styles.Actions}>
            {error && <div className={styles.Error}>{error}</div>}
            <button
              type="button"
              className={styles.SecondaryButton}
              onClick={closeCollectionItemEditor}
            >
              Close
            </button>
            <button
              type="submit"
              className={styles.SaveButton}
              disabled={!canSave || saving}
            >
              <span className={styles.SaveIcon}>
                <Plus />
              </span>
              <span>{saving ? "Saving" : "Save"}</span>
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

export default CollectionItemEditor;
