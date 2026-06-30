import { MasterGroup, catalogGroups } from "../../common";
import { useEffect, useState } from "react";
import type { DadDbRef } from "../../data";
import type { CatalogGroupSource, DataContextType } from "../../data/context";
import { hydrateDadDb } from "../../data/factory";
import { fetchHybridDadDbRefsByCategory } from "../../store/catalog";

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

export type CatalogRouteLoadingInput = CatalogRouteLoadPlanInput & {
  isAuthLoading: boolean;
  setCatalogCategoryDb: DataContextType["setCatalogCategoryDb"];
};

type CatalogRouteLoadedGroup = {
  category: MasterGroup;
  dadDbRef: DadDbRef;
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

async function loadCatalogRouteGroups(
  groupsToFetch: MasterGroup[],
  source: CatalogGroupSource,
): Promise<CatalogRouteLoadedGroup[]> {
  const resolvedGroups = await fetchHybridDadDbRefsByCategory(groupsToFetch, {
    source,
  });

  return resolvedGroups.map((resolvedGroup) => ({
    category: resolvedGroup.category as MasterGroup,
    dadDbRef: resolvedGroup.dadDbRef,
  }));
}

export function useCatalogRouteLoading({
  canEditCatalog,
  catalogGroupSources,
  group,
  isAuthLoading,
  loadedCatalogGroups,
  setCatalogCategoryDb,
}: CatalogRouteLoadingInput) {
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string>();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    let cancelled = false;
    const { groupsToFetch, source } = getCatalogRouteLoadPlan({
      canEditCatalog,
      catalogGroupSources,
      group,
      loadedCatalogGroups,
    });

    if (groupsToFetch.length === 0) {
      setIsCatalogLoading(false);
      setCatalogError(undefined);
      return;
    }

    setIsCatalogLoading(true);
    setCatalogError(undefined);

    async function fetchCatalog() {
      try {
        const loadedGroups = await loadCatalogRouteGroups(
          groupsToFetch,
          source,
        );

        if (!cancelled) {
          loadedGroups.forEach((loadedGroup) => {
            setCatalogCategoryDb(
              loadedGroup.category,
              hydrateDadDb(loadedGroup.dadDbRef),
              source,
            );
          });
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError(
            error instanceof Error
              ? error.message
              : "Failed to load catalogue.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsCatalogLoading(false);
        }
      }
    }

    void fetchCatalog();

    return () => {
      cancelled = true;
    };
  }, [
    canEditCatalog,
    catalogGroupSources,
    group,
    isAuthLoading,
    loadedCatalogGroups,
    setCatalogCategoryDb,
  ]);

  return {
    catalogError,
    isCatalogLoading,
  };
}
