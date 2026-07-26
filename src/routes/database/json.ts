import { DATA_REPO } from "../../config";

type JsonPathSegment = string | number;
type DataminedFileKind = "base" | "storeString" | "string";
type DataminedFileDescriptor = {
  filename: string;
  kind: DataminedFileKind;
  label: string;
};

const DATAMINED_FILE_SEGMENT_PATTERN = /^[ A-Za-z0-9_.-]+$/;
const DATAMINED_STRING_FILE_ROOT = "enUS_Text/meta/StringList";

async function fetchJson(
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load JSON (${response.status}).`);
  }

  return response.json();
}

async function fetchFormattedJson(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  return formatJson(await fetchJson(url, signal));
}

function getDataminedFileUrl(filename: string): string {
  const trimmedFilename = validateDataminedFilename(filename);
  const segments = trimmedFilename.split("/");
  const encodedFilename = segments.map(encodeURIComponent).join("/");

  return `${DATA_REPO}/${encodedFilename}.json`;
}

function getDataminedFileDescriptors(
  filename: string,
): DataminedFileDescriptor[] {
  const baseFilename = filename.trim();
  const baseFile: DataminedFileDescriptor = {
    filename: baseFilename,
    kind: "base",
    label: "Base file",
  };

  let validatedFilename;

  try {
    validatedFilename = validateDataminedFilename(filename);
  } catch {
    return [baseFile];
  }

  const inferredStringFiles = getDataminedStringFileDescriptors(
    validatedFilename,
  );

  return [
    {
      ...baseFile,
      filename: validatedFilename,
    },
    ...inferredStringFiles,
  ];
}

function validateDataminedFilename(filename: string): string {
  const trimmedFilename = filename.trim();

  if (
    trimmedFilename.length === 0 ||
    trimmedFilename.startsWith("/") ||
    trimmedFilename.endsWith("/") ||
    trimmedFilename.includes("\\") ||
    trimmedFilename.includes("?") ||
    trimmedFilename.includes("#")
  ) {
    throw new Error("Invalid datamined file reference.");
  }

  const segments = trimmedFilename.split("/");

  if (
    segments.some((segment) =>
      segment.length === 0 ||
      segment.trim().length === 0 ||
      segment === "." ||
      segment === ".." ||
      !DATAMINED_FILE_SEGMENT_PATTERN.test(segment)
    )
  ) {
    throw new Error("Invalid datamined file reference.");
  }

  return trimmedFilename;
}

function getDataminedStringFileDescriptors(
  filename: string,
): DataminedFileDescriptor[] {
  const segments = filename.split("/");

  if (segments.length < 2) {
    return [];
  }

  const itemType = segments.at(-2);
  const filenameSegment = segments.at(-1);

  if (!itemType || !filenameSegment) {
    return [];
  }

  const filenameStem = stripDataminedFileExtension(filenameSegment);

  if (filenameStem.length === 0) {
    return [];
  }

  return [
    {
      filename: `${DATAMINED_STRING_FILE_ROOT}/${itemType}_${filenameStem}.stl`,
      kind: "string",
      label: "String file",
    },
    {
      filename: `${DATAMINED_STRING_FILE_ROOT}/StoreProduct_${filenameStem}.stl`,
      kind: "storeString",
      label: "Store string file",
    },
  ];
}

function stripDataminedFileExtension(filenameSegment: string): string {
  const extensionIndex = filenameSegment.lastIndexOf(".");

  return extensionIndex > 0
    ? filenameSegment.slice(0, extensionIndex)
    : filenameSegment;
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? "undefined";
}

function replaceJsonValueAtPath(
  value: unknown,
  path: readonly JsonPathSegment[],
  replacement: unknown,
): unknown {
  if (path.length === 0) {
    return replacement;
  }

  const [segment, ...nextPath] = path;

  if (Array.isArray(value) && typeof segment === "number") {
    if (segment < 0 || segment >= value.length) {
      return value;
    }

    return value.map((item, index) =>
      index === segment
        ? replaceJsonValueAtPath(item, nextPath, replacement)
        : item
    );
  }

  if (isRecord(value) && typeof segment === "string") {
    if (!Object.prototype.hasOwnProperty.call(value, segment)) {
      return value;
    }

    return {
      ...value,
      [segment]: replaceJsonValueAtPath(
        value[segment],
        nextPath,
        replacement,
      ),
    };
  }

  return value;
}

function getJsonErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Failed to load datamined JSON.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export {
  fetchFormattedJson,
  fetchJson,
  formatJson,
  getDataminedFileDescriptors,
  getDataminedFileUrl,
  getJsonErrorMessage,
  replaceJsonValueAtPath,
};
export type { DataminedFileDescriptor, JsonPathSegment };
