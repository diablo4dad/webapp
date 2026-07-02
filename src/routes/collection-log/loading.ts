import { MasterGroup, catalogGroups } from "../../common";
import { useEffect, useState } from "react";
import type { DadDbRef } from "../../data";
import type { CatalogGroupSource, DataContextType } from "../../data/context";
import { hydrateDadDb } from "../../data/factory";
import { fetchHybridDadDbRefsByCategory } from "../../store/catalog";

type CatalogGroupSources = Partial<Record<MasterGroup, CatalogGroupSource>>;

type CatalogLoadPlanInput = {
  canEditCatalog: boolean;
  catalogGroupSources: CatalogGroupSources;
  group: MasterGroup;
  loadedCatalogGroups: readonly MasterGroup[];
};

type CatalogLoadPlan = {
  groupsToFetch: MasterGroup[];
  source: CatalogGroupSource;
  targetGroups: MasterGroup[];
};

type CatalogLoadStatus = "waiting" | "idle" | "loading";

type CatalogLoadStatusInput = {
  groupsToFetch: readonly MasterGroup[];
  isAuthLoading: boolean;
};

type CatalogLoadRequestInput = CatalogLoadPlanInput & {
  isAuthLoading: boolean;
};

type WaitingCatalogLoadRequest = {
  status: "waiting";
};

type IdleCatalogLoadRequest = {
  status: "idle";
};

type LoadingCatalogLoadRequest = {
  groupsToFetch: MasterGroup[];
  source: CatalogGroupSource;
  status: "loading";
};

type CatalogLoadRequest =
  | WaitingCatalogLoadRequest
  | IdleCatalogLoadRequest
  | LoadingCatalogLoadRequest;

type CatalogLoadingInput = CatalogLoadPlanInput & {
  isAuthLoading: boolean;
  setCatalogCategoryDb: DataContextType["setCatalogCategoryDb"];
};

type LoadedCatalogGroup = {
  category: MasterGroup;
  dadDbRef: DadDbRef;
};

type CatalogLoadStateSetters = {
  setCatalogError: (catalogError?: string) => void;
  setIsCatalogLoading: (isCatalogLoading: boolean) => void;
};

type RunCatalogLoadInput = LoadingCatalogLoadRequest &
  CatalogLoadStateSetters & {
    isCurrent: () => boolean;
    setCatalogCategoryDb: DataContextType["setCatalogCategoryDb"];
  };

function getCatalogLoadPlan({
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

function getCatalogLoadStatus({
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

function getCatalogLoadRequest({
  canEditCatalog,
  catalogGroupSources,
  group,
  isAuthLoading,
  loadedCatalogGroups,
}: CatalogLoadRequestInput): CatalogLoadRequest {
  const { groupsToFetch, source } = getCatalogLoadPlan({
    canEditCatalog,
    catalogGroupSources,
    group,
    loadedCatalogGroups,
  });
  const status = getCatalogLoadStatus({
    groupsToFetch,
    isAuthLoading,
  });

  if (status !== "loading") {
    return {
      status,
    };
  }

  return {
    groupsToFetch,
    source,
    status,
  };
}

function useCatalogLoading({
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
    const request = getCatalogLoadRequest({
      canEditCatalog,
      catalogGroupSources,
      group,
      isAuthLoading,
      loadedCatalogGroups,
    });

    if (!prepareCatalogLoad(request, {
      setCatalogError,
      setIsCatalogLoading,
    })) {
      return;
    }

    void runCatalogLoad({
      ...request,
      isCurrent: () => !cancelled,
      setCatalogCategoryDb,
      setCatalogError,
      setIsCatalogLoading,
    });

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

function prepareCatalogLoad(
  request: CatalogLoadRequest,
  {
    setCatalogError,
    setIsCatalogLoading,
  }: CatalogLoadStateSetters,
): request is LoadingCatalogLoadRequest {
  if (request.status === "waiting") {
    return false;
  }

  if (request.status === "idle") {
    setIsCatalogLoading(false);
    setCatalogError(undefined);
    return false;
  }

  setIsCatalogLoading(true);
  setCatalogError(undefined);
  return true;
}

async function runCatalogLoad({
  groupsToFetch,
  isCurrent,
  setCatalogCategoryDb,
  setCatalogError,
  setIsCatalogLoading,
  source,
}: RunCatalogLoadInput) {
  try {
    const loadedGroups = await loadCatalogGroups(
      groupsToFetch,
      source,
    );

    if (isCurrent()) {
      applyLoadedCatalogGroups(
        loadedGroups,
        source,
        setCatalogCategoryDb,
      );
    }
  } catch (error) {
    if (isCurrent()) {
      setCatalogError(getCatalogLoadErrorMessage(error));
    }
  } finally {
    if (isCurrent()) {
      setIsCatalogLoading(false);
    }
  }
}

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

function applyLoadedCatalogGroups(
  loadedGroups: LoadedCatalogGroup[],
  source: CatalogGroupSource,
  setCatalogCategoryDb: DataContextType["setCatalogCategoryDb"],
) {
  loadedGroups.forEach((loadedGroup) => {
    setCatalogCategoryDb(
      loadedGroup.category,
      hydrateDadDb(loadedGroup.dadDbRef),
      source,
    );
  });
}

function getCatalogLoadErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Failed to load catalogue.";
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

export {
  getCatalogLoadPlan,
  getCatalogLoadStatus,
  useCatalogLoading,
  type CatalogLoadPlan,
  type CatalogLoadPlanInput,
  type CatalogLoadStatus,
  type CatalogLoadStatusInput,
  type CatalogLoadingInput,
};
