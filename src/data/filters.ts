import Fuse from "fuse.js";
import { isItemCollected, isItemHidden } from "../collection/predicate";
import { CollectionLog } from "../collection/type";
import { getEnabledClasses, getEnabledItemTypes, MasterGroup } from "../common";
import { isEnabled } from "../settings/predicate";
import { Option, Settings } from "../settings/type";
import { getItemIds } from "./getters";

import {
  CharacterClass,
  Collection,
  CollectionGroup,
  CollectionItem,
} from "./index";

import { doesHaveWardrobePlaceholder } from "./predicates";
import { flattenDadDb } from "./transforms";

function filterCollectionCategory(
  group: CollectionGroup,
  category: MasterGroup,
): CollectionGroup {
  return group.filter((c) => c.category === category);
}

function filterCollectionItems(
  group: CollectionGroup,
  filter: (dci: CollectionItem) => boolean,
): CollectionGroup {
  function applyFilter(dc: Collection): Collection {
    return {
      ...dc,
      collectionItems: dc.collectionItems.filter(filter),
      subcollections: dc.subcollections
        .map(applyFilter)
        .filter((sc) => sc.collectionItems.length),
    };
  }

  return group.map(applyFilter);
}

function filterItemsByType(
  itemTypes: string[],
): (dci: CollectionItem) => boolean {
  return function (dci: CollectionItem) {
    return (
      itemTypes.flatMap((it) =>
        dci.items.filter((di) => di.itemType.name === it),
      ).length !== 0
    );
  };
}

function filterItemsByClass(
  characterClasses: CharacterClass[],
): (dci: CollectionItem) => boolean {
  return function (dci: CollectionItem) {
    if (characterClasses.length === 0) {
      return true;
    }

    return dci.items.some((di) =>
      di.usableByClass.some(
        (cc, idx) =>
          cc === 1 && characterClasses.includes(idx as CharacterClass),
      ),
    );
  };
}

function filterShopItems(): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) => dci.claim !== "Cash Shop";
}

function filterPremiumItems(): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) => dci.premium !== true;
}

function filterPromotionalItems(): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) => dci.promotional !== true;
}

function filterOutOfRotationItems(): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) => dci.outOfRotation !== true;
}

function filterUnobtainableItems(): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) => dci.unobtainable !== true;
}

export function filterWardrobePlaceholderItems(): (
  dci: CollectionItem,
) => boolean {
  return (dci: CollectionItem) =>
    dci.items.filter(doesHaveWardrobePlaceholder).length !== 0;
}

function filterCollectedItems(
  collectionLog: CollectionLog,
): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) =>
    !isItemCollected(collectionLog, getItemIds(dci));
}

function filterHiddenItems(
  collectionLog: CollectionLog,
): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) => !isItemHidden(collectionLog, getItemIds(dci));
}

function filterBattlePassItems(): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) =>
    ![
      "Battle Pass",
      "Accelerated Battle Pass",
      "Season Journey",
      "Reputation Board",
    ].includes(dci.claim);
}

function filterBattlePassAcceleratedItems(): (dci: CollectionItem) => boolean {
  return (dci: CollectionItem) => dci.claim !== "Accelerated Battle Pass";
}

function search(db: CollectionGroup, term: string): CollectionGroup {
  const options = {
    ignoreLocation: true,
    threshold: 0.15,
    keys: [
      {
        name: "items.name",
        weight: 1,
      },
      {
        name: "items.series",
        weight: 0.5,
      },
      {
        name: "items.itemType.name",
        weight: 0.5,
      },
      {
        name: "claimDescription",
        weight: 0.25,
      },
    ],
  };

  const flattenDb = flattenDadDb(db);
  const fuse = new Fuse(flattenDb, options);
  const result = fuse.search(term);

  return [
    {
      id: 888,
      name: "Search Results",
      description: `Transmogs that match term "${term}"...`,
      collectionItems: result.map((r) => r.item),
      subcollections: [],
    },
  ];

  // return filterCollectionItems(db, (ci) => resultId.includes(ci.id));
}

export function filterDb(
  group: CollectionGroup,
  settings: Settings,
  log: CollectionLog,
  category: MasterGroup,
  searchTerm: string | null = null,
  isCount: boolean = false,
): CollectionGroup {
  let db = filterCollectionCategory(
    group,
    searchTerm ? MasterGroup.UNIVERSAL : category,
  );
  db = filterCollectionItems(
    db,
    filterItemsByType(getEnabledItemTypes(settings)),
  );

  db = filterCollectionItems(
    db,
    filterItemsByClass(getEnabledClasses(settings)),
  );

  if (!isEnabled(settings, Option.SHOW_PREMIUM)) {
    db = filterCollectionItems(db, filterPremiumItems());
  }

  if (!isEnabled(settings, Option.SHOW_SHOP)) {
    db = filterCollectionItems(db, filterShopItems());
  }

  if (!isEnabled(settings, Option.SHOW_BATTLE_PASS)) {
    db = filterCollectionItems(db, filterBattlePassItems());
  }

  if (!isEnabled(settings, Option.SHOW_BATTLE_PASS_ACCELERATED)) {
    db = filterCollectionItems(db, filterBattlePassAcceleratedItems());
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

  if (isEnabled(settings, Option.HIDE_COLLECTED) && !isCount) {
    db = filterCollectionItems(db, filterCollectedItems(log));
  }

  if (isEnabled(settings, Option.SHOW_WARDROBE_ONLY)) {
    db = filterCollectionItems(db, filterWardrobePlaceholderItems());
  }

  if (searchTerm && !isCount) {
    db = search(db, searchTerm);
  }

  return db;
}
