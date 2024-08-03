import { LedgerView, Option, Settings } from "./type";
import { CharacterClass, CharacterGender } from "../data";

export function getLedgerViewSetting(settings: Settings): LedgerView {
  return settings[Option.LEDGER_VIEW];
}

export function getPreferredClass(settings: Settings): CharacterClass {
  return settings[Option.PREFERRED_CLASS] ?? CharacterClass.BARBARIAN;
}

export function getPreferredGender(settings: Settings): CharacterGender {
  return settings[Option.PREFERRED_GENDER] ?? CharacterGender.MALE;
}
