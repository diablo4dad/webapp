import { useEffect, useState } from "react";
import { toggleValueInArray } from "../../common/arrays";
import {
  getCollectionLogViewModel,
  saveCollectionLogViewModel,
} from "../../store/local";

export type CollectionLogViewModel = {
  openCollections: string[];
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
