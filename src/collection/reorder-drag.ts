type DragScrollTarget = HTMLElement | Window;

const DRAG_AUTO_SCROLL_EDGE_SIZE = 96;
const DRAG_AUTO_SCROLL_MAX_SPEED = 14;

function getDragScrollTarget(element: HTMLElement): DragScrollTarget {
  let candidate = element.parentElement;

  while (candidate) {
    const { overflowY } = window.getComputedStyle(candidate);
    const canScroll =
      ["auto", "scroll", "overlay"].includes(overflowY) &&
      candidate.scrollHeight > candidate.clientHeight;

    if (canScroll) {
      return candidate;
    }

    candidate = candidate.parentElement;
  }

  return window;
}

function createDragAutoScroller(
  scrollTarget: DragScrollTarget | undefined,
  onAutoScroll?: () => void,
) {
  let frameId: number | undefined;
  let isActive = true;
  let pointerY = 0;

  function schedule() {
    if (frameId === undefined) {
      frameId = window.requestAnimationFrame(tick);
    }
  }

  function tick() {
    frameId = undefined;

    if (!isActive || !scrollTarget) {
      return;
    }

    const velocity = getDragAutoScrollVelocity(scrollTarget, pointerY);
    if (velocity === 0) {
      return;
    }

    scrollDragTargetBy(scrollTarget, velocity);
    onAutoScroll?.();
    schedule();
  }

  return {
    stop() {
      isActive = false;

      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
        frameId = undefined;
      }
    },
    update(nextPointerY: number) {
      pointerY = nextPointerY;
      schedule();
    },
  };
}

function getItemInsertIndexFromPointer(
  container: HTMLElement,
  pointerX: number,
  pointerY: number,
): number {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>("[data-reorder-item='true']"),
  );

  if (items.length === 0) {
    return 0;
  }

  const isGrid = window.getComputedStyle(container).display === "grid";
  if (!isGrid) {
    const targetIndex = items.findIndex((item) => {
      const rect = item.getBoundingClientRect();

      return pointerY < rect.top + rect.height / 2;
    });

    return targetIndex === -1 ? items.length : targetIndex;
  }

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance =
      Math.pow(pointerX - centerX, 2) + Math.pow(pointerY - centerY, 2);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  const closestRect = items[closestIndex].getBoundingClientRect();
  const isAfterClosest =
    pointerY > closestRect.top + closestRect.height / 2 ||
    (pointerY >= closestRect.top &&
      pointerY <= closestRect.bottom &&
      pointerX > closestRect.left + closestRect.width / 2);

  return Math.max(
    0,
    Math.min(closestIndex + (isAfterClosest ? 1 : 0), items.length),
  );
}

function getCollectionInsertIndexFromPointer(
  container: HTMLElement,
  pointerY: number,
): number {
  const items = Array.from(
    container.querySelectorAll<HTMLElement>(
      "[data-collection-reorder-item='true']",
    ),
  ).filter(
    (item) => item.closest("[data-collection-drop-list='true']") === container,
  );

  if (items.length === 0) {
    return 0;
  }

  const targetIndex = items.findIndex((item) => {
    const rect = item.getBoundingClientRect();

    return pointerY < rect.top + rect.height / 2;
  });

  return targetIndex === -1 ? items.length : targetIndex;
}

function getCollectionIdsForDropList(listElement: HTMLElement): string[] {
  return Array.from(
    listElement.querySelectorAll<HTMLElement>(
      "[data-collection-reorder-item='true']",
    ),
  )
    .filter(
      (itemElement) =>
        itemElement.closest("[data-collection-drop-list='true']") ===
        listElement,
    )
    .map((itemElement) => itemElement.dataset.collectionId)
    .filter((collectionId): collectionId is string => Boolean(collectionId));
}

function getDragScrollMetrics(scrollTarget: DragScrollTarget) {
  if (scrollTarget === window) {
    const scrollingElement =
      document.scrollingElement ?? document.documentElement;

    return {
      bottom: window.innerHeight,
      maxScrollTop: Math.max(
        0,
        scrollingElement.scrollHeight - window.innerHeight,
      ),
      scrollTop: window.scrollY,
      top: 0,
    };
  }

  const element = scrollTarget as HTMLElement;
  const rect = element.getBoundingClientRect();

  return {
    bottom: rect.bottom,
    maxScrollTop: Math.max(0, element.scrollHeight - element.clientHeight),
    scrollTop: element.scrollTop,
    top: rect.top,
  };
}

function getDragAutoScrollVelocity(
  scrollTarget: DragScrollTarget,
  pointerY: number,
): number {
  const { bottom, maxScrollTop, scrollTop, top } =
    getDragScrollMetrics(scrollTarget);

  if (maxScrollTop <= 0) {
    return 0;
  }

  const topDistance = pointerY - top;
  if (topDistance < DRAG_AUTO_SCROLL_EDGE_SIZE && scrollTop > 0) {
    const intensity =
      (DRAG_AUTO_SCROLL_EDGE_SIZE - Math.max(0, topDistance)) /
      DRAG_AUTO_SCROLL_EDGE_SIZE;

    return -Math.ceil(intensity * DRAG_AUTO_SCROLL_MAX_SPEED);
  }

  const bottomDistance = bottom - pointerY;
  if (bottomDistance < DRAG_AUTO_SCROLL_EDGE_SIZE && scrollTop < maxScrollTop) {
    const intensity =
      (DRAG_AUTO_SCROLL_EDGE_SIZE - Math.max(0, bottomDistance)) /
      DRAG_AUTO_SCROLL_EDGE_SIZE;

    return Math.ceil(intensity * DRAG_AUTO_SCROLL_MAX_SPEED);
  }

  return 0;
}

function scrollDragTargetBy(
  scrollTarget: DragScrollTarget,
  scrollDelta: number,
) {
  if (scrollTarget === window) {
    window.scrollBy(0, scrollDelta);
    return;
  }

  (scrollTarget as HTMLElement).scrollTop += scrollDelta;
}

export {
  createDragAutoScroller,
  getCollectionIdsForDropList,
  getCollectionInsertIndexFromPointer,
  getDragScrollTarget,
  getItemInsertIndexFromPointer,
};
export type { DragScrollTarget };
