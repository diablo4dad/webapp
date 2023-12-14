import { Item } from "./db"

type ItemProps = {
    item: Item
}

function ItemView({item: Item}: ItemProps) {
    return (
        <div>
            <div>{item.name}</div>
            <div>{item.description}</div>
        </div>
    )
}

export default ItemView
