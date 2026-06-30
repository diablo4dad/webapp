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
  test.each([
    [
      "search",
      RootMobileSearchOverlayLayout,
      "search panel",
    ],
    [
      "drawer",
      RootMobileDrawerLayout,
      "drawer panel",
    ],
  ])("closes %s from the backdrop only", async (_label, Layout, panelText) => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <Layout onClose={onClose}>
        <button>{panelText}</button>
      </Layout>,
    );
    const backdrop = container.firstElementChild as HTMLElement;

    await user.click(screen.getByRole("button", { name: panelText }));

    expect(onClose).not.toHaveBeenCalled();

    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
