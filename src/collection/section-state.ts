import type { Collection } from "../data";
import { countAllItemsInCollection } from "../data/aggregate";
import {
  countItemsInCollectionHidden,
  countItemsInCollectionOwned,
} from "./aggregate";
import type { CollectionLog } from "./type";

type Options = {
  collection: Collection;
  log: CollectionLog;
  openCollections: string[];
  parentCollection?: Collection;
};

type SectionState = {
  counterLabel: string;
  descriptionLabel?: string;
  headingLabel: string;
  isComplete: boolean;
  isOpen: boolean;
};

function getSectionState({
  collection,
  log,
  openCollections,
  parentCollection,
}: Options): SectionState {
  const collected = countItemsInCollectionOwned(log, collection);
  const total =
    countAllItemsInCollection(collection) -
    countItemsInCollectionHidden(log, collection);

  return {
    counterLabel: `[${collected}/${total}]`,
    descriptionLabel:
      parentCollection && !collection.description
        ? parentCollection.name
        : collection.description,
    headingLabel: collection.name,
    isComplete: collected === total,
    isOpen: openCollections.includes(collection.id),
  };
}

export { getSectionState };
