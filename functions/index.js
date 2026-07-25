const admin = require("firebase-admin");
const functions = require("firebase-functions");
const { setGlobalOptions } = require("firebase-functions/v2");
const { parseImportedItemPage } = require("./item-import");

setGlobalOptions({ region: "us-central1" });

admin.initializeApp();

const CATALOG_COLLECTION = "catalogs";
const CATALOG_ID = "d4";
const CATALOG_VERSION_COLLECTION = "versions";
const CATALOG_NODE_COLLECTION = "collectionNodes";
const CATALOG_ITEM_COLLECTION = "items";
const DEFAULT_CATALOG_VERSION_ID = "v1";
const CATALOG_NODE_CACHE_CONTROL = "public, max-age=300, s-maxage=300";
const CATALOG_ITEM_CACHE_CONTROL = "public, max-age=3600, s-maxage=3600";
const ICON_CACHE_CONTROL = "public, max-age=31536000, immutable";
const CATALOG_CATEGORIES = new Set([
  "General",
  "Shop",
  "Promotional",
  "Season",
  "Challenge",
]);
const MAX_ICON_UPLOAD_BYTES = 2 * 1024 * 1024;
const ALLOWED_ICON_CONTENT_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ITEM_IMPORT_HOSTNAMES = new Set(["wowhead.com", "www.wowhead.com"]);

function getCatalogCollectionNodesBundleName(versionId, category) {
  return category
    ? `catalog-${CATALOG_ID}-${versionId}-${category}-${CATALOG_NODE_COLLECTION}`
    : `catalog-${CATALOG_ID}-${versionId}-${CATALOG_NODE_COLLECTION}`;
}

function getCatalogItemsBundleName(versionId) {
  return `catalog-${CATALOG_ID}-${versionId}-${CATALOG_ITEM_COLLECTION}`;
}

function getRequestedVersionId(request) {
  const versionId = Array.isArray(request.query.versionId)
    ? request.query.versionId[0]
    : request.query.versionId;

  if (versionId === undefined || versionId === "") {
    return DEFAULT_CATALOG_VERSION_ID;
  }

  if (typeof versionId !== "string" || !/^[A-Za-z0-9_-]+$/.test(versionId)) {
    throw new Error("Invalid catalog version id.");
  }

  return versionId;
}

function getRequestedCategory(request) {
  const category = Array.isArray(request.query.category)
    ? request.query.category[0]
    : request.query.category;

  if (category === undefined || category === "") {
    return undefined;
  }

  if (typeof category !== "string" || !CATALOG_CATEGORIES.has(category)) {
    throw new Error("Invalid catalog category.");
  }

  return category;
}

function hasEditorRole(decodedToken) {
  return (
    decodedToken.role === "EDITOR" ||
    decodedToken.editor === true ||
    (Array.isArray(decodedToken.roles) && decodedToken.roles.includes("EDITOR"))
  );
}

async function requireEditor(request) {
  const authorization = request.get("Authorization") ?? "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);

  if (!tokenMatch) {
    throw new Error("Missing authorization token.");
  }

  const decodedToken = await admin.auth().verifyIdToken(tokenMatch[1]);

  if (!hasEditorRole(decodedToken)) {
    throw new Error("Editor role required.");
  }

  return decodedToken;
}

function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.rawBody !== "undefined") {
    try {
      return JSON.parse(request.rawBody.toString("utf8"));
    } catch {
      throw new Error("Invalid JSON body.");
    }
  }

  throw new Error("Missing JSON body.");
}

function assertPostJson(request, response) {
  if (request.method !== "POST") {
    response.set("Allow", "POST");
    response.status(405).send("Method Not Allowed");
    return false;
  }

  return true;
}

function createCustomIconId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

function getDataUrlParts(dataUrl) {
  const match = /^data:([^;]+);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(dataUrl);

  if (!match) {
    throw new Error("Icon data must be a base64 data URL.");
  }

  return {
    contentType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2].replace(/\s/g, ""), "base64"),
  };
}

async function saveIconBuffer(buffer, contentType) {
  if (!ALLOWED_ICON_CONTENT_TYPES.has(contentType)) {
    throw new Error("Unsupported icon content type.");
  }

  if (buffer.length === 0 || buffer.length > MAX_ICON_UPLOAD_BYTES) {
    throw new Error("Icon must be between 1 byte and 2 MB.");
  }

  const iconId = createCustomIconId();
  const path = `icons/${iconId}.webp`;

  await admin.storage().bucket().file(path).save(buffer, {
    metadata: {
      cacheControl: ICON_CACHE_CONTROL,
      contentType,
    },
    resumable: false,
  });

  return {
    iconId,
    path,
  };
}

function getImportUrl(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("Missing import URL.");
  }

  let url;

  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Invalid import URL.");
  }

  if (url.protocol !== "https:" || !ITEM_IMPORT_HOSTNAMES.has(url.hostname)) {
    throw new Error("URL must be a supported HTTPS item URL.");
  }

  if (!url.pathname.startsWith("/diablo-4/item/")) {
    throw new Error("URL must point to a Diablo IV item.");
  }

  return url;
}

