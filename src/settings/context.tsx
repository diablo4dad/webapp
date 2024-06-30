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
  Option,
  PreferredClass,
  PreferredGender,
  Settings,
  StringOption,
} from "./type";
import { StoreData } from "../store";

export const initialState: Settings = {
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
  // filters
  [Option.SHOW_PREMIUM]: true,
  [Option.SHOW_PROMOTIONAL]: true,
  [Option.SHOW_OUT_OF_ROTATION]: true,
  [Option.SHOW_HIDDEN]: false,
  [Option.SHOW_UNOBTAINABLE]: false,
  [Option.SHOW_WARDROBE_ONLY]: false,
  [Option.HIDE_COLLECTED]: false,
  // view
  [Option.LEDGER_VIEW]: LedgerView.CARD,
  [Option.LEDGER_INVERSE]: false,
  [Option.PREFERRED_CLASS]: PreferredClass.BARBARIAN,
  [Option.PREFERRED_GENDER]: PreferredGender.MALE,
};

const defaultDispatch = () => initialState;

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
    };

export const SettingsContext = createContext<Settings>(initialState);
export const SettingsDispatchContext =
  createContext<Dispatch<SettingsAction>>(defaultDispatch);

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, dispatch] = useReducer(
    settingsReducer,
    loadSettingsFromStorage(initialState),
  );

  return (
    <SettingsContext.Provider value={settings}>
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
      return initialState;
  }
}

// this is a short term workaround
function loadSettingsFromStorage(fallback: Settings): Settings {
  const storeRaw = localStorage.getItem("d4log");
  if (storeRaw === null) {
    return fallback;
  }

  const storeData: StoreData = JSON.parse(storeRaw);
  if (!storeData.settings) {
    return fallback;
  }

  return storeData.settings;
}
