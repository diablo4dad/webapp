import type { MasterGroup } from "../../shared/domain";
import type { Collection, CollectionItem } from "../../services/data";
import type { CollectionParentId } from "./order";

type LedgerProps = {
  collections: Collection[];
  collectionDragController?: CollectionDragController;
  parentCollection?: Collection;
  onClickItem: (item: CollectionItem, collection: Collection) => void;
  onToggleItem?: (item: CollectionItem) => void;
  onToggleCollection?: (collection: Collection) => void;
  onCollectionChange: (collectionId: string, isOpen: boolean) => void;
  openCollections: string[];
  searchTerm: string;
  depth?: number;
};

type LedgerGroupProps = LedgerProps & {
  collection: Collection;
  collectionIndex: number;
  collectionSiblingIds: string[];
};

type LedgerGroupItemDragState = {
  draggedItemId: number;
  height: number;
  insertIndex: number;
  offsetX: number;
  offsetY: number;
  pointerX: number;
  pointerY: number;
  width: number;
};

type CollectionDragState = {
  category: MasterGroup;
  collectionId: string;
  height: number;
  offsetX: number;
  offsetY: number;
  pointerX: number;
  pointerY: number;
  sourceParentId: CollectionParentId;
  sourceSiblingIds: string[];
  targetIndex: number;
  targetParentId: CollectionParentId;
  targetSiblingIds: string[];
  width: number;
};

type CollectionDragController = {
  beginCollectionReorder: (
    collection: Collection,
    parentCollection: Collection | undefined,
    sourceIndex: number,
    sourceSiblingIds: string[],
    element: HTMLElement,
    pointerX: number,
    pointerY: number,
  ) => void;
  collectionDragError?: string;
  collectionDragState?: CollectionDragState;
  collectionReordering: boolean;
};

export type {
  CollectionDragController,
  CollectionDragState,
  LedgerGroupItemDragState,
  LedgerGroupProps,
  LedgerProps,
};
