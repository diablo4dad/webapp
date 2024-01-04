import {Collection, Item, StrapiHit, StrapiResultSet} from "./db";
import styles from "./Ledger.module.css";
import LedgerItem from "./LedgerItem";
import {Store} from "./Store";

function countItemsInCollection(collection: StrapiHit<Collection>): number {
    return collection.attributes.items?.data.length ?? 0;
}

function countItemsInCollectionOwned(store: Store, collection: StrapiHit<Collection>): number {
    return collection.attributes.items?.data.map(item => item.id).filter(store.isCollected).length ?? 0;
}

function composeCollectionTag(store: Store, collection: StrapiHit<Collection>): string {
    const collected = countItemsInCollectionOwned(store, collection);
    const total = countItemsInCollection(collection);
    return `[${collected}/${total}]`;
}

function isCollected(store: Store, entry: StrapiHit<Item>): boolean {
    return store.isCollected(entry.id);
}

type Props = {
    db: StrapiResultSet<Collection>,
    store: Store,
    onClickItem: (item: StrapiHit<Item>) => void,
    onDoubleClickItem: (item: StrapiHit<Item>) => void,
}

function Ledger({db, store, onClickItem, onDoubleClickItem}: Props) {
    return (
        <>
            {db.data.map(collection => (
                <div className={styles.LedgerGroup} key={collection.id}>
                    <div className={styles.LedgerGroupHeading}>
                        <h1 className={styles.LedgerHeading}>{collection.attributes.name}</h1>
                        <span className={styles.LedgerCounter}>{composeCollectionTag(store, collection)}</span>
                        <div className={styles.LedgerDescription}>{collection.attributes.description}</div>
                    </div>
                    <div className={styles.LedgerRow}>
                        {(collection.attributes.items?.data ?? []).map(item =>
                            <LedgerItem
                                key={item.id}
                                data={item}
                                isCollected={isCollected(store, item)}
                                onClick={() => onClickItem(item)}
                                onDoubleClick={() => onDoubleClickItem(item)}
                            />
                        )}
                    </div>
                </div>
            ))}
        </>
    )
}

export default Ledger;
