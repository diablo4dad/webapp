import styles from "./Account.module.css"
import {User} from "firebase/auth";
import {Google} from "./Icons";

enum Direction {
    COLUMN,
    ROW
}
type Props = {
    currentUser: User,
    onLogout: () => void,
    direction?: Direction,
}

function Account({ currentUser, onLogout, direction = Direction.COLUMN }: Props) {
    const activeDate = new Date(currentUser.metadata.creationTime ?? '').toLocaleDateString();

    function getClasses() {
        return [
            styles.Block,
            direction === Direction.ROW ? styles.Row : null,
        ].filter(c => c !== null).join(' ');
    }

    return (
        <div className={getClasses()}>
            <div className={styles.Text}>
                <div className={styles.TextLine1}>{currentUser.email}</div>
                <div className={styles.TextLine2}>
                    <span className={styles.TextActive}>Active {activeDate}</span>
                    <span> </span>
                    <button className={styles.TextLogout} onClick={onLogout}>Logout</button>
                </div>
            </div>
            <div className={styles.Badge}>
                {['firebase', 'google'].includes(currentUser.providerId) &&
                    <button className={styles.Icon}>
                        <Google/>
                    </button>
                }
            </div>
        </div>
    )
}

export { Direction };
export default Account;
