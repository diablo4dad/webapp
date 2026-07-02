import type { ReactNode } from "react";
import type { SidebarVisibility } from "../../common";
import Button, { BtnColours } from "../../components/Button";
import {
  Hamburger,
  Pencil,
  SidebarLeft,
  SidebarRight,
} from "../../components/Icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/Tooltip";
import styles from "./header-actions.module.css";

type Props = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  onToggleConfig: () => void;
  onToggleEditMode: () => void;
  onToggleItemSidebar: () => void;
  onToggleMobileConfig: () => void;
  sidebarVisibility: SidebarVisibility;
};

type ToggleProps = {
  ariaLabel?: string;
  children: ReactNode;
  isPressed: boolean;
  onToggle: () => void;
  tooltip: string;
};

function RootHeaderActions({
  canEditCatalog,
  isEditMode,
  isMobileConfigOpen,
  onToggleConfig,
  onToggleEditMode,
  onToggleItemSidebar,
  onToggleMobileConfig,
  sidebarVisibility,
}: Props) {
  return (
    <>
      <RootHeaderToggle
        isPressed={sidebarVisibility.showItem}
        onToggle={onToggleItemSidebar}
        tooltip={
          sidebarVisibility.showItem ? "Hide Item Sidebar" : "Show Item Sidebar"
        }
      >
        <SidebarLeft />
      </RootHeaderToggle>
      <RootHeaderToggle
        isPressed={sidebarVisibility.showConfig}
        onToggle={onToggleConfig}
        tooltip={
          sidebarVisibility.showConfig
            ? "Hide Settings Sidebar"
            : "Show Settings Sidebar"
        }
      >
        <SidebarRight />
      </RootHeaderToggle>
      {canEditCatalog && (
        <RootHeaderToggle
          ariaLabel={isEditMode ? "Disable editor mode" : "Enable editor mode"}
          isPressed={isEditMode}
          onToggle={onToggleEditMode}
          tooltip={isEditMode ? "Disable Editor Mode" : "Enable Editor Mode"}
        >
          <Pencil />
        </RootHeaderToggle>
      )}
      <Button
        aria-label="Settings menu"
        aria-pressed={isMobileConfigOpen}
        onClick={onToggleMobileConfig}
        pressed={isMobileConfigOpen}
        showOnly={"mobile"}
      >
        <Hamburger />
      </Button>
    </>
  );
}

function RootHeaderToggle({
  ariaLabel,
  children,
  isPressed,
  onToggle,
  tooltip,
}: ToggleProps) {
  return (
    <Tooltip placement={"bottom"}>
      <TooltipTrigger asChild={true}>
        <Button
          onClick={onToggle}
          pressed={isPressed}
          showOnly={"desktop"}
          colour={BtnColours.Dark}
          aria-label={ariaLabel ?? tooltip}
          aria-pressed={isPressed}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className={styles.HeaderActionsToggleTooltip}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export { RootHeaderActions };
