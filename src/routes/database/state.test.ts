import { describe, expect, test } from "vitest";
import { CharacterClass, type DadDbRef, MagicType } from "../../services/data";
import {
  DEFAULT_FILTERS,
  createSearchIndex,
  createStaticExplorerItems,
  filterExplorerItems,
  getItemTypeOptions,
  getMagicTypeOptions,
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
      magicType: MagicType.LEGENDARY,
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
      magicType: MagicType.RARE,
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

  test("filters by item type, magic type, and flags", () => {
    const items = createStaticExplorerItems(dadDbRef);

    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        itemTypeId: "10",
        magicType: String(MagicType.LEGENDARY),
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

  test("filters not set magic types from sentinel and missing values", () => {
    const items = createStaticExplorerItems({
      itemTypes,
      items: [
        {
          id: 201,
          icon: 2001,
          itemType: 10,
          magicType: -1,
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
          magicType: MagicType.MAGIC,
          name: "Magic Helm",
        },
      ],
    });

    expect(
      filterExplorerItems(items, {
        ...DEFAULT_FILTERS,
        magicType: "-1",
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

  test("builds magic type options in quality order", () => {
    const items = createStaticExplorerItems({
      ...dadDbRef,
      items: [
        ...dadDbRef.items,
        {
          id: 104,
          icon: 1004,
          itemType: 10,
          magicType: -1,
          name: "Unset Helm",
        },
        {
          id: 105,
          icon: 1005,
          itemType: 10,
          magicType: MagicType.MAGIC,
          name: "Magic Helm",
        },
        {
          id: 106,
          icon: 1006,
          itemType: 10,
          magicType: MagicType.COMMON,
          name: "Common Helm",
        },
        {
          id: 107,
          icon: 1007,
          itemType: 10,
          magicType: MagicType.UNIQUE,
          name: "Unique Helm",
        },
        {
          id: 108,
          icon: 1008,
          itemType: 10,
          magicType: MagicType.MYTHIC,
          name: "Mythic Helm",
        },
      ],
    });

    expect(getMagicTypeOptions(items)).toEqual([
      { label: "All magic types", value: "all" },
      { label: "Common", value: String(MagicType.COMMON) },
      { label: "Magic", value: String(MagicType.MAGIC) },
      { label: "Rare", value: String(MagicType.RARE) },
      { label: "Legendary", value: String(MagicType.LEGENDARY) },
      { label: "Unique", value: String(MagicType.UNIQUE) },
      { label: "Mythic", value: String(MagicType.MYTHIC) },
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
