import { MasterGroup } from "../../common";
import { DEFAULT_GROUP, SEASONS_SLUG } from "./links";
import { loader } from "./loader";

describe("loader", () => {
  test("resolves groups", async () => {
    await expect(
      loader({ params: { collectionId: SEASONS_SLUG } }),
    ).resolves.toEqual({
      group: MasterGroup.SEASONS,
    });
  });

  test("defaults missing params", async () => {
    await expect(loader({ params: {} })).resolves.toEqual({
      group: DEFAULT_GROUP,
    });
  });

  test("defaults unknown params", async () => {
    await expect(
      loader({ params: { collectionId: "missing" } }),
    ).resolves.toEqual({
      group: DEFAULT_GROUP,
    });
  });
});
