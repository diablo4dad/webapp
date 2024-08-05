import styles from "./ConfigSidebar.module.css";
import Toggle from "./components/Toggle";
import { useSettings, useSettingsDispatch } from "./settings/context";
import { groups } from "./settings/menu";
import { WidgetType } from "./common/widget";
import Select from "./components/Select";

function ConfigSidebar() {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();

  return (
    <div className={styles.Block}>
      {groups.map((group) => (
        <fieldset key={group.label} className={styles.Fieldset}>
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
                  <Select
                    key={widget.option}
                    label={widget.label}
                    options={widget.options}
                    defaultValue={widget.value(settings)}
                    onChange={(e) => {
                      console.log("On Select Change", {
                        value: e.target.value,
                      });
                      dispatch(widget.action(e));
                    }}
                  />
                );
            }
          })}
        </fieldset>
      ))}
    </div>
  );
}

export default ConfigSidebar;
