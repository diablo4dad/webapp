import { describe, expect, test } from "vitest";
import { CharacterClass, type DadDbRef, ItemQuality } from "../../services/data";
import {
  DEFAULT_FILTERS,
  createCollectionLogReferencesByItemId,
  createSearchIndex,
  createExplorerItems,
  createStaticExplorerItems,
  filterExplorerItems,
  getItemTypeOptions,
  getItemQualityOptions,
  sortExplorerItems,
} from "./state";

const itemTypes = [
  { id: 10, name: "Helm" },
  { id: 20, name: "Mount" },
];

const dadDbRef: DadDbRef = {
  collections: [],
  itemTypes,
  items: [
    {
      id: 101,
      icon: 1001,
      itemType: 10,
      itemQuality: ItemQuality.LEGENDARY,
      name: "Weathered Helm",
      salvageable: true,
      similarItems: [102],
      usableByClass: [1, 0, 1, 0, 0, 0, 0, 0],
    },
    {
      id: 102,
      filename: "base/meta/Item/Mount_Stable",
      icon: 1002,
      invImages: [
        [1002, 1002],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ],
      isTransmog: true,
      itemType: 20,
      itemQuality: ItemQuality.RARE,
      name: "Ashen Steed",
      series: "Stable",
      usableByClass: [1, 1, 1, 1, 1, 1, 1, 1],
    },
    {
      id: 103,
      icon: 1003,
      itemType: 20,
      lohItem: true,
      name: "Unmarked Saddle",
    },
  ],
};

