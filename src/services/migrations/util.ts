import { VersionMeta } from "../store";

export function isPatchNeeded(
  data: VersionMeta,
  major: number,
  minor: number,
  revision: number,
): boolean {
  if (data.version === undefined) return true;
  if (data.version.major > major) return false;
  if (data.version.major < major) return true;
  if (data.version.minor > minor) return false;
  if (data.version.minor < minor) return true;
  return data.version.revision < revision;
}
