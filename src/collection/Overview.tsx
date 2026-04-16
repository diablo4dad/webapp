import { flattenCollectionItems } from "../data/reducers";
import styles from "./Overview.module.css";
import { ItemGroup, itemGroups } from "../common";
import { useCollection } from "../collection/context";
import { isItemCollected } from "./predicate";
import { useData } from "../data/context";
import { Collection, CollectionItem, CollectionGroup } from "../data";
import { getAllCollectionItems, getItemIds } from "../data/getters";
import { useMemo } from "react";
import { Star } from "../components/Icons";

type ProgressCardConfig = {
  title: string;
  itemGroups: readonly ItemGroup[];
};

type ProgressCardProps = ProgressCardConfig & {
  collections: CollectionGroup;
};

const progressCards: readonly ProgressCardConfig[] = [
  {
    title: "Armor & Weapons",
    itemGroups: [ItemGroup.ARMOR, ItemGroup.WEAPONS],
  },
  {
    title: "Mounts, Armor & Trophies",
    itemGroups: [ItemGroup.MOUNTS, ItemGroup.HORSE_ARMOR, ItemGroup.TROPHIES],
  },
  {
    title: "Town Portals & Headstones",
    itemGroups: [ItemGroup.TOWN_PORTALS, ItemGroup.HEADSTONES],
  },
  {
    title: "Pets",
    itemGroups: [ItemGroup.PETS],
  },
  {
    title: "Player Titles",
    itemGroups: [ItemGroup.PLAYER_TITLES],
  },
  {
    title: "Other",
    itemGroups: [
      ItemGroup.BACK_TROPHIES,
      ItemGroup.BODY,
      ItemGroup.EMOTES,
      ItemGroup.EMBLEMS,
    ],
  },
] as const;

function CollectionProgressCard({
  title,
  itemGroups,
  collections,
}: ProgressCardProps) {
  const log = useCollection();

  const { collected, total, percent } = useMemo(() => {
    const itemTypeNames = new Set(
      itemGroups.flatMap((itemGroup) => itemGroupsMap.get(itemGroup) ?? []),
    );

    const matchingItems = flattenCollectionItems(collections).filter(
      (collectionItem) =>
        collectionItem.items.some((item) =>
          itemTypeNames.has(item.itemType.name),
        ),
    );

    const totalItems = matchingItems.length;
    const collectedItems = matchingItems.filter((collectionItem) =>
      isItemCollected(log, getItemIds(collectionItem)),
    ).length;

    return {
      collected: collectedItems,
      total: totalItems,
      percent: totalItems === 0 ? 0 : (collectedItems / totalItems) * 100,
    };
  }, [collections, itemGroups, log]);
  const isComplete = total > 0 && collected === total;

  return (
    <div className={styles.ProgressCard}>
      <div className={styles.ProgressCardLabel}>Collection</div>
      <div className={styles.ProgressCardTitle}>{title}</div>
      <div className={styles.ProgressCardStats}>
        <span className={styles.ProgressCardCurrent}>{collected}</span>
        <span className={styles.ProgressCardDivider}>/</span>
        <span>{total}</span>
        {isComplete && (
          <span className={styles.ProgressCardComplete}>
            <Star />
          </span>
        )}
      </div>
      <div className={styles.ProgressCardBar}>
        <span
          className={styles.ProgressCardBarFill}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={styles.ProgressCardDetail}>
        {collected} collected from {total} total
      </p>
    </div>
  );
}

const itemGroupsMap = itemGroups;

const Overview = () => {
  const { countedDb } = useData();

  return (
    <div className={styles.Block}>
      <div className={styles.Welcome}>
        <h1>Transmog collection</h1>
        <p>
          Track every armor set, weapon skin, mount, and cosmetic in Sanctuary.
          Check off what you own, discover what you're missing.
        </p>
      </div>
      <div className={styles.SeasonCard}>
        <div className={styles.SeasonEyebrow}>Current Season</div>
        <div className={styles.SeasonTitle}>Season 12</div>
        <div className={styles.SeasonName}>Season of Slaughter</div>
        <p className={styles.SeasonDescription}>
          Follow the latest seasonal cosmetics, rewards, and limited-time
          unlocks without losing track of your permanent collection goals.
        </p>
      </div>
      {progressCards.map((card) => (
        <CollectionProgressCard
          key={card.title}
          title={card.title}
          itemGroups={card.itemGroups}
          collections={countedDb}
        />
      ))}
    </div>
  );
};

export default Overview;
