import type { Collection, CollectionItem } from "../../data";
import type { MasterGroup } from "../../common";
import React, { useEffect } from "react";
import { selectCollectionById, selectItemOrDefault } from "../../data/reducers";
import { useLoaderData } from "react-router-dom";
import { useData } from "../../data/context";
import { useAuth } from "../../auth/context";
import { useEditor } from "../../editor/context";
import { useCatalogRouteLoading } from "./loading";
import { slugToGroup } from "./links";
import { useCollectionLogState } from "./state";
import { CollectionLogView } from "./view";

export type Params = {
  params: {
    collectionId?: string;
  };
};

export type LoaderPayload = {
  group: MasterGroup;
};

export async function loader({ params }: Params) {
  const group = slugToGroup(params.collectionId ?? "general");

  return {
    group,
  };
}

export function CollectionView() {
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
  const { catalogError, isCatalogLoading } = useCatalogRouteLoading({
    canEditCatalog,
    catalogGroupSources,
    group,
    isAuthLoading,
    loadedCatalogGroups,
    setCatalogCategoryDb,
  });
  const focusItem = selectItemOrDefault(db.collections, focusItemId);
  const focusCollection = selectCollectionById(
    db.collections,
    focusCollectionId,
  );
  const isItemSidebarLoading = focusItemId === -1;

  useEffect(() => {
    switchDb(group);
  }, [group, switchDb]);

  function onClickItem(collectionItem: CollectionItem, collection: Collection) {
    setFocusItemId(collectionItem.id);
    setFocusCollectionId(collection.id);
  }

  return (
    <CollectionLogView
      catalogError={catalogError}
      collections={filteredDb}
      focusCollection={focusCollection}
      focusItem={focusItem}
      isItemSidebarLoading={isItemSidebarLoading}
      isLoading={isAuthLoading || isCatalogLoading}
      onClickItem={onClickItem}
      onCollectionChange={setOpenCollection}
      openCollections={openCollections}
      sidebarVisibility={sidebarVisibility}
    />
  );
}
