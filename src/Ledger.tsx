import {
  DadCollection,
  DadCollectionItem,
  getDefaultItemFromCollectionItems,
} from "./data";
import styles from "./Ledger.module.css";
import { Store } from "./store";
import React, { DetailsHTMLAttributes, forwardRef } from "react";
import { Currency, Tick, TickCircle } from "./Icons";
import Button, { BtnColours } from "./Button";
import {
  getImageUri,
  getItemDescription,
  getItemName,
  getItemType,
} from "./data/getters";
import { countAllItemsInCollection } from "./data/aggregate";
import { countItemsInCollectionOwned } from "./store/aggregate";
import { generateEditCategoryUrl } from "./server";
import { onTouchStart } from "./common/dom";
import { isItemCollected, isItemHidden } from "./store/predicate";
import LazyImage from "./components/LazyImage";
import placeholder from "./image/placeholder.webp";
import Accordion from "./components/Accordion";

function computeLedgerClassName(
  isComplete: boolean,
  hideComplete: boolean,
  inverse: boolean,
  view: "list" | "card",
): string {
  return [
    styles.Ledger,
    isComplete ? styles.LedgerComplete : null,
    view === "card" ? styles.LedgerCards : null,
    view === "card" && inverse ? styles.LedgerCardsInverse : null,
    hideComplete && isComplete ? styles.LedgerHidden : null,
  ]
    .filter((i) => i !== null)
    .join(" ");
}

function computeLedgerItemClassName(
  store: Store,
  collectionItem: DadCollectionItem,
) {
  return [
    styles.Item,
    isItemCollected(store, collectionItem) ? styles.ItemCollected : null,
    isItemHidden(store, collectionItem) ? styles.ItemHidden : null,
    collectionItem.premium ? styles.ItemPremium : null,
    collectionItem.items[0]?.magicType === "Unique" ? styles.ItemUnique : null,
  ]
    .filter((cn) => cn !== null)
    .join(" ");
}

type Props = DetailsHTMLAttributes<HTMLDetailsElement> & {
  collection: DadCollection;
  parentCollection?: DadCollection;
  store: Store;
  onClickItem: (collection: DadCollection, item: DadCollectionItem) => void;
  onDoubleClickItem: (
    collection: DadCollection,
    item: DadCollectionItem,
  ) => void;
  onSelectAllToggle: (itemIds: DadCollection, selectAll: boolean) => void;
  hideCollectedItems: boolean;
  hideCompleteCollections: boolean;
  inverseCardLayout: boolean;
  view: "list" | "card";
};

type CollectionHeadingProps = {
  heading: string;
  description: string;
  counter: string;
  editHref: string;
  isComplete: boolean;
  onSelectAllToggle: (selectAll: boolean) => void;
};

const CollectionHeading = ({
  heading,
  description,
  counter,
  editHref,
  onSelectAllToggle,
  isComplete,
}: CollectionHeadingProps) => {
  return (
    <>
      <div>
        <h1 className={styles.LedgerTitle}>
          {heading}
          <span className={styles.LedgerCounter}>{counter}</span>
          {process.env.NODE_ENV === "development" && (
            <span className={styles.LedgerEdit}>
              <span> | </span>
              <a target="_blank" href={editHref} rel="noreferrer">
                Edit
              </a>
            </span>
          )}
        </h1>
        <div className={styles.LedgerDescription}>{description}</div>
      </div>
      <span className={styles.LedgerActions}>
        <Button
          colour={isComplete ? BtnColours.Green : BtnColours.Grey}
          onClick={() => onSelectAllToggle(!isComplete)}
        >
          <Tick></Tick>
        </Button>
      </span>
    </>
  );
};

const Ledger = forwardRef<HTMLDetailsElement, Props>(function LedgerInner(
  {
    collection,
    parentCollection,
    store,
    onClickItem,
    onDoubleClickItem,
    onSelectAllToggle,
    view,
    hideCollectedItems,
    hideCompleteCollections,
    inverseCardLayout,
    ...props
  }: Props,
  ref,
) {
  const collected = countItemsInCollectionOwned(store, collection);
  const total = countAllItemsInCollection(collection);
  const isComplete = collected === total;
  const counter = `[${collected}/${total}]`;

  const ledgerClassName = computeLedgerClassName(
    isComplete,
    hideCompleteCollections,
    inverseCardLayout,
    view,
  );
  const ledgerIsOpen = store.isCollectionOpen(collection.strapiId);
  const ledgerIsHidden =
    collection.collectionItems.length === 0 &&
    collection.subcollections.length === 0;

  const heading = collection.name;
  const description =
    parentCollection && !collection.description
      ? parentCollection.name
      : collection.description;

  return (
    <Accordion
      {...props}
      // ref={ref}
      className={ledgerClassName}
      summary={
        <CollectionHeading
          heading={heading}
          description={description}
          counter={counter}
          editHref={generateEditCategoryUrl(collection.strapiId)}
          isComplete={isComplete}
          onSelectAllToggle={(selectAll: boolean) =>
            onSelectAllToggle(collection, selectAll)
          }
        />
      }
      summaryClass={styles.LedgerHeader}
      key={collection.strapiId}
      hidden={ledgerIsHidden}
      open={ledgerIsOpen}
      onToggle={(e) =>
        store.toggleCollectionOpen(collection.strapiId, e.currentTarget.open)
      }
    >
      {hideCollectedItems && isComplete ? (
        <div className={styles.LedgerNoMoreItems}>Complete!</div>
      ) : (
        <div
          className={
            collection.subcollections.length
              ? styles.LedgerSubCollection
              : styles.LedgerRow
          }
        >
          {collection.collectionItems.map((collectionItem) => {
            const item = getDefaultItemFromCollectionItems(collectionItem);
            const ledgerItemClassName = computeLedgerItemClassName(
              store,
              collectionItem,
            );

            return hideCollectedItems &&
              isItemCollected(store, collectionItem) ? null : (
              <div
                className={ledgerItemClassName}
                onClick={() => onClickItem(collection, collectionItem)}
                onDoubleClick={() =>
                  onDoubleClickItem(collection, collectionItem)
                }
                onTouchStart={onTouchStart(() =>
                  onDoubleClickItem(collection, collectionItem),
                )}
                key={collectionItem.strapiId}
              >
                <LazyImage
                  placeholder={placeholder}
                  className={styles.ItemImage}
                  src={getImageUri(item)}
                  alt={item.name}
                />
                <div className={styles.ItemInfo}>
                  <div className={styles.ItemName}>
                    {getItemName(collectionItem)}
                  </div>
                  <div className={styles.ItemType}>
                    <span>
                      {getItemType(collectionItem)} | {collectionItem.claim}
                    </span>
                    <span
                      className={styles.ItemIconPremiumTitle}
                      hidden={!collectionItem.premium}
                    >
                      <Currency />
                    </span>
                  </div>
                  <div className={styles.ItemClaimDescription}>
                    {getItemDescription(collectionItem)}
                  </div>
                </div>
                <div className={styles.ItemIcons}>
                  <span
                    className={styles.ItemIcon + " " + styles.ItemIconPremium}
                  >
                    <Currency></Currency>
                  </span>
                  <span
                    className={
                      styles.ItemIcon + " " + styles.ItemIconCollection
                    }
                  >
                    <TickCircle></TickCircle>
                  </span>
                </div>
              </div>
            );
          })}
          {collection.subcollections.map((subcollection) => {
            return (
              <Ledger
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
            );
          })}
        </div>
      )}
    </Accordion>
  );
});

export default Ledger;
