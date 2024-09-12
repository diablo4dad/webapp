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
import { isEnabled, isLedgerView } from "./predicate";
import { getNumberValue } from "./accessor";
import { enumKeys } from "../common/enums";
import { CharacterClass, CharacterGender } from "../data";
import i18n from "../i18n";

function createBooleanAction(
  option: BooleanOption,
): (e: ChangeEvent<HTMLInputElement>) => SettingsAction {
  return (e: ChangeEvent<HTMLInputElement>) => ({
    type: SettingsActionType.UPDATE,
    option: option,
    value: e.target.checked,
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

export const groups: ReadonlyArray<OptionWidgetGroup> = [
  {
    label: "Items",
    widgets: [
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_MOUNTS,
        label: "Mounts",
        action: createBooleanAction(Option.SHOW_MOUNTS),
        checked: createBooleanChecked(Option.SHOW_MOUNTS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_HORSE_ARMOR,
        label: "Horse Armor",
        action: createBooleanAction(Option.SHOW_HORSE_ARMOR),
        checked: createBooleanChecked(Option.SHOW_HORSE_ARMOR),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_TROPHIES,
        label: "Trophies",
        action: createBooleanAction(Option.SHOW_TROPHIES),
        checked: createBooleanChecked(Option.SHOW_TROPHIES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_BACK_TROPHIES,
        label: "Back Trophies",
        action: createBooleanAction(Option.SHOW_BACK_TROPHIES),
        checked: createBooleanChecked(Option.SHOW_BACK_TROPHIES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_ARMOR,
        label: "Armor",
        action: createBooleanAction(Option.SHOW_ARMOR),
        checked: createBooleanChecked(Option.SHOW_ARMOR),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_WEAPONS,
        label: "Weapons",
        action: createBooleanAction(Option.SHOW_WEAPONS),
        checked: createBooleanChecked(Option.SHOW_WEAPONS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_MARKINGS,
        label: "Body Markings",
        action: createBooleanAction(Option.SHOW_MARKINGS),
        checked: createBooleanChecked(Option.SHOW_MARKINGS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_EMOTES,
        label: "Emotes",
        action: createBooleanAction(Option.SHOW_EMOTES),
        checked: createBooleanChecked(Option.SHOW_EMOTES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_PORTALS,
        label: "Town Portals",
        action: createBooleanAction(Option.SHOW_PORTALS),
        checked: createBooleanChecked(Option.SHOW_PORTALS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_HEADSTONES,
        label: "Headstones",
        action: createBooleanAction(Option.SHOW_HEADSTONES),
        checked: createBooleanChecked(Option.SHOW_HEADSTONES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_EMBLEMS,
        label: "Emblems",
        action: createBooleanAction(Option.SHOW_EMBLEMS),
        checked: createBooleanChecked(Option.SHOW_EMBLEMS),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_TITLES,
        label: "Player Titles",
        action: createBooleanAction(Option.SHOW_TITLES),
        checked: createBooleanChecked(Option.SHOW_TITLES),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_PETS,
        label: "Pets",
        action: createBooleanAction(Option.SHOW_PETS),
        checked: createBooleanChecked(Option.SHOW_PETS),
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
        option: Option.SHOW_SHOP,
        label: "Show Shop Items",
        action: createBooleanAction(Option.SHOW_SHOP),
        checked: createBooleanChecked(Option.SHOW_SHOP),
      },
      {
        type: WidgetType.TOGGLE,
        option: Option.SHOW_PROMOTIONAL,
        label: "Show Promotional",
        action: createBooleanAction(Option.SHOW_PROMOTIONAL),
        checked: createBooleanChecked(Option.SHOW_PROMOTIONAL),
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
    label: "Display Options",
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
