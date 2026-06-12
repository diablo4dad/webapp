import { FallbackLazyImage } from "../components/LazyLoadImageFallback";
import { Collection, CollectionItem, getDefaultItem, MagicType } from "../data";
import { getItemDescription } from "../i18n";
import styles from "./Ledger.module.css";
import React, { useRef } from "react";
import { Close, Currency, Pencil, Tick, TickCircle } from "../components/Icons";
import {
  getAllCollectionItems,
  getClassIconVariant,
  getClassItemVariant,
  getItemIds,
  getItemName,
  getItemType,
} from "../data/getters";
import { countAllItemsInCollection } from "../data/aggregate";
import {
  countItemsInCollectionHidden,
  countItemsInCollectionOwned,
} from "./aggregate";
import { onTouchStart } from "../common/dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import placeholder from "../image/placeholder.webp";
import { Accordion, AccordionItem } from "@szhsin/react-accordion";
import { useSettings } from "../settings/context";
import { LedgerView } from "../settings/type";
import classNames from "classnames";
import { isLedgerInverse, isLedgerView } from "../settings/predicate";
import { isCollectionEmpty } from "../data/predicates";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "./context";
import { isItemCollected, isItemHidden } from "./predicate";
import btnStyles from "../components/Button.module.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/Tooltip";
import { getPreferredClass, getPreferredGender } from "../settings/accessor";
import { getIcon } from "../bucket";
import { useEditor } from "../editor/context";
import { Plus } from "../components/Icons";
import { MasterGroup } from "../common";
import { useData } from "../data/context";

type Props = {
  collections: Collection[];
  parentCollection?: Collection;
  onClickItem: (item: CollectionItem, collection: Collection) => void;
  onToggleItem?: (item: CollectionItem) => void;
  onToggleCollection?: (collection: Collection) => void;
  onCollectionChange: (collectionId: number, isOpen: boolean) => void;
  openCollections: number[];
  depth?: number;
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
  depth = 0,
}: Props) => {
  const { group, searchTerm } = useData();
  const { isEditMode, openCollectionCreator } = useEditor();
  const canAddRootCollection = depth === 0;
  const canAddSubcollectionToParent =
    depth === 1 &&
    parentCollection !== undefined &&
    parentCollection.collectionItems.length === 0 &&
    parentCollection.subcollections.length > 0;
  const canAddCollection =
    isEditMode &&
    searchTerm.trim() === "" &&
    group !== MasterGroup.UNIVERSAL &&
    (canAddRootCollection || canAddSubcollectionToParent);
  const addCollectionLabel =
    depth === 0 ? "Add Collection" : "Add Subcollection";
  const addCollectionParent = depth === 0 ? undefined : parentCollection;

  return (
    <>
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
            depth={depth}
            parentCollection={parentCollection}
            openCollections={openCollections}
            onCollectionChange={onCollectionChange}
            onClickItem={onClickItem}
            onToggleItem={onToggleItem}
            onToggleCollection={onToggleCollection}
          />
        ))}
      </Accordion>
      {canAddCollection && (
        <button
          type="button"
          className={styles.CollectionAdd}
          onClick={() => openCollectionCreator(addCollectionParent, group)}
        >
          <span className={styles.CollectionAddIcon}>
            <Plus />
          </span>
          <span>{addCollectionLabel}</span>
        </button>
      )}
    </>
  );
};

const LedgerInner = ({
  collection,
  depth = 0,
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
  const { group } = useData();
  const {
    isEditMode,
    openCollectionCreator,
    openCollectionEditor,
    openCollectionItemEditor,
  } = useEditor();
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
  const isEditableCatalogCollection =
    isEditMode &&
    collection.id !== 888 &&
    collection.category !== MasterGroup.UNIVERSAL &&
    parentCollection?.category !== MasterGroup.UNIVERSAL;
  const hasCollectionItems = collection.collectionItems.length > 0;
  const hasSubcollections = collection.subcollections.length > 0;
  const canAddCollectionItems =
    isEditableCatalogCollection && !hasSubcollections;
  const canAddSubcollections =
    isEditableCatalogCollection && depth === 0 && !hasCollectionItems;
  const shouldRenderAddItemCard = canAddCollectionItems;
  const shouldRenderAddSubcollectionCard =
    canAddSubcollections &&
    !hasSubcollections &&
    group !== MasterGroup.UNIVERSAL;
  const canEditCollection = isEditableCatalogCollection;

  return (
    <AccordionItem
      hidden={!isEditMode && isCollectionEmpty(collection)}
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
            {canEditCollection && (
              <Tooltip placement={"left"}>
                <TooltipTrigger asChild={true}>
                  <span
                    className={classNames(btnStyles.Btn, btnStyles.BtnGrey)}
                    onClick={(e) => {
                      e.stopPropagation();
                      openCollectionEditor(collection, parentCollection);
                    }}
                    aria-label="Edit collection"
                  >
                    <Pencil />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Edit collection</TooltipContent>
              </Tooltip>
            )}
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
                  onClick={() => onClickItem(collectionItem, collection)}
                  onDoubleClick={() => toggleItem(collectionItem)(!isCollected)}
                  onTouchStart={onTouchStart(() =>
                    toggleItem(collectionItem)(!isCollected),
                  )}
                  key={collectionItem.id}
                >
                  <FallbackLazyImage
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
            {shouldRenderAddItemCard && (
              <button
                type="button"
                className={classNames(styles.Item, styles.ItemAdd)}
                onClick={() => openCollectionItemEditor(collection)}
              >
                <div className={styles.ItemAddVisual}>
                  <span className={styles.ItemAddIcon}>
                    <Plus />
                  </span>
                </div>
                <div className={styles.ItemAddInfo}>
                  <div className={styles.ItemAddText}>Add Item</div>
                </div>
              </button>
            )}
            {shouldRenderAddSubcollectionCard && (
              <button
                type="button"
                className={classNames(styles.Item, styles.ItemAdd)}
                onClick={() => openCollectionCreator(collection, group)}
              >
                <div className={styles.ItemAddVisual}>
                  <span className={styles.ItemAddIcon}>
                    <Plus />
                  </span>
                </div>
                <div className={styles.ItemAddInfo}>
                  <div className={styles.ItemAddText}>Add Subcollection</div>
                </div>
              </button>
            )}
            <Ledger
              collections={collection.subcollections}
              parentCollection={collection}
              onClickItem={onClickItem}
              onToggleItem={onToggleItem}
              onToggleCollection={onToggleCollection}
              onCollectionChange={onCollectionChange}
              openCollections={openCollections}
              depth={depth + 1}
            />
          </div>
        );
      }}
    </AccordionItem>
  );
};

export default Ledger;