async function fetchImageDataUrl(url, baseUrl) {
  if (!url) {
    return undefined;
  }

  let targetUrl;

  try {
    targetUrl = new URL(url, baseUrl).toString();
  } catch {
    return undefined;
  }

  const response = await fetch(targetUrl);

  if (!response.ok) {
    return undefined;
  }

  const contentType = response.headers.get("content-type")?.split(";")[0];
  if (!contentType || !ALLOWED_ICON_CONTENT_TYPES.has(contentType)) {
    return undefined;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_ICON_UPLOAD_BYTES) {
    return undefined;
  }

  return {
    contentType,
    dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
  };
}

exports.catalogCollectionNodesBundle = functions.https.onRequest(
  async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.set("Allow", "GET, HEAD");
      response.status(405).send("Method Not Allowed");
      return;
    }

    let category;
    let versionId;

    try {
      versionId = getRequestedVersionId(request);
      category = getRequestedCategory(request);
    } catch (error) {
      response.status(400).send(error.message);
      return;
    }

    let bundleBuffer;

    try {
      const firestore = admin.firestore();
      let query = firestore.collection(
        `${CATALOG_COLLECTION}/${CATALOG_ID}/${CATALOG_VERSION_COLLECTION}/${versionId}/${CATALOG_NODE_COLLECTION}`,
      );
      if (category) {
        query = query.where("rootCategory", "==", category);
      }

      const snapshot = await query.get();
      const bundleName = getCatalogCollectionNodesBundleName(
        versionId,
        category,
      );
      bundleBuffer = firestore
        .bundle(`${bundleName}-bundle`)
        .add(bundleName, snapshot)
        .build();
    } catch (error) {
      functions.logger.error(
        "Failed to build catalog collection node bundle.",
        {
          category,
          error,
          versionId,
        },
      );
      response.status(500).send("Failed to build catalog bundle.");
      return;
    }

    response.set("Cache-Control", CATALOG_NODE_CACHE_CONTROL);
    response.set("Content-Type", "application/octet-stream");

    if (request.method === "HEAD") {
      response.status(200).end();
      return;
    }

    response.status(200).end(bundleBuffer);
  },
);

exports.catalogItemsBundle = functions.https.onRequest(
  async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.set("Allow", "GET, HEAD");
      response.status(405).send("Method Not Allowed");
      return;
    }

    let versionId;

    try {
      versionId = getRequestedVersionId(request);
    } catch (error) {
      response.status(400).send(error.message);
      return;
    }

    let bundleBuffer;

    try {
      const firestore = admin.firestore();
      const snapshot = await firestore
        .collection(
          `${CATALOG_COLLECTION}/${CATALOG_ID}/${CATALOG_VERSION_COLLECTION}/${versionId}/${CATALOG_ITEM_COLLECTION}`,
        )
        .get();
      const bundleName = getCatalogItemsBundleName(versionId);
      bundleBuffer = firestore
        .bundle(`${bundleName}-bundle`)
        .add(bundleName, snapshot)
        .build();
    } catch (error) {
      functions.logger.error("Failed to build catalog item bundle.", {
        error,
        versionId,
      });
      response.status(500).send("Failed to build catalog item bundle.");
      return;
    }

    response.set("Cache-Control", CATALOG_ITEM_CACHE_CONTROL);
    response.set("Content-Type", "application/octet-stream");

    if (request.method === "HEAD") {
      response.status(200).end();
      return;
    }

    response.status(200).end(bundleBuffer);
  },
);

exports.catalogItemIconUpload = functions.https.onRequest(
  async (request, response) => {
    if (!assertPostJson(request, response)) {
      return;
    }

    try {
      await requireEditor(request);
      const body = readJsonBody(request);
      const { buffer, contentType } = getDataUrlParts(body.dataUrl);
      const result = await saveIconBuffer(buffer, contentType);

      response.status(200).json(result);
    } catch (error) {
      functions.logger.warn("Failed to upload catalog item icon.", { error });
      response.status(400).json({
        error: error instanceof Error ? error.message : "Icon upload failed.",
      });
    }
  },
);

exports.databaseItemImport = functions.https.onRequest(
  async (request, response) => {
    if (!assertPostJson(request, response)) {
      return;
    }

    try {
      await requireEditor(request);
      const body = readJsonBody(request);
      const url = getImportUrl(body.url);
      const importResponse = await fetch(url, {
        headers: {
          "User-Agent": "d4log-catalog-editor/1.0",
        },
      });

      if (!importResponse.ok) {
        throw new Error(`Item URL request failed (${importResponse.status}).`);
      }

      const html = await importResponse.text();
      const draft = parseImportedItemPage(html, url);
      const icon = await fetchImageDataUrl(draft.iconUrl, url);

      response.status(200).json({
        icon,
        item: draft.item,
        itemTypeName: draft.itemTypeName,
      });
    } catch (error) {
      functions.logger.warn("Failed to import database item from URL.", {
        error,
      });
      response.status(400).json({
        error: error instanceof Error ? error.message : "Item import failed.",
      });
    }
  },
);
