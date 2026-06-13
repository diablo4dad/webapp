#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const DEFAULT_DOCUMENTS = path.join(
  "tmp",
  "catalog-seed",
  new Date().toISOString().slice(0, 10),
  "firestore-documents.json",
);
const DEFAULT_DATABASE_ID = "(default)";
const DEFAULT_BATCH_SIZE = 200;
const FIRESTORE_AUTO_ID_PATTERN = /^[A-Za-z0-9]{20}$/;
const OAUTH_SCOPE = "https://www.googleapis.com/auth/datastore";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const MASTER_GROUP_CATEGORIES = new Set([
  "General",
  "Shop",
  "Promotional",
  "Season",
  "Challenge",
]);

function parseArgs(argv) {
  const options = {
    documents: DEFAULT_DOCUMENTS,
    serviceAccount: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: undefined,
    databaseId: DEFAULT_DATABASE_ID,
    batchSize: DEFAULT_BATCH_SIZE,
    activate: true,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--documents":
        options.documents = next;
        i += 1;
        break;
      case "--service-account":
        options.serviceAccount = next;
        i += 1;
        break;
      case "--project-id":
        options.projectId = next;
        i += 1;
        break;
      case "--database-id":
        options.databaseId = next;
        i += 1;
        break;
      case "--batch-size":
        options.batchSize = Number(next);
        i += 1;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--no-activate":
        options.activate = false;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown argument: ${arg}`);
        }
        break;
    }
  }

  if (
    !Number.isInteger(options.batchSize) ||
    options.batchSize < 1 ||
    options.batchSize > 500
  ) {
    throw new Error(
      `Invalid --batch-size: ${options.batchSize}. Expected 1-500.`,
    );
  }

  if (!options.documents) {
    throw new Error("Missing --documents");
  }

  if (!options.dryRun && !options.serviceAccount) {
    throw new Error(
      "Missing --service-account. You can also set GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/upload-catalog-seed.cjs [options]

Options:
  --documents <path>         Path to firestore-documents.json
  --service-account <path>   Service account JSON file
  --project-id <id>          Override GCP project id
  --database-id <id>         Firestore database id (default: (default))
  --batch-size <1-500>       Commit batch size (default: 200)
  --no-activate              Upload version documents but skip manifest activation
  --dry-run                  Validate and summarize without network calls
  --help                     Show this message
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveFile(filePath, label) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`${label} not found: ${absolute}`);
  }

  return absolute;
}

function validateDocumentEntry(entry, index) {
  if (!entry || typeof entry !== "object") {
    throw new Error(`Document ${index} is not an object`);
  }

  if (typeof entry.path !== "string" || entry.path.length === 0) {
    throw new Error(`Document ${index} is missing a valid path`);
  }

  if (
    !entry.data ||
    typeof entry.data !== "object" ||
    Array.isArray(entry.data)
  ) {
    throw new Error(`Document ${index} is missing a valid data object`);
  }

  if (
    isCollectionNodeDocument(entry.path) &&
    !FIRESTORE_AUTO_ID_PATTERN.test(getDocumentId(entry.path))
  ) {
    throw new Error(
      `Document ${index} (${entry.path}) must use a Firestore-compatible auto id`,
    );
  }

  if (isCollectionNodeDocument(entry.path) && entry.data.id !== undefined) {
    throw new Error(
      `Document ${index} (${entry.path}) must not include legacy id data`,
    );
  }

  if (
    isCollectionNodeDocument(entry.path) &&
    entry.data.documentId !== undefined
  ) {
    throw new Error(
      `Document ${index} (${entry.path}) must not include documentId data`,
    );
  }

  if (isCollectionNodeDocument(entry.path)) {
    validateCollectionItems(entry, index);
  }

  if (
    isCollectionNodeDocument(entry.path) &&
    entry.data.parentId !== null &&
    (typeof entry.data.parentId !== "string" ||
      !FIRESTORE_AUTO_ID_PATTERN.test(entry.data.parentId))
  ) {
    throw new Error(
      `Document ${index} (${entry.path}) has invalid parentId "${entry.data.parentId}"`,
    );
  }

  if (
    isCollectionNodeDocument(entry.path) &&
    (typeof entry.data.rootCategory !== "string" ||
      entry.data.rootCategory.length === 0)
  ) {
    throw new Error(
      `Document ${index} (${entry.path}) is missing a valid rootCategory`,
    );
  }

  if (
    isCollectionNodeDocument(entry.path) &&
    !MASTER_GROUP_CATEGORIES.has(entry.data.rootCategory)
  ) {
    throw new Error(
      `Document ${index} (${entry.path}) has unsupported rootCategory "${entry.data.rootCategory}"`,
    );
  }
}

function validateCollectionItems(entry, index) {
  if (!Array.isArray(entry.data.collectionItems)) {
    throw new Error(
      `Document ${index} (${entry.path}) is missing a valid collectionItems array`,
    );
  }

  entry.data.collectionItems.forEach((collectionItem, itemIndex) => {
    if (
      !collectionItem ||
      typeof collectionItem !== "object" ||
      Array.isArray(collectionItem)
    ) {
      throw new Error(
        `Document ${index} (${entry.path}) collectionItems[${itemIndex}] is not an object`,
      );
    }

    if (collectionItem.id !== undefined) {
      throw new Error(
        `Document ${index} (${entry.path}) collectionItems[${itemIndex}] must not include legacy id data`,
      );
    }

    if (collectionItem.name !== undefined) {
      throw new Error(
        `Document ${index} (${entry.path}) collectionItems[${itemIndex}] must not include debug name data`,
      );
    }
  });
}

function loadDocuments(documentsPath) {
  const absolutePath = resolveFile(documentsPath, "Documents file");
  const documents = readJson(absolutePath);

  if (!Array.isArray(documents)) {
    throw new Error("Documents file must contain an array");
  }

  documents.forEach(validateDocumentEntry);

  return {
    path: absolutePath,
    documents,
  };
}

function loadServiceAccount(serviceAccountPath) {
  const absolutePath = resolveFile(serviceAccountPath, "Service account file");
  const serviceAccount = readJson(absolutePath);

  const requiredFields = ["project_id", "client_email", "private_key"];
  for (const field of requiredFields) {
    if (
      typeof serviceAccount[field] !== "string" ||
      serviceAccount[field].length === 0
    ) {
      throw new Error(`Service account is missing required field: ${field}`);
    }
  }

  return {
    path: absolutePath,
    serviceAccount,
  };
}

function isManifestDocument(documentPath) {
  return /^catalogs\/[^/]+$/.test(documentPath);
}

function isCollectionNodeDocument(documentPath) {
  return /\/collectionNodes\/[^/]+$/.test(documentPath);
}

function getDocumentId(documentPath) {
  const segments = documentPath.split("/");

  return segments[segments.length - 1] ?? "";
}

function reorderDocumentsForUpload(documents, activate) {
  const manifestDocuments = documents.filter((doc) =>
    isManifestDocument(doc.path),
  );
  const otherDocuments = documents.filter(
    (doc) => !isManifestDocument(doc.path),
  );

  if (manifestDocuments.length > 1) {
    throw new Error(
      `Expected at most one catalog manifest document, found ${manifestDocuments.length}`,
    );
  }

  if (!activate) {
    return otherDocuments;
  }

  if (manifestDocuments.length === 0) {
    throw new Error(
      "Activation requested, but no catalog manifest document was found",
    );
  }

  return otherDocuments.concat(manifestDocuments);
}

function chunkArray(values, size) {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }

  return chunks;
}

function base64UrlEncode(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);

  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createJwtAssertion(serviceAccount) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    }),
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: OAUTH_SCOPE,
      aud: OAUTH_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = base64UrlEncode(signer.sign(serviceAccount.private_key));

  return `${unsignedToken}.${signature}`;
}

function httpRequest(url, options = {}) {
  const target = new URL(url);
  const requestOptions = {
    method: options.method ?? "GET",
    hostname: target.hostname,
    path: `${target.pathname}${target.search}`,
    headers: options.headers ?? {},
  };

  return new Promise((resolve, reject) => {
    const request = https.request(requestOptions, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode ?? 0,
          body,
        });
      });
    });

    request.on("error", reject);

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

function parseJsonResponse(body, fallbackLabel) {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`${fallbackLabel}: ${body.slice(0, 500)}`);
  }
}

async function fetchAccessToken(serviceAccount) {
  const assertion = createJwtAssertion(serviceAccount);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }).toString();

  const response = await httpRequest(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    },
    body,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `OAuth token request failed (${response.statusCode}): ${response.body.slice(0, 500)}`,
    );
  }

  const data = parseJsonResponse(response.body, "Invalid OAuth token response");
  if (typeof data.access_token !== "string" || data.access_token.length === 0) {
    throw new Error("OAuth token response is missing access_token");
  }

  return data.access_token;
}

function toFirestoreValue(value) {
  if (value === null) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    };
  }

  switch (typeof value) {
    case "string":
      return { stringValue: value };
    case "boolean":
      return { booleanValue: value };
    case "number":
      if (!Number.isFinite(value)) {
        throw new Error(`Unsupported non-finite number value: ${value}`);
      }

      if (Number.isInteger(value)) {
        return { integerValue: String(value) };
      }

      return { doubleValue: value };
    case "object":
      return {
        mapValue: {
          fields: toFirestoreFields(value),
        },
      };
    default:
      throw new Error(`Unsupported Firestore value type: ${typeof value}`);
  }
}

function toFirestoreFields(objectValue) {
  const fields = {};

  for (const [key, value] of Object.entries(objectValue)) {
    if (value === undefined) {
      continue;
    }

    fields[key] = toFirestoreValue(value);
  }

  return fields;
}

function createWrite(projectId, databaseId, documentEntry) {
  return {
    update: {
      name: `projects/${projectId}/databases/${databaseId}/documents/${documentEntry.path}`,
      fields: toFirestoreFields(documentEntry.data),
    },
  };
}

async function commitBatch(projectId, databaseId, accessToken, documents) {
  const body = JSON.stringify({
    writes: documents.map((documentEntry) =>
      createWrite(projectId, databaseId, documentEntry),
    ),
  });
  const commitUrl =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/${databaseId}/documents:commit`;
  const response = await httpRequest(commitUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
    body,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `Firestore commit failed (${response.statusCode}): ${response.body.slice(0, 500)}`,
    );
  }

  return parseJsonResponse(response.body, "Invalid Firestore commit response");
}

