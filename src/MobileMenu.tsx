import AccountWidget from "./AccountWidget";
import styles from "./MobileMenu.module.css"
import {ContentType} from "./config";
import {Close} from "./Icons";

type Props = {
    onNavigate: (place: ContentType) => void,
}

function MobileMenu({ onNavigate }: Props) {
    return (
        <div className={styles.MobileMenu}>
            <button className={styles.MobileMenuLink} onClick={() => onNavigate(ContentType.LEDGER)}>Collection</button>
            <button className={styles.MobileMenuLink} onClick={() => onNavigate(ContentType.CONFIG)}>Settings</button>
            <div className={styles.MobileMenuAccount}>
                <AccountWidget></AccountWidget>
            </div>
        </div>
    );
}

export default MobileMenu;
