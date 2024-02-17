import {ButtonHTMLAttributes, PropsWithChildren} from "react";
import styles from './Link.module.css'

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {

}

function Link({ children, ...props }: Props) {
    return (
        <button {...props} className={styles.Link}>{children}</button>
    );
}

export default Link;
