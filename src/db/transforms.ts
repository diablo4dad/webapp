import {DadCollectionItem, DadDb} from "../db";

export function flattenDadDb(db: DadDb): DadCollectionItem[] {
    return db.collections.flatMap(c => [
        ...c.collectionItems,
        ...c.subcollections.flatMap(sc => sc.collectionItems),
    ]);
}
