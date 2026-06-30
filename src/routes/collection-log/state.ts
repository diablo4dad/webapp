import { toggleValueInArray } from "../../common/arrays";

export type CollectionLogViewModel = {
  openCollections: string[];
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
