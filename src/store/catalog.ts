import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { CollectionItemRef, CollectionRef, DadDbRef } from "../data";

const CATALOG_COLLECTION = "catalogs";
const CATALOG_ID = "d4";
const CATALOG_VERSION_COLLECTION = "versions";
const CATALOG_NODE_COLLECTION = "collectionNodes";
const DEFAULT_CATALOG_VERSION_ID = "v1";

type StaticItemData = Pick<DadDbRef, "itemTypes" | "items">;

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
  parentId: number | null;
  order: number;
};

type BuiltCollectionRef = CollectionRef & {
  subcollections: CollectionRef[];
};

export type CatalogCollectionWrite = {
  category?: string;
  collectionItems?: CollectionItemRef[];
  description?: string;
  id: number;
  name: string;
  parentId: number | null;
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

async function getCatalogCollectionNodeRef(collectionId: number) {
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

function sortNodes<T extends { order: number; id: number }>(
  a: T,
  b: T,
): number {
  if (a.order !== b.order) {
    return a.order - b.order;
  }

  return a.id - b.id;
}

function toCollectionRef(node: CatalogCollectionDoc): BuiltCollectionRef {
  const { parentId: _parentId, order: _order, ...collection } = node;

  return {
    ...collection,
    subcollections: [],
  };
}

export function buildCollectionTree(
  nodes: CatalogCollectionDoc[],
): CollectionRef[] {
  const lookup = new Map<number, CatalogCollectionDoc>();

  for (const node of nodes) {
    if (lookup.has(node.id)) {
      throw new Error(`[Catalog] Duplicate collection node id: ${node.id}`);
    }

    lookup.set(node.id, node);
  }

  const roots = nodes
    .filter((node) => node.parentId === null)
    .sort(sortNodes)
    .map(toCollectionRef);
  const rootLookup = new Map<number, BuiltCollectionRef>(
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
  }

  return roots;
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

export async function fetchCatalogCollectionNodes(
  versionId: string,
): Promise<CatalogCollectionDoc[]> {
  const firestore = await getCatalogFirestore();
  const nodeCollectionRef = getCatalogCollectionNodeCollectionRef(
    firestore,
    versionId,
  );
  const snapshot = await getDocs(nodeCollectionRef);

  return snapshot.docs
    .map((node) => node.data() as CatalogCollectionDoc)
    .sort(sortNodes);
}

export async function addCatalogCollectionNode(
  collectionNode: CatalogCollectionWrite,
): Promise<void> {
  const firestore = await getCatalogFirestore();
  const versionId = await resolveCatalogVersionId();
  const nodes = await fetchCatalogCollectionNodes(versionId);
  const siblingOrders = nodes
    .filter((node) => node.parentId === collectionNode.parentId)
    .map((node) => node.order);
  const order = siblingOrders.length === 0 ? 1 : Math.max(...siblingOrders) + 1;
  const collectionRef = doc(
    firestore,
    CATALOG_COLLECTION,
    CATALOG_ID,
    CATALOG_VERSION_COLLECTION,
    versionId,
    CATALOG_NODE_COLLECTION,
    String(collectionNode.id),
  );
  const existingCollection = await getDoc(collectionRef);

  if (existingCollection.exists()) {
    throw new Error(
      `[Catalog] Collection node ${collectionNode.id} already exists.`,
    );
  }

  const writeData: CatalogCollectionDoc = {
    collectionItems: collectionNode.collectionItems ?? [],
    id: collectionNode.id,
    name: collectionNode.name,
    order,
    parentId: collectionNode.parentId,
    ...(collectionNode.description
      ? { description: collectionNode.description }
      : {}),
    ...(collectionNode.parentId === null && collectionNode.category
      ? { category: collectionNode.category }
      : {}),
  };

  await setDoc(collectionRef, writeData);
}

export async function updateCatalogCollectionNode(
  collectionId: number,
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

export async function deleteCatalogCollectionNode(
  collectionId: number,
): Promise<void> {
  const firestore = await getCatalogFirestore();
  const versionId = await resolveCatalogVersionId();
  const nodes = await fetchCatalogCollectionNodes(versionId);
  const target = nodes.find((node) => node.id === collectionId);

  if (!target) {
    throw new Error(`[Catalog] Missing collection node ${collectionId}.`);
  }

  const deleteIds = new Set<number>([collectionId]);
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
  collectionId: number,
  collectionItem: CollectionItemRef,
): Promise<void> {
  const collectionRef = await getCatalogCollectionNodeRef(collectionId);

  await updateDoc(collectionRef, {
    collectionItems: arrayUnion(collectionItem),
  });
}

export async function updateCatalogCollectionItem(
  collectionId: number,
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
  const itemIndex = collectionItems.findIndex(
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
  collectionId: number,
  collectionItemId: number,
): Promise<void> {
  const collectionRef = await getCatalogCollectionNodeRef(collectionId);
  const snapshot = await getDoc(collectionRef);

  if (!snapshot.exists()) {
    throw new Error(`[Catalog] Missing collection node ${collectionId}.`);
  }

  const data = snapshot.data() as CatalogCollectionDoc;
  const collectionItems = data.collectionItems ?? [];
  const nextCollectionItems = collectionItems.filter(
    (item) => item.id !== collectionItemId,
  );

  if (nextCollectionItems.length === collectionItems.length) {
    throw new Error(
      `[Catalog] Collection item ${collectionItemId} was not found in collection ${collectionId}.`,
    );
  }

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

export async function fetchHybridDadDbRef(): Promise<DadDbRef> {
  const staticData = await fetchStaticItemData();
  const versionId = await resolveCatalogVersionId();
  const version = await fetchCatalogVersion(versionId);
  const nodes = await fetchCatalogCollectionNodes(versionId);

  if (nodes.length === 0) {
    throw new Error(
      `[Catalog] Version "${versionId}" contains no collection nodes.`,
    );
  }

  if (version.status && version.status !== "published") {
    console.warn(
      `[Catalog] Reading catalog version "${versionId}" with status "${version.status}".`,
    );
  }

  const collections = buildCollectionTree(nodes);

  return {
    itemTypes: staticData.itemTypes,
    items: staticData.items,
    collections,
  };
}
