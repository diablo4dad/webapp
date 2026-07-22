async function fetchFormattedJson(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Failed to load JSON (${response.status}).`);
  }

  return formatJson(await response.json());
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? "undefined";
}

function getJsonErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Failed to load datamined JSON.";
}

export { fetchFormattedJson, formatJson, getJsonErrorMessage };
