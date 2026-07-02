import { useEffect, useState } from "react";
import { toggleValueInArray } from "../../common/arrays";
import type { Collection, CollectionGroup, CollectionItem } from "../../data";
import { countAllItemsDabDb } from "../../data/aggregate";
import { selectCollectionById, selectItemOrDefault } from "../../data/reducers";
import {
  getCollectionLogViewModel,
  saveCollectionLogViewModel,
  type CollectionLogViewModel,
} from "../../store/local";

type FocusInput = {
  collections: CollectionGroup;
  focusCollectionId?: string;
  focusItemId: number;
};

type FocusState = {
  focusCollection?: Collection;
  focusItem: CollectionItem;
  isItemSidebarLoading: boolean;
};

type FocusTargetInput = {
  collection: Collection;
  collectionItem: CollectionItem;
};

type FocusTarget = {
  collectionId: string;
  itemId: number;
};

type ViewStateInput = {
  catalogCollections: CollectionGroup;
  focusCollectionId?: string;
  focusItemId: number;
  isAuthLoading: boolean;
  isCatalogLoading: boolean;
  visibleCollections: CollectionGroup;
};

type ViewState = FocusState & {
  collections: CollectionGroup;
  isEmpty: boolean;
  isLoading: boolean;
};

type State = {
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
}: FocusInput): FocusState {
  return {
    focusCollection: selectCollectionById(collections, focusCollectionId),
    focusItem: selectItemOrDefault(collections, focusItemId),
    isItemSidebarLoading: focusItemId === EMPTY_FOCUS_ITEM_ID,
  };
}

function getFocusTarget({
  collection,
  collectionItem,
}: FocusTargetInput): FocusTarget {
  return {
    collectionId: collection.id,
    itemId: collectionItem.id,
  };
}

function hasNoItems(collections: CollectionGroup): boolean {
  return countAllItemsDabDb(collections) === 0;
}

function getViewState({
  catalogCollections,
  focusCollectionId,
  focusItemId,
  isAuthLoading,
  isCatalogLoading,
  visibleCollections,
}: ViewStateInput): ViewState {
  return {
    ...getFocusState({
      collections: catalogCollections,
      focusCollectionId,
      focusItemId,
    }),
    collections: visibleCollections,
    isEmpty: hasNoItems(visibleCollections),
    isLoading: isAuthLoading || isCatalogLoading,
  };
}

function useOpenCollections(): State {
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
  getViewState,
  getFocusState,
  getFocusTarget,
  hasNoItems,
  setCollectionOpen,
  useOpenCollections,
  type FocusInput,
  type FocusState,
  type FocusTarget,
  type FocusTargetInput,
  type State,
  type CollectionLogViewModel,
  type ViewState,
  type ViewStateInput,
};
