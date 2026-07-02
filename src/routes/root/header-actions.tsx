import type { ReactNode } from "react";
import type { SidebarVisibility } from "../../common";
import Button, { BtnColours } from "../../components/Button";
import {
  Close,
  Hamburger,
  Pencil,
  SearchIcon,
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
  hasSearchFilter: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onToggleConfig: () => void;
  onToggleEditMode: () => void;
  onToggleItemSidebar: () => void;
  onToggleMobileConfig: () => void;
  onToggleMobileSearch: () => void;
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
  hasSearchFilter,
  isEditMode,
  isMobileConfigOpen,
  isMobileSearchOpen,
  onClearSearch,
  onToggleConfig,
  onToggleEditMode,
  onToggleItemSidebar,
  onToggleMobileConfig,
  onToggleMobileSearch,
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
      {hasSearchFilter ? (
        <Button
          aria-label="Clear search"
          onClick={onClearSearch}
          showOnly={"mobile"}
        >
          <Close />
        </Button>
      ) : (
        <Button
          aria-label="Search menu"
          aria-pressed={isMobileSearchOpen}
          onClick={onToggleMobileSearch}
          pressed={isMobileSearchOpen}
          showOnly={"mobile"}
        >
          <SearchIcon />
        </Button>
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
