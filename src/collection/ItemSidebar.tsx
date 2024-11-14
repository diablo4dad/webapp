import classNames from "classnames";
import React, { useState } from "react";
import { getIcon } from "../bucket";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "./context";
import { isItemCollected, isItemHidden } from "./predicate";
import { enumKeys } from "../common/enums";
import { hashCode } from "../common/hash";
import { DiscordInvite } from "../components/DiscordPanel";
import Toggle from "../components/Toggle";
import { VersionInfo } from "../components/VersionPanel";
import { DATA_REPO } from "../config";
import { CharacterClass, CollectionItem, getDefaultItem, Zone } from "../data";
import {
  getClassIconVariant,
  getClassItemVariant,
  getIconVariants,
  getItemIds,
  getItemName,
  getItemType,
} from "../data/getters";
import {
  doesHaveWardrobePlaceholder,
  hasIconVariants,
  hasItemVariation,
  isVesselOfHatredItem,
} from "../data/predicates";
import i18n, { getItemDescription } from "../i18n";
import barbarian from "../image/classes/barbarian.webp";
import druid from "../image/classes/druid.webp";
import necromancer from "../image/classes/necromancer.webp";
import rogue from "../image/classes/rogue.webp";
import sorceress from "../image/classes/sorcerer.webp";
import spiritborn from "../image/classes/spiritborn.webp";
import expansion from "../image/logo/d4ico_x1.png";
import unobtainable from "../image/miniico/mystery.webp";
import premium from "../image/miniico/purse.webp";
import season from "../image/miniico/season.webp";
import series from "../image/miniico/series.webp";
import oor from "../image/miniico/skull.webp";
import wardrobe from "../image/miniico/wardrobe.webp";
import fracturedPeaks from "../image/region/fractured_peaks.webp";
import drySteppes from "../image/region/dry_steppes.webp";
import kehjistan from "../image/region/kehjistan.webp";
import hawezar from "../image/region/hawezar.webp";
import scosglen from "../image/region/scosglen.webp";
import nahantu from "../image/region/nahantu.webp";
import styles from "./ItemSidebar.module.css";
import { getPreferredClass, getPreferredGender } from "../settings/accessor";
import { useSettings } from "../settings/context";
import { isEnabled } from "../settings/predicate";
import { Option } from "../settings/type";

function usableBy(clazz: CharacterClass, dci: CollectionItem): boolean {
  return dci.items.some((di) => di.usableByClass?.[clazz] === 1 ?? false);
}

type ItemProps = {
  className?: string;
  collectionItem: CollectionItem;
};

const classIconCssMap = new Map<CharacterClass, string>([
  [CharacterClass.BARBARIAN, styles.BarbarianClassIcon],
  [CharacterClass.DRUID, styles.DruidClassIcon],
  [CharacterClass.ROGUE, styles.RogueClassIcon],
  [CharacterClass.SORCERER, styles.SorcererClassIcon],
  [CharacterClass.NECROMANCER, styles.NecromancerClassIcon],
  [CharacterClass.SPIRITBORN, styles.SpiritbornClassIcon],
]);

const classIconMap = new Map<CharacterClass, string>([
  [CharacterClass.BARBARIAN, barbarian],
  [CharacterClass.DRUID, druid],
  [CharacterClass.ROGUE, rogue],
  [CharacterClass.SORCERER, sorceress],
  [CharacterClass.NECROMANCER, necromancer],
  [CharacterClass.SPIRITBORN, spiritborn],
]);

const regionIconMap = new Map<Zone, string>([
  [Zone.FRACTURED_PEAKS, fracturedPeaks],
  [Zone.SCOSGLEN, scosglen],
  [Zone.HAWEZAR, hawezar],
  [Zone.KEHJISTAN, kehjistan],
  [Zone.DRY_STEPPES, drySteppes],
  [Zone.NAHANTU, nahantu],
]);

function ItemSidebar({ collectionItem, className }: ItemProps) {
  const log = useCollection();
  const dispatcher = useCollectionDispatch();
  const settings = useSettings();

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
  const hasClassVariation = (characterClass: CharacterClass) =>
    hasItemVariation(collectionItem, characterClass) ||
    hasIconVariants(focusItem);

  const classNameStr = classNames({
    [styles.Block]: true,
    [styles.Barbarian]: usableBy(CharacterClass.BARBARIAN, collectionItem),
    [styles.Druid]: usableBy(CharacterClass.DRUID, collectionItem),
    [styles.Necromancer]: usableBy(CharacterClass.NECROMANCER, collectionItem),
    [styles.Rogue]: usableBy(CharacterClass.ROGUE, collectionItem),
    [styles.Sorcerer]: usableBy(CharacterClass.SORCERER, collectionItem),
    [styles.Spiritborn]: usableBy(CharacterClass.SPIRITBORN, collectionItem),
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
    <div className={classNameStr}>
      <div className={styles.SidebarContent}>
        <img
          className={styles.ItemImage}
          src={getIcon(focusIcon)}
          alt={getItemName(collectionItem, focusItem)}
        />
        <div className={styles.ItemTitle}>
          <span>{getItemName(collectionItem, focusItem)}</span>
        </div>
        <div className={styles.ItemType}>
          <span>{getItemType(collectionItem, focusItem)}</span>
        </div>
        <div className={styles.ItemClasses}>
          {enumKeys(CharacterClass)
            .sort()
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
                    <a
                      href={`${DATA_REPO}/${i.filename}.json`}
                      target={"_blank"}
                    >
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
      </div>
      <footer className={styles.SidebarFooter}>
        <DiscordInvite />
        <VersionInfo />
      </footer>
    </div>
  );
}

export default ItemSidebar;
