import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getDocsFromCache,
  loadBundle,
  namedQuery,
  query as firestoreQuery,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { CollectionItemRef, CollectionRef, DadDbRef } from "../data";
import { assignTransientCollectionItemIds } from "../data/factory";

const CATALOG_COLLECTION = "catalogs";
const CATALOG_ID = "d4";
const CATALOG_VERSION_COLLECTION = "versions";
const CATALOG_NODE_COLLECTION = "collectionNodes";
const DEFAULT_CATALOG_VERSION_ID = "v3";
const CATALOG_COLLECTION_NODE_BUNDLE_ENDPOINT =
  "/api/catalog/collectionNodes.bundle";

type StaticItemData = Pick<DadDbRef, "itemTypes" | "items">;
export type CatalogCollectionNodeSource = "bundle" | "firestore";

export type FetchCatalogCollectionNodesOptions = {
  category?: string;
  source?: CatalogCollectionNodeSource;
};

export type FetchHybridDadDbRefOptions = FetchCatalogCollectionNodesOptions;
export type FetchHybridDadDbRefByCategoryResult = {
  category: string;
  dadDbRef: DadDbRef;
};

export type CatalogManifest = {
  activeVersionId: string;
  schemaVersion: number;
  updatedAt?: unknown;
};

export type CatalogVersion = {
  label?: string;
  schemaVersion?: number;
  status?: string;
  sourcePath?: string;
  nodeCount?: number;
  publishedAt?: unknown;
  generatedAt?: unknown;
};

export type CatalogCollectionDoc = Omit<CollectionRef, "subcollections"> & {
  parentId: string | null;
  order: number;
  rootCategory: string;
};

type BuiltCollectionRef = CollectionRef & {
  subcollections: CollectionRef[];
};

export type CatalogCollectionWrite = {
  category?: string;
  collectionItems?: CollectionItemRef[];
  description?: string;
  name: string;
  parentId: string | null;
};

export type CatalogCollectionNodeMove = {
  category: string;
  collectionId: string;
  orderedSiblingIds: string[];
  parentId: string | null;
};

async function getCatalogFirestore() {
  const { firestore } = await import("../config/firebase");
  return firestore;
}

function getCatalogCollectionNodeCollectionRef(
  firestore: Awaited<ReturnType<typeof getCatalogFirestore>>,
  versionId: string,
) {
  return collection(
    firestore,
    CATALOG_COLLECTION,
    CATALOG_ID,
    CATALOG_VERSION_COLLECTION,
    versionId,
    CATALOG_NODE_COLLECTION,
  );
}

export function getCatalogCollectionNodesBundleName(
  versionId: string,
  category?: string,
): string {
  return category
    ? `catalog-${CATALOG_ID}-${versionId}-${category}-${CATALOG_NODE_COLLECTION}`
    : `catalog-${CATALOG_ID}-${versionId}-${CATALOG_NODE_COLLECTION}`;
}

export function getCatalogCollectionNodesBundleUrl(
  versionId: string,
  category?: string,
): string {
  const params = new URLSearchParams({
    versionId,
  });
  if (category) {
    params.set("category", category);
  }

  return `${CATALOG_COLLECTION_NODE_BUNDLE_ENDPOINT}?${params.toString()}`;
}

async function getCatalogCollectionNodeRef(collectionId: string) {
  const firestore = await getCatalogFirestore();
  const versionId = await resolveCatalogVersionId();

  return doc(
    firestore,
    CATALOG_COLLECTION,
    CATALOG_ID,
    CATALOG_VERSION_COLLECTION,
    versionId,
    CATALOG_NODE_COLLECTION,
    String(collectionId),
  );
}

function sortNodes<T extends { order: number; id: string }>(
  a: T,
  b: T,
): number {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  return a.id.localeCompare(b.id);
}

function toCollectionRef(node: CatalogCollectionDoc): BuiltCollectionRef {
  const { parentId: _parentId, order: _order, ...collection } = node;

  return {
    ...collection,
    subcollections: [],
  };
}

function toCatalogCollectionDocs(snapshot: {
  docs: Array<{ data: () => unknown; id: string }>;
}): CatalogCollectionDoc[] {
  return snapshot.docs
    .map((node) => ({
      ...(node.data() as Omit<CatalogCollectionDoc, "id">),
      id: node.id,
    }))
    .sort(sortNodes);
}

