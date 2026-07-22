import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { DadUser } from "../../services/auth";
import { MasterGroup } from "../../shared/domain";
import { Main } from "./main";

type Props = Parameters<typeof Main>[0];

type Options = Partial<Props>;

vi.mock("../../features/editor/ui", () => ({
  CollectionEditor: () => <div>collection editor</div>,
  CollectionItemEditor: () => <div>collection item editor</div>,
}));

vi.mock("./mobile-search", () => ({
  MobileSearch: ({
    onClearSearch,
    onClose,
    onSearchChange,
    placeholder,
    searchTerm,
    title,
  }: {
    onClearSearch: () => void;
    onClose: () => void;
    onSearchChange: (value: string) => void;
    placeholder: string;
    searchTerm: string;
    title: string;
  }) => (
    <div>
      <div>search overlay {searchTerm}</div>
      <div>search title {title}</div>
      <div>search placeholder {placeholder}</div>
      <button onClick={() => onSearchChange("sword")}>change search</button>
      <button onClick={onClearSearch}>clear search</button>
      <button onClick={onClose}>close search</button>
    </div>
  ),
}));

vi.mock("./mobile-menu", () => ({
  MobileMenu: ({
    onClose,
    onSignIn,
    onSignOut,
    user,
  }: {
    onClose: () => void;
    onSignIn: () => void;
    onSignOut: () => void;
    user?: DadUser;
  }) => (
    <div>
      <div>site menu</div>
      <div>{user?.email ?? "anonymous"}</div>
      <button onClick={onClose}>close menu</button>
      <button onClick={onSignIn}>sign in</button>
      <button onClick={onSignOut}>sign out</button>
    </div>
  ),
}));

vi.mock("./mobile-settings", () => ({
  MobileSettings: ({
    canEditCatalog,
    isEditMode,
    onClose,
    onSelectCollectionGroup,
    onToggleEditMode,
  }: {
    canEditCatalog: boolean;
    isEditMode: boolean;
    onClose: () => void;
    onSelectCollectionGroup: (group: MasterGroup) => void;
    onToggleEditMode: () => void;
  }) => (
    <div>
      <div>settings drawer {canEditCatalog ? "editable" : "readonly"}</div>
      <div>editor mode {isEditMode ? "on" : "off"}</div>
      <button onClick={onClose}>close settings</button>
      <button onClick={() => onSelectCollectionGroup(MasterGroup.SEASONS)}>
        select group
      </button>
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
    isMobileMenuOpen: false,
    isMobileSearchOpen: false,
    onClearSearch: vi.fn(),
    onCloseMobileContent: vi.fn(),
    onSearchChange: vi.fn(),
    onSelectCollectionGroup: vi.fn(),
    onSignIn: vi.fn(),
    onSignOut: vi.fn(),
    onToggleEditMode: vi.fn(),
    routeOutlet: <div>route outlet</div>,
    searchPlaceholder: "Search transmogs",
    searchTerm: "",
    searchTitle: "Transmog Search",
    showCollectionControls: true,
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
    expect(screen.getByText("search title Transmog Search"))
      .toBeInTheDocument();
    expect(screen.getByText("search placeholder Search transmogs"))
      .toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "change search" }));
    await user.click(screen.getByRole("button", { name: "clear search" }));
    await user.click(screen.getByRole("button", { name: "close search" }));

    expect(props.onSearchChange).toHaveBeenCalledWith("sword");
    expect(props.onClearSearch).toHaveBeenCalledTimes(1);
    expect(props.onCloseMobileContent).toHaveBeenCalledTimes(1);
  });
});

describe("mobile settings", () => {
  test("renders site menu and passes account actions through", async () => {
    const user = userEvent.setup();
    const { props } = renderMain({
      isMobileMenuOpen: true,
      user: signedInUser,
    });

    expect(screen.getByText("site menu")).toBeInTheDocument();
    expect(screen.getByText("dad@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "close menu" }));
    await user.click(screen.getByRole("button", { name: "sign in" }));
    await user.click(screen.getByRole("button", { name: "sign out" }));

    expect(props.onCloseMobileContent).toHaveBeenCalledTimes(1);
    expect(props.onSignIn).toHaveBeenCalledTimes(1);
    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });

  test("renders drawer and passes settings actions through", async () => {
    const user = userEvent.setup();
    const { props } = renderMain({
      canEditCatalog: true,
      isEditMode: true,
      isMobileConfigOpen: true,
    });

    expect(screen.getByText("settings drawer editable")).toBeInTheDocument();
    expect(screen.getByText("editor mode on")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "close settings" }));
    await user.click(screen.getByRole("button", { name: "select group" }));
    await user.click(screen.getByRole("button", { name: "toggle editor" }));

    expect(props.onCloseMobileContent).toHaveBeenCalledTimes(1);
    expect(props.onSelectCollectionGroup).toHaveBeenCalledWith(
      MasterGroup.SEASONS,
    );
    expect(props.onToggleEditMode).toHaveBeenCalledTimes(1);
  });

  test("hides drawer when collection controls are unavailable", () => {
    renderMain({
      isMobileConfigOpen: true,
      showCollectionControls: false,
    });

    expect(screen.queryByText(/settings drawer/)).not.toBeInTheDocument();
  });
});
