import {composeDescription, DadCollection, DadCollectionItem, DadDb,} from "./db";
import styles from "./Ledger.module.css";
import {Store} from "./Store";
import {getDefaultItemFromCollectionItems, getImageUri, SERVER_ADDR} from "./config";
import React from "react";
import {Currency, Tick} from "./Icons";
import Link from "./Link";

function countItemsInCollection(collection: DadCollection): number {
    return collection.collectionItems.length;
}

function countItemsInCollectionOwned(store: Store, collection: DadCollection): number {
    return collection.collectionItems.map(dci => dci.strapiId).filter(store.isCollected).length;
}

function composeCollectionTag(store: Store, collection: DadCollection): string {
    const collected = countItemsInCollectionOwned(store, collection);
    const total = countItemsInCollection(collection);
    return `[${collected}/${total}]`;
}

function isComplete(store: Store, collection: DadCollection): boolean {
    return countItemsInCollection(collection) === countItemsInCollectionOwned(store, collection)
}

function getLedgerClasses(isComplete: boolean, hideComplete: boolean, inverse: boolean, view: 'list' | 'card'): string {
    const classes = [
        styles.LedgerGroup,
        isComplete ? styles.LedgerComplete : '',
        view === 'card' ? styles.LedgerCardView : '',
        inverse ? styles.LedgerInverse : '',
        hideComplete && isComplete ? styles.LedgerHidden : '',
    ];

    return classes.filter(i => i !== '').join(' ');
}

function generateEditCategoryUrl(collection: DadCollection): string {
    return SERVER_ADDR + "/admin/content-manager/collectionType/api::collection.collection/" + collection.strapiId;
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
    db: DadDb,
    store: Store,
    onClickItem: (collection: DadCollection, item: DadCollectionItem) => void,
    onDoubleClickItem: (collection: DadCollection, item: DadCollectionItem) => void,
    onSelectAllToggle: (collection: DadCollection, selectAll: boolean) => void,
    hideCollectedItems: boolean,
    hideCompleteCollections: boolean,
    inverseCardLayout: boolean,
    view: 'list' | 'card',
}

function Ledger({db, store, onClickItem, onDoubleClickItem, onSelectAllToggle, view, hideCollectedItems, hideCompleteCollections, inverseCardLayout}: Props) {
    function getClassNamesForItem(collectionItem: DadCollectionItem) {
        return [
            styles.Artifact,
            store.isCollected(collectionItem.strapiId) ? styles.ArtifactCollected : null,
            store.isHidden(collectionItem.strapiId) ? styles.ArtifactHidden : null,
            collectionItem.premium ? styles.ArtifactPremium : null,
        ].filter(cn => cn !== null).join(' ');
    }

    function isEveryItemCollected(collection: DadCollection) {
        return collection.collectionItems.every(item => store.isCollected(item.strapiId));
    }

    return (
        <>
            {db.collections.map(collection => (
                <details
                    className={getLedgerClasses(isComplete(store, collection), hideCompleteCollections, inverseCardLayout, view)}
                    key={collection.strapiId}
                    hidden={collection.collectionItems.length === 0}
                    open={store.isCollectionOpen(collection.strapiId)}
                    onToggle={e => store.toggleCollectionOpen(collection.strapiId, e.currentTarget.open)}
                >
                    <summary className={styles.LedgerGroupHeading}>
                        <h1 className={styles.LedgerHeading}>{collection.name}
                            <span className={styles.LedgerCounter}>{composeCollectionTag(store, collection)}</span>
                            {process.env.NODE_ENV === 'development' &&
                                <span className={styles.LedgerEdit}> | <a target="_blank"
                                                                          href={generateEditCategoryUrl(collection)}
                                                                          rel="noreferrer">Edit</a></span>
                            }
                            <span className={styles.LedgerSelectControls}>
                                <Link className={styles.LedgerSelectBtn} onClick={() => onSelectAllToggle(collection, true)}>Select All</Link>
                                <span> | </span>
                                <Link className={styles.LedgerSelectBtn} onClick={() => onSelectAllToggle(collection, false)}>None</Link>
                            </span>
                        </h1>
                        <div className={styles.LedgerDescription}>{collection.description}</div>
                    </summary>
                    {
                        hideCollectedItems && isEveryItemCollected(collection) ? <div className={styles.LedgerNoMoreItems}>Complete!</div> :
                            <div className={styles.LedgerRow}>
                                {collection.collectionItems.map(collectionItem => {
                                    const item = getDefaultItemFromCollectionItems(collectionItem);

                                    return hideCollectedItems && collectionItem.items.some(item => store.isCollected(item.strapiId)) ? null :
                                        <div className={getClassNamesForItem(collectionItem)}
                                             onClick={() => onClickItem(collection, collectionItem)}
                                             onDoubleClick={() => onDoubleClickItem(collection, collectionItem)}
                                             onTouchStart={onTouchStart(() => onDoubleClickItem(collection, collectionItem))}
                                             key={collectionItem.strapiId}>
                                            <img className={styles.ArtifactImage} src={getImageUri(item)}
                                                 alt={item.name}/>
                                            <div className={styles.ArtifactInfo}>
                                                <div className={styles.ArtifactName}>{item.name}</div>
                                                <div className={styles.ArtifactItemType}>
                                                    <span>{item.itemType} | {collectionItem.claim}</span>
                                                    <span className={styles.ArtifactIconPremiumTitle}
                                                          hidden={!collectionItem.premium}>
                                                        <Currency />
                                                    </span>
                                                </div>
                                                <div className={styles.ArtifactClaimDescription}>{composeDescription(collectionItem)}</div>
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
                                })}
                            </div>
                    }
                </details>
            ))}
        </>
    )
}

export default Ledger;