function warnIfCatalogVersionIsNotPublished(
  versionId: string,
  version: CatalogVersion,
) {
  if (version.status && version.status !== "published") {
    console.warn(
      `[Catalog] Reading catalog version "${versionId}" with status "${version.status}".`,
    );
  }
}

export function buildCollectionTree(
  nodes: CatalogCollectionDoc[],
): CollectionRef[] {
  const lookup = new Map<string, CatalogCollectionDoc>();

  for (const node of nodes) {
    if (lookup.has(node.id)) {
      throw new Error(`[Catalog] Duplicate collection node id: ${node.id}`);
    }

    if (!node.rootCategory) {
      throw new Error(
        `[Catalog] Collection node ${node.id} is missing rootCategory`,
      );
    }

    lookup.set(node.id, node);
  }

  const roots = nodes
    .filter((node) => node.parentId === null)
    .sort(sortNodes)
    .map(toCollectionRef);
  const rootLookup = new Map<string, BuiltCollectionRef>(
    roots.map((root) => [root.id, root]),
  );

  for (const node of nodes
    .filter((candidate) => candidate.parentId !== null)
    .sort(sortNodes)) {
    const parentId = node.parentId;
    if (parentId === null) {
      continue;
    }

    const parent = lookup.get(parentId);
    if (parent === undefined) {
      throw new Error(
        `[Catalog] Collection node ${node.id} references missing parent ${parentId}`,
      );
    }

    if (parent.parentId !== null) {
      throw new Error(
        `[Catalog] Collection node ${node.id} exceeds supported depth of 1`,
      );
    }

    const root = rootLookup.get(parentId);
    if (root === undefined) {
      throw new Error(
        `[Catalog] Collection node ${node.id} parent ${parentId} is not a root node`,
      );
    }

    root.subcollections.push(toCollectionRef(node));
  }

  for (const root of roots) {
    if (root.category === undefined) {
      throw new Error(
        `[Catalog] Root collection ${root.id} is missing category`,
      );
    }

    if (root.rootCategory !== root.category) {
      throw new Error(
        `[Catalog] Root collection ${root.id} category does not match rootCategory`,
      );
    }
  }

  return roots;
}

function getNodeCategory(node: CatalogCollectionDoc): string | undefined {
  return node.rootCategory;
}

function assertSameIds(
  actualIds: string[],
  expectedIds: string[],
  label: string,
) {
  if (actualIds.length !== expectedIds.length) {
    throw new Error(
      `[Catalog] ${label} must contain the same collection nodes.`,
    );
  }

  const actualSet = new Set(actualIds);
  const expectedSet = new Set(expectedIds);

  if (
    actualSet.size !== actualIds.length ||
    expectedSet.size !== expectedIds.length ||
    actualIds.some((id) => !expectedSet.has(id)) ||
    expectedIds.some((id) => !actualSet.has(id))
  ) {
    throw new Error(
      `[Catalog] ${label} must contain the same collection nodes.`,
    );
  }
}

export function reorderCatalogCollectionNodes(
  nodes: CatalogCollectionDoc[],
  move: CatalogCollectionNodeMove,
): CatalogCollectionDoc[] {
  const nodesById = new Map<string, CatalogCollectionDoc>(
    nodes.map((node) => [node.id, node]),
  );
  const target = nodesById.get(move.collectionId);

  if (!target) {
    throw new Error(`[Catalog] Missing collection node ${move.collectionId}.`);
  }

  const sourceCategory = getNodeCategory(target);
  if (sourceCategory !== move.category) {
    throw new Error(
      "[Catalog] Collection nodes cannot move across categories.",
    );
  }

  if (move.parentId === move.collectionId) {
    throw new Error("[Catalog] Collection node cannot be its own parent.");
  }

  if (move.parentId !== null) {
    const parent = nodesById.get(move.parentId);

    if (!parent) {
      throw new Error(
        `[Catalog] Collection node ${move.collectionId} references missing parent ${move.parentId}.`,
      );
    }

    if (parent.parentId !== null) {
      throw new Error(
        `[Catalog] Collection node ${move.collectionId} exceeds supported depth of 1.`,
      );
    }

    if (getNodeCategory(parent) !== move.category) {
      throw new Error(
        "[Catalog] Collection nodes cannot move across categories.",
      );
    }

    if ((parent.collectionItems ?? []).length > 0) {
      throw new Error(
        `[Catalog] Collection node ${move.parentId} contains collection items and cannot receive subcollections.`,
      );
    }

    if (nodes.some((node) => node.parentId === move.collectionId)) {
      throw new Error(
        `[Catalog] Collection node ${move.collectionId} has subcollections and cannot become a subcollection.`,
      );
    }
  }

  const expectedSiblingIds = nodes
    .filter((node) => {
      const nextParentId =
        node.id === move.collectionId ? move.parentId : node.parentId;

      if (nextParentId !== move.parentId) {
        return false;
      }

      if (move.parentId === null) {
        const nextCategory =
          node.id === move.collectionId ? move.category : node.rootCategory;

        return nextCategory === move.category;
      }

      return true;
    })
    .map((node) => node.id);

  assertSameIds(
    move.orderedSiblingIds,
    expectedSiblingIds,
    "Ordered sibling ids",
  );

  return nodes.map((node) => {
    const orderIndex = move.orderedSiblingIds.indexOf(node.id);

    if (node.id !== move.collectionId) {
      return orderIndex === -1
        ? node
        : {
            ...node,
            order: orderIndex + 1,
          };
    }

    const nextNode: CatalogCollectionDoc = {
      ...node,
      order: orderIndex + 1,
      parentId: move.parentId,
      rootCategory: move.category,
    };

    if (move.parentId === null) {
      nextNode.category = move.category;
    } else {
      delete nextNode.category;
    }

    return nextNode;
  });
}

