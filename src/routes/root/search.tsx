import Search from "../../components/Search";

type Props = {
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  value: string;
};

const SEARCH_PLACEHOLDER = "Search transmogs";

function SearchField({
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
      placeholder={SEARCH_PLACEHOLDER}
    />
  );
}

export { SEARCH_PLACEHOLDER, SearchField };
