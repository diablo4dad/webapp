import {ButtonHTMLAttributes, PropsWithChildren} from "react";
import styles from './Button.module.css'


enum BtnColours {
    Grey,
    Discord,
    BattleNet,
}


type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
    pressed?: boolean,
    colour?: BtnColours,
}


function Button({ pressed = false, colour = BtnColours.Grey, children, ...props }: Props) {
    function getColour() {
        switch (colour) {
            case BtnColours.Discord:
                return styles.BtnDiscord;
            case BtnColours.BattleNet:
                return styles.BtnBattleNet;
            default:
                return styles.BtnGrey;
        }
    }

    function getClasses() {
        return [
            styles.Btn,
            pressed ? styles.BtnPressed : null,
            getColour()
        ].filter(c => c !== null).join(' ');
    }

    return (
        <button {...props} className={getClasses()}>{children}</button>
    );
}

export { BtnColours }
export default Button;
