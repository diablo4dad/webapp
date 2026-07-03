import classNames from "classnames";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import { getIcon } from "../services/bucket";
import { onTouchStart } from "../shared/lib/dom";
import { Close, Currency, GripVertical, TickCircle } from "../shared/ui/Icons";
import { FallbackLazyImage } from "../shared/ui/LazyLoadImageFallback";
import { MagicType, type CollectionItem } from "../services/data";
import { getItemName, getItemType } from "../services/data/getters";
import { getItemDescription } from "../services/i18n";
import placeholder from "../image/placeholder.webp";
import type { LedgerGroupItemDragState } from "./types";
import type { LedgerGroupItemView } from "./ledger-group-item-view";
import styles from "./ledger-group-item-card.module.css";

type Props = {
  canReorder: boolean;
  collectionItem: CollectionItem;
  isDragging: boolean;
  isReordering: boolean;
  itemView: LedgerGroupItemView;
  onClick: () => void;
  onQueueReorder: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onStartReorder: (event: ReactPointerEvent<HTMLElement>) => void;
  onToggle: () => void;
};

type GhostProps = {
  collectionItem: CollectionItem;
  dragState: LedgerGroupItemDragState;
  itemView: LedgerGroupItemView;
};

type ContentProps = {
  canReorder: boolean;
  collectionItem: CollectionItem;
  itemView: LedgerGroupItemView;
  onStartReorder?: (event: ReactPointerEvent<HTMLElement>) => void;
  showDragHandle: boolean;
};

type ClassNameOptions = {
  canReorder: boolean;
  collectionItem: CollectionItem;
  isDragging: boolean;
  isGhost?: boolean;
  isReordering: boolean;
  itemView: LedgerGroupItemView;
};

function LedgerGroupItemCard({
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

function LedgerGroupItemDragGhost({
  collectionItem,
  dragState,
  itemView,
}: GhostProps) {
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

function LedgerGroupItemDropPlaceholder() {
  return (
    <div
      className={classNames(
        styles.LedgerGroupItem,
        styles.LedgerGroupItemDropPlaceholder,
      )}
      aria-hidden="true"
    >
      <div className={styles.LedgerGroupItemDropPlaceholderVisual} />
      <div className={styles.LedgerGroupItemDropPlaceholderInfo} />
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
          className={styles.LedgerGroupItemDragHandle}
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
        wrapperClassName={styles.LedgerGroupItemImageWrapper}
        placeholderSrc={placeholder}
        className={styles.LedgerGroupItemImage}
        src={getIcon(itemView.icon)}
        alt={itemName}
      />
      <div className={styles.LedgerGroupItemInfo}>
        <div className={styles.LedgerGroupItemName}>{itemName}</div>
        <div className={styles.LedgerGroupItemType}>
          <span>
            {getItemType(collectionItem, itemView.item)} |{" "}
            {collectionItem.claim}
          </span>
          <span
            className={styles.LedgerGroupItemIconPremiumTitle}
            hidden={!collectionItem.premium}
          >
            <Currency />
          </span>
        </div>
        <div className={styles.LedgerGroupItemClaimDescription}>
          {getItemDescription(collectionItem)}
        </div>
      </div>
      <div className={styles.LedgerGroupItemIcons}>
        <span
          className={
            styles.LedgerGroupItemIcon +
            " " +
            styles.LedgerGroupItemIconPremium
          }
        >
          <Currency />
        </span>
        {itemView.isCollected && (
          <span
            className={
              styles.LedgerGroupItemIcon +
              " " +
              styles.LedgerGroupItemIconCollection
            }
          >
            <TickCircle />
          </span>
        )}
        {itemView.showExcluded && (
          <span
            className={
              styles.LedgerGroupItemIcon +
              " " +
              styles.LedgerGroupItemIconHidden
            }
          >
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
    [styles.LedgerGroupItem]: true,
    [styles.LedgerGroupItemDragReady]: canReorder && !isGhost && !isDragging,
    [styles.LedgerGroupItemDragGhost]: isGhost,
    [styles.LedgerGroupItemReorderSaving]: isReordering && !isGhost,
    [styles.LedgerGroupItemCollected]: itemView.showCollected,
    [styles.LedgerGroupItemHidden]: itemView.showExcluded,
    [styles.LedgerGroupItemPremium]: collectionItem.premium,
    [styles.LedgerGroupItemUnique]:
      itemView.item.magicType === MagicType.UNIQUE,
    [styles.LedgerGroupItemMythic]: itemView.item.magicType === MagicType.MYTHIC,
  });
}

export {
  LedgerGroupItemCard,
  LedgerGroupItemDragGhost,
  LedgerGroupItemDropPlaceholder,
};
