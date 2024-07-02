import { Outlet } from "react-router-dom";
import { SettingsProvider } from "../settings/context";
import { CollectionProvider } from "../collection/context";
import { getUserCollectionLog, getUserSettings } from "../store/local";

// Loads settings and collection from localStorage
// If application has not been used before, these will be default
const settings = getUserSettings();
const collection = getUserCollectionLog();

export function Root() {
  return (
    <SettingsProvider settings={settings}>
      <CollectionProvider collection={collection}>
        <Outlet />
      </CollectionProvider>
    </SettingsProvider>
  );
}
