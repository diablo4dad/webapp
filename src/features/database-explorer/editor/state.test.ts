import { describe, expect, test } from "vitest";
import {
  CharacterClass,
  ItemQuality,
  Zone,
  type ItemType,
} from "../../../services/data";
import {
  OVERRIDE_INITIAL_FORM,
  applyImportedItemDraft,
  buildOverrideWrite,
  buildStandaloneWrite,
  createOverrideForm,
  hasOverrideFormChanges,
  hasStandaloneFormChanges,
  STANDALONE_INITIAL_FORM,
} from "./state";

describe("database item override state", () => {
  test("creates override form values from existing overrides", () => {
    expect(
      createOverrideForm({
        itemId: 101,
        itemQuality: ItemQuality.RARE,
        name: "Corrected Helm",
        usableByClass: usableByClasses(CharacterClass.BARBARIAN),
      }),
    ).toMatchObject({
      hasUsableByClassOverride: true,
      itemQuality: String(ItemQuality.RARE),
      name: "Corrected Helm",
      usableByClass: usableByClasses(CharacterClass.BARBARIAN),
    });
  });

  test("builds override writes from predefined fields", () => {
    expect(
      buildOverrideWrite(101, {
        ...OVERRIDE_INITIAL_FORM,
        description: "Corrected description.",
        itemType: "20",
        itemQuality: String(ItemQuality.RARE),
        name: "Corrected Helm",
        preferredZone: String(Zone.NAHANTU),
        series: "Correction Series",
        transmogName: "Corrected Skin",
        hasUsableByClassOverride: true,
        usableByClass: usableByClasses(
          CharacterClass.BARBARIAN,
          CharacterClass.DRUID,
        ),
      }),
    ).toEqual({
      description: "Corrected description.",
      itemId: 101,
      itemType: 20,
      itemQuality: ItemQuality.RARE,
      name: "Corrected Helm",
      preferredZone: Zone.NAHANTU,
      series: "Correction Series",
      transmogName: "Corrected Skin",
      usableByClass: usableByClasses(
        CharacterClass.BARBARIAN,
        CharacterClass.DRUID,
      ),
    });
  });

  test("preserves unsupported existing override fields", () => {
    expect(
      buildOverrideWrite(
        101,
        {
          ...OVERRIDE_INITIAL_FORM,
          name: "Corrected Helm",
        },
        {
          isTransmog: false,
          itemId: 101,
          name: "Old Helm",
          salvageable: true,
          similarItems: [202],
          usableByClass: usableByClasses(CharacterClass.BARBARIAN),
        },
      ),
    ).toEqual({
      isTransmog: false,
      itemId: 101,
      name: "Corrected Helm",
      salvageable: true,
      similarItems: [202],
    });
  });

  test("omits blank override fields", () => {
    expect(
      buildOverrideWrite(101, {
        ...OVERRIDE_INITIAL_FORM,
        name: " ",
      }),
    ).toEqual({
      itemId: 101,
    });
  });

  test("detects override form changes against the initial form", () => {
    const initialForm = createOverrideForm({
      itemId: 101,
      name: "Corrected Helm",
      usableByClass: usableByClasses(CharacterClass.BARBARIAN),
    });

    expect(hasOverrideFormChanges(initialForm, initialForm)).toBe(false);
    expect(hasOverrideFormChanges(
      {
        ...initialForm,
        name: "Corrected Crown",
      },
      initialForm,
    )).toBe(true);
    expect(hasOverrideFormChanges(
      {
        ...initialForm,
        usableByClass: usableByClasses(CharacterClass.DRUID),
      },
      initialForm,
    )).toBe(true);
  });
});

