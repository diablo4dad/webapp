import { MasterGroup } from "../../common";

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
