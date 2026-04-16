import {
  BooleanOption,
  LedgerView,
  NumberOption,
  Option,
  Settings,
} from "./type";
import { SettingsAction, SettingsActionType } from "./context";
import { ChangeEvent } from "react";
import { OptionWidgetGroup, WidgetType } from "../common/widget";
import { ItemGroup, MasterGroup, itemGroups } from "../common";
import { isEnabled, isLedgerView } from "./predicate";
import { getNumberValue } from "./accessor";
import { enumKeys } from "../common/enums";
import { CharacterClass, CharacterGender, CollectionGroup } from "../data";
import i18n from "../i18n";
import { CollectionLog } from "../collection/type";
import { filterDb } from "../data/filters";
import { countAllItemsDabDb } from "../data/aggregate";
import GeneralIcon from "../image/icons/goblin.webp";
import CashShopIcon from "../image/icons/purse.webp";
import PromoIcon from "../image/icons/chest.webp";
import SeasonIcon from "../image/icons/season.webp";
import ChallengeIcon from "../image/icons/dungeon.webp";
import GlobalIcon from "../image/icons/wardrobe.webp";

const collectionMeta = new Map([
  [MasterGroup.GENERAL, { label: "Essential Collection", icon: GeneralIcon }],
  [MasterGroup.SEASONS, { label: "Seasons", icon: SeasonIcon }],
  [MasterGroup.CHALLENGE, { label: "Challenges", icon: ChallengeIcon }],
  [MasterGroup.SHOP_ITEMS, { label: "Tejal's Shop", icon: CashShopIcon }],
  [MasterGroup.PROMOTIONAL, { label: "Promotional", icon: PromoIcon }],
  [MasterGroup.UNIVERSAL, { label: "Universal", icon: GlobalIcon }],
]);

const itemOptions = [
  Option.SHOW_MOUNTS,
  Option.SHOW_HORSE_ARMOR,
  Option.SHOW_TROPHIES,
  Option.SHOW_BACK_TROPHIES,
  Option.SHOW_ARMOR,
  Option.SHOW_WEAPONS,
  Option.SHOW_MARKINGS,
  Option.SHOW_EMOTES,
  Option.SHOW_PORTALS,
  Option.SHOW_HEADSTONES,
  Option.SHOW_EMBLEMS,
  Option.SHOW_TITLES,
  Option.SHOW_PETS,
] as const satisfies ReadonlyArray<BooleanOption>;

const classOptions = [
  Option.SHOW_SORCERER,
  Option.SHOW_DRUID,
  Option.SHOW_BARBARIAN,
  Option.SHOW_ROGUE,
  Option.SHOW_NECROMANCER,
  Option.SHOW_SPIRITBORN,
  Option.SHOW_PALADIN,
] as const satisfies ReadonlyArray<BooleanOption>;

const itemOptionGroupMap = new Map<BooleanOption, ItemGroup>([
  [Option.SHOW_MOUNTS, ItemGroup.MOUNTS],
  [Option.SHOW_HORSE_ARMOR, ItemGroup.HORSE_ARMOR],
  [Option.SHOW_TROPHIES, ItemGroup.TROPHIES],
  [Option.SHOW_BACK_TROPHIES, ItemGroup.BACK_TROPHIES],
  [Option.SHOW_ARMOR, ItemGroup.ARMOR],
  [Option.SHOW_WEAPONS, ItemGroup.WEAPONS],
  [Option.SHOW_MARKINGS, ItemGroup.BODY],
  [Option.SHOW_EMOTES, ItemGroup.EMOTES],
  [Option.SHOW_PORTALS, ItemGroup.TOWN_PORTALS],
  [Option.SHOW_HEADSTONES, ItemGroup.HEADSTONES],
  [Option.SHOW_EMBLEMS, ItemGroup.EMBLEMS],
  [Option.SHOW_TITLES, ItemGroup.PLAYER_TITLES],
  [Option.SHOW_PETS, ItemGroup.PETS],
]);

const classOptionMap = new Map<BooleanOption, CharacterClass>([
  [Option.SHOW_SORCERER, CharacterClass.SORCERER],
  [Option.SHOW_DRUID, CharacterClass.DRUID],
  [Option.SHOW_BARBARIAN, CharacterClass.BARBARIAN],
  [Option.SHOW_ROGUE, CharacterClass.ROGUE],
  [Option.SHOW_NECROMANCER, CharacterClass.NECROMANCER],
  [Option.SHOW_SPIRITBORN, CharacterClass.SPIRITBORN],
  [Option.SHOW_PALADIN, CharacterClass.PALADIN],
]);

