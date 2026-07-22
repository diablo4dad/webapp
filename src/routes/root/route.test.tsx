import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { MasterGroup } from "../../shared/domain";
import type { DadUser } from "../../services/auth";
import RootRoute from "./route";

type Options = {
  canEditCatalog?: boolean;
  isEditMode?: boolean;
  user?: DadUser;
};

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  pathname: "/",
  signIn: vi.fn(),
  signOut: vi.fn(),
  toggleEditMode: vi.fn(),
  useAuth: vi.fn(),
  useEditor: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  Link: ({
    children,
    to,
    ...props
  }: {
    children: ReactNode;
    to: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  Outlet: () => <div>route outlet</div>,
  useLocation: () => ({
    pathname: mocks.pathname,
  }),
  useNavigate: mocks.useNavigate,
}));

vi.mock("../../features/account/ui", () => ({
  Account: ({
    currentUser,
    onLogout,
  }: {
    currentUser: DadUser;
    onLogout: () => void;
  }) => <button onClick={onLogout}>sign out {currentUser.email}</button>,
  Authenticate: ({ onAuth }: { onAuth: () => void }) => (
    <button onClick={onAuth}>sign in</button>
  ),
  Direction: {
    ROW: "row",
  },
  Orientation: {
    ROW: "row",
  },
}));

vi.mock("../../services/auth", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../features/editor/ui", () => ({
  CollectionEditor: () => <div>collection editor</div>,
  CollectionItemEditor: () => <div>collection item editor</div>,
}));

vi.mock("../../features/editor", () => ({
  useEditor: mocks.useEditor,
}));

vi.mock("../../features/settings/ui", () => ({
  ConfigSidebar: ({
    onSelectCollectionGroup,
  }: {
    onSelectCollectionGroup: (group: MasterGroup) => void;
  }) => (
    <button onClick={() => onSelectCollectionGroup(MasterGroup.CHALLENGE)}>
      settings panel
    </button>
  ),
}));

const signedInUser: DadUser = {
  email: "dad@example.com",
  isEditor: false,
  providerId: "discord",
  roles: [],
  uid: "dad-user",
};

function renderRoute({
  canEditCatalog = false,
  isEditMode = false,
  user,
}: Options = {}) {
  mocks.useAuth.mockReturnValue({
    signIn: mocks.signIn,
    signOut: mocks.signOut,
    user,
  });
  mocks.useEditor.mockReturnValue({
    canEditCatalog,
    isEditMode,
    toggleEditMode: mocks.toggleEditMode,
  });
  mocks.useNavigate.mockReturnValue(mocks.navigate);

  const renderResult = render(<RootRoute />);

  return {
    ...renderResult,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.pathname = "/";
});

describe("shell content", () => {
  test("renders route, editors, and footer slots", () => {
    renderRoute();

    expect(screen.getByText("route outlet")).toBeInTheDocument();
    expect(screen.getByText("collection editor")).toBeInTheDocument();
    expect(screen.getByText("collection item editor")).toBeInTheDocument();
    expect(screen.getByText("Join the Discord Server")).toBeInTheDocument();
    expect(screen.getByText(/Site Version/)).toBeInTheDocument();
  });

  test("updates search state", () => {
    renderRoute();
    const searchField = screen.getByPlaceholderText("Search transmogs");

    fireEvent.change(searchField, {
      target: {
        value: "helm",
      },
    });

    expect(searchField).toHaveValue("helm");
  });
});

