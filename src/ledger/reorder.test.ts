import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { MasterGroup } from "../common";
import type { Collection, DadDb } from "../data";
import type { CollectionDragController } from "./types";
import { useCollectionReorder } from "./reorder";

vi.mock("../store/catalog", () => ({
  updateCatalogCollectionNodeOrder: vi.fn(),
}));

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

function db(collections: Collection[]): DadDb {
  return {
    collections,
    items: [],
    itemTypes: [],
  };
}

function dragElement() {
  const element = document.createElement("div");

  element.getBoundingClientRect = () =>
    ({
      bottom: 64,
      height: 44,
      left: 10,
      right: 130,
      top: 20,
      width: 120,
      x: 10,
      y: 20,
      toJSON: () => undefined,
    }) as DOMRect;

  return element;
}

describe("collection reorder", () => {
  test("starts root collection drag state", () => {
    const alpha = collection();
    const beta = collection({ id: "beta", name: "Beta" });
    const { result } = renderHook(() =>
      useCollectionReorder({
        db: db([alpha, beta]),
        group: MasterGroup.GENERAL,
        searchTerm: "",
        setDb: vi.fn(),
      }),
    );

    act(() => {
      result.current.activeCollectionDragController.beginCollectionReorder(
        alpha,
        undefined,
        0,
        ["alpha", "beta"],
        dragElement(),
        35,
        50,
      );
    });

    expect(result.current.isCollectionDragRoot).toBe(true);
    expect(result.current.draggedCollection).toBe(alpha);
    expect(
      result.current.activeCollectionDragController.collectionDragState,
    ).toMatchObject({
      category: MasterGroup.GENERAL,
      collectionId: "alpha",
      height: 44,
      offsetX: 25,
      offsetY: 30,
      sourceParentId: null,
      sourceSiblingIds: ["alpha", "beta"],
      targetIndex: 0,
      targetParentId: null,
      targetSiblingIds: ["alpha", "beta"],
      width: 120,
    });
  });

  test("does not start drag while searching", () => {
    const alpha = collection();
    const { result } = renderHook(() =>
      useCollectionReorder({
        db: db([alpha]),
        group: MasterGroup.GENERAL,
        searchTerm: "helm",
        setDb: vi.fn(),
      }),
    );

    act(() => {
      result.current.activeCollectionDragController.beginCollectionReorder(
        alpha,
        undefined,
        0,
        ["alpha"],
        dragElement(),
        35,
        50,
      );
    });

    expect(
      result.current.activeCollectionDragController.collectionDragState,
    ).toBeUndefined();
  });

  test("uses a provided controller for nested ledgers", () => {
    const controller: CollectionDragController = {
      beginCollectionReorder: vi.fn(),
      collectionReordering: false,
    };
    const { result } = renderHook(() =>
      useCollectionReorder({
        collectionDragController: controller,
        db: db([]),
        group: MasterGroup.GENERAL,
        searchTerm: "",
        setDb: vi.fn(),
      }),
    );

    expect(result.current.isCollectionDragRoot).toBe(false);
    expect(result.current.activeCollectionDragController).toBe(controller);
  });
});
