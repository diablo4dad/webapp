import { useEffect, useState } from "react";
import { toggleValueInArray } from "../../common/arrays";
import type { Collection, CollectionGroup, CollectionItem } from "../../data";
import { countAllItemsDabDb } from "../../data/aggregate";
import { selectCollectionById, selectItemOrDefault } from "../../data/reducers";
import {
  getCollectionLogViewModel,
  saveCollectionLogViewModel,
} from "../../store/local";

type CollectionLogViewModel = {
  openCollections: string[];
};

type CollectionLogFocusInput = {
  collections: CollectionGroup;
  focusCollectionId?: string;
  focusItemId: number;
};

type CollectionLogFocusState = {
  focusCollection?: Collection;
  focusItem: CollectionItem;
  isItemSidebarLoading: boolean;
};

type CollectionLogFocusTargetInput = {
  collection: Collection;
  collectionItem: CollectionItem;
};

type CollectionLogFocusTarget = {
  collectionId: string;
  itemId: number;
};

type CollectionLogViewStateInput = {
  catalogCollections: CollectionGroup;
  focusCollectionId?: string;
  focusItemId: number;
  isAuthLoading: boolean;
  isCatalogLoading: boolean;
  visibleCollections: CollectionGroup;
};

type CollectionLogViewState = CollectionLogFocusState & {
  collections: CollectionGroup;
  isEmpty: boolean;
  isLoading: boolean;
};

type CollectionLogState = {
  openCollections: string[];
  setOpenCollection: (collectionId: string, isOpen: boolean) => void;
};

const EMPTY_FOCUS_ITEM_ID = -1;

function setCollectionOpen(
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

function getFocusState({
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

function getFocusTarget({
  collection,
  collectionItem,
}: CollectionLogFocusTargetInput): CollectionLogFocusTarget {
  return {
    collectionId: collection.id,
    itemId: collectionItem.id,
  };
}

function isCollectionLogEmpty(collections: CollectionGroup): boolean {
  return countAllItemsDabDb(collections) === 0;
}

function getCollectionLogViewState({
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

function useCollectionLogState(): CollectionLogState {
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

export {
  getCollectionLogViewState,
  getFocusState,
  getFocusTarget,
  isCollectionLogEmpty,
  setCollectionOpen,
  useCollectionLogState,
  type CollectionLogFocusInput,
  type CollectionLogFocusState,
  type CollectionLogFocusTarget,
  type CollectionLogFocusTargetInput,
  type CollectionLogState,
  type CollectionLogViewModel,
  type CollectionLogViewState,
  type CollectionLogViewStateInput,
};
