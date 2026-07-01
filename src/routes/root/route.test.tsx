import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { SidebarVisibility } from "../../common";
import type { DadUser } from "../../auth/type";
import RootRoute from "./route";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  setSearchTerm: vi.fn(),
  setSidebarVisibility: vi.fn(),
  toggleEditMode: vi.fn(),
  useAuth: vi.fn(),
  useData: vi.fn(),
  useEditor: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  Outlet: () => <div>route outlet</div>,
}));

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

vi.mock("../../auth/context", () => ({
  useAuth: mocks.useAuth,
}));

vi.mock("../../data/context", () => ({
  useData: mocks.useData,
}));

vi.mock("../../editor/CollectionEditor", () => ({
  default: () => <div>collection editor</div>,
}));

vi.mock("../../editor/CollectionItemEditor", () => ({
  default: () => <div>collection item editor</div>,
}));

vi.mock("../../editor/context", () => ({
  useEditor: mocks.useEditor,
}));

vi.mock("../../settings/ConfigSidebar", () => ({
  default: () => <div>settings panel</div>,
}));

type RootOptions = {
  canEditCatalog?: boolean;
  isEditMode?: boolean;
  searchTerm?: string;
  sidebarVisibility?: SidebarVisibility;
  user?: DadUser;
};

function renderRoot({
  canEditCatalog = false,
  isEditMode = false,
  searchTerm = "",
  sidebarVisibility = {
    showConfig: true,
    showItem: true,
  },
  user,
}: RootOptions = {}) {
  mocks.useData.mockReturnValue({
    searchTerm,
    setSearchTerm: mocks.setSearchTerm,
    setSidebarVisibility: mocks.setSidebarVisibility,
    sidebarVisibility,
  });
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

  const renderResult = render(<RootRoute />);

  return {
    ...renderResult,
    sidebarVisibility,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("shell content", () => {
  test("renders route, editors, and footer slots", () => {
    renderRoot();

    expect(screen.getByText("route outlet")).toBeInTheDocument();
    expect(screen.getByText("collection editor")).toBeInTheDocument();
    expect(screen.getByText("collection item editor")).toBeInTheDocument();
    expect(screen.getByText("Join the Discord Server")).toBeInTheDocument();
    expect(screen.getByText(/Site Version/)).toBeInTheDocument();
  });

  test("passes search changes to data context", () => {
    renderRoot();

    fireEvent.change(screen.getByPlaceholderText("Search transmogs"), {
      target: {
        value: "helm",
      },
    });

    expect(mocks.setSearchTerm).toHaveBeenCalledWith("helm");
  });
});

describe("header actions", () => {
  test("toggles sidebars", async () => {
    const user = userEvent.setup();
    const root = renderRoot({
      sidebarVisibility: {
        showConfig: true,
        showItem: true,
      },
    });
    const [itemSidebarButton, settingsSidebarButton] =
      screen.getAllByRole("button");

    await user.click(itemSidebarButton);

    expect(mocks.setSidebarVisibility).toHaveBeenCalledWith({
      ...root.sidebarVisibility,
      showItem: false,
    });

    await user.click(settingsSidebarButton);

    expect(mocks.setSidebarVisibility).toHaveBeenCalledWith({
      ...root.sidebarVisibility,
      showConfig: false,
    });
  });

  test("shows editor controls only for editors", async () => {
    const user = userEvent.setup();
    const { rerender } = renderRoot();

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
});

describe("mobile settings", () => {
  test("opens settings drawer from the mobile menu button", async () => {
    const user = userEvent.setup();
    renderRoot({
      canEditCatalog: true,
    });
    const buttons = screen.getAllByRole("button");
    const mobileMenuButton = buttons[3];

    await user.click(mobileMenuButton);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("route outlet")).toBeInTheDocument();
    expect(screen.getByText("settings panel")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /off/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  test("returns to the ledger when the settings drawer closes", async () => {
    const user = userEvent.setup();
    renderRoot();
    const buttons = screen.getAllByRole("button");
    const mobileMenuButton = buttons[2];

    await user.click(mobileMenuButton);
    await user.click(screen.getByRole("button", { name: "Close settings" }));

    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.getByText("route outlet")).toBeInTheDocument();
  });

  test("keeps settings drawer open when panel content is clicked", async () => {
    const user = userEvent.setup();
    renderRoot();
    const buttons = screen.getAllByRole("button");
    const mobileMenuButton = buttons[2];

    await user.click(mobileMenuButton);
    await user.click(screen.getByText("settings panel"));

    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});
