import AccountWidget from "./AccountWidget";
import styles from "./MobileMenu.module.css"
import {ContentType} from "./config";

type Props = {
    onNavigate: (place: ContentType) => void,
    onClose: () => void,
}

function MobileMenu({ onNavigate, onClose }: Props) {
    return (
        <div className={styles.MobileMenu}>
            <button className={styles.MobileMenuLink} onClick={() => onNavigate(ContentType.CONFIG)}>Settings</button>
            <button className={styles.MobileMenuLink} onClick={() => onNavigate(ContentType.LEDGER)}>Collection Log</button>
            <div className={styles.MobileMenuAccount}>
                <AccountWidget></AccountWidget>
            </div>
            <button className={styles.MobileMenuClose} onClick={onClose}>Close</button>
        </div>
    );
}

export default MobileMenu;
