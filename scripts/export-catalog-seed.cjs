#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_INPUT = path.join("public", "d4dad.json");
const DEFAULT_OUTPUT_ROOT = path.join("tmp", "catalog-seed");
const DEFAULT_CATALOG_ID = "d4";
const DEFAULT_SCHEMA_VERSION = 1;

function getDefaultVersionId() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const options = {
    input: DEFAULT_INPUT,
    outputRoot: DEFAULT_OUTPUT_ROOT,
    catalogId: DEFAULT_CATALOG_ID,
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    versionId: getDefaultVersionId(),
    label: "Catalog seed import",
    pruneEmptyUnsupported: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--input":
        options.input = next;
        i += 1;
        break;
      case "--output-root":
        options.outputRoot = next;
        i += 1;
        break;
      case "--catalog-id":
        options.catalogId = next;
        i += 1;
        break;
      case "--version-id":
        options.versionId = next;
        i += 1;
        break;
      case "--label":
        options.label = next;
        i += 1;
        break;
      case "--schema-version":
        options.schemaVersion = Number(next);
        i += 1;
        break;
      case "--no-prune-empty-unsupported":
        options.pruneEmptyUnsupported = false;
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

  if (!Number.isInteger(options.schemaVersion) || options.schemaVersion < 1) {
    throw new Error(`Invalid --schema-version: ${options.schemaVersion}`);
  }

  if (!options.versionId) {
    throw new Error("Missing --version-id");
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/export-catalog-seed.cjs [options]

Options:
  --input <path>                     Source d4dad.json path
  --output-root <path>               Output directory root
  --catalog-id <id>                  Firestore catalog id
  --version-id <id>                  Catalog version id
  --label <text>                     Human label for the version document
  --schema-version <number>          Catalog schema version
  --no-prune-empty-unsupported       Fail instead of pruning empty depth>1 nodes
  --help                             Show this message
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function nodePathLabel(segments) {
  return segments.join(" > ");
}

function countNestedNodes(collection) {
  return (collection.subcollections ?? []).reduce(
    (total, child) => total + 1 + countNestedNodes(child),
    0,
  );
}

function hasMeaningfulUnsupportedData(collection) {
  if ((collection.collectionItems ?? []).length > 0) {
    return true;
  }

  return (collection.subcollections ?? []).some(hasMeaningfulUnsupportedData);
}

function stripSubcollections(collection) {
  const { subcollections, ...node } = collection;

  return {
    ...node,
    collectionItems: node.collectionItems ?? [],
  };
}

function flattenCollectionsForSeed(collections, options) {
  const nodes = [];
  const warnings = [];

  collections.forEach((root, rootIndex) => {
    nodes.push({
      ...stripSubcollections(root),
      parentId: null,
      order: rootIndex,
    });

    (root.subcollections ?? []).forEach((child, childIndex) => {
      const descendants = child.subcollections ?? [];
      if (descendants.length > 0) {
        const label = nodePathLabel([root.name, child.name]);
        const nestedCount = countNestedNodes(child);
        const hasMeaningfulDescendants = descendants.some(
          hasMeaningfulUnsupportedData,
        );

        if (hasMeaningfulDescendants) {
          throw new Error(
            `Unsupported depth under ${label}. Found ${nestedCount} nested descendant node(s). ` +
              `The catalog exporter only supports root -> subcollection.`,
          );
        }

        if (!options.pruneEmptyUnsupported) {
          throw new Error(
            `Unsupported empty descendants under ${label}. Re-run without ` +
              `--no-prune-empty-unsupported to prune them.`,
          );
        }

        warnings.push(
          `Pruned ${nestedCount} empty unsupported descendant node(s) under ${label}.`,
        );
      }

      nodes.push({
        ...stripSubcollections(child),
        parentId: root.id,
        order: childIndex,
      });
    });
  });

  return { nodes, warnings };
}

function buildFirestoreDocuments(catalogId, versionId, manifest, version, nodes) {
  const documents = [
    {
      path: `catalogs/${catalogId}`,
      data: manifest,
    },
    {
      path: `catalogs/${catalogId}/versions/${versionId}`,
      data: version,
    },
  ];

  nodes.forEach((node) => {
    documents.push({
      path: `catalogs/${catalogId}/versions/${versionId}/collectionNodes/${node.id}`,
      data: node,
    });
  });

  return documents;
}

function createSeedPayload(db, options) {
  if (!Array.isArray(db.collections)) {
    throw new Error("Source file does not contain a collections array");
  }

  const generatedAt = new Date().toISOString();
  const sourcePath = path.resolve(options.input);
  const { nodes, warnings } = flattenCollectionsForSeed(db.collections, options);
  const manifest = {
    activeVersionId: options.versionId,
    schemaVersion: options.schemaVersion,
    updatedAt: generatedAt,
  };
  const version = {
    label: options.label,
    schemaVersion: options.schemaVersion,
    status: "published",
    sourcePath,
    nodeCount: nodes.length,
    publishedAt: generatedAt,
    generatedAt,
  };

  return {
    generatedAt,
    sourcePath,
    catalogId: options.catalogId,
    manifest,
    version,
    collectionNodes: nodes,
    warnings,
    firestoreDocuments: buildFirestoreDocuments(
      options.catalogId,
      options.versionId,
      manifest,
      version,
      nodes,
    ),
  };
}

function writeSeedPayload(seed, options) {
  const outputDir = path.join(options.outputRoot, options.versionId);
  ensureDir(outputDir);

  writeJson(path.join(outputDir, "manifest.json"), seed.manifest);
  writeJson(path.join(outputDir, "version.json"), seed.version);
  writeJson(path.join(outputDir, "collectionNodes.json"), seed.collectionNodes);
  writeJson(
    path.join(outputDir, "firestore-documents.json"),
    seed.firestoreDocuments,
  );
  writeJson(
    path.join(outputDir, "catalog-seed.json"),
    {
      catalogId: seed.catalogId,
      generatedAt: seed.generatedAt,
      sourcePath: seed.sourcePath,
      manifest: seed.manifest,
      version: seed.version,
      warnings: seed.warnings,
      collectionNodeCount: seed.collectionNodes.length,
    },
  );

  return outputDir;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(options.input);

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Source file not found: ${inputPath}`);
  }

  const db = readJson(inputPath);
  const seed = createSeedPayload(db, options);
  const outputDir = writeSeedPayload(seed, options);

  console.log(
    JSON.stringify(
      {
        outputDir,
        catalogId: seed.catalogId,
        versionId: options.versionId,
        rootCollectionCount: db.collections.length,
        collectionNodeCount: seed.collectionNodes.length,
        prunedWarnings: seed.warnings,
      },
      null,
      2,
    ),
  );
}

try {
  main();
} catch (error) {
  console.error(
    `[catalog-seed] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
