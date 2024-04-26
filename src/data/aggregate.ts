import {DadCollection, DadDb} from "./index";

export function countItemsInDb(db: DadDb): number {
    return db.collections.reduce((a, c) => countItemsInCollection(c) + countItemsInSubCollection(c) + a, 0);
}

export function countItemsInCollection(collection: DadCollection): number {
    return collection.collectionItems.length;
}

export function countItemsInSubCollection(collection: DadCollection): number {
    return collection.subcollections.reduce((a, c) => a + countItemsInCollection(c), 0);
}