export async function fetchCatalogManifest(): Promise<CatalogManifest> {
  const firestore = await getCatalogFirestore();
  const manifestRef = doc(firestore, CATALOG_COLLECTION, CATALOG_ID);
  const snapshot = await getDoc(manifestRef);

  if (!snapshot.exists()) {
    throw new Error(
      `[Catalog] Missing manifest document at ${CATALOG_COLLECTION}/${CATALOG_ID}`,
    );
  }

  return snapshot.data() as CatalogManifest;
}

export async function fetchCatalogVersion(
  versionId: string,
): Promise<CatalogVersion> {
  const firestore = await getCatalogFirestore();
  const versionRef = doc(
    firestore,
    CATALOG_COLLECTION,
    CATALOG_ID,
    CATALOG_VERSION_COLLECTION,
    versionId,
  );
  const snapshot = await getDoc(versionRef);

  if (!snapshot.exists()) {
    throw new Error(
      `[Catalog] Missing version document at ${CATALOG_COLLECTION}/${CATALOG_ID}/${CATALOG_VERSION_COLLECTION}/${versionId}`,
    );
  }

  return snapshot.data() as CatalogVersion;
}

export async function fetchCatalogCollectionNodesFromFirestore(
  versionId: string,
  category?: string,
): Promise<CatalogCollectionDoc[]> {
  const firestore = await getCatalogFirestore();
  const nodeCollectionRef = getCatalogCollectionNodeCollectionRef(
    firestore,
    versionId,
  );
  const nodeQuery = category
    ? firestoreQuery(nodeCollectionRef, where("rootCategory", "==", category))
    : nodeCollectionRef;
  const snapshot = await getDocs(nodeQuery);

  return toCatalogCollectionDocs(snapshot);
}

export async function fetchCatalogCollectionNodesFromBundle(
  versionId: string,
  category?: string,
): Promise<CatalogCollectionDoc[]> {
  const firestore = await getCatalogFirestore();
  const response = await fetch(
    getCatalogCollectionNodesBundleUrl(versionId, category),
  );

  if (!response.ok) {
    throw new Error(
      `[Catalog] Failed to load bundled collection nodes for version "${versionId}" (${response.status}).`,
    );
  }

  const bundleData = response.body ?? (await response.arrayBuffer());
  await loadBundle(firestore, bundleData);

  const bundleName = getCatalogCollectionNodesBundleName(versionId, category);
  const cachedQuery = await namedQuery(firestore, bundleName);

  if (!cachedQuery) {
    throw new Error(`[Catalog] Bundle did not contain query "${bundleName}".`);
  }

  const snapshot = await getDocsFromCache(cachedQuery);

  return toCatalogCollectionDocs(snapshot);
}

export async function fetchCatalogCollectionNodes(
  versionId: string,
  options: FetchCatalogCollectionNodesOptions = {},
): Promise<CatalogCollectionDoc[]> {
  if (options.source === "bundle") {
    try {
      return await fetchCatalogCollectionNodesFromBundle(
        versionId,
        options.category,
      );
    } catch (error) {
      console.warn(
        error instanceof Error
          ? `${error.message} Falling back to Firestore.`
          : "[Catalog] Failed to load bundled collection nodes. Falling back to Firestore.",
      );
    }
  }

  return fetchCatalogCollectionNodesFromFirestore(versionId, options.category);
}

