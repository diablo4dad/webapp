import { describe, expect, test } from "vitest";
import { CharacterClass, ItemQuality } from "../../services/data";
import type { CollectionItem, Item } from "../../services/data";
import {
  buildSalvageSourceItems,
  getItemQualitySortRank,
  isUsableBy,
} from "./view-model";

function item(
  id: number,
  name: string,
  options: Partial<Item> = {},
): Item {
  return {
    icon: "",
    id,
    invImages: [],
    itemType: {
      id,
      name: "Sword",
    },
    name,
    similarItems: [],
    similarItemsRefs: [],
    usableByClass: [],
    ...options,
  };
}

describe("item sidebar view model", () => {
  test("filters, deduplicates, and sorts salvage source items", () => {
    const common = item(1, "Common Sword", {
      itemQuality: ItemQuality.COMMON,
      salvageable: true,
    });
    const legendary = item(2, "Legendary Sword", {
      itemQuality: ItemQuality.LEGENDARY,
      salvageable: true,
    });
    const duplicateLegendary = item(3, "Legendary Sword", {
      itemQuality: ItemQuality.LEGENDARY,
      salvageable: true,
    });
    const hidden = item(4, "(PH) Hidden Sword", {
      itemQuality: ItemQuality.MAGIC,
      salvageable: true,
    });
    const notSalvageable = item(5, "Rare Sword", {
      itemQuality: ItemQuality.RARE,
      salvageable: false,
    });
    const focusItem = item(6, "Magic Sword", {
      itemQuality: ItemQuality.MAGIC,
      salvageable: true,
      similarItemsRefs: [
        legendary,
        duplicateLegendary,
        common,
        hidden,
        notSalvageable,
      ],
    });

    expect(buildSalvageSourceItems(focusItem).map((source) => source.name))
      .toEqual(["Common Sword", "Magic Sword", "Legendary Sword"]);
  });

  test("ranks unknown item qualities after known types", () => {
    expect(getItemQualitySortRank(item(1, "Known", { itemQuality: ItemQuality.MAGIC })))
      .toBeLessThan(getItemQualitySortRank(item(2, "Unknown")));
  });

  test("detects item usability by class", () => {
    const collectionItem: CollectionItem = {
      claim: "Drop",
      id: 1,
      items: [
        item(1, "Class Sword", {
          usableByClass: [0, 0, 1, 0, 0, 0, 0, 0],
        }),
      ],
    };

    expect(isUsableBy(CharacterClass.BARBARIAN, collectionItem)).toBe(true);
    expect(isUsableBy(CharacterClass.ROGUE, collectionItem)).toBe(false);
  });
});
