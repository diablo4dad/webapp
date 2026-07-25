import { auth } from "../../../config/firebase";
import type { ItemRef } from "../../../services/data";

type IconUploadResponse = {
  iconId: number;
  path: string;
};

type ItemImportResponse = {
  icon?: {
    contentType: string;
    dataUrl: string;
  };
  item: Partial<ItemRef>;
  itemTypeName?: string;
};

async function uploadCatalogItemIcon(file: File): Promise<IconUploadResponse> {
  return uploadCatalogItemIconDataUrl(await readFileAsDataUrl(file));
}

async function uploadCatalogItemIconDataUrl(
  dataUrl: string,
): Promise<IconUploadResponse> {
  return postEditorJson<IconUploadResponse>("/api/catalog/item-icon", {
    dataUrl,
  });
}

async function importDatabaseItemFromUrl(
  url: string,
): Promise<ItemImportResponse> {
  return postEditorJson<ItemImportResponse>("/api/database/item-import", {
    url,
  });
}

async function postEditorJson<TResponse>(
  url: string,
  body: unknown,
): Promise<TResponse> {
  const token = await getEditorToken();
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);

    throw new Error(payload);
  }

  return (await response.json()) as TResponse;
}

async function readErrorPayload(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: unknown };

    if (typeof payload.error === "string" && payload.error.length > 0) {
      return payload.error;
    }
  } catch {
    // fall through to status text
  }

  return response.statusText || "Request failed.";
}

async function getEditorToken(): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Sign in as an editor to continue.");
  }

  return user.getIdToken();
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("error", () => {
      reject(new Error("Failed to read icon file."));
    });
    reader.addEventListener("load", () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read icon file."));
        return;
      }

      resolve(reader.result);
    });
    reader.readAsDataURL(file);
  });
}

export {
  readFileAsDataUrl,
  importDatabaseItemFromUrl,
  uploadCatalogItemIcon,
  uploadCatalogItemIconDataUrl,
};
export type { ItemImportResponse };
