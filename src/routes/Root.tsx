import { Outlet } from "react-router-dom";
import { SettingsProvider } from "../settings/context";
import { CollectionProvider } from "../collection/context";
import { getUserCollectionLog, getUserSettings } from "../store/local";
import { runLocalStorageMigrations } from "../migrations";
import { DataProvider } from "../data/context";

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
          <Outlet />
        </DataProvider>
      </CollectionProvider>
    </SettingsProvider>
  );
}
