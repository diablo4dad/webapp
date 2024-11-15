import EmptyCollection from "../collection/EmptyCollection";
import Ledger from "../collection/Ledger";
import LedgerSkeleton from "../collection/LedgerSkeleton";
import { toggleValueInArray } from "../common/arrays";
import { Collection, CollectionItem, DadDb } from "../data";
import { MasterGroup, SideBarType } from "../common";
import React, { Suspense, useEffect, useState } from "react";
import { countAllItemsDabDb } from "../data/aggregate";
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
  const { filteredDb, db, switchDb, setDb, setFocusItemId } = useData();
  const [vm, setVm] = useState<ViewModel>(getViewModel());

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
    // setSideBar(SideBarType.ITEM);
  }

  return (
    <>
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
    </>
  );
}
