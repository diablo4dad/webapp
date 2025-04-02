import { ChangeEvent } from "react";
import { OptionWidgetGroup, ToggleWidget, WidgetType } from "../common/widget";
import Button from "../components/Button";
import { CheckBox } from "../components/CheckBox";
import { DropMenu, DropMenuItem } from "../components/DropMenu";
import { CardView, Inverse, ListView } from "../components/Icons";
import { Popout } from "../components/Popout";
import Toggle from "../components/Toggle";
import styles from "./ConfigMenu.module.css";
import { SettingsAction, useSettings, useSettingsDispatch } from "./context";
import {
  COLLECTED_OPTION,
  EXCLUDED_OPTION,
  getOptionGroup,
  INVERSE_OPTION,
  LAYOUT_OPTION,
} from "./menu";
import { isLedgerView } from "./predicate";
import { LedgerView, Settings } from "./type";

type Props = {
  settings: Settings;
  options: OptionWidgetGroup;
  onChange: (e: SettingsAction) => void;
};

function DropMenuFromOptionGroup({ settings, options, onChange }: Props) {
  return (
    <Popout
      trigger={(onClick) => <Button onClick={onClick}>{options.label}</Button>}
      renderContent={(onClick) => (
        <DropMenu onClick={onClick}>
          {options.widgets
            .filter((w): w is ToggleWidget => w.type === WidgetType.TOGGLE)
            .map((w) => (
              <DropMenuItem>
                <CheckBox
                  label={w.label}
                  checked={w.checked(settings)}
                  onChange={(e) =>
                    onChange(w.action(e as ChangeEvent<HTMLInputElement>))
                  }
                />
              </DropMenuItem>
            ))}
        </DropMenu>
      )}
    />
  );
}

export function ConfigMenu() {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();

  return (
    <div className={styles.Block}>
      <div className={styles.BlockLeftSide}>
        <DropMenuFromOptionGroup
          settings={settings}
          options={getOptionGroup("Items")}
          onChange={dispatch}
        />
        <DropMenuFromOptionGroup
          settings={settings}
          options={getOptionGroup("Classes")}
          onChange={dispatch}
        />
        <DropMenuFromOptionGroup
          settings={settings}
          options={getOptionGroup("Categories")}
          onChange={dispatch}
        />
        <DropMenuFromOptionGroup
          settings={settings}
          options={getOptionGroup("Filters")}
          onChange={dispatch}
        />
        <Button>Class</Button>
        <Button>Gender</Button>
      </div>
      <div className={styles.BlockRightSide}>
        <Toggle
          name={"hidden"}
          label={EXCLUDED_OPTION.label}
          checked={EXCLUDED_OPTION.checked(settings)}
          onChange={(e) => dispatch(EXCLUDED_OPTION.action(e))}
        />
        <Toggle
          name={"collected"}
          label={COLLECTED_OPTION.label}
          checked={COLLECTED_OPTION.checked(settings)}
          onChange={(e) => dispatch(COLLECTED_OPTION.action(e))}
        />
        <Button
          size="small"
          onClick={() => dispatch(LAYOUT_OPTION.actionFrom(settings))}
        >
          {isLedgerView(settings, LedgerView.CARD) ? (
            <CardView />
          ) : (
            <ListView />
          )}
        </Button>
        <Button
          size="small"
          onClick={() => dispatch(INVERSE_OPTION.actionFrom(settings))}
        >
          <Inverse />
        </Button>
      </div>
    </div>
  );
}
