import type { Collection, CollectionItem } from "../data";
import { getAllCollectionItems, getItemIds } from "../data/getters";
import {
  CollectionActionType,
  useCollectionDispatch,
} from "./context";

type Options = {
  onToggleCollection?: (collection: Collection) => void;
  onToggleItem?: (item: CollectionItem) => void;
};

function useSectionToggles({
  onToggleCollection,
  onToggleItem,
}: Options) {
  const dispatch = useCollectionDispatch();

  const toggleItem = (collectionItem: CollectionItem) => (collected: boolean) => {
    onToggleItem?.(collectionItem);

    dispatch({
      type: CollectionActionType.COLLECT,
      itemId: getItemIds(collectionItem),
      toggle: collected,
    });
  };

  const toggleCollection =
    (collection: Collection) => (collected: boolean) => {
      onToggleCollection?.(collection);

      getAllCollectionItems(collection).forEach((collectionItem) => {
        dispatch({
          type: CollectionActionType.COLLECT,
          itemId: getItemIds(collectionItem),
          toggle: collected,
        });
      });
    };

  return {
    toggleCollection,
    toggleItem,
  };
}

export { useSectionToggles };
