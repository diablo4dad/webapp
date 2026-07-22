import { render, screen } from "@testing-library/react";
import { DATABASE_VERSION, SITE_VERSION } from "../../config";
import { Footer } from "./footer";

describe("footer content", () => {
  test("renders community and version links", () => {
    render(<Footer />);

    expect(screen.getByText("Join the Discord Server")).toBeInTheDocument();
    const databaseVersion = screen
      .getByText(DATABASE_VERSION, { selector: "code" })
      .closest("div");
    const siteVersion = screen
      .getByText(SITE_VERSION, { selector: "code" })
      .closest("div");

    expect(databaseVersion).not.toBeNull();
    expect(siteVersion).not.toBeNull();
    expect(databaseVersion).toHaveTextContent("Database Version");
    expect(siteVersion).toHaveTextContent("Site Version");
    expect(
      (databaseVersion as HTMLElement).compareDocumentPosition(
        siteVersion as HTMLElement,
      ) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
