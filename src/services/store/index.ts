import { VERSION } from "../../config";

import { isScreenSmall } from "../../shared/lib/dom";
import { CollectionLog } from "../../features/ledger/type";
import { LedgerView, Option, Settings } from "../../features/settings/type";
import { defaultSettings } from "../../features/settings/context";

type ViewState = {
  ledger: LedgerState;
  lastSelected?: Selection;
};

type Selection = {
  collectionId: string;
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
