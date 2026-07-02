import Button, { BtnColours } from "../../components/Button";
import { Close } from "../../components/Icons";
import Search from "../../components/Search";
import { RootMobileSearchOverlayLayout } from "./mobile-layout";
import styles from "./mobile-search.module.css";

type Props = {
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
};

function MobileSearchOverlay({
  onClearSearch,
  onClose,
  onSearchChange,
  searchTerm,
}: Props) {
  return (
    <RootMobileSearchOverlayLayout
      onClose={onClose}
      header={
        <>
          <div className={styles.MobileSearchOverlayTitle}>
            Transmog Search
          </div>
          <button
            className={styles.MobileSearchOverlayClose}
            onClick={onClose}
            aria-label="Close search"
          >
            <Close />
          </button>
        </>
      }
      body={
        <div className={styles.MobileSearchOverlayField}>
          <Search
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onClearSearch}
            autoFocus={true}
            placeholder={"Search transmogs"}
          />
        </div>
      }
      actions={
        <>
          <Button
            className={styles.MobileSearchOverlayActionPrimary}
            colour={BtnColours.Dark}
            onClick={onClose}
          >
            Search
          </Button>
          <Button
            className={styles.MobileSearchOverlayAction}
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

export { MobileSearchOverlay };
