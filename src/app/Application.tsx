import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootRoute from "../routes/root/route";
import { SettingsProvider } from "../settings/context";
import { CollectionProvider } from "../collection/context";
import { getUserCollectionLog, getUserSettings } from "../store/local";
import { DataProvider } from "../data/context";
import { AuthProvider } from "../auth/context";
import { runLocalStorageMigrations } from "../migrations/localstorage";
import { PersistenceLayer } from "../store/PersistenceLayer";
import { EditorProvider } from "../editor/context";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRoute />,
    HydrateFallback,
    children: [
      {
        index: true,
        lazy: () => import("../routes/collection-log/route"),
      },
      {
        path: "/transmogs/:collectionId",
        lazy: () => import("../routes/collection-log/route"),
      },
    ],
  },
]);

function HydrateFallback() {
  return null;
}

export function Application() {
  // Run LocalStorage migrations
  runLocalStorageMigrations();

  // Loads settings and collection from localStorage
  // If application has not been used before, these will be default
  const settings = getUserSettings();
  const collection = getUserCollectionLog();

  return (
    <SettingsProvider settings={settings}>
      <CollectionProvider collection={collection}>
        <AuthProvider>
          <EditorProvider>
            <DataProvider>
              <PersistenceLayer>
                <RouterProvider router={router} />
              </PersistenceLayer>
            </DataProvider>
          </EditorProvider>
        </AuthProvider>
      </CollectionProvider>
    </SettingsProvider>
  );
}
