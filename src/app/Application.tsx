import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { SidebarProvider } from "../layout/context";
import Root from "../routes/Root";
import { SettingsProvider } from "../settings/context";
import { CollectionProvider } from "../collection/context";
import { getUserCollectionLog, getUserSettings } from "../store/local";
import { DataProvider } from "../data/context";
import { AuthProvider } from "../auth/context";
import { runLocalStorageMigrations } from "../migrations/localstorage";
import { PersistenceLayer } from "../store/PersistenceLayer";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { CollectionView, loader } = await import(
            "../routes/CollectionLog"
          );
          return { loader, Component: CollectionView };
        },
      },
      {
        path: "/transmogs/:collectionId",
        lazy: async () => {
          const { CollectionView, loader } = await import(
            "../routes/CollectionLog"
          );
          return { loader, Component: CollectionView };
        },
      },
    ],
  },
]);

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
        <DataProvider>
          <AuthProvider>
            <PersistenceLayer>
              <SidebarProvider>
                <RouterProvider router={router} />
              </SidebarProvider>
            </PersistenceLayer>
          </AuthProvider>
        </DataProvider>
      </CollectionProvider>
    </SettingsProvider>
  );
}
