import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CharacterClass,
  MagicType,
  type ItemRef,
  type ItemType,
} from "../../../services/data";
import {
  upsertCatalogItem,
  type CatalogItemDoc,
} from "../../../services/store/catalog";
import i18n from "../../../services/i18n";
import { getIcon } from "../../../services/bucket";
import { enumKeys } from "../../../shared/lib/enums";
import Button, { BtnColours } from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import { Close } from "../../../shared/ui/Icons";
import Toggle from "../../../shared/ui/Toggle";
import {
  importDatabaseItemFromUrl,
  readFileAsDataUrl,
  uploadCatalogItemIconDataUrl,
} from "./api";
import {
  STANDALONE_INITIAL_FORM,
  applyImportedItemDraft,
  buildOverrideWrite,
  buildStandaloneWrite,
  createOverrideForm,
  type OverrideItemFormState,
  type StandaloneItemFormState,
} from "./state";
import drawerStyles from "../../editor/collection-item-editor.module.css";
import styles from "./view.module.css";

type EditorItem = {
  catalogItem?: CatalogItemDoc;
  item: ItemRef;
  staticItem?: ItemRef;
};

type OverrideProps = {
  item: EditorItem;
  itemTypes: ItemType[];
  onSaved: () => void;
};

type CreatorProps = {
  existingItemIds?: Iterable<number>;
  itemTypes: ItemType[];
  onSaved: (itemId: number) => void;
  triggerClassName?: string;
  triggerLabel?: string;
};

type TextInputProps = {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
  autoComplete?: string;
  list?: string;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  type?: string;
};

type SelectOption = {
  label: string;
  value: string;
};

type SelectInputProps = {
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  value: string;
  emptyLabel?: string;
  required?: boolean;
};

type UsableByClassInputProps = {
  idPrefix: string;
  onChange: (value: number[]) => void;
  value: number[];
  isTwoColumnGrid?: boolean;
  isOverrideEnabled?: boolean;
  onOverrideEnabledChange?: (isEnabled: boolean) => void;
};

type CharacterClassChoice = {
  label: string;
  value: CharacterClass;
};

const MAGIC_TYPE_CHOICES: SelectOption[] = [
  MagicType.COMMON,
  MagicType.MAGIC,
  MagicType.RARE,
  MagicType.LEGENDARY,
  MagicType.UNIQUE,
  MagicType.MYTHIC,
].map((magicType) => ({
  label: i18n.magicType[magicType],
  value: String(magicType),
}));
const CHARACTER_CLASS_CHOICES: CharacterClassChoice[] = enumKeys(
  CharacterClass,
).map((characterClassKey) => {
  const characterClass = CharacterClass[characterClassKey];

  return {
    label: i18n.characterClass[characterClass],
    value: characterClass,
  };
});

