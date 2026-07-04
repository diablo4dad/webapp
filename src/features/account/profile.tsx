import classNames from "classnames";
import type { DadUser } from "../../services/auth";
import { Google } from "../../shared/ui/Icons";
import styles from "./profile.module.css";

enum Direction {
  COLUMN,
  ROW,
}

type Props = {
  currentUser: DadUser;
  onLogout: () => void;
  direction?: Direction;
};

function getActiveFromDate(currentUser: DadUser): string {
  return new Date(currentUser.registered ?? "").toLocaleDateString();
}

function Account({
  currentUser,
  onLogout,
  direction = Direction.COLUMN,
}: Props) {
  const blockCssClass = classNames({
    [styles.Block]: true,
    [styles.Row]: direction === Direction.ROW,
  });

  return (
    <div className={blockCssClass}>
      <div className={styles.Meta}>
        <div className={styles.TextLine1}>{currentUser.email}</div>
        <div className={styles.TextLine2}>
          <span className={styles.TextActive}>
            Active {getActiveFromDate(currentUser)}
          </span>
          <span> </span>
          <button className={styles.TextLogout} onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
      <div className={styles.Badge}>
        {["firebase", "google"].includes(currentUser.providerId) && (
          <span className={styles.Icon} aria-hidden="true">
            <Google />
          </span>
        )}
      </div>
    </div>
  );
}

export { Account, Direction };
