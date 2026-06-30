import { MasterGroup } from "../../common";

export const GENERAL_SLUG = "general";
export const SEASONS_SLUG = "seasons";
export const STORE_SLUG = "store";
export const PROMOTIONAL_SLUG = "promotional";
export const CHALLENGES_SLUG = "challenges";
export const UNIVERSAL_SLUG = "universal";

export const DEFAULT_GROUP = MasterGroup.GENERAL;
export const DEFAULT_SLUG = GENERAL_SLUG;

const slugMap: ReadonlyMap<MasterGroup, string> = new Map([
  [MasterGroup.GENERAL, GENERAL_SLUG],
  [MasterGroup.SEASONS, SEASONS_SLUG],
  [MasterGroup.SHOP_ITEMS, STORE_SLUG],
  [MasterGroup.PROMOTIONAL, PROMOTIONAL_SLUG],
  [MasterGroup.CHALLENGE, CHALLENGES_SLUG],
  [MasterGroup.UNIVERSAL, UNIVERSAL_SLUG],
]);

const slugMapInverse: ReadonlyMap<string, MasterGroup> = new Map(
  Array.from(slugMap, (a) => a.reverse() as [string, MasterGroup]),
);

export function slugToGroup(slug: string): MasterGroup {
  return slugMapInverse.get(slug) ?? DEFAULT_GROUP;
}

export function groupToSlug(group: MasterGroup): string {
  return slugMap.get(group) ?? DEFAULT_SLUG;
}

export function generateUrl(group: MasterGroup): string {
  return `/transmogs/${groupToSlug(group)}`;
}
