import { CharacterClass } from "../../services/data";
import type { CollectionItem, Item } from "../../services/data";
import {
  getItemQualitySortRank as getItemQualityValueSortRank,
} from "../../shared/domain/item-quality";

function isUsableBy(characterClass: CharacterClass, item: CollectionItem): boolean {
  return item.items.some(
    (collectionItem) => collectionItem.usableByClass?.[characterClass] === 1,
  );
}

function getItemQualitySortRank(item: Item): number {
  return getItemQualityValueSortRank(item.itemQuality);
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
      const key = `${item.name}:${item.itemQuality ?? "none"}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort(
      (leftItem, rightItem) =>
        getItemQualitySortRank(leftItem) - getItemQualitySortRank(rightItem),
    );
}

export { buildSalvageSourceItems, getItemQualitySortRank, isUsableBy };
