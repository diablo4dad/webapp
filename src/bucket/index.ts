import { ICON_BUCKET } from "../config";

export function getIcon(fileName: string): string {
  return ICON_BUCKET + "/" + encodeURIComponent(fileName) + "?alt=media";
}
