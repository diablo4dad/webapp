import { Collection, CollectionItem, getDefaultItem, MagicType } from "./data";
import { getItemDescription } from "./i18n";
import styles from "./Ledger.module.css";
import React, { useRef } from "react";
import { Close, Currency, Tick, TickCircle } from "./components/Icons";
import {
  getAllCollectionItems,
  getClassIconVariant,
  getClassItemVariant,
  getItemIds,
  getItemName,
  getItemType,
} from "./data/getters";
import { countAllItemsInCollection } from "./data/aggregate";
import {
  countItemsInCollectionHidden,
  countItemsInCollectionOwned,
} from "./collection/aggregate";
import { onTouchStart } from "./common/dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
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
import btnStyles from "./components/Button.module.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "./components/Tooltip";
import { getPreferredClass, getPreferredGender } from "./settings/accessor";
import { getIcon } from "./bucket";

type Props = {
  collections: Collection[];
  parentCollection?: Collection;
  onClickItem: (collection: Collection, item: CollectionItem) => void;
  onToggleItem?: (item: CollectionItem) => void;
  onToggleCollection?: (collection: Collection) => void;
  onCollectionChange: (collectionId: number, isOpen: boolean) => void;
  openCollections: number[];
};

type PropsInner = Props & {
  collection: Collection;
};

const Ledger = ({
  collections,
  parentCollection,
  onClickItem,
  onToggleItem,
  onToggleCollection,
  onCollectionChange,
  openCollections,
}: Props) => {
  return (
    <Accordion
      transition
      transitionTimeout={250}
      allowMultiple
      onStateChange={(e) => {
        if (e.current.isResolved) {
          onCollectionChange(Number(e.key), e.current.isEnter);
        }
      }}
    >
      {collections.map((collection) => (
        <LedgerInner
          key={collection.id}
          collection={collection}
          collections={collections}
          parentCollection={parentCollection}
          openCollections={openCollections}
          onCollectionChange={onCollectionChange}
          onClickItem={onClickItem}
          onToggleItem={onToggleItem}
          onToggleCollection={onToggleCollection}
        />
      ))}
    </Accordion>
  );
};

const LedgerInner = ({
  collection,
  parentCollection,
  onClickItem,
  onToggleItem,
  onToggleCollection,
  onCollectionChange,
  openCollections,
}: PropsInner) => {
  const settings = useSettings();
  const log = useCollection();
  const dispatch = useCollectionDispatch();
  const toggleCountDown = useRef<NodeJS.Timeout | undefined>();

  // preferences
  const preferredClass = getPreferredClass(settings);
  const preferredGender = getPreferredGender(settings);

  const toggleItem = (dci: CollectionItem) => (collected: boolean) => {
    if (onToggleItem) {
      onToggleItem(dci);
    }

    dispatch({
      type: CollectionActionType.COLLECT,
      itemId: getItemIds(dci),
      toggle: collected,
    });
  };

  const toggleCollection = (dc: Collection) => (collected: boolean) => {
    if (onToggleCollection) {
      onToggleCollection(dc);
    }

    getAllCollectionItems(dc).forEach((dci) => {
      dispatch({
        type: CollectionActionType.COLLECT,
        itemId: getItemIds(dci),
        toggle: collected,
      });
    });
  };

  const collected = countItemsInCollectionOwned(log, collection);
  const total =
    countAllItemsInCollection(collection) -
    countItemsInCollectionHidden(log, collection);
  const isComplete = collected === total;
  const ledgerIsOpen = openCollections.includes(collection.id);

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
      initialEntered={ledgerIsOpen || collection.id === 888}
      itemKey={collection.id}
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
              <span className={styles.LedgerCollectionName}>
                {headingLabel}
              </span>
              <span className={styles.LedgerCounter}>{counterLabel}</span>
            </h1>
            <div className={styles.LedgerDescription}>{descriptionLabel}</div>
          </div>
          <span className={styles.LedgerActions}>
            <Tooltip placement={"left"}>
              <TooltipTrigger asChild={true}>
                <span
                  className={classNames({
                    [btnStyles.Btn]: true,
                    [btnStyles.BtnGreen]: isComplete,
                    [btnStyles.BtnGrey]: !isComplete,
                  })}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={() => {
                    clearTimeout(toggleCountDown.current);
                    toggleCountDown.current = setTimeout(() => {
                      toggleCollection(collection)(!isComplete);
                    }, 500);
                  }}
                  onMouseUp={() => {
                    clearTimeout(toggleCountDown.current);
                  }}
                  onTouchStart={() => {
                    clearTimeout(toggleCountDown.current);
                    toggleCountDown.current = setTimeout(() => {
                      toggleCollection(collection)(!isComplete);
                    }, 500);
                  }}
                  onTouchEnd={() => {
                    clearTimeout(toggleCountDown.current);
                  }}
                >
                  <Tick></Tick>
                </span>
              </TooltipTrigger>
              <TooltipContent>Hold down to toggle</TooltipContent>
            </Tooltip>
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
              const item =
                getClassItemVariant(collectionItem, preferredClass) ??
                getDefaultItem(collectionItem);
              const icon =
                getClassIconVariant(item, preferredClass, preferredGender) ??
                item.icon;
              const itemIds = getItemIds(collectionItem);
              const isCollected = isItemCollected(log, itemIds);
              const isHidden = isItemHidden(log, itemIds);
              const showCollected =
                isCollected && !isHidden && !collectionItem.unobtainable;
              const showExcluded = isHidden || collectionItem.unobtainable;

              const className = classNames({
                [styles.Item]: true,
                [styles.ItemCollected]: showCollected,
                [styles.ItemHidden]: showExcluded,
                [styles.ItemPremium]: collectionItem.premium,
                [styles.ItemUnique]: item.magicType === MagicType.UNIQUE,
                [styles.ItemMythic]: item.magicType === MagicType.MYTHIC,
              });

              return (
                <div
                  className={className}
                  onClick={() => onClickItem(collection, collectionItem)}
                  onDoubleClick={() => toggleItem(collectionItem)(!isCollected)}
                  onTouchStart={onTouchStart(() =>
                    toggleItem(collectionItem)(!isCollected),
                  )}
                  key={collectionItem.id}
                >
                  <LazyLoadImage
                    wrapperClassName={styles.ItemImageWrapper}
                    placeholderSrc={placeholder}
                    className={styles.ItemImage}
                    src={getIcon(icon)}
                    alt={getItemName(collectionItem, item)}
                  />
                  <div className={styles.ItemInfo}>
                    <div className={styles.ItemName}>
                      {getItemName(collectionItem, item)}
                    </div>
                    <div className={styles.ItemType}>
                      <span>
                        {getItemType(collectionItem, item)} |{" "}
                        {collectionItem.claim}
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
                    {isCollected && (
                      <span
                        className={
                          styles.ItemIcon + " " + styles.ItemIconCollection
                        }
                      >
                        <TickCircle></TickCircle>
                      </span>
                    )}
                    {showExcluded && (
                      <span
                        className={
                          styles.ItemIcon + " " + styles.ItemIconHidden
                        }
                      >
                        <Close></Close>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <Ledger
              collections={collection.subcollections}
              parentCollection={collection}
              onClickItem={onClickItem}
              onToggleItem={onToggleItem}
              onToggleCollection={onToggleCollection}
              onCollectionChange={onCollectionChange}
              openCollections={openCollections}
            />
          </div>
        );
      }}
    </AccordionItem>
  );
};

export default Ledger;
