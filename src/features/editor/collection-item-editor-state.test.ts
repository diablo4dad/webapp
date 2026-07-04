import { describe, expect, test } from "vitest";
import { CharacterClass, Chest, Zone } from "../../services/data";
import type { Collection, CollectionItem, Item } from "../../services/data";
import { MasterGroup } from "../../shared/domain";
import {
  COLLECTION_ITEM_INITIAL_FORM,
  buildCollectionItemRef,
  buildCollectionOptions,
  createInitialState,
  getPreviewName,
  getSingleUsableClass,
  hasEditorChanges,
} from "./collection-item-editor-state";

function item(id: number, name = `Item ${id}`): Item {
  return {
    icon: "",
    id,
    invImages: [],
    itemType: {
      id,
      name: "Mount",
    },
    name,
    similarItems: [],
    similarItemsRefs: [],
    usableByClass: [0, 0, 1, 0, 0, 0, 0, 0],
  };
}

function collection(id: string, options: Partial<Collection> = {}): Collection {
  return {
    category: MasterGroup.GENERAL,
    collectionItems: [],
    id,
    name: id,
    subcollections: [],
    ...options,
  };
}

describe("collection item editor state", () => {
  test("builds a catalog item ref from form values", () => {
    const result = buildCollectionItemRef(
      {
        ...COLLECTION_ITEM_INITIAL_FORM,
        claim: "  Drop  ",
        claimChest: String(Chest.HELLTIDE),
        claimDescription: "  Found in a chest  ",
        claimMonster: "  Avarice  ",
        claimZone: String(Zone.HAWEZAR),
        premium: true,
        season: "3",
      },
      [item(10), item(20)],
    );

    expect(result).toEqual({
      claim: "Drop",
      claimChest: Chest.HELLTIDE,
      claimDescription: "Found in a chest",
      claimMonster: "Avarice",
      claimZone: Zone.HAWEZAR,
      items: [10, 20],
      outOfRotation: false,
      premium: true,
      promotional: false,
      season: 3,
      unobtainable: false,
      useBaseItemName: false,
    });
  });

  test("creates editable initial state from an existing item", () => {
    const existing: CollectionItem = {
      claim: "Shop",
      claimChest: Chest.SILENT,
      claimZone: Zone.SCOSGLEN,
      id: 99,
      items: [item(1)],
      premium: true,
      season: 2,
    };

    expect(createInitialState(existing, "collection-1")).toMatchObject({
      form: {
        claim: "Shop",
        claimChest: String(Chest.SILENT),
        claimZone: String(Zone.SCOSGLEN),
        premium: true,
        season: "2",
      },
      selectedItems: [existing.items[0]],
      targetCollectionId: "collection-1",
    });
  });

  test("detects selected item and target collection changes", () => {
    const selectedItem = item(1);
    const initialState = createInitialState(
      {
        claim: "Drop",
        id: 1,
        items: [selectedItem],
      },
      "collection-1",
    );

    expect(
      hasEditorChanges(
        initialState,
        initialState.form,
        [selectedItem],
        "collection-1",
      ),
    ).toBe(false);
    expect(
      hasEditorChanges(initialState, initialState.form, [item(2)], "collection-1"),
    ).toBe(true);
    expect(
      hasEditorChanges(initialState, initialState.form, [selectedItem], "other"),
    ).toBe(true);
  });

  test("builds collection options for the active category", () => {
    const active = collection("active", { rootCategory: MasterGroup.SEASONS });
    const sameCategory = collection("season", {
      rootCategory: MasterGroup.SEASONS,
      subcollections: [collection("season-child", { subcollections: [] })],
    });
    const otherCategory = collection("other", {
      rootCategory: MasterGroup.GENERAL,
    });

    expect(buildCollectionOptions([active, sameCategory, otherCategory], active))
      .toEqual([
        { disabled: false, id: "active", label: "active" },
        { disabled: true, id: "season", label: "season" },
        {
          disabled: false,
          id: "season-child",
          label: "season / season-child",
        },
      ]);
  });

  test("resolves preview names and single usable classes", () => {
    const prefix = item(1, "The");
    const suffix = {
      ...item(2, "Collector"),
      itemType: {
        id: 2,
        name: "Player Title (Suffix)",
      },
    };

    expect(getPreviewName({ claim: "Drop", id: 1, items: [prefix, suffix] }, suffix))
      .toBe("The Collector");
    expect(getSingleUsableClass(item(3))).toBe(CharacterClass.BARBARIAN);
  });
});
