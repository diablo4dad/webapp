import {DadCollection, DadCollectionItem} from "./data";
import styles from "./Ledger.module.css";
import {Store} from "./store";
import {getDefaultItemFromCollectionItems} from "./config";
import React, {DetailsHTMLAttributes, forwardRef} from "react";
import {Currency, Tick, TickCircle} from "./Icons";
import {getImageUri} from "./asset";
import Button, {BtnColours} from "./Button";
import {getItemDescription, getItemName, getItemType} from "./data/getters";
import {countAllItemsInCollection} from "./data/aggregate";
import {countItemsInCollectionOwned} from "./store/aggregate";
import {generateEditCategoryUrl} from "./server";
import {onTouchStart} from "./common/dom";

function computeLedgerClassName(isComplete: boolean, hideComplete: boolean, inverse: boolean, view: 'list' | 'card'): string {
    return [
        styles.LedgerGroup,
        isComplete ? styles.LedgerComplete : null,
        view === 'card' ? styles.LedgerCardView : null,
        inverse ? styles.LedgerInverse : null,
        hideComplete && isComplete ? styles.LedgerHidden : null,
    ].filter(i => i !== null).join(' ');
}

function computeLedgerItemClassName(store: Store, collectionItem: DadCollectionItem) {
    return [
        styles.Artifact,
        store.isCollected(collectionItem.strapiId) ? styles.ArtifactCollected : null,
        store.isHidden(collectionItem.strapiId) ? styles.ArtifactHidden : null,
        collectionItem.premium ? styles.ArtifactPremium : null,
        collectionItem.items[0]?.magicType === 'Unique' ? styles.ArtifactUnique : null,
    ].filter(cn => cn !== null).join(' ');
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
    const collected = countItemsInCollectionOwned(store, collection);
    const total = countAllItemsInCollection(collection);
    const isComplete = collected === total;

    const ledgerClassName = computeLedgerClassName(isComplete, hideCompleteCollections, inverseCardLayout, view);
    const ledgerIsOpen = store.isCollectionOpen(collection.strapiId);
    const ledgerIsHidden = collection.collectionItems.length === 0 && collection.subcollections.length === 0;
    const ledgerHeading = parentCollection && !collection.description ? parentCollection.name : collection.description;

    return (
        <details
            {...props}
            ref={ref}
            className={ledgerClassName}
            key={collection.strapiId}
            hidden={ledgerIsHidden}
            open={ledgerIsOpen}
            onToggle={e => store.toggleCollectionOpen(collection.strapiId, e.currentTarget.open)}
        >
            <summary className={styles.LedgerGroupHeading}>
                <div>
                    <h1 className={styles.LedgerHeading}>{collection.name}
                        <span className={styles.LedgerCounter}>{`[${collected}/${total}]`}</span>
                        {process.env.NODE_ENV === 'development' &&
                            <span className={styles.LedgerEdit}> | <a target="_blank"
                                                                      href={generateEditCategoryUrl(collection)}
                                                                      rel="noreferrer">Edit</a></span>
                        }
                    </h1>
                    <div className={styles.LedgerDescription}>{ledgerHeading}</div>
                </div>
                <span className={styles.LedgerSelectControls}>
                    <Button colour={BtnColours.Green} onClick={() => onSelectAllToggle(collection, false)} hidden={!isComplete}>
                        <Tick></Tick>
                    </Button>
                    <Button colour={BtnColours.Grey} onClick={() => onSelectAllToggle(collection, true)} hidden={isComplete}>
                        <Tick></Tick>
                    </Button>
                </span>
            </summary>
            {
                hideCollectedItems && isComplete ?
                    <div className={styles.LedgerNoMoreItems}>Complete!</div> :
                    <div className={collection.subcollections.length ? styles.LedgerSubCollection : styles.LedgerRow}>
                        {collection.collectionItems.map(collectionItem => {
                            const item = getDefaultItemFromCollectionItems(collectionItem);
                            const ledgerItemClassName = computeLedgerItemClassName(store, collectionItem);

                            return hideCollectedItems && collectionItem.items.some(item => store.isCollected(item.strapiId)) ? null :
                                <div className={ledgerItemClassName}
                                     onClick={() => onClickItem(collection, collectionItem)}
                                     onDoubleClick={() => onDoubleClickItem(collection, collectionItem)}
                                     onTouchStart={onTouchStart(() => onDoubleClickItem(collection, collectionItem))}
                                     key={collectionItem.strapiId}>
                                    <img className={styles.ArtifactImage} src={getImageUri(item)}
                                         loading="lazy"
                                         alt={item.name}/>
                                    <div className={styles.ArtifactInfo}>
                                        <div className={styles.ArtifactName}>{getItemName(collectionItem)}</div>
                                        <div className={styles.ArtifactItemType}>
                                            <span>{getItemType(collectionItem)} | {collectionItem.claim}</span>
                                            <span className={styles.ArtifactIconPremiumTitle}
                                                  hidden={!collectionItem.premium}>
                                                <Currency />
                                            </span>
                                        </div>
                                        <div className={styles.ArtifactClaimDescription}>{getItemDescription(collectionItem)}</div>
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
