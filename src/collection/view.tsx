import type { CSSProperties, ReactNode } from "react";
import { Accordion } from "@szhsin/react-accordion";
import { GripVertical, Plus } from "../components/Icons";
import type { MasterGroup } from "../common";
import type { Collection } from "../data";
import type { CollectionDragController } from "./ledger-types";
import type { CollectionParentId } from "./reorder";
import styles from "./view.module.css";

type RenderCollectionInput = {
  collection: Collection;
  collectionDragController: CollectionDragController;
  collectionIndex: number;
  collectionSiblingIds: string[];
};

type Props = {
  activeCollectionDragController: CollectionDragController;
  addCollectionLabel: string;
  addCollectionParent?: Collection;
  canAddCollection: boolean;
  collectionIds: string[];
  collectionParentId: CollectionParentId;
  collectionsById: Map<string, Collection>;
  draggedCollection?: Collection;
  group: MasterGroup;
  isCollectionDragRoot: boolean;
  onCollectionChange: (collectionId: string, isOpen: boolean) => void;
  onOpenCollectionCreator: (
    parentCollection: Collection | undefined,
    group: MasterGroup,
  ) => void;
  renderCollection: (input: RenderCollectionInput) => ReactNode;
  renderedCollectionIds: string[];
};

function LedgerView({
  activeCollectionDragController,
  addCollectionLabel,
  addCollectionParent,
  canAddCollection,
  collectionIds,
  collectionParentId,
  collectionsById,
  draggedCollection,
  group,
  isCollectionDragRoot,
  onCollectionChange,
  onOpenCollectionCreator,
  renderCollection,
  renderedCollectionIds,
}: Props) {
  const collectionDragState = activeCollectionDragController.collectionDragState;

  return (
    <div
      className={styles.LedgerView}
      data-collection-category={group}
      data-collection-drop-list="true"
      data-collection-parent-id={collectionParentId ?? "root"}
    >
      <Accordion
        transition
        transitionTimeout={250}
        allowMultiple
        onStateChange={(event) => {
          if (event.current.isResolved) {
            onCollectionChange(String(event.key), event.current.isEnter);
          }
        }}
      >
        {renderedCollectionIds.map((collectionId) => {
          if (
            collectionDragState?.collectionId === collectionId &&
            collectionDragState.targetParentId === collectionParentId
          ) {
            return (
              <div
                key={`collection-placeholder-${collectionId}`}
                className={styles.LedgerViewDropPlaceholder}
                style={
                  {
                    "--collection-placeholder-height": `${collectionDragState.height}px`,
                  } as CSSProperties
                }
              />
            );
          }

          const collection = collectionsById.get(collectionId);
          if (!collection) {
            return null;
          }

          return renderCollection({
            collection,
            collectionDragController: activeCollectionDragController,
            collectionIndex: collectionIds.indexOf(collection.id),
            collectionSiblingIds: collectionIds,
          });
        })}
      </Accordion>
      {canAddCollection && (
        <button
          type="button"
          className={styles.LedgerViewAdd}
          onClick={() => onOpenCollectionCreator(addCollectionParent, group)}
        >
          <span className={styles.LedgerViewAddIcon}>
            <Plus />
          </span>
          <span>{addCollectionLabel}</span>
        </button>
      )}
      {isCollectionDragRoot &&
        activeCollectionDragController.collectionDragError && (
          <div className={styles.LedgerViewReorderError}>
            {activeCollectionDragController.collectionDragError}
          </div>
        )}
      {isCollectionDragRoot && collectionDragState && draggedCollection && (
        <div
          className={styles.LedgerViewDragGhost}
          style={{
            height: collectionDragState.height,
            left: collectionDragState.pointerX - collectionDragState.offsetX,
            top: collectionDragState.pointerY - collectionDragState.offsetY,
            width: collectionDragState.width,
          }}
        >
          <span className={styles.LedgerViewDragHandle}>
            <GripVertical />
          </span>
          <div>
            <h1 className={styles.LedgerViewTitle}>
              <span className={styles.LedgerViewCollectionName}>
                {draggedCollection.name}
              </span>
            </h1>
            <div className={styles.LedgerViewDescription}>
              {draggedCollection.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { LedgerView };
export type { RenderCollectionInput };
