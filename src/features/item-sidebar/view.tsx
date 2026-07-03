import classNames from "classnames";
import React, { useState } from "react";
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
import { DATA_REPO } from "../../services/config";
import {
  CharacterClass,
  Collection,
  CollectionItem,
  Item,
  MagicType,
  getDefaultItem,
  Zone,
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
import barbarian from "../../assets/images/classes/barbarian.webp";
import druid from "../../assets/images/classes/druid.webp";
import necromancer from "../../assets/images/classes/necromancer.webp";
import rogue from "../../assets/images/classes/rogue.webp";
import sorceress from "../../assets/images/classes/sorcerer.webp";
import spiritborn from "../../assets/images/classes/spiritborn.webp";
import paladin from "../../assets/images/classes/paladin.png";
import warlock from "../../assets/images/classes/warlock.webp";
import expansion from "../../assets/images/logo/d4ico_x1.png";
import unobtainable from "../../assets/images/miniico/mystery.webp";
import premium from "../../assets/images/miniico/purse.webp";
import season from "../../assets/images/miniico/season.webp";
import series from "../../assets/images/miniico/series.webp";
import oor from "../../assets/images/miniico/skull.webp";
import wardrobe from "../../assets/images/miniico/wardrobe.webp";
import salvage from "../../assets/images/icons/salvage.webp";
import fracturedPeaks from "../../assets/images/region/fractured_peaks.webp";
import drySteppes from "../../assets/images/region/dry_steppes.webp";
import kehjistan from "../../assets/images/region/kehjistan.webp";
import hawezar from "../../assets/images/region/hawezar.webp";
import scosglen from "../../assets/images/region/scosglen.webp";
import nahantu from "../../assets/images/region/nahantu.webp";
import { getPreferredClass, getPreferredGender } from "../settings/accessor";
import { useSettings } from "../settings/context";
import { isEnabled } from "../settings/predicate";
import { Option } from "../settings/type";
import { useEditor } from "../editor";
import { useData } from "../../services/data/context";
import { MasterGroup } from "../../shared/domain";
import styles from "./item-sidebar.module.css";

function usableBy(clazz: CharacterClass, dci: CollectionItem): boolean {
  return dci.items.some((di) => di.usableByClass?.[clazz] === 1);
}

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

const regionIconMap = new Map<Zone, string>([
  [Zone.FRACTURED_PEAKS, fracturedPeaks],
  [Zone.SCOSGLEN, scosglen],
  [Zone.HAWEZAR, hawezar],
  [Zone.KEHJISTAN, kehjistan],
  [Zone.DRY_STEPPES, drySteppes],
  [Zone.NAHANTU, nahantu],
]);

const magicTypeCssMap = new Map<MagicType, string>([
  [MagicType.COMMON, styles.ItemMagicTypeCommon],
  [MagicType.MAGIC, styles.ItemMagicTypeMagic],
  [MagicType.LEGENDARY, styles.ItemMagicTypeLegendary],
  [MagicType.UNIQUE, styles.ItemMagicTypeUnique],
  [MagicType.MYTHIC, styles.ItemMagicTypeMythic],
  [MagicType.RARE, styles.ItemMagicTypeRare],
]);

const magicTypeSortOrder = new Map<MagicType, number>([
  [MagicType.COMMON, 0],
  [MagicType.MAGIC, 1],
  [MagicType.RARE, 2],
  [MagicType.LEGENDARY, 3],
  [MagicType.UNIQUE, 4],
  [MagicType.MYTHIC, 5],
]);

function getMagicTypeSortRank(item: Item): number {
  return item.magicType === undefined
    ? Number.MAX_SAFE_INTEGER
    : magicTypeSortOrder.get(item.magicType as MagicType) ??
        Number.MAX_SAFE_INTEGER;
}

function getMagicTypeClassName(magicType: MagicType): string {
  return classNames(styles.ItemMagicType, magicTypeCssMap.get(magicType));
}

function renderMagicTypeLabel(magicType: MagicType): React.ReactNode {
  if (magicType === MagicType.COMMON) {
    return (
      <span className={getMagicTypeClassName(MagicType.MAGIC)}>Magic</span>
    );
  }

  return (
    <span className={getMagicTypeClassName(magicType)}>
      {i18n.magicType[magicType]}
    </span>
  );
}

function buildSalvageSourceItems(focusItem: Item): Item[] {
  const seen = new Set<string>();
  const hide = new Array<string>("(PH)", "[PH]", "[ph_", "(DNS)");

  return [focusItem, ...focusItem.similarItemsRefs]
    .filter((item) => item.salvageable === true)
    .filter((item) => item.name.trim().length > 0)
    .filter((item) => !hide.some((token) => item.name.includes(token)))
    .filter((item) => {
      const key = `${item.name}:${item.magicType ?? "none"}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort(
      (leftItem, rightItem) =>
        getMagicTypeSortRank(leftItem) - getMagicTypeSortRank(rightItem),
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
    [styles.Barbarian]: usableBy(CharacterClass.BARBARIAN, collectionItem),
    [styles.Druid]: usableBy(CharacterClass.DRUID, collectionItem),
    [styles.Necromancer]: usableBy(CharacterClass.NECROMANCER, collectionItem),
    [styles.Rogue]: usableBy(CharacterClass.ROGUE, collectionItem),
    [styles.Sorcerer]: usableBy(CharacterClass.SORCERER, collectionItem),
    [styles.Spiritborn]: usableBy(CharacterClass.SPIRITBORN, collectionItem),
    [styles.Paladin]: usableBy(CharacterClass.PALADIN, collectionItem),
    [styles.Warlock]: usableBy(CharacterClass.WARLOCK, collectionItem),
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
                src={salvage}
                alt=""
              />
              <span>
                Salvaged from{" "}
                {renderMagicTypeLabel(item.magicType as MagicType)} {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.ItemTags}>
        {collectionItem.items.some(isVesselOfHatredItem) && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={expansion} />
            <span>VoH Item</span>
          </div>
        )}
        {collectionItem.season && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={season} />
            <span>Season {collectionItem.season}</span>
          </div>
        )}
        {focusItem.series && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={series} />
            <span>{focusItem.series.replaceAll('"', "")}</span>
          </div>
        )}
        {collectionItem.premium && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={premium} />
            <span>Premium</span>
          </div>
        )}
        {collectionItem.items.some(doesHaveWardrobePlaceholder) && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={wardrobe} />
            <span>Wardrobe Icon</span>
          </div>
        )}
        {collectionItem.outOfRotation && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={oor} />
            <span>Out of Rotation</span>
          </div>
        )}
        {collectionItem.unobtainable && (
          <div className={styles.ItemTag}>
            <img className={styles.ItemTagIcon} src={unobtainable} />
            <span>Unobtainable</span>
          </div>
        )}
      </div>
      <div className={styles.ItemMeta}>
        <div>Item ID: {collectionItem.items.map((i) => i.id).join(", ")}</div>
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

export { ItemSidebar };
