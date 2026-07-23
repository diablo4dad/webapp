import { useCallback, useEffect, useMemo, useState } from "react";
import { useCollection } from "../ledger/context";
import {
  isEnabled,
  Option,
  SettingsActionType,
  useSettings,
  useSettingsDispatch,
} from "../settings";
import { useData } from "../../services/data/context";
import { filterDb } from "../../services/data/filters";
import {
  MasterGroup,
  collectionFilterGroups,
  collectionGroupLabels,
} from "../../shared/domain";
import { collectionGroupIconMap } from "../../shared/domain/item-assets";
import {
  ProgressView,
  type ProgressFilterControl,
  type ProgressViewProps,
} from "./view";
import {
  getProgressViewModel,
  type ProgressScopeSource,
} from "./view-model";

type Props = Pick<ProgressViewProps, "className" | "layout" | "variant"> & {
  scope?: MasterGroup;
};

function Progress({ scope, ...props }: Props) {
  const collectionLog = useCollection();
  const settings = useSettings();
  const dispatchSettings = useSettingsDispatch();
  const { db, group } = useData();
  const targetGroup = scope ?? group;
  const scopedDb = useMemo(
    () =>
      filterDb(db.collections, settings, collectionLog, targetGroup, null, true),
    [collectionLog, db.collections, settings, targetGroup],
  );
  const everythingDb = useMemo(
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
  const collectionGroupSources = useMemo(
    () =>
      collectionFilterGroups.map((catalogGroup) => ({
        collections: catalogGroup === MasterGroup.UNIVERSAL
          ? everythingDb
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
    [collectionLog, db.collections, everythingDb, settings],
  );
  const scopeSources = useMemo<ProgressScopeSource[]>(
    () =>
      collectionGroupSources.map((source) => ({
        collections: source.collections,
        iconSrc: collectionGroupIconMap.get(source.group),
        id: source.group,
        title: collectionGroupLabels[source.group],
      })),
    [collectionGroupSources],
  );
  const [selectedScopeIndex, setSelectedScopeIndex] = useState(0);
  const selectedScope = scopeSources[selectedScopeIndex] ?? scopeSources[0];
  const dashboardDb =
    props.variant === "dashboard" && selectedScope
      ? selectedScope.collections
      : scopedDb;
  const model = useMemo(
    () =>
      getProgressViewModel(collectionLog, dashboardDb, {
        scopeSources,
        selectedScopeId: selectedScope?.id,
      }),
    [
      collectionLog,
      dashboardDb,
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

  useEffect(() => {
    setSelectedScopeIndex((index) =>
      scopeSources[index] === undefined ? 0 : index,
    );
  }, [scopeSources]);

  return (
    <ProgressView
      {...props}
      model={model}
      filterControls={filterControls}
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

export { Progress };
