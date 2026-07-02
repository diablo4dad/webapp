type GuardOptions = {
  button: number;
  canReorder: boolean;
  isReordering: boolean;
  pointerType: string;
  target: EventTarget | null;
};

type QueueOptions = {
  onStart: (pointerX: number, pointerY: number) => void;
  pointerId: number;
  startX: number;
  startY: number;
};

const ITEM_DRAG_START_DISTANCE = 6;

function canQueueLedgerGroupItemReorder({
  button,
  canReorder,
  isReordering,
  pointerType,
  target,
}: GuardOptions): boolean {
  return (
    canReorder &&
    !isReordering &&
    button === 0 &&
    pointerType !== "touch" &&
    !isElementInsideButton(target)
  );
}

function queueLedgerGroupItemDragStart({
  onStart,
  pointerId,
  startX,
  startY,
}: QueueOptions) {
  function cleanup() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
  }

  function onPointerMove(pointerEvent: PointerEvent) {
    if (pointerEvent.pointerId !== pointerId) {
      return;
    }

    const distance = Math.hypot(
      pointerEvent.clientX - startX,
      pointerEvent.clientY - startY,
    );

    if (distance < ITEM_DRAG_START_DISTANCE) {
      return;
    }

    pointerEvent.preventDefault();
    cleanup();
    onStart(pointerEvent.clientX, pointerEvent.clientY);
  }

  function onPointerUp(pointerEvent: PointerEvent) {
    if (pointerEvent.pointerId !== pointerId) {
      return;
    }

    cleanup();
  }

  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
}

function isElementInsideButton(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button") !== null;
}

export { canQueueLedgerGroupItemReorder, queueLedgerGroupItemDragStart };
