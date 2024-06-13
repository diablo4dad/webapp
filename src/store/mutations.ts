import { ItemFlag, Store } from "./index";
import { MasterGroup } from "../common";

export function toggleItem(
  store: Store,
  masterGroup: MasterGroup,
  collected: boolean,
) {
  return (itemId: number) => {
    return store.toggle(itemId, masterGroup, ItemFlag.COLLECTED, collected);
  };
}
