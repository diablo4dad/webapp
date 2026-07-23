import type { ReactNode } from "react";
import type { SidebarVisibility } from "../../shared/domain";
import Button, { BtnColours } from "../../shared/ui/Button";
import {
  Close,
  Gear,
  Hamburger,
  Pencil,
  SearchIcon,
  SidebarLeft,
  SidebarRight,
} from "../../shared/ui/Icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../shared/ui/Tooltip";
import styles from "./header-actions.module.css";

type Props = {
  canEditCatalog: boolean;
  hasSearchFilter: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  isMobileMenuOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onToggleConfig: () => void;
  onToggleEditMode: () => void;
  onToggleItemSidebar: () => void;
  onToggleMobileConfig: () => void;
  onToggleMobileMenu: () => void;
  onToggleMobileSearch: () => void;
  sidebarVisibility: SidebarVisibility;
  showCollectionControls: boolean;
  showSearch: boolean;
};

type ToggleProps = {
  ariaLabel?: string;
  children: ReactNode;
  isPressed?: boolean;
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
  isMobileMenuOpen,
  isMobileSearchOpen,
  onClearSearch,
  onToggleConfig,
  onToggleEditMode,
  onToggleItemSidebar,
  onToggleMobileConfig,
  onToggleMobileMenu,
  onToggleMobileSearch,
  sidebarVisibility,
  showCollectionControls,
  showSearch,
}: Props) {
  return (
    <>
      {showCollectionControls && (
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
        </>
      )}
      {canEditCatalog && showCollectionControls && (
        <HeaderToggle
          ariaLabel={isEditMode ? "Disable editor mode" : "Enable editor mode"}
          isPressed={isEditMode}
          onToggle={onToggleEditMode}
          tooltip={isEditMode ? "Disable Editor Mode" : "Enable Editor Mode"}
        >
          <Pencil />
        </HeaderToggle>
      )}
      {showSearch && (
        hasSearchFilter ? (
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
        )
      )}
      {showCollectionControls && (
        <Button
          aria-label="Collection settings"
          aria-pressed={isMobileConfigOpen}
          onClick={onToggleMobileConfig}
          pressed={isMobileConfigOpen}
          showOnly={"mobile"}
        >
          <Gear />
        </Button>
      )}
      <Button
        aria-label="Site menu"
        aria-pressed={isMobileMenuOpen}
        onClick={onToggleMobileMenu}
        pressed={isMobileMenuOpen}
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
          pressed={isPressed ?? false}
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