function createBooleanAction(
  option: BooleanOption,
): (e: ChangeEvent<HTMLInputElement>) => SettingsAction {
  return (e: ChangeEvent<HTMLInputElement>) =>
    createBooleanUpdateAction(option, e.target.checked);
}

function createBooleanUpdateAction(
  option: BooleanOption,
  value: boolean,
): SettingsAction {
  return {
    type: SettingsActionType.UPDATE,
    option,
    value,
  };
}

function createChoiceAction(
  option: NumberOption,
): (e: ChangeEvent<HTMLSelectElement>) => SettingsAction {
  return (e: ChangeEvent<HTMLSelectElement>) => ({
    type: SettingsActionType.UPDATE,
    option: option,
    value: Number(e.target.value),
  });
}

function createBooleanToggleAction(
  option: BooleanOption,
): (settings: Settings) => SettingsAction {
  return (settings: Settings) =>
    createBooleanUpdateAction(option, !isEnabled(settings, option));
}

function createBooleanChecked(
  option: BooleanOption,
): (settings: Settings) => boolean {
  return (settings: Settings) => {
    return isEnabled(settings, option);
  };
}

function createNumberSelected(
  option: NumberOption,
): (settings: Settings) => number {
  return (settings: Settings) => {
    return getNumberValue(settings, option);
  };
}

function resetBooleanOptions(
  settings: Settings,
  options: readonly BooleanOption[],
): Settings {
  const nextSettings: Settings = { ...settings };

  for (const option of options) {
    nextSettings[option] = false;
  }

  return nextSettings;
}

function createItemTypeCount(
  option: BooleanOption,
): (
  collections: CollectionGroup,
  settings: Settings,
  log: CollectionLog,
  group: MasterGroup,
) => number {
  return (
    collections: CollectionGroup,
    settings: Settings,
    log: CollectionLog,
    group: MasterGroup,
  ) => {
    const isolatedSettings = resetBooleanOptions(settings, itemOptions);
    const itemGroup = itemOptionGroupMap.get(option);

    if (
      itemGroup === undefined ||
      (itemGroups.get(itemGroup) ?? []).length === 0
    ) {
      return 0;
    }

    const countedDb = filterDb(
      collections,
      {
        ...isolatedSettings,
        [option]: true,
      },
      log,
      group,
      null,
      true,
    );

    return countAllItemsDabDb(countedDb);
  };
}

function createClassTypeCount(
  option: BooleanOption,
): (
  collections: CollectionGroup,
  settings: Settings,
  log: CollectionLog,
  group: MasterGroup,
) => number {
  return (
    collections: CollectionGroup,
    settings: Settings,
    log: CollectionLog,
    group: MasterGroup,
  ) => {
    const isolatedSettings = resetBooleanOptions(settings, classOptions);
    const characterClass = classOptionMap.get(option);

    if (characterClass === undefined) {
      return 0;
    }

    const countedDb = filterDb(
      collections,
      {
        ...isolatedSettings,
        [option]: true,
      },
      log,
      group,
      null,
      true,
    );

    return countAllItemsDabDb(countedDb);
  };
}

