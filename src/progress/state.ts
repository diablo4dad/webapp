import { isItemCollected } from "../ledger/predicate";
import type { CollectionLog } from "../ledger/type";
import { ItemGroup, itemGroups } from "../shared/domain";
import type { CollectionGroup } from "../data";
import { getItemIds } from "../data/getters";
import { flattenCollectionItems } from "../data/reducers";

type ProgressStats = {
  collected: number;
  isComplete: boolean;
  percent: number;
  total: number;
};

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
  const total = matchingItems.length;
  const collected = matchingItems.filter((collectionItem) =>
    isItemCollected(collectionLog, getItemIds(collectionItem)),
  ).length;

  return {
    collected,
    isComplete: total > 0 && collected === total,
    percent: total === 0 ? 0 : (collected / total) * 100,
    total,
  };
}

export { getProgressStats };
export type { ProgressStats };
