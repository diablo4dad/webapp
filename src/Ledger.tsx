import {
  DadCollection,
  DadCollectionItem,
  getDefaultItemFromCollectionItems,
} from "./data";
import styles from "./Ledger.module.css";
import React, { useEffect, useState } from "react";
import { Currency, Tick, TickCircle } from "./Icons";
import Button, { BtnColours } from "./Button";
import {
  getAllCollectionItems,
  getImageUri,
  getItemDescription,
  getItemName,
  getItemType,
} from "./data/getters";
import { countAllItemsInCollection } from "./data/aggregate";
import { countItemsInCollectionOwned } from "./collection/aggregate";
import { generateEditCategoryUrl } from "./server";
import { onTouchStart } from "./common/dom";
import LazyImage from "./components/LazyImage";
import placeholder from "./image/placeholder.webp";
import { Accordion, AccordionItem } from "@szhsin/react-accordion";
import { useSettings } from "./settings/context";
import { LedgerView } from "./settings/type";
import classNames from "classnames";
import { isLedgerInverse, isLedgerView } from "./settings/predicate";
import { isCollectionEmpty } from "./data/predicates";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "./collection/context";
import { isItemCollected, isItemHidden } from "./collection/predicate";
import { toggleValueInArray } from "./common/arrays";
import { getViewModel, saveViewModel } from "./store/local";

type LedgerProps = {
  collections: DadCollection[];
  parentCollection?: DadCollection;
  onClickItem: (collection: DadCollection, item: DadCollectionItem) => void;
};

type Props = {
  collection: DadCollection;
  parentCollection?: DadCollection;
  onClickItem: (collection: DadCollection, item: DadCollectionItem) => void;
  isOpen: boolean;
};

export type ViewModel = {
  openCollections: number[];
};

const Collection = ({
  collection,
  parentCollection,
  isOpen,
  onClickItem,
}: Props) => {
  const settings = useSettings();
  const log = useCollection();
  const dispatch = useCollectionDispatch();

  const toggleItem = (dci: DadCollectionItem) => (collected: boolean) => {
    dci.items
      .map((i) => i.itemId)
      .map(Number)
      .forEach((itemId) => {
        dispatch({
          type: CollectionActionType.COLLECT,
          itemId: itemId,
          toggle: collected,
        });
      });
  };

  const toggleCollection = (dc: DadCollection) => (collected: boolean) => {
    getAllCollectionItems(dc)
      .flatMap((ci) => ci.items)
      .map((i) => i.itemId)
      .map(Number)
      .forEach((itemId) => {
        dispatch({
          type: CollectionActionType.COLLECT,
          itemId: itemId,
          toggle: collected,
        });
      });
  };

  const collected = countItemsInCollectionOwned(log, collection);
  const total = countAllItemsInCollection(collection);
  const isComplete = collected === total;
  const ledgerIsOpen = isOpen;

  const headingLabel = collection.name;
  const counterLabel = `[${collected}/${total}]`;
  const descriptionLabel =
    parentCollection && !collection.description
      ? parentCollection.name
      : collection.description;

  const className = classNames({
    [styles.Ledger]: true,
    [styles.LedgerComplete]: isComplete,
    [styles.LedgerCards]: isLedgerView(settings, LedgerView.CARD),
    [styles.LedgerCardsInverse]: isLedgerInverse(settings),
  });

  return (
    <AccordionItem
      hidden={isCollectionEmpty(collection)}
      initialEntered={ledgerIsOpen}
      itemKey={collection.strapiId}
      className={className}
      headingProps={{
        className: styles.LedgerHeader,
      }}
      buttonProps={{
        className: styles.LedgerButton,
      }}
      contentProps={{
        className: styles.LedgerContent,
      }}
      header={
        <>
          <div>
            <h1 className={styles.LedgerTitle}>
              {headingLabel}
              <span className={styles.LedgerCounter}>{counterLabel}</span>
              {process.env.NODE_ENV === "development" && (
                <span className={styles.LedgerEdit}>
                  <span> | </span>
                  <a
                    target="_blank"
                    href={generateEditCategoryUrl(collection.strapiId)}
                    rel="noreferrer"
                  >
                    Edit
                  </a>
                </span>
              )}
            </h1>
            <div className={styles.LedgerDescription}>{descriptionLabel}</div>
          </div>
          <span className={styles.LedgerActions}>
            <Button
              colour={isComplete ? BtnColours.Green : BtnColours.Grey}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollection(collection)(!isComplete);
              }}
            >
              <Tick></Tick>
            </Button>
          </span>
        </>
      }
    >
      {({ state }) => {
        // this is a heavy render; skip unless open
        if (["exited", "unmounted"].includes(state.status)) {
          return null;
        }

        return (
          <div
            className={
              collection.subcollections.length
                ? styles.LedgerSubCollection
                : styles.LedgerRow
            }
          >
            {collection.collectionItems.map((collectionItem) => {
              const item = getDefaultItemFromCollectionItems(collectionItem);
              const itemId = Number(item.itemId);
              const isCollected = isItemCollected(log, itemId);
              const isHidden = isItemHidden(log, itemId);
              const isAshava = itemId === 1482434;

              const className = classNames({
                [styles.Item]: true,
                [styles.ItemCollected]: isCollected,
                [styles.ItemHidden]: isHidden,
                [styles.ItemPremium]: collectionItem.premium,
                [styles.ItemUnique]:
                  collectionItem.items[0]?.magicType === "Unique",
                [styles.ItemGlow]: isAshava && isCollected,
              });

              return (
                <div
                  className={className}
                  onClick={() => onClickItem(collection, collectionItem)}
                  onDoubleClick={() => toggleItem(collectionItem)(!isCollected)}
                  onTouchStart={onTouchStart(() =>
                    toggleItem(collectionItem)(!isCollected),
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
            <Ledger
              collections={collection.subcollections}
              parentCollection={collection}
              onClickItem={onClickItem}
            />
          </div>
        );
      }}
    </AccordionItem>
  );
};

const Ledger = ({
  collections,
  parentCollection,
  onClickItem,
}: LedgerProps) => {
  const [vm, setVm] = useState<ViewModel>(getViewModel());

  useEffect(() => saveViewModel(vm), [vm]);

  return (
    <Accordion
      allowMultiple
      transition
      transitionTimeout={250}
      onStateChange={(e) => {
        setVm((vm) => ({
          ...vm,
          openCollections: toggleValueInArray(
            vm.openCollections,
            Number(e.key),
            e.current.isEnter,
          ),
        }));
      }}
    >
      {collections.map((collection) => (
        <Collection
          key={collection.strapiId}
          collection={collection}
          parentCollection={parentCollection}
          isOpen={vm.openCollections.includes(collection.strapiId)}
          onClickItem={onClickItem}
        />
      ))}
    </Accordion>
  );
};

export default Ledger;
