import { MasterGroup, catalogGroups } from "../../common";
import type { CatalogGroupSource } from "../../data/context";

type CatalogGroupSources = Partial<Record<MasterGroup, CatalogGroupSource>>;

export type CatalogRouteLoadPlanInput = {
  canEditCatalog: boolean;
  catalogGroupSources: CatalogGroupSources;
  group: MasterGroup;
  loadedCatalogGroups: readonly MasterGroup[];
};

export type CatalogRouteLoadPlan = {
  groupsToFetch: MasterGroup[];
  source: CatalogGroupSource;
  targetGroups: MasterGroup[];
};

function isCatalogGroup(group: MasterGroup): boolean {
  return catalogGroups.some((category) => category === group);
}

function getCatalogRouteTargetGroups(group: MasterGroup): MasterGroup[] {
  return group === MasterGroup.UNIVERSAL ? [...catalogGroups] : [group];
}

function shouldFetchCatalogGroup(
  group: MasterGroup,
  source: CatalogGroupSource,
  catalogGroupSources: CatalogGroupSources,
  loadedCatalogGroups: readonly MasterGroup[],
): boolean {
  if (!isCatalogGroup(group)) {
    return false;
  }

  if (source === "firestore") {
    return catalogGroupSources[group] !== "firestore";
  }

  return !loadedCatalogGroups.includes(group);
}

export function getCatalogRouteLoadPlan({
  canEditCatalog,
  catalogGroupSources,
  group,
  loadedCatalogGroups,
}: CatalogRouteLoadPlanInput): CatalogRouteLoadPlan {
  const source: CatalogGroupSource = canEditCatalog ? "firestore" : "bundle";
  const targetGroups = getCatalogRouteTargetGroups(group);
  const groupsToFetch = targetGroups.filter((targetGroup) =>
    shouldFetchCatalogGroup(
      targetGroup,
      source,
      catalogGroupSources,
      loadedCatalogGroups,
    ),
  );

  return {
    groupsToFetch,
    source,
    targetGroups,
  };
}
