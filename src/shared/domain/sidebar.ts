type SidebarVisibility = {
  showItem: boolean;
  showConfig: boolean;
};

type SidebarPanel = "item" | "config";

const DUAL_SIDEBAR_MIN_WIDTH = 1600;

const DEFAULT_SIDEBAR_VISIBILITY: SidebarVisibility = {
  showItem: true,
  showConfig: true,
};

function constrainSidebarVisibility(
  sidebarVisibility: SidebarVisibility,
  canShowDualSidebars: boolean,
  preferredSidebar: SidebarPanel = "item",
): SidebarVisibility {
  if (
    canShowDualSidebars ||
    !sidebarVisibility.showItem ||
    !sidebarVisibility.showConfig
  ) {
    return sidebarVisibility;
  }

  return preferredSidebar === "config"
    ? {
        ...sidebarVisibility,
        showItem: false,
      }
    : {
        ...sidebarVisibility,
        showConfig: false,
      };
}

function getSidebarVisibilityPreference(
  current: SidebarVisibility,
  next: SidebarVisibility,
): SidebarPanel {
  if (!current.showItem && next.showItem) {
    return "item";
  }

  if (!current.showConfig && next.showConfig) {
    return "config";
  }

  if (next.showItem && !next.showConfig) {
    return "item";
  }

  if (!next.showItem && next.showConfig) {
    return "config";
  }

  return "item";
}

export {
  DEFAULT_SIDEBAR_VISIBILITY,
  DUAL_SIDEBAR_MIN_WIDTH,
  constrainSidebarVisibility,
  getSidebarVisibilityPreference,
  type SidebarPanel,
  type SidebarVisibility,
};
