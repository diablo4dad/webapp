import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../../services/auth";
import { useData } from "../../services/data/context";
import { filterDb } from "../../services/data/filters";
import { useCollection } from "../../features/ledger/context";
import { useEditor } from "../../features/editor";
import {
  isEnabled,
  Option,
  SettingsActionType,
  useSettings,
  useSettingsDispatch,
} from "../../features/settings";
import {
  getProgressViewModel,
  type ProgressScopeSource,
} from "../../features/progress";
import type { ProgressFilterControl } from "../../features/progress-overview";
import { groups } from "../../features/settings/menu";
import {
  MasterGroup,
  collectionFilterGroups,
  collectionGroupLabels,
} from "../../shared/domain";
import { collectionGroupIconMap } from "../../shared/domain/item-assets";
import {
  WidgetType,
  type ItemFilterWidget as ItemFilterWidgetConfig,
} from "../../shared/lib/widget";
import {
  getCatalogLoadPlan,
  useCatalogLoading,
} from "../tracker/loading";
import {
  STATS_SHELL_CONTROLS,
  useRootOutletContext,
  useRootShellControls,
} from "../root/outlet";
import { View } from "./view";

const ITEM_FILTER_WIDGETS = groups
  .find((group) => group.label === "Items")
  ?.widgets
  .filter((widget): widget is ItemFilterWidgetConfig =>
    widget.type === WidgetType.ITEM_FILTER,
  ) ?? [];

function Component() {
  const { onClearSearch, searchTerm } = useRootOutletContext();
  useRootShellControls(STATS_SHELL_CONTROLS);
  const collectionLog = useCollection();
  const settings = useSettings();
  const dispatchSettings = useSettingsDispatch();
  const {
    catalogGroupSources,
    db,
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
  const universalCollections = useMemo(
    () =>
      filterDb(
        db.collections,
        settings,
        collectionLog,
        MasterGroup.UNIVERSAL,
        null,
        true,
      ),
    [collectionLog, db.collections, settings],
  );
  const scopeCollectionSources = useMemo(
    () =>
      collectionFilterGroups.map((catalogGroup) => ({
        collections: catalogGroup === MasterGroup.UNIVERSAL
          ? universalCollections
          : filterDb(
              db.collections,
              settings,
              collectionLog,
              catalogGroup,
              null,
              true,
            ),
        group: catalogGroup,
      })),
    [collectionLog, db.collections, settings, universalCollections],
  );
  const scopeSources = useMemo<ProgressScopeSource[]>(
    () =>
      scopeCollectionSources.map((source) => ({
        collections: source.collections,
        iconSrc: collectionGroupIconMap.get(source.group),
        id: source.group,
        title: collectionGroupLabels[source.group],
      })),
    [scopeCollectionSources],
  );
  const [selectedScopeIndex, setSelectedScopeIndex] = useState(0);
  const selectedScope = scopeSources[selectedScopeIndex] ?? scopeSources[0];
  const selectedScopeGroup =
    scopeCollectionSources[selectedScopeIndex]?.group ?? MasterGroup.UNIVERSAL;
  const selectedScopeCollections =
    selectedScope?.collections ?? universalCollections;
  const model = useMemo(
    () =>
      getProgressViewModel(collectionLog, selectedScopeCollections, {
        scopeSources,
        selectedScopeId: selectedScope?.id,
      }),
    [
      collectionLog,
      selectedScopeCollections,
      scopeSources,
      selectedScope?.id,
    ],
  );
  const onSelectNextScope = useCallback(() => {
    setSelectedScopeIndex((index) => getNextIndex(index, scopeSources.length));
  }, [scopeSources.length]);
  const onSelectPreviousScope = useCallback(() => {
    setSelectedScopeIndex((index) =>
      getPreviousIndex(index, scopeSources.length),
    );
  }, [scopeSources.length]);
  const onShowPremiumChange = useCallback(
    (value: boolean) =>
      dispatchSettings({
        type: SettingsActionType.UPDATE,
        option: Option.SHOW_PREMIUM,
        value,
      }),
    [dispatchSettings],
  );
  const onShowOutOfRotationChange = useCallback(
    (value: boolean) =>
      dispatchSettings({
        type: SettingsActionType.UPDATE,
        option: Option.SHOW_OUT_OF_ROTATION,
        value,
      }),
    [dispatchSettings],
  );
  const filterControls = useMemo<ProgressFilterControl[]>(
    () => [
      {
        checked: isEnabled(settings, Option.SHOW_PREMIUM),
        label: "Show Premium",
        name: Option.SHOW_PREMIUM,
        onChange: onShowPremiumChange,
      },
      {
        checked: isEnabled(settings, Option.SHOW_OUT_OF_ROTATION),
        label: "Show Out of Rotation",
        name: Option.SHOW_OUT_OF_ROTATION,
        onChange: onShowOutOfRotationChange,
      },
    ],
    [
      onShowOutOfRotationChange,
      onShowPremiumChange,
      settings,
    ],
  );
  const itemFilterControls = useMemo(
    () =>
      ITEM_FILTER_WIDGETS.map((widget) => ({
        active: widget.checked(settings),
        count: widget.count(
          db.collections,
          settings,
          collectionLog,
          selectedScopeGroup,
        ),
        label: widget.label,
        name: widget.option,
        onClick: () => dispatchSettings(widget.action(settings)),
      })),
    [
      collectionLog,
      db.collections,
      dispatchSettings,
      selectedScopeGroup,
      settings,
    ],
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

  useEffect(() => {
    setSelectedScopeIndex((index) =>
      scopeSources[index] === undefined ? 0 : index,
    );
  }, [scopeSources]);

  return (
    <View
      catalogError={catalogError}
      filterControls={filterControls}
      itemFilterControls={itemFilterControls}
      isLoading={isCatalogLoading || !isCatalogReady}
      model={model}
      onSelectNextScope={onSelectNextScope}
      onSelectPreviousScope={onSelectPreviousScope}
    />
  );
}

function getNextIndex(index: number, length: number): number {
  return length === 0 ? 0 : (index + 1) % length;
}

function getPreviousIndex(index: number, length: number): number {
  return length === 0 ? 0 : (index - 1 + length) % length;
}

export { Component };
