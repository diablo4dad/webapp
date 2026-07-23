import { useEffect, useMemo } from "react";
import { Progress } from "../../features/progress";
import { useAuth } from "../../services/auth";
import { useData } from "../../services/data/context";
import { MasterGroup } from "../../shared/domain";
import { useEditor } from "../../features/editor";
import {
  getCatalogLoadPlan,
  useCatalogLoading,
} from "../collection-log/loading";
import {
  STATS_SHELL_CONTROLS,
  useRootOutletContext,
  useRootShellControls,
} from "../root/outlet";
import styles from "./route.module.css";

function Component() {
  const { onClearSearch, searchTerm } = useRootOutletContext();
  useRootShellControls(STATS_SHELL_CONTROLS);
  const {
    catalogGroupSources,
    loadedCatalogGroups,
    setCatalogCategoryDb,
    switchDb,
  } = useData();
  const { isLoading: isAuthLoading } = useAuth();
  const { canEditCatalog } = useEditor();
  const { catalogError, isCatalogLoading } = useCatalogLoading({
    canEditCatalog,
    catalogGroupSources,
    group: MasterGroup.UNIVERSAL,
    isAuthLoading,
    loadedCatalogGroups,
    setCatalogCategoryDb,
  });
  const loadPlan = useMemo(
    () =>
      getCatalogLoadPlan({
        canEditCatalog,
        catalogGroupSources,
        group: MasterGroup.UNIVERSAL,
        loadedCatalogGroups,
      }),
    [canEditCatalog, catalogGroupSources, loadedCatalogGroups],
  );
  const isCatalogReady = !isAuthLoading && loadPlan.groupsToFetch.length === 0;

  useEffect(() => {
    switchDb(MasterGroup.UNIVERSAL);
  }, [switchDb]);

  useEffect(() => {
    if (searchTerm.length > 0) {
      onClearSearch();
    }
  }, [onClearSearch, searchTerm]);

  if (catalogError) {
    return (
      <div className={styles.RouteStatus} role="alert">
        {catalogError}
      </div>
    );
  }

  if (isCatalogLoading || !isCatalogReady) {
    return <div className={styles.RouteStatus}>Loading progress...</div>;
  }

  return (
    <div className={styles.RouteViewport}>
      <Progress scope={MasterGroup.UNIVERSAL} variant="dashboard" />
    </div>
  );
}

export { Component };
