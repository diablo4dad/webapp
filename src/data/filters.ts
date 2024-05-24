import {DadCollection, DadCollectionItem, DadDb} from "./index";
import {aggregateItemTypes} from "../config";
import {Configuration} from "../common";

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

function filterUnobtainableItems(): (dci: DadCollectionItem) => boolean {
    return (dci: DadCollectionItem) => dci.unobtainable !== true;
}

function filterCollectedItems(isCollected: (strapiId: number) => boolean): (dci: DadCollectionItem) => boolean {
    return (dci: DadCollectionItem) => !isCollected(dci.strapiId);
}

function filterHiddenItems(isHidden: (strapiId: number) => boolean): (dci: DadCollectionItem) => boolean {
    return (dci: DadCollectionItem) => !isHidden(dci.strapiId);
}

export function filterDb(dadDb: DadDb, config: Configuration, isHidden: (strapiId: number) => boolean, isCollected: (strapiId: number) => boolean): DadDb {
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
        db = filterCollectionItems(db, filterHiddenItems(isHidden));
    }

    if (!config.showUnobtainable) {
        db = filterCollectionItems(db, filterUnobtainableItems());
    }

    if (config.hideCollectedItems) {
        db = filterCollectionItems(db, filterCollectedItems(isCollected));
    }

    return db;
}
