import { CharacterClass, MagicType } from "../../services/data";
import type { CollectionItem, Item } from "../../services/data";

const magicTypeSortOrder = new Map<MagicType, number>([
  [MagicType.COMMON, 0],
  [MagicType.MAGIC, 1],
  [MagicType.RARE, 2],
  [MagicType.LEGENDARY, 3],
  [MagicType.UNIQUE, 4],
  [MagicType.MYTHIC, 5],
]);

function isUsableBy(characterClass: CharacterClass, item: CollectionItem): boolean {
  return item.items.some(
    (collectionItem) => collectionItem.usableByClass?.[characterClass] === 1,
  );
}

function getMagicTypeSortRank(item: Item): number {
  return item.magicType === undefined
    ? Number.MAX_SAFE_INTEGER
    : magicTypeSortOrder.get(item.magicType as MagicType) ??
        Number.MAX_SAFE_INTEGER;
}

function buildSalvageSourceItems(focusItem: Item): Item[] {
  const seen = new Set<string>();
  const hiddenNameTokens = ["(PH)", "[PH]", "[ph_", "(DNS)"];

  return [focusItem, ...focusItem.similarItemsRefs]
    .filter((item) => item.salvageable === true)
    .filter((item) => item.name.trim().length > 0)
    .filter((item) =>
      hiddenNameTokens.every((token) => !item.name.includes(token)),
    )
    .filter((item) => {
      const key = `${item.name}:${item.magicType ?? "none"}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort(
      (leftItem, rightItem) =>
        getMagicTypeSortRank(leftItem) - getMagicTypeSortRank(rightItem),
    );
}

export { buildSalvageSourceItems, getMagicTypeSortRank, isUsableBy };
