import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { DadUser } from "../../auth/type";
import type { SidebarVisibility } from "../../common";
import { Header } from "./header";

type Props = Parameters<typeof Header>[0];

type Options = Partial<Props>;

vi.mock("../../components/Search", () => ({
  default: ({
    onChange,
    onClear,
    placeholder = "search",
    value,
  }: {
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    value: string;
  }) => (
    <div>
      <input
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <button onClick={onClear}>clear {placeholder}</button>
    </div>
  ),
}));

vi.mock("./auth", () => ({
  AuthActions: ({
    onSignIn,
    onSignOut,
    user,
  }: {
    onSignIn: () => void;
    onSignOut: () => void;
    user?: DadUser;
  }) =>
    user === undefined ? (
      <button onClick={onSignIn}>sign in</button>
    ) : (
      <button onClick={onSignOut}>sign out {user.email}</button>
    ),
}));

vi.mock("./header-actions", () => ({
  HeaderActions: ({
    canEditCatalog,
    isEditMode,
    isMobileConfigOpen,
    onToggleConfig,
    onToggleEditMode,
    onToggleItemSidebar,
    onToggleMobileConfig,
    sidebarVisibility,
  }: {
    canEditCatalog: boolean;
    isEditMode: boolean;
    isMobileConfigOpen: boolean;
    onToggleConfig: () => void;
    onToggleEditMode: () => void;
    onToggleItemSidebar: () => void;
    onToggleMobileConfig: () => void;
    sidebarVisibility: SidebarVisibility;
  }) => (
    <div>
      <div>item sidebar {sidebarVisibility.showItem ? "shown" : "hidden"}</div>
      <div>
        settings sidebar {sidebarVisibility.showConfig ? "shown" : "hidden"}
      </div>
      <div>mobile config {isMobileConfigOpen ? "open" : "closed"}</div>
      <div>catalog {canEditCatalog ? "editable" : "readonly"}</div>
      <div>editor {isEditMode ? "on" : "off"}</div>
      <button onClick={onToggleItemSidebar}>toggle item sidebar</button>
      <button onClick={onToggleConfig}>toggle settings sidebar</button>
      <button onClick={onToggleEditMode}>toggle editor</button>
      <button onClick={onToggleMobileConfig}>toggle mobile config</button>
    </div>
  ),
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

function renderHeader(options: Options = {}) {
  const props: Props = {
    canEditCatalog: false,
    isEditMode: false,
    isMobileConfigOpen: false,
    onClearSearch: vi.fn(),
    onSearchChange: vi.fn(),
    onSignIn: vi.fn(),
    onSignOut: vi.fn(),
    onToggleConfig: vi.fn(),
    onToggleEditMode: vi.fn(),
    onToggleItemSidebar: vi.fn(),
    onToggleMobileConfig: vi.fn(),
    searchTerm: "",
    sidebarVisibility: getDefaultSidebarVisibility(),
    ...options,
  };
  const renderResult = render(<Header {...props} />);

  return {
    ...renderResult,
    props,
  };
}

describe("brand", () => {
  test("renders logo and title content", () => {
    renderHeader();

    expect(screen.getByRole("img", { name: "Diablo IV" }))
      .toBeInTheDocument();
    expect(screen.getByText("Diablo IV")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
    expect(screen.getByText("Bringing closure to the completionist in you"))
      .toBeInTheDocument();
  });
});

describe("search", () => {
  test("passes search state and actions through", async () => {
    const user = userEvent.setup();
    const { props } = renderHeader({
      searchTerm: "helm",
    });
    const searchField = screen.getByRole("textbox", {
      name: "Search transmogs",
    });

    expect(searchField).toHaveValue("helm");

    fireEvent.change(searchField, {
      target: {
        value: "sword",
      },
    });
    await user.click(
      screen.getByRole("button", { name: "clear Search transmogs" }),
    );

    expect(props.onSearchChange).toHaveBeenCalledWith("sword");
    expect(props.onClearSearch).toHaveBeenCalledTimes(1);
  });
});

describe("actions", () => {
  test("passes header action state and handlers through", async () => {
    const user = userEvent.setup();
    const { props } = renderHeader({
      canEditCatalog: true,
      isEditMode: true,
      isMobileConfigOpen: true,
      sidebarVisibility: {
        showConfig: false,
        showItem: true,
      },
    });

    expect(screen.getByText("item sidebar shown")).toBeInTheDocument();
    expect(screen.getByText("settings sidebar hidden")).toBeInTheDocument();
    expect(screen.getByText("mobile config open")).toBeInTheDocument();
    expect(screen.getByText("catalog editable")).toBeInTheDocument();
    expect(screen.getByText("editor on")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "toggle item sidebar" }),
    );
    await user.click(
      screen.getByRole("button", { name: "toggle settings sidebar" }),
    );
    await user.click(screen.getByRole("button", { name: "toggle editor" }));
    await user.click(
      screen.getByRole("button", { name: "toggle mobile config" }),
    );

    expect(props.onToggleItemSidebar).toHaveBeenCalledTimes(1);
    expect(props.onToggleConfig).toHaveBeenCalledTimes(1);
    expect(props.onToggleEditMode).toHaveBeenCalledTimes(1);
    expect(props.onToggleMobileConfig).toHaveBeenCalledTimes(1);
  });
});

describe("auth", () => {
  test("passes anonymous and signed-in auth actions through", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderHeader();

    await user.click(screen.getByRole("button", { name: "sign in" }));

    expect(props.onSignIn).toHaveBeenCalledTimes(1);

    rerender(<Header {...props} user={signedInUser} />);

    await user.click(
      screen.getByRole("button", { name: "sign out dad@example.com" }),
    );

    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });
});