function DatabaseItemOverrideEditor({
  item,
  itemTypes,
  onSaved,
}: OverrideProps) {
  const [form, setForm] = useState<OverrideItemFormState>(
    () => createOverrideForm(item.catalogItem, item.item),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>();
  const itemTypeChoices = useMemo(
    () => getItemTypeChoices(itemTypes),
    [itemTypes],
  );
  const iconPreviewUrl = getFormIconPreviewUrl(form);

  useEffect(() => {
    setForm(createOverrideForm(item.catalogItem, item.item));
    setError(undefined);
    setIsSaving(false);
    setIsUploading(false);
  }, [item.catalogItem, item.item]);

  function updateForm<TField extends keyof OverrideItemFormState>(
    field: TField,
    value: OverrideItemFormState[TField],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function saveOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);

    try {
      await upsertCatalogItem(
        buildOverrideWrite(item.item.id, form, item.catalogItem),
      );
      onSaved();
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to save item override."));
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadIcon(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(undefined);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const result = await uploadCatalogItemIconDataUrl(dataUrl);

      setForm((currentForm) => ({
        ...currentForm,
        icon: String(result.iconId),
        iconPreviewUrl: dataUrl,
      }));
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Failed to upload icon."));
    } finally {
      setIsUploading(false);
    }
  }

  function clearIcon() {
    setForm((currentForm) => ({
      ...currentForm,
      icon: "",
      iconPreviewUrl: "",
    }));
  }

  return (
    <Card className={styles.ViewPanel}>
      <form className={styles.ViewForm} onSubmit={saveOverride}>
        <div className={styles.ViewHeader}>
          <div>
            <div className={styles.ViewKicker}>Database Item Override</div>
            <h3 className={styles.ViewTitle}>{item.item.name || item.item.id}</h3>
          </div>
          <span className={styles.ViewStatus}>
            {item.staticItem ? "Static item" : "Database item"}
          </span>
        </div>
        <section className={styles.ViewIconSection}>
          <div className={styles.ViewIconPreview}>
            {iconPreviewUrl ? (
              <img
                alt={
                  form.name
                    ? `${form.name} icon override`
                    : "Item icon override"
                }
                src={iconPreviewUrl}
              />
            ) : (
              <span>No icon override</span>
            )}
          </div>
          <div className={styles.ViewIconActions}>
            <label
              className={`${drawerStyles.SecondaryButton} ${styles.ViewFileAction}`}
            >
              <span>{isUploading ? "Uploading icon" : "Upload icon"}</span>
              <input
                accept="image/*"
                disabled={isSaving || isUploading}
                type="file"
                onChange={uploadIcon}
              />
            </label>
            <button
              className={`${drawerStyles.DeleteButton} ${styles.ViewIconActionButton}`}
              disabled={
                isSaving ||
                isUploading ||
                (form.icon.length === 0 && form.iconPreviewUrl.length === 0)
              }
              type="button"
              onClick={clearIcon}
            >
              Clear icon
            </button>
          </div>
        </section>
        <section className={styles.ViewEditorGrid}>
          <div className={styles.ViewFieldStack}>
            <TextInput
              id="database-item-override-name"
              label="Name"
              value={form.name}
              onChange={(value) => updateForm("name", value)}
            />
            <TextInput
              id="database-item-override-series"
              label="Series"
              value={form.series}
              onChange={(value) => updateForm("series", value)}
            />
            <TextInput
              id="database-item-override-transmog-name"
              label="Transmog Name"
              value={form.transmogName}
              onChange={(value) => updateForm("transmogName", value)}
            />
          </div>
          <div className={styles.ViewFieldStack}>
            <SelectInput
              id="database-item-override-type"
              label="Item Type"
              options={itemTypeChoices}
              value={form.itemType}
              onChange={(value) => updateForm("itemType", value)}
              emptyLabel="No override"
            />
            <SelectInput
              id="database-item-override-quality"
              label="Item Quality"
              options={MAGIC_TYPE_CHOICES}
              value={form.magicType}
              onChange={(value) => updateForm("magicType", value)}
              emptyLabel="No override"
            />
          </div>
        </section>
        <UsableByClassInput
          idPrefix="database-item-override-usable"
          isOverrideEnabled={form.hasUsableByClassOverride}
          value={form.usableByClass}
          onChange={(value) => updateForm("usableByClass", value)}
          onOverrideEnabledChange={(value) =>
            updateForm("hasUsableByClassOverride", value)
          }
        />
        <label
          className={styles.ViewField}
          htmlFor="database-item-override-description"
        >
          <span className={styles.ViewLabel}>Description</span>
          <textarea
            id="database-item-override-description"
            className={`${styles.ViewTextArea} ${styles.ViewDescription}`}
            value={form.description}
            onChange={(event) =>
              updateForm("description", event.target.value)}
            rows={4}
          />
        </label>
        <FormActions
          error={error}
          isSaving={isSaving}
          onReset={() =>
            setForm(createOverrideForm(item.catalogItem, item.item))
          }
          saveLabel="Save override"
        />
      </form>
    </Card>
  );
}

function DatabaseItemCreator({
  existingItemIds = [],
  itemTypes,
  onSaved,
  triggerClassName,
  triggerLabel = "Add +",
}: CreatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<StandaloneItemFormState>(
    STANDALONE_INITIAL_FORM,
  );
  const [importUrl, setImportUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>();
  const isBusy = isSaving || isImporting || isUploading;
  const itemTypeChoices = useMemo(
    () => getItemTypeChoices(itemTypes),
    [itemTypes],
  );

  function updateForm<TField extends keyof StandaloneItemFormState>(
    field: TField,
    value: StandaloneItemFormState[TField],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(undefined);

    try {
      const catalogItem = buildStandaloneWrite(form, { existingItemIds });
      await upsertCatalogItem(catalogItem);
      setForm(STANDALONE_INITIAL_FORM);
      setImportUrl("");
      setIsOpen(false);
      onSaved(catalogItem.itemId);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to save catalog item."));
    } finally {
      setIsSaving(false);
    }
  }

  async function importItem() {
    setIsImporting(true);
    setError(undefined);

    try {
      const draft = await importDatabaseItemFromUrl(importUrl);
      let nextForm = applyImportedItemDraft(form, draft, itemTypes);

      if (draft.icon?.dataUrl) {
        const icon = await uploadCatalogItemIconDataUrl(draft.icon.dataUrl);
        nextForm = {
          ...nextForm,
          icon: String(icon.iconId),
          iconPreviewUrl: draft.icon.dataUrl,
        };
      }

      setForm(nextForm);
    } catch (importError) {
      setError(getErrorMessage(importError, "Failed to import item from URL."));
    } finally {
      setIsImporting(false);
    }
  }

  async function uploadIcon(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);
    setError(undefined);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const icon = await uploadCatalogItemIconDataUrl(dataUrl);

      setForm((currentForm) => ({
        ...currentForm,
        icon: String(icon.iconId),
        iconPreviewUrl: dataUrl,
      }));
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Failed to upload icon."));
    } finally {
      setIsUploading(false);
    }
  }

  function closeDrawer() {
    if (!isBusy) {
      setIsOpen(false);
    }
  }

  function resetForm() {
    setForm(STANDALONE_INITIAL_FORM);
    setImportUrl("");
  }

  function clearIcon() {
    setForm((currentForm) => ({
      ...currentForm,
      icon: "",
      iconPreviewUrl: "",
    }));
  }

  return (
    <>
      <Button
        colour={BtnColours.Green}
        className={triggerClassName ?? styles.ViewHeaderButton}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        {triggerLabel}
      </Button>
      {isOpen && (
        <div className={styles.ViewOverlay} onClick={closeDrawer}>
          <aside
            aria-labelledby="database-item-create-title"
            aria-modal="true"
            className={styles.ViewDrawer}
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <form className={styles.ViewDrawerForm} onSubmit={saveItem}>
              <header className={drawerStyles.Header}>
                <div className={drawerStyles.HeaderText}>
                  <div className={drawerStyles.Kicker}>Database Explorer</div>
                  <h2
                    className={drawerStyles.Title}
                    id="database-item-create-title"
                  >
                    New Database item
                  </h2>
                </div>
                <button
                  aria-label="Close item creator"
                  className={drawerStyles.CloseButton}
                  disabled={isBusy}
                  type="button"
                  onClick={closeDrawer}
                >
                  <Close />
                </button>
              </header>
              <div className={styles.ViewDrawerBody}>
                <section className={styles.ViewSection}>
                  <TextInput
                    id="database-item-import-url"
                    label="Import URL"
                    value={importUrl}
                    onChange={setImportUrl}
                    placeholder="https://.../diablo-4/item/..."
                  />
                  <button
                    className={styles.ViewSecondaryButton}
                    disabled={
                      isSaving ||
                      isImporting ||
                      importUrl.trim().length === 0
                    }
                    type="button"
                    onClick={importItem}
                  >
                    {isImporting ? "Importing" : "Import from URL"}
                  </button>
                </section>
                <section className={styles.ViewIconSection}>
                  <div className={styles.ViewIconPreview}>
                    {form.iconPreviewUrl ? (
                      <img
                        alt={form.name ? `${form.name} icon` : "Item icon"}
                        src={form.iconPreviewUrl}
                      />
                    ) : (
                      <span>No icon selected</span>
                    )}
                  </div>
                  <div className={styles.ViewIconActions}>
                    <label
                      className={`${drawerStyles.SecondaryButton} ${styles.ViewFileAction}`}
                    >
                      <span>
                        {isUploading ? "Uploading icon" : "Upload icon"}
                      </span>
                      <input
                        accept="image/*"
                        disabled={isSaving || isUploading}
                        type="file"
                        onChange={uploadIcon}
                      />
                    </label>
                    <button
                      className={`${drawerStyles.DeleteButton} ${styles.ViewIconActionButton}`}
                      disabled={
                        isSaving ||
                        isUploading ||
                        (form.icon.length === 0 &&
                          form.iconPreviewUrl.length === 0)
                      }
                      type="button"
                      onClick={clearIcon}
                    >
                      Clear icon
                    </button>
                  </div>
                </section>
                <section className={styles.ViewStandaloneIdRow}>
                  <TextInput
                    id="database-item-id"
                    label="Item ID"
                    value={form.itemId}
                    onChange={() => undefined}
                    readOnly={true}
                  />
                </section>
                <section className={styles.ViewEditorGrid}>
                  <div className={styles.ViewFieldStack}>
                    <TextInput
                      id="database-item-name"
                      label="Name"
                      value={form.name}
                      onChange={(value) => updateForm("name", value)}
                      required={true}
                    />
                    <TextInput
                      id="database-item-series"
                      label="Series"
                      value={form.series}
                      onChange={(value) => updateForm("series", value)}
                    />
                    <TextInput
                      id="database-item-transmog-name"
                      label="Transmog Name"
                      value={form.transmogName}
                      onChange={(value) => updateForm("transmogName", value)}
                    />
                  </div>
                  <div className={styles.ViewFieldStack}>
                    <SelectInput
                      id="database-item-type"
                      label="Item Type"
                      options={itemTypeChoices}
                      value={form.itemType}
                      onChange={(value) => updateForm("itemType", value)}
                      emptyLabel="Select item type"
                      required={true}
                    />
                    <SelectInput
                      id="database-item-quality"
                      label="Item Quality"
                      options={MAGIC_TYPE_CHOICES}
                      value={form.magicType}
                      onChange={(value) => updateForm("magicType", value)}
                      emptyLabel="Not set"
                    />
                  </div>
                </section>
                <UsableByClassInput
                  idPrefix="database-item-usable"
                  isTwoColumnGrid={true}
                  value={form.usableByClass}
                  onChange={(value) => updateForm("usableByClass", value)}
                />
                <label
                  className={styles.ViewField}
                  htmlFor="database-item-description"
                >
                  <span className={styles.ViewLabel}>Description</span>
                  <textarea
                    id="database-item-description"
                    className={`${styles.ViewTextArea} ${styles.ViewDescription}`}
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)}
                    rows={4}
                  />
                </label>
              </div>
              <footer className={drawerStyles.Actions}>
                <div className={drawerStyles.ActionLeft} />
                <div className={drawerStyles.ActionRight}>
                  {error && <div className={drawerStyles.Error}>{error}</div>}
                  <button
                    className={drawerStyles.SecondaryButton}
                    disabled={isSaving}
                    type="button"
                    onClick={resetForm}
                  >
                    Reset
                  </button>
                  <button
                    className={drawerStyles.SecondaryButton}
                    disabled={isBusy}
                    type="button"
                    onClick={closeDrawer}
                  >
                    Close
                  </button>
                  <button
                    className={drawerStyles.SaveButton}
                    disabled={isSaving}
                    type="submit"
                  >
                    {isSaving ? "Saving" : "Save item"}
                  </button>
                </div>
              </footer>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

function TextInput({
  autoComplete = "off",
  id,
  label,
  list,
  onChange,
  placeholder,
  readOnly = false,
  required = false,
  type = "text",
  value,
}: TextInputProps) {
  const inputClassName = readOnly
    ? `${styles.ViewInput} ${styles.ViewInputReadOnly}`
    : styles.ViewInput;

  return (
    <label className={styles.ViewField} htmlFor={id}>
      <span className={styles.ViewLabel}>{label}</span>
      <input
        id={id}
        autoComplete={autoComplete}
        aria-readonly={readOnly}
        className={inputClassName}
        list={list}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectInput({
  emptyLabel = "Select value",
  id,
  label,
  onChange,
  options,
  required = false,
  value,
}: SelectInputProps) {
  return (
    <label className={styles.ViewField} htmlFor={id}>
      <span className={styles.ViewLabel}>{label}</span>
      <select
        id={id}
        className={styles.ViewInput}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function UsableByClassInput({
  idPrefix,
  isOverrideEnabled,
  isTwoColumnGrid = false,
  onChange,
  onOverrideEnabledChange,
  value,
}: UsableByClassInputProps) {
  const hasOverrideControl = onOverrideEnabledChange !== undefined;
  const isDisabled = hasOverrideControl && !isOverrideEnabled;

  return (
    <fieldset className={styles.ViewClassFieldset}>
      <legend className={styles.ViewClassLegend}>Usable by Class</legend>
      {hasOverrideControl && (
        <Toggle
          checked={isOverrideEnabled ?? false}
          className={styles.ViewClassToggle}
          flip={true}
          label="Override usable classes"
          name={`${idPrefix}-override`}
          onChange={(event) =>
            onOverrideEnabledChange(event.target.checked)}
        />
      )}
      <div
        className={
          isTwoColumnGrid
            ? `${styles.ViewClassGrid} ${styles.ViewClassGridTwoColumn}`
            : styles.ViewClassGrid
        }
      >
        {CHARACTER_CLASS_CHOICES.map((option) => (
          <Toggle
            key={option.value}
            checked={value[option.value] === 1}
            className={styles.ViewClassToggle}
            disabled={isDisabled}
            flip={true}
            label={option.label}
            name={`${idPrefix}-${option.value}`}
            onChange={(event) =>
              onChange(
                setUsableByClassValue(
                  value,
                  option.value,
                  event.target.checked,
                ),
              )}
          />
        ))}
      </div>
    </fieldset>
  );
}

function FormActions({
  error,
  isSaving,
  onReset,
  saveLabel,
}: {
  error?: string;
  isSaving: boolean;
  onReset: () => void;
  saveLabel: string;
}) {
  return (
    <div className={styles.ViewActions}>
      {error && <div className={styles.ViewError}>{error}</div>}
      <button
        className={styles.ViewSecondaryButton}
        disabled={isSaving}
        type="button"
        onClick={onReset}
      >
        Reset
      </button>
      <button
        className={styles.ViewPrimaryButton}
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? "Saving" : saveLabel}
      </button>
    </div>
  );
}

function setUsableByClassValue(
  value: readonly number[],
  characterClass: CharacterClass,
  isChecked: boolean,
): number[] {
  const nextValue = CHARACTER_CLASS_CHOICES.map((option) =>
    value[option.value] === 1 ? 1 : 0,
  );
  nextValue[characterClass] = isChecked ? 1 : 0;

  return nextValue;
}

function getItemTypeChoices(itemTypes: ItemType[]): SelectOption[] {
  return itemTypes
    .map((itemType) => ({
      label: itemType.name,
      value: String(itemType.id),
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

function getFormIconPreviewUrl({
  icon,
  iconPreviewUrl,
}: Pick<OverrideItemFormState, "icon" | "iconPreviewUrl">): string | undefined {
  if (iconPreviewUrl) {
    return iconPreviewUrl;
  }

  const iconId = Number(icon);

  return Number.isInteger(iconId) && iconId > 0
    ? getIcon(`icons/${iconId}.webp`)
    : undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export {
  DatabaseItemCreator,
  DatabaseItemOverrideEditor,
};
export type { EditorItem };
