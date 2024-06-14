import styles from "./Account.module.css";
import { User } from "firebase/auth";
import { Google } from "../Icons";
import classNames from "classnames";

enum Direction {
  COLUMN,
  ROW,
}

type Props = {
  currentUser: User;
  onLogout: () => void;
  direction?: Direction;
};

function getActiveFromDate(currentUser: User): string {
  return new Date(currentUser.metadata.creationTime ?? "").toLocaleDateString();
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
          <button className={styles.Icon}>
            <Google />
          </button>
        )}
      </div>
    </div>
  );
}

export { Direction };
export default Account;
