import { act, renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MasterGroup, catalogGroups } from "../../common";
import type { DadDb, DadDbRef } from "../../data";
import type { DataContextType } from "../../data/context";
import { hydrateDadDb } from "../../data/factory";
import { fetchHybridDadDbRefsByCategory } from "../../store/catalog";
import { getCatalogRouteLoadPlan, useCatalogRouteLoading } from "./loading";

const mocks = vi.hoisted(() => ({
  fetchHybridDadDbRefsByCategory: vi.fn(),
  hydrateDadDb: vi.fn(),
}));

vi.mock("../../store/catalog", () => ({
  fetchHybridDadDbRefsByCategory: mocks.fetchHybridDadDbRefsByCategory,
}));

vi.mock("../../data/factory", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../data/factory")>()),
  hydrateDadDb: mocks.hydrateDadDb,
}));

const dadDbRef: DadDbRef = {
  collections: [],
  items: [],
  itemTypes: [],
};

const dadDb: DadDb = {
  collections: [],
  items: [],
  itemTypes: [],
};

function renderCatalogLoading(
  options: Partial<Parameters<typeof useCatalogRouteLoading>[0]> = {},
) {
  const setCatalogCategoryDb = vi.fn();

  const hook = renderHook(() =>
    useCatalogRouteLoading({
      canEditCatalog: false,
      catalogGroupSources: {},
      group: MasterGroup.GENERAL,
      isAuthLoading: false,
      loadedCatalogGroups: [],
      setCatalogCategoryDb:
        setCatalogCategoryDb as DataContextType["setCatalogCategoryDb"],
      ...options,
    }),
  );

  return {
    ...hook,
    setCatalogCategoryDb,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchHybridDadDbRefsByCategory).mockResolvedValue([
    {
      category: MasterGroup.GENERAL,
      dadDbRef,
    },
  ]);
  vi.mocked(hydrateDadDb).mockReturnValue(dadDb);
});

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

describe("catalog loading", () => {
  test("waits for auth", () => {
    const { result, setCatalogCategoryDb } = renderCatalogLoading({
      isAuthLoading: true,
    });

    expect(result.current).toEqual({
      catalogError: undefined,
      isCatalogLoading: false,
    });
    expect(fetchHybridDadDbRefsByCategory).not.toHaveBeenCalled();
    expect(setCatalogCategoryDb).not.toHaveBeenCalled();
  });

  test("skips loaded groups", () => {
    const { result, setCatalogCategoryDb } = renderCatalogLoading({
      loadedCatalogGroups: [MasterGroup.GENERAL],
    });

    expect(result.current).toEqual({
      catalogError: undefined,
      isCatalogLoading: false,
    });
    expect(fetchHybridDadDbRefsByCategory).not.toHaveBeenCalled();
    expect(setCatalogCategoryDb).not.toHaveBeenCalled();
  });

  test("loads groups", async () => {
    const { result, setCatalogCategoryDb } = renderCatalogLoading();

    await waitFor(() =>
      expect(fetchHybridDadDbRefsByCategory).toHaveBeenCalledWith(
        [MasterGroup.GENERAL],
        { source: "bundle" },
      ),
    );
    await waitFor(() =>
      expect(setCatalogCategoryDb).toHaveBeenCalledWith(
        MasterGroup.GENERAL,
        dadDb,
        "bundle",
      ),
    );

    expect(hydrateDadDb).toHaveBeenCalledWith(dadDbRef);
    expect(result.current).toEqual({
      catalogError: undefined,
      isCatalogLoading: false,
    });
  });

  test("ignores stale loads", async () => {
    let resolveCatalog!: (
      value: Awaited<ReturnType<typeof fetchHybridDadDbRefsByCategory>>,
    ) => void;
    vi.mocked(fetchHybridDadDbRefsByCategory).mockReturnValue(
      new Promise((resolve) => {
        resolveCatalog = resolve;
      }),
    );
    const { setCatalogCategoryDb, unmount } = renderCatalogLoading();

    await waitFor(() =>
      expect(fetchHybridDadDbRefsByCategory).toHaveBeenCalled(),
    );
    unmount();
    await act(async () => {
      resolveCatalog([
        {
          category: MasterGroup.GENERAL,
          dadDbRef,
        },
      ]);
    });

    expect(hydrateDadDb).not.toHaveBeenCalled();
    expect(setCatalogCategoryDb).not.toHaveBeenCalled();
  });

  test("reports errors", async () => {
    vi.mocked(fetchHybridDadDbRefsByCategory).mockRejectedValue(
      new Error("catalog failed"),
    );
    const { result, setCatalogCategoryDb } = renderCatalogLoading();

    await waitFor(() =>
      expect(result.current).toEqual({
        catalogError: "catalog failed",
        isCatalogLoading: false,
      }),
    );
    expect(setCatalogCategoryDb).not.toHaveBeenCalled();
  });
});
