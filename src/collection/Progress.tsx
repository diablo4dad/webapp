import { useMemo } from "react";
import { useCollection } from "../collection/context";
import { ItemGroup, itemGroups } from "../common";
import Card from "../components/Card";
import { Star } from "../components/Icons";
import { CollectionGroup } from "../data";
import { useData } from "../data/context";
import { getItemIds } from "../data/getters";
import { flattenCollectionItems } from "../data/reducers";
import mountIcon from "../image/mount.png";
import petIcon from "../image/pet.png";
import portalIcon from "../image/portal.png";
import shakoIcon from "../image/shako.png";
import backTrophyIcon from "../image/back-trophy.png";
import emblemIcon from "../image/elblem.png";
import styles from "./Progress.module.css";
import { isItemCollected } from "./predicate";

type ProgressCardConfig = {
  title: string;
  itemGroups: readonly ItemGroup[];
  iconSrc?: string;
};

type ProgressCardProps = ProgressCardConfig & {
  collections: CollectionGroup;
};

const progressCards: readonly ProgressCardConfig[] = [
  {
    title: "Armor & Weapons",
    itemGroups: [ItemGroup.ARMOR, ItemGroup.WEAPONS],
    iconSrc: shakoIcon,
  },
  {
    title: "Mounts, Armor & Trophies",
    itemGroups: [ItemGroup.MOUNTS, ItemGroup.HORSE_ARMOR, ItemGroup.TROPHIES],
    iconSrc: mountIcon,
  },
  {
    title: "Town Portals & Headstones",
    itemGroups: [ItemGroup.TOWN_PORTALS, ItemGroup.HEADSTONES],
    iconSrc: portalIcon,
  },
  {
    title: "Back Trophies",
    itemGroups: [ItemGroup.BACK_TROPHIES],
    iconSrc: backTrophyIcon,
  },
  {
    title: "Pets",
    itemGroups: [ItemGroup.PETS],
    iconSrc: petIcon,
  },
  {
    title: "Other",
    iconSrc: emblemIcon,
    itemGroups: [
      ItemGroup.BODY,
      ItemGroup.EMOTES,
      ItemGroup.EMBLEMS,
      ItemGroup.PLAYER_TITLES,
    ],
  },
] as const;

function CollectionProgressCard({
  title,
  itemGroups,
  collections,
  iconSrc,
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
    <Card className={styles.ProgressCard}>
      {iconSrc && (
        <div className={styles.ProgressCardIcon}>
          <img src={iconSrc} alt="" />
        </div>
      )}
      <div className={styles.ProgressCardLabel}>Collection</div>
      <div className={styles.ProgressCardSummary}>
        <div className={styles.ProgressCardTitle}>{title}</div>
        <div className={styles.ProgressCardStats}>
          <span className={styles.ProgressCardCurrent}>{collected}</span>
          <span className={styles.ProgressCardDivider}>/</span>
          <span>{total}</span>
        </div>
      </div>
      <div className={styles.ProgressCardBar}>
        <span
          className={styles.ProgressCardBarFill}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={styles.ProgressCardDetail}>
        <span>
          {collected} collected from {total} total
        </span>
        {isComplete && (
          <span className={styles.ProgressCardComplete}>
            <Star />
          </span>
        )}
      </p>
    </Card>
  );
}

const itemGroupsMap = itemGroups;

const Progress = () => {
  const { countedDb } = useData();

  return (
    <div className={styles.ProgressList}>
      {progressCards.map((card) => (
        <CollectionProgressCard
          key={card.title}
          title={card.title}
          iconSrc={card.iconSrc}
          itemGroups={card.itemGroups}
          collections={countedDb}
        />
      ))}
    </div>
  );
};

export default Progress;
