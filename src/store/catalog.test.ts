import {
  buildCollectionTree,
  CatalogCollectionDoc,
  getCatalogCollectionNodesBundleName,
  getCatalogCollectionNodesBundleUrl,
  moveCatalogCollectionItemRefs,
  reorderCatalogCollectionNodes,
  reorderCatalogCollectionItems,
} from "./catalog";
import { assignTransientCollectionItemIds } from "../data/factory";

describe("catalog collection node bundle helpers", () => {
  test("builds a stable named query for a catalog version", () => {
    expect(getCatalogCollectionNodesBundleName("v1")).toBe(
      "catalog-d4-v1-collectionNodes",
    );
    expect(getCatalogCollectionNodesBundleName("v1", "Season")).toBe(
      "catalog-d4-v1-Season-collectionNodes",
    );
  });

  test("builds the collection node bundle endpoint URL", () => {
    expect(getCatalogCollectionNodesBundleUrl("v1")).toBe(
      "/api/catalog/collectionNodes.bundle?versionId=v1",
    );
    expect(getCatalogCollectionNodesBundleUrl("v1", "Season")).toBe(
      "/api/catalog/collectionNodes.bundle?versionId=v1&category=Season",
    );
  });
});

describe("buildCollectionTree", () => {
  test("builds a root and one level of subcollections", () => {
    const nodes: CatalogCollectionDoc[] = [
      {
        id: "child-b",
        parentId: "root-b",
        order: 2,
        name: "Child B",
        claim: "World Drop",
        collectionItems: [],
        rootCategory: "General",
      },
      {
        id: "root-b",
        parentId: null,
        order: 2,
        name: "Root B",
        category: "General",
        claim: "World Drop",
        collectionItems: [],
        rootCategory: "General",
      },
      {
        id: "child-a",
        parentId: "root-b",
        order: 1,
        name: "Child A",
        claim: "Quest",
        collectionItems: [],
        rootCategory: "General",
      },
      {
        id: "root-a",
        parentId: null,
        order: 1,
        name: "Root A",
        category: "Season",
        claim: "Battle Pass",
        collectionItems: [],
        rootCategory: "Season",
      },
    ];

    const tree = buildCollectionTree(nodes);

    expect(tree.map((node) => node.id)).toEqual(["root-a", "root-b"]);
    expect(tree[0]?.subcollections ?? []).toEqual([]);
    expect((tree[1]?.subcollections ?? []).map((node) => node.id)).toEqual([
      "child-a",
      "child-b",
    ]);
  });

  test("throws when a node references a missing parent", () => {
    const nodes: CatalogCollectionDoc[] = [
      {
        id: "root",
        parentId: null,
        order: 1,
        name: "Root",
        category: "General",
        claim: "World Drop",
        collectionItems: [],
        rootCategory: "General",
      },
      {
        id: "child",
        parentId: "missing-parent",
        order: 1,
        name: "Child",
        claim: "Quest",
        collectionItems: [],
        rootCategory: "General",
      },
    ];

    expect(() => buildCollectionTree(nodes)).toThrow(
      "references missing parent",
    );
  });

  test("throws when a node exceeds supported depth", () => {
    const nodes: CatalogCollectionDoc[] = [
      {
        id: "root",
        parentId: null,
        order: 1,
        name: "Root",
        category: "General",
        claim: "World Drop",
        collectionItems: [],
        rootCategory: "General",
      },
      {
        id: "child",
        parentId: "root",
        order: 1,
        name: "Child",
        claim: "Quest",
        collectionItems: [],
        rootCategory: "General",
      },
      {
        id: "grandchild",
        parentId: "child",
        order: 1,
        name: "Grandchild",
        claim: "Dungeon",
        collectionItems: [],
        rootCategory: "General",
      },
    ];

    expect(() => buildCollectionTree(nodes)).toThrow(
      "exceeds supported depth of 1",
    );
  });
});

describe("reorderCatalogCollectionItems", () => {
  const collectionId = "collection";
  const collectionItems = [
    {
      name: "One",
      claim: "World Drop",
      items: [101],
    },
    {
      name: "Two",
      claim: "Dungeon",
      items: [102],
    },
    {
      name: "Three",
      claim: "Quest",
      items: [103],
    },
  ];
  const transientIds = assignTransientCollectionItemIds(
    collectionId,
    collectionItems,
  ).map((item) => item.id);

  test("reorders collection items by id", () => {
    const result = reorderCatalogCollectionItems(
      collectionId,
      collectionItems,
      [transientIds[2], transientIds[0], transientIds[1]],
    );

    expect(result).toEqual([
      collectionItems[2],
      collectionItems[0],
      collectionItems[1],
    ]);
    expect(result[0]).toBe(collectionItems[2]);
  });

  test("throws when the reordered ids do not match the current items", () => {
    expect(() =>
      reorderCatalogCollectionItems(collectionId, collectionItems, [
        transientIds[2],
        transientIds[0],
      ]),
    ).toThrow("must match the existing collection item count");

    expect(() =>
      reorderCatalogCollectionItems(collectionId, collectionItems, [
        transientIds[2],
        transientIds[0],
        99,
      ]),
    ).toThrow("was not found in the current collection order");
  });
});

