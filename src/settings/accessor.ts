import { LedgerView, Option, Settings } from "./type";

export function getLedgerViewSetting(settings: Settings): LedgerView {
  return settings[Option.LEDGER_VIEW];
}
