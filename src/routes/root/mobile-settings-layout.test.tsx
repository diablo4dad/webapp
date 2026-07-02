import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MobileSettingsLayout } from "./mobile-settings-layout";

describe("settings layout", () => {
  test("renders slots and closes from the backdrop only", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <MobileSettingsLayout
        body={<button>drawer panel</button>}
        footer={<div>drawer footer</div>}
        header={<div>drawer header</div>}
        onClose={onClose}
      />,
    );
    const backdrop = container.firstElementChild as HTMLElement;

    expect(screen.getByText("drawer header")).toBeInTheDocument();
    expect(screen.getByText("drawer footer")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "drawer panel" }));

    expect(onClose).not.toHaveBeenCalled();

    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