function buildSummary(documentsPath, orderedDocuments, options, projectId) {
  const manifestCount = orderedDocuments.filter((doc) =>
    isManifestDocument(doc.path),
  ).length;
  const nodeDocumentCount = orderedDocuments.filter((doc) =>
    isCollectionNodeDocument(doc.path),
  ).length;
  const categoryCounts = orderedDocuments
    .filter((doc) => isCollectionNodeDocument(doc.path))
    .reduce((counts, doc) => {
      const category = doc.data.rootCategory;
      counts[category] = (counts[category] ?? 0) + 1;

      return counts;
    }, {});

  return {
    documentsPath,
    projectId,
    databaseId: options.databaseId,
    activate: options.activate,
    dryRun: options.dryRun,
    batchSize: options.batchSize,
    documentCount: orderedDocuments.length,
    manifestCount,
    nodeDocumentCount,
    categoryCounts,
    firstPath: orderedDocuments[0]?.path ?? null,
    lastPath: orderedDocuments[orderedDocuments.length - 1]?.path ?? null,
  };
}

async function uploadDocuments(
  projectId,
  databaseId,
  accessToken,
  documents,
  batchSize,
) {
  const batches = chunkArray(documents, batchSize);
  let uploaded = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    await commitBatch(projectId, databaseId, accessToken, batch);
    uploaded += batch.length;
    console.log(
      `[catalog-upload] Committed batch ${i + 1}/${batches.length} (${uploaded}/${documents.length} documents)`,
    );
  }

  return batches.length;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { path: documentsPath, documents } = loadDocuments(options.documents);
  const orderedDocuments = reorderDocumentsForUpload(
    documents,
    options.activate,
  );

  let projectId = options.projectId;
  let accessToken = null;
  let serviceAccountPath = null;

  if (!options.dryRun) {
    const serviceAccountPayload = loadServiceAccount(options.serviceAccount);
    serviceAccountPath = serviceAccountPayload.path;
    projectId = projectId ?? serviceAccountPayload.serviceAccount.project_id;
    accessToken = await fetchAccessToken(serviceAccountPayload.serviceAccount);
  }

  projectId = projectId ?? "unknown";
  const summary = buildSummary(
    documentsPath,
    orderedDocuments,
    options,
    projectId,
  );

  if (options.dryRun) {
    console.log(
      JSON.stringify(
        {
          ...summary,
          serviceAccountPath: options.serviceAccount ?? null,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    JSON.stringify(
      {
        ...summary,
        serviceAccountPath,
      },
      null,
      2,
    ),
  );

  const batchCount = await uploadDocuments(
    projectId,
    options.databaseId,
    accessToken,
    orderedDocuments,
    options.batchSize,
  );

  console.log(
    JSON.stringify(
      {
        status: "ok",
        projectId,
        databaseId: options.databaseId,
        documentCount: orderedDocuments.length,
        batchCount,
        activated: options.activate,
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[catalog-upload] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });
}

module.exports = {
  chunkArray,
  createWrite,
  isCollectionNodeDocument,
  isManifestDocument,
  parseArgs,
  reorderDocumentsForUpload,
  toFirestoreFields,
  toFirestoreValue,
};
