import Button, { BtnColours } from "../../components/Button";
import { Close } from "../../components/Icons";
import { MobileSearchLayout } from "./mobile-search-layout";
import { SearchField } from "./search";
import styles from "./mobile-search.module.css";

type Props = {
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
};

function MobileSearch({
  onClearSearch,
  onClose,
  onSearchChange,
  searchTerm,
}: Props) {
  return (
    <MobileSearchLayout
      onClose={onClose}
      header={
        <>
          <div className={styles.MobileSearchTitle}>
            Transmog Search
          </div>
          <button
            className={styles.MobileSearchClose}
            onClick={onClose}
            aria-label="Close search"
          >
            <Close />
          </button>
        </>
      }
      body={
        <div className={styles.MobileSearchField}>
          <SearchField
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onClearSearch}
            autoFocus={true}
          />
        </div>
      }
      actions={
        <>
          <Button
            className={styles.MobileSearchActionPrimary}
            colour={BtnColours.Dark}
            onClick={onClose}
          >
            Search
          </Button>
          <Button
            className={styles.MobileSearchAction}
            colour={BtnColours.Dark}
            onClick={onClearSearch}
          >
            Clear
          </Button>
        </>
      }
    />
  );
}

export { MobileSearch };
