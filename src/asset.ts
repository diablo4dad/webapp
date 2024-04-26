import {DadBase} from "./data";
import missing from "./image/imgfill.png";

function getImageUri(item: DadBase): string {
    return item.icon ?? missing;
}

export {getImageUri};