import type { SidebarVisibility } from "../../shared/domain";

function toggleSidebarVisibility(
  sidebarVisibility: SidebarVisibility,
  key: keyof SidebarVisibility,
): SidebarVisibility {
  return {
    ...sidebarVisibility,
    [key]: !sidebarVisibility[key],
  };
}

export {
  toggleSidebarVisibility,
};
