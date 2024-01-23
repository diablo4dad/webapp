import {Collection, composeDescription, Item, StrapiHit, StrapiResultSet} from "./db";
import styles from "./Ledger.module.css";
import {Store} from "./Store";
import {getImageUri, SERVER_ADDR} from "./config";
import React from "react";
import {Currency, Tick} from "./Icons";

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

function getLedgerClasses(store: Store, collection: StrapiHit<Collection>, view: 'list' | 'card', inverse: boolean): string {
    const classes = [
        styles.LedgerGroup,
        isComplete(store, collection) ? styles.LedgerComplete : '',
        view === 'card' ? styles.LedgerCardView : '',
        inverse ? styles.LedgerInverse : '',
    ];

    return classes.filter(i => i !== '').join(' ');
}

function generateEditCategoryUrl(collection: StrapiHit<Collection>): string {
    return SERVER_ADDR + "/admin/content-manager/collectionType/api::collection.collection/" + collection.id;
}

function onTouchStart(handler: () => void) {
    return (e: React.TouchEvent) => {
        const touch = e.touches[0] ?? e.changedTouches[0];
        const x1 = touch.pageX;
        const y1 = touch.pageY;

        const onTouchEnd = (evt: Event) => {
            const touchEvent = evt as TouchEvent;
            const touch = touchEvent.touches[0] ?? touchEvent.changedTouches[0];
            const x2 = touch.pageX;
            const y2 = touch.pageY;

            e.target?.removeEventListener('touchend', onTouchEnd);

            if (x1 === x2 && y1 === y2) {
                handler();
            }
        }

        e.target?.addEventListener('touchend', onTouchEnd);
    }
}

type Props = {
    db: StrapiResultSet<Collection>,
    store: Store,
    onClickItem: (collection: StrapiHit<Collection>, item: StrapiHit<Item>) => void,
    onDoubleClickItem: (collection: StrapiHit<Collection>, item: StrapiHit<Item>) => void,
    view: 'list' | 'card',
    showCollected: boolean,
    inverseCards?: boolean,
}

function Ledger({db, store, onClickItem, onDoubleClickItem, view, showCollected, inverseCards = false}: Props) {
    function getClassNamesForItem(item: StrapiHit<Item>) {
        return [
            styles.Artifact,
            store.isCollected(item.id) ? styles.ArtifactCollected : null,
            store.isHidden(item.id) ? styles.ArtifactHidden : null,
            item.attributes.premium ? styles.ArtifactPremium : null,
        ].filter(cn => cn !== null).join(' ');
    }

    function isEveryItemCollected(collection: StrapiHit<Collection>) {
        return collection.attributes.items?.data.every(item => store.isCollected(item.id));
    }

    return (
        <>
            {db.data.map(collection => (
                <details className={getLedgerClasses(store, collection, view, inverseCards)} key={collection.id}
                     hidden={collection.attributes.items?.data.length === 0}
                     open={store.isCollectionOpen(collection.id)}
                     onToggle={e => store.toggleCollectionOpen(collection.id, e.currentTarget.open)}>
                    <summary className={styles.LedgerGroupHeading}>
                        <h1 className={styles.LedgerHeading}>{collection.attributes.name}
                            <span className={styles.LedgerCounter}>{composeCollectionTag(store, collection)}</span>
                            {process.env.NODE_ENV === 'development' &&
                                <span className={styles.LedgerEdit}> | <a target="_blank" href={generateEditCategoryUrl(collection)} rel="noreferrer">Edit</a></span>
                            }
                        </h1>
                        <div className={styles.LedgerDescription}>{collection.attributes.description}</div>
                    </summary>
                    {
                        !showCollected && isEveryItemCollected(collection) ? <div className={styles.LedgerNoMoreItems}>Complete!</div> :
                            <div className={styles.LedgerRow}>
                                {(collection.attributes.items?.data ?? []).map(item =>
                                    !showCollected && store.isCollected(item.id) ? null :
                                        <div className={getClassNamesForItem(item)}
                                             onClick={() => onClickItem(collection, item)}
                                             onDoubleClick={() => onDoubleClickItem(collection, item)}
                                             onTouchStart={onTouchStart(() => onDoubleClickItem(collection, item))}
                                             key={item.id}>
                                            <img className={styles.ArtifactImage} src={getImageUri(item)}
                                                 alt={item.attributes.name}/>
                                            <div className={styles.ArtifactInfo}>
                                                <div className={styles.ArtifactName}>{item.attributes.name}</div>
                                                <div className={styles.ArtifactItemType}>
                                                    <span>{item.attributes.itemType} | {item.attributes.claim}</span>
                                                    <span className={styles.ArtifactIconPremiumTitle}
                                                          hidden={!item.attributes.premium}>
                                                        <Currency />
                                                    </span>
                                                </div>
                                                <div className={styles.ArtifactClaimDescription}>{composeDescription(item.attributes)}</div>
                                            </div>
                                            <div className={styles.ArtifactIcons}>
                                                <span className={styles.ArtifactIcon + ' ' + styles.ArtifactIconPremium}>
                                                    <Currency></Currency>
                                                </span>
                                                <span className={styles.ArtifactIcon + ' ' + styles.ArtifactIconCollection}>
                                                    <Tick></Tick>
                                                </span>
                                            </div>
                                        </div>
                                )}
                            </div>
                    }
                </details>
            ))}
        </>
    )
}

export default Ledger;
