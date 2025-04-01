import { OptionWidgetGroup } from "../common/widget";
import Button from "../components/Button";
import { DropMenu, DropMenuItem } from "../components/DropMenu";
import { CardView, Inverse, ListView } from "../components/Icons";
import { Popout } from "../components/Popout";
import Toggle from "../components/Toggle";
import styles from "./ConfigMenu.module.css";
import { useSettings } from "./context";
import { getOptionGroup } from "./menu";
import { isLedgerView } from "./predicate";
import { LedgerView } from "./type";

type Props = {
  options: OptionWidgetGroup;
};

function DropMenuFromOptionGroup({ options }: Props) {
  return (
    <Popout
      trigger={(onClick) => <Button onClick={onClick}>{options.label}</Button>}
      renderContent={(onClick) => (
        <DropMenu onClick={onClick}>
          {options.widgets.map((w) => (
            <DropMenuItem>{w.label}</DropMenuItem>
          ))}
        </DropMenu>
      )}
    />
  );
}

export function ConfigMenu() {
  const settings = useSettings();

  return (
    <div className={styles.Block}>
      <div className={styles.BlockLeftSide}>
        <DropMenuFromOptionGroup options={getOptionGroup("Categories")} />
        <DropMenuFromOptionGroup options={getOptionGroup("Items")} />
        <DropMenuFromOptionGroup options={getOptionGroup("Classes")} />
        <DropMenuFromOptionGroup options={getOptionGroup("Filters")} />
        <Button>Class</Button>
        <Button>Gender</Button>
      </div>
      <div className={styles.BlockRightSide}>
        <Toggle name={"hidden"} label={"Excluded"} />
        <Toggle name={"collected"} label={"Collected"} />
        <Button size="small">
          {isLedgerView(settings, LedgerView.CARD) ? (
            <CardView />
          ) : (
            <ListView />
          )}
        </Button>
        <Button size="small">
          <Inverse />
        </Button>
      </div>
    </div>
  );
}
