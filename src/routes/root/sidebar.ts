import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SIDEBAR_VISIBILITY,
  DUAL_SIDEBAR_MIN_WIDTH,
  constrainSidebarVisibility,
  getSidebarVisibilityPreference,
  type SidebarVisibility,
} from "../../common";

type UseSidebarVisibilityResult = {
  setSidebarVisibility: (sidebarVisibility: SidebarVisibility) => void;
  sidebarVisibility: SidebarVisibility;
};

const dualSidebarMediaQuery = `(min-width: ${DUAL_SIDEBAR_MIN_WIDTH}px)`;

function canShowDualSidebars(): boolean {
  return (
    typeof window === "undefined" ||
    !window.matchMedia ||
    window.matchMedia(dualSidebarMediaQuery).matches
  );
}

function useSidebarVisibility(): UseSidebarVisibilityResult {
  const [sidebarVisibility, setRawSidebarVisibility] =
    useState<SidebarVisibility>(() =>
      constrainSidebarVisibility(
        DEFAULT_SIDEBAR_VISIBILITY,
        canShowDualSidebars(),
      ),
    );
  const setSidebarVisibility = useCallback(
    (nextSidebarVisibility: SidebarVisibility) => {
      setRawSidebarVisibility((currentSidebarVisibility) =>
        constrainSidebarVisibility(
          nextSidebarVisibility,
          canShowDualSidebars(),
          getSidebarVisibilityPreference(
            currentSidebarVisibility,
            nextSidebarVisibility,
          ),
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia(dualSidebarMediaQuery);
    const enforceCurrentBreakpoint = (canShowBoth: boolean) => {
      if (!canShowBoth) {
        setRawSidebarVisibility((currentSidebarVisibility) =>
          constrainSidebarVisibility(currentSidebarVisibility, false),
        );
      }
    };
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      enforceCurrentBreakpoint(event.matches);
    };

    enforceCurrentBreakpoint(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", onBreakpointChange);

      return () => {
        mediaQueryList.removeEventListener("change", onBreakpointChange);
      };
    }

    mediaQueryList.addListener(onBreakpointChange);

    return () => {
      mediaQueryList.removeListener(onBreakpointChange);
    };
  }, []);

  return {
    setSidebarVisibility,
    sidebarVisibility,
  };
}

export { canShowDualSidebars, useSidebarVisibility };
export type { UseSidebarVisibilityResult };
