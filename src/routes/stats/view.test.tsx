import { render, screen } from "@testing-library/react";
import type { ProgressViewModel } from "../../features/progress";
import { View } from "./view";

function model(): ProgressViewModel {
  return {
    cards: [
      {
        collected: 1,
        iconSrc: "/card-icon.webp",
        isComplete: false,
        percent: 50,
        remaining: 1,
        title: "Armor & Weapons",
        total: 2,
      },
    ],
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

describe("stats view", () => {
  test("shows loading", () => {
    render(<View isLoading={true} model={model()} />);

    expect(screen.getByRole("status", { name: "Loading stats" }))
      .toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("stats-item-filter-skeleton"))
      .toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Seasons" }))
      .not.toBeInTheDocument();
  });

  test("shows errors before loading", () => {
    render(
      <View
        catalogError="catalog failed"
        isLoading={true}
        model={model()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("catalog failed");
    expect(screen.queryByRole("status", { name: "Loading stats" }))
      .not.toBeInTheDocument();
  });

  test("shows the progress overview", () => {
    render(<View isLoading={false} model={model()} />);

    expect(screen.getByRole("heading", { name: "Seasons" }))
      .toBeInTheDocument();
    expect(screen.getByText("Collection Progress")).toBeInTheDocument();
    expect(screen.getByText("Armor & Weapons")).toBeInTheDocument();
  });
});
