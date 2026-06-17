import React, {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import classNames from "classnames";
import {
  addCatalogCollectionItem,
  deleteCatalogCollectionItem,
  fetchHybridDadDbRef,
  moveCatalogCollectionItem,
  updateCatalogCollectionItem,
} from "../store/catalog";
import {
  CharacterClass,
  Chest,
  Collection,
  CollectionItem,
  CollectionItemRef,
  Item,
  Zone,
} from "../data";
import { Close, Plus } from "../components/Icons";
import { getIcon } from "../bucket";
import { FallbackLazyImage } from "../components/LazyLoadImageFallback";
import { hydrateDadDb } from "../data/factory";
import { useData } from "../data/context";
import { useEditor } from "./context";
import { ItemGroup, MasterGroup, catalogGroups, itemGroups } from "../common";
import { enumKeys } from "../common/enums";
import { createCollectionItemSettingsFilter } from "../data/filters";
import {
  doesHaveWardrobePlaceholder,
  isVesselOfHatredItem,
} from "../data/predicates";
import { useSettings } from "../settings/context";
import {
  canSelectCollectionItem,
  isPlayerTitle,
  selectCollectionItem,
} from "./collectionItemSelection";
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
import transmog from "../image/icons/transmog.webp";
import placeholder from "../image/placeholder.webp";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import Toggle from "../components/Toggle";
import { flattenDadDb } from "../data/transforms";
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
  useBaseItemName: boolean;
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
  | "unobtainable"
  | "useBaseItemName";

type EnumOption = {
  label: string;
  value: number;
};

type ItemGroupOption = {
  label: string;
  itemTypes: string[];
  value: ItemGroup;
};

type CollectionOption = {
  disabled: boolean;
  id: string;
  label: string;
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
  useBaseItemName: false,
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

type EditorInitialState = {
  form: FormState;
  selectedItems: Item[];
  targetCollectionId: string;
};

function buildCollectionItemRef(
  form: FormState,
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
  form: FormState,
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
): EditorInitialState {
  if (!collectionItem) {
    return {
      form: initialForm,
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
  initialState: EditorInitialState,
  form: FormState,
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

function getItemPreviewTags(item: Item | undefined): PreviewTag[] {
  if (!item) {
    return [];
  }

  const tags: PreviewTag[] = [];

  if (item.series) {
    tags.push({ icon: series, label: item.series.replaceAll('"', "") });
  }

  return tags;
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

function CollectionItemEditor() {
  const { db, setCatalogCategoryDb } = useData();
  const { activeCollectionItemEditor, closeCollectionItemEditor } = useEditor();
  const settings = useSettings();
  const [form, setForm] = useState<FormState>(initialForm);
  const [itemGroup, setItemGroup] = useState<ItemGroup | "">("");
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [targetCollectionId, setTargetCollectionId] = useState("");
  const [initialState, setInitialState] = useState<EditorInitialState>({
    form: initialForm,
    selectedItems: [],
    targetCollectionId: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [error, setError] = useState<string>();
  const activeCollection = activeCollectionItemEditor?.collection;
  const activeCollectionItem = activeCollectionItemEditor?.collectionItem;
  const isEditingExisting = activeCollectionItemEditor?.mode === "edit";

  useEffect(() => {
    const nextInitialState = createInitialState(
      activeCollectionItem,
      activeCollection?.id ?? "",
    );
    setInitialState(nextInitialState);
    setForm(nextInitialState.form);
    setItemGroup("");
    setItemSearch("");
    setSelectedItems(nextInitialState.selectedItems);
    setTargetCollectionId(nextInitialState.targetCollectionId);
    setError(undefined);
    setSaving(false);
    setDeleting(false);
    setDeleteModalOpen(false);
  }, [activeCollection?.id, activeCollectionItem?.id]);

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
  const claimOptions = useMemo(
    () =>
      Array.from(
        new Set(
          flattenDadDb(db.collections)
            .map((collectionItem) => collectionItem.claim)
            .filter((claim) => claim.trim().length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [db.collections],
  );
  const collectionOptions = useMemo(
    () => buildCollectionOptions(db.collections, activeCollection),
    [activeCollection, db.collections],
  );
  const targetCollectionOption = collectionOptions.find(
    (option) => option.id === targetCollectionId,
  );
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
      .filter((item) => canSelectCollectionItem(selectedItems, item))
      .filter((item) => {
        if (normalizedSearch.length === 0) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(normalizedSearch) ||
          (item.transmogName?.toLowerCase().includes(normalizedSearch) ?? false)
        );
      })
      .sort(sortItems);
  }, [
    db.items,
    form,
    normalizedSearch,
    selectedItems,
    selectedItemTypes,
    settings,
  ]);

  const canSave =
    selectedItems.length > 0 &&
    form.claim.trim().length > 0 &&
    (!isEditingExisting ||
      (targetCollectionOption !== undefined &&
        !targetCollectionOption.disabled));
  const canUndo =
    isEditingExisting &&
    hasEditorChanges(initialState, form, selectedItems, targetCollectionId);
  const isCompactPreview = selectedItems.length > 1;
  const hasSelectedTransmogName = selectedItems.some(
    (item) => (item.transmogName?.trim().length ?? 0) > 0,
  );
  const isBaseItemNameToggleDisabled =
    !hasSelectedTransmogName && !form.useBaseItemName;

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
    setSelectedItems((current) => selectCollectionItem(current, item));
  }

  function removeSelectedItem(itemId: number) {
    setSelectedItems((current) =>
      current.filter((selectedItem) => selectedItem.id !== itemId),
    );
  }

  function getActiveCatalogGroup(): MasterGroup {
    const targetGroup = catalogGroups.find(
      (catalogGroup) =>
        catalogGroup ===
        (activeCollection?.rootCategory ?? activeCollection?.category),
    );

    if (!targetGroup) {
      throw new Error("[Catalog] Unable to resolve collection category.");
    }

    return targetGroup;
  }

  async function refreshDb() {
    const targetGroup = getActiveCatalogGroup();
    const dadDbRef = await fetchHybridDadDbRef({
      category: targetGroup,
      source: "firestore",
    });

    setCatalogCategoryDb(targetGroup, hydrateDadDb(dadDbRef), "firestore");
  }

  function undoChanges() {
    setForm(initialState.form);
    setSelectedItems(initialState.selectedItems);
    setTargetCollectionId(initialState.targetCollectionId);
    setError(undefined);
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
      if (isEditingExisting && activeCollectionItem) {
        if (
          targetCollectionOption === undefined ||
          targetCollectionOption.disabled
        ) {
          throw new Error("[Catalog] Select a valid destination collection.");
        }

        if (targetCollectionId === activeCollection.id) {
          await updateCatalogCollectionItem(
            activeCollection.id,
            activeCollectionItem.id,
            collectionItem,
          );
        } else {
          await moveCatalogCollectionItem(
            activeCollection.id,
            activeCollectionItem.id,
            targetCollectionId,
            collectionItem,
          );
        }
      } else {
        await addCatalogCollectionItem(activeCollection.id, collectionItem);
      }
      await refreshDb();
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

  async function deleteCollectionItem() {
    if (!activeCollection || !activeCollectionItem) {
      return;
    }

    setDeleting(true);
    setError(undefined);

    try {
      await deleteCatalogCollectionItem(
        activeCollection.id,
        activeCollectionItem.id,
      );
      await refreshDb();
      setDeleteModalOpen(false);
      closeCollectionItemEditor();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete collection item.",
      );
    } finally {
      setDeleting(false);
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
              <div className={styles.Kicker}>
                {isEditingExisting ? "Edit Item" : "Add Item"}
              </div>
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
            <div
              className={classNames(styles.PreviewList, {
                [styles.PreviewListCompact]: isCompactPreview,
              })}
            >
              {selectedItems.length === 0 ? (
                <div className={styles.Preview}>
                  <div className={styles.PreviewImage}>
                    <FallbackLazyImage
                      wrapperClassName={styles.PreviewImageWrapper}
                      className={styles.PreviewImageAsset}
                      src={placeholder}
                      placeholderSrc={placeholder}
                      alt=""
                    />
                  </div>
                  <div className={styles.PreviewMeta}>
                    <div className={styles.PreviewName}>No item selected</div>
                    <div className={styles.PreviewTypeRow}>
                      <span className={styles.PreviewType}>Select an item</span>
                    </div>
                  </div>
                </div>
              ) : (
                selectedItems.map((item) => {
                  const previewTags = getItemPreviewTags(item);
                  const compactCharacterClass = isCompactPreview
                    ? getSingleUsableClass(item)
                    : undefined;

                  return (
                    <div
                      key={item.id}
                      className={classNames(styles.Preview, {
                        [styles.PreviewCompact]: isCompactPreview,
                      })}
                    >
                      <div className={styles.PreviewImage}>
                        <FallbackLazyImage
                          wrapperClassName={styles.PreviewImageWrapper}
                          className={styles.PreviewImageAsset}
                          placeholderSrc={placeholder}
                          src={getIcon(item.icon)}
                          alt={getItemDisplayName(item)}
                        />
                      </div>
                      <div className={styles.PreviewMeta}>
                        <div className={styles.PreviewName}>
                          {getItemDisplayName(item)}
                        </div>
                        <div className={styles.PreviewTypeRow}>
                          <span className={styles.PreviewType}>
                            {item.itemType.name}
                          </span>
                          {item.transmogName && (
                            <>
                              <span className={styles.PreviewTypeSeparator}>
                                |
                              </span>
                              <span className={styles.PreviewTransmogName}>
                                <img src={transmog} alt="" />
                                <span>{item.transmogName}</span>
                              </span>
                            </>
                          )}
                          {previewTags.length > 0 && (
                            <span className={styles.PreviewTags}>
                              {previewTags.map((tag) => (
                                <span
                                  key={tag.label}
                                  className={styles.PreviewTag}
                                >
                                  <img src={tag.icon} alt="" />
                                  <span>{tag.label}</span>
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                        {!isCompactPreview && (
                          <div className={styles.PreviewClasses}>
                            {enumKeys(CharacterClass)
                              .sort(
                                (a, b) => CharacterClass[a] - CharacterClass[b],
                              )
                              .map((characterClassKey) => {
                                const characterClass =
                                  CharacterClass[characterClassKey];
                                const isUsable = itemUsableBy(
                                  characterClass,
                                  item,
                                );

                                return (
                                  <span
                                    key={characterClass}
                                    className={
                                      isUsable
                                        ? styles.PreviewClassActive
                                        : styles.PreviewClass
                                    }
                                    title={
                                      i18n.characterClass[characterClass] ?? ""
                                    }
                                  >
                                    <img
                                      src={
                                        classIconMap.get(characterClass) ?? ""
                                      }
                                      alt={
                                        i18n.characterClass[characterClass] ??
                                        ""
                                      }
                                    />
                                  </span>
                                );
                              })}
                          </div>
                        )}
                      </div>
                      {compactCharacterClass !== undefined && (
                        <span
                          className={styles.PreviewCompactClassIcon}
                          title={
                            i18n.characterClass[compactCharacterClass] ?? ""
                          }
                        >
                          <img
                            src={classIconMap.get(compactCharacterClass) ?? ""}
                            alt={
                              i18n.characterClass[compactCharacterClass] ?? ""
                            }
                          />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {isEditingExisting && (
              <section className={styles.Section}>
                <label
                  className={styles.Label}
                  htmlFor="collection-item-target-collection"
                >
                  Collection
                </label>
                <select
                  id="collection-item-target-collection"
                  className={styles.Input}
                  value={targetCollectionId}
                  onChange={(event) =>
                    setTargetCollectionId(event.target.value)
                  }
                  required
                >
                  {collectionOptions.length === 0 && (
                    <option value="">No collections available</option>
                  )}
                  {collectionOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                      disabled={option.disabled}
                    >
                      {option.disabled
                        ? `${option.label} (contains subcollections)`
                        : option.label}
                    </option>
                  ))}
                </select>
              </section>
            )}

            {!isEditingExisting && (
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

                <label
                  className={styles.Label}
                  htmlFor="collection-item-search"
                >
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
            )}

            <section className={styles.Section}>
              <label className={styles.Label} htmlFor="collection-item-claim">
                Claim
              </label>
              <input
                id="collection-item-claim"
                className={styles.Input}
                value={form.claim}
                onChange={updateTextField("claim")}
                list="collection-item-claim-options"
                required
              />
              <datalist id="collection-item-claim-options">
                {claimOptions.map((claim) => (
                  <option key={claim} value={claim} />
                ))}
              </datalist>

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

              <div className={styles.FieldGrid}>
                <div>
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
                </div>

                <div>
                  <label
                    className={styles.Label}
                    htmlFor="collection-item-season"
                  >
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
                </div>
              </div>
            </section>

            <section className={styles.ToggleGrid}>
              <Toggle
                className={styles.Toggle}
                name="collection-item-out-of-rotation"
                label="Out of Rotation"
                flip={true}
                checked={form.outOfRotation}
                onChange={updateBooleanField("outOfRotation")}
              />
              <Toggle
                className={styles.Toggle}
                name="collection-item-premium"
                label="Premium"
                flip={true}
                checked={form.premium}
                onChange={updateBooleanField("premium")}
              />
              <Toggle
                className={styles.Toggle}
                name="collection-item-promotional"
                label="Promotional"
                flip={true}
                checked={form.promotional}
                onChange={updateBooleanField("promotional")}
              />
              <Toggle
                className={styles.Toggle}
                name="collection-item-unobtainable"
                label="Unobtainable"
                flip={true}
                checked={form.unobtainable}
                onChange={updateBooleanField("unobtainable")}
              />
              <Toggle
                className={styles.Toggle}
                name="collection-item-use-base-item-name"
                label="Use Base Item Name"
                flip={true}
                checked={form.useBaseItemName}
                disabled={isBaseItemNameToggleDisabled}
                onChange={updateBooleanField("useBaseItemName")}
              />
            </section>
          </div>

          <footer className={styles.Actions}>
            <div className={styles.ActionLeft}>
              {isEditingExisting && (
                <button
                  type="button"
                  className={styles.DeleteButton}
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={saving || deleting}
                >
                  Delete
                </button>
              )}
            </div>
            <div className={styles.ActionRight}>
              {error && <div className={styles.Error}>{error}</div>}
              {isEditingExisting && (
                <button
                  type="button"
                  className={styles.SecondaryButton}
                  onClick={undoChanges}
                  disabled={!canUndo || saving || deleting}
                >
                  Undo
                </button>
              )}
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
                disabled={!canSave || saving || deleting}
              >
                <span className={styles.SaveIcon}>
                  <Plus />
                </span>
                <span>{saving ? "Saving" : "Save"}</span>
              </button>
            </div>
          </footer>
        </form>
      </aside>
      {isDeleteModalOpen && activeCollectionItem && (
        <DeleteConfirmationModal
          title="Delete item"
          description="This will permanently remove this item from the catalogue collection."
          subject={getPreviewName(
            activeCollectionItem,
            activeCollectionItem.items[0],
          )}
          isDeleting={deleting}
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={deleteCollectionItem}
        />
      )}
    </div>
  );
}

export default CollectionItemEditor;
