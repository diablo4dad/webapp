import { render, screen } from "@testing-library/react";
import { Layout } from "./layout";
import styles from "./layout.module.css";

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

  test("can constrain the main content slot", () => {
    render(
      <Layout
        footer={<div>footer slot</div>}
        header={<div>header slot</div>}
        isContentConstrained={true}
        main={<div>main slot</div>}
      />,
    );

    expect(screen.getByText("main slot").parentElement)
      .toHaveClass(styles.LayoutContentConstrained);
  });

  test("can hide the footer", () => {
    render(
      <Layout
        footer={<div>footer slot</div>}
        header={<div>header slot</div>}
        isFooterVisible={false}
        main={<div>main slot</div>}
      />,
    );

    expect(screen.queryByText("footer slot")).not.toBeInTheDocument();
  });
});
