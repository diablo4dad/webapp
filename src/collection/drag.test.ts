import { afterEach, describe, expect, test, vi } from "vitest";
import {
  getCollectionIdsForDropList,
  getCollectionInsertIndexFromPointer,
  getDragScrollTarget,
  getItemInsertIndexFromPointer,
} from "./drag";

type RectInput = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function element(tagName = "div"): HTMLElement {
  const node = document.createElement(tagName);
  document.body.appendChild(node);

  return node;
}

function setRect(node: HTMLElement, rect: RectInput) {
  vi.spyOn(node, "getBoundingClientRect").mockReturnValue({
    ...rect,
    x: rect.left,
    y: rect.top,
    toJSON: () => rect,
  } as DOMRect);
}

function setScrollMetrics(
  node: HTMLElement,
  metrics: {
    clientHeight: number;
    scrollHeight: number;
  },
) {
  Object.defineProperty(node, "clientHeight", {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(node, "scrollHeight", {
    configurable: true,
    value: metrics.scrollHeight,
  });
}

function item(top: number, left = 0): HTMLElement {
  const node = document.createElement("div");
  node.dataset.reorderItem = "true";
  setRect(node, {
    bottom: top + 20,
    height: 20,
    left,
    right: left + 20,
    top,
    width: 20,
  });

  return node;
}

function collection(id: string, top: number): HTMLElement {
  const node = document.createElement("div");
  node.dataset.collectionId = id;
  node.dataset.collectionReorderItem = "true";
  setRect(node, {
    bottom: top + 20,
    height: 20,
    left: 0,
    right: 200,
    top,
    width: 200,
  });

  return node;
}

describe("drag scroll target", () => {
  test("returns the nearest scrollable ancestor", () => {
    const scrollParent = element();
    const child = document.createElement("div");
    scrollParent.style.overflowY = "auto";
    setScrollMetrics(scrollParent, {
      clientHeight: 100,
      scrollHeight: 200,
    });
    scrollParent.appendChild(child);

    expect(getDragScrollTarget(child)).toBe(scrollParent);
  });

  test("falls back to window", () => {
    const child = element();

    expect(getDragScrollTarget(child)).toBe(window);
  });
});

describe("item insert index", () => {
  test("uses vertical midpoint for list layouts", () => {
    const container = element();
    container.append(item(0), item(20), item(40));

    expect(getItemInsertIndexFromPointer(container, 0, 5)).toBe(0);
    expect(getItemInsertIndexFromPointer(container, 0, 25)).toBe(1);
    expect(getItemInsertIndexFromPointer(container, 0, 80)).toBe(3);
  });

  test("uses closest grid item and pointer half", () => {
    const container = element();
    container.style.display = "grid";
    container.append(item(0, 0), item(0, 20), item(20, 0), item(20, 20));

    expect(getItemInsertIndexFromPointer(container, 25, 10)).toBe(1);
    expect(getItemInsertIndexFromPointer(container, 35, 10)).toBe(2);
  });
});

describe("collection drop list", () => {
  test("uses direct collection item midpoints", () => {
    const list = element();
    list.dataset.collectionDropList = "true";
    const nestedList = document.createElement("div");
    nestedList.dataset.collectionDropList = "true";
    nestedList.appendChild(collection("nested", 20));
    list.append(collection("a", 0), nestedList, collection("b", 40));

    expect(getCollectionInsertIndexFromPointer(list, 30)).toBe(1);
    expect(getCollectionInsertIndexFromPointer(list, 80)).toBe(2);
  });

  test("lists direct collection ids", () => {
    const list = element();
    list.dataset.collectionDropList = "true";
    const nestedList = document.createElement("div");
    nestedList.dataset.collectionDropList = "true";
    nestedList.appendChild(collection("nested", 20));
    list.append(collection("a", 0), nestedList, collection("b", 40));

    expect(getCollectionIdsForDropList(list)).toEqual(["a", "b"]);
  });
});