export async function addCatalogCollectionNode(
  collectionNode: CatalogCollectionWrite,
): Promise<string> {
  if (!collectionNode.category) {
    throw new Error("[Catalog] New collection nodes require a category.");
  }

  const firestore = await getCatalogFirestore();
  const versionId = await resolveCatalogVersionId();
  const nodes = await fetchCatalogCollectionNodes(versionId, {
    category: collectionNode.category,
    source: "firestore",
  });
  const siblingOrders = nodes
    .filter((node) => node.parentId === collectionNode.parentId)
    .map((node) => node.order);
  const order = siblingOrders.length === 0 ? 1 : Math.max(...siblingOrders) + 1;
  const nodeCollectionRef = getCatalogCollectionNodeCollectionRef(
    firestore,
    versionId,
  );
  const collectionRef = doc(nodeCollectionRef);

  if (collectionNode.parentId !== null) {
    const parent = nodes.find((node) => node.id === collectionNode.parentId);

    if (!parent) {
      throw new Error(
        `[Catalog] Collection node references missing parent ${collectionNode.parentId}.`,
      );
    }

    if (parent.rootCategory !== collectionNode.category) {
      throw new Error(
        "[Catalog] Collection nodes cannot be added across categories.",
      );
    }
  }

  const writeData: Omit<CatalogCollectionDoc, "id"> = {
    collectionItems: collectionNode.collectionItems ?? [],
    name: collectionNode.name,
    order,
    parentId: collectionNode.parentId,
    rootCategory: collectionNode.category,
    ...(collectionNode.description
      ? { description: collectionNode.description }
      : {}),
    ...(collectionNode.parentId === null && collectionNode.category
      ? { category: collectionNode.category }
      : {}),
  };

  await setDoc(collectionRef, writeData);

  return collectionRef.id;
}

export async function updateCatalogCollectionNode(
  collectionId: string,
  collectionNode: Pick<CatalogCollectionWrite, "description" | "name">,
): Promise<void> {
  const collectionRef = await getCatalogCollectionNodeRef(collectionId);
  const snapshot = await getDoc(collectionRef);

  if (!snapshot.exists()) {
    throw new Error(`[Catalog] Missing collection node ${collectionId}.`);
  }

  await updateDoc(collectionRef, {
    description: collectionNode.description?.trim()
      ? collectionNode.description.trim()
      : deleteField(),
    name: collectionNode.name,
  });
}

export async function updateCatalogCollectionNodeOrder(
  move: CatalogCollectionNodeMove,
): Promise<void> {
  const firestore = await getCatalogFirestore();
  const versionId = await resolveCatalogVersionId();
  const nodes = await fetchCatalogCollectionNodes(versionId, {
    category: move.category,
    source: "firestore",
  });
  const previousNodesById = new Map<string, CatalogCollectionDoc>(
    nodes.map((node) => [node.id, node]),
  );
  const nextNodes = reorderCatalogCollectionNodes(nodes, move);
  const batch = writeBatch(firestore);
  let hasUpdates = false;

  for (const nextNode of nextNodes) {
    const previousNode = previousNodesById.get(nextNode.id);
    if (!previousNode) {
      continue;
    }

    const updateData: {
      category?: string | ReturnType<typeof deleteField>;
      order?: number;
      parentId?: string | null;
      rootCategory?: string;
    } = {};
    if (previousNode.order !== nextNode.order) {
      updateData.order = nextNode.order;
    }

    if (previousNode.parentId !== nextNode.parentId) {
      updateData.parentId = nextNode.parentId;
    }

    if (previousNode.category !== nextNode.category) {
      updateData.category = nextNode.category ?? deleteField();
    }

    if (previousNode.rootCategory !== nextNode.rootCategory) {
      updateData.rootCategory = nextNode.rootCategory;
    }

    if (Object.keys(updateData).length === 0) {
      continue;
    }

    const collectionRef = doc(
      firestore,
      CATALOG_COLLECTION,
      CATALOG_ID,
      CATALOG_VERSION_COLLECTION,
      versionId,
      CATALOG_NODE_COLLECTION,
      String(nextNode.id),
    );
    batch.update(collectionRef, updateData);
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return;
  }

  await batch.commit();
}

