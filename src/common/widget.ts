import { ChangeEvent } from "react";
import { SettingsAction } from "../settings/context";
import { Option, Settings } from "../settings/type";

export enum WidgetType {
  TOGGLE,
  DROPDOWN,
}

export type Widget = {
  type: WidgetType;
  option: Option;
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

export type OptionWidget = ToggleWidget | DropdownWidget;

export type OptionWidgetGroup = {
  label: string;
  widgets: ReadonlyArray<OptionWidget>;
};
