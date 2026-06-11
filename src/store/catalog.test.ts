import { buildCollectionTree, CatalogCollectionDoc } from "./catalog";

describe("buildCollectionTree", () => {
  test("builds a root and one level of subcollections", () => {
    const nodes: CatalogCollectionDoc[] = [
      {
        id: 2,
        parentId: 1,
        order: 2,
        name: "Child B",
        claim: "World Drop",
        collectionItems: [],
      },
      {
        id: 1,
        parentId: null,
        order: 2,
        name: "Root B",
        category: "General",
        claim: "World Drop",
        collectionItems: [],
      },
      {
        id: 3,
        parentId: 1,
        order: 1,
        name: "Child A",
        claim: "Quest",
        collectionItems: [],
      },
      {
        id: 4,
        parentId: null,
        order: 1,
        name: "Root A",
        category: "Season",
        claim: "Battle Pass",
        collectionItems: [],
      },
    ];

    const tree = buildCollectionTree(nodes);

    expect(tree.map((node) => node.id)).toEqual([4, 1]);
    expect(tree[0]?.subcollections ?? []).toEqual([]);
    expect((tree[1]?.subcollections ?? []).map((node) => node.id)).toEqual([3, 2]);
  });

  test("throws when a node references a missing parent", () => {
    const nodes: CatalogCollectionDoc[] = [
      {
        id: 1,
        parentId: null,
        order: 1,
        name: "Root",
        category: "General",
        claim: "World Drop",
        collectionItems: [],
      },
      {
        id: 2,
        parentId: 99,
        order: 1,
        name: "Child",
        claim: "Quest",
        collectionItems: [],
      },
    ];

    expect(() => buildCollectionTree(nodes)).toThrow("references missing parent");
  });

  test("throws when a node exceeds supported depth", () => {
    const nodes: CatalogCollectionDoc[] = [
      {
        id: 1,
        parentId: null,
        order: 1,
        name: "Root",
        category: "General",
        claim: "World Drop",
        collectionItems: [],
      },
      {
        id: 2,
        parentId: 1,
        order: 1,
        name: "Child",
        claim: "Quest",
        collectionItems: [],
      },
      {
        id: 3,
        parentId: 2,
        order: 1,
        name: "Grandchild",
        claim: "Dungeon",
        collectionItems: [],
      },
    ];

    expect(() => buildCollectionTree(nodes)).toThrow("exceeds supported depth of 1");
  });
});
