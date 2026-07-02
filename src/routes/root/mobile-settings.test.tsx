import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { DadUser } from "../../auth/type";
import { MobileSettingsDrawer } from "./mobile-settings";

type Props = Parameters<typeof MobileSettingsDrawer>[0];

type Options = Partial<Props>;

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

function renderDrawer(options: Options = {}) {
  const props: Props = {
    canEditCatalog: false,
    isEditMode: false,
    onClose: vi.fn(),
    onSignIn: vi.fn(),
    onSignOut: vi.fn(),
    onToggleEditMode: vi.fn(),
    ...options,
  };
  const renderResult = render(<MobileSettingsDrawer {...props} />);

  return {
    ...renderResult,
    props,
  };
}

describe("settings content", () => {
  test("renders settings and anonymous auth controls", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("settings panel")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Off" }))
      .not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "sign in" }));

    expect(props.onSignIn).toHaveBeenCalledTimes(1);
  });

  test("renders signed-in auth controls", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer({
      user: signedInUser,
    });

    await user.click(
      screen.getByRole("button", { name: "sign out dad@example.com" }),
    );

    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });
});

describe("editor control", () => {
  test("renders only when catalog editing is allowed", () => {
    const { rerender, props } = renderDrawer();

    expect(screen.queryByRole("button", { name: "Off" }))
      .not.toBeInTheDocument();

    rerender(<MobileSettingsDrawer {...props} canEditCatalog={true} />);

    expect(screen.getByRole("button", { name: "Off" }))
      .toHaveAttribute("aria-pressed", "false");
  });

  test("reflects editor state and passes toggle action through", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer({
      canEditCatalog: true,
      isEditMode: true,
    });
    const toggle = screen.getByRole("button", { name: "On" });

    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);

    expect(props.onToggleEditMode).toHaveBeenCalledTimes(1);
  });
});

describe("closing", () => {
  test("passes close action through", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "Close settings" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
