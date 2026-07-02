import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  CharacterClass,
  CharacterGender,
  CollectionItem,
} from "../data";
import {
  ItemCard,
  ItemDragGhost,
  ItemDropPlaceholder,
} from "./item-card";
import { getItemView } from "./item-view";
import type { ItemDragState } from "./types";
import type { CollectionLog } from "./type";

type Props = {
  canReorder: boolean;
  collectionItemsById: Map<number, CollectionItem>;
  dragState?: ItemDragState;
  draggedCollectionItem?: CollectionItem;
  isReordering: boolean;
  log: CollectionLog;
  onClickItem: (collectionItem: CollectionItem) => void;
  onQueueReorder: (
    event: ReactPointerEvent<HTMLDivElement>,
    collectionItem: CollectionItem,
  ) => void;
  onStartReorder: (
    event: ReactPointerEvent<HTMLElement>,
    collectionItem: CollectionItem,
  ) => void;
  onToggleItem: (collectionItem: CollectionItem, isCollected: boolean) => void;
  preferredClass: CharacterClass;
  preferredGender: CharacterGender;
  renderedCollectionItemIds: number[];
  shouldSuppressItemClick: () => boolean;
};

function LedgerGroupItems({
  canReorder,
  collectionItemsById,
  dragState,
  draggedCollectionItem,
  isReordering,
  log,
  onClickItem,
  onQueueReorder,
  onStartReorder,
  onToggleItem,
  preferredClass,
  preferredGender,
  renderedCollectionItemIds,
  shouldSuppressItemClick,
}: Props) {
  return (
    <>
      {renderedCollectionItemIds.map((collectionItemId) => {
        if (dragState?.draggedItemId === collectionItemId) {
          return (
            <ItemDropPlaceholder
              key={`drop-placeholder-${collectionItemId}`}
            />
          );
        }

        const collectionItem = collectionItemsById.get(collectionItemId);
        if (!collectionItem) {
          return null;
        }

        const itemView = getItemView({
          collectionItem,
          log,
          preferredClass,
          preferredGender,
        });

        return (
          <ItemCard
            key={collectionItem.id}
            canReorder={canReorder}
            collectionItem={collectionItem}
            isDragging={dragState !== undefined}
            isReordering={isReordering}
            itemView={itemView}
            onClick={() => {
              if (shouldSuppressItemClick()) {
                return;
              }

              if (!dragState) {
                onClickItem(collectionItem);
              }
            }}
            onQueueReorder={(event) => onQueueReorder(event, collectionItem)}
            onStartReorder={(event) => onStartReorder(event, collectionItem)}
            onToggle={() => onToggleItem(collectionItem, !itemView.isCollected)}
          />
        );
      })}
      {dragState && draggedCollectionItem && (
        <ItemDragGhost
          collectionItem={draggedCollectionItem}
          dragState={dragState}
          itemView={getItemView({
            collectionItem: draggedCollectionItem,
            log,
            preferredClass,
            preferredGender,
          })}
        />
      )}
    </>
  );
}

export { LedgerGroupItems };
