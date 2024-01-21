import {Collection, composeDescription, Item, StrapiHit, StrapiResultSet} from "./db";
import styles from "./Ledger.module.css";
import {Store} from "./Store";
import {getImageUri, SERVER_ADDR} from "./config";
import React, {useEffect, useRef, useState} from "react";

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

function getLedgerClasses(store: Store, collection: StrapiHit<Collection>, view: 'list' | 'card'): string {
    const classes = [
        styles.LedgerGroup,
        isComplete(store, collection) ? styles.LedgerComplete : '',
        view === 'card' ? styles.LedgerCardView : '',
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
    onClickItem: (item: StrapiHit<Item>) => void,
    onDoubleClickItem: (item: StrapiHit<Item>) => void,
    view: 'list' | 'card',
    showCollected: boolean,
}

function Ledger({db, store, onClickItem, onDoubleClickItem, view, showCollected}: Props) {
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
                <details className={getLedgerClasses(store, collection, view)} key={collection.id}
                     hidden={collection.attributes.items?.data.length === 0}>
                    <summary className={styles.LedgerGroupHeading}>
                        <h1 className={styles.LedgerHeading}>{collection.attributes.name}
                            <span className={styles.LedgerCounter}>{composeCollectionTag(store, collection)}</span>
                            {process.env.NODE_ENV === 'development' &&
                                <span className={styles.LedgerEdit}> |
                                <a target="_blank" href={generateEditCategoryUrl(collection)} rel="noreferrer">Edit</a></span>
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
                                             onClick={() => onClickItem(item)}
                                             onDoubleClick={() => onDoubleClickItem(item)}
                                             onTouchStart={onTouchStart(() => onDoubleClickItem(item))}
                                             key={item.id}>
                                            <img className={styles.ArtifactImage} src={getImageUri(item)}
                                                 alt={item.attributes.name}/>
                                            <div className={styles.ArtifactInfo}>
                                                <div className={styles.ArtifactName}>{item.attributes.name}</div>
                                                <div className={styles.ArtifactItemType}>
                                                    <span>{item.attributes.itemType} | {item.attributes.claim}</span>
                                                    <span className={styles.ArtifactIconPremiumTitle}
                                                          hidden={!item.attributes.premium}>
                                                        <svg fill="currentColor" stroke="currentColor" strokeWidth="0"
                                                             aria-hidden="true" version="1.1"
                                                             viewBox="0 0 19.5 19.5" xmlns="http://www.w3.org/2000/svg">
                                                        <path
                                                            d="m8.214 6.496c0.227-0.18 0.497-0.311 0.786-0.394v2.795a2.252 2.252 0 0 1-0.786-0.393c-0.394-0.313-0.546-0.681-0.546-1.004s0.152-0.691 0.546-1.004zm2.286 6.916v-2.824c0.347 0.085 0.664 0.228 0.921 0.421 0.427 0.32 0.579 0.686 0.579 0.991s-0.152 0.671-0.579 0.991a2.534 2.534 0 0 1-0.921 0.42z"/>
                                                        <path
                                                            d="m9.75 0c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75c5.385 0 9.75-4.365 9.75-9.75s-4.365-9.75-9.75-9.75zm0.75 3.75a0.75 0.75 0 0 0-1.5 0v0.816a3.836 3.836 0 0 0-1.72 0.756c-0.712 0.566-1.112 1.35-1.112 2.178 0 0.829 0.4 1.612 1.113 2.178 0.502 0.4 1.102 0.647 1.719 0.756v2.978a2.536 2.536 0 0 1-0.921-0.421l-0.879-0.66a0.75 0.75 0 0 0-0.9 1.2l0.879 0.66c0.533 0.4 1.169 0.645 1.821 0.75v0.809a0.75 0.75 0 0 0 1.5 0v-0.81a4.124 4.124 0 0 0 1.821-0.749c0.745-0.559 1.179-1.344 1.179-2.191s-0.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-0.75v-2.955c0.29 0.082 0.559 0.213 0.786 0.393l0.415 0.33a0.75019 0.75019 0 0 0 0.933-1.175l-0.415-0.33a3.836 3.836 0 0 0-1.719-0.755z"
                                                            clipRule="evenodd" fillRule="evenodd"/>
                                                        </svg>
                                                    </span>
                                                </div>
                                                <div className={styles.ArtifactClaimDescription}>{composeDescription(item.attributes)}</div>
                                            </div>
                                            <div className={styles.ArtifactIcons}>
                                                <span className={styles.ArtifactIcon + ' ' + styles.ArtifactIconPremium}>
                                                    <svg fill="currentColor" stroke="currentColor" strokeWidth="0"
                                                         aria-hidden="true" version="1.1"
                                                         viewBox="0 0 19.5 19.5" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="m8.214 6.496c0.227-0.18 0.497-0.311 0.786-0.394v2.795a2.252 2.252 0 0 1-0.786-0.393c-0.394-0.313-0.546-0.681-0.546-1.004s0.152-0.691 0.546-1.004zm2.286 6.916v-2.824c0.347 0.085 0.664 0.228 0.921 0.421 0.427 0.32 0.579 0.686 0.579 0.991s-0.152 0.671-0.579 0.991a2.534 2.534 0 0 1-0.921 0.42z"/>
                                                    <path
                                                        d="m9.75 0c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75c5.385 0 9.75-4.365 9.75-9.75s-4.365-9.75-9.75-9.75zm0.75 3.75a0.75 0.75 0 0 0-1.5 0v0.816a3.836 3.836 0 0 0-1.72 0.756c-0.712 0.566-1.112 1.35-1.112 2.178 0 0.829 0.4 1.612 1.113 2.178 0.502 0.4 1.102 0.647 1.719 0.756v2.978a2.536 2.536 0 0 1-0.921-0.421l-0.879-0.66a0.75 0.75 0 0 0-0.9 1.2l0.879 0.66c0.533 0.4 1.169 0.645 1.821 0.75v0.809a0.75 0.75 0 0 0 1.5 0v-0.81a4.124 4.124 0 0 0 1.821-0.749c0.745-0.559 1.179-1.344 1.179-2.191s-0.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-0.75v-2.955c0.29 0.082 0.559 0.213 0.786 0.393l0.415 0.33a0.75019 0.75019 0 0 0 0.933-1.175l-0.415-0.33a3.836 3.836 0 0 0-1.719-0.755z"
                                                        clipRule="evenodd" fillRule="evenodd"/>
                                                    </svg>
                                                </span>
                                                <span className={styles.ArtifactIcon + ' ' + styles.ArtifactIconCollection}>
                                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                                         viewBox="0 0 512 512"
                                                         xmlns="http://www.w3.org/2000/svg">
                                                        <path
                                                            d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path>
                                                    </svg>
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
