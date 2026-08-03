import classNames from "classnames";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getIcon } from "../../services/bucket";
import Card from "../../shared/ui/Card";
import { FallbackLazyImage } from "../../shared/ui/LazyLoadImageFallback";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "../ledger/context";
import { isItemCollected, isItemHidden } from "../ledger/predicate";
import { enumKeys } from "../../shared/lib/enums";
import { hashCode } from "../../shared/lib/hash";
import Toggle from "../../shared/ui/Toggle";
import { DATA_REPO } from "../../config";
import {
  CharacterClass,
  Collection,
  CollectionItem,
  ItemQuality,
  getDefaultItem,
} from "../../services/data";
import {
  getClassIconVariant,
  getClassItemVariant,
  getIconVariants,
  getItemIds,
  getItemName,
  getItemType,
} from "../../services/data/getters";
import {
  doesHaveWardrobePlaceholder,
  hasIconVariants,
  hasItemVariation,
  isVesselOfHatredItem,
} from "../../services/data/predicates";
import i18n, { getItemDescription } from "../../services/i18n";
import { getPreferredClass, getPreferredGender } from "../settings/accessor";
import { useSettings } from "../settings/context";
import { isEnabled } from "../settings/predicate";
import { Option } from "../settings/type";
import { useEditor } from "../editor";
import { useData } from "../../services/data/context";
import { MasterGroup } from "../../shared/domain";
import {
  classIconMap,
  itemTagIcons,
  regionIconMap,
} from "../../shared/domain/item-assets";
import { buildSalvageSourceItems, isUsableBy } from "./view-model";
import styles from "./item-sidebar.module.css";

type ItemProps = {
  className?: string;
  collection?: Collection;
  collectionItem: CollectionItem;
};

const classIconCssMap = new Map<CharacterClass, string>([
  [CharacterClass.BARBARIAN, styles.BarbarianClassIcon],
  [CharacterClass.DRUID, styles.DruidClassIcon],
  [CharacterClass.ROGUE, styles.RogueClassIcon],
  [CharacterClass.SORCERER, styles.SorcererClassIcon],
  [CharacterClass.NECROMANCER, styles.NecromancerClassIcon],
  [CharacterClass.SPIRITBORN, styles.SpiritbornClassIcon],
  [CharacterClass.PALADIN, styles.PaladinClassIcon],
  [CharacterClass.WARLOCK, styles.WarlockClassIcon],
]);

const itemQualityCssMap = new Map<ItemQuality, string>([
  [ItemQuality.TRANSMOG, styles.ItemQualityTransmog],
  [ItemQuality.JUNK, styles.ItemQualityJunk],
  [ItemQuality.COMMON, styles.ItemQualityCommon],
  [ItemQuality.MAGIC, styles.ItemQualityMagic],
  [ItemQuality.LEGENDARY, styles.ItemQualityLegendary],
  [ItemQuality.UNIQUE, styles.ItemQualityUnique],
  [ItemQuality.MYTHIC, styles.ItemQualityMythic],
  [ItemQuality.ICONIC_MYTHIC, styles.ItemQualityMythic],
  [ItemQuality.RARE, styles.ItemQualityRare],
]);

function getItemQualityClassName(itemQuality: ItemQuality): string {
  return classNames(styles.ItemQuality, itemQualityCssMap.get(itemQuality));
}

function renderItemQualityLabel(itemQuality: ItemQuality): React.ReactNode {
  if (itemQuality === ItemQuality.COMMON) {
    return (
      <span className={getItemQualityClassName(ItemQuality.MAGIC)}>Magic</span>
    );
  }

  return (
    <span className={getItemQualityClassName(itemQuality)}>
      {i18n.itemQuality[itemQuality]}
    </span>
  );
}

