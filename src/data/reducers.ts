import { DadCollectionItem, DEFAULT_COLLECTION_ITEM } from "./index";

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
