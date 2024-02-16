import {Collection, CollectionItem, composeDescription, Item, StrapiHit, StrapiResultSet} from "./db";
import styles from "./Ledger.module.css";
import {Store} from "./Store";
import {getDefaultItemFromCollectionItems, getImageUri, SERVER_ADDR} from "./config";
import React from "react";
import {Currency, Tick} from "./Icons";

function countItemsInCollection(collection: StrapiHit<Collection>): number {
    return collection.attributes.collectionItems?.data.length ?? 0;
}

function countItemsInCollectionOwned(store: Store, collection: StrapiHit<Collection>): number {
    return collection.attributes.collectionItems?.data.flatMap(
        collectionItem => collectionItem.attributes.items?.data.map(item => item.id) ?? []
    ).filter(store.isCollected).length ?? 0;
}

function composeCollectionTag(store: Store, collection: StrapiHit<Collection>): string {
    const collected = countItemsInCollectionOwned(store, collection);
    const total = countItemsInCollection(collection);
    return `[${collected}/${total}]`;
}

function isComplete(store: Store, collection: StrapiHit<Collection>): boolean {
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
    onClickItem: (collection: StrapiHit<Collection>, item: StrapiHit<CollectionItem>) => void,
    onDoubleClickItem: (collection: StrapiHit<Collection>, item: StrapiHit<CollectionItem>) => void,
    onSelectAllToggle: (collection: StrapiHit<Collection>, selectAll: boolean) => void,
    hideCollectedItems: boolean,
    hideCompleteCollections: boolean,
    inverseCardLayout: boolean,
    view: 'list' | 'card',
}

function Ledger({db, store, onClickItem, onDoubleClickItem, onSelectAllToggle, view, hideCollectedItems, hideCompleteCollections, inverseCardLayout}: Props) {
    function getClassNamesForItem(collectionItem: StrapiHit<CollectionItem>) {
        return [
            styles.Artifact,
            collectionItem.attributes.items?.data.some(item => store.isCollected(item.id)) ? styles.ArtifactCollected : null,
            store.isHidden(collectionItem.id) ? styles.ArtifactHidden : null,
            collectionItem.attributes.premium ? styles.ArtifactPremium : null,
        ].filter(cn => cn !== null).join(' ');
    }

    function isEveryItemCollected(collection: StrapiHit<Collection>) {
        return collection.attributes.collectionItems?.data.every(
            collectionItem => collectionItem.attributes.items?.data.some(
                item => store.isCollected(item.id)
            )
        );
    }

    return (
        <>
            {db.data.map(collection => (
                <details
                    className={getLedgerClasses(isComplete(store, collection), hideCompleteCollections, inverseCardLayout, view)}
                    key={collection.id}
                    hidden={collection.attributes.collectionItems?.data.length === 0}
                    open={store.isCollectionOpen(collection.id)}
                    onToggle={e => store.toggleCollectionOpen(collection.id, e.currentTarget.open)}
                >
                    <summary className={styles.LedgerGroupHeading}>
                        <h1 className={styles.LedgerHeading}>{collection.attributes.name}
                            <span className={styles.LedgerCounter}>{composeCollectionTag(store, collection)}</span>
                            {process.env.NODE_ENV === 'development' &&
                                <span className={styles.LedgerEdit}> | <a target="_blank"
                                                                          href={generateEditCategoryUrl(collection)}
                                                                          rel="noreferrer">Edit</a></span>
                            }
                            <span className={styles.LedgerSelectControls}>
                                <button className={styles.LedgerSelectBtn} onClick={() => onSelectAllToggle(collection, true)}>Select All</button>
                                <span> | </span>
                                <button className={styles.LedgerSelectBtn} onClick={() => onSelectAllToggle(collection, false)}>None</button>
                            </span>
                        </h1>
                        <div className={styles.LedgerDescription}>{collection.attributes.description}</div>
                    </summary>
                    {
                        hideCollectedItems && isEveryItemCollected(collection) ? <div className={styles.LedgerNoMoreItems}>Complete!</div> :
                            <div className={styles.LedgerRow}>
                                {(collection.attributes.collectionItems?.data ?? []).map(collectionItem => {
                                    const item = getDefaultItemFromCollectionItems(collectionItem);
                                    if (!item) {
                                        return null;
                                    }

                                    return hideCollectedItems && collectionItem.attributes.items?.data.some(item => store.isCollected(item.id)) ? null :
                                        <div className={getClassNamesForItem(collectionItem)}
                                             onClick={() => onClickItem(collection, collectionItem)}
                                             onDoubleClick={() => onDoubleClickItem(collection, collectionItem)}
                                             onTouchStart={onTouchStart(() => onDoubleClickItem(collection, collectionItem))}
                                             key={collectionItem.id}>
                                            <img className={styles.ArtifactImage} src={getImageUri(item)}
                                                 alt={item.attributes.name}/>
                                            <div className={styles.ArtifactInfo}>
                                                <div className={styles.ArtifactName}>{item.attributes.name}</div>
                                                <div className={styles.ArtifactItemType}>
                                                    <span>{item.attributes.itemType} | {collectionItem.attributes.claim}</span>
                                                    <span className={styles.ArtifactIconPremiumTitle}
                                                          hidden={!collectionItem.attributes.premium}>
                                                        <Currency />
                                                    </span>
                                                </div>
                                                <div className={styles.ArtifactClaimDescription}>{composeDescription(collectionItem.attributes)}</div>
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
