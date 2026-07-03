import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MasterGroup } from "../../shared/domain";
import type { Collection, CollectionItem } from "../../data";
import { Component } from "./route";
import type { View } from "./view";

type ViewProps = Parameters<typeof View>[0];

type Options = {
  canEditCatalog?: boolean;
  catalogError?: string;
  isAuthLoading?: boolean;
  isCatalogLoading?: boolean;
};

const mocks = vi.hoisted(() => ({
  filterDb: vi.fn(),
  navigate: vi.fn(),
  renderView: vi.fn(),
  useAuth: vi.fn(),
  useCatalogLoading: vi.fn(),
  useData: vi.fn(),
  useEditor: vi.fn(),
  useLoaderData: vi.fn(),
  useNavigate: vi.fn(),
  useOutletContext: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useLoaderData: mocks.useLoaderData,
  useNavigate: mocks.useNavigate,
  useOutletContext: mocks.useOutletContext,
}));

vi.mock("../../auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../data/context", () => ({
  useData: mocks.useData,
}));

vi.mock("../../data/filters", () => ({
  filterDb: mocks.filterDb,
}));

vi.mock("../../editor", () => ({
  useEditor: mocks.useEditor,
}));

vi.mock("./loading", () => ({
  useCatalogLoading: mocks.useCatalogLoading,
}));

vi.mock("./view", () => ({
  View: (props: ViewProps) => {
    mocks.renderView(props);

    return (
      <div>
        <div>collections {props.collections.length}</div>
        <div>open {props.openCollections.join(",")}</div>
        <button
          type="button"
          onClick={() =>
            props.onClickItem(
              props.collections[0].collectionItems[0],
              props.collections[0],
            )
          }
        >
          Focus item
        </button>
        <button
          type="button"
          onClick={() => props.onCollectionChange("general-001", true)}
        >
          Open collection
        </button>
        <button
          type="button"
          onClick={() => props.onSelectCollectionGroup(MasterGroup.PROMOTIONAL)}
        >
          Select group
        </button>
      </div>
    );
  },
}));

function item(id: number): CollectionItem {
  return {
    claim: `claim-${id}`,
    id,
    items: [],
  };
}

function collection(
  id: string,
  collectionItems: CollectionItem[] = [],
  category?: MasterGroup,
): Collection {
  return {
    category,
    collectionItems,
    id,
    name: id,
    subcollections: [],
  };
}

function renderRoute({
  canEditCatalog = true,
  catalogError,
  isAuthLoading = false,
  isCatalogLoading = true,
}: Options = {}) {
  const generalItem = item(101);
  const seasonItem = item(202);
  const generalCollection = collection(
    "general-001",
    [generalItem],
    MasterGroup.GENERAL,
  );
  const seasonCollection = collection(
    "season-002",
    [seasonItem],
    MasterGroup.SEASONS,
  );
  const catalogCollections = [generalCollection, seasonCollection];
  const visibleCollections = [seasonCollection];
  const catalogGroupSources = {
    [MasterGroup.GENERAL]: "bundle",
  };
  const loadedCatalogGroups = [MasterGroup.GENERAL];
  const setCatalogCategoryDb = vi.fn();
  const switchDb = vi.fn();
  const sidebarVisibility = {
    showConfig: true,
    showItem: true,
  };

  mocks.useLoaderData.mockReturnValue({ group: MasterGroup.SEASONS });
  mocks.useNavigate.mockReturnValue(mocks.navigate);
  mocks.useOutletContext.mockReturnValue({
    searchTerm: "",
    sidebarVisibility,
  });
  mocks.useAuth.mockReturnValue({ isLoading: isAuthLoading });
  mocks.useEditor.mockReturnValue({ canEditCatalog, isEditMode: false });
  mocks.useCatalogLoading.mockReturnValue({
    catalogError,
    isCatalogLoading,
  });
  mocks.filterDb.mockReturnValue(visibleCollections);
  mocks.useData.mockReturnValue({
    catalogGroupSources,
    db: {
      collections: catalogCollections,
    },
    loadedCatalogGroups,
    setCatalogCategoryDb,
    switchDb,
  });

  render(<Component />);

  return {
    catalogCollections,
    catalogGroupSources,
    generalCollection,
    generalItem,
    loadedCatalogGroups,
    seasonCollection,
    seasonItem,
    setCatalogCategoryDb,
    sidebarVisibility,
    switchDb,
    visibleCollections,
  };
}

function getViewProps(): ViewProps {
  return mocks.renderView.mock.lastCall?.[0] as ViewProps;
}

beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
});

describe("context wiring", () => {
  test("loads catalog inputs", () => {
    const route = renderRoute({ isAuthLoading: true });

    expect(mocks.useCatalogLoading).toHaveBeenCalledWith({
      canEditCatalog: true,
      catalogGroupSources: route.catalogGroupSources,
      group: MasterGroup.SEASONS,
      isAuthLoading: true,
      loadedCatalogGroups: route.loadedCatalogGroups,
      setCatalogCategoryDb: route.setCatalogCategoryDb,
    });
  });

  test("passes derived props", () => {
    const route = renderRoute({ catalogError: "catalog failed" });

    expect(getViewProps()).toEqual(
      expect.objectContaining({
        catalogError: "catalog failed",
        collections: route.visibleCollections,
        focusCollection: undefined,
        focusItem: route.seasonItem,
        isEmpty: false,
        isItemSidebarLoading: false,
        isLoading: true,
        openCollections: [],
        sidebarVisibility: route.sidebarVisibility,
      }),
    );
  });

  test("switches group", async () => {
    const route = renderRoute();

    await waitFor(() =>
      expect(route.switchDb).toHaveBeenCalledWith(MasterGroup.SEASONS),
    );
  });
});

describe("actions", () => {
  test("focuses items", async () => {
    const user = userEvent.setup();
    const route = renderRoute();

    await user.click(screen.getByRole("button", { name: "Focus item" }));

    await waitFor(() =>
      expect(getViewProps()).toEqual(
        expect.objectContaining({
          focusCollection: route.seasonCollection,
          focusItem: route.seasonItem,
        }),
      ),
    );
  });

  test("opens collections", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(screen.getByRole("button", { name: "Open collection" }));

    expect(screen.getByText("open general-001")).toBeInTheDocument();
  });

  test("navigates between groups", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(screen.getByRole("button", { name: "Select group" }));

    expect(mocks.navigate).toHaveBeenCalledWith("/transmogs/promotional");
  });
});
