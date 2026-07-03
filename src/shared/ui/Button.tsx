import {
  ButtonHTMLAttributes,
  forwardRef,
  PropsWithChildren,
} from "react";
import styles from "./Button.module.css";

enum BtnColours {
  Grey,
  Discord,
  BattleNet,
  Green,
  Red,
  Dark,
}

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  pressed?: boolean;
  colour?: BtnColours;
  showOnly?: "desktop" | "mobile";
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    pressed = false,
    colour = BtnColours.Grey,
    showOnly,
    className,
    children,
    ...props
  },
  ref,
) {
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
      case BtnColours.Dark:
        return styles.BtnDark;
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
      className ?? null,
    ]
      .filter((c) => c !== null)
      .join(" ");
  }

  return (
    <button {...props} ref={ref} className={getClasses()}>
      {children}
    </button>
  );
});

export { BtnColours };
export default Button;
