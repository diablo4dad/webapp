import Search from "../../components/Search";

type Props = {
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  value: string;
};

const ROOT_SEARCH_PLACEHOLDER = "Search transmogs";

function RootSearchField({
  autoFocus = false,
  onChange,
  onClear,
  value,
}: Props) {
  return (
    <Search
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      onClear={onClear}
      placeholder={ROOT_SEARCH_PLACEHOLDER}
    />
  );
}

export { ROOT_SEARCH_PLACEHOLDER, RootSearchField };
