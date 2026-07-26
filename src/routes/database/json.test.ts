import { describe, expect, test } from "vitest";
import { getDataminedFileUrl } from "./json";

describe("datamined json urls", () => {
  test("builds encoded Github raw URLs for datamined file paths", () => {
    expect(getDataminedFileUrl("base/meta/Item/Axe Bad Data.emb"))
      .toBe(
        "https://raw.githubusercontent.com/DiabloTools/d4data/master/json/base/meta/Item/Axe%20Bad%20Data.emb.json",
      );
  });

  test("rejects unsafe datamined file paths", () => {
    const unsafeFilenames = [
      "",
      "/base/meta/Item/Azure_Blade",
      "base/ /Item/Azure_Blade",
      "base/meta/../Secrets",
      "base\\meta\\Item\\Azure_Blade",
      "https://raw.githubusercontent.com/example/repo/file",
      "base/meta/Item/Azure_Blade?raw=1",
      "base/meta/Item/Azure_Blade#fragment",
    ];

    for (const filename of unsafeFilenames) {
      expect(() => getDataminedFileUrl(filename)).toThrow(
        "Invalid datamined file reference.",
      );
    }
  });
});
