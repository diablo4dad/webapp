import { describe, expect, test } from "vitest";
import itemImport from "./item-import.js";

const {
  getImportedItemImageUrl,
  parseImportedItemPage,
} = itemImport;

describe("item import parser", () => {
  test("prefers the item tooltip icon over generic page images", () => {
    const result = parseImportedItemPage(
      `
        <meta property="og:title" content="Anlace - Diablo 4">
        <meta property="og:image" content="https://wow.zamimg.com/images/logos/share-icon.png">
        <h1 class="heading-size-1">Anlace</h1>
        <div class="wowhead-tooltip" data-type="d4-item">
          <div class="whtt-header-icon"
            style="background-image: url(&quot;https://wow.zamimg.com/d4/d4/texture/hash/233/2094985449.webp&quot;)">
          </div>
          <div class="whtt-item-type">Rare Dagger</div>
          <div class="whtt-item-power">750 Item Power</div>
          <img class="d4-icon-token" src="https://wow.zamimg.com/d4/d4/texture/hash/164/4189602212.webp">
        </div>
      `,
      new URL("https://www.wowhead.com/diablo-4/item/anlace-784786"),
    );

    expect(result.iconUrl)
      .toBe("https://wow.zamimg.com/d4/d4/texture/hash/233/2094985449.webp");
    expect(result.item).toMatchObject({
      id: 784786,
      magicType: 5,
      name: "Anlace",
    });
    expect(result.itemTypeName).toBe("Dagger");
  });

  test("decodes imported item names without copying descriptions", () => {
    const result = parseImportedItemPage(
      `
        <meta property="og:title" content="Asheara&apos;s Khanjar - Diablo 4">
        <meta name="description" content="Do not copy this text.">
      `,
      new URL(
        "https://www.wowhead.com/diablo-4/item/ashearas-khanjar-123456",
      ),
    );

    expect(result.item).toEqual({
      id: 123456,
      name: "Asheara's Khanjar",
    });
  });

  test("parses usable classes from imported item requirements", () => {
    const result = parseImportedItemPage(
      `
        <meta property="og:title" content="Stor071 - Diablo 4">
        <div class="wowhead-tooltip" data-type="d4-item">
          <div>Legendary Two-Handed Sword</div>
          <div>925 Item Power</div>
          <div>Requires Level 73 Barbarian, Necromancer, Paladin, Warlock</div>
        </div>
      `,
      new URL(
        "https://www.wowhead.com/diablo-4/item/twohandsword-stor071-2470997",
      ),
    );

    expect(result.item.usableByClass).toEqual([
      0,
      0,
      1,
      0,
      1,
      0,
      1,
      1,
    ]);
  });

  test("allows imported item images only from supported HTTPS image hosts", () => {
    const baseUrl = new URL(
      "https://www.wowhead.com/diablo-4/item/anlace-784786",
    );

    expect(getImportedItemImageUrl(
      "https://wow.zamimg.com/d4/d4/texture/hash/233/2094985449.webp",
      baseUrl,
    )).toBe(
      "https://wow.zamimg.com/d4/d4/texture/hash/233/2094985449.webp",
    );
    expect(getImportedItemImageUrl(
      "//wow.zamimg.com/d4/d4/texture/hash/233/2094985449.webp",
      baseUrl,
    )).toBe(
      "https://wow.zamimg.com/d4/d4/texture/hash/233/2094985449.webp",
    );
    expect(getImportedItemImageUrl("http://wow.zamimg.com/icon.webp", baseUrl))
      .toBeUndefined();
    expect(getImportedItemImageUrl(
      "https://wow.zamimg.com.evil.test/icon.webp",
      baseUrl,
    )).toBeUndefined();
    expect(getImportedItemImageUrl(
      "https://127.0.0.1/icon.webp",
      baseUrl,
    )).toBeUndefined();
  });
});
