import {DadCollection, DadCollectionItem, DadDb} from "../db";
import {Store} from "../store";
import {Configuration} from "../ConfigSidebar";
import {aggregateItemTypes} from "../config";

function filterCollectionItems(db: DadDb, filter: (dci: DadCollectionItem) => boolean): DadDb {
    function applyFilter(dc: DadCollection): DadCollection {
        return {
            ...dc,
            collectionItems: dc.collectionItems.filter(filter),
            subcollections: dc.subcollections.map(applyFilter).filter(sc => sc.collectionItems.length),
        };
    }

    return {
        collections: db.collections.map(applyFilter),
    };
}

function filterItemsByType(itemTypes: string[]): (dci: DadCollectionItem) => boolean {
    return function (dci: DadCollectionItem) {
        return itemTypes.flatMap(it => dci.items.filter(di => di.itemType === it)).length !== 0;
    }
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

function filterHiddenItems(store: Store): (dci: DadCollectionItem) => boolean {
    return (dci: DadCollectionItem) => !store.isHidden(dci.strapiId);
}

export function filterDb(dadDb: DadDb, store: Store, config: Configuration): DadDb {
    let db = filterCollectionItems(dadDb, filterItemsByType(aggregateItemTypes(config)));

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
        db = filterCollectionItems(db, filterHiddenItems(store));
    }

    return db;
}
