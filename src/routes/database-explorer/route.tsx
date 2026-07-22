import { useNavigate, useParams } from "react-router-dom";
import { DatabaseExplorer } from "../../features/database-explorer";
import {
  DATABASE_SHELL_CONTROLS,
  useRootOutletContext,
  useRootShellControls,
} from "../root/outlet";
import styles from "./route.module.css";

function Component() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const { searchTerm } = useRootOutletContext();
  useRootShellControls(DATABASE_SHELL_CONTROLS);
  const selectedItemId = getSelectedItemId(itemId);

  return (
    <div className={styles.RouteViewport}>
      <DatabaseExplorer
        onSelectItemIdChange={(nextItemId, options) => {
          void navigate(`/database/${nextItemId}`, {
            replace: options?.replace,
          });
        }}
        searchTerm={searchTerm}
        selectedItemId={selectedItemId}
      />
    </div>
  );
}

function getSelectedItemId(itemId?: string): number | undefined {
  if (itemId === undefined) {
    return undefined;
  }

  const parsedItemId = Number(itemId);

  return Number.isInteger(parsedItemId) ? parsedItemId : undefined;
}

export { Component };
