const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp();

const CATALOG_COLLECTION = "catalogs";
const CATALOG_ID = "d4";
const CATALOG_VERSION_COLLECTION = "versions";
const CATALOG_NODE_COLLECTION = "collectionNodes";
const DEFAULT_CATALOG_VERSION_ID = "v1";
const CACHE_CONTROL = "public, max-age=300, s-maxage=300";

function getCatalogCollectionNodesBundleName(versionId) {
  return `catalog-${CATALOG_ID}-${versionId}-${CATALOG_NODE_COLLECTION}`;
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

exports.catalogCollectionNodesBundle = functions.https.onRequest(
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
      const query = firestore.collection(
        `${CATALOG_COLLECTION}/${CATALOG_ID}/${CATALOG_VERSION_COLLECTION}/${versionId}/${CATALOG_NODE_COLLECTION}`,
      );
      const snapshot = await query.get();
      const bundleName = getCatalogCollectionNodesBundleName(versionId);
      bundleBuffer = firestore
        .bundle(`${bundleName}-bundle`)
        .add(bundleName, snapshot)
        .build();
    } catch (error) {
      functions.logger.error(
        "Failed to build catalog collection node bundle.",
        {
          error,
          versionId,
        },
      );
      response.status(500).send("Failed to build catalog bundle.");
      return;
    }

    response.set("Cache-Control", CACHE_CONTROL);
    response.set("Content-Type", "application/octet-stream");

    if (request.method === "HEAD") {
      response.status(200).end();
      return;
    }

    response.status(200).end(bundleBuffer);
  },
);
