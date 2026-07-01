import { MasterGroup } from "../../common";

const GENERAL_SLUG = "general";
const SEASONS_SLUG = "seasons";
const STORE_SLUG = "store";
const PROMOTIONAL_SLUG = "promotional";
const CHALLENGES_SLUG = "challenges";
const UNIVERSAL_SLUG = "universal";

const DEFAULT_GROUP = MasterGroup.GENERAL;
const DEFAULT_SLUG = GENERAL_SLUG;

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

function slugToGroup(slug: string): MasterGroup {
  return slugMapInverse.get(slug) ?? DEFAULT_GROUP;
}

function groupToSlug(group: MasterGroup): string {
  return slugMap.get(group) ?? DEFAULT_SLUG;
}

function generateUrl(group: MasterGroup): string {
  return `/transmogs/${groupToSlug(group)}`;
}

export {
  CHALLENGES_SLUG,
  DEFAULT_GROUP,
  DEFAULT_SLUG,
  GENERAL_SLUG,
  PROMOTIONAL_SLUG,
  SEASONS_SLUG,
  STORE_SLUG,
  UNIVERSAL_SLUG,
  generateUrl,
  groupToSlug,
  slugToGroup,
};
