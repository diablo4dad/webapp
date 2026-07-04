import { describe, expect, test } from "vitest";
import { getSeasonViewModel } from "./view-model";

describe("season view model", () => {
  test("returns season 14 metadata by number", () => {
    expect(getSeasonViewModel(14)).toMatchObject({
      name: "Season of Death Awakening",
      title: "Season 14",
    });
  });

  test("returns season 13 metadata by number", () => {
    expect(getSeasonViewModel(13)).toMatchObject({
      name: "Season of Reckoning",
      title: "Season 13",
    });
  });

  test("returns undefined for unknown seasons", () => {
    expect(getSeasonViewModel(99)).toBeUndefined();
  });
});
