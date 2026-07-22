import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MasterGroup } from "../../shared/domain";
import { MobileSettings } from "./mobile-settings";

type Props = Parameters<typeof MobileSettings>[0];

type Options = Partial<Props>;

vi.mock("../../features/settings/ui", () => ({
  ConfigSidebar: ({
    onSelectCollectionGroup,
  }: {
    onSelectCollectionGroup: (group: MasterGroup) => void;
  }) => (
    <button onClick={() => onSelectCollectionGroup(MasterGroup.SEASONS)}>
      settings panel
    </button>
  ),
}));

function renderDrawer(options: Options = {}) {
  const props: Props = {
    canEditCatalog: false,
    isEditMode: false,
    onClose: vi.fn(),
    onSelectCollectionGroup: vi.fn(),
    onToggleEditMode: vi.fn(),
    ...options,
  };
  const renderResult = render(<MobileSettings {...props} />);

  return {
    ...renderResult,
    props,
  };
}

describe("settings content", () => {
  test("renders collection settings controls", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    expect(screen.getByText("Collection Settings")).toBeInTheDocument();
    expect(screen.getByText("settings panel")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Off" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "sign in" }))
      .not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "settings panel" }));

    expect(props.onSelectCollectionGroup).toHaveBeenCalledWith(
      MasterGroup.SEASONS,
    );
  });
});

describe("editor control", () => {
  test("renders only when catalog editing is allowed", () => {
    const { rerender, props } = renderDrawer();

    expect(screen.queryByRole("button", { name: "Off" }))
      .not.toBeInTheDocument();

    rerender(<MobileSettings {...props} canEditCatalog={true} />);

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
