import {DadCollectionItem, DadDb} from "./index";

export function flattenDadDb(db: DadDb): DadCollectionItem[] {
    return db.collections.flatMap(c => [
        ...c.collectionItems,
        ...c.subcollections.flatMap(sc => sc.collectionItems),
    ]);
}
