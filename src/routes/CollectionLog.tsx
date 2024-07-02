import { DadDb } from "../data";
import { fetchDb } from "../server";
import { MasterGroup } from "../common";
import { strapiToDad } from "../data/transforms";
import React from "react";
import Application from "../Application";

export type Params = {
  params: {
    collectionId?: string;
  };
};

export type LoaderPayload = {
  db: DadDb;
  masterGroup: MasterGroup;
};

const slugMap: ReadonlyMap<MasterGroup, string> = new Map([
  [MasterGroup.GENERAL, "general"],
  [MasterGroup.SEASONS, "seasons"],
  [MasterGroup.SHOP_ITEMS, "store"],
  [MasterGroup.PROMOTIONAL, "promotional"],
  [MasterGroup.CHALLENGE, "challenge"],
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

export async function loader({ params }: Params): Promise<LoaderPayload> {
  const masterGroup = slugToGroup(params.collectionId ?? "general");
  const db = strapiToDad(await fetchDb(masterGroup));

  return {
    db,
    masterGroup,
  };
}

export function CollectionView() {
  return <Application />;
}
