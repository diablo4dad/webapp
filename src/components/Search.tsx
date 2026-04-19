import styles from "./Search.module.css";
import { Close, SearchIcon } from "./Icons";
import classNames from "classnames";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  autoFocus?: boolean;
  placeholder?: string;
};

function Search({
  value,
  onChange,
  onClear,
  autoFocus = false,
  placeholder,
}: Props) {
  return (
    <div className={styles.Search}>
      <input
        className={styles.Input}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <span
        className={classNames({
          [styles.Icon]: true,
          [styles.IconClose]: value,
        })}
        onClick={onClear}
      >
        {!value && <SearchIcon />}
        {value && <Close />}
      </span>
    </div>
  );
}

export default Search;
