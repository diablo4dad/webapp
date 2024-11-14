import { DadDb } from "../data";
import { MasterGroup } from "../common";
import React, { useEffect } from "react";
import Application from "../app/Application";
import { defer, useLoaderData } from "react-router-dom";
import { useData } from "../data/context";
import { hydrateDadDb } from "../data/factory";

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
  const { db, group } = useLoaderData() as LoaderPayload;
  const { switchDb, setDb } = useData();

  useEffect(() => {
    let cancelled = false;

    db.then((resolvedDb) => {
      if (!cancelled) {
        setDb(resolvedDb);
        switchDb(group);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [db, setDb, group, switchDb]);

  return <Application />;
}
