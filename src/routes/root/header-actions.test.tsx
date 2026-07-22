import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { SidebarVisibility } from "../../shared/domain";
import { HeaderActions } from "./header-actions";

type Props = Parameters<typeof HeaderActions>[0];

type Options = Partial<Props>;

function getDefaultSidebarVisibility(): SidebarVisibility {
  return {
    showConfig: true,
    showItem: true,
  };
}

function renderActions(options: Options = {}) {
  const props: Props = {
    canEditCatalog: false,
    hasSearchFilter: false,
    isEditMode: false,
    isMobileConfigOpen: false,
    isMobileMenuOpen: false,
    isMobileSearchOpen: false,
    onClearSearch: vi.fn(),
    onToggleConfig: vi.fn(),
    onToggleEditMode: vi.fn(),
    onToggleItemSidebar: vi.fn(),
    onToggleMobileConfig: vi.fn(),
    onToggleMobileMenu: vi.fn(),
    onToggleMobileSearch: vi.fn(),
    sidebarVisibility: getDefaultSidebarVisibility(),
    showCollectionControls: true,
    ...options,
  };
  const renderResult = render(<HeaderActions {...props} />);

  return {
    ...renderResult,
    props,
  };
}

describe("sidebar actions", () => {
  test("reflects sidebar visibility state", () => {
    renderActions({
      sidebarVisibility: {
        showConfig: false,
        showItem: true,
      },
    });

    expect(screen.getByRole("button", { name: "Hide Item Sidebar" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Show Settings Sidebar" }))
      .toHaveAttribute("aria-pressed", "false");
  });

  test("passes sidebar toggle actions through", async () => {
    const user = userEvent.setup();
    const { props } = renderActions();

    await user.click(screen.getByRole("button", { name: "Hide Item Sidebar" }));
    await user.click(
      screen.getByRole("button", { name: "Hide Settings Sidebar" }),
    );

    expect(props.onToggleItemSidebar).toHaveBeenCalledTimes(1);
    expect(props.onToggleConfig).toHaveBeenCalledTimes(1);
  });

  test("hides sidebar controls when the active route does not expose them", () => {
    renderActions({
      showCollectionControls: false,
    });

    expect(
      screen.queryByRole("button", { name: "Hide Item Sidebar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Hide Settings Sidebar" }),
    ).not.toBeInTheDocument();
  });
});

describe("editor action", () => {
  test("only renders when catalog editing is allowed on a collection route", () => {
    const { rerender, props } = renderActions();

    expect(
      screen.queryByRole("button", { name: "Enable editor mode" }),
    ).not.toBeInTheDocument();

    rerender(<HeaderActions {...props} canEditCatalog={true} />);

    expect(screen.getByRole("button", { name: "Enable editor mode" }))
      .toHaveAttribute("aria-pressed", "false");

    rerender(
      <HeaderActions
        {...props}
        canEditCatalog={true}
        showCollectionControls={false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Enable editor mode" }),
    ).not.toBeInTheDocument();
  });

  test("passes editor toggle action through", async () => {
    const user = userEvent.setup();
    const { props } = renderActions({
      canEditCatalog: true,
      isEditMode: true,
    });

    await user.click(
      screen.getByRole("button", { name: "Disable editor mode" }),
    );

    expect(props.onToggleEditMode).toHaveBeenCalledTimes(1);
  });
});

describe("mobile menu action", () => {
  test("reflects search overlay state and passes toggle action through", async () => {
    const user = userEvent.setup();
    const { props } = renderActions({
      isMobileSearchOpen: true,
    });
    const button = screen.getByRole("button", { name: "Search menu" });

    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);

    expect(props.onToggleMobileSearch).toHaveBeenCalledTimes(1);
  });

  test("replaces search action with clear action when filtering", async () => {
    const user = userEvent.setup();
    const { props } = renderActions({
      hasSearchFilter: true,
    });

    expect(
      screen.queryByRole("button", { name: "Search menu" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(props.onClearSearch).toHaveBeenCalledTimes(1);
    expect(props.onToggleMobileSearch).not.toHaveBeenCalled();
  });

  test("reflects collection settings state and passes toggle action through", async () => {
    const user = userEvent.setup();
    const { props } = renderActions({
      isMobileConfigOpen: true,
    });
    const button = screen.getByRole("button", { name: "Collection settings" });

    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button.querySelector("svg")).toHaveAttribute(
      "fill",
      "currentColor",
    );

    await user.click(button);

    expect(props.onToggleMobileConfig).toHaveBeenCalledTimes(1);
  });

  test("shows site menu regardless of collection controls", async () => {
    const user = userEvent.setup();
    const { props } = renderActions({
      isMobileMenuOpen: true,
      showCollectionControls: false,
    });
    const button = screen.getByRole("button", { name: "Site menu" });

    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);

    expect(props.onToggleMobileMenu).toHaveBeenCalledTimes(1);
  });

  test("hides collection settings action when collection controls are unavailable", () => {
    renderActions({
      showCollectionControls: false,
    });

    expect(
      screen.queryByRole("button", { name: "Collection settings" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Site menu" }))
      .toBeInTheDocument();
  });
});
