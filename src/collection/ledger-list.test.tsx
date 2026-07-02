import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { MasterGroup } from "../common";
import type { Collection } from "../data";
import type { CollectionDragController } from "./ledger-types";
import { LedgerListView, type RenderCollectionInput } from "./ledger-list";

vi.mock("@szhsin/react-accordion", () => ({
  Accordion: ({
    children,
    onStateChange,
  }: {
    children: ReactNode;
    onStateChange?: (event: {
      current: { isEnter: boolean; isResolved: boolean };
      key: string;
    }) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onStateChange?.({
            current: { isEnter: true, isResolved: true },
            key: "alpha",
          })
        }
      >
        open alpha
      </button>
      {children}
    </div>
  ),
}));

function collection(id: string, name = id): Collection {
  return {
    id,
    name,
    collectionItems: [],
    subcollections: [],
  };
}

function controller(
  overrides: Partial<CollectionDragController> = {},
): CollectionDragController {
  return {
    beginCollectionReorder: vi.fn(),
    collectionReordering: false,
    ...overrides,
  };
}

function renderView({
  activeCollectionDragController = controller(),
  addCollectionParent,
  canAddCollection = false,
  collections = [collection("alpha"), collection("beta")],
  collectionParentId = null,
  draggedCollection,
  onCollectionChange = vi.fn(),
  onOpenCollectionCreator = vi.fn(),
  renderedCollectionIds,
  renderCollection = renderRow,
}: {
  activeCollectionDragController?: CollectionDragController;
  addCollectionParent?: Collection;
  canAddCollection?: boolean;
  collections?: Collection[];
  collectionParentId?: string | null;
  draggedCollection?: Collection;
  onCollectionChange?: (collectionId: string, isOpen: boolean) => void;
  onOpenCollectionCreator?: (
    parentCollection: Collection | undefined,
    group: MasterGroup,
  ) => void;
  renderedCollectionIds?: string[];
  renderCollection?: (input: RenderCollectionInput) => ReactNode;
} = {}) {
  const collectionIds = collections.map((candidate) => candidate.id);

  render(
    <LedgerListView
      activeCollectionDragController={activeCollectionDragController}
      addCollectionLabel="Add Collection"
      addCollectionParent={addCollectionParent}
      canAddCollection={canAddCollection}
      collectionIds={collectionIds}
      collectionParentId={collectionParentId}
      collectionsById={
        new Map(collections.map((candidate) => [candidate.id, candidate]))
      }
      draggedCollection={draggedCollection}
      group={MasterGroup.GENERAL}
      isCollectionDragRoot={true}
      onCollectionChange={onCollectionChange}
      onOpenCollectionCreator={onOpenCollectionCreator}
      renderedCollectionIds={renderedCollectionIds ?? collectionIds}
      renderCollection={renderCollection}
    />,
  );

  return {
    onCollectionChange,
    onOpenCollectionCreator,
  };
}

function renderRow({
  collection,
  collectionIndex,
  collectionSiblingIds,
}: RenderCollectionInput) {
  return (
    <div key={collection.id}>
      row {collection.id} {collectionIndex} {collectionSiblingIds.join(",")}
    </div>
  );
}

describe("ledger list", () => {
  test("renders collections through the render callback", () => {
    renderView();

    expect(screen.getByText("row alpha 0 alpha,beta")).toBeInTheDocument();
    expect(screen.getByText("row beta 1 alpha,beta")).toBeInTheDocument();
  });

  test("passes add collection actions through", () => {
    const parent = collection("parent");
    const onOpenCollectionCreator = vi.fn();
    renderView({
      addCollectionParent: parent,
      canAddCollection: true,
      onOpenCollectionCreator,
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Collection" }));

    expect(onOpenCollectionCreator).toHaveBeenCalledWith(
      parent,
      MasterGroup.GENERAL,
    );
  });

  test("forwards resolved accordion changes", () => {
    const onCollectionChange = vi.fn();
    renderView({ onCollectionChange });

    fireEvent.click(screen.getByRole("button", { name: "open alpha" }));

    expect(onCollectionChange).toHaveBeenCalledWith("alpha", true);
  });

  test("renders drag placeholder and ghost", () => {
    const alpha = collection("alpha", "Alpha");
    renderView({
      activeCollectionDragController: controller({
        collectionDragState: {
          category: MasterGroup.GENERAL,
          collectionId: "alpha",
          height: 48,
          offsetX: 4,
          offsetY: 6,
          pointerX: 40,
          pointerY: 50,
          sourceParentId: null,
          sourceSiblingIds: ["alpha", "beta"],
          targetIndex: 0,
          targetParentId: null,
          targetSiblingIds: ["alpha", "beta"],
          width: 120,
        },
      }),
      collections: [alpha, collection("beta")],
      draggedCollection: alpha,
    });

    expect(screen.queryByText(/row alpha/)).not.toBeInTheDocument();
    expect(screen.getByText("row beta 1 alpha,beta")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });
});