export async function deleteCatalogCollectionNode(
  collectionId: string,
  category?: string,
): Promise<void> {
  const firestore = await getCatalogFirestore();
  const versionId = await resolveCatalogVersionId();
  const nodes = await fetchCatalogCollectionNodes(versionId, {
    category,
    source: "firestore",
  });
  const target = nodes.find((node) => node.id === collectionId);

  if (!target) {
    throw new Error(`[Catalog] Missing collection node ${collectionId}.`);
  }

  const deleteIds = new Set<string>([collectionId]);
  if (target.parentId === null) {
    for (const node of nodes) {
      if (node.parentId === collectionId) {
        deleteIds.add(node.id);
      }
    }
  }

  const batch = writeBatch(firestore);
  for (const deleteId of deleteIds) {
    const collectionRef = doc(
      firestore,
      CATALOG_COLLECTION,
      CATALOG_ID,
      CATALOG_VERSION_COLLECTION,
      versionId,
      CATALOG_NODE_COLLECTION,
      String(deleteId),
    );
    batch.delete(collectionRef);
  }

  await batch.commit();
}

export async function addCatalogCollectionItem(
  collectionId: string,
  collectionItem: CollectionItemRef,
): Promise<void> {
  const collectionRef = await getCatalogCollectionNodeRef(collectionId);
  const snapshot = await getDoc(collectionRef);

  if (!snapshot.exists()) {
    throw new Error(`[Catalog] Missing collection node ${collectionId}.`);
  }

  const data = snapshot.data() as CatalogCollectionDoc;
  const collectionItems = data.collectionItems ?? [];

  await updateDoc(collectionRef, {
    collectionItems: [...collectionItems, collectionItem],
  });
}

export async function updateCatalogCollectionItem(
  collectionId: string,
  originalCollectionItemId: number,
  collectionItem: CollectionItemRef,
): Promise<void> {
  const collectionRef = await getCatalogCollectionNodeRef(collectionId);
  const snapshot = await getDoc(collectionRef);

  if (!snapshot.exists()) {
    throw new Error(`[Catalog] Missing collection node ${collectionId}.`);
  }

  const data = snapshot.data() as CatalogCollectionDoc;
  const collectionItems = data.collectionItems ?? [];
  const collectionItemsWithTransientIds = assignTransientCollectionItemIds(
    collectionId,
    collectionItems,
  );
  const itemIndex = collectionItemsWithTransientIds.findIndex(
    (item) => item.id === originalCollectionItemId,
  );

  if (itemIndex === -1) {
    throw new Error(
      `[Catalog] Collection item ${originalCollectionItemId} was not found in collection ${collectionId}.`,
    );
  }

  await updateDoc(collectionRef, {
    collectionItems: collectionItems.map((item, index) =>
      index === itemIndex ? collectionItem : item,
    ),
  });
}

export async function deleteCatalogCollectionItem(
  collectionId: string,
  collectionItemId: number,
): Promise<void> {
  const collectionRef = await getCatalogCollectionNodeRef(collectionId);
  const snapshot = await getDoc(collectionRef);

  if (!snapshot.exists()) {
    throw new Error(`[Catalog] Missing collection node ${collectionId}.`);
  }

  const data = snapshot.data() as CatalogCollectionDoc;
  const collectionItems = data.collectionItems ?? [];
  const collectionItemsWithTransientIds = assignTransientCollectionItemIds(
    collectionId,
    collectionItems,
  );
  const itemIndex = collectionItemsWithTransientIds.findIndex(
    (item) => item.id === collectionItemId,
  );

  if (itemIndex === -1) {
    throw new Error(
      `[Catalog] Collection item ${collectionItemId} was not found in collection ${collectionId}.`,
    );
  }

  await updateDoc(collectionRef, {
    collectionItems: collectionItems.filter((_, index) => index !== itemIndex),
  });
}

