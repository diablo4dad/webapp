import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import {
  Link,
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  MagicType,
  type DadDbRef,
} from "../../services/data";
import { DataContext, type DataContextType } from "../../services/data/context";
import { MasterGroup } from "../../shared/domain";
import { Component } from "./route";

type RouteEntry = string | {
  pathname: string;
  state?: unknown;
};

type RenderRouteOptions = {
  rootScrollTop?: number;
  sourceElement?: ReactNode;
};

const mocks = vi.hoisted(() => ({
  deleteCatalogItem: vi.fn(),
  fetchCatalogItems: vi.fn(),
  fetchHybridDadDbRefsByCategory: vi.fn(),
  fetchStaticDadDbRef: vi.fn(),
  upsertCatalogItem: vi.fn(),
  useEditor: vi.fn(),
}));
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
);

vi.mock("../../services/store/catalog", () => ({
  coalesceCatalogItem: (
    staticItem: { id: number } | undefined,
    catalogItem: { itemId: number } | undefined,
  ) => {
    if (!catalogItem) {
      return staticItem;
    }

    const { itemId, ...overrides } = catalogItem;

    return {
      ...staticItem,
      ...overrides,
      id: itemId,
    };
  },
  deleteCatalogItem: mocks.deleteCatalogItem,
  fetchCatalogItems: mocks.fetchCatalogItems,
  fetchHybridDadDbRefsByCategory: mocks.fetchHybridDadDbRefsByCategory,
  fetchStaticDadDbRef: mocks.fetchStaticDadDbRef,
  upsertCatalogItem: mocks.upsertCatalogItem,
}));

vi.mock("../../features/editor", () => ({
  useEditor: mocks.useEditor,
}));

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return this.getAttribute("aria-label") === "Database item results"
        ? 680
        : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return this.getAttribute("aria-label") === "Database item results"
        ? 360
        : 0;
    },
  });
});

afterAll(() => {
  if (originalOffsetHeight) {
    Object.defineProperty(
      HTMLElement.prototype,
      "offsetHeight",
      originalOffsetHeight,
    );
  }

  if (originalOffsetWidth) {
    Object.defineProperty(
      HTMLElement.prototype,
      "offsetWidth",
      originalOffsetWidth,
    );
  }
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.deleteCatalogItem.mockResolvedValue(undefined);
  mocks.fetchCatalogItems.mockResolvedValue([]);
  mocks.fetchHybridDadDbRefsByCategory.mockResolvedValue([
    {
      category: MasterGroup.GENERAL,
      dadDbRef: dadDbRef(),
    },
  ]);
  mocks.fetchStaticDadDbRef.mockResolvedValue(dadDbRef());
  mocks.upsertCatalogItem.mockResolvedValue(undefined);
  mocks.useEditor.mockReturnValue({
    canEditCatalog: false,
    isEditMode: false,
  });
});

