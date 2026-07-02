import type { SidebarVisibility } from "../../common";

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
