import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { SidebarVisibility } from "../../common";
import type { DadUser } from "../../auth/type";
import { RootContent } from "./state";
import { RootView } from "./view";

type ViewProps = Parameters<typeof RootView>[0];

type ViewOptions = Partial<ViewProps>;

vi.mock("../../auth/Account", () => ({
  Direction: {
    ROW: "row",
  },
  default: ({
    currentUser,
    onLogout,
  }: {
    currentUser: DadUser;
    onLogout: () => void;
  }) => <button onClick={onLogout}>sign out {currentUser.email}</button>,
}));

vi.mock("../../auth/Authenticate", () => ({
  Orientation: {
    ROW: "row",
  },
  default: ({ onAuth }: { onAuth: () => void }) => (
    <button onClick={onAuth}>sign in</button>
  ),
}));

vi.mock("../../components/Search", () => ({
  default: ({
    autoFocus,
    onChange,
    onClear,
    placeholder = "search",
    value,
  }: {
    autoFocus?: boolean;
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    value: string;
  }) => (
    <div>
      <input
        aria-label={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <button onClick={onClear}>clear {placeholder}</button>
    </div>
  ),
}));

vi.mock("../../components/Tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div role="tooltip">{children}</div>
  ),
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../editor/CollectionEditor", () => ({
  default: () => <div>collection editor</div>,
}));

vi.mock("../../editor/CollectionItemEditor", () => ({
  default: () => <div>collection item editor</div>,
}));

vi.mock("../../settings/ConfigSidebar", () => ({
  default: () => <div>settings panel</div>,
}));

const signedInUser: DadUser = {
  email: "dad@example.com",
  isEditor: false,
  providerId: "discord",
  roles: [],
  uid: "dad-user",
};

function getDefaultSidebarVisibility(): SidebarVisibility {
  return {
    showConfig: true,
    showItem: true,
  };
}

function renderView(options: ViewOptions = {}) {
  const props: ViewProps = {
    canEditCatalog: false,
    content: RootContent.LEDGER,
    isEditMode: false,
    onClearSearch: vi.fn(),
    onCloseMobileContent: vi.fn(),
    onSearchChange: vi.fn(),
    onSignIn: vi.fn(),
    onSignOut: vi.fn(),
    onToggleConfig: vi.fn(),
    onToggleEditMode: vi.fn(),
    onToggleItemSidebar: vi.fn(),
    onToggleMobileConfig: vi.fn(),
    routeOutlet: <div>route outlet</div>,
    searchTerm: "",
    sidebarVisibility: getDefaultSidebarVisibility(),
    ...options,
  };
  const renderResult = render(<RootView {...props} />);

  return {
    ...renderResult,
    props,
  };
}

describe("shell", () => {
  test("renders route content, editors, and header controls", () => {
    renderView({
      searchTerm: "helm",
    });

    expect(screen.getByText("route outlet")).toBeInTheDocument();
    expect(screen.getByText("collection editor")).toBeInTheDocument();
    expect(screen.getByText("collection item editor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide Item Sidebar" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hide Settings Sidebar" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Settings menu" }))
      .toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("textbox", { name: "Search transmogs" }))
      .toHaveValue("helm");
  });

  test("passes header actions through props", async () => {
    const user = userEvent.setup();
    const { props } = renderView();

    await user.click(screen.getByRole("button", { name: "Hide Item Sidebar" }));
    await user.click(
      screen.getByRole("button", { name: "Hide Settings Sidebar" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Search transmogs" }), {
      target: {
        value: "sword",
      },
    });
    await user.click(
      screen.getByRole("button", { name: "clear Search transmogs" }),
    );

    expect(props.onToggleItemSidebar).toHaveBeenCalledTimes(1);
    expect(props.onToggleConfig).toHaveBeenCalledTimes(1);
    expect(props.onSearchChange).toHaveBeenCalledWith("sword");
    expect(props.onClearSearch).toHaveBeenCalledTimes(1);
  });
});

describe("auth actions", () => {
  test("passes anonymous and signed-in auth actions through props", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderView();

    await user.click(screen.getByRole("button", { name: "sign in" }));

    expect(props.onSignIn).toHaveBeenCalledTimes(1);

    rerender(<RootView {...props} user={signedInUser} />);

    await user.click(
      screen.getByRole("button", { name: "sign out dad@example.com" }),
    );

    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });
});

describe("mobile settings", () => {
  test("renders settings drawer from content state", async () => {
    const user = userEvent.setup();
    const { props } = renderView({
      canEditCatalog: true,
      content: RootContent.CONFIG,
    });

    expect(screen.getByRole("button", { name: "Settings menu" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("settings panel")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close settings" }));
    await user.click(screen.getByRole("button", { name: "Off" }));

    expect(props.onCloseMobileContent).toHaveBeenCalledTimes(1);
    expect(props.onToggleEditMode).toHaveBeenCalledTimes(1);
  });
});
