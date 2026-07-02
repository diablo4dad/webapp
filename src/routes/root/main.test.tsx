import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { DadUser } from "../../auth/type";
import { Main } from "./main";

type Props = Parameters<typeof Main>[0];

type Options = Partial<Props>;

vi.mock("../../editor/CollectionEditor", () => ({
  default: () => <div>collection editor</div>,
}));

vi.mock("../../editor/CollectionItemEditor", () => ({
  default: () => <div>collection item editor</div>,
}));

vi.mock("./mobile-search", () => ({
  MobileSearchOverlay: ({
    onClearSearch,
    onClose,
    onSearchChange,
    searchTerm,
  }: {
    onClearSearch: () => void;
    onClose: () => void;
    onSearchChange: (value: string) => void;
    searchTerm: string;
  }) => (
    <div>
      <div>search overlay {searchTerm}</div>
      <button onClick={() => onSearchChange("sword")}>change search</button>
      <button onClick={onClearSearch}>clear search</button>
      <button onClick={onClose}>close search</button>
    </div>
  ),
}));

vi.mock("./mobile-settings", () => ({
  MobileSettingsDrawer: ({
    canEditCatalog,
    isEditMode,
    onClose,
    onSignIn,
    onSignOut,
    onToggleEditMode,
    user,
  }: {
    canEditCatalog: boolean;
    isEditMode: boolean;
    onClose: () => void;
    onSignIn: () => void;
    onSignOut: () => void;
    onToggleEditMode: () => void;
    user?: DadUser;
  }) => (
    <div>
      <div>settings drawer {canEditCatalog ? "editable" : "readonly"}</div>
      <div>editor mode {isEditMode ? "on" : "off"}</div>
      <div>{user?.email ?? "anonymous"}</div>
      <button onClick={onClose}>close settings</button>
      <button onClick={onSignIn}>sign in</button>
      <button onClick={onSignOut}>sign out</button>
      <button onClick={onToggleEditMode}>toggle editor</button>
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

function renderMain(options: Options = {}) {
  const props: Props = {
    canEditCatalog: false,
    isEditMode: false,
    isMobileConfigOpen: false,
    isMobileSearchOpen: false,
    onClearSearch: vi.fn(),
    onCloseMobileContent: vi.fn(),
    onSearchChange: vi.fn(),
    onSignIn: vi.fn(),
    onSignOut: vi.fn(),
    onToggleEditMode: vi.fn(),
    routeOutlet: <div>route outlet</div>,
    searchTerm: "",
    ...options,
  };
  const renderResult = render(<Main {...props} />);

  return {
    ...renderResult,
    props,
  };
}

describe("base content", () => {
  test("renders route outlet and editor surfaces", () => {
    renderMain();

    expect(screen.getByText("route outlet")).toBeInTheDocument();
    expect(screen.getByText("collection editor")).toBeInTheDocument();
    expect(screen.getByText("collection item editor")).toBeInTheDocument();
  });
});

describe("mobile search", () => {
  test("renders overlay and passes search actions through", async () => {
    const user = userEvent.setup();
    const { props } = renderMain({
      isMobileSearchOpen: true,
      searchTerm: "helm",
    });

    expect(screen.getByText("search overlay helm")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "change search" }));
    await user.click(screen.getByRole("button", { name: "clear search" }));
    await user.click(screen.getByRole("button", { name: "close search" }));

    expect(props.onSearchChange).toHaveBeenCalledWith("sword");
    expect(props.onClearSearch).toHaveBeenCalledTimes(1);
    expect(props.onCloseMobileContent).toHaveBeenCalledTimes(1);
  });
});

describe("mobile settings", () => {
  test("renders drawer and passes settings actions through", async () => {
    const user = userEvent.setup();
    const { props } = renderMain({
      canEditCatalog: true,
      isEditMode: true,
      isMobileConfigOpen: true,
      user: signedInUser,
    });

    expect(screen.getByText("settings drawer editable")).toBeInTheDocument();
    expect(screen.getByText("editor mode on")).toBeInTheDocument();
    expect(screen.getByText("dad@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "close settings" }));
    await user.click(screen.getByRole("button", { name: "sign in" }));
    await user.click(screen.getByRole("button", { name: "sign out" }));
    await user.click(screen.getByRole("button", { name: "toggle editor" }));

    expect(props.onCloseMobileContent).toHaveBeenCalledTimes(1);
    expect(props.onSignIn).toHaveBeenCalledTimes(1);
    expect(props.onSignOut).toHaveBeenCalledTimes(1);
    expect(props.onToggleEditMode).toHaveBeenCalledTimes(1);
  });
});
