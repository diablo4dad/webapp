import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { MasterGroup, catalogGroups } from "../../shared/domain";
import { Component } from "./route";
import { STATS_SHELL_CONTROLS } from "../root/outlet";

const mocks = vi.hoisted(() => ({
  onClearSearch: vi.fn(),
  setCatalogCategoryDb: vi.fn(),
  switchDb: vi.fn(),
  useAuth: vi.fn(),
  useCatalogLoading: vi.fn(),
  useData: vi.fn(),
  useEditor: vi.fn(),
  getCatalogLoadPlan: vi.fn(),
  useRootOutletContext: vi.fn(),
  useRootShellControls: vi.fn(),
}));

vi.mock("../../features/progress", () => ({
  Progress: ({
    scope,
    variant,
  }: {
    scope: MasterGroup;
    variant: string;
  }) => <div>progress {scope} {variant}</div>,
}));

vi.mock("../../services/auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../services/data/context", () => ({
  useData: mocks.useData,
}));

vi.mock("../../features/editor", () => ({
  useEditor: mocks.useEditor,
}));

vi.mock("../collection-log/loading", () => ({
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

beforeEach(() => {
  vi.resetAllMocks();
  mocks.useAuth.mockReturnValue({
    isLoading: false,
  });
  mocks.useData.mockReturnValue({
    catalogGroupSources: {},
    loadedCatalogGroups: [...catalogGroups],
    setCatalogCategoryDb: mocks.setCatalogCategoryDb,
    switchDb: mocks.switchDb,
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
  test("renders the dashboard from universal catalog progress", async () => {
    render(<Component />);

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
    expect(screen.getByText("progress Universal dashboard"))
      .toBeInTheDocument();

    await waitFor(() => {
      expect(mocks.switchDb).toHaveBeenCalledWith(MasterGroup.UNIVERSAL);
    });
  });

  test("clears stale route search", async () => {
    mocks.useRootOutletContext.mockReturnValue({
      onClearSearch: mocks.onClearSearch,
      searchTerm: "helm",
    });

    render(<Component />);

    await waitFor(() => {
      expect(mocks.onClearSearch).toHaveBeenCalledTimes(1);
    });
  });

  test("shows loading while any catalog group is missing", () => {
    mocks.useData.mockReturnValue({
      catalogGroupSources: {},
      loadedCatalogGroups: [MasterGroup.GENERAL],
      setCatalogCategoryDb: mocks.setCatalogCategoryDb,
      switchDb: mocks.switchDb,
    });
    mocks.getCatalogLoadPlan.mockReturnValue({
      groupsToFetch: [MasterGroup.SEASONS],
      source: "bundle",
      targetGroups: [...catalogGroups],
    });

    render(<Component />);

    expect(screen.getByText("Loading progress...")).toBeInTheDocument();
    expect(screen.queryByText(/progress Universal/)).not.toBeInTheDocument();
  });

  test("shows catalog load errors", () => {
    mocks.useCatalogLoading.mockReturnValue({
      catalogError: "catalog failed",
      isCatalogLoading: false,
    });

    render(<Component />);

    expect(screen.getByRole("alert")).toHaveTextContent("catalog failed");
    expect(screen.queryByText(/progress Universal/)).not.toBeInTheDocument();
  });
});
