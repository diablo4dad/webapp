import classNames from "classnames";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import btnStyles from "../shared/ui/Button.module.css";
import { GripVertical, Pencil, Tick } from "../shared/ui/Icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../shared/ui/Tooltip";
import type { Collection } from "../services/data";
import styles from "./ledger-group-header.module.css";

type Props = {
  canEdit: boolean;
  canReorder: boolean;
  collection: Collection;
  counterLabel: string;
  descriptionLabel?: string;
  headingLabel: string;
  isComplete: boolean;
  isSubcollection: boolean;
  onEdit: () => void;
  onStartReorder: (event: ReactPointerEvent<HTMLElement>) => void;
  onToggle: () => void;
};

function LedgerGroupHeader({
  canEdit,
  canReorder,
  collection,
  counterLabel,
  descriptionLabel,
  headingLabel,
  isComplete,
  isSubcollection,
  onEdit,
  onStartReorder,
  onToggle,
}: Props) {
  const toggleCountDown = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    return () => clearTimeout(toggleCountDown.current);
  }, []);

  function queueToggle() {
    clearTimeout(toggleCountDown.current);
    toggleCountDown.current = setTimeout(onToggle, 500);
  }

  function cancelToggle() {
    clearTimeout(toggleCountDown.current);
  }

  return (
    <span
      className={styles.LedgerGroupHeaderContent}
      data-collection-id={collection.id}
      data-collection-reorder-item="true"
    >
      {canReorder && (
        <span
          className={styles.LedgerGroupHeaderDragHandle}
          aria-label={`Reorder ${collection.name}`}
          role="button"
          tabIndex={0}
          title="Reorder collection"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onPointerDown={onStartReorder}
        >
          <GripVertical />
        </span>
      )}
      <div>
        <h1
          className={classNames(styles.LedgerGroupHeaderTitle, {
            [styles.LedgerGroupHeaderTitleSubcollection]: isSubcollection,
          })}
        >
          <span className={styles.LedgerGroupHeaderCollectionName}>
            {headingLabel}
          </span>
          <span className={styles.LedgerGroupHeaderCounter}>
            {counterLabel}
          </span>
        </h1>
        <div className={styles.LedgerGroupHeaderDescription}>
          {descriptionLabel}
        </div>
      </div>
      <span className={styles.LedgerGroupHeaderActions}>
        {canEdit && (
          <Tooltip placement={"left"}>
            <TooltipTrigger asChild={true}>
              <span
                className={classNames(btnStyles.Btn, btnStyles.BtnGrey)}
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
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
              aria-label="Toggle collection"
              onClick={(event) => {
                event.stopPropagation();
              }}
              onMouseDown={queueToggle}
              onMouseUp={cancelToggle}
              onTouchStart={queueToggle}
              onTouchEnd={cancelToggle}
            >
              <Tick />
            </span>
          </TooltipTrigger>
          <TooltipContent>Hold down to toggle</TooltipContent>
        </Tooltip>
      </span>
    </span>
  );
}

export { LedgerGroupHeader };
