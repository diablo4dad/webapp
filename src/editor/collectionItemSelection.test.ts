import { CharacterClass, Item } from "../data";
import {
  canSelectCollectionItem,
  selectCollectionItem,
} from "./collectionItemSelection";

function item(id: number, itemTypeName: string, usableByClass: number[]): Item {
  return {
    id,
    name: `Item ${id}`,
    itemType: {
      id,
      name: itemTypeName,
    },
    icon: "",
    invImages: [],
    similarItems: [],
    similarItemsRefs: [],
    usableByClass,
  };
}

function classSpecificItem(
  id: number,
  itemTypeName: string,
  characterClass: CharacterClass,
): Item {
  const usableByClass = Array(8).fill(0);
  usableByClass[characterClass] = 1;

  return item(id, itemTypeName, usableByClass);
}

function allClassItem(id: number, itemTypeName: string): Item {
  return item(id, itemTypeName, Array(8).fill(1));
}

function itemIds(items: Item[]): number[] {
  return items.map((selectedItem) => selectedItem.id);
}

describe("selectCollectionItem", () => {
  it("replaces a normal item with the next normal item", () => {
    const mount = allClassItem(1, "Mount");
    const trophy = allClassItem(2, "Trophy");

    expect(itemIds(selectCollectionItem([mount], trophy))).toEqual([2]);
  });

  it("keeps at most two selected player titles", () => {
    const prefix = allClassItem(1, "Player Title (Prefix)");
    const suffix = allClassItem(2, "Player Title (Suffix)");
    const nextPrefix = allClassItem(3, "Player Title (Prefix)");
    const mount = allClassItem(4, "Mount");

    const firstSelection = selectCollectionItem([], prefix);
    const secondSelection = selectCollectionItem(firstSelection, suffix);
    const thirdSelection = selectCollectionItem(secondSelection, nextPrefix);

    expect(itemIds(firstSelection)).toEqual([1]);
    expect(itemIds(secondSelection)).toEqual([1, 2]);
    expect(itemIds(thirdSelection)).toEqual([2, 3]);
    expect(itemIds(selectCollectionItem([prefix], mount))).toEqual([1]);
    expect(canSelectCollectionItem([prefix], suffix)).toBe(true);
    expect(canSelectCollectionItem([prefix], mount)).toBe(false);
  });

  it("appends class-specific armor with the same item type and a new class", () => {
    const barbarianChest = classSpecificItem(
      1,
      "Chest Armor",
      CharacterClass.BARBARIAN,
    );
    const druidChest = classSpecificItem(
      2,
      "Chest Armor",
      CharacterClass.DRUID,
    );

    expect(itemIds(selectCollectionItem([barbarianChest], druidChest))).toEqual(
      [1, 2],
    );
  });

  it("replaces one class-specific armor with an incompatible item", () => {
    const barbarianChest = classSpecificItem(
      1,
      "Chest Armor",
      CharacterClass.BARBARIAN,
    );
    const nextBarbarianChest = classSpecificItem(
      2,
      "Chest Armor",
      CharacterClass.BARBARIAN,
    );
    const barbarianHelm = classSpecificItem(
      3,
      "Helm",
      CharacterClass.BARBARIAN,
    );
    const allClassChest = allClassItem(4, "Chest Armor");
    const mount = allClassItem(5, "Mount");

    expect(itemIds(selectCollectionItem([barbarianChest], mount))).toEqual([5]);
    expect(
      itemIds(selectCollectionItem([barbarianChest], allClassChest)),
    ).toEqual([4]);
    expect(
      itemIds(selectCollectionItem([barbarianChest], nextBarbarianChest)),
    ).toEqual([2]);
    expect(
      itemIds(selectCollectionItem([barbarianChest], barbarianHelm)),
    ).toEqual([3]);
    expect(canSelectCollectionItem([barbarianChest], mount)).toBe(true);
    expect(canSelectCollectionItem([barbarianChest], allClassChest)).toBe(true);
  });

  it("ignores armor that is not compatible with an active class-specific armor set", () => {
    const barbarianChest = classSpecificItem(
      1,
      "Chest Armor",
      CharacterClass.BARBARIAN,
    );
    const druidChest = classSpecificItem(
      2,
      "Chest Armor",
      CharacterClass.DRUID,
    );
    const nextBarbarianChest = classSpecificItem(
      3,
      "Chest Armor",
      CharacterClass.BARBARIAN,
    );
    const barbarianHelm = classSpecificItem(
      4,
      "Helm",
      CharacterClass.BARBARIAN,
    );
    const allClassChest = allClassItem(5, "Chest Armor");
    const mount = allClassItem(6, "Mount");
    const selection = [barbarianChest, druidChest];

    expect(
      itemIds(selectCollectionItem(selection, nextBarbarianChest)),
    ).toEqual([1, 2]);
    expect(itemIds(selectCollectionItem(selection, barbarianHelm))).toEqual([
      1, 2,
    ]);
    expect(itemIds(selectCollectionItem(selection, allClassChest))).toEqual([
      1, 2,
    ]);
    expect(itemIds(selectCollectionItem(selection, mount))).toEqual([1, 2]);
    expect(canSelectCollectionItem(selection, nextBarbarianChest)).toBe(false);
    expect(canSelectCollectionItem(selection, barbarianHelm)).toBe(false);
    expect(canSelectCollectionItem(selection, allClassChest)).toBe(false);
    expect(canSelectCollectionItem(selection, mount)).toBe(false);
  });

  it("filters active class-specific armor sets to remaining classes for the same item type", () => {
    const barbarianChest = classSpecificItem(
      1,
      "Chest Armor",
      CharacterClass.BARBARIAN,
    );
    const druidChest = classSpecificItem(
      2,
      "Chest Armor",
      CharacterClass.DRUID,
    );
    const rogueChest = classSpecificItem(
      3,
      "Chest Armor",
      CharacterClass.ROGUE,
    );
    const nextBarbarianChest = classSpecificItem(
      4,
      "Chest Armor",
      CharacterClass.BARBARIAN,
    );
    const rogueHelm = classSpecificItem(5, "Helm", CharacterClass.ROGUE);
    const selection = [barbarianChest, druidChest];

    expect(canSelectCollectionItem(selection, rogueChest)).toBe(true);
    expect(canSelectCollectionItem(selection, nextBarbarianChest)).toBe(false);
    expect(canSelectCollectionItem(selection, rogueHelm)).toBe(false);
  });

  it("does not put all-class armor into class-specific armor set mode", () => {
    const allClassChest = allClassItem(1, "Chest Armor");
    const barbarianChest = classSpecificItem(
      2,
      "Chest Armor",
      CharacterClass.BARBARIAN,
    );

    expect(
      itemIds(selectCollectionItem([allClassChest], barbarianChest)),
    ).toEqual([2]);
  });
});
