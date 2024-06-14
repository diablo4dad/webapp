import { DadCollection, DadCollectionItem, DadDb } from "./index";
import { Configuration, getEnabledItemTypes } from "../common";

import { doesHaveWardrobePlaceholder } from "./predicates";

function filterCollectionItems(
  db: DadDb,
  filter: (dci: DadCollectionItem) => boolean,
): DadDb {
  function applyFilter(dc: DadCollection): DadCollection {
    return {
      ...dc,
      collectionItems: dc.collectionItems.filter(filter),
      subcollections: dc.subcollections
        .map(applyFilter)
        .filter((sc) => sc.collectionItems.length),
    };
  }

  return {
    collections: db.collections.map(applyFilter),
  };
}

function filterItemsByType(
  itemTypes: string[],
): (dci: DadCollectionItem) => boolean {
  return function (dci: DadCollectionItem) {
    return (
      itemTypes.flatMap((it) => dci.items.filter((di) => di.itemType === it))
        .length !== 0
    );
  };
}

function filterPremiumItems(): (dci: DadCollectionItem) => boolean {
  return (dci: DadCollectionItem) => dci.premium !== true;
}

function filterPromotionalItems(): (dci: DadCollectionItem) => boolean {
  return (dci: DadCollectionItem) => dci.promotional !== true;
}

function filterOutOfRotationItems(): (dci: DadCollectionItem) => boolean {
  return (dci: DadCollectionItem) => dci.outOfRotation !== true;
}

function filterUnobtainableItems(): (dci: DadCollectionItem) => boolean {
  return (dci: DadCollectionItem) => dci.unobtainable !== true;
}

export function filterWardrobePlaceholderItems(): (
  dci: DadCollectionItem,
) => boolean {
  return (dci: DadCollectionItem) =>
    dci.items.filter(doesHaveWardrobePlaceholder).length !== 0;
}

function filterCollectedItems(
  isCollected: (strapiId: number) => boolean,
): (dci: DadCollectionItem) => boolean {
  return (dci: DadCollectionItem) => !isCollected(dci.strapiId);
}

function filterHiddenItems(
  isHidden: (strapiId: number) => boolean,
): (dci: DadCollectionItem) => boolean {
  return (dci: DadCollectionItem) => !isHidden(dci.strapiId);
}

export function filterDb(
  dadDb: DadDb,
  config: Configuration,
  isHidden: (strapiId: number) => boolean,
  isCollected: (strapiId: number) => boolean,
): DadDb {
  let db = filterCollectionItems(
    dadDb,
    filterItemsByType(getEnabledItemTypes(config)),
  );

  if (!config.showPremium) {
    db = filterCollectionItems(db, filterPremiumItems());
  }

  if (!config.showOutOfRotation) {
    db = filterCollectionItems(db, filterOutOfRotationItems());
  }

  if (!config.showPromotional) {
    db = filterCollectionItems(db, filterPromotionalItems());
  }

  if (!config.showHiddenItems) {
    db = filterCollectionItems(db, filterHiddenItems(isHidden));
  }

  if (!config.showUnobtainable) {
    db = filterCollectionItems(db, filterUnobtainableItems());
  }

  if (config.hideCollectedItems) {
    db = filterCollectionItems(db, filterCollectedItems(isCollected));
  }

  if (config.showWardrobePlaceholdersOnly) {
    db = filterCollectionItems(db, filterWardrobePlaceholderItems());
  }

  return db;
}