describe("moveCatalogCollectionItemRefs", () => {
  const sourceCollectionId = "source";
  const targetCollectionItems = [
    {
      claim: "Shop",
      items: [201],
    },
  ];
  const sourceCollectionItems = [
    {
      claim: "World Drop",
      items: [101],
    },
    {
      claim: "Dungeon",
      items: [102],
    },
  ];
  const transientIds = assignTransientCollectionItemIds(
    sourceCollectionId,
    sourceCollectionItems,
  ).map((item) => item.id);

  test("removes an item from the source collection and appends it to the target collection", () => {
    const updatedCollectionItem = {
      claim: "Updated",
      items: [103],
      useBaseItemName: true,
    };
    const result = moveCatalogCollectionItemRefs(
      sourceCollectionId,
      sourceCollectionItems,
      targetCollectionItems,
      transientIds[1],
      updatedCollectionItem,
    );

    expect(result.sourceCollectionItems).toEqual([sourceCollectionItems[0]]);
    expect(result.targetCollectionItems).toEqual([
      targetCollectionItems[0],
      updatedCollectionItem,
    ]);
  });

  test("throws when the source item is missing", () => {
    expect(() =>
      moveCatalogCollectionItemRefs(
        sourceCollectionId,
        sourceCollectionItems,
        targetCollectionItems,
        99,
        sourceCollectionItems[0],
      ),
    ).toThrow("was not found in collection source");
  });
});

describe("reorderCatalogCollectionNodes", () => {
  const nodes: CatalogCollectionDoc[] = [
    {
      id: "root-a",
      parentId: null,
      order: 1,
      name: "Root A",
      category: "General",
      collectionItems: [],
      rootCategory: "General",
    },
    {
      id: "root-b",
      parentId: null,
      order: 2,
      name: "Root B",
      category: "General",
      collectionItems: [],
      rootCategory: "General",
    },
    {
      id: "child-a",
      parentId: "root-b",
      order: 1,
      name: "Child A",
      collectionItems: [],
      rootCategory: "General",
    },
    {
      id: "child-b",
      parentId: "root-b",
      order: 2,
      name: "Child B",
      collectionItems: [],
      rootCategory: "General",
    },
    {
      id: "season-root",
      parentId: null,
      order: 1,
      name: "Season Root",
      category: "Season",
      collectionItems: [],
      rootCategory: "Season",
    },
  ];

  test("reorders root collections in the active category", () => {
    const result = reorderCatalogCollectionNodes(nodes, {
      category: "General",
      collectionId: "root-b",
      parentId: null,
      orderedSiblingIds: ["root-b", "root-a"],
    });

    expect(
      result
        .filter((node) => node.parentId === null && node.category === "General")
        .sort((a, b) => a.order - b.order)
        .map((node) => node.id),
    ).toEqual(["root-b", "root-a"]);
    expect(result.find((node) => node.id === "season-root")?.order).toBe(1);
  });

  test("moves a root collection under an empty root", () => {
    const result = reorderCatalogCollectionNodes(nodes, {
      category: "General",
      collectionId: "root-a",
      parentId: "root-b",
      orderedSiblingIds: ["child-a", "root-a", "child-b"],
    });
    const movedNode = result.find((node) => node.id === "root-a");

    expect(movedNode?.parentId).toBe("root-b");
    expect(movedNode?.category).toBeUndefined();
    expect(movedNode?.rootCategory).toBe("General");
    expect(
      result
        .filter((node) => node.parentId === "root-b")
        .sort((a, b) => a.order - b.order)
        .map((node) => node.id),
    ).toEqual(["child-a", "root-a", "child-b"]);
  });

  test("moves a subcollection to the active category root", () => {
    const result = reorderCatalogCollectionNodes(nodes, {
      category: "General",
      collectionId: "child-a",
      parentId: null,
      orderedSiblingIds: ["root-a", "child-a", "root-b"],
    });
    const movedNode = result.find((node) => node.id === "child-a");

    expect(movedNode?.parentId).toBeNull();
    expect(movedNode?.category).toBe("General");
    expect(movedNode?.rootCategory).toBe("General");
    expect(
      result
        .filter((node) => node.parentId === null && node.category === "General")
        .sort((a, b) => a.order - b.order)
        .map((node) => node.id),
    ).toEqual(["root-a", "child-a", "root-b"]);
  });

  test("blocks moving a collection with subcollections under another collection", () => {
    expect(() =>
      reorderCatalogCollectionNodes(nodes, {
        category: "General",
        collectionId: "root-b",
        parentId: "root-a",
        orderedSiblingIds: ["root-b"],
      }),
    ).toThrow("has subcollections and cannot become a subcollection");
  });

  test("blocks moving under a collection that contains items", () => {
    const nodesWithItemParent: CatalogCollectionDoc[] = [
      {
        id: "root-a",
        parentId: null,
        order: 1,
        name: "Root A",
        category: "General",
        collectionItems: [
          {
            claim: "Quest",
            items: [1000],
          },
        ],
        rootCategory: "General",
      },
      {
        id: "root-b",
        parentId: null,
        order: 2,
        name: "Root B",
        category: "General",
        collectionItems: [],
        rootCategory: "General",
      },
    ];

    expect(() =>
      reorderCatalogCollectionNodes(nodesWithItemParent, {
        category: "General",
        collectionId: "root-b",
        parentId: "root-a",
        orderedSiblingIds: ["root-b"],
      }),
    ).toThrow("contains collection items and cannot receive subcollections");
  });

  test("blocks moves across categories", () => {
    expect(() =>
      reorderCatalogCollectionNodes(nodes, {
        category: "Season",
        collectionId: "root-a",
        parentId: null,
        orderedSiblingIds: ["season-root", "root-a"],
      }),
    ).toThrow("cannot move across categories");
  });
});
