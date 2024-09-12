import {
  Collection,
  CollectionGroup,
  CollectionItem,
  getDefaultItem,
  ItemType,
} from "./index";
import { itemGroups, MasterGroup } from "../common";
import { hashCode } from "../common/hash";
import { getItemIds } from "./getters";

export function flattenDadDb(db: CollectionGroup): CollectionItem[] {
  return db.flatMap((c) => [
    ...c.collectionItems,
    ...c.subcollections.flatMap((sc) => sc.collectionItems),
  ]);
}

export function createGlobalCollection(
  itemTypes: ItemType[],
  collections: Collection[],
): CollectionGroup {
  const itemTypeOrder = Array.from(itemGroups.values()).flat();
  const defaultCollection = () => {
    // item types contain variants that should be grouped
    // ie staff vs staffDruid - same thing. labels are the same
    const filteredTypes = itemTypes
      // exclude duplicates
      .filter((value, index, array) => {
        return array.findIndex((it) => it.name === value.name) === index;
      })
      // merge player titles
      .filter((value) => !value.name.includes("Player Title"))
      .sort(
        (a, b) => itemTypeOrder.indexOf(a.name) - itemTypeOrder.indexOf(b.name),
      )
      .concat({
        id: 1337,
        name: "Player Title",
      });

    return new Map<string, Collection>(
      filteredTypes.map((it) => [
        it.name,
        {
          id: it.id,
          name: it.name,
          description: `${it.name} collection`,
          category: MasterGroup.UNIVERSAL,
          collectionItems: [],
          subcollections: [],
        },
      ]),
    );
  };

  const normaliseItemTypeKey = (k: string) =>
    k.replace(" (Suffix)", "").replace(" (Prefix)", "");
  const itemHashes = Array<number>();
  return Array.from(
    flattenDadDb(collections)
      .reduce((a, c) => {
        // skip empty collections
        if (c.items.length === 0) {
          return a;
        }

        // skip duplicates
        const itemHash = hashCode(getItemIds(c));
        if (itemHashes.includes(itemHash)) {
          return a;
        }

        // push into collection
        const item = getDefaultItem(c);
        const collection = a.get(normaliseItemTypeKey(item.itemType.name));
        if (collection === undefined) {
          return a;
        }

        itemHashes.push(itemHash);
        collection.collectionItems.push(c);
        return a;
      }, defaultCollection())
      .values(),
  );
}
