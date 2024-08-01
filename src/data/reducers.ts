import {
  DadCollection,
  DadCollectionItem,
  DadDb,
  DEFAULT_COLLECTION_ITEM,
} from "./index";
import { getAllCollectionItems } from "./getters";
import { flattenDadDb } from "./transforms";

export function selectItemOrDefault(
  db: DadDb,
  selectedItemId: number,
): DadCollectionItem {
  const dci = flattenDadDb(db);
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