export const groups: ReadonlyArray<OptionWidgetGroup> = [
  {
    label: "Collections",
    widgets: Array.from(collectionMeta.entries()).map(([group, meta]) => ({
      type: WidgetType.COLLECTION_FILTER,
      option: group,
      group,
      label: meta.label,
      icon: meta.icon,
      selected: (activeGroup: MasterGroup) => activeGroup === group,
    })),
  },
  {
    label: "Categories",
    widgets: [
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_SHOP,
        label: "Shop",
        action: createBooleanAction(Option.SHOW_SHOP),
        checked: createBooleanChecked(Option.SHOW_SHOP),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_BATTLE_PASS,
        label: "Battle Pass",
        action: createBooleanAction(Option.SHOW_BATTLE_PASS),
        checked: createBooleanChecked(Option.SHOW_BATTLE_PASS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_BATTLE_PASS_ACCELERATED,
        label: "Battle Pass Accelerated",
        action: createBooleanAction(Option.SHOW_BATTLE_PASS_ACCELERATED),
        checked: createBooleanChecked(Option.SHOW_BATTLE_PASS_ACCELERATED),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_PROMOTIONAL,
        label: "Promotional",
        action: createBooleanAction(Option.SHOW_PROMOTIONAL),
        checked: createBooleanChecked(Option.SHOW_PROMOTIONAL),
      },
    ],
  },
  {
    label: "Items",
    widgets: [
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_MOUNTS,
        label: "Mounts",
        action: createBooleanToggleAction(Option.SHOW_MOUNTS),
        checked: createBooleanChecked(Option.SHOW_MOUNTS),
        count: createItemTypeCount(Option.SHOW_MOUNTS),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_HORSE_ARMOR,
        label: "Horse Armor",
        action: createBooleanToggleAction(Option.SHOW_HORSE_ARMOR),
        checked: createBooleanChecked(Option.SHOW_HORSE_ARMOR),
        count: createItemTypeCount(Option.SHOW_HORSE_ARMOR),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_TROPHIES,
        label: "Trophies",
        action: createBooleanToggleAction(Option.SHOW_TROPHIES),
        checked: createBooleanChecked(Option.SHOW_TROPHIES),
        count: createItemTypeCount(Option.SHOW_TROPHIES),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_BACK_TROPHIES,
        label: "Back Trophies",
        action: createBooleanToggleAction(Option.SHOW_BACK_TROPHIES),
        checked: createBooleanChecked(Option.SHOW_BACK_TROPHIES),
        count: createItemTypeCount(Option.SHOW_BACK_TROPHIES),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_ARMOR,
        label: "Armor",
        action: createBooleanToggleAction(Option.SHOW_ARMOR),
        checked: createBooleanChecked(Option.SHOW_ARMOR),
        count: createItemTypeCount(Option.SHOW_ARMOR),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_WEAPONS,
        label: "Weapons",
        action: createBooleanToggleAction(Option.SHOW_WEAPONS),
        checked: createBooleanChecked(Option.SHOW_WEAPONS),
        count: createItemTypeCount(Option.SHOW_WEAPONS),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_MARKINGS,
        label: "Body Markings",
        action: createBooleanToggleAction(Option.SHOW_MARKINGS),
        checked: createBooleanChecked(Option.SHOW_MARKINGS),
        count: createItemTypeCount(Option.SHOW_MARKINGS),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_EMOTES,
        label: "Emotes",
        action: createBooleanToggleAction(Option.SHOW_EMOTES),
        checked: createBooleanChecked(Option.SHOW_EMOTES),
        count: createItemTypeCount(Option.SHOW_EMOTES),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_PORTALS,
        label: "Town Portals",
        action: createBooleanToggleAction(Option.SHOW_PORTALS),
        checked: createBooleanChecked(Option.SHOW_PORTALS),
        count: createItemTypeCount(Option.SHOW_PORTALS),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_HEADSTONES,
        label: "Headstones",
        action: createBooleanToggleAction(Option.SHOW_HEADSTONES),
        checked: createBooleanChecked(Option.SHOW_HEADSTONES),
        count: createItemTypeCount(Option.SHOW_HEADSTONES),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_EMBLEMS,
        label: "Emblems",
        action: createBooleanToggleAction(Option.SHOW_EMBLEMS),
        checked: createBooleanChecked(Option.SHOW_EMBLEMS),
        count: createItemTypeCount(Option.SHOW_EMBLEMS),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_TITLES,
        label: "Player Titles",
        action: createBooleanToggleAction(Option.SHOW_TITLES),
        checked: createBooleanChecked(Option.SHOW_TITLES),
        count: createItemTypeCount(Option.SHOW_TITLES),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_PETS,
        label: "Pets",
        action: createBooleanToggleAction(Option.SHOW_PETS),
        checked: createBooleanChecked(Option.SHOW_PETS),
        count: createItemTypeCount(Option.SHOW_PETS),
      },
    ],
  },
  {
    label: "Classes",
    widgets: [
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_SORCERER,
        label: "Sorcerer",
        action: createBooleanToggleAction(Option.SHOW_SORCERER),
        checked: createBooleanChecked(Option.SHOW_SORCERER),
        count: createClassTypeCount(Option.SHOW_SORCERER),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_DRUID,
        label: "Druid",
        action: createBooleanToggleAction(Option.SHOW_DRUID),
        checked: createBooleanChecked(Option.SHOW_DRUID),
        count: createClassTypeCount(Option.SHOW_DRUID),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_BARBARIAN,
        label: "Barbarian",
        action: createBooleanToggleAction(Option.SHOW_BARBARIAN),
        checked: createBooleanChecked(Option.SHOW_BARBARIAN),
        count: createClassTypeCount(Option.SHOW_BARBARIAN),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_ROGUE,
        label: "Rogue",
        action: createBooleanToggleAction(Option.SHOW_ROGUE),
        checked: createBooleanChecked(Option.SHOW_ROGUE),
        count: createClassTypeCount(Option.SHOW_ROGUE),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_NECROMANCER,
        label: "Necromancer",
        action: createBooleanToggleAction(Option.SHOW_NECROMANCER),
        checked: createBooleanChecked(Option.SHOW_NECROMANCER),
        count: createClassTypeCount(Option.SHOW_NECROMANCER),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_SPIRITBORN,
        label: "Spiritborn",
        action: createBooleanToggleAction(Option.SHOW_SPIRITBORN),
        checked: createBooleanChecked(Option.SHOW_SPIRITBORN),
        count: createClassTypeCount(Option.SHOW_SPIRITBORN),
      },
      {
        type: WidgetType.ITEM_FILTER,
        option: Option.SHOW_PALADIN,
        label: "Paladin",
        action: createBooleanToggleAction(Option.SHOW_PALADIN),
        checked: createBooleanChecked(Option.SHOW_PALADIN),
        count: createClassTypeCount(Option.SHOW_PALADIN),
      },
    ],
  },
  {
    label: "Filters",
    widgets: [
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_PREMIUM,
        label: "Show Premium",
        action: createBooleanAction(Option.SHOW_PREMIUM),
        checked: createBooleanChecked(Option.SHOW_PREMIUM),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_OUT_OF_ROTATION,
        label: "Show Out of Rotation",
        action: createBooleanAction(Option.SHOW_OUT_OF_ROTATION),
        checked: createBooleanChecked(Option.SHOW_OUT_OF_ROTATION),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_UNOBTAINABLE,
        label: "Show Unobtainable",
        action: createBooleanAction(Option.SHOW_UNOBTAINABLE),
        checked: createBooleanChecked(Option.SHOW_UNOBTAINABLE),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_WARDROBE_ONLY,
        label: "Show Wardrobe Icons Only",
        action: createBooleanAction(Option.SHOW_WARDROBE_ONLY),
        checked: createBooleanChecked(Option.SHOW_WARDROBE_ONLY),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_HIDDEN,
        label: "Show Excluded",
        action: createBooleanAction(Option.SHOW_HIDDEN),
        checked: createBooleanChecked(Option.SHOW_HIDDEN),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.HIDE_COLLECTED,
        label: "Hide Collected",
        action: createBooleanAction(Option.HIDE_COLLECTED),
        checked: createBooleanChecked(Option.HIDE_COLLECTED),
      },
    ],
  },
  {
    label: "Display",
    widgets: [
      {
        type: WidgetType.TOGGLE,
        option: Option.LEDGER_VIEW,
        label: "Use Card Layout",
        checked: (settings) => isLedgerView(settings, LedgerView.CARD),
        action: (e) => ({
          type: SettingsActionType.UPDATE,
          option: Option.LEDGER_VIEW,
          value: e.target.checked ? LedgerView.CARD : LedgerView.LIST,
        }),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.LEDGER_INVERSE,
        label: "Inverse Cards",
        action: createBooleanAction(Option.LEDGER_INVERSE),
        checked: createBooleanChecked(Option.LEDGER_INVERSE),
      },
      {
        type: WidgetType.DROPDOWN,
        option: Option.PREFERRED_CLASS,
        label: "Class Preference",
        action: createChoiceAction(Option.PREFERRED_CLASS),
        value: createNumberSelected(Option.PREFERRED_CLASS),
        default: CharacterClass.BARBARIAN,
        options: enumKeys(CharacterClass).map((k) => {
          const cc = CharacterClass[k];
          return [cc, i18n.characterClass[cc]];
        }),
      },
      {
        type: WidgetType.DROPDOWN,
        option: Option.PREFERRED_GENDER,
        label: "Gender Preference",
        action: createChoiceAction(Option.PREFERRED_GENDER),
        value: createNumberSelected(Option.PREFERRED_GENDER),
        default: CharacterGender.MALE,
        options: enumKeys(CharacterGender).map((k) => {
          const cc = CharacterGender[k];
          return [cc, i18n.characterGender[cc]];
        }),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.DEBUG,
        label: "Show Debug Info",
        action: createBooleanAction(Option.DEBUG),
        checked: createBooleanChecked(Option.DEBUG),
      },
    ],
  },
];
