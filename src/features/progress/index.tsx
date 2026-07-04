import { useMemo } from "react";
import { useCollection } from "../ledger/context";
import { useSettings } from "../settings";
import { useData } from "../../services/data/context";
import { filterDb } from "../../services/data/filters";
import { ProgressView, type ProgressViewProps } from "./view";
import { getProgressViewModel } from "./view-model";

type Props = Pick<ProgressViewProps, "className" | "layout">;

function Progress(props: Props) {
  const collectionLog = useCollection();
  const settings = useSettings();
  const { db, group } = useData();
  const countedDb = useMemo(
    () => filterDb(db.collections, settings, collectionLog, group, null, true),
    [collectionLog, db.collections, group, settings],
  );
  const model = useMemo(
    () => getProgressViewModel(collectionLog, countedDb),
    [collectionLog, countedDb],
  );

  return <ProgressView {...props} model={model} />;
}

export { Progress };
