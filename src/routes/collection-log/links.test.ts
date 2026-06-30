import { MasterGroup } from "../../common";
import {
  CHALLENGES_SLUG,
  DEFAULT_GROUP,
  DEFAULT_SLUG,
  generateUrl,
  GENERAL_SLUG,
  groupToSlug,
  PROMOTIONAL_SLUG,
  SEASONS_SLUG,
  slugToGroup,
  STORE_SLUG,
  UNIVERSAL_SLUG,
} from "./links";

describe("route links", () => {
  test.each([
    [MasterGroup.GENERAL, GENERAL_SLUG],
    [MasterGroup.SEASONS, SEASONS_SLUG],
    [MasterGroup.SHOP_ITEMS, STORE_SLUG],
    [MasterGroup.PROMOTIONAL, PROMOTIONAL_SLUG],
    [MasterGroup.CHALLENGE, CHALLENGES_SLUG],
    [MasterGroup.UNIVERSAL, UNIVERSAL_SLUG],
  ])("maps %s to the %s slug", (group, slug) => {
    expect(groupToSlug(group)).toBe(slug);
    expect(slugToGroup(slug)).toBe(group);
    expect(generateUrl(group)).toBe(`/transmogs/${slug}`);
  });

  test("defaults unknown slugs", () => {
    expect(slugToGroup("missing")).toBe(DEFAULT_GROUP);
  });

  test("defaults unknown groups", () => {
    expect(groupToSlug(999 as unknown as MasterGroup)).toBe(DEFAULT_SLUG);
  });
});
