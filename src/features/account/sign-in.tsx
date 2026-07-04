import classNames from "classnames";
import Button from "../../shared/ui/Button";
import { Google } from "../../shared/ui/Icons";
import styles from "./sign-in.module.css";

enum Orientation {
  COLUMN,
  ROW,
}

type Props = {
  orientation?: Orientation;
  onAuth: () => void;
};

function Authenticate({ orientation = Orientation.COLUMN, onAuth }: Props) {
  return (
    <div
      className={classNames(styles.Account, {
        [styles.AccountRow]: orientation === Orientation.ROW,
      })}
    >
      <div className={styles.AccountText}>
        <div>You are not authenticated</div>
        <button
          type="button"
          className={styles.AccountLoginText}
          onClick={onAuth}
        >
          Login to save your progress
        </button>
      </div>
      <div className={styles.AccountIcons}>
        <Button onClick={onAuth}>
          <Google />
        </Button>
      </div>
    </div>
  );
}

export { Authenticate, Orientation };
