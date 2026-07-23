import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ProgressOverview } from "./view";

const selectedScope = {
  collected: 12,
  iconSrc: "/collection-icon.webp",
  id: "season",
  isComplete: false,
  percent: 50,
  positionLabel: "2 of 6",
  remaining: 12,
  title: "Season",
  total: 24,
};

describe("progress overview", () => {
  test("renders selected scope progress", () => {
    render(<ProgressOverview selectedScope={selectedScope} />);

    expect(screen.getByRole("heading", { name: "Season" }))
      .toBeInTheDocument();
    expect(screen.getByText("Collection Progress")).toBeInTheDocument();
    expect(screen.getByText("2 of 6")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getAllByText("12")).toHaveLength(2);
    expect(screen.getByText("24")).toBeInTheDocument();
  });

  test("wires navigation and filters", async () => {
    const user = userEvent.setup();
    const onSelectNextScope = vi.fn();
    const onSelectPreviousScope = vi.fn();
    const onShowPremiumChange = vi.fn();

    render(
      <ProgressOverview
        filterControls={[
          {
            checked: false,
            label: "Show Premium",
            name: "showPremium",
            onChange: onShowPremiumChange,
          },
        ]}
        onSelectNextScope={onSelectNextScope}
        onSelectPreviousScope={onSelectPreviousScope}
        selectedScope={selectedScope}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Previous collection group" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );
    await user.click(screen.getByRole("checkbox", { name: "Show Premium" }));

    expect(onSelectPreviousScope).toHaveBeenCalledTimes(1);
    expect(onSelectNextScope).toHaveBeenCalledTimes(1);
    expect(onShowPremiumChange).toHaveBeenCalledWith(true);
  });
});
