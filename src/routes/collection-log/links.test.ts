import { MasterGroup } from "../../common";
import { generateUrl, groupToSlug, slugToGroup } from "./links";

describe("route links", () => {
  test.each([
    [MasterGroup.GENERAL, "general"],
    [MasterGroup.SEASONS, "seasons"],
    [MasterGroup.SHOP_ITEMS, "store"],
    [MasterGroup.PROMOTIONAL, "promotional"],
    [MasterGroup.CHALLENGE, "challenges"],
    [MasterGroup.UNIVERSAL, "universal"],
  ])("maps %s to the %s slug", (group, slug) => {
    expect(groupToSlug(group)).toBe(slug);
    expect(slugToGroup(slug)).toBe(group);
    expect(generateUrl(group)).toBe(`/transmogs/${slug}`);
  });

  test("defaults unknown slugs", () => {
    expect(slugToGroup("missing")).toBe(MasterGroup.GENERAL);
  });
});
