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

type CollectionItemFilterOptions = {
  isCount?: boolean;
  itemTypes?: string[];
};

export function createCollectionItemSettingsFilter(
  settings: Settings,
  log?: CollectionLog,
  options: CollectionItemFilterOptions = {},
): (dci: CollectionItem) => boolean {
  const filters = [
    filterItemsByType(options.itemTypes ?? getEnabledItemTypes(settings)),
    filterItemsByClass(getEnabledClasses(settings)),
  ];

  if (!isEnabled(settings, Option.SHOW_PREMIUM)) {
    filters.push(filterPremiumItems());
  }

  if (!isEnabled(settings, Option.SHOW_SHOP)) {
    filters.push(filterShopItems());
  }

  if (!isEnabled(settings, Option.SHOW_BATTLE_PASS)) {
    filters.push(filterBattlePassItems());
  }

  if (!isEnabled(settings, Option.SHOW_BATTLE_PASS_ACCELERATED)) {
    filters.push(filterBattlePassAcceleratedItems());
  }

  if (!isEnabled(settings, Option.SHOW_OUT_OF_ROTATION)) {
    filters.push(filterOutOfRotationItems());
  }

  if (!isEnabled(settings, Option.SHOW_PROMOTIONAL)) {
    filters.push(filterPromotionalItems());
  }

  if (!isEnabled(settings, Option.SHOW_HIDDEN) && log) {
    filters.push(filterHiddenItems(log));
  }

  if (!isEnabled(settings, Option.SHOW_UNOBTAINABLE)) {
    filters.push(filterUnobtainableItems());
  }

  if (isEnabled(settings, Option.HIDE_COLLECTED) && !options.isCount && log) {
    filters.push(filterCollectedItems(log));
  }

  if (isEnabled(settings, Option.SHOW_WARDROBE_ONLY)) {
    filters.push(filterWardrobePlaceholderItems());
  }

  return (dci: CollectionItem) => filters.every((filter) => filter(dci));
}

export function filterDb(
  group: CollectionGroup,
  settings: Settings,
  log: CollectionLog | undefined,
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
    createCollectionItemSettingsFilter(settings, log, { isCount }),
  );

  if (searchTerm && !isCount) {
    db = search(db, searchTerm);
  }

  return db;
}
