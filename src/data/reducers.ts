import {
  Collection,
  CollectionGroup,
  CollectionItem,
  DEFAULT_COLLECTION_ITEM,
} from "./index";
import { getAllCollectionItems } from "./getters";
import { flattenDadDb } from "./transforms";

export function selectItemOrDefault(
  collection: CollectionGroup,
  selectedItemId: number,
): CollectionItem {
  return (
    flattenDadDb(collection).find((ci) => ci.id === selectedItemId) ??
    DEFAULT_COLLECTION_ITEM
  );
}

export function selectCollectionById(
  collections: CollectionGroup,
  selectedCollectionId: number,
): Collection | undefined {
  for (const collection of collections) {
    if (collection.id === selectedCollectionId) {
      return collection;
    }

    const subcollection = selectCollectionById(
      collection.subcollections,
      selectedCollectionId,
    );
    if (subcollection) {
      return subcollection;
    }
  }
}

export function reduceItemIds(dadCollection: Collection): number[] {
  return getAllCollectionItems(dadCollection)
    .flatMap((dci) => dci.items)
    .map((i) => i.id);
}

export function flattenCollectionItems(
  collections: CollectionGroup,
): CollectionItem[] {
  return collections.flatMap((collection: Collection) =>
    getAllCollectionItems(collection),
  );
}
