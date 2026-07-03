import type { Collection, CollectionItem } from "../../data";
import { useEffect, useMemo } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useData } from "../../data/context";
import { useAuth } from "../../services/auth";
import { useCollection } from "../../ledger/context";
import { useEditor } from "../../editor";
import { useSettings } from "../../settings";
import { filterDb } from "../../data/filters";
import { useDebounceValue } from "usehooks-ts";
import { generateUrl } from "./links";
import { loader } from "./loader";
import type { LoaderPayload } from "./loader";
import { useCatalogLoading } from "./loading";
import { useRootOutletContext } from "../root/outlet";
import {
  getFocusTarget,
  getViewState,
  useFocusSelection,
  useOpenCollections,
} from "./state";
import { View } from "./view";

function Component() {
  const { group } = useLoaderData() as LoaderPayload;
  const navigate = useNavigate();
  const settings = useSettings();
  const collectionLog = useCollection();
  const { searchTerm, sidebarVisibility } = useRootOutletContext();
  const {
    db,
    switchDb,
    setCatalogCategoryDb,
    loadedCatalogGroups,
    catalogGroupSources,
  } = useData();
  const { isLoading: isAuthLoading } = useAuth();
  const { canEditCatalog, isEditMode } = useEditor();
  const { openCollections, setOpenCollection } = useOpenCollections();
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
  const visibleCollections = useMemo(
    () =>
      filterDb(
        db.collections,
        settings,
        collectionLog,
        group,
        debouncedSearchTerm,
        false,
        isEditMode,
      ),
    [
      collectionLog,
      db.collections,
      debouncedSearchTerm,
      group,
      isEditMode,
      settings,
    ],
  );
  const {
    focusCollectionId,
    focusItemId,
    setFocusCollectionId,
    setFocusItemId,
  } = useFocusSelection(visibleCollections);
  const { catalogError, isCatalogLoading } = useCatalogLoading({
    canEditCatalog,
    catalogGroupSources,
    group,
    isAuthLoading,
    loadedCatalogGroups,
    setCatalogCategoryDb,
  });
  const viewState = getViewState({
    catalogCollections: db.collections,
    focusCollectionId,
    focusItemId,
    isAuthLoading,
    isCatalogLoading,
    visibleCollections,
  });

  useEffect(() => {
    switchDb(group);
  }, [group, switchDb]);

  function onClickItem(collectionItem: CollectionItem, collection: Collection) {
    const { collectionId, itemId } = getFocusTarget({
      collection,
      collectionItem,
    });

    setFocusItemId(itemId);
    setFocusCollectionId(collectionId);
  }

  function onSelectCollectionGroup(collectionGroup: LoaderPayload["group"]) {
    void navigate(generateUrl(collectionGroup));
  }

  return (
    <View
      catalogError={catalogError}
      collections={viewState.collections}
      focusCollection={viewState.focusCollection}
      focusItem={viewState.focusItem}
      isEmpty={viewState.isEmpty}
      isItemSidebarLoading={viewState.isItemSidebarLoading}
      isLoading={viewState.isLoading}
      onClickItem={onClickItem}
      onCollectionChange={setOpenCollection}
      onSelectCollectionGroup={onSelectCollectionGroup}
      openCollections={openCollections}
      searchTerm={searchTerm}
      sidebarVisibility={sidebarVisibility}
    />
  );
}

export { Component, loader };
