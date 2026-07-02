import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  ROOT_SEARCH_PLACEHOLDER,
  RootSearchField,
} from "./search";

type SearchProps = Parameters<typeof RootSearchField>[0];

type SearchOptions = Partial<SearchProps>;

vi.mock("../../components/Search", () => ({
  default: ({
    autoFocus,
    onChange,
    onClear,
    placeholder = "search",
    value,
  }: {
    autoFocus?: boolean;
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    value: string;
  }) => (
    <div>
      <input
        aria-label={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <button onClick={onClear}>clear {placeholder}</button>
    </div>
  ),
}));

function renderSearch(options: SearchOptions = {}) {
  const props: SearchProps = {
    onChange: vi.fn(),
    onClear: vi.fn(),
    value: "helm",
    ...options,
  };
  const renderResult = render(<RootSearchField {...props} />);

  return {
    ...renderResult,
    props,
  };
}

describe("field", () => {
  test("renders the shared placeholder and current value", () => {
    renderSearch();

    expect(
      screen.getByRole("textbox", { name: ROOT_SEARCH_PLACEHOLDER }),
    ).toHaveValue("helm");
  });

  test("passes changes and clear actions through", async () => {
    const user = userEvent.setup();
    const { props } = renderSearch();

    fireEvent.change(
      screen.getByRole("textbox", { name: ROOT_SEARCH_PLACEHOLDER }),
      {
        target: {
          value: "sword",
        },
      },
    );
    await user.click(
      screen.getByRole("button", {
        name: `clear ${ROOT_SEARCH_PLACEHOLDER}`,
      }),
    );

    expect(props.onChange).toHaveBeenCalledWith("sword");
    expect(props.onClear).toHaveBeenCalledTimes(1);
  });
});
