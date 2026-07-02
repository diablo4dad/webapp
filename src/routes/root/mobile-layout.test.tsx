import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  RootMobileDrawerLayout,
  RootMobileSearchOverlayLayout,
} from "./mobile-layout";

describe("mobile overlays", () => {
  test("renders search slots and closes from the backdrop only", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <RootMobileSearchOverlayLayout
        actions={<div>search actions</div>}
        body={<button>search panel</button>}
        header={<div>search header</div>}
        onClose={onClose}
      />,
    );
    const backdrop = container.firstElementChild as HTMLElement;

    expect(screen.getByText("search header")).toBeInTheDocument();
    expect(screen.getByText("search actions")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "search panel" }));

    expect(onClose).not.toHaveBeenCalled();

    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("renders drawer slots and closes from the backdrop only", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <RootMobileDrawerLayout
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
