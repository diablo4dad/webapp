import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ProgressView } from "./view";
import type { ProgressViewModel } from "./view-model";

function model(): ProgressViewModel {
  return {
    cards: [],
    grandTotal: {
      collected: 1,
      isComplete: false,
      percent: 25,
      remaining: 3,
      title: "Grand Total",
      total: 4,
    },
    selectedScope: {
      collected: 1,
      iconSrc: "/collection-icon.webp",
      id: "Season",
      isComplete: false,
      percent: 50,
      positionLabel: "4 of 6",
      remaining: 1,
      title: "Seasons",
      total: 2,
    },
  };
}

describe("progress dashboard", () => {
  test("renders carousel summary and passes navigation actions through", async () => {
    const user = userEvent.setup();
    const onSelectNextScope = vi.fn();
    const onSelectPreviousScope = vi.fn();
    const onShowOutOfRotationChange = vi.fn();
    const onShowPremiumChange = vi.fn();

    const { container } = render(
      <ProgressView
        filterControls={[
          {
            checked: true,
            label: "Show Premium",
            name: "show-premium",
            onChange: onShowPremiumChange,
          },
          {
            checked: false,
            label: "Show Out of Rotation",
            name: "show-out-of-rotation",
            onChange: onShowOutOfRotationChange,
          },
        ]}
        layout="expanded"
        model={model()}
        onSelectNextScope={onSelectNextScope}
        onSelectPreviousScope={onSelectPreviousScope}
        variant="dashboard"
      />,
    );

    expect(screen.getByText("Collection Progress")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seasons" }))
      .toBeInTheDocument();
    expect(container.querySelector('img[src="/collection-icon.webp"]'))
      .not.toBeNull();
    expect(screen.getByText("4 of 6")).toBeInTheDocument();
    expect(screen.getByText("Overall")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Collected")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Remaining")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Item Types" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Collection Groups" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Most Remaining" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Complete Types")).not.toBeInTheDocument();
    expect(screen.queryByText("Complete Groups")).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Show Premium" }))
      .toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Show Out of Rotation" }))
      .not.toBeChecked();
    await user.click(
      screen.getByRole("button", { name: "Previous collection group" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );
    await user.click(screen.getByRole("checkbox", { name: "Show Premium" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Show Out of Rotation" }),
    );

    expect(onSelectPreviousScope).toHaveBeenCalledTimes(1);
    expect(onSelectNextScope).toHaveBeenCalledTimes(1);
    expect(onShowPremiumChange).toHaveBeenCalledWith(false);
    expect(onShowOutOfRotationChange).toHaveBeenCalledWith(true);
  });
});
