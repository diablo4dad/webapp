import { render, screen } from "@testing-library/react";
import { ProgressView } from "./view";
import type { ProgressCardViewModel } from "./view-model";

function card(): ProgressCardViewModel {
  return {
    collected: 1,
    iconSrc: "/card-icon.webp",
    isComplete: false,
    percent: 50,
    remaining: 1,
    title: "Armor & Weapons",
    total: 2,
  };
}

describe("progress view", () => {
  test("renders a progress card", () => {
    render(<ProgressView {...card()} layout="expanded" />);

    expect(screen.getByText("Armor & Weapons")).toBeInTheDocument();
    expect(screen.getByText("1 collected from 2 total"))
      .toBeInTheDocument();
    expect(screen.queryByText("Collection Progress")).not.toBeInTheDocument();
  });
});
