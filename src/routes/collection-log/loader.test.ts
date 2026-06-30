import { MasterGroup } from "../../common";
import { loader } from "./loader";

describe("loader", () => {
  test("resolves groups", async () => {
    await expect(
      loader({ params: { collectionId: "seasons" } }),
    ).resolves.toEqual({
      group: MasterGroup.SEASONS,
    });
  });

  test("defaults missing params", async () => {
    await expect(loader({ params: {} })).resolves.toEqual({
      group: MasterGroup.GENERAL,
    });
  });

  test("defaults unknown params", async () => {
    await expect(
      loader({ params: { collectionId: "missing" } }),
    ).resolves.toEqual({
      group: MasterGroup.GENERAL,
    });
  });
});
