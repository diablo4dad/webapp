import { describe, expect, test } from "vitest";
import {
  getDataminedFileDescriptors,
  getDataminedFileUrl,
} from "./json";

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

  test("derives string file paths from a datamined item path", () => {
    expect(getDataminedFileDescriptors("base/meta/Item/sword_stor139.itm"))
      .toEqual([
        {
          filename: "base/meta/Item/sword_stor139.itm",
          kind: "base",
          label: "Base file",
        },
        {
          filename: "enUS_Text/meta/StringList/Item_sword_stor139.stl",
          kind: "string",
          label: "String file",
        },
        {
          filename: "enUS_Text/meta/StringList/StoreProduct_sword_stor139.stl",
          kind: "storeString",
          label: "Store string file",
        },
      ]);
  });

  test("derives string file paths from extensionless datamined item paths", () => {
    expect(getDataminedFileDescriptors("base/meta/Item/Azure_Blade"))
      .toEqual([
        {
          filename: "base/meta/Item/Azure_Blade",
          kind: "base",
          label: "Base file",
        },
        {
          filename: "enUS_Text/meta/StringList/Item_Azure_Blade.stl",
          kind: "string",
          label: "String file",
        },
        {
          filename: "enUS_Text/meta/StringList/StoreProduct_Azure_Blade.stl",
          kind: "storeString",
          label: "Store string file",
        },
      ]);
  });

  test("returns the base file descriptor for unsafe paths", () => {
    expect(getDataminedFileDescriptors("../Secrets")).toEqual([
      {
        filename: "../Secrets",
        kind: "base",
        label: "Base file",
      },
    ]);
  });
});
