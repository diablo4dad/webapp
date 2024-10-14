import { ICON_BUCKET } from "../config";

export function getIcon(fileName: string): string {
  if (process.env.NODE_ENV === "development") {
    return "/" + fileName;
  } else {
    return ICON_BUCKET + "/" + encodeURIComponent(fileName) + "?alt=media";
  }
}
