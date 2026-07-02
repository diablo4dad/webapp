import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MobileSearchLayout } from "./mobile-search-layout";

describe("search layout", () => {
  test("renders slots and closes from the backdrop only", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(
      <MobileSearchLayout
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
});
