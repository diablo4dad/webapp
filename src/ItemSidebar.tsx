import {
  CharacterClass,
  CollectionItem,
  getDefaultItemFromCollectionItems,
} from "./data";
import styles from "./ItemSidebar.module.css";
import necromancer from "./image/necromancer.webp";
import druid from "./image/druid.webp";
import rogue from "./image/rogue.webp";
import barbarian from "./image/barbarian.webp";
import sorceress from "./image/sorceress.webp";
import series from "./image/seriesclip.webp";
import season from "./image/seasonclip.webp";
import premium from "./image/premiumclip.webp";
import unobtainable from "./image/unobtainableclip.webp";
import wardrobe from "./image/wardrobeclip.webp";
import oor from "./image/oorclip.webp";
import Toggle from "./components/Toggle";
import {
  getDiabloItemIds,
  getImageUri,
  getItemDescription,
  getItemName,
  getItemType,
} from "./data/getters";
import { doesHaveWardrobePlaceholder } from "./data/predicates";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "./collection/context";
import { isItemCollected, isItemHidden } from "./collection/predicate";
import React from "react";
import { VersionInfo } from "./components/VersionPanel";
import { DiscordInvite } from "./components/DiscordPanel";
import classNames from "classnames";
import { hashCode } from "./common/hash";

function usableBy(clazz: CharacterClass, dci: CollectionItem): boolean {
  return dci.items.some((di) => di.usableByClass?.[clazz] === 1 ?? false);
}

type ItemProps = {
  className?: string;
  collectionItem: CollectionItem;
};

function ItemSidebar({ collectionItem, className }: ItemProps) {
  const log = useCollection();
  const dispatcher = useCollectionDispatch();

  const item = getDefaultItemFromCollectionItems(collectionItem);
  const itemIds = getDiabloItemIds(collectionItem);

  const classNameStr = classNames({
    [styles.Block]: true,
    [styles.Barbarian]: usableBy(CharacterClass.BARBARIAN, collectionItem),
    [styles.Druid]: usableBy(CharacterClass.DRUID, collectionItem),
    [styles.Necromancer]: usableBy(CharacterClass.NECROMANCER, collectionItem),
    [styles.Rogue]: usableBy(CharacterClass.ROGUE, collectionItem),
    [styles.Sorcerer]: usableBy(CharacterClass.SORCERER, collectionItem),
    [className ?? ""]: true,
  });

  return (
    <div className={classNameStr}>
      <div className={styles.SidebarContent}>
        <img
          className={styles.ItemImage}
          src={getImageUri(item)}
          alt={item.name}
        />
        <div className={styles.ItemTitle}>
          <span>{getItemName(collectionItem)}</span>
        </div>
        <div className={styles.ItemType}>
          <span>{getItemType(collectionItem)}</span>
        </div>
        <div className={styles.ItemClasses}>
          <img
            className={classNames(
              styles.ItemClassIcon,
              styles.BarbarianClassIcon,
            )}
            src={barbarian}
            alt="Barbarian"
          />
          <img
            className={classNames(styles.ItemClassIcon, styles.DruidClassIcon)}
            src={druid}
            alt="Druid"
          />
          <img
            className={classNames(
              styles.ItemClassIcon,
              styles.NecromancerClassIcon,
            )}
            src={necromancer}
            alt="Necromancer"
          />
          <img
            className={classNames(styles.ItemClassIcon, styles.RogueClassIcon)}
            src={rogue}
            alt="Rogue"
          />
          <img
            className={classNames(
              styles.ItemClassIcon,
              styles.SorcererClassIcon,
            )}
            src={sorceress}
            alt="Sorcerer"
          />
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
          </div>
        </div>
        <div className={styles.ItemTags}>
          {item.series && (
            <div className={styles.ItemTag}>
              <img className={styles.ItemTagIcon} src={series} />
              <span>{item.series.replaceAll('"', "")}</span>
            </div>
          )}
          {collectionItem.season && (
            <div className={styles.ItemTag}>
              <img className={styles.ItemTagIcon} src={season} />
              <span>Season {collectionItem.season}</span>
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
          <div>
            <div>
              <div>
                Item ID: {collectionItem.items.map((i) => i.id).join(", ")}
              </div>
              {process.env.NODE_ENV === "development" && (
                <>
                  <div>
                    Item Hash: {hashCode(collectionItem.items.map((i) => i.id))}
                  </div>
                  <div>Image URL: {item.icon}</div>
                  {collectionItem.items.map((i) => (
                    <div key={i.id}>Filename: {i.filename}</div>
                  ))}
                </>
              )}
            </div>
          </div>
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
