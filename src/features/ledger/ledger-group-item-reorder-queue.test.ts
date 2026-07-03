import { describe, expect, test, vi } from "vitest";
import {
  canQueueLedgerGroupItemReorder,
  queueLedgerGroupItemDragStart,
} from "./ledger-group-item-reorder-queue";

function pointerEvent(
  type: "pointermove" | "pointerup" | "pointercancel",
  overrides: {
    clientX?: number;
    clientY?: number;
    pointerId?: number;
  } = {},
) {
  const event = new Event(type, {
    cancelable: true,
  }) as PointerEvent;

  Object.defineProperties(event, {
    clientX: {
      value: overrides.clientX ?? 0,
    },
    clientY: {
      value: overrides.clientY ?? 0,
    },
    pointerId: {
      value: overrides.pointerId ?? 1,
    },
  });

  return event;
}

describe("ledger group item reorder queue", () => {
  test("allows mouse reorder when editable and idle", () => {
    expect(
      canQueueLedgerGroupItemReorder({
        button: 0,
        canReorder: true,
        isReordering: false,
        pointerType: "mouse",
        target: document.createElement("div"),
      }),
    ).toBe(true);
  });

  test("blocks disabled, touch, non-primary, and button targets", () => {
    const button = document.createElement("button");

    expect(
      canQueueLedgerGroupItemReorder({
        button: 0,
        canReorder: false,
        isReordering: false,
        pointerType: "mouse",
        target: document.createElement("div"),
      }),
    ).toBe(false);
    expect(
      canQueueLedgerGroupItemReorder({
        button: 0,
        canReorder: true,
        isReordering: false,
        pointerType: "touch",
        target: document.createElement("div"),
      }),
    ).toBe(false);
    expect(
      canQueueLedgerGroupItemReorder({
        button: 1,
        canReorder: true,
        isReordering: false,
        pointerType: "mouse",
        target: document.createElement("div"),
      }),
    ).toBe(false);
    expect(
      canQueueLedgerGroupItemReorder({
        button: 0,
        canReorder: true,
        isReordering: false,
        pointerType: "mouse",
        target: button,
      }),
    ).toBe(false);
  });

  test("starts after the pointer moves beyond the threshold", () => {
    const onStart = vi.fn();
    const moveEvent = pointerEvent("pointermove", {
      clientX: 7,
      clientY: 0,
      pointerId: 1,
    });
    const preventDefault = vi.spyOn(moveEvent, "preventDefault");

    queueLedgerGroupItemDragStart({
      onStart,
      pointerId: 1,
      startX: 0,
      startY: 0,
    });
    window.dispatchEvent(moveEvent);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(onStart).toHaveBeenCalledWith(7, 0);
  });

  test("waits below the threshold and cleans up on pointer up", () => {
    const onStart = vi.fn();

    queueLedgerGroupItemDragStart({
      onStart,
      pointerId: 1,
      startX: 0,
      startY: 0,
    });
    window.dispatchEvent(
      pointerEvent("pointermove", {
        clientX: 5,
        clientY: 0,
        pointerId: 1,
      }),
    );
    window.dispatchEvent(
      pointerEvent("pointerup", {
        pointerId: 1,
      }),
    );
    window.dispatchEvent(
      pointerEvent("pointermove", {
        clientX: 10,
        clientY: 0,
        pointerId: 1,
      }),
    );

    expect(onStart).not.toHaveBeenCalled();
  });

  test("ignores a different pointer id", () => {
    const onStart = vi.fn();

    queueLedgerGroupItemDragStart({
      onStart,
      pointerId: 1,
      startX: 0,
      startY: 0,
    });
    window.dispatchEvent(
      pointerEvent("pointermove", {
        clientX: 10,
        clientY: 0,
        pointerId: 2,
      }),
    );
    window.dispatchEvent(
      pointerEvent("pointercancel", {
        pointerId: 1,
      }),
    );

    expect(onStart).not.toHaveBeenCalled();
  });
});
