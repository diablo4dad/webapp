import { Outlet } from "react-router-dom";
import { SettingsProvider } from "../settings/context";
import { CollectionProvider } from "../collection/context";
import { getUserCollectionLog, getUserSettings } from "../store/local";
import { DataProvider } from "../data/context";
import { AuthProvider } from "../auth/context";
import { runLocalStorageMigrations } from "../migrations/localstorage";
import { PersistenceLayer } from "../store/PersistenceLayer";

export function Root() {
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
              <Outlet />
            </PersistenceLayer>
          </AuthProvider>
        </DataProvider>
      </CollectionProvider>
    </SettingsProvider>
  );
}
