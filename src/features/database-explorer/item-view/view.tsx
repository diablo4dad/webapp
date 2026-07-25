import classNames from "classnames";
import type { ReactNode } from "react";
import {
  CharacterClass,
  MagicType,
  Zone,
  type ItemRef,
  type ItemType,
} from "../../../services/data";
import { getIcon } from "../../../services/bucket";
import i18n from "../../../services/i18n";
import Card from "../../../shared/ui/Card";
import { ChevronLeft } from "../../../shared/ui/Icons";
import { FallbackLazyImage } from "../../../shared/ui/LazyLoadImageFallback";
import { classIconMap } from "../../../shared/domain/item-assets";
import { isMagicTypeNotSet } from "../../../shared/domain/magic-types";
import { enumKeys } from "../../../shared/lib/enums";
import { DatabaseItemOverrideEditor } from "../editor";
import type { EditorItem } from "../editor";
import styles from "./view.module.css";

type ItemViewItem = EditorItem & {
  itemTypeName: string;
};

type Props = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  item?: ItemViewItem;
  itemTypes?: ItemType[];
  jsonPreview: JsonPreviewState;
  onBackToList: () => void;
  onRefreshItems: () => void;
  onToggleJsonPreview: (filename: string) => void;
};

type DataminedFileCardProps = {
  filename: string;
  jsonPreview: JsonPreviewState;
  onToggleJsonPreview: (filename: string) => void;
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

const magicTypeClassMap = new Map<MagicType, string>([
  [MagicType.COMMON, styles.ViewMagicTypeCommon],
  [MagicType.MAGIC, styles.ViewMagicTypeMagic],
  [MagicType.LEGENDARY, styles.ViewMagicTypeLegendary],
  [MagicType.UNIQUE, styles.ViewMagicTypeUnique],
  [MagicType.MYTHIC, styles.ViewMagicTypeMythic],
  [MagicType.RARE, styles.ViewMagicTypeRare],
]);

function ItemView({
  canEditCatalog,
  isEditMode,
  item,
  itemTypes = [],
  jsonPreview,
  onBackToList,
  onRefreshItems,
  onToggleJsonPreview,
}: Props) {
  if (!item) {
    return (
      <div className={styles.View}>
        <MobileBackButton onBackToList={onBackToList} />
        <Card className={styles.ViewDetailCard}>
          <div className={styles.ViewEmptyDetail}>Select an item.</div>
        </Card>
      </div>
    );
  }

  const rawItem = item.item;

  return (
    <article className={styles.View}>
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
        <DataminedFileCard
          filename={rawItem.filename}
          jsonPreview={jsonPreview}
          onToggleJsonPreview={onToggleJsonPreview}
        />
      )}
      {canEditCatalog && isEditMode && (
        <DatabaseItemOverrideEditor
          item={item}
          itemTypes={itemTypes}
          onSaved={onRefreshItems}
        />
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

function DataminedFileCard({
  filename,
  jsonPreview,
  onToggleJsonPreview,
}: DataminedFileCardProps) {
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
            onClick={() => onToggleJsonPreview(filename)}
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
      return "\u21bb";
    case "idle":
      return "\u25b8";
    case "loaded":
      return "\u25be";
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

function getItemIconPath(iconId?: number): string {
  return `icons/${iconId && iconId > 0 ? iconId : 0}.webp`;
}

function getMagicTypeLabel(magicType?: number): string {
  if (isMagicTypeNotSet(magicType)) {
    return "Not Set";
  }

  return i18n.magicType[magicType as MagicType] ?? `Unknown (${magicType})`;
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

export { ItemView };
export type { ItemViewItem, JsonPreviewState };