export function reorderCatalogCollectionItems(
  collectionId: string,
  collectionItems: CollectionItemRef[],
  orderedCollectionItemIds: number[],
): CollectionItemRef[] {
  if (collectionItems.length !== orderedCollectionItemIds.length) {
    throw new Error(
      "[Catalog] Reordered collection item ids must match the existing collection item count.",
    );
  }

  const collectionItemsWithTransientIds = assignTransientCollectionItemIds(
    collectionId,
    collectionItems,
  );
  const collectionItemsById = collectionItemsWithTransientIds.reduce(
    (lookup, collectionItem, itemIndex) => {
      const items = lookup.get(collectionItem.id) ?? [];
      items.push(collectionItems[itemIndex]);
      lookup.set(collectionItem.id, items);

      return lookup;
    },
    new Map<number, CollectionItemRef[]>(),
  );

  const reorderedCollectionItems = orderedCollectionItemIds.map(
    (collectionItemId) => {
      const items = collectionItemsById.get(collectionItemId);
      const collectionItem = items?.shift();

      if (collectionItem === undefined) {
        throw new Error(
          `[Catalog] Collection item ${collectionItemId} was not found in the current collection order.`,
        );
      }

      return collectionItem;
    },
  );

  const hasUnorderedItems = Array.from(collectionItemsById.values()).some(
    (items) => items.length > 0,
  );

  if (hasUnorderedItems) {
    throw new Error(
      "[Catalog] Reordered collection item ids omitted existing collection items.",
    );
  }

  return reorderedCollectionItems;
}

export async function updateCatalogCollectionItemOrder(
  collectionId: string,
  orderedCollectionItemIds: number[],
): Promise<void> {
  const collectionRef = await getCatalogCollectionNodeRef(collectionId);
  const snapshot = await getDoc(collectionRef);

  if (!snapshot.exists()) {
    throw new Error(`[Catalog] Missing collection node ${collectionId}.`);
  }

  const data = snapshot.data() as CatalogCollectionDoc;
  const collectionItems = data.collectionItems ?? [];
  const nextCollectionItems = reorderCatalogCollectionItems(
    collectionId,
    collectionItems,
    orderedCollectionItemIds,
  );

  await updateDoc(collectionRef, {
    collectionItems: nextCollectionItems,
  });
}

export async function resolveCatalogVersionId(): Promise<string> {
  try {
    const manifest = await fetchCatalogManifest();
    if (manifest.activeVersionId?.length) {
      return manifest.activeVersionId;
    }
  } catch (error) {
    console.warn(
      `[Catalog] Manifest unavailable, falling back to version "${DEFAULT_CATALOG_VERSION_ID}".`,
      error,
    );
  }

  return DEFAULT_CATALOG_VERSION_ID;
}

export async function fetchStaticDadDbRef(): Promise<DadDbRef> {
  const response = await fetch("/d4dad.json");
  if (!response.ok) {
    throw new Error(
      `[Catalog] Failed to load /d4dad.json (${response.status})`,
    );
  }

  return (await response.json()) as DadDbRef;
}

export async function fetchStaticItemData(): Promise<StaticItemData> {
  const db = await fetchStaticDadDbRef();

  return {
    itemTypes: db.itemTypes,
    items: db.items,
  };
}

export async function fetchHybridDadDbRefsByCategory(
  categories: string[],
  options: Omit<FetchHybridDadDbRefOptions, "category"> = {},
): Promise<FetchHybridDadDbRefByCategoryResult[]> {
  const uniqueCategories = Array.from(new Set(categories));
  const staticData = await fetchStaticItemData();
  const versionId = await resolveCatalogVersionId();
  const version = await fetchCatalogVersion(versionId);

  warnIfCatalogVersionIsNotPublished(versionId, version);

  return Promise.all(
    uniqueCategories.map(async (category) => {
      const nodes = await fetchCatalogCollectionNodes(versionId, {
        ...options,
        category,
      });

      return {
        category,
        dadDbRef: {
          itemTypes: staticData.itemTypes,
          items: staticData.items,
          collections: buildCollectionTree(nodes),
        },
      };
    }),
  );
}

export async function fetchHybridDadDbRef(
  options: FetchHybridDadDbRefOptions = {},
): Promise<DadDbRef> {
  const staticData = await fetchStaticItemData();
  const versionId = await resolveCatalogVersionId();
  const version = await fetchCatalogVersion(versionId);
  const nodes = await fetchCatalogCollectionNodes(versionId, options);

  if (nodes.length === 0 && !options.category) {
    throw new Error(
      `[Catalog] Version "${versionId}" contains no collection nodes.`,
    );
  }

  warnIfCatalogVersionIsNotPublished(versionId, version);

  const collections = buildCollectionTree(nodes);

  return {
    itemTypes: staticData.itemTypes,
    items: staticData.items,
    collections,
  };
}
