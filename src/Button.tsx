import {HTMLProps, PropsWithChildren} from "react";



type Props = PropsWithChildren<HTMLProps<HTMLButtonElement>> & {

}

function Button({ children }: Props) {
    return (
        <button>{children}</button>
    );
}

export default Button;
