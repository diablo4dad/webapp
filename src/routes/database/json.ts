type JsonPathSegment = string | number;

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
  getJsonErrorMessage,
  replaceJsonValueAtPath,
};
export type { JsonPathSegment };
