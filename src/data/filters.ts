import { DadCollection, DadCollectionItem, DadDb } from "./index";
import { getEnabledItemTypes } from "../common";

import { doesHaveWardrobePlaceholder } from "./predicates";
import { Option, Settings } from "../settings/type";
import { isEnabled } from "../settings/predicate";
import { CollectionLog } from "../collection/type";
import { isItemCollected, isItemHidden } from "../collection/predicate";
import { getDiabloItemIds } from "./getters";

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
  collectionLog: CollectionLog,
): (dci: DadCollectionItem) => boolean {
  return (dci: DadCollectionItem) =>
    !isItemCollected(collectionLog, getDiabloItemIds(dci));
}

function filterHiddenItems(
  collectionLog: CollectionLog,
): (dci: DadCollectionItem) => boolean {
  return (dci: DadCollectionItem) =>
    !isItemHidden(collectionLog, getDiabloItemIds(dci));
}

export function filterDb(
  dadDb: DadDb,
  settings: Settings,
  log: CollectionLog,
): DadDb {
  let db = filterCollectionItems(
    dadDb,
    filterItemsByType(getEnabledItemTypes(settings)),
  );

  if (!isEnabled(settings, Option.SHOW_PREMIUM)) {
    db = filterCollectionItems(db, filterPremiumItems());
  }

  if (!isEnabled(settings, Option.SHOW_OUT_OF_ROTATION)) {
    db = filterCollectionItems(db, filterOutOfRotationItems());
  }

  if (!isEnabled(settings, Option.SHOW_PROMOTIONAL)) {
    db = filterCollectionItems(db, filterPromotionalItems());
  }

  if (!isEnabled(settings, Option.SHOW_HIDDEN)) {
    db = filterCollectionItems(db, filterHiddenItems(log));
  }

  if (!isEnabled(settings, Option.SHOW_UNOBTAINABLE)) {
    db = filterCollectionItems(db, filterUnobtainableItems());
  }

  if (isEnabled(settings, Option.HIDE_COLLECTED)) {
    db = filterCollectionItems(db, filterCollectedItems(log));
  }

  if (isEnabled(settings, Option.SHOW_WARDROBE_ONLY)) {
    db = filterCollectionItems(db, filterWardrobePlaceholderItems());
  }

  return db;
}
