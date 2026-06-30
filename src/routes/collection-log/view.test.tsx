import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { SidebarVisibility } from "../../common";
import type { Collection, CollectionItem } from "../../data";
import { CollectionLogView } from "./view";

vi.mock("../../collection/EmptyCollection", () => ({
  default: () => <div>empty collection</div>,
}));

vi.mock("../../collection/ItemSidebar", () => ({
  default: ({ collectionItem }: { collectionItem: CollectionItem }) => (
    <div>item sidebar {collectionItem.id}</div>
  ),
}));

vi.mock("../../collection/ItemSidebarSkeleton", () => ({
  default: () => <div>item sidebar loading</div>,
}));

vi.mock("../../collection/Ledger", () => ({
  default: ({ collections }: { collections: Collection[] }) => (
    <div>ledger {collections.length}</div>
  ),
}));

vi.mock("../../collection/LedgerSkeleton", () => ({
  default: () => <div>ledger loading</div>,
}));

vi.mock("../../collection/Progress", () => ({
  default: () => <div>progress</div>,
}));

vi.mock("../../collection/Season", () => ({
  default: () => <div>season</div>,
}));

vi.mock("../../collection/Welcome", () => ({
  default: () => <div>welcome</div>,
}));

vi.mock("../../settings/ConfigSidebar", () => ({
  default: () => <div>config sidebar</div>,
}));

type ViewOptions = {
  catalogError?: string;
  collections?: Collection[];
  isEmpty?: boolean;
  isItemSidebarLoading?: boolean;
  isLoading?: boolean;
  sidebarVisibility?: SidebarVisibility;
};

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

function renderView({
  catalogError,
  collections = [collection("general-001", [item(101)])],
  isEmpty = false,
  isItemSidebarLoading = false,
  isLoading = false,
  sidebarVisibility = { showConfig: false, showItem: false },
}: ViewOptions = {}) {
  const focusItem = item(101);

  render(
    <CollectionLogView
      catalogError={catalogError}
      collections={collections}
      focusCollection={collections[0]}
      focusItem={focusItem}
      isEmpty={isEmpty}
      isItemSidebarLoading={isItemSidebarLoading}
      isLoading={isLoading}
      onClickItem={vi.fn()}
      onCollectionChange={vi.fn()}
      openCollections={[]}
      sidebarVisibility={sidebarVisibility}
    />,
  );
}

describe("hero", () => {
  test("renders summary slots", () => {
    renderView();

    expect(screen.getByText("welcome")).toBeInTheDocument();
    expect(screen.getByText("season")).toBeInTheDocument();
    expect(screen.getByText("progress")).toBeInTheDocument();
  });
});

describe("main content", () => {
  test("shows loading", () => {
    renderView({ isLoading: true });

    expect(screen.getByText("ledger loading")).toBeInTheDocument();
    expect(screen.queryByText(/ledger 1/)).not.toBeInTheDocument();
  });

  test("shows errors", () => {
    renderView({ catalogError: "catalog failed" });

    expect(screen.getByText("catalog failed")).toBeInTheDocument();
    expect(screen.queryByText(/ledger 1/)).not.toBeInTheDocument();
  });

  test("shows empty state", () => {
    renderView({ collections: [collection("general-001")], isEmpty: true });

    expect(screen.getByText("ledger 1")).toBeInTheDocument();
    expect(screen.getByText("empty collection")).toBeInTheDocument();
  });
});

describe("sidebars", () => {
  test("hides optional slots", () => {
    renderView();

    expect(screen.queryByText(/item sidebar/)).not.toBeInTheDocument();
    expect(screen.queryByText("config sidebar")).not.toBeInTheDocument();
  });

  test("shows loading item", () => {
    renderView({
      isItemSidebarLoading: true,
      sidebarVisibility: { showConfig: false, showItem: true },
    });

    expect(screen.getByText("item sidebar loading")).toBeInTheDocument();
  });

  test("shows configured slots", () => {
    renderView({
      sidebarVisibility: { showConfig: true, showItem: true },
    });

    expect(screen.getByText("item sidebar 101")).toBeInTheDocument();
    expect(screen.getByText("config sidebar")).toBeInTheDocument();
  });
});
