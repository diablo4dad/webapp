import { render, screen } from "@testing-library/react";
import { ProgressSkeleton } from "./skeleton";

describe("progress skeleton", () => {
  test("renders without hydrated card text", () => {
    const { container } = render(<ProgressSkeleton layout="expanded" />);

    expect(container.firstElementChild).toBeInTheDocument();
    expect(screen.queryByText("Collection")).not.toBeInTheDocument();
    expect(screen.queryByText(/collected from/i)).not.toBeInTheDocument();
  });
});
