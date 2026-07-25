#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DEFAULT_PROJECT_ID = "d4log-bfc60";
const DEFAULT_BUCKET = "d4log-bfc60.appspot.com";
const DEFAULT_DATABASE_ID = "(default)";
const DEFAULT_VERSION_ID = "v3";
const DEFAULT_OUTPUT_ROOT = path.join("tmp", "catalog-seed");
const DEFAULT_AUTH_EMULATOR_ORIGIN = "http://127.0.0.1:9099";
const DEFAULT_FIRESTORE_EMULATOR_ORIGIN = "http://127.0.0.1:8080";
const DEFAULT_STORAGE_EMULATOR_ORIGIN = "http://127.0.0.1:9199";
const DEFAULT_ICONS_DIR = path.join("public", "icons");
const DEFAULT_EDITOR_EMAIL = "editor@d4log.local";
const DEFAULT_EDITOR_PASSWORD = "LocalEditor123!";
const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_STORAGE_CONCURRENCY = 24;
const ICON_CACHE_CONTROL = "public, max-age=31536000, immutable";
const CONTENT_TYPES = new Map([
  [".avif", "image/avif"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

function parseArgs(argv) {
  const options = {
    authEmulatorOrigin: DEFAULT_AUTH_EMULATOR_ORIGIN,
    batchSize: DEFAULT_BATCH_SIZE,
    bucket: DEFAULT_BUCKET,
    databaseId: DEFAULT_DATABASE_ID,
    documents: undefined,
    dryRun: false,
    editorEmail: DEFAULT_EDITOR_EMAIL,
    editorPassword: DEFAULT_EDITOR_PASSWORD,
    exportSeed: true,
    firestoreEmulatorOrigin: DEFAULT_FIRESTORE_EMULATOR_ORIGIN,
    iconsDir: DEFAULT_ICONS_DIR,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    projectId: DEFAULT_PROJECT_ID,
    seedAuth: true,
    seedFirestore: true,
    seedStorage: true,
    storageConcurrency: DEFAULT_STORAGE_CONCURRENCY,
    storageEmulatorOrigin: DEFAULT_STORAGE_EMULATOR_ORIGIN,
    versionId: DEFAULT_VERSION_ID,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--project-id":
        options.projectId = next;
        i += 1;
        break;
      case "--bucket":
        options.bucket = next;
        i += 1;
        break;
      case "--database-id":
        options.databaseId = next;
        i += 1;
        break;
      case "--version-id":
        options.versionId = next;
        i += 1;
        break;
      case "--documents":
        options.documents = next;
        options.exportSeed = false;
        i += 1;
        break;
      case "--output-root":
        options.outputRoot = next;
        i += 1;
        break;
      case "--icons-dir":
        options.iconsDir = next;
        i += 1;
        break;
      case "--auth-origin":
        options.authEmulatorOrigin = next;
        i += 1;
        break;
      case "--firestore-origin":
        options.firestoreEmulatorOrigin = next;
        i += 1;
        break;
      case "--storage-origin":
        options.storageEmulatorOrigin = next;
        i += 1;
        break;
      case "--batch-size":
        options.batchSize = Number(next);
        i += 1;
        break;
      case "--storage-concurrency":
        options.storageConcurrency = Number(next);
        i += 1;
        break;
      case "--editor-email":
        options.editorEmail = next;
        i += 1;
        break;
      case "--editor-password":
        options.editorPassword = next;
        i += 1;
        break;
      case "--skip-export":
        options.exportSeed = false;
        break;
      case "--skip-auth":
        options.seedAuth = false;
        break;
      case "--skip-firestore":
        options.seedFirestore = false;
        break;
      case "--skip-storage":
        options.seedStorage = false;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (
    !Number.isInteger(options.batchSize) ||
    options.batchSize < 1 ||
    options.batchSize > 500
  ) {
    throw new Error(`Invalid --batch-size: ${options.batchSize}`);
  }

  if (
    !Number.isInteger(options.storageConcurrency) ||
    options.storageConcurrency < 1
  ) {
    throw new Error(
      `Invalid --storage-concurrency: ${options.storageConcurrency}`,
    );
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/seed-emulators.cjs [options]

Options:
  --project-id <id>             Firebase project id
  --bucket <name>               Storage bucket name
  --database-id <id>            Firestore database id (default: (default))
  --version-id <id>             Catalog version id to export (default: v3)
  --documents <path>            Existing firestore-documents.json to upload
  --output-root <path>          Catalog seed output root
  --icons-dir <path>            Source icon directory (default: public/icons)
  --auth-origin <url>           Auth emulator origin
  --firestore-origin <url>      Firestore emulator origin
  --storage-origin <url>        Storage emulator origin
  --batch-size <1-500>          Firestore commit batch size
  --storage-concurrency <n>     Parallel Storage uploads
  --editor-email <email>        Local editor user email
  --editor-password <password>  Local editor user password
  --skip-export                 Do not generate a fresh catalog seed
  --skip-auth                   Do not seed an editor Auth user
  --skip-firestore              Do not seed Firestore
  --skip-storage                Do not seed Storage
  --dry-run                     Print what would be seeded
  --help                        Show this message
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveExistingPath(filePath, label) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${label} not found: ${absolutePath}`);
  }

  return absolutePath;
}

function runCatalogExport(options) {
  const result = spawnSync(
    process.execPath,
    [
      path.join("scripts", "export-catalog-seed.cjs"),
      "--version-id",
      options.versionId,
      "--output-root",
      options.outputRoot,
    ],
    {
      encoding: "utf8",
      stdio: "pipe",
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Catalog seed export failed: ${(result.stderr || result.stdout).trim()}`,
    );
  }

  if (result.stdout.trim().length > 0) {
    console.log(result.stdout.trim());
  }
}

function getDocumentsPath(options) {
  return path.resolve(
    options.documents ??
      path.join(
        options.outputRoot,
        options.versionId,
        "firestore-documents.json",
      ),
  );
}

function isManifestDocument(documentPath) {
  return /^catalogs\/[^/]+$/.test(documentPath);
}

function reorderDocumentsForUpload(documents) {
  const manifestDocuments = documents.filter((doc) =>
    isManifestDocument(doc.path),
  );
  const otherDocuments = documents.filter(
    (doc) => !isManifestDocument(doc.path),
  );

  return otherDocuments.concat(manifestDocuments);
}

function chunkArray(values, size) {
  const chunks = [];

  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }

  return chunks;
}

function configureAdminEmulators(options) {
  process.env.GCLOUD_PROJECT = options.projectId;
  process.env.FIREBASE_AUTH_EMULATOR_HOST = getHostWithoutProtocol(
    options.authEmulatorOrigin,
  );
  process.env.FIRESTORE_EMULATOR_HOST = getHostWithoutProtocol(
    options.firestoreEmulatorOrigin,
  );
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = getHostWithoutProtocol(
    options.storageEmulatorOrigin,
  );
}

function getHostWithoutProtocol(origin) {
  const url = new URL(origin);

  return url.host;
}

function loadFirebaseAdmin() {
  try {
    return require("firebase-admin");
  } catch {
    const localAdminPath = path.join(
      __dirname,
      "..",
      "functions",
      "node_modules",
      "firebase-admin",
    );

    if (!fs.existsSync(localAdminPath)) {
      throw new Error(
        "firebase-admin was not found. Run npm install in functions first.",
      );
    }

    return require(localAdminPath);
  }
}

function getAdminApp(options) {
  configureAdminEmulators(options);

  const admin = loadFirebaseAdmin();
  const existingApp = admin.apps.find((app) => app.name === "[DEFAULT]");

  if (existingApp) {
    return {
      admin,
      app: existingApp,
    };
  }

  return {
    admin,
    app: admin.initializeApp({
      projectId: options.projectId,
      storageBucket: options.bucket,
    }),
  };
}

function getFirestore(options) {
  if (options.databaseId !== DEFAULT_DATABASE_ID) {
    throw new Error(
      "The emulator seed script currently supports only the default Firestore database.",
    );
  }

  const { admin, app } = getAdminApp(options);

  return admin.firestore(app);
}

async function seedAuth(options) {
  const { admin, app } = getAdminApp(options);
  const auth = admin.auth(app);
  const existingUser = await auth
    .getUserByEmail(options.editorEmail)
    .catch((error) => {
      if (error?.code === "auth/user-not-found") {
        return undefined;
      }

      throw error;
    });
  const user = existingUser ??
    await auth.createUser({
      displayName: "Local Editor",
      email: options.editorEmail,
      emailVerified: true,
      password: options.editorPassword,
    });

  if (existingUser) {
    await auth.updateUser(existingUser.uid, {
      displayName: "Local Editor",
      emailVerified: true,
      password: options.editorPassword,
    });
  }

  await auth.setCustomUserClaims(user.uid, {
    editor: true,
    role: "EDITOR",
    roles: ["EDITOR"],
  });

  return {
    email: options.editorEmail,
    uid: user.uid,
  };
}

async function commitFirestoreBatch(options, firestore, batch) {
  const writeBatch = firestore.batch();

  batch.forEach((documentEntry) => {
    writeBatch.set(firestore.doc(documentEntry.path), documentEntry.data);
  });

  await writeBatch.commit();
}

async function seedFirestore(options, documents) {
  const firestore = getFirestore(options);
  const batches = chunkArray(documents, options.batchSize);
  let committed = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    await commitFirestoreBatch(options, firestore, batch);
    committed += batch.length;
    console.log(
      `[emulators:seed] Firestore batch ${i + 1}/${batches.length} (${committed}/${documents.length} documents)`,
    );
  }

  return batches.length;
}

function listIconFiles(iconsDir) {
  const absoluteIconsDir = resolveExistingPath(iconsDir, "Icon directory");
  const files = [];

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(entryPath);
        continue;
      }

      const contentType = CONTENT_TYPES.get(
        path.extname(entry.name).toLowerCase(),
      );
      if (!contentType) {
        continue;
      }

      const relativePath = path
        .relative(absoluteIconsDir, entryPath)
        .split(path.sep)
        .join("/");

      files.push({
        contentType,
        objectName: `icons/${relativePath}`,
        path: entryPath,
      });
    }
  }

  visit(absoluteIconsDir);

  return files;
}

