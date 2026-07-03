import { describe, expect, test } from "vitest";
import { MasterGroup } from "../shared/domain";
import type { Collection } from "../data";
import type { CollectionDragState } from "./types";
import { getNextCollectionDragState } from "./reorder-target";

function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    category: MasterGroup.GENERAL,
    id: "alpha",
    name: "Alpha",
    collectionItems: [],
    subcollections: [],
    ...overrides,
  };
}

function dragState(
  overrides: Partial<CollectionDragState> = {},
): CollectionDragState {
  return {
    category: MasterGroup.GENERAL,
    collectionId: "alpha",
    height: 40,
    offsetX: 0,
    offsetY: 0,
    pointerX: 0,
    pointerY: 0,
    sourceParentId: null,
    sourceSiblingIds: ["alpha", "beta", "gamma"],
    targetIndex: 0,
    targetParentId: null,
    targetSiblingIds: ["alpha", "beta", "gamma"],
    width: 120,
    ...overrides,
  };
}

function reorderElement(collectionId: string, top = 0, height = 40) {
  const element = document.createElement("div");
  element.dataset.collectionId = collectionId;
  element.dataset.collectionReorderItem = "true";
  element.getBoundingClientRect = () =>
    ({
      bottom: top + height,
      height,
      left: 0,
      right: 120,
      top,
      width: 120,
      x: 0,
      y: top,
      toJSON: () => undefined,
    }) as DOMRect;

  return element;
}

function dropList(parentId: string, category = MasterGroup.GENERAL) {
  const element = document.createElement("div");
  element.dataset.collectionCategory = category;
  element.dataset.collectionDropList = "true";
  element.dataset.collectionParentId = parentId;

  return element;
}

describe("reorder target", () => {
  test("updates the pointer when no drop target is hit", () => {
    expect(
      getNextCollectionDragState({
        collections: [collection()],
        currentDragState: dragState(),
        group: MasterGroup.GENERAL,
        hitElement: undefined,
        pointerX: 12,
        pointerY: 34,
      }),
    ).toMatchObject({
      pointerX: 12,
      pointerY: 34,
      targetParentId: null,
    });
  });

  test("targets a collection header center band as a new parent", () => {
    const targetElement = reorderElement("target", 0, 100);
    const child = document.createElement("span");
    targetElement.append(child);

    expect(
      getNextCollectionDragState({
        collections: [
          collection(),
          collection({
            id: "target",
            subcollections: [
              collection({
                id: "child-a",
              }),
              collection({
                id: "child-b",
              }),
            ],
          }),
        ],
        currentDragState: dragState(),
        group: MasterGroup.GENERAL,
        hitElement: child,
        pointerX: 20,
        pointerY: 50,
      }),
    ).toMatchObject({
      targetIndex: 2,
      targetParentId: "target",
      targetSiblingIds: ["child-a", "child-b"],
    });
  });

  test("ignores collection header edges", () => {
    const targetElement = reorderElement("target", 0, 100);

    expect(
      getNextCollectionDragState({
        collections: [
          collection(),
          collection({
            id: "target",
          }),
        ],
        currentDragState: dragState(),
        group: MasterGroup.GENERAL,
        hitElement: targetElement,
        pointerX: 20,
        pointerY: 10,
      }),
    ).toMatchObject({
      targetIndex: 0,
      targetParentId: null,
    });
  });

  test("targets a matching drop list by pointer position", () => {
    const listElement = dropList("root");
    const beta = reorderElement("beta", 0, 20);
    const gamma = reorderElement("gamma", 20, 20);
    listElement.append(beta, gamma);

    expect(
      getNextCollectionDragState({
        collections: [
          collection(),
          collection({
            id: "beta",
          }),
          collection({
            id: "gamma",
          }),
        ],
        currentDragState: dragState(),
        group: MasterGroup.GENERAL,
        hitElement: listElement,
        pointerX: 20,
        pointerY: 15,
      }),
    ).toMatchObject({
      targetIndex: 1,
      targetParentId: null,
      targetSiblingIds: ["beta", "gamma"],
    });
  });

  test("ignores drop lists from another category", () => {
    expect(
      getNextCollectionDragState({
        collections: [collection()],
        currentDragState: dragState(),
        group: MasterGroup.GENERAL,
        hitElement: dropList("root", MasterGroup.SEASONS),
        pointerX: 20,
        pointerY: 15,
      }),
    ).toMatchObject({
      targetIndex: 0,
      targetParentId: null,
    });
  });
});
