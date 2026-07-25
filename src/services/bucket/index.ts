import {
  FIREBASE_STORAGE_BUCKET,
  ICON_BUCKET,
} from "../../config";
import {
  getStorageEmulatorDownloadUrl,
  shouldUseFirebaseEmulators,
} from "../../config/firebase-emulators";

export function getIcon(fileName: string): string {
  if (shouldUseFirebaseEmulators()) {
    return getStorageEmulatorDownloadUrl(FIREBASE_STORAGE_BUCKET, fileName);
  }

  if (process.env.NODE_ENV === "development") {
    return "/" + fileName;
  }

  return ICON_BUCKET + "/" + encodeURIComponent(fileName) + "?alt=media";
}
