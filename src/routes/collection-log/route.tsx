import { toggleValueInArray } from "../../common/arrays";
import { Collection, CollectionItem } from "../../data";
import { MasterGroup } from "../../common";
import React, { useEffect, useState } from "react";
import { selectCollectionById, selectItemOrDefault } from "../../data/reducers";
import { getViewModel, saveViewModel } from "../../store/local";
import { useLoaderData } from "react-router-dom";
import { useData } from "../../data/context";
import { hydrateDadDb } from "../../data/factory";
import { fetchHybridDadDbRefsByCategory } from "../../store/catalog";
import { useAuth } from "../../auth/context";
import { useEditor } from "../../editor/context";
import { getCatalogRouteLoadPlan } from "./loading";
import { slugToGroup } from "./links";
import type { CollectionLogViewModel } from "./state";
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
  const [vm, setVm] = useState<CollectionLogViewModel>(getViewModel());
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string>();
  const focusItem = selectItemOrDefault(db.collections, focusItemId);
  const focusCollection = selectCollectionById(
    db.collections,
    focusCollectionId,
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    let cancelled = false;
    const { groupsToFetch, source } = getCatalogRouteLoadPlan({
      canEditCatalog,
      catalogGroupSources,
      group,
      loadedCatalogGroups,
    });

    if (groupsToFetch.length === 0) {
      setIsCatalogLoading(false);
      setCatalogError(undefined);
      return;
    }

    setIsCatalogLoading(true);
    setCatalogError(undefined);

    async function fetchCatalog() {
      try {
        const resolvedGroups = await fetchHybridDadDbRefsByCategory(
          groupsToFetch,
          {
            source,
          },
        );

        if (!cancelled) {
          resolvedGroups.forEach((resolvedGroup) => {
            setCatalogCategoryDb(
              resolvedGroup.category as MasterGroup,
              hydrateDadDb(resolvedGroup.dadDbRef),
              source,
            );
          });
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(
            error instanceof Error
              ? error.message
              : "Failed to load catalogue.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsCatalogLoading(false);
        }
      }
    }

    void fetchCatalog();

    return () => {
      cancelled = true;
    };
  }, [
    canEditCatalog,
    catalogGroupSources,
    group,
    isAuthLoading,
    loadedCatalogGroups,
    setCatalogCategoryDb,
  ]);

  useEffect(() => {
    switchDb(group);
  }, [group, switchDb]);

  useEffect(() => {
    saveViewModel(vm);
  }, [vm]);

  function onClickItem(collectionItem: CollectionItem, collection: Collection) {
    setFocusItemId(collectionItem.id);
    setFocusCollectionId(collection.id);
  }

  function onCollectionChange(collectionId: string, isOpen: boolean) {
    setVm((vm) => ({
      ...vm,
      openCollections: toggleValueInArray(
        vm.openCollections,
        collectionId,
        isOpen,
      ),
    }));
  }

  return (
    <CollectionLogView
      catalogError={catalogError}
      collections={filteredDb}
      focusCollection={focusCollection}
      focusItem={focusItem}
      focusItemId={focusItemId}
      isLoading={isAuthLoading || isCatalogLoading}
      onClickItem={onClickItem}
      onCollectionChange={onCollectionChange}
      openCollections={vm.openCollections}
      sidebarVisibility={sidebarVisibility}
    />
  );
}