describe("database items", () => {
  test("creates static explorer rows", () => {
    const items = createStaticExplorerItems(dadDbRef);

    expect(items[0]).toMatchObject({
      idText: "101",
      itemTypeName: "Helm",
      source: "static",
    });
  });

  test("coalesces catalog overrides with static items", () => {
    const items = createExplorerItems(dadDbRef, [
      {
        itemId: 101,
        name: "Corrected Helm",
        salvageable: false,
      },
    ]);

    expect(items.find((item) => item.item.id === 101)).toMatchObject({
      catalogItem: {
        itemId: 101,
        name: "Corrected Helm",
      },
      item: {
        icon: 1001,
        id: 101,
        itemType: 10,
        name: "Corrected Helm",
        salvageable: false,
      },
      source: "catalog",
      staticItem: {
        name: "Weathered Helm",
      },
    });
  });

  test("adds standalone catalog items", () => {
    const items = createExplorerItems(dadDbRef, [
      {
        icon: 9001,
        itemId: 901,
        itemType: 20,
        name: "Missing Mount",
      },
    ]);

    expect(items.find((item) => item.item.id === 901)).toMatchObject({
      item: {
        icon: 9001,
        id: 901,
        itemType: 20,
        name: "Missing Mount",
      },
      itemTypeName: "Mount",
      source: "catalog",
      staticItem: undefined,
    });
  });

  test("indexes collection log references by item id", () => {
    const items = createExplorerItems({
      itemTypes,
      items: [
        {
          id: 201,
          icon: 2001,
          itemType: 10,
          itemQuality: ItemQuality.UNIQUE,
          name: "Ashava Blade",
        },
        {
          id: 202,
          icon: 2002,
          itemType: 20,
          name: "Open World Mount",
        },
      ],
    });
    const references = createCollectionLogReferencesByItemId(
      {
        itemTypes,
        collections: [
          {
            id: "monster",
            name: "Monster",
            category: "General",
            claim: "World Drop",
            collectionItems: [
              {
                claim: "World Drop",
                items: [202],
              },
            ],
            subcollections: [
              {
                id: "world-boss",
                name: "World Boss",
                category: "Monster Drop",
                claim: "World Boss Drop",
                collectionItems: [
                  {
                    claim: "World Boss Drop",
                    claimDescription: "Dropped by Ashava.",
                    items: [201, 202],
                  },
                ],
                subcollections: [],
              },
            ],
          },
        ],
      },
      items,
    );

    expect(references.get(201)).toEqual([
      {
        category: "Monster Drop",
        claim: "World Boss Drop",
        claimDescription: "Dropped by Ashava.",
        collectionId: "world-boss",
        collectionName: "Monster / World Boss",
      },
    ]);
    expect(references.get(202)).toEqual([
      {
        category: "Essential",
        claim: "World Drop",
        claimDescription: "Dropped throughout Sanctuary.",
        collectionId: "monster",
        collectionName: "Monster",
      },
      {
        category: "Monster Drop",
        claim: "World Boss Drop",
        claimDescription: "Dropped by Ashava.",
        collectionId: "world-boss",
        collectionName: "Monster / World Boss",
      },
    ]);
  });

  test("searches by item metadata", () => {
    const items = createStaticExplorerItems(dadDbRef);
    const searchIndex = createSearchIndex(items);

    expect(
      filterExplorerItems(
        items,
        {
          ...DEFAULT_FILTERS,
          searchTerm: "stable",
        },
        searchIndex,
      ).map((item) => item.item.id),
    ).toEqual([102]);
  });

  test("filters by source", () => {
    const items = createStaticExplorerItems(dadDbRef);

    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        source: "catalog",
      }),
    ).toHaveLength(0);
  });

  test("filters by class availability", () => {
    const items = createStaticExplorerItems(dadDbRef);

    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        characterClass: String(CharacterClass.BARBARIAN),
      }).map((item) => item.item.id),
    ).toEqual([101, 102, 103]);
    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        characterClass: String(CharacterClass.DRUID),
      }).map((item) => item.item.id),
    ).toEqual([102, 103]);
  });

  test("filters by item type, item quality, and flags", () => {
    const items = createStaticExplorerItems(dadDbRef);

    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        itemTypeId: "10",
        itemQuality: String(ItemQuality.LEGENDARY),
        flag: "salvageable",
      }).map((item) => item.item.id),
    ).toEqual([101]);
    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        flag: "hasVariants",
      }).map((item) => item.item.id),
    ).toEqual([102]);
    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        flag: "lordOfHatred",
      }).map((item) => item.item.id),
    ).toEqual([103]);
  });

  test("filters not set item qualities from sentinel and missing values", () => {
    const items = createStaticExplorerItems({
      itemTypes,
      items: [
        {
          id: 201,
          icon: 2001,
          itemType: 10,
          itemQuality: -1,
          name: "Sentinel Helm",
        },
        {
          id: 202,
          icon: 2002,
          itemType: 10,
          name: "Missing Quality Helm",
        },
        {
          id: 203,
          icon: 2003,
          itemType: 10,
          itemQuality: ItemQuality.MAGIC,
          name: "Magic Helm",
        },
      ],
    });

    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        itemQuality: "-1",
      }).map((item) => item.item.id),
    ).toEqual([201, 202]);
  });

  test("builds display options", () => {
    const items = createStaticExplorerItems(dadDbRef);

    expect(getItemTypeOptions(items).map((option) => option.label)).toEqual([
      "All item types",
      "Helm",
      "Mount",
    ]);
  });

  test("builds item quality options in quality order", () => {
    const items = createStaticExplorerItems({
      ...dadDbRef,
      items: [
        ...dadDbRef.items,
        {
          id: 104,
          icon: 1004,
          itemType: 10,
          itemQuality: -1,
          name: "Unset Helm",
        },
        {
          id: 105,
          icon: 1005,
          itemType: 10,
          itemQuality: ItemQuality.MAGIC,
          name: "Magic Helm",
        },
        {
          id: 106,
          icon: 1006,
          itemType: 10,
          itemQuality: ItemQuality.COMMON,
          name: "Common Helm",
        },
        {
          id: 107,
          icon: 1007,
          itemType: 10,
          itemQuality: ItemQuality.UNIQUE,
          name: "Unique Helm",
        },
        {
          id: 108,
          icon: 1008,
          itemType: 10,
          itemQuality: ItemQuality.MYTHIC,
          name: "Mythic Helm",
        },
        {
          id: 109,
          icon: 1009,
          itemType: 10,
          itemQuality: ItemQuality.TRANSMOG,
          name: "Transmog Helm",
        },
        {
          id: 110,
          icon: 1010,
          itemType: 10,
          itemQuality: ItemQuality.JUNK,
          name: "Junk Helm",
        },
        {
          id: 111,
          icon: 1011,
          itemType: 10,
          itemQuality: ItemQuality.ICONIC_MYTHIC,
          name: "Iconic Mythic Helm",
        },
      ],
    });

    expect(getItemQualityOptions(items)).toEqual([
      { label: "All item qualities", value: "all" },
      { label: "Junk", value: String(ItemQuality.JUNK) },
      { label: "Transmog", value: String(ItemQuality.TRANSMOG) },
      { label: "Common", value: String(ItemQuality.COMMON) },
      { label: "Magic", value: String(ItemQuality.MAGIC) },
      { label: "Rare", value: String(ItemQuality.RARE) },
      { label: "Legendary", value: String(ItemQuality.LEGENDARY) },
      { label: "Unique", value: String(ItemQuality.UNIQUE) },
      { label: "Mythic", value: String(ItemQuality.MYTHIC) },
      { label: "Iconic Mythic", value: String(ItemQuality.ICONIC_MYTHIC) },
      { label: "Not Set", value: "-1" },
    ]);
  });

  test("treats missing class data as available to all classes", () => {
    const items = createStaticExplorerItems(dadDbRef);

    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        characterClass: String(CharacterClass.WARLOCK),
      }).map((item) => item.item.id),
    ).toContain(103);
  });

  test("sorts by name and keeps non-alphabetic names last", () => {
    const items = createStaticExplorerItems({
      ...dadDbRef,
      items: [
        ...dadDbRef.items,
        {
          id: 104,
          icon: 1004,
          itemType: 10,
          name: "",
        },
        {
          id: 105,
          icon: 1005,
          itemType: 10,
          name: "3rd Charm",
        },
        {
          id: 106,
          icon: 1006,
          itemType: 10,
          name: "-Etched Charm",
        },
      ],
    });

    expect(sortExplorerItems(items, "nameAsc").map((item) => item.item.id))
      .toEqual([102, 103, 101, 104, 105, 106]);
    expect(sortExplorerItems(items, "nameDesc").map((item) => item.item.id))
      .toEqual([101, 103, 102, 104, 105, 106]);
    expect(sortExplorerItems(items, "none")).toBe(items);
  });
});
