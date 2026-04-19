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
import { CollectionItem, DadDb } from "../data";
import { MasterGroup } from "../common";
import React, { Suspense, useEffect, useState } from "react";
import { countAllItemsDabDb } from "../data/aggregate";
import { selectItemOrDefault } from "../data/reducers";
import SidebarMain from "../layout/SidebarMain";
import { getViewModel, saveViewModel } from "../store/local";
import { Await, defer, useLoaderData } from "react-router-dom";
import { useData } from "../data/context";
import { hydrateDadDb } from "../data/factory";

export type ViewModel = {
  openCollections: number[];
};

export type Params = {
  params: {
    collectionId?: string;
  };
};

export type LoaderPayload = {
  db: Promise<DadDb>;
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
  return slugMapInverse.get(slug) ?? MasterGroup.UNIVERSAL;
}

export function groupToSlug(group: MasterGroup): string {
  return slugMap.get(group) ?? "universal";
}

export function generateUrl(group: MasterGroup): string {
  return `/transmogs/${groupToSlug(group)}`;
}

export async function loader({ params }: Params) {
  const group = slugToGroup(params.collectionId ?? "universal");
  const db = fetch("/d4dad.json")
    .then((resp) => resp.json())
    .then(hydrateDadDb);

  return defer({
    db,
    group,
  });
}

export function CollectionView() {
  const { db: dbPromise, group } = useLoaderData() as LoaderPayload;
  const {
    filteredDb,
    db,
    switchDb,
    setDb,
    setFocusItemId,
    focusItemId,
    sidebarVisibility,
  } = useData();
  const [vm, setVm] = useState<ViewModel>(getViewModel());
  const focusItem = selectItemOrDefault(db.collections, focusItemId);

  switchDb(group);
  saveViewModel(vm);

  useEffect(() => {
    let cancelled = false;

    dbPromise.then((resolvedDb) => {
      if (!cancelled) {
        setDb(resolvedDb);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [db, setDb, group, switchDb]);

  function onClickItem(collectionItem: CollectionItem) {
    setFocusItemId(collectionItem.id);
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
              <ItemSidebar collectionItem={focusItem} />
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
          <Suspense fallback={<LedgerSkeleton />}>
            <Await resolve={dbPromise}>
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
            </Await>
          </Suspense>
        </div>
      }
    ></SidebarMain>
  );
}
