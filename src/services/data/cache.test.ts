import { describe, expect, test } from "vitest";
import { MasterGroup } from "../../shared/domain";
import type { Collection, DadDb } from "./index";
import {
  getCatalogCollectionsByGroup,
  mergeCatalogCollections,
  rebuildDadDbFromCatalogCache,
  type CatalogCollectionsByGroup,
} from "./cache";

function collection(id: string, category?: MasterGroup): Collection {
  return {
    category,
    collectionItems: [],
    id,
    name: id,
    subcollections: [],
  };
}

function dadDb(collections: Collection[]): DadDb {
  return {
    collections,
    itemTypes: [],
    items: [],
  };
}

describe("catalog cache grouping", () => {
  test("groups catalog collections by supported category", () => {
    const general = collection("general-001", MasterGroup.GENERAL);
    const season = collection("season-001", MasterGroup.SEASONS);
    const universal = collection("universal-001", MasterGroup.UNIVERSAL);
    const missing = collection("missing-001");

    expect(
      getCatalogCollectionsByGroup([general, season, universal, missing]),
    ).toEqual({
      [MasterGroup.GENERAL]: [general],
      [MasterGroup.SEASONS]: [season],
    });
  });

  test("merges groups in catalog order", () => {
    const general = collection("general-001", MasterGroup.GENERAL);
    const season = collection("season-001", MasterGroup.SEASONS);
    const shop = collection("shop-001", MasterGroup.SHOP_ITEMS);
    const collectionsByGroup: CatalogCollectionsByGroup = {
      [MasterGroup.SEASONS]: [season],
      [MasterGroup.GENERAL]: [general],
      [MasterGroup.SHOP_ITEMS]: [shop],
    };

    expect(mergeCatalogCollections(collectionsByGroup)).toEqual([
      general,
      shop,
      season,
    ]);
  });
});

describe("catalog cache rebuild", () => {
  test("rebuilds db collections from cached groups", () => {
    const general = collection("general-001", MasterGroup.GENERAL);
    const season = collection("season-001", MasterGroup.SEASONS);
    const source = dadDb([general, season]);

    const result = rebuildDadDbFromCatalogCache(source, {
      [MasterGroup.SEASONS]: [season],
      [MasterGroup.GENERAL]: [general],
    });

    expect(result.collections.slice(0, 2)).toEqual([general, season]);
    expect(result.items).toBe(source.items);
    expect(result.itemTypes).toBe(source.itemTypes);
  });
});
