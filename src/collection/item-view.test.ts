import { describe, expect, test } from "vitest";
import { hashCode } from "../common/hash";
import {
  CharacterClass,
  CharacterGender,
  MagicType,
  type CollectionItem,
  type Item,
} from "../data";
import type { CollectionLog } from "./type";
import { getItemView } from "./item-view";

function item(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    icon: "icons/default.webp",
    invImages: [],
    itemType: {
      id: 1,
      name: "Armor",
    },
    magicType: MagicType.UNIQUE,
    name: "Default Helm",
    similarItemsRefs: [],
    usableByClass: [1, 1, 1, 1, 1, 1, 1],
    ...overrides,
  };
}

function collectionItem(
  overrides: Partial<CollectionItem> = {},
): CollectionItem {
  return {
    claim: "Drop",
    id: 10,
    items: [item()],
    ...overrides,
  };
}

function log(overrides: Partial<CollectionLog> = {}): CollectionLog {
  return {
    collected: [],
    hidden: [],
    ...overrides,
  };
}

describe("item view", () => {
  test("selects the preferred class item and icon", () => {
    const barbarianItem = item({
      id: 1,
      icon: "icons/barbarian.webp",
      name: "Barbarian Helm",
      usableByClass: [0, 0, 1, 0, 0, 0, 0],
    });
    const rogueItem = item({
      id: 2,
      icon: "icons/rogue.webp",
      invImages: [
        [null, null],
        [null, null],
        [null, null],
        ["icons/rogue-male.webp", "icons/rogue-female.webp"],
      ],
      name: "Rogue Helm",
      usableByClass: [0, 0, 0, 1, 0, 0, 0],
    });

    const view = getItemView({
      collectionItem: collectionItem({
        items: [barbarianItem, rogueItem],
      }),
      log: log(),
      preferredClass: CharacterClass.ROGUE,
      preferredGender: CharacterGender.FEMALE,
    });

    expect(view.item).toBe(rogueItem);
    expect(view.icon).toBe("icons/rogue-female.webp");
  });

  test("reports collection visibility flags", () => {
    const candidate = collectionItem();
    const itemHash = hashCode([candidate.items[0].id]);

    expect(
      getItemView({
        collectionItem: candidate,
        log: log({ collected: [itemHash] }),
        preferredClass: CharacterClass.BARBARIAN,
        preferredGender: CharacterGender.MALE,
      }),
    ).toMatchObject({
      isCollected: true,
      showCollected: true,
      showExcluded: false,
    });

    expect(
      getItemView({
        collectionItem: candidate,
        log: log({ collected: [itemHash], hidden: [itemHash] }),
        preferredClass: CharacterClass.BARBARIAN,
        preferredGender: CharacterGender.MALE,
      }),
    ).toMatchObject({
      isCollected: false,
      showCollected: false,
      showExcluded: true,
    });

    expect(
      getItemView({
        collectionItem: collectionItem({ unobtainable: true }),
        log: log({ collected: [itemHash] }),
        preferredClass: CharacterClass.BARBARIAN,
        preferredGender: CharacterGender.MALE,
      }),
    ).toMatchObject({
      isCollected: true,
      showCollected: false,
      showExcluded: true,
    });
  });
});
