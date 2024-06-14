import {
  DadCollectionItem,
  DadItem,
  getDefaultItemFromCollectionItems,
} from "./data";
import styles from "./ItemSidebar.module.css";
import necromancer from "./image/necromancer.webp";
import druid from "./image/druid.webp";
import rogue from "./image/rogue.webp";
import barbarian from "./image/barbarian.webp";
import sorceress from "./image/sorceress.webp";
import wt1 from "./image/wt1.webp";
import wt3 from "./image/wt3.webp";
import wt4 from "./image/wt4.webp";
import series from "./image/seriesclip.webp";
import season from "./image/seasonclip.webp";
import premium from "./image/premiumclip.webp";
import unobtainable from "./image/unobtainableclip.webp";
import oor from "./image/oorclip.webp";
import Toggle from "./Toggle";
import { SERVER_ADDR } from "./config";
import { ItemGroup, itemGroups } from "./common";
import {
  getImageUri,
  getItemDescription,
  getItemName,
  getItemType,
} from "./data/getters";
import { doesHaveWardrobePlaceholder } from "./data/predicates";

function generateEditUrl(item: DadCollectionItem): string {
  return (
    SERVER_ADDR +
    "/admin/content-manager/collectionType/api::collection-item.collection-item/" +
    item.strapiId
  );
}

function usableBy(clazz: string, dci: DadCollectionItem): boolean {
  return dci.items.some((di) => di.usableByClass.includes(clazz));
}

function getItemGroup(itemType: string): ItemGroup {
  for (const [group, itemTypes] of itemGroups.entries()) {
    if (itemTypes.includes(itemType)) {
      return group;
    }
  }

  throw new Error("Unhandled item type: " + itemType);
}

function doDisplayDropInfo(collectionItem: DadCollectionItem, item: DadItem) {
  if (
    !["Monster Drop", "World Boss Drop", "World Drop"].includes(
      collectionItem.claim ?? "",
    )
  ) {
    return false;
  }

  const itemGroup = getItemGroup(item.itemType);
  if (![ItemGroup.ARMOR, ItemGroup.WEAPONS].includes(itemGroup)) {
    return false;
  }

  return !(item.dropMinLevel == 0 && item.dropMaxLevel == 0);
}

type ItemProps = {
  collectionItem: DadCollectionItem;
  collected: boolean;
  hidden: boolean;
  onClickCollected: (collected: boolean) => void;
  onClickHidden: (hidden: boolean) => void;
};

function getWardrobeIconLabel(ci: DadCollectionItem): string {
  if (ci.items.every(doesHaveWardrobePlaceholder)) {
    return "Yes";
  }

  if (ci.items.some(doesHaveWardrobePlaceholder)) {
    return "Some Classes";
  }

  return "No";
}

function ItemSidebar({
  collectionItem,
  collected,
  hidden,
  onClickCollected,
  onClickHidden,
}: ItemProps) {
  const item = getDefaultItemFromCollectionItems(collectionItem);

  return (
    <div className={styles.Panel}>
      <img
        src={getImageUri(item)}
        className={styles.ItemImage}
        alt={item.name}
      />
      <div className={styles.ItemTitle}>{getItemName(collectionItem)}</div>
      <div className={styles.ItemType}>{getItemType(collectionItem)}</div>
      <div className={styles.ItemClasses}>
        {usableBy("Barbarian", collectionItem) && (
          <img
            className={styles.ItemClassIcon}
            src={barbarian}
            alt="Barbarian"
          />
        )}
        {usableBy("Druid", collectionItem) && (
          <img className={styles.ItemClassIcon} src={druid} alt="Druid" />
        )}
        {usableBy("Necromancer", collectionItem) && (
          <img
            className={styles.ItemClassIcon}
            src={necromancer}
            alt="Necromancer"
          />
        )}
        {usableBy("Rogue", collectionItem) && (
          <img className={styles.ItemClassIcon} src={rogue} alt="Rogue" />
        )}
        {usableBy("Sorcerer", collectionItem) && (
          <img
            className={styles.ItemClassIcon}
            src={sorceress}
            alt="Sorcerer"
          />
        )}
      </div>
      <div
        className={styles.ItemDescription}
        hidden={!item.description || true}
      >
        {item.description}
      </div>
      <div className={styles.ItemActions}>
        <Toggle
          name="collected"
          checked={collected}
          onChange={(e) => onClickCollected(e.target.checked)}
        >
          Collected
        </Toggle>
        <Toggle
          name="hidden"
          checked={hidden}
          onChange={(e) => onClickHidden(e.target.checked)}
        >
          Hidden
        </Toggle>
      </div>
      <div className={styles.ItemLocations}>
        <div className={styles.ItemLocation}>
          <div className={styles.ItemLocationInfo}>
            <div className={styles.ItemLocationDescription}>
              {getItemDescription(collectionItem)}
            </div>
            <div className={styles.ItemLocationCategory}>
              <span>{collectionItem.claim}</span>
            </div>
          </div>
        </div>
      </div>
      {doDisplayDropInfo(collectionItem, item) && (
        <div className={styles.ItemDropRequirements}>
          <div className={styles.ItemWorldTier}>Minimum World Tier</div>
          <img
            src={wt1}
            className={styles.ItemWorldTierIcon}
            hidden={
              item.dropMinWorldTier !== null && item.dropMinWorldTier !== 0
            }
          />
          <img
            src={wt3}
            className={styles.ItemWorldTierIcon}
            hidden={item.dropMinWorldTier !== 2}
          />
          <img
            src={wt4}
            className={styles.ItemWorldTierIcon}
            hidden={item.dropMinWorldTier !== 3}
          />
          <div className={styles.ItemLevelRequirements}>
            Monster Level {Math.max(item.dropMinLevel, 1)}+
          </div>
        </div>
      )}
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
            Item ID: {collectionItem.items[0]?.itemId ?? -1}
            {process.env.NODE_ENV === "development" && (
              <span>
                {" "}
                |{" "}
                <a
                  href={generateEditUrl(collectionItem)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Edit
                </a>
              </span>
            )}
          </div>
          {process.env.NODE_ENV === "development" && (
            <div>Image ID: {item.iconId}</div>
          )}
          <div>Wardrobe Icon: {getWardrobeIconLabel(collectionItem)}</div>
        </div>
      </div>
    </div>
  );
}

export default ItemSidebar;