describe("database route", () => {
  test("renders loaded database results for everyone", async () => {
    renderRoute("/database", "helm");

    expect(screen.getByRole("status", { name: "Loading database" }))
      .toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("heading", {
      name: "Database Explorer",
    })).toBeInTheDocument();
    expect(await screen.findAllByText("Azure Helm"))
      .not.toHaveLength(0);
    expect(screen.queryByText("Crimson Sword")).not.toBeInTheDocument();
    expect(mocks.fetchCatalogItems).toHaveBeenCalledWith({
      source: "bundle",
    });
  });

  test("bypasses the cached item bundle for editors", async () => {
    mocks.useEditor.mockReturnValue({
      canEditCatalog: true,
      isEditMode: false,
    });

    renderRoute("/database");

    expect(await screen.findAllByText("Azure Helm"))
      .not.toHaveLength(0);
    expect(mocks.fetchCatalogItems).toHaveBeenCalledWith({
      source: "firestore",
    });
  });

  test("continues with static items when public catalog item loading fails", async () => {
    const warnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    mocks.fetchCatalogItems.mockRejectedValueOnce(
      new Error("catalog item bundle failed"),
    );

    renderRoute("/database");

    expect(await screen.findAllByText("Azure Helm"))
      .not.toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to load catalog item overrides"),
      expect.any(Error),
    );

    warnSpy.mockRestore();
  });

  test("uses selected item id from the route", async () => {
    renderRoute("/database/102");

    expect(await screen.findAllByText("Crimson Sword"))
      .not.toHaveLength(0);
    expect(screen.getAllByText("102")).not.toHaveLength(0);
  });

  test("renders collection log references for the selected item", async () => {
    mocks.fetchHybridDadDbRefsByCategory.mockResolvedValueOnce([
      {
        category: MasterGroup.GENERAL,
        dadDbRef: {
          ...dadDbRef(),
          collections: [
            {
              id: "monster",
              name: "Monster",
              category: MasterGroup.GENERAL,
              collectionItems: [],
              subcollections: [
                {
                  id: "world-boss",
                  name: "World Boss",
                  category: "Monster Drop",
                  collectionItems: [
                    {
                      claim: "World Boss Drop",
                      claimDescription: "Dropped by Ashava.",
                      items: [101],
                    },
                  ],
                  subcollections: [],
                },
              ],
            },
          ],
        },
      },
    ]);

    renderRoute("/database/101");

    expect(await screen.findByRole("heading", { name: "Tracker Data" }))
      .toBeInTheDocument();
    expect(screen.getByText("Monster Drop")).toBeInTheDocument();
    expect(screen.getByText("Monster / World Boss")).toBeInTheDocument();
    expect(screen.getByText("World Boss Drop")).toBeInTheDocument();
    expect(screen.getByText("Dropped by Ashava.")).toBeInTheDocument();
  });

  test("routes selected item changes", async () => {
    const user = userEvent.setup();

    const { rootScrollContainer } = renderRoute(
      "/database/102",
      "",
      {},
      { rootScrollTop: 260 },
    );

    const list = await screen.findByLabelText("Database item results");
    await user.click(await within(list).findByRole("button", {
      name: /Azure Helm/,
    }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/database/101",
      );
    });
    expect(rootScrollContainer.scrollTop).toBe(260);
  });

  test("resets root scroll when opened from a reset-state link", async () => {
    const user = userEvent.setup();
    const { rootScrollContainer } = renderRoute(
      "/",
      "",
      {},
      {
        rootScrollTop: 260,
        sourceElement: (
          <Link
            state={{ resetDatabaseScroll: true }}
            to="/database/101"
          >
            Database item
          </Link>
        ),
      },
    );

    await user.click(screen.getByRole("link", { name: "Database item" }));

    expect(await screen.findAllByText("Azure Helm"))
      .not.toHaveLength(0);
    expect(rootScrollContainer.scrollTop).toBe(0);
  });

  test("shows load errors and retries", async () => {
    const user = userEvent.setup();

    mocks.fetchStaticDadDbRef
      .mockRejectedValueOnce(new Error("catalog failed"))
      .mockResolvedValueOnce(dadDbRef());

    renderRoute();

    expect(await screen.findByText("catalog failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findAllByText("Azure Helm"))
      .not.toHaveLength(0);
    expect(mocks.fetchStaticDadDbRef).toHaveBeenCalledTimes(2);
    expect(mocks.fetchCatalogItems).toHaveBeenCalledTimes(2);
  });

  test("refreshes explorer items and loaded tracker groups after saving an override", async () => {
    const user = userEvent.setup();
    const refreshedItems = createDeferred<
      Array<{ itemId: number; name: string }>
    >();
    const setCatalogCategoryDb = vi.fn();
    mocks.useEditor.mockReturnValue({
      canEditCatalog: true,
      isEditMode: true,
    });
    mocks.fetchCatalogItems
      .mockResolvedValueOnce([])
      .mockReturnValueOnce(refreshedItems.promise);
    mocks.fetchHybridDadDbRefsByCategory
      .mockResolvedValueOnce([
        {
          category: MasterGroup.GENERAL,
          dadDbRef: dadDbRef(),
        },
      ])
      .mockResolvedValueOnce([
        {
          category: MasterGroup.GENERAL,
          dadDbRef: dadDbRef(),
        },
        {
          category: MasterGroup.SHOP_ITEMS,
          dadDbRef: dadDbRef(),
        },
      ]);

    renderRoute("/database/101", "", {
      loadedCatalogGroups: [MasterGroup.GENERAL, MasterGroup.SHOP_ITEMS],
      setCatalogCategoryDb:
        setCatalogCategoryDb as DataContextType["setCatalogCategoryDb"],
    });

    const overrideForm = (await screen.findByText("Database Item Override"))
      .closest("form");

    expect(overrideForm).not.toBeNull();

    await user.type(
      within(overrideForm as HTMLElement).getByLabelText("Name"),
      "Updated Helm",
    );
    await user.click(
      within(overrideForm as HTMLElement).getByRole("button", {
        name: "Save override",
      }),
    );

    await waitFor(() =>
      expect(mocks.upsertCatalogItem).toHaveBeenCalledWith({
        itemId: 101,
        name: "Updated Helm",
      }),
    );
    await waitFor(() =>
      expect(mocks.fetchCatalogItems).toHaveBeenCalledTimes(2),
    );
    expect(screen.queryByRole("status", { name: "Loading database" }))
      .not.toBeInTheDocument();
    expect(screen.getAllByText("Azure Helm")).not.toHaveLength(0);
    await waitFor(() =>
      expect(mocks.fetchHybridDadDbRefsByCategory).toHaveBeenCalledWith(
        [MasterGroup.GENERAL, MasterGroup.SHOP_ITEMS],
        { source: "firestore" },
      ),
    );
    await waitFor(() =>
      expect(setCatalogCategoryDb).toHaveBeenCalledWith(
        MasterGroup.GENERAL,
        expect.objectContaining({
          items: expect.any(Array),
        }),
        "firestore",
      ),
    );
    expect(setCatalogCategoryDb).toHaveBeenCalledWith(
      MasterGroup.SHOP_ITEMS,
      expect.objectContaining({
        items: expect.any(Array),
      }),
      "firestore",
    );
    refreshedItems.resolve([
      {
        itemId: 101,
        name: "Updated Helm",
      },
    ]);
    expect(await screen.findAllByText("Updated Helm"))
      .not.toHaveLength(0);
  });

  test("registers database shell controls", () => {
    const { rootContext } = renderRoute();

    expect(rootContext.setRootShellControls).toHaveBeenCalledWith({
      isContentConstrained: false,
      isFooterVisible: true,
      searchPlaceholder: "Search database",
      searchTitle: "Database Search",
      showCollectionControls: false,
      showEditorControl: true,
      showSearch: true,
    });
  });

});

