import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { SidebarVisibility } from "../../common";
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
    isEditMode: false,
    isMobileConfigOpen: false,
    onToggleConfig: vi.fn(),
    onToggleEditMode: vi.fn(),
    onToggleItemSidebar: vi.fn(),
    onToggleMobileConfig: vi.fn(),
    sidebarVisibility: getDefaultSidebarVisibility(),
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
});

describe("editor action", () => {
  test("only renders when catalog editing is allowed", () => {
    const { rerender, props } = renderActions();

    expect(
      screen.queryByRole("button", { name: "Enable editor mode" }),
    ).not.toBeInTheDocument();

    rerender(<HeaderActions {...props} canEditCatalog={true} />);

    expect(screen.getByRole("button", { name: "Enable editor mode" }))
      .toHaveAttribute("aria-pressed", "false");
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
  test("reflects drawer state and passes toggle action through", async () => {
    const user = userEvent.setup();
    const { props } = renderActions({
      isMobileConfigOpen: true,
    });
    const button = screen.getByRole("button", { name: "Settings menu" });

    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);

    expect(props.onToggleMobileConfig).toHaveBeenCalledTimes(1);
  });
});
