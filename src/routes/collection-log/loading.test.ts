import { MasterGroup, catalogGroups } from "../../common";
import { getCatalogRouteLoadPlan } from "./loading";

describe("collection log route loading plan", () => {
  test("loads the active catalog group from the bundle for normal users", () => {
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

  test("skips bundle groups that are already loaded", () => {
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

  test("expands the universal route to all concrete catalog groups", () => {
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

  test("reloads catalog groups from Firestore for editors until Firestore is the source", () => {
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

  test("does not fetch non-catalog groups directly", () => {
    const plan = getCatalogRouteLoadPlan({
      canEditCatalog: false,
      catalogGroupSources: {},
      group: MasterGroup.UNIVERSAL,
      loadedCatalogGroups: catalogGroups,
    });

    expect(plan.groupsToFetch).not.toContain(MasterGroup.UNIVERSAL);
  });
});
