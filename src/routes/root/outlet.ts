import { useOutletContext } from "react-router-dom";
import type { SidebarVisibility } from "../../shared/domain";

type RootOutletContext = {
  searchTerm: string;
  sidebarVisibility: SidebarVisibility;
};

function useRootOutletContext(): RootOutletContext {
  return useOutletContext<RootOutletContext>();
}

export { useRootOutletContext };
export type { RootOutletContext };
