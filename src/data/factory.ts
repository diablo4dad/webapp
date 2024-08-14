import {
  CharacterClass,
  Collection,
  CollectionItem,
  CollectionItemRef,
  CollectionRef,
  DadDb,
  DadDbRef,
  DEFAULT_ITEM,
  DEFAULT_ITEM_TYPE,
  GenderImages,
  Item,
  ItemRef,
  ItemType,
} from "./index";

function hydrateImage(iconId: number): string {
  return `icons/${iconId}.webp`;
}

function hydrateCollectionItem(
  items: Map<number, Item>,
): (_: CollectionItemRef) => CollectionItem {
  return (collectionItem: CollectionItemRef) => ({
    ...collectionItem,
    items: collectionItem.items.map((i) => items.get(i) ?? DEFAULT_ITEM),
  });
}

function hydrateCollection(
  items: Map<number, Item>,
): (_: CollectionRef) => Collection {
  return (collection: CollectionRef) => ({
    ...collection,
    collectionItems: collection.collectionItems.map(
      hydrateCollectionItem(items),
    ),
    subcollections:
      collection.subcollections?.map(hydrateCollection(items)) ?? [],
  });
}

function hydrateItem(itemTypes: Map<number, ItemType>): (_: ItemRef) => Item {
  return (item: ItemRef) => ({
    ...item,
    icon: hydrateImage(item.icon),
    itemType: itemTypes.get(item.itemType) ?? DEFAULT_ITEM_TYPE,
    invImages: item.invImages?.map((i) =>
      i.map((j) => (j ? hydrateImage(j) : null)),
    ) as GenderImages[],
    usableByClass:
      item.usableByClass ?? Object.values(CharacterClass).map(() => 1),
  });
}

function backFill(c: Collection, parent?: Collection): Collection {
  return {
    ...c,
    season: c.season ?? parent?.season,
    outOfRotation: c.outOfRotation ?? parent?.outOfRotation,
    subcollections: c.subcollections.map((sc) => backFill(sc, c)),
    collectionItems: c.collectionItems.map((ci) => ({
      ...ci,
      season: ci.season ?? c?.season,
      outOfRotation: ci.outOfRotation ?? c?.outOfRotation,
    })),
  };
}

function hydrateDadDb(dadDb: DadDbRef): DadDb {
  const itemTypeLookup = new Map<number, ItemType>(
    dadDb.itemTypes.map((it) => [it.id, it]),
  );
  const items = dadDb.items.map(hydrateItem(itemTypeLookup));
  const itemLookup = new Map<number, Item>(items.map((i) => [i.id, i]));
  const collections = dadDb.collections
    .map(hydrateCollection(itemLookup))
    .map((c) => backFill(c));

  return {
    ...dadDb,
    items,
    collections,
  };
}

export { hydrateItem, hydrateCollection, hydrateDadDb };
