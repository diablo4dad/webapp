import { render, screen } from "@testing-library/react";
import { ProgressOverviewSkeleton } from "./skeleton";

describe("progress overview skeleton", () => {
  test("renders without hydrated overview text", () => {
    const { container } = render(<ProgressOverviewSkeleton />);

    expect(container.querySelector("header")).toBeInTheDocument();
    expect(screen.queryByText("Collection Progress")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
