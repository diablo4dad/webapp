import { Accordion, AccordionItem } from "@szhsin/react-accordion";
import type { CollectionGroup } from "../../services/data";
import { useData } from "../../services/data/context";
import type { MasterGroup } from "../../shared/domain";
import type { OptionWidget } from "../../shared/lib/widget";
import { WidgetType } from "../../shared/lib/widget";
import { ChevronRight } from "../../shared/ui/Icons";
import Select from "../../shared/ui/Select";
import Toggle from "../../shared/ui/Toggle";
import { useCollection } from "../ledger/context";
import type { CollectionLog } from "../ledger/type";
import { CollectionFilterWidget } from "./collection-filter-widget";
import {
  useSettings,
  useSettingsDispatch,
  type SettingsAction,
} from "./context";
import { ItemFilterWidget } from "./item-filter-widget";
import { groups } from "./menu";
import type { Settings } from "./type";
import styles from "./config-sidebar.module.css";

type Props = {
  onSelectCollectionGroup: (group: MasterGroup) => void;
};

type WidgetProps = {
  activeGroup: MasterGroup;
  collections: CollectionGroup;
  dispatch: (action: SettingsAction) => void;
  log: CollectionLog;
  onSelectCollectionGroup: (group: MasterGroup) => void;
  settings: Settings;
  widget: OptionWidget;
};

function ConfigSidebar({ onSelectCollectionGroup }: Props) {
  const settings = useSettings();
  const dispatch = useSettingsDispatch();
  const { db, group: activeGroup } = useData();
  const log = useCollection();

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
                <span className={styles.FieldsetTitle}>
                  {widgetGroup.label}
                </span>
                <span className={styles.FieldsetIcon}>
                  <ChevronRight />
                </span>
              </span>
            }
          >
            <div className={styles.FieldsetBody}>
              {widgetGroup.widgets.map((widget) => (
                <ConfigWidget
                  key={widget.option}
                  activeGroup={activeGroup}
                  collections={db.collections}
                  dispatch={dispatch}
                  log={log}
                  onSelectCollectionGroup={onSelectCollectionGroup}
                  settings={settings}
                  widget={widget}
                />
              ))}
            </div>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function ConfigWidget({
  activeGroup,
  collections,
  dispatch,
  log,
  onSelectCollectionGroup,
  settings,
  widget,
}: WidgetProps) {
  switch (widget.type) {
    case WidgetType.TOGGLE:
      return (
        <Toggle
          name={widget.option}
          label={widget.label}
          flip={true}
          checked={widget.checked(settings)}
          onChange={(event) => dispatch(widget.action(event))}
        />
      );
    case WidgetType.DROPDOWN:
      return (
        <Select
          label={widget.label}
          options={widget.options}
          defaultValue={widget.value(settings)}
          onChange={(event) => dispatch(widget.action(event))}
        />
      );
    case WidgetType.ITEM_FILTER:
      return (
        <ItemFilterWidget
          active={widget.checked(settings)}
          count={widget.count(collections, settings, log, activeGroup)}
          label={widget.label}
          onClick={() => dispatch(widget.action(settings))}
        />
      );
    case WidgetType.COLLECTION_FILTER:
      return (
        <CollectionFilterWidget
          active={widget.selected(activeGroup)}
          icon={widget.icon}
          label={widget.label}
          onClick={() => onSelectCollectionGroup(widget.group)}
        />
      );
  }

  return null;
}

export { ConfigSidebar };
