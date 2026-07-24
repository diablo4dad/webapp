import { ChangeEvent } from "react";
import { SettingsAction } from "../../features/settings/context";
import { Option, Settings } from "../../features/settings/type";
import { CollectionLog } from "../../features/ledger/type";
import { CollectionGroup } from "../../services/data";
import { MasterGroup } from "../domain";

export enum WidgetType {
  TOGGLE,
  DROPDOWN,
  ITEM_FILTER,
  COLLECTION_FILTER,
}

export type Widget = {
  type: WidgetType;
  option: Option | string;
  label: string;
};

export type ToggleWidget = Widget & {
  type: WidgetType.TOGGLE;
  action: (e: ChangeEvent<HTMLInputElement>) => SettingsAction;
  checked: (settings: Settings) => boolean;
};

export type DropdownWidget = Widget & {
  type: WidgetType.DROPDOWN;
  action: (e: ChangeEvent<HTMLSelectElement>) => SettingsAction;
  value: (settings: Settings) => number;
  options: [string | number, string][];
  default: string | number;
};

export type ItemFilterCount = {
  owned: number;
  total: number;
};

export type ItemFilterWidget = Widget & {
  type: WidgetType.ITEM_FILTER;
  action: (settings: Settings) => SettingsAction;
  checked: (settings: Settings) => boolean;
  count: (
    collections: CollectionGroup,
    settings: Settings,
    log: CollectionLog,
    group: MasterGroup,
  ) => ItemFilterCount;
};

export type CollectionFilterWidget = Widget & {
  type: WidgetType.COLLECTION_FILTER;
  group: MasterGroup;
  icon: string;
  selected: (group: MasterGroup) => boolean;
};

export type OptionWidget =
  | ToggleWidget
  | DropdownWidget
  | ItemFilterWidget
  | CollectionFilterWidget;

export type OptionWidgetGroup = {
  label: string;
  widgets: ReadonlyArray<OptionWidget>;
};