function ItemSidebar({ collection, collectionItem, className }: ItemProps) {
  const log = useCollection();
  const dispatcher = useCollectionDispatch();
  const settings = useSettings();
  const { group } = useData();
  const { canEditCatalog, isEditMode, openCollectionItemEditor } = useEditor();

  // preferences
  const preferredClass = getPreferredClass(settings);
  const preferredGender = getPreferredGender(settings);

  // state
  const [focusClass, setFocusClass] = useState(preferredClass);
  const [hoverClass, setHoverClass] = useState<CharacterClass | null>(null);

  // computed values
  const itemIds = getItemIds(collectionItem);
  const focusItem =
    getClassItemVariant(collectionItem, hoverClass ?? focusClass) ??
    getDefaultItem(collectionItem);
  const focusIcon =
    getClassIconVariant(focusItem, hoverClass ?? focusClass, preferredGender) ??
    focusItem.icon;
  const salvageSourceItems = buildSalvageSourceItems(focusItem);
  const hasClassVariation = (characterClass: CharacterClass) =>
    hasItemVariation(collectionItem, characterClass) ||
    hasIconVariants(focusItem);
  const shouldShowEditButton =
    canEditCatalog &&
    isEditMode &&
    group !== MasterGroup.UNIVERSAL &&
    collection !== undefined &&
    collectionItem.id !== -1;

  const classNameStr = classNames({
    [styles.Block]: true,
    [styles.Barbarian]: isUsableBy(CharacterClass.BARBARIAN, collectionItem),
    [styles.Druid]: isUsableBy(CharacterClass.DRUID, collectionItem),
    [styles.Necromancer]: isUsableBy(
      CharacterClass.NECROMANCER,
      collectionItem,
    ),
    [styles.Rogue]: isUsableBy(CharacterClass.ROGUE, collectionItem),
    [styles.Sorcerer]: isUsableBy(CharacterClass.SORCERER, collectionItem),
    [styles.Spiritborn]: isUsableBy(CharacterClass.SPIRITBORN, collectionItem),
    [styles.Paladin]: isUsableBy(CharacterClass.PALADIN, collectionItem),
    [styles.Warlock]: isUsableBy(CharacterClass.WARLOCK, collectionItem),
    [className ?? ""]: true,
  });

  const itemClassCss = (characterClass: CharacterClass) => {
    return classNames({
      [styles.ItemClass]: true,
      [styles.ItemClassActive]: focusClass === characterClass,
      [styles.ItemClassVariant]: hasClassVariation(characterClass),
    });
  };

  const itemClassIconCss = (characterClass: CharacterClass) => {
    return classNames({
      [styles.ItemClassIcon]: true,
      [classIconCssMap.get(characterClass) ?? ""]: true,
    });
  };

  // handlers
  const handleIconClick = (clazz: CharacterClass) => () => setFocusClass(clazz);
  const handleIconHover = (clazz: CharacterClass) => () => setHoverClass(clazz);
  const handleIconLeave = () => setHoverClass(null);

  return (
    <Card className={classNameStr}>
      {shouldShowEditButton && collection && (
        <button
          type="button"
          className={styles.EditButton}
          onClick={() => openCollectionItemEditor(collection, collectionItem)}
        >
          Edit
        </button>
      )}
      <div className={styles.ItemHeader}>
        <div className={styles.ItemHeading}>
          <div className={styles.ItemTitle}>
            <span>{getItemName(collectionItem, focusItem)}</span>
          </div>
          <div className={styles.ItemType}>
            <span>{getItemType(collectionItem, focusItem)}</span>
          </div>
        </div>
        <FallbackLazyImage
          className={styles.ItemImage}
          src={getIcon(focusIcon)}
          alt={getItemName(collectionItem, focusItem)}
        />
      </div>
      <div className={styles.ItemClasses}>
        {enumKeys(CharacterClass)
          .sort((a, b) => CharacterClass[a] - CharacterClass[b])
          .map((cc) => {
            const v = CharacterClass[cc];
            return (
              <span key={v} className={itemClassCss(v)}>
                <img
                  className={itemClassIconCss(v)}
                  onClick={handleIconClick(v)}
                  onMouseEnter={handleIconHover(v)}
                  onMouseLeave={handleIconLeave}
                  src={classIconMap.get(v) ?? ""}
                  alt={i18n.characterClass[v] ?? ""}
                />
              </span>
            );
          })}
      </div>
      <div className={styles.ItemActions}>
        <Toggle
          className={styles.ItemAction}
          name="collected"
          checked={isItemCollected(log, itemIds)}
          disabled={isItemHidden(log, itemIds)}
          onChange={(e) =>
            dispatcher({
              type: CollectionActionType.COLLECT,
              itemId: itemIds,
              toggle: e.target.checked,
            })
          }
          label={"Collected"}
        />
        <Toggle
          className={styles.ItemAction}
          name="hidden"
          checked={isItemHidden(log, itemIds)}
          color="red"
          onChange={(e) =>
            dispatcher({
              type: CollectionActionType.HIDE,
              itemId: itemIds,
              toggle: e.target.checked,
            })
          }
          label={"Excluded"}
        />
      </div>
      <div className={styles.ItemLocations}>
        <div className={styles.ItemLocation}>
          <div className={styles.ItemLocationInfo}>
            <div className={styles.ItemLocationDescription}>
              <span>{getItemDescription(collectionItem)}</span>
            </div>
            <div className={styles.ItemLocationCategory}>
              <span>{collectionItem.claim}</span>
            </div>
          </div>
          {collectionItem.claimZone !== undefined && (
            <img
              hidden={true}
              className={styles.ItemLocationIcon}
              src={regionIconMap.get(collectionItem.claimZone)}
              alt={i18n.region[collectionItem.claimZone]}
            />
          )}
        </div>
      </div>
      {salvageSourceItems.length > 0 && (
        <div className={styles.ItemSalvageSources}>
          {salvageSourceItems.map((item) => (
            <div key={item.id} className={styles.ItemSalvageSource}>
              <img
                className={styles.ItemSalvageSourceIcon}
                src={itemTagIcons.salvage}
                alt=""
              />
              <span>
                Salvaged from{" "}
                {renderItemQualityLabel(item.itemQuality as ItemQuality)} {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.ItemTags}>
        {collectionItem.items.some(isVesselOfHatredItem) && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={itemTagIcons.expansion} />
            <span>VoH Item</span>
          </div>
        )}
        {collectionItem.season && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={itemTagIcons.season} />
            <span>Season {collectionItem.season}</span>
          </div>
        )}
        {focusItem.series && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={itemTagIcons.series} />
            <span>{focusItem.series.replaceAll('"', "")}</span>
          </div>
        )}
        {collectionItem.premium && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={itemTagIcons.premium} />
            <span>Premium</span>
          </div>
        )}
        {collectionItem.items.some(doesHaveWardrobePlaceholder) && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={itemTagIcons.wardrobe} />
            <span>Wardrobe Icon</span>
          </div>
        )}
        {collectionItem.outOfRotation && (
          <div className={styles.ItemTag}>
            <img
              className={styles.ItemTagIcon}
              src={itemTagIcons.outOfRotation}
            />
            <span>Out of Rotation</span>
          </div>
        )}
        {collectionItem.unobtainable && (
          <div className={styles.ItemTag}>
            <img
              className={styles.ItemTagIcon}
              src={itemTagIcons.unobtainable}
            />
            <span>Unobtainable</span>
          </div>
        )}
      </div>
      <div className={styles.ItemMeta}>
        <div>
          Item ID: <ItemIdLinks itemIds={itemIds} />
        </div>
        {isEnabled(settings, Option.DEBUG) && (
          <>
            {collectionItem.items.length > 1 && (
              <div>
                Item Hash: {hashCode(collectionItem.items.map((i) => i.id))}
              </div>
            )}
            <div>Item Icon: {focusItem.icon.replace("icons/", "")}</div>
            {collectionItem.items.map((i) => (
              <div key={i.id}>
                <div>
                  Datamined File:{" "}
                  <a href={`${DATA_REPO}/${i.filename}.json`} target={"_blank"}>
                    {i.filename?.replace("base/meta/", "")}
                  </a>
                </div>
                {hasIconVariants(focusItem) && (
                  <ul>
                    {getIconVariants(focusItem, preferredGender).map(
                      ([charClass, icon]) => (
                        <li key={charClass}>
                          {i18n.characterClass[charClass]} Icon: {icon}
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  );
}

function ItemIdLinks({ itemIds }: { itemIds: number[] }) {
  return itemIds.map((itemId, index) => (
    <React.Fragment key={itemId}>
      {index > 0 && ", "}
      <Link
        aria-label={`View database item ${itemId}`}
        className={styles.ItemDatabaseLink}
        state={{ resetDatabaseScroll: true }}
        to={`/database/${itemId}`}
      >
        {itemId}
      </Link>
    </React.Fragment>
  ));
}

export { ItemSidebar };
