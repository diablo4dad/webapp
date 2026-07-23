import { isItemCollected } from "../ledger/predicate";
import type { CollectionLog } from "../ledger/type";
import { ItemGroup, itemGroups } from "../../shared/domain";
import type { CollectionGroup, CollectionItem } from "../../services/data";
import { getItemIds } from "../../services/data/getters";
import { flattenCollectionItems } from "../../services/data/reducers";

type ProgressStats = {
  collected: number;
  isComplete: boolean;
  percent: number;
  remaining: number;
  total: number;
};

function getAllProgressStats(
  collectionLog: CollectionLog,
  collections: CollectionGroup,
): ProgressStats {
  return getStatsFromItems(collectionLog, flattenCollectionItems(collections));
}

function getProgressStats(
  collectionLog: CollectionLog,
  collections: CollectionGroup,
  groups: readonly ItemGroup[],
): ProgressStats {
  const itemTypeNames = new Set(
    groups.flatMap((itemGroup) => itemGroups.get(itemGroup) ?? []),
  );

  const matchingItems = flattenCollectionItems(collections).filter(
    (collectionItem) =>
      collectionItem.items.some((item) => itemTypeNames.has(item.itemType.name)),
  );

  return getStatsFromItems(collectionLog, matchingItems);
}

function getStatsFromItems(
  collectionLog: CollectionLog,
  matchingItems: CollectionItem[],
): ProgressStats {
  const total = matchingItems.length;
  const collected = matchingItems.filter((collectionItem) =>
    isItemCollected(collectionLog, getItemIds(collectionItem)),
  ).length;

  return {
    collected,
    isComplete: total > 0 && collected === total,
    percent: total === 0 ? 0 : (collected / total) * 100,
    remaining: total - collected,
    total,
  };
}

export { getAllProgressStats, getProgressStats };
export type { ProgressStats };
