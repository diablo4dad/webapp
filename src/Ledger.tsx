import {Collection, Item, StrapiHit, StrapiResultSet} from "./db";
import styles from "./Ledger.module.css";
import LedgerItem from "./LedgerItem";
import {Store} from "./Store";
import {SERVER_ADDR} from "./config";

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

function isComplete(store: Store, collection: StrapiHit<Collection>): boolean {
    return countItemsInCollection(collection) === countItemsInCollectionOwned(store, collection)
}

function getLedgerClasses(store: Store, collection: StrapiHit<Collection>): string {
    const classes = [
        styles.LedgerGroup,
        isComplete(store, collection) ? styles.LedgerComplete : '',
    ];

    return classes.filter(i => i !== '').join(' ');
}

function generateEditCategoryUrl(collection: StrapiHit<Collection>): string {
    return SERVER_ADDR + "/admin/content-manager/collectionType/api::collection.collection/" + collection.id;
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
                <div className={getLedgerClasses(store, collection)} key={collection.id} hidden={collection.attributes.items?.data.length === 0}>
                    <div className={styles.LedgerGroupHeading}>
                        <h1 className={styles.LedgerHeading}>{collection.attributes.name}</h1>
                        <span className={styles.LedgerCounter}>{composeCollectionTag(store, collection)}</span>
                        {process.env.NODE_ENV === 'development' &&
                            <span> | <a target="_blank" href={generateEditCategoryUrl(collection)}>Edit</a></span>
                        }
                        <div className={styles.LedgerDescription}>{collection.attributes.description}</div>
                    </div>
                    <div className={styles.LedgerRow}>
                        {(collection.attributes.items?.data ?? []).map(item =>
                            <LedgerItem
                                key={item.id}
                                data={item}
                                isCollected={store.isCollected(item.id)}
                                isHidden={store.isHidden(item.id)}
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
