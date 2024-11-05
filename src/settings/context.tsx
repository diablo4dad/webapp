import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useReducer,
} from "react";
import {
  BooleanOption,
  LedgerView,
  NumberOption,
  Option,
  Settings,
  StringOption,
} from "./type";
import { CharacterClass, CharacterGender } from "../data";

export const defaultSettings: Settings = {
  // items
  [Option.SHOW_MOUNTS]: true,
  [Option.SHOW_HORSE_ARMOR]: true,
  [Option.SHOW_TROPHIES]: true,
  [Option.SHOW_BACK_TROPHIES]: true,
  [Option.SHOW_ARMOR]: true,
  [Option.SHOW_WEAPONS]: true,
  [Option.SHOW_MARKINGS]: true,
  [Option.SHOW_EMOTES]: true,
  [Option.SHOW_PORTALS]: true,
  [Option.SHOW_HEADSTONES]: true,
  [Option.SHOW_EMBLEMS]: true,
  [Option.SHOW_TITLES]: true,
  [Option.SHOW_PETS]: true,
  // classes
  [Option.SHOW_SORCERER]: true,
  [Option.SHOW_DRUID]: true,
  [Option.SHOW_BARBARIAN]: true,
  [Option.SHOW_ROGUE]: true,
  [Option.SHOW_NECROMANCER]: true,
  [Option.SHOW_SPIRITBORN]: true,
  // filters
  [Option.SHOW_PREMIUM]: true,
  [Option.SHOW_OUT_OF_ROTATION]: true,
  [Option.SHOW_HIDDEN]: false,
  [Option.SHOW_UNOBTAINABLE]: false,
  [Option.SHOW_WARDROBE_ONLY]: false,
  [Option.HIDE_COLLECTED]: false,
  // collectables
  [Option.SHOW_SHOP]: true,
  [Option.SHOW_BATTLE_PASS]: true,
  [Option.SHOW_BATTLE_PASS_ACCELERATED]: true,
  [Option.SHOW_PROMOTIONAL]: true,
  // view
  [Option.LEDGER_VIEW]: LedgerView.CARD,
  [Option.LEDGER_INVERSE]: false,
  [Option.PREFERRED_CLASS]: CharacterClass.BARBARIAN,
  [Option.PREFERRED_GENDER]: CharacterGender.MALE,
  [Option.DEBUG]: false,
};

const defaultDispatch = () => defaultSettings;

export enum SettingsActionType {
  UPDATE = "update",
  RESET = "reset",
}

export type SettingsAction =
  | {
      type: SettingsActionType.RESET;
    }
  | {
      type: SettingsActionType.UPDATE;
      option: StringOption;
      value: string;
    }
  | {
      type: SettingsActionType.UPDATE;
      option: BooleanOption;
      value: boolean;
    }
  | {
      type: SettingsActionType.UPDATE;
      option: NumberOption;
      value: number;
    };

export const SettingsContext = createContext<Settings>(defaultSettings);
export const SettingsDispatchContext =
  createContext<Dispatch<SettingsAction>>(defaultDispatch);

type Props = PropsWithChildren & {
  settings?: Settings;
};

export function SettingsProvider({ children, settings }: Props) {
  const [value, dispatch] = useReducer(
    settingsReducer,
    settings ?? defaultSettings,
  );

  return (
    <SettingsContext.Provider value={value}>
      <SettingsDispatchContext.Provider value={dispatch}>
        {children}
      </SettingsDispatchContext.Provider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useSettingsDispatch() {
  return useContext(SettingsDispatchContext);
}

function settingsReducer(settings: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case SettingsActionType.UPDATE:
      return {
        ...settings,
        [action.option]: action.value,
      };
    case SettingsActionType.RESET:
      return defaultSettings;
  }
}