function dadDbRef(): DadDbRef {
  return {
    collections: [],
    itemTypes: [
      {
        id: 1,
        name: "Helm",
      },
      {
        id: 2,
        name: "Sword",
      },
    ],
    items: [
      {
        icon: 1,
        id: 101,
        itemType: 1,
        magicType: MagicType.MAGIC,
        name: "Azure Helm",
      },
      {
        icon: 2,
        id: 102,
        itemType: 2,
        magicType: MagicType.LEGENDARY,
        name: "Crimson Sword",
      },
    ],
  };
}

function renderRoute(
  initialEntry: RouteEntry = "/database",
  searchTerm = "",
  dataContextOverrides: Partial<DataContextType> = {},
  options: RenderRouteOptions = {},
) {
  const rootContext = {
    onSearchChange: vi.fn(),
    searchTerm,
    setRootShellControls: vi.fn(),
    sidebarVisibility: {
      showConfig: true,
      showItem: true,
    },
  };
  const dataContext = createDataContext(dataContextOverrides);
  let rootScrollContainer: HTMLElement | undefined;
  const renderResult = render(
    <div
      data-root-scroll-container="true"
      data-testid="root-scroll-container"
      ref={(element) => {
        if (element && rootScrollContainer === undefined) {
          element.scrollTop = options.rootScrollTop ?? 0;
          rootScrollContainer = element;
        }
      }}
    >
      <DataContext.Provider value={dataContext}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/"
              element={(
                <>
                  <LocationProbe />
                  <Outlet context={rootContext} />
                </>
              )}
            >
              {options.sourceElement && (
                <Route index element={options.sourceElement} />
              )}
              <Route path="database" element={<Component />} />
              <Route path="database/:itemId" element={<Component />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </DataContext.Provider>
    </div>,
  );

  return {
    ...renderResult,
    dataContext,
    rootScrollContainer: rootScrollContainer as HTMLElement,
    rootContext,
  };
}

function createDataContext(
  overrides: Partial<DataContextType> = {},
): DataContextType {
  return {
    catalogGroupSources: {},
    db: {
      collections: [],
      itemTypes: [],
      items: [],
    },
    group: MasterGroup.GENERAL,
    loadedCatalogGroups: [],
    setCatalogCategoryDb: vi.fn(),
    setDb: vi.fn(),
    switchDb: vi.fn(),
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    reject,
    resolve,
  };
}
