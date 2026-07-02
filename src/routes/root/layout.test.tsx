import { render, screen } from "@testing-library/react";
import { RootLayout } from "./layout";

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
