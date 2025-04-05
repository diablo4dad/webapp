import classNames from "classnames";
import { ChangeEvent, forwardRef, HTMLProps } from "react";
import { OptionWidgetGroup, ToggleWidget, WidgetType } from "../common/widget";
import Button from "../components/Button";
import { CheckBox } from "../components/CheckBox";
import { DropMenu, DropMenuItem } from "../components/DropMenu";
import { CardView, Female, Inverse, ListView, Male } from "../components/Icons";
import { Popout } from "../components/Popout";
import Toggle from "../components/Toggle";
import { CharacterClass, CharacterGender, classIconMap } from "../data";
import i18n from "../i18n";
import { getNumberValue } from "./accessor";
import styles from "./ConfigMenu.module.css";
import { SettingsAction, useSettings, useSettingsDispatch } from "./context";
import {
  COLLECTED_OPTION,
  getOptionGroup,
  INVERSE_OPTION,
  LAYOUT_OPTION,
  PREFERRED_CLASS_OPTION,
  PREFERRED_GENDER_OPTION,
} from "./menu";
import { isEnabled, isLedgerView } from "./predicate";
import { LedgerView, Option, Settings } from "./type";

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

export const ConfigMenu = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(
  function ConfigMenu({ className, ...props }, ref) {
    const settings = useSettings();
    const dispatch = useSettingsDispatch();

    return (
      <div className={classNames(styles.Block, className)} ref={ref} {...props}>
        <div className={styles.BlockLeftSide}>
          <div className={styles.Group}>
            <div className={styles.GroupItem}>
              <DropMenuFromOptionGroup
                settings={settings}
                options={getOptionGroup("Items")}
                onChange={dispatch}
              />
            </div>
            <div className={styles.GroupItem}>
              <DropMenuFromOptionGroup
                settings={settings}
                options={getOptionGroup("Classes")}
                onChange={dispatch}
              />
            </div>
            <div className={styles.GroupItem}>
              <DropMenuFromOptionGroup
                settings={settings}
                options={getOptionGroup("Categories")}
                onChange={dispatch}
              />
            </div>
            <div className={styles.GroupItem}>
              <DropMenuFromOptionGroup
                settings={settings}
                options={getOptionGroup("Misc")}
                onChange={dispatch}
              />
            </div>
          </div>
        </div>
        <div className={styles.BlockRightSide}>
          <div className={styles.Group}>
            <div className={styles.GroupItem}>
              <Toggle
                name={"collected"}
                label={COLLECTED_OPTION.label}
                checked={COLLECTED_OPTION.checked(settings)}
                onChange={(e) => dispatch(COLLECTED_OPTION.action(e))}
              />
            </div>
          </div>
          <div className={styles.Group}>
            <div className={styles.GroupItem}>
              <span>Icon Set</span>
            </div>
            <div className={styles.GroupItem}>
              <Button
                size={"small"}
                title={PREFERRED_GENDER_OPTION.label}
                onClick={() =>
                  dispatch(PREFERRED_GENDER_OPTION.actionRotate(settings))
                }
              >
                {getNumberValue(settings, Option.PREFERRED_GENDER) ===
                CharacterGender.MALE ? (
                  <Male />
                ) : (
                  <Female />
                )}
              </Button>
            </div>
            <div className={styles.GroupItem}>
              <Button
                size={"small"}
                onClick={() =>
                  dispatch(PREFERRED_CLASS_OPTION.actionRotate(settings))
                }
              >
                <img
                  alt={
                    i18n.characterClass[
                      getNumberValue(
                        settings,
                        Option.PREFERRED_CLASS,
                      ) as CharacterClass
                    ]
                  }
                  src={classIconMap.get(
                    getNumberValue(
                      settings,
                      Option.PREFERRED_CLASS,
                    ) as CharacterClass,
                  )}
                />
              </Button>
            </div>
          </div>
          <div className={styles.Group}>
            <div className={styles.GroupItem}>
              <span>View</span>
            </div>
            <div className={styles.GroupItem}>
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
            </div>
            <div className={styles.GroupItem}>
              <Button
                size="small"
                onClick={() => dispatch(INVERSE_OPTION.actionFrom(settings))}
                rotate={isEnabled(settings, Option.LEDGER_INVERSE)}
                disabled={isLedgerView(settings, LedgerView.LIST)}
              >
                <Inverse />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
