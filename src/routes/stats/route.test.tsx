import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { CollectionProvider } from "../../features/ledger/context";
import {
  defaultSettings,
  Option,
  SettingsProvider,
  type Settings,
} from "../../features/settings";
import type {
  Collection,
  CollectionItem,
  DadDb,
  Item,
  ItemType,
} from "../../services/data";
import {
  DataContext,
  type DataContextType,
} from "../../services/data/context";
import { MasterGroup, catalogGroups } from "../../shared/domain";
import { Component } from "./route";
import { STATS_SHELL_CONTROLS } from "../root/outlet";

type RenderOptions = {
  loadedCatalogGroups?: MasterGroup[];
  settingsOverrides?: Partial<Settings>;
};

const mocks = vi.hoisted(() => ({
  onClearSearch: vi.fn(),
  setCatalogCategoryDb: vi.fn(),
  switchDb: vi.fn(),
  useAuth: vi.fn(),
  useCatalogLoading: vi.fn(),
  useEditor: vi.fn(),
  getCatalogLoadPlan: vi.fn(),
  useRootOutletContext: vi.fn(),
  useRootShellControls: vi.fn(),
}));

const helmType: ItemType = {
  id: 1,
  name: "Helm",
};

vi.mock("../../services/auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../features/editor", () => ({
  useEditor: mocks.useEditor,
}));

vi.mock("../tracker/loading", () => ({
  getCatalogLoadPlan: mocks.getCatalogLoadPlan,
  useCatalogLoading: mocks.useCatalogLoading,
}));

vi.mock("../root/outlet", () => ({
  STATS_SHELL_CONTROLS: {
    isContentConstrained: false,
    isFooterVisible: true,
    searchPlaceholder: "Search transmogs",
    searchTitle: "Stats Search",
    showCollectionControls: false,
    showSearch: false,
  },
  useRootOutletContext: mocks.useRootOutletContext,
  useRootShellControls: mocks.useRootShellControls,
}));

function item(id: number): Item {
  return {
    id,
    icon: "",
    invImages: [],
    itemType: helmType,
    name: `Item ${id}`,
    similarItems: [],
    similarItemsRefs: [],
    usableByClass: [1, 1, 1, 1, 1, 1, 1, 1],
  };
}

function collectionItem(
  id: number,
  flags: Partial<Pick<CollectionItem, "outOfRotation" | "premium">> = {},
): CollectionItem {
  return {
    id,
    claim: "",
    items: [item(id)],
    ...flags,
  };
}

function collection(
  collectionItems: CollectionItem[],
  category: MasterGroup = MasterGroup.UNIVERSAL,
): Collection {
  return {
    category,
    id: `collection-${category}`,
    name: "Collection",
    collectionItems,
    subcollections: [],
  };
}

function dataContext(
  loadedCatalogGroups: MasterGroup[] = [...catalogGroups],
): DataContextType {
  const db: DadDb = {
    collections: [
      collection([collectionItem(101)], MasterGroup.GENERAL),
      collection([
        collectionItem(201),
        collectionItem(202, { premium: true }),
        collectionItem(203, { outOfRotation: true }),
      ]),
    ],
    itemTypes: [helmType],
    items: [item(101), item(201), item(202), item(203)],
  };

  return {
    catalogGroupSources: {},
    db,
    group: MasterGroup.UNIVERSAL,
    loadedCatalogGroups,
    setCatalogCategoryDb: mocks.setCatalogCategoryDb,
    setDb: vi.fn(),
    switchDb: mocks.switchDb,
  };
}

function renderRoute({
  loadedCatalogGroups = [...catalogGroups],
  settingsOverrides = {},
}: RenderOptions = {}) {
  const settings: Settings = {
    ...defaultSettings,
    ...settingsOverrides,
  };

  return render(
    <SettingsProvider settings={settings}>
      <CollectionProvider>
        <DataContext.Provider value={dataContext(loadedCatalogGroups)}>
          <Component />
        </DataContext.Provider>
      </CollectionProvider>
    </SettingsProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  mocks.useAuth.mockReturnValue({
    isLoading: false,
  });
  mocks.useEditor.mockReturnValue({
    canEditCatalog: false,
  });
  mocks.useCatalogLoading.mockReturnValue({
    catalogError: undefined,
    isCatalogLoading: false,
  });
  mocks.getCatalogLoadPlan.mockReturnValue({
    groupsToFetch: [],
    source: "bundle",
    targetGroups: [...catalogGroups],
  });
  mocks.useRootOutletContext.mockReturnValue({
    onClearSearch: mocks.onClearSearch,
    searchTerm: "",
  });
});

describe("stats route", () => {
  test("renders the overview from universal catalog progress", async () => {
    renderRoute();

    expect(mocks.useRootShellControls).toHaveBeenCalledWith(
      STATS_SHELL_CONTROLS,
    );
    expect(mocks.useCatalogLoading).toHaveBeenCalledWith(
      expect.objectContaining({
        group: MasterGroup.UNIVERSAL,
        isAuthLoading: false,
        setCatalogCategoryDb: mocks.setCatalogCategoryDb,
      }),
    );
    expect(screen.getByRole("heading", { name: "Essential" }))
      .toBeInTheDocument();
    expect(screen.getByText("1 of 6")).toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.switchDb).toHaveBeenCalledWith(MasterGroup.UNIVERSAL);
    });
  });

  test("navigates overview scopes", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(
      screen.getByRole("button", { name: "Previous collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Universal" }))
      .toBeInTheDocument();
    expect(screen.getByText("6 of 6")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Essential" }))
      .toBeInTheDocument();
  });

  test("syncs overview filters with settings", async () => {
    const user = userEvent.setup();
    renderRoute({
      settingsOverrides: {
        [Option.SHOW_PREMIUM]: false,
        [Option.SHOW_OUT_OF_ROTATION]: false,
      },
    });

    const showPremium = screen.getByRole("checkbox", {
      name: "Show Premium",
    });
    const showOutOfRotation = screen.getByRole("checkbox", {
      name: "Show Out of Rotation",
    });

    expect(showPremium).not.toBeChecked();
    expect(showOutOfRotation).not.toBeChecked();

    await user.click(showPremium);
    await user.click(showOutOfRotation);

    expect(showPremium).toBeChecked();
    expect(showOutOfRotation).toBeChecked();
  });

  test("clears stale route search", async () => {
    mocks.useRootOutletContext.mockReturnValue({
      onClearSearch: mocks.onClearSearch,
      searchTerm: "helm",
    });

    renderRoute();

    await waitFor(() => {
      expect(mocks.onClearSearch).toHaveBeenCalledTimes(1);
    });
  });

  test("shows loading while any catalog group is missing", () => {
    mocks.getCatalogLoadPlan.mockReturnValue({
      groupsToFetch: [MasterGroup.SEASONS],
      source: "bundle",
      targetGroups: [...catalogGroups],
    });

    renderRoute({ loadedCatalogGroups: [MasterGroup.GENERAL] });

    expect(screen.getByRole("status", { name: "Loading stats" }))
      .toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Loading progress...")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Essential" }))
      .not.toBeInTheDocument();
  });

  test("shows catalog load errors", () => {
    mocks.useCatalogLoading.mockReturnValue({
      catalogError: "catalog failed",
      isCatalogLoading: false,
    });

    renderRoute();

    expect(screen.getByRole("alert")).toHaveTextContent("catalog failed");
    expect(screen.queryByRole("heading", { name: "Essential" }))
      .not.toBeInTheDocument();
  });
});
