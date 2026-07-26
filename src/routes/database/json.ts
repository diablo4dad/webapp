import { DATA_REPO } from "../../config";

type JsonPathSegment = string | number;

const DATAMINED_FILE_SEGMENT_PATTERN = /^[ A-Za-z0-9_.-]+$/;

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

  const encodedFilename = segments.map(encodeURIComponent).join("/");

  return `${DATA_REPO}/${encodedFilename}.json`;
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
  getDataminedFileUrl,
  getJsonErrorMessage,
  replaceJsonValueAtPath,
};
export type { JsonPathSegment };