describe("standalone database item state", () => {
  test("builds standalone item writes from predefined fields", () => {
    expect(
      buildStandaloneWrite(
        {
          ...STANDALONE_INITIAL_FORM,
          description: "A missing blade.",
          icon: "3001",
          itemId: "901",
          itemType: "20",
          itemQuality: String(ItemQuality.RARE),
          name: "Missing Mount",
          preferredZone: String(Zone.NAHANTU),
          series: "Imported Series",
          transmogName: "Missing Skin",
          usableByClass: usableByClasses(CharacterClass.ROGUE),
        },
        {
          existingItemIds: [100],
        },
      ),
    ).toEqual({
      description: "A missing blade.",
      icon: 3001,
      itemId: 901,
      itemType: 20,
      itemQuality: ItemQuality.RARE,
      name: "Missing Mount",
      preferredZone: Zone.NAHANTU,
      series: "Imported Series",
      transmogName: "Missing Skin",
      usableByClass: usableByClasses(CharacterClass.ROGUE),
    });
  });

  test("generates a custom item id when none was imported", () => {
    expect(
      buildStandaloneWrite(
        {
          ...STANDALONE_INITIAL_FORM,
          icon: "3001",
          itemType: "20",
          name: "Missing Mount",
        },
        {
          existingItemIds: [551234, 551235],
          random: () => 0.1234,
        },
      ),
    ).toMatchObject({
      itemId: 551236,
      usableByClass: usableByClasses(
        CharacterClass.SORCERER,
        CharacterClass.DRUID,
        CharacterClass.BARBARIAN,
        CharacterClass.ROGUE,
        CharacterClass.NECROMANCER,
        CharacterClass.SPIRITBORN,
        CharacterClass.PALADIN,
        CharacterClass.WARLOCK,
      ),
    });
  });

  test("rejects imported item ids that already exist", () => {
    expect(() =>
      buildStandaloneWrite(
        {
          ...STANDALONE_INITIAL_FORM,
          icon: "3001",
          itemId: "901",
          itemType: "20",
          name: "Missing Mount",
        },
        {
          existingItemIds: [901],
        },
      ),
    ).toThrow("Item ID already exists.");
  });

  test("requires a name for standalone items", () => {
    expect(() =>
      buildStandaloneWrite({
        ...STANDALONE_INITIAL_FORM,
        icon: "3001",
        itemId: "901",
        itemType: "20",
      }),
    ).toThrow("Name is required.");
  });

  test("applies imported item values to the create form", () => {
    const itemTypes: ItemType[] = [
      {
        id: 10,
        name: "Sword",
      },
      {
        id: 20,
        name: "Dagger",
      },
    ];

    expect(
      applyImportedItemDraft(
        {
          ...STANDALONE_INITIAL_FORM,
          description: "Keep this description.",
        },
        {
          icon: {
            dataUrl: "data:image/png;base64,aWNvbg==",
          },
          item: {
            description: "A rare dagger.",
            id: 784786,
            itemQuality: ItemQuality.RARE,
            name: "Anlace",
            usableByClass: usableByClasses(CharacterClass.ROGUE),
          },
          itemTypeName: "Dagger",
        },
        itemTypes,
      ),
    ).toMatchObject({
      description: "Keep this description.",
      iconPreviewUrl: "data:image/png;base64,aWNvbg==",
      itemId: "784786",
      itemType: "20",
      itemQuality: String(ItemQuality.RARE),
      name: "Anlace",
      usableByClass: usableByClasses(CharacterClass.ROGUE),
    });
  });

  test("detects standalone form changes from the empty initial form", () => {
    expect(hasStandaloneFormChanges(STANDALONE_INITIAL_FORM)).toBe(false);
    expect(hasStandaloneFormChanges({
      ...STANDALONE_INITIAL_FORM,
      name: "Missing Mount",
    })).toBe(true);
    expect(hasStandaloneFormChanges({
      ...STANDALONE_INITIAL_FORM,
      usableByClass: usableByClasses(CharacterClass.BARBARIAN),
    })).toBe(true);
  });
});

function usableByClasses(...classes: CharacterClass[]): number[] {
  const usableByClass = Array(8).fill(0);

  classes.forEach((characterClass) => {
    usableByClass[characterClass] = 1;
  });

  return usableByClass;
}
