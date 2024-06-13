import { ButtonHTMLAttributes, PropsWithChildren } from "react";
import styles from "./Button.module.css";

enum BtnColours {
  Grey,
  Discord,
  BattleNet,
  Green,
  Red,
}

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  pressed?: boolean;
  colour?: BtnColours;
  showOnly?: "desktop" | "mobile";
};

function Button({
  pressed = false,
  colour = BtnColours.Grey,
  showOnly,
  children,
  ...props
}: Props) {
  function getColour() {
    switch (colour) {
      case BtnColours.Discord:
        return styles.BtnDiscord;
      case BtnColours.BattleNet:
        return styles.BtnBattleNet;
      case BtnColours.Green:
        return styles.BtnGreen;
      case BtnColours.Red:
        return styles.BtnRed;
      default:
        return styles.BtnGrey;
    }
  }

  function getClasses() {
    return [
      styles.Btn,
      pressed ? styles.BtnPressed : null,
      getColour(),
      showOnly === "mobile" ? styles.BtnMobile : null,
      showOnly === "desktop" ? styles.BtnDesktop : null,
    ]
      .filter((c) => c !== null)
      .join(" ");
  }

  return (
    <button {...props} className={getClasses()}>
      {children}
    </button>
  );
}

export { BtnColours };
export default Button;
