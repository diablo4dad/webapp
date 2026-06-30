import { useEffect, useState } from "react";
import { toggleValueInArray } from "../../common/arrays";
import type { Collection, CollectionGroup, CollectionItem } from "../../data";
import { countAllItemsDabDb } from "../../data/aggregate";
import { selectCollectionById, selectItemOrDefault } from "../../data/reducers";
import {
  getCollectionLogViewModel,
  saveCollectionLogViewModel,
} from "../../store/local";

const EMPTY_FOCUS_ITEM_ID = -1;

export type CollectionLogViewModel = {
  openCollections: string[];
};

export type CollectionLogFocusInput = {
  collections: CollectionGroup;
  focusCollectionId?: string;
  focusItemId: number;
};

export type CollectionLogFocusState = {
  focusCollection?: Collection;
  focusItem: CollectionItem;
  isItemSidebarLoading: boolean;
};

export type CollectionLogViewStateInput = {
  catalogCollections: CollectionGroup;
  focusCollectionId?: string;
  focusItemId: number;
  isAuthLoading: boolean;
  isCatalogLoading: boolean;
  visibleCollections: CollectionGroup;
};

export type CollectionLogViewState = CollectionLogFocusState & {
  collections: CollectionGroup;
  isEmpty: boolean;
  isLoading: boolean;
};

export type CollectionLogState = {
  openCollections: string[];
  setOpenCollection: (collectionId: string, isOpen: boolean) => void;
};

export function setCollectionOpen(
  viewModel: CollectionLogViewModel,
  collectionId: string,
  isOpen: boolean,
): CollectionLogViewModel {
  return {
    ...viewModel,
    openCollections: toggleValueInArray(
      viewModel.openCollections,
      collectionId,
      isOpen,
    ),
  };
}

export function getFocusState({
  collections,
  focusCollectionId,
  focusItemId,
}: CollectionLogFocusInput): CollectionLogFocusState {
  return {
    focusCollection: selectCollectionById(collections, focusCollectionId),
    focusItem: selectItemOrDefault(collections, focusItemId),
    isItemSidebarLoading: focusItemId === EMPTY_FOCUS_ITEM_ID,
  };
}

export function isCollectionLogEmpty(collections: CollectionGroup): boolean {
  return countAllItemsDabDb(collections) === 0;
}

export function getCollectionLogViewState({
  catalogCollections,
  focusCollectionId,
  focusItemId,
  isAuthLoading,
  isCatalogLoading,
  visibleCollections,
}: CollectionLogViewStateInput): CollectionLogViewState {
  return {
    ...getFocusState({
      collections: catalogCollections,
      focusCollectionId,
      focusItemId,
    }),
    collections: visibleCollections,
    isEmpty: isCollectionLogEmpty(visibleCollections),
    isLoading: isAuthLoading || isCatalogLoading,
  };
}

export function useCollectionLogState(): CollectionLogState {
  const [viewModel, setViewModel] = useState<CollectionLogViewModel>(
    getCollectionLogViewModel,
  );

  useEffect(() => {
    saveCollectionLogViewModel(viewModel);
  }, [viewModel]);

  function setOpenCollection(collectionId: string, isOpen: boolean) {
    setViewModel((currentViewModel) =>
      setCollectionOpen(currentViewModel, collectionId, isOpen),
    );
  }

  return {
    openCollections: viewModel.openCollections,
    setOpenCollection,
  };
}
