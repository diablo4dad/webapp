import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MasterGroup } from "../../common";
import type { Collection, CollectionItem } from "../../data";
import { Component } from "./route";
import type { CollectionLogView } from "./view";

type ViewProps = Parameters<typeof CollectionLogView>[0];

type RouteOptions = {
  canEditCatalog?: boolean;
  catalogError?: string;
  isAuthLoading?: boolean;
  isCatalogLoading?: boolean;
};

const mocks = vi.hoisted(() => ({
  renderView: vi.fn(),
  useAuth: vi.fn(),
  useCatalogLoading: vi.fn(),
  useData: vi.fn(),
  useEditor: vi.fn(),
  useLoaderData: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useLoaderData: mocks.useLoaderData,
}));

vi.mock("../../auth/context", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../data/context", () => ({
  useData: mocks.useData,
}));

vi.mock("../../editor/context", () => ({
  useEditor: mocks.useEditor,
}));

vi.mock("./loading", () => ({
  useCatalogLoading: mocks.useCatalogLoading,
}));

vi.mock("./view", () => ({
  CollectionLogView: (props: ViewProps) => {
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
): Collection {
  return {
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
}: RouteOptions = {}) {
  const generalItem = item(101);
  const seasonItem = item(202);
  const generalCollection = collection("general-001", [generalItem]);
  const seasonCollection = collection("season-002", [seasonItem]);
  const catalogCollections = [generalCollection, seasonCollection];
  const visibleCollections = [generalCollection];
  const catalogGroupSources = {
    [MasterGroup.GENERAL]: "bundle",
  };
  const loadedCatalogGroups = [MasterGroup.GENERAL];
  const setCatalogCategoryDb = vi.fn();
  const setFocusCollectionId = vi.fn();
  const setFocusItemId = vi.fn();
  const switchDb = vi.fn();
  const sidebarVisibility = {
    showConfig: true,
    showItem: true,
  };

  mocks.useLoaderData.mockReturnValue({ group: MasterGroup.SEASONS });
  mocks.useAuth.mockReturnValue({ isLoading: isAuthLoading });
  mocks.useEditor.mockReturnValue({ canEditCatalog });
  mocks.useCatalogLoading.mockReturnValue({
    catalogError,
    isCatalogLoading,
  });
  mocks.useData.mockReturnValue({
    catalogGroupSources,
    db: {
      collections: catalogCollections,
    },
    filteredDb: visibleCollections,
    focusCollectionId: "season-002",
    focusItemId: 202,
    loadedCatalogGroups,
    setCatalogCategoryDb,
    setFocusCollectionId,
    setFocusItemId,
    sidebarVisibility,
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
    setFocusCollectionId,
    setFocusItemId,
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
        focusCollection: route.seasonCollection,
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

    expect(route.setFocusItemId).toHaveBeenCalledWith(route.generalItem.id);
    expect(route.setFocusCollectionId).toHaveBeenCalledWith(
      route.generalCollection.id,
    );
  });

  test("opens collections", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(screen.getByRole("button", { name: "Open collection" }));

    expect(screen.getByText("open general-001")).toBeInTheDocument();
  });
});
