import { VERSION } from "../config";

import { isScreenSmall } from "../common/dom";
import { CollectionLog } from "../collection/type";
import { LedgerView, Option, Settings } from "../settings/type";
import { defaultSettings } from "../settings/context";

type ViewState = {
  ledger: LedgerState;
  lastSelected?: Selection;
};

type Selection = {
  collectionId: number;
  itemId: number;
};

type LedgerState = {
  [key: string]: CollectionState;
};

type CollectionState = {
  isOpen: boolean;
};

type VersionInfo = {
  major: number;
  minor: number;
  revision: number;
};

type VersionMeta = {
  version: VersionInfo;
};

type StoreData = VersionMeta & {
  settings: Settings;
  collectionLog: CollectionLog;
  view: ViewState;
  // deprecated
  default?: boolean;
};

type FirebaseData = VersionMeta & {
  collectionLog: CollectionLog;
};

export function initStore(): StoreData {
  return {
    version: VERSION,
    settings: {
      ...defaultSettings,
      [Option.LEDGER_VIEW]: isScreenSmall() ? LedgerView.LIST : LedgerView.CARD,
    },
    view: {
      ledger: {
        // empty
      },
    },
    collectionLog: {
      collected: [],
      hidden: [],
    },
  };
}

export type { StoreData, ViewState, VersionInfo, FirebaseData, VersionMeta };