function getStorageBucket(options) {
  const { admin, app } = getAdminApp(options);

  return admin.storage(app).bucket(options.bucket);
}

async function uploadStorageObject(bucket, iconFile) {
  await bucket.upload(iconFile.path, {
    destination: iconFile.objectName,
    metadata: {
      cacheControl: ICON_CACHE_CONTROL,
      contentType: iconFile.contentType,
    },
    resumable: false,
  });
}

async function runLimited(values, limit, task) {
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      await task(values[index], index);
      completed += 1;

      if (completed % 250 === 0 || completed === values.length) {
        console.log(
          `[emulators:seed] Storage icons ${completed}/${values.length}`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, () => worker()),
  );
}

async function seedStorage(options, iconFiles) {
  const bucket = getStorageBucket(options);

  await runLimited(iconFiles, options.storageConcurrency, (iconFile) =>
    uploadStorageObject(bucket, iconFile),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.exportSeed && options.seedFirestore) {
    runCatalogExport(options);
  }

  const documentsPath = getDocumentsPath(options);
  const documents = options.seedFirestore
    ? reorderDocumentsForUpload(
        readJson(resolveExistingPath(documentsPath, "Firestore documents file")),
      )
    : [];
  const iconFiles = options.seedStorage ? listIconFiles(options.iconsDir) : [];

  console.log(
    JSON.stringify(
      {
        bucket: options.bucket,
        databaseId: options.databaseId,
        documentsPath: options.seedFirestore ? documentsPath : null,
        dryRun: options.dryRun,
        editorEmail: options.seedAuth ? options.editorEmail : null,
        authOrigin: options.authEmulatorOrigin,
        firestoreDocumentCount: documents.length,
        firestoreOrigin: options.firestoreEmulatorOrigin,
        iconCount: iconFiles.length,
        iconsDir: options.seedStorage ? path.resolve(options.iconsDir) : null,
        projectId: options.projectId,
        storageOrigin: options.storageEmulatorOrigin,
        versionId: options.versionId,
      },
      null,
      2,
    ),
  );

  if (options.dryRun) {
    return;
  }

  const editorUser = options.seedAuth ? await seedAuth(options) : null;
  const firestoreBatchCount = options.seedFirestore
    ? await seedFirestore(options, documents)
    : 0;

  if (options.seedStorage) {
    await seedStorage(options, iconFiles);
  }

  console.log(
    JSON.stringify(
      {
        editorUser,
        firestoreBatchCount,
        firestoreDocumentCount: documents.length,
        iconCount: iconFiles.length,
        status: "ok",
      },
      null,
      2,
    ),
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[emulators:seed] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });
}
