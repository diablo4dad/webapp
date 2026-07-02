import classNames from "classnames";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import { getIcon } from "../bucket";
import { onTouchStart } from "../common/dom";
import { Close, Currency, GripVertical, TickCircle } from "../components/Icons";
import { FallbackLazyImage } from "../components/LazyLoadImageFallback";
import { MagicType, type CollectionItem, type Item } from "../data";
import { getItemName, getItemType } from "../data/getters";
import { getItemDescription } from "../i18n";
import placeholder from "../image/placeholder.webp";
import type { ItemDragState } from "./ledger-types";
import styles from "./Ledger.module.css";

type ItemView = {
  icon: string;
  isCollected: boolean;
  item: Item;
  showCollected: boolean;
  showExcluded: boolean;
};

type Props = {
  canReorder: boolean;
  collectionItem: CollectionItem;
  isDragging: boolean;
  isReordering: boolean;
  itemView: ItemView;
  onClick: () => void;
  onQueueReorder: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onStartReorder: (event: ReactPointerEvent<HTMLElement>) => void;
  onToggle: () => void;
};

type GhostProps = {
  collectionItem: CollectionItem;
  dragState: ItemDragState;
  itemView: ItemView;
};

type ContentProps = {
  canReorder: boolean;
  collectionItem: CollectionItem;
  itemView: ItemView;
  onStartReorder?: (event: ReactPointerEvent<HTMLElement>) => void;
  showDragHandle: boolean;
};

type ClassNameOptions = {
  canReorder: boolean;
  collectionItem: CollectionItem;
  isDragging: boolean;
  isGhost?: boolean;
  isReordering: boolean;
  itemView: ItemView;
};

function ItemCard({
  canReorder,
  collectionItem,
  isDragging,
  isReordering,
  itemView,
  onClick,
  onQueueReorder,
  onStartReorder,
  onToggle,
}: Props) {
  return (
    <div
      className={getItemClassName({
        canReorder,
        collectionItem,
        isDragging,
        isReordering,
        itemView,
      })}
      data-reorder-item="true"
      onPointerDown={onQueueReorder}
      onClick={onClick}
      onDoubleClick={onToggle}
      onTouchStart={onTouchStart(onToggle)}
    >
      <ItemContent
        canReorder={canReorder}
        collectionItem={collectionItem}
        itemView={itemView}
        onStartReorder={onStartReorder}
        showDragHandle={true}
      />
    </div>
  );
}

function ItemDragGhost({ collectionItem, dragState, itemView }: GhostProps) {
  return (
    <div
      className={getItemClassName({
        canReorder: false,
        collectionItem,
        isDragging: true,
        isGhost: true,
        isReordering: false,
        itemView,
      })}
      style={
        {
          "--drag-ghost-height": `${dragState.height}px`,
          "--drag-ghost-width": `${dragState.width}px`,
          height: dragState.height,
          left: dragState.pointerX - dragState.offsetX,
          top: dragState.pointerY - dragState.offsetY,
          width: dragState.width,
        } as CSSProperties
      }
    >
      <ItemContent
        canReorder={false}
        collectionItem={collectionItem}
        itemView={itemView}
        showDragHandle={false}
      />
    </div>
  );
}

function ItemDropPlaceholder() {
  return (
    <div
      className={classNames(styles.Item, styles.ItemDropPlaceholder)}
      aria-hidden="true"
    >
      <div className={styles.ItemDropPlaceholderVisual} />
      <div className={styles.ItemDropPlaceholderInfo} />
    </div>
  );
}

function ItemContent({
  canReorder,
  collectionItem,
  itemView,
  onStartReorder,
  showDragHandle,
}: ContentProps) {
  const itemName = getItemName(collectionItem, itemView.item);

  return (
    <>
      {showDragHandle && canReorder && onStartReorder && (
        <button
          type="button"
          className={styles.ItemDragHandle}
          aria-label={`Reorder ${itemName}`}
          title="Reorder item"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => onStartReorder(event)}
          onTouchStart={(event) => event.stopPropagation()}
        >
          <GripVertical />
        </button>
      )}
      <FallbackLazyImage
        wrapperClassName={styles.ItemImageWrapper}
        placeholderSrc={placeholder}
        className={styles.ItemImage}
        src={getIcon(itemView.icon)}
        alt={itemName}
      />
      <div className={styles.ItemInfo}>
        <div className={styles.ItemName}>{itemName}</div>
        <div className={styles.ItemType}>
          <span>
            {getItemType(collectionItem, itemView.item)} |{" "}
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
        <span className={styles.ItemIcon + " " + styles.ItemIconPremium}>
          <Currency />
        </span>
        {itemView.isCollected && (
          <span className={styles.ItemIcon + " " + styles.ItemIconCollection}>
            <TickCircle />
          </span>
        )}
        {itemView.showExcluded && (
          <span className={styles.ItemIcon + " " + styles.ItemIconHidden}>
            <Close />
          </span>
        )}
      </div>
    </>
  );
}

function getItemClassName({
  canReorder,
  collectionItem,
  isDragging,
  isGhost = false,
  isReordering,
  itemView,
}: ClassNameOptions) {
  return classNames({
    [styles.Item]: true,
    [styles.ItemDragReady]: canReorder && !isGhost && !isDragging,
    [styles.ItemDragGhost]: isGhost,
    [styles.ItemReorderSaving]: isReordering && !isGhost,
    [styles.ItemCollected]: itemView.showCollected,
    [styles.ItemHidden]: itemView.showExcluded,
    [styles.ItemPremium]: collectionItem.premium,
    [styles.ItemUnique]: itemView.item.magicType === MagicType.UNIQUE,
    [styles.ItemMythic]: itemView.item.magicType === MagicType.MYTHIC,
  });
}

export { ItemCard, ItemDragGhost, ItemDropPlaceholder };
export type { ItemView };
