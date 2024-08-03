import styles from "./ConfigSidebar.module.css";
import Toggle from "./components/Toggle";
import { useSettings, useSettingsDispatch } from "./settings/context";
import { groups } from "./settings/menu";
import { WidgetType } from "./common/widget";

function ConfigSidebar() {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();

  return (
    <div className={styles.Block}>
      {groups.map((group) => (
        <fieldset className={styles.Fieldset}>
          <legend>{group.label}</legend>
          {group.widgets.map((widget) => {
            switch (widget.type) {
              case WidgetType.TOGGLE:
                return (
                  <Toggle
                    key={widget.option}
                    name={widget.option}
                    label={widget.label}
                    flip={true}
                    checked={widget.checked(settings)}
                    onChange={(e) => dispatch(widget.action(e))}
                  />
                );
              case WidgetType.DROPDOWN:
                return (
                  <div
                    key={widget.option}
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <label>{widget.label}</label>
                    <select onChange={(e) => dispatch(widget.action(e))}>
                      {widget.options.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
            }
          })}
        </fieldset>
      ))}
    </div>
  );
}

export default ConfigSidebar;
