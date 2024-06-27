import { ItemFlag, Store } from "./index";
import { DadCollectionItem } from "../data";

export function toggleItemFlag(
  store: Store,
): (item: DadCollectionItem, flag: ItemFlag, enabled?: boolean) => void {
  return (item: DadCollectionItem, flag: ItemFlag, enabled?: boolean) => {
    item.items
      .map((i) => i.itemId)
      .map(Number)
      .forEach((i) => store.toggle(i, flag, enabled));
  };
}

export function toggleFlagForItemIds(
  store: Store,
): (itemIds: string[], flag: ItemFlag, enabled?: boolean) => void {
  return (itemIds: string[], flag: ItemFlag, enabled?: boolean) => {
    itemIds.map(Number).forEach((i) => store.toggle(i, flag, enabled));
  };
}
