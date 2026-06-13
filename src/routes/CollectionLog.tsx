import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import EmptyCollection from "../collection/EmptyCollection";
import Welcome from "../collection/Welcome";
import ItemSidebar from "../collection/ItemSidebar";
import ItemSidebarSkeleton from "../collection/ItemSidebarSkeleton";
import Progress from "../collection/Progress";
import Season from "../collection/Season";
import ConfigSidebar from "../settings/ConfigSidebar";
import styles from "./CollectionLog.module.css";
import Ledger from "../collection/Ledger";
import LedgerSkeleton from "../collection/LedgerSkeleton";
import { toggleValueInArray } from "../common/arrays";
import { Collection, CollectionItem } from "../data";
import { MasterGroup, catalogGroups } from "../common";
import React, { useEffect, useState } from "react";
import { countAllItemsDabDb } from "../data/aggregate";
import { selectCollectionById, selectItemOrDefault } from "../data/reducers";
import SidebarMain from "../layout/SidebarMain";
import { getViewModel, saveViewModel } from "../store/local";
import { useLoaderData } from "react-router-dom";
import { useData } from "../data/context";
import { hydrateDadDb } from "../data/factory";
import { fetchHybridDadDbRefsByCategory } from "../store/catalog";
import { useAuth } from "../auth/context";
import { useEditor } from "../editor/context";

export type ViewModel = {
  openCollections: string[];
};

export type Params = {
  params: {
    collectionId?: string;
  };
};

export type LoaderPayload = {
  group: MasterGroup;
};

const slugMap: ReadonlyMap<MasterGroup, string> = new Map([
  [MasterGroup.GENERAL, "general"],
  [MasterGroup.SEASONS, "seasons"],
  [MasterGroup.SHOP_ITEMS, "store"],
  [MasterGroup.PROMOTIONAL, "promotional"],
  [MasterGroup.CHALLENGE, "challenges"],
  [MasterGroup.UNIVERSAL, "universal"],
]);

const slugMapInverse: ReadonlyMap<string, MasterGroup> = new Map(
  Array.from(slugMap, (a) => a.reverse() as [string, MasterGroup]),
);

export function slugToGroup(slug: string): MasterGroup {
  return slugMapInverse.get(slug) ?? MasterGroup.GENERAL;
}

export function groupToSlug(group: MasterGroup): string {
  return slugMap.get(group) ?? "general";
}

export function generateUrl(group: MasterGroup): string {
  return `/transmogs/${groupToSlug(group)}`;
}

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
  const [vm, setVm] = useState<ViewModel>(getViewModel());
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
    const source = canEditCatalog ? "firestore" : "bundle";
    const targetGroups =
      group === MasterGroup.UNIVERSAL ? catalogGroups : [group];
    const groupsToFetch = targetGroups.filter((targetGroup) => {
      if (!catalogGroups.some((category) => category === targetGroup)) {
        return false;
      }

      if (source === "firestore") {
        return catalogGroupSources[targetGroup] !== "firestore";
      }

      return !loadedCatalogGroups.includes(targetGroup);
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

  return (
    <SidebarMain
      hero={
        <div className={styles.HeroLayout}>
          <Welcome />
          <Season />
          <Progress />
        </div>
      }
      leftSidebar={
        sidebarVisibility.showItem ? (
          <div className={styles.MainSidebarPanel}>
            {focusItemId === -1 ? (
              <ItemSidebarSkeleton />
            ) : (
              <ItemSidebar
                collectionItem={focusItem}
                collection={focusCollection}
              />
            )}
          </div>
        ) : undefined
      }
      rightSidebar={
        sidebarVisibility.showConfig ? (
          <div className={styles.Sidebar}>
            <div className={styles.SidebarContent}>
              <ConfigSidebar />
            </div>
          </div>
        ) : undefined
      }
      main={
        <div className={styles.Content}>
          {isAuthLoading || isCatalogLoading ? (
            <LedgerSkeleton />
          ) : catalogError ? (
            <div className={styles.LoadError}>{catalogError}</div>
          ) : (
            <>
              <Ledger
                collections={filteredDb}
                openCollections={vm.openCollections}
                onClickItem={onClickItem}
                onCollectionChange={(collectionId, isOpen) => {
                  setVm((vm) => ({
                    ...vm,
                    openCollections: toggleValueInArray(
                      vm.openCollections,
                      collectionId,
                      isOpen,
                    ),
                  }));
                }}
              />
              {countAllItemsDabDb(filteredDb) === 0 && <EmptyCollection />}
            </>
          )}
        </div>
      }
    ></SidebarMain>
  );
}
