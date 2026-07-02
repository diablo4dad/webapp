import { render, screen } from "@testing-library/react";
import { Layout } from "./layout";

describe("shell slots", () => {
  test("renders header, main, and footer content", () => {
    render(
      <Layout
        footer={<div>footer slot</div>}
        header={<div>header slot</div>}
        main={<div>main slot</div>}
      />,
    );

    expect(screen.getByText("header slot")).toBeInTheDocument();
    expect(screen.getByText("main slot")).toBeInTheDocument();
    expect(screen.getByText("footer slot")).toBeInTheDocument();
  });
});
