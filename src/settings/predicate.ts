import { BooleanOption, LedgerView, Option, Settings } from "./type";

export function isEnabled(settings: Settings, option: BooleanOption): boolean {
  return settings[option] === true;
}

export function isLedgerView(settings: Settings, view: LedgerView): boolean {
  return settings[Option.LEDGER_VIEW] === view;
}

export function isLedgerInverse(settings: Settings): boolean {
  return (
    isLedgerView(settings, LedgerView.CARD) &&
    isEnabled(settings, Option.LEDGER_INVERSE)
  );
}
