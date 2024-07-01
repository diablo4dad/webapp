import {
  DadCollection,
  DadCollectionItem,
  DEFAULT_COLLECTION_ITEM,
} from "./index";
import { getAllCollectionItems } from "./getters";

export function selectItemOrDefault(
  dci: DadCollectionItem[],
  selectedItemId: number,
): DadCollectionItem {
  return (
    dci.filter((ci) => ci.strapiId === selectedItemId).pop() ??
    dci.at(0) ??
    DEFAULT_COLLECTION_ITEM
  );
}

export function reduceItemIds(dadCollection: DadCollection): number[] {
  return getAllCollectionItems(dadCollection)
    .flatMap((dci) => dci.items)
    .map((i) => i.itemId)
    .map(Number);
}