describe("header actions", () => {
  test("toggles sidebars", async () => {
    const user = userEvent.setup();
    renderRoute();
    const itemSidebarButton = screen.getByRole("button", {
      name: "Hide Item Sidebar",
    });
    const settingsSidebarButton = screen.getByRole("button", {
      name: "Hide Settings Sidebar",
    });

    await user.click(itemSidebarButton);

    expect(
      screen.getByRole("button", { name: "Show Item Sidebar" }),
    ).toHaveAttribute("aria-pressed", "false");

    await user.click(settingsSidebarButton);

    expect(
      screen.getByRole("button", { name: "Show Settings Sidebar" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("shows editor controls only for editors", async () => {
    const user = userEvent.setup();
    const { rerender } = renderRoute();

    expect(
      screen.queryByRole("button", { name: "Enable editor mode" }),
    ).not.toBeInTheDocument();

    mocks.useEditor.mockReturnValue({
      canEditCatalog: true,
      isEditMode: false,
      toggleEditMode: mocks.toggleEditMode,
    });

    rerender(<RootRoute />);

    await user.click(screen.getByRole("button", { name: "Enable editor mode" }));

    expect(mocks.toggleEditMode).toHaveBeenCalledTimes(1);
  });

  test("shows main navigation for everyone", () => {
    renderRoute();

    expect(screen.getByRole("link", { name: "Collection" }))
      .toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Database" }))
      .toHaveAttribute("href", "/database");
  });
});

describe("auth actions", () => {
  test("passes sign-in action to anonymous controls", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(screen.getByRole("button", { name: "sign in" }));

    expect(mocks.signIn).toHaveBeenCalledTimes(1);
  });

  test("passes sign-out action to signed-in controls", async () => {
    const user = userEvent.setup();
    renderRoute({
      user: signedInUser,
    });

    await user.click(
      screen.getByRole("button", { name: "sign out dad@example.com" }),
    );

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });
});

describe("mobile settings", () => {
  test("opens collection settings from the settings button", async () => {
    const user = userEvent.setup();
    renderRoute({
      canEditCatalog: true,
    });
    const mobileSettingsButton = screen.getByRole("button", {
      name: "Collection settings",
    });

    await user.click(mobileSettingsButton);

    expect(screen.getByText("Collection Settings")).toBeInTheDocument();
    expect(screen.getByText("route outlet")).toBeInTheDocument();
    expect(screen.getByText("settings panel")).toBeInTheDocument();
    const mobileEditorToggle = screen.getByRole("button", { name: /off/i });

    expect(mobileEditorToggle).toHaveAttribute("aria-pressed", "false");

    await user.click(mobileEditorToggle);

    expect(mocks.toggleEditMode).toHaveBeenCalledTimes(1);
  });

  test("returns to the ledger when the settings drawer closes", async () => {
    const user = userEvent.setup();
    renderRoute();
    const mobileSettingsButton = screen.getByRole("button", {
      name: "Collection settings",
    });

    await user.click(mobileSettingsButton);
    await user.click(screen.getByRole("button", { name: "Close settings" }));

    expect(screen.queryByText("Collection Settings")).not.toBeInTheDocument();
    expect(screen.getByText("route outlet")).toBeInTheDocument();
  });

  test("keeps settings drawer open when panel content is clicked", async () => {
    const user = userEvent.setup();
    renderRoute();
    const mobileSettingsButton = screen.getByRole("button", {
      name: "Collection settings",
    });

    await user.click(mobileSettingsButton);
    await user.click(screen.getByText("settings panel"));

    expect(screen.getByText("Collection Settings")).toBeInTheDocument();
  });
});

describe("mobile site menu", () => {
  test("opens site menu from the hamburger button", async () => {
    const user = userEvent.setup();
    renderRoute({
      user: signedInUser,
    });

    await user.click(screen.getByRole("button", { name: "Site menu" }));

    expect(screen.getByText("Menu")).toBeInTheDocument();
    const mobileNavigation = within(screen.getByRole("navigation", {
      name: "Mobile navigation",
    }));

    expect(mobileNavigation.getByRole("link", { name: "Collection" }))
      .toHaveAttribute("href", "/");
    expect(mobileNavigation.getByRole("link", { name: "Database" }))
      .toHaveAttribute("href", "/database");

    const mobileMenu = screen.getByText("Menu").closest("aside");

    expect(mobileMenu).not.toBeNull();

    await user.click(
      within(mobileMenu as HTMLElement).getByRole("button", {
        name: "sign out dad@example.com",
      }),
    );

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
  });

  test("tracks the active route in the site menu", async () => {
    const user = userEvent.setup();
    mocks.pathname = "/database";
    renderRoute();

    await user.click(screen.getByRole("button", { name: "Site menu" }));

    expect(screen.getByText("Menu")).toBeInTheDocument();
    const mobileNavigation = within(screen.getByRole("navigation", {
      name: "Mobile navigation",
    }));

    expect(mobileNavigation.getByRole("link", { name: "Database" }))
      .toHaveAttribute("aria-current", "page");
  });
});

describe("mobile search", () => {
  test("opens search overlay from the mobile search button", async () => {
    const user = userEvent.setup();
    renderRoute();
    const mobileSearchButton = screen.getByRole("button", {
      name: "Search menu",
    });

    await user.click(mobileSearchButton);

    expect(screen.getByText("Transmog Search")).toBeInTheDocument();
    const mobileSearchField = screen.getAllByPlaceholderText(
      "Search transmogs",
    )[1];

    expect(mobileSearchField).toHaveValue("");

    fireEvent.change(mobileSearchField, {
      target: {
        value: "sword",
      },
    });
    fireEvent.submit(mobileSearchField.closest("form")!);

    expect(screen.queryByText("Transmog Search")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search transmogs")).toHaveValue(
      "sword",
    );
    expect(screen.getByText("route outlet")).toBeInTheDocument();
  });

  test("clears active search filters from the mobile header", async () => {
    const user = userEvent.setup();
    renderRoute();
    fireEvent.change(screen.getByPlaceholderText("Search transmogs"), {
      target: {
        value: "helm",
      },
    });

    expect(
      screen.queryByRole("button", { name: "Search menu" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(screen.getByPlaceholderText("Search transmogs")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Search menu" }),
    ).toBeInTheDocument();
  });

  test("replaces search overlay when the settings drawer opens", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(screen.getByRole("button", { name: "Search menu" }));
    await user.click(
      screen.getByRole("button", { name: "Collection settings" }),
    );

    expect(screen.queryByText("Transmog Search")).not.toBeInTheDocument();
    expect(screen.getByText("Collection Settings")).toBeInTheDocument();
  });

  test("replaces search overlay when the site menu opens", async () => {
    const user = userEvent.setup();
    renderRoute();

    await user.click(screen.getByRole("button", { name: "Search menu" }));
    await user.click(screen.getByRole("button", { name: "Site menu" }));

    expect(screen.queryByText("Transmog Search")).not.toBeInTheDocument();
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });
});
