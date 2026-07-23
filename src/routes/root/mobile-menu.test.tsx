import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import type { DadUser } from "../../services/auth";
import { MobileMenu } from "./mobile-menu";

type Props = Parameters<typeof MobileMenu>[0];

type Options = Partial<Props> & {
  initialPath?: string;
};

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

const signedInUser: DadUser = {
  email: "dad@example.com",
  isEditor: false,
  providerId: "discord",
  roles: [],
  uid: "dad-user",
};

function renderMenu({
  initialPath = "/",
  ...options
}: Options = {}) {
  const props: Props = {
    onClose: vi.fn(),
    onSignIn: vi.fn(),
    onSignOut: vi.fn(),
    ...options,
  };
  const renderResult = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MobileMenu {...props} />
    </MemoryRouter>,
  );

  return {
    ...renderResult,
    props,
  };
}

describe("mobile menu", () => {
  test("renders navigation and anonymous auth controls", async () => {
    const user = userEvent.setup();
    const { props } = renderMenu();

    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tracker" }))
      .toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Stats" }))
      .toHaveAttribute("href", "/stats");
    expect(screen.getByRole("link", { name: "Database" }))
      .toHaveAttribute("href", "/database");
    expect(screen.getByRole("link", { name: "Tracker" }))
      .toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("button", { name: "sign in" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    await user.click(screen.getByRole("link", { name: "Database" }));

    expect(props.onSignIn).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(2);
  });

  test("renders signed-in account controls", async () => {
    const user = userEvent.setup();
    const { props } = renderMenu({
      initialPath: "/database",
      user: signedInUser,
    });

    expect(screen.getByRole("link", { name: "Database" }))
      .toHaveAttribute("aria-current", "page");

    await user.click(
      screen.getByRole("button", { name: "sign out dad@example.com" }),
    );

    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });
});
