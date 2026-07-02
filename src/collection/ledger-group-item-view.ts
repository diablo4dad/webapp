import type {
  CharacterClass,
  CharacterGender,
  CollectionItem,
  Item,
} from "../data";
import { getDefaultItem } from "../data";
import {
  getClassIconVariant,
  getClassItemVariant,
  getItemIds,
} from "../data/getters";
import type { CollectionLog } from "./type";
import { isItemCollected, isItemHidden } from "./predicate";

type LedgerGroupItemView = {
  icon: string;
  isCollected: boolean;
  item: Item;
  showCollected: boolean;
  showExcluded: boolean;
};

type Options = {
  collectionItem: CollectionItem;
  log: CollectionLog;
  preferredClass: CharacterClass;
  preferredGender: CharacterGender;
};

function getLedgerGroupItemView({
  collectionItem,
  log,
  preferredClass,
  preferredGender,
}: Options): LedgerGroupItemView {
  const item =
    getClassItemVariant(collectionItem, preferredClass) ??
    getDefaultItem(collectionItem);
  const icon =
    getClassIconVariant(item, preferredClass, preferredGender) ?? item.icon;
  const itemIds = getItemIds(collectionItem);
  const isCollected = isItemCollected(log, itemIds);
  const isHidden = isItemHidden(log, itemIds);
  const showCollected =
    isCollected && !isHidden && !collectionItem.unobtainable;
  const showExcluded = isHidden || collectionItem.unobtainable === true;

  return {
    icon,
    isCollected,
    item,
    showCollected,
    showExcluded,
  };
}

export { getLedgerGroupItemView };
export type { LedgerGroupItemView };
