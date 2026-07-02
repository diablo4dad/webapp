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

type SidebarName = "Item" | "Settings";

type SidebarToggleProps = {
  children: ReactNode;
  isPressed: boolean;
  onToggle: () => void;
  sidebarName: SidebarName;
};

function HeaderActions({
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
      <SidebarToggle
        isPressed={sidebarVisibility.showItem}
        onToggle={onToggleItemSidebar}
        sidebarName="Item"
      >
        <SidebarLeft />
      </SidebarToggle>
      <SidebarToggle
        isPressed={sidebarVisibility.showConfig}
        onToggle={onToggleConfig}
        sidebarName="Settings"
      >
        <SidebarRight />
      </SidebarToggle>
      {canEditCatalog && (
        <HeaderToggle
          ariaLabel={isEditMode ? "Disable editor mode" : "Enable editor mode"}
          isPressed={isEditMode}
          onToggle={onToggleEditMode}
          tooltip={isEditMode ? "Disable Editor Mode" : "Enable Editor Mode"}
        >
          <Pencil />
        </HeaderToggle>
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

function SidebarToggle({
  children,
  isPressed,
  onToggle,
  sidebarName,
}: SidebarToggleProps) {
  return (
    <HeaderToggle
      isPressed={isPressed}
      onToggle={onToggle}
      tooltip={getSidebarToggleTooltip(sidebarName, isPressed)}
    >
      {children}
    </HeaderToggle>
  );
}

function HeaderToggle({
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

function getSidebarToggleTooltip(
  sidebarName: SidebarName,
  isVisible: boolean,
) {
  return `${isVisible ? "Hide" : "Show"} ${sidebarName} Sidebar`;
}

export { HeaderActions };
