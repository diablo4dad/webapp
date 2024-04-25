import {composeDescription, DadCollection, DadCollectionItem, getAggregatedItemName, getAggregatedItemType} from "./db";
import styles from "./Ledger.module.css";
import {Store} from "./store";
import {getDefaultItemFromCollectionItems, SERVER_ADDR} from "./config";
import React, {DetailsHTMLAttributes, forwardRef} from "react";
import {Currency, Tick, TickCircle} from "./Icons";
import {getImageUri} from "./asset";
import Button, {BtnColours} from "./Button";

function countItemsInCollection(collection: DadCollection): number {
    return collection.collectionItems.length
        + collection.subcollections.reduce((a, c) => c.collectionItems.length + a, 0);
}

function countItemsInCollectionOwned(store: Store, collection: DadCollection): number {
    return collection.collectionItems.map(dci => dci.strapiId).filter(store.isCollected).length
        + collection.subcollections.reduce((a, c) => c.collectionItems.map(dci => dci.strapiId).filter(store.isCollected).length + a, 0);
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

type Props = DetailsHTMLAttributes<HTMLDetailsElement> & {
    collection: DadCollection,
    parentCollection?: DadCollection,
    store: Store,
    onClickItem: (collection: DadCollection, item: DadCollectionItem) => void,
    onDoubleClickItem: (collection: DadCollection, item: DadCollectionItem) => void,
    onSelectAllToggle: (collection: DadCollection, selectAll: boolean) => void,
    hideCollectedItems: boolean,
    hideCompleteCollections: boolean,
    inverseCardLayout: boolean,
    view: 'list' | 'card',
}

const Ledger = forwardRef<HTMLDetailsElement, Props>(function LedgerInner({collection, parentCollection, store, onClickItem, onDoubleClickItem, onSelectAllToggle, view, hideCollectedItems, hideCompleteCollections, inverseCardLayout, ...props}: Props, ref) {
    function getClassNamesForItem(collectionItem: DadCollectionItem) {
        return [
            styles.Artifact,
            store.isCollected(collectionItem.strapiId) ? styles.ArtifactCollected : null,
            store.isHidden(collectionItem.strapiId) ? styles.ArtifactHidden : null,
            collectionItem.premium ? styles.ArtifactPremium : null,
            collectionItem.items[0]?.magicType === 'Unique' ? styles.ArtifactUnique : null,
            // collectionItem.items[0]?.magicType === 'Rare' ? styles.ArtifactRare : null,
        ].filter(cn => cn !== null).join(' ');
    }

    function isEveryItem(collection: DadCollection, collected: boolean): boolean {
        return collection.collectionItems.every(item => store.isCollected(item.strapiId) === collected)
            && collection.subcollections.every(sc => isEveryItem(sc, collected));
    }

    const everyItemCollected = isEveryItem(collection, true);

    return (
        <details
            {...props}
            ref={ref}
            className={getLedgerClasses(isComplete(store, collection), hideCompleteCollections, inverseCardLayout, view)}
            key={collection.strapiId}
            hidden={collection.collectionItems.length === 0 && collection.subcollections.length === 0}
            open={store.isCollectionOpen(collection.strapiId)}
            onToggle={e => store.toggleCollectionOpen(collection.strapiId, e.currentTarget.open)}
        >
            <summary className={styles.LedgerGroupHeading}>
                <div>
                    <h1 className={styles.LedgerHeading}>{collection.name}
                        <span className={styles.LedgerCounter}>{composeCollectionTag(store, collection)}</span>
                        {process.env.NODE_ENV === 'development' &&
                            <span className={styles.LedgerEdit}> | <a target="_blank"
                                                                      href={generateEditCategoryUrl(collection)}
                                                                      rel="noreferrer">Edit</a></span>
                        }
                    </h1>
                    <div className={styles.LedgerDescription}>
                        {parentCollection && !collection.description ? parentCollection.name : collection.description}
                    </div>
                </div>
                <span className={styles.LedgerSelectControls}>
                        <Button colour={BtnColours.Green} onClick={() => onSelectAllToggle(collection, false)} hidden={!everyItemCollected}>
                            <Tick></Tick>
                        </Button>
                        <Button colour={BtnColours.Grey} onClick={() => onSelectAllToggle(collection, true)} hidden={everyItemCollected}>
                            <Tick></Tick>
                        </Button>
                    </span>
            </summary>
            {
                hideCollectedItems && everyItemCollected ?
                    <div className={styles.LedgerNoMoreItems}>Complete!</div> :
                    <div className={collection.subcollections.length ? styles.LedgerSubCollection : styles.LedgerRow}>
                        {collection.collectionItems.map(collectionItem => {
                            const item = getDefaultItemFromCollectionItems(collectionItem);

                            return hideCollectedItems && collectionItem.items.some(item => store.isCollected(item.strapiId)) ? null :
                                <div className={getClassNamesForItem(collectionItem)}
                                     onClick={() => onClickItem(collection, collectionItem)}
                                     onDoubleClick={() => onDoubleClickItem(collection, collectionItem)}
                                     onTouchStart={onTouchStart(() => onDoubleClickItem(collection, collectionItem))}
                                     key={collectionItem.strapiId}>
                                    <img className={styles.ArtifactImage} src={getImageUri(item)}
                                         loading="lazy"
                                         alt={item.name}/>
                                    <div className={styles.ArtifactInfo}>
                                        <div className={styles.ArtifactName}>{getAggregatedItemName(collectionItem)}</div>
                                        <div className={styles.ArtifactItemType}>
                                            <span>{getAggregatedItemType(collectionItem)} | {collectionItem.claim}</span>
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
                                            <TickCircle></TickCircle>
                                        </span>
                                    </div>
                                </div>
                        })}
                        {collection.subcollections.map(subcollection => {
                            return <Ledger
                                key={subcollection.strapiId}
                                collection={subcollection}
                                parentCollection={collection}
                                store={store}
                                onClickItem={onClickItem}
                                onDoubleClickItem={onDoubleClickItem}
                                onSelectAllToggle={onSelectAllToggle}
                                hideCollectedItems={hideCollectedItems}
                                hideCompleteCollections={hideCompleteCollections}
                                inverseCardLayout={inverseCardLayout}
                                view={view}
                            ></Ledger>
                        })}
                    </div>
            }
        </details>
    )
});

export default Ledger;
