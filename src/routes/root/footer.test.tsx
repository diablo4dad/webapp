import { render, screen } from "@testing-library/react";
import { RootFooter } from "./footer";

describe("footer content", () => {
  test("renders community and version links", () => {
    render(<RootFooter />);

    expect(screen.getByText("Join the Discord Server")).toBeInTheDocument();
    expect(screen.getByText(/Site Version/)).toBeInTheDocument();
  });
});
