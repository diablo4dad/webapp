import { MasterGroup, catalogGroups } from "../../common";
import { useEffect, useState } from "react";
import type { DadDbRef } from "../../data";
import type { CatalogGroupSource, DataContextType } from "../../data/context";
import { hydrateDadDb } from "../../data/factory";
import { fetchHybridDadDbRefsByCategory } from "../../store/catalog";

type CatalogGroupSources = Partial<Record<MasterGroup, CatalogGroupSource>>;

export type CatalogLoadPlanInput = {
  canEditCatalog: boolean;
  catalogGroupSources: CatalogGroupSources;
  group: MasterGroup;
  loadedCatalogGroups: readonly MasterGroup[];
};

export type CatalogLoadPlan = {
  groupsToFetch: MasterGroup[];
  source: CatalogGroupSource;
  targetGroups: MasterGroup[];
};

export type CatalogLoadStatus = "waiting" | "idle" | "loading";

export type CatalogLoadStatusInput = {
  groupsToFetch: readonly MasterGroup[];
  isAuthLoading: boolean;
};

export type CatalogLoadingInput = CatalogLoadPlanInput & {
  isAuthLoading: boolean;
  setCatalogCategoryDb: DataContextType["setCatalogCategoryDb"];
};

type LoadedCatalogGroup = {
  category: MasterGroup;
  dadDbRef: DadDbRef;
};

function isCatalogGroup(group: MasterGroup): boolean {
  return catalogGroups.some((category) => category === group);
}

function getCatalogTargetGroups(group: MasterGroup): MasterGroup[] {
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

export function getCatalogLoadPlan({
  canEditCatalog,
  catalogGroupSources,
  group,
  loadedCatalogGroups,
}: CatalogLoadPlanInput): CatalogLoadPlan {
  const source: CatalogGroupSource = canEditCatalog ? "firestore" : "bundle";
  const targetGroups = getCatalogTargetGroups(group);
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

export function getCatalogLoadStatus({
  groupsToFetch,
  isAuthLoading,
}: CatalogLoadStatusInput): CatalogLoadStatus {
  if (isAuthLoading) {
    return "waiting";
  }

  if (groupsToFetch.length === 0) {
    return "idle";
  }

  return "loading";
}

async function loadCatalogGroups(
  groupsToFetch: MasterGroup[],
  source: CatalogGroupSource,
): Promise<LoadedCatalogGroup[]> {
  const resolvedGroups = await fetchHybridDadDbRefsByCategory(groupsToFetch, {
    source,
  });

  return resolvedGroups.map((resolvedGroup) => ({
    category: resolvedGroup.category as MasterGroup,
    dadDbRef: resolvedGroup.dadDbRef,
  }));
}

export function useCatalogLoading({
  canEditCatalog,
  catalogGroupSources,
  group,
  isAuthLoading,
  loadedCatalogGroups,
  setCatalogCategoryDb,
}: CatalogLoadingInput) {
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    const { groupsToFetch, source } = getCatalogLoadPlan({
      canEditCatalog,
      catalogGroupSources,
      group,
      loadedCatalogGroups,
    });
    const loadStatus = getCatalogLoadStatus({
      groupsToFetch,
      isAuthLoading,
    });

    if (loadStatus === "waiting") {
      return;
    }

    if (loadStatus === "idle") {
      setIsCatalogLoading(false);
      setCatalogError(undefined);
      return;
    }

    setIsCatalogLoading(true);
    setCatalogError(undefined);

    async function fetchCatalog() {
      try {
        const loadedGroups = await loadCatalogGroups(
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
