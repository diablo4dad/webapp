import { MasterGroup, catalogGroups } from "../../common";
import { getCatalogRouteLoadPlan } from "./loading";

describe("catalog load plan", () => {
  describe("bundle source", () => {
    test("loads active groups", () => {
      const plan = getCatalogRouteLoadPlan({
        canEditCatalog: false,
        catalogGroupSources: {},
        group: MasterGroup.GENERAL,
        loadedCatalogGroups: [],
      });

      expect(plan).toEqual({
        groupsToFetch: [MasterGroup.GENERAL],
        source: "bundle",
        targetGroups: [MasterGroup.GENERAL],
      });
    });

    test("skips loaded groups", () => {
      const plan = getCatalogRouteLoadPlan({
        canEditCatalog: false,
        catalogGroupSources: {
          [MasterGroup.GENERAL]: "firestore",
        },
        group: MasterGroup.GENERAL,
        loadedCatalogGroups: [MasterGroup.GENERAL],
      });

      expect(plan.groupsToFetch).toEqual([]);
    });
  });

  describe("universal route", () => {
    test("expands to catalog groups", () => {
      const plan = getCatalogRouteLoadPlan({
        canEditCatalog: false,
        catalogGroupSources: {},
        group: MasterGroup.UNIVERSAL,
        loadedCatalogGroups: [MasterGroup.GENERAL, MasterGroup.SHOP_ITEMS],
      });

      expect(plan.targetGroups).toEqual(catalogGroups);
      expect(plan.groupsToFetch).toEqual([
        MasterGroup.PROMOTIONAL,
        MasterGroup.SEASONS,
        MasterGroup.CHALLENGE,
      ]);
    });

    test("does not include universal", () => {
      const plan = getCatalogRouteLoadPlan({
        canEditCatalog: false,
        catalogGroupSources: {},
        group: MasterGroup.UNIVERSAL,
        loadedCatalogGroups: catalogGroups,
      });

      expect(plan.groupsToFetch).not.toContain(MasterGroup.UNIVERSAL);
    });
  });

  describe("firestore source", () => {
    test("reloads stale editor groups", () => {
      const plan = getCatalogRouteLoadPlan({
        canEditCatalog: true,
        catalogGroupSources: {
          [MasterGroup.GENERAL]: "bundle",
          [MasterGroup.SHOP_ITEMS]: "firestore",
        },
        group: MasterGroup.UNIVERSAL,
        loadedCatalogGroups: [MasterGroup.GENERAL, MasterGroup.SHOP_ITEMS],
      });

      expect(plan.source).toBe("firestore");
      expect(plan.groupsToFetch).toEqual([
        MasterGroup.GENERAL,
        MasterGroup.PROMOTIONAL,
        MasterGroup.SEASONS,
        MasterGroup.CHALLENGE,
      ]);
    });
  });
});
