import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  RootHeaderLayout,
  RootLayout,
  RootMobileDrawerLayout,
  RootMobileSearchOverlayLayout,
} from "./layout";

describe("shell slots", () => {
  test("renders header, main, and footer content", () => {
    render(
      <RootLayout
        header={<div>header slot</div>}
        main={<div>main slot</div>}
      />,
    );

    expect(screen.getByText("header slot")).toBeInTheDocument();
    expect(screen.getByText("main slot")).toBeInTheDocument();
    expect(screen.getByText("Join the Discord Server")).toBeInTheDocument();
    expect(screen.getByText(/Site Version/)).toBeInTheDocument();
  });
});

describe("header slots", () => {
  test("renders structural regions from provided content", () => {
    render(
      <RootHeaderLayout
        actions={<button>actions slot</button>}
        auth={<div>auth slot</div>}
        logo={<div>logo slot</div>}
        search={<input aria-label="search slot" />}
        title={<div>title slot</div>}
      />,
    );

    expect(screen.getByText("logo slot")).toBeInTheDocument();
    expect(screen.getByText("title slot")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "search slot" }))
      .toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "actions slot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("auth slot")).toBeInTheDocument();
  });
});

describe("mobile overlays", () => {
  test("closes search from the backdrop only", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <RootMobileSearchOverlayLayout onClose={onClose}>
        <button>search panel</button>
      </RootMobileSearchOverlayLayout>,
    );
    const backdrop = container.firstElementChild as HTMLElement;

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
