import classNames from "classnames";
import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import btnStyles from "../components/Button.module.css";
import { GripVertical, Pencil, Tick } from "../components/Icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/Tooltip";
import type { Collection } from "../data";
import styles from "./Ledger.module.css";

type Props = {
  canEdit: boolean;
  canReorder: boolean;
  collection: Collection;
  counterLabel: string;
  descriptionLabel?: string;
  headingLabel: string;
  isComplete: boolean;
  onEdit: () => void;
  onStartReorder: (event: ReactPointerEvent<HTMLElement>) => void;
  onToggle: () => void;
};

function SectionHeader({
  canEdit,
  canReorder,
  collection,
  counterLabel,
  descriptionLabel,
  headingLabel,
  isComplete,
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
      className={styles.LedgerHeaderContent}
      data-collection-id={collection.id}
      data-collection-reorder-item="true"
    >
      {canReorder && (
        <span
          className={styles.CollectionDragHandle}
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
        <h1 className={styles.LedgerTitle}>
          <span className={styles.LedgerCollectionName}>{headingLabel}</span>
          <span className={styles.LedgerCounter}>{counterLabel}</span>
        </h1>
        <div className={styles.LedgerDescription}>{descriptionLabel}</div>
      </div>
      <span className={styles.LedgerActions}>
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

export { SectionHeader };
