import type { Collection, CollectionItem } from "../../data";
import { useEffect } from "react";
import { useLoaderData } from "react-router-dom";
import { useData } from "../../data/context";
import { useAuth } from "../../auth/context";
import { useEditor } from "../../editor/context";
import { loader as collectionLogLoader } from "./loader";
import type { LoaderPayload } from "./loader";
import { useCatalogLoading } from "./loading";
import {
  getFocusTarget,
  getCollectionLogViewState,
  useCollectionLogState,
} from "./state";
import { CollectionLogView } from "./view";

export const loader = collectionLogLoader;

export function Component() {
  const { group } = useLoaderData() as LoaderPayload;
  const {
    filteredDb,
    db,
    switchDb,
    setCatalogCategoryDb,
    setFocusCollectionId,
    setFocusItemId,
    focusCollectionId,
    focusItemId,
    sidebarVisibility,
    loadedCatalogGroups,
    catalogGroupSources,
  } = useData();
  const { isLoading: isAuthLoading } = useAuth();
  const { canEditCatalog } = useEditor();
  const { openCollections, setOpenCollection } = useCollectionLogState();
  const { catalogError, isCatalogLoading } = useCatalogLoading({
    canEditCatalog,
    catalogGroupSources,
    group,
    isAuthLoading,
    loadedCatalogGroups,
    setCatalogCategoryDb,
  });
  const viewState = getCollectionLogViewState({
    catalogCollections: db.collections,
    focusCollectionId,
    focusItemId,
    isAuthLoading,
    isCatalogLoading,
    visibleCollections: filteredDb,
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

  return (
    <CollectionLogView
      catalogError={catalogError}
      collections={viewState.collections}
      focusCollection={viewState.focusCollection}
      focusItem={viewState.focusItem}
      isEmpty={viewState.isEmpty}
      isItemSidebarLoading={viewState.isItemSidebarLoading}
      isLoading={viewState.isLoading}
      onClickItem={onClickItem}
      onCollectionChange={setOpenCollection}
      openCollections={openCollections}
      sidebarVisibility={sidebarVisibility}
    />
  );
}
