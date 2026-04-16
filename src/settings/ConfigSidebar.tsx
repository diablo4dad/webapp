import styles from "./ConfigSidebar.module.css";
import Toggle from "../components/Toggle";
import { useSettings, useSettingsDispatch } from "./context";
import { groups } from "./menu";
import { WidgetType } from "../common/widget";
import Select from "../components/Select";
import ItemFilterWidget from "./ItemFilterWidget";
import CollectionFilterWidget from "./CollectionFilterWidget";
import { useData } from "../data/context";
import { useCollection } from "../collection/context";
import { Accordion, AccordionItem } from "@szhsin/react-accordion";
import { ChevronRight } from "../components/Icons";
import { generateUrl } from "../routes/CollectionLog";
import { useNavigate } from "react-router-dom";

function ConfigSidebar() {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();
  const { db, group: activeGroup } = useData();
  const log = useCollection();
  const navigate = useNavigate();

  return (
    <div className={styles.Block}>
      <Accordion transition transitionTimeout={220}>
        {groups.map((widgetGroup, index) => (
          <AccordionItem
            key={widgetGroup.label}
            className={styles.Fieldset}
            initialEntered={index === 0}
            itemKey={widgetGroup.label}
            buttonProps={{
              className: styles.FieldsetButton,
            }}
            contentProps={{
              className: styles.FieldsetContent,
            }}
            header={
              <span className={styles.FieldsetHeader}>
                <span className={styles.FieldsetTitle}>{widgetGroup.label}</span>
                <span className={styles.FieldsetIcon}>
                  <ChevronRight />
                </span>
              </span>
            }
          >
            <div className={styles.FieldsetBody}>
              {widgetGroup.widgets.map((widget) => {
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
                  case WidgetType.ITEM_FILTER:
                    return (
                      <ItemFilterWidget
                        key={widget.option}
                        active={widget.checked(settings)}
                        count={widget.count(
                          db.collections,
                          settings,
                          log,
                          activeGroup,
                        )}
                        label={widget.label}
                        onClick={() => dispatch(widget.action(settings))}
                      />
                    );
                  case WidgetType.COLLECTION_FILTER:
                    return (
                      <CollectionFilterWidget
                        key={widget.group}
                        active={widget.selected(activeGroup)}
                        icon={widget.icon}
                        label={widget.label}
                        onClick={() => navigate(generateUrl(widget.group))}
                      />
                    );
                }
              })}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export default ConfigSidebar;
