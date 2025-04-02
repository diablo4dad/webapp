import { ChangeEvent } from "react";
import { enumKeys } from "../common/enums";
import {
  DropdownWidget,
  OptionWidgetGroup,
  ToggleWidget,
  WidgetType,
} from "../common/widget";
import { CharacterClass, CharacterGender } from "../data";
import i18n from "../i18n";
import { getNumberValue } from "./accessor";
import { SettingsAction, SettingsActionType } from "./context";
import { isEnabled, isLedgerView } from "./predicate";
import {
  BooleanOption,
  LedgerView,
  NumberOption,
  Option,
  Settings,
} from "./type";

function createBooleanAction(
  option: BooleanOption,
): (e: ChangeEvent<HTMLInputElement>) => SettingsAction {
  return (e: ChangeEvent<HTMLInputElement>) => ({
    type: SettingsActionType.UPDATE,
    option: option,
    value: e.target.checked,
  });
}

export function createBooleanActionExplicit(
  option: BooleanOption,
): (settings: Settings) => SettingsAction {
  return (settings: Settings): SettingsAction => ({
    type: SettingsActionType.UPDATE,
    option: option,
    value: !isEnabled(settings, option),
  });
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

export function getOptionGroup(label: string): OptionWidgetGroup {
  const g = groups.find((g) => g.label === label);
  if (g === undefined) {
    throw new Error(`Option group "${label}" does not exist.`);
  }
  return g;
}

export const EXCLUDED_OPTION: ToggleWidget = {
  type: WidgetType.TOGGLE,
  option: Option.SHOW_HIDDEN,
  label: "Show Excluded",
  action: createBooleanAction(Option.SHOW_HIDDEN),
  actionFrom: createBooleanActionExplicit(Option.SHOW_HIDDEN),
  checked: createBooleanChecked(Option.SHOW_HIDDEN),
};

export const COLLECTED_OPTION: ToggleWidget = {
  type: WidgetType.TOGGLE,
  option: Option.HIDE_COLLECTED,
  label: "Hide Collected",
  action: createBooleanAction(Option.HIDE_COLLECTED),
  actionFrom: createBooleanActionExplicit(Option.HIDE_COLLECTED),
  checked: createBooleanChecked(Option.HIDE_COLLECTED),
};

export const LAYOUT_OPTION: ToggleWidget = {
  type: WidgetType.TOGGLE,
  option: Option.LEDGER_VIEW,
  label: "Use Card Layout",
  checked: (settings) => isLedgerView(settings, LedgerView.CARD),
  action: (e) => ({
    type: SettingsActionType.UPDATE,
    option: Option.LEDGER_VIEW,
    value: e.target.checked ? LedgerView.CARD : LedgerView.LIST,
  }),
  actionFrom: (settings) => ({
    type: SettingsActionType.UPDATE,
    option: Option.LEDGER_VIEW,
    value: isLedgerView(settings, LedgerView.LIST)
      ? LedgerView.CARD
      : LedgerView.LIST,
  }),
};

export const INVERSE_OPTION: ToggleWidget = {
  type: WidgetType.TOGGLE,
  option: Option.LEDGER_INVERSE,
  label: "Inverse Cards",
  action: createBooleanAction(Option.LEDGER_INVERSE),
  actionFrom: createBooleanActionExplicit(Option.LEDGER_INVERSE),
  checked: createBooleanChecked(Option.LEDGER_INVERSE),
};

export const PREFERRED_CLASS_OPTION: DropdownWidget = {
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
};

export const PREFERRED_GENDER_OPTION: DropdownWidget = {
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
};

export const DEBUG_OPTION: ToggleWidget = {
  type: WidgetType.TOGGLE,
  option: Option.DEBUG,
  label: "Show Debug Info",
  action: createBooleanAction(Option.DEBUG),
  actionFrom: createBooleanActionExplicit(Option.DEBUG),
  checked: createBooleanChecked(Option.DEBUG),
};

export const groups: ReadonlyArray<OptionWidgetGroup> = [
  {
    label: "Categories",
    widgets: [
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_SHOP,
        label: "Shop",
        action: createBooleanAction(Option.SHOW_SHOP),
        actionFrom: createBooleanActionExplicit(Option.SHOW_SHOP),
        checked: createBooleanChecked(Option.SHOW_SHOP),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_BATTLE_PASS,
        label: "Battle Pass",
        action: createBooleanAction(Option.SHOW_BATTLE_PASS),
        actionFrom: createBooleanActionExplicit(Option.SHOW_BATTLE_PASS),
        checked: createBooleanChecked(Option.SHOW_BATTLE_PASS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_BATTLE_PASS_ACCELERATED,
        label: "Battle Pass Accelerated",
        action: createBooleanAction(Option.SHOW_BATTLE_PASS_ACCELERATED),
        actionFrom: createBooleanActionExplicit(
          Option.SHOW_BATTLE_PASS_ACCELERATED,
        ),
        checked: createBooleanChecked(Option.SHOW_BATTLE_PASS_ACCELERATED),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_PROMOTIONAL,
        label: "Promotional",
        action: createBooleanAction(Option.SHOW_PROMOTIONAL),
        actionFrom: createBooleanActionExplicit(Option.SHOW_PROMOTIONAL),
        checked: createBooleanChecked(Option.SHOW_PROMOTIONAL),
      },
    ],
  },
  {
    label: "Items",
    widgets: [
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_MOUNTS,
        label: "Mounts",
        action: createBooleanAction(Option.SHOW_MOUNTS),
        actionFrom: createBooleanActionExplicit(Option.SHOW_MOUNTS),
        checked: createBooleanChecked(Option.SHOW_MOUNTS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_HORSE_ARMOR,
        label: "Horse Armor",
        action: createBooleanAction(Option.SHOW_HORSE_ARMOR),
        actionFrom: createBooleanActionExplicit(Option.SHOW_HORSE_ARMOR),
        checked: createBooleanChecked(Option.SHOW_HORSE_ARMOR),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_TROPHIES,
        label: "Trophies",
        action: createBooleanAction(Option.SHOW_TROPHIES),
        actionFrom: createBooleanActionExplicit(Option.SHOW_TROPHIES),
        checked: createBooleanChecked(Option.SHOW_TROPHIES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_BACK_TROPHIES,
        label: "Back Trophies",
        action: createBooleanAction(Option.SHOW_BACK_TROPHIES),
        actionFrom: createBooleanActionExplicit(Option.SHOW_BACK_TROPHIES),
        checked: createBooleanChecked(Option.SHOW_BACK_TROPHIES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_ARMOR,
        label: "Armor",
        action: createBooleanAction(Option.SHOW_ARMOR),
        actionFrom: createBooleanActionExplicit(Option.SHOW_ARMOR),
        checked: createBooleanChecked(Option.SHOW_ARMOR),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_WEAPONS,
        label: "Weapons",
        action: createBooleanAction(Option.SHOW_WEAPONS),
        actionFrom: createBooleanActionExplicit(Option.SHOW_WEAPONS),
        checked: createBooleanChecked(Option.SHOW_WEAPONS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_MARKINGS,
        label: "Body Markings",
        action: createBooleanAction(Option.SHOW_MARKINGS),
        actionFrom: createBooleanActionExplicit(Option.SHOW_MARKINGS),
        checked: createBooleanChecked(Option.SHOW_MARKINGS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_EMOTES,
        label: "Emotes",
        action: createBooleanAction(Option.SHOW_EMOTES),
        actionFrom: createBooleanActionExplicit(Option.SHOW_EMOTES),
        checked: createBooleanChecked(Option.SHOW_EMOTES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_PORTALS,
        label: "Town Portals",
        action: createBooleanAction(Option.SHOW_PORTALS),
        actionFrom: createBooleanActionExplicit(Option.SHOW_PORTALS),
        checked: createBooleanChecked(Option.SHOW_PORTALS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_HEADSTONES,
        label: "Headstones",
        action: createBooleanAction(Option.SHOW_HEADSTONES),
        actionFrom: createBooleanActionExplicit(Option.SHOW_HEADSTONES),
        checked: createBooleanChecked(Option.SHOW_HEADSTONES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_EMBLEMS,
        label: "Emblems",
        action: createBooleanAction(Option.SHOW_EMBLEMS),
        actionFrom: createBooleanActionExplicit(Option.SHOW_EMBLEMS),
        checked: createBooleanChecked(Option.SHOW_EMBLEMS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_TITLES,
        label: "Player Titles",
        action: createBooleanAction(Option.SHOW_TITLES),
        actionFrom: createBooleanActionExplicit(Option.SHOW_TITLES),
        checked: createBooleanChecked(Option.SHOW_TITLES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_PETS,
        label: "Pets",
        action: createBooleanAction(Option.SHOW_PETS),
        actionFrom: createBooleanActionExplicit(Option.SHOW_PETS),
        checked: createBooleanChecked(Option.SHOW_PETS),
      },
    ],
  },
  {
    label: "Classes",
    widgets: [
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_SORCERER,
        label: "Sorcerer",
        action: createBooleanAction(Option.SHOW_SORCERER),
        actionFrom: createBooleanActionExplicit(Option.SHOW_SORCERER),
        checked: createBooleanChecked(Option.SHOW_SORCERER),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_DRUID,
        label: "Druid",
        action: createBooleanAction(Option.SHOW_DRUID),
        actionFrom: createBooleanActionExplicit(Option.SHOW_DRUID),
        checked: createBooleanChecked(Option.SHOW_DRUID),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_BARBARIAN,
        label: "Barbarian",
        action: createBooleanAction(Option.SHOW_BARBARIAN),
        actionFrom: createBooleanActionExplicit(Option.SHOW_BARBARIAN),
        checked: createBooleanChecked(Option.SHOW_BARBARIAN),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_ROGUE,
        label: "Rogue",
        action: createBooleanAction(Option.SHOW_ROGUE),
        actionFrom: createBooleanActionExplicit(Option.SHOW_ROGUE),
        checked: createBooleanChecked(Option.SHOW_ROGUE),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_NECROMANCER,
        label: "Necromancer",
        action: createBooleanAction(Option.SHOW_NECROMANCER),
        actionFrom: createBooleanActionExplicit(Option.SHOW_NECROMANCER),
        checked: createBooleanChecked(Option.SHOW_NECROMANCER),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_SPIRITBORN,
        label: "Spiritborn",
        action: createBooleanAction(Option.SHOW_SPIRITBORN),
        actionFrom: createBooleanActionExplicit(Option.SHOW_SPIRITBORN),
        checked: createBooleanChecked(Option.SHOW_SPIRITBORN),
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
        actionFrom: createBooleanActionExplicit(Option.SHOW_PREMIUM),
        checked: createBooleanChecked(Option.SHOW_PREMIUM),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_OUT_OF_ROTATION,
        label: "Show Out of Rotation",
        action: createBooleanAction(Option.SHOW_OUT_OF_ROTATION),
        actionFrom: createBooleanActionExplicit(Option.SHOW_OUT_OF_ROTATION),
        checked: createBooleanChecked(Option.SHOW_OUT_OF_ROTATION),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_UNOBTAINABLE,
        label: "Show Unobtainable",
        action: createBooleanAction(Option.SHOW_UNOBTAINABLE),
        actionFrom: createBooleanActionExplicit(Option.SHOW_UNOBTAINABLE),
        checked: createBooleanChecked(Option.SHOW_UNOBTAINABLE),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_WARDROBE_ONLY,
        label: "Show Wardrobe Icons Only",
        action: createBooleanAction(Option.SHOW_WARDROBE_ONLY),
        actionFrom: createBooleanActionExplicit(Option.SHOW_WARDROBE_ONLY),
        checked: createBooleanChecked(Option.SHOW_WARDROBE_ONLY),
      },
      EXCLUDED_OPTION,
      COLLECTED_OPTION,
    ],
  },
  {
    label: "Display Options",
    widgets: [
      LAYOUT_OPTION,
      INVERSE_OPTION,
      PREFERRED_CLASS_OPTION,
      PREFERRED_GENDER_OPTION,
      DEBUG_OPTION,
    ],
  },
];
