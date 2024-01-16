const fs = require('fs');
const path = require('path');

const IMG_SRC = 'C:\\Users\\Sam\\Documents\\d4-texture-extractor\\webp';
const IMG_DEST = 'C:\\Users\\Sam\\Documents\\d4log\\public\\icons';

fetch("http://localhost:1337/api/collections?populate[items][populate][0]=icon&sort[0]=order").then((resp) => {
    resp.json().then(json => {
        fs.writeFileSync('public/collection.json', JSON.stringify(json));

        console.log("Wrote collection.json");

        json.data.forEach(collection => {
            collection.attributes.items.data.forEach((item) => {
                const fn = item.attributes.iconId + '.webp';
                const src = path.join(IMG_SRC, fn);
                const dest = path.join(IMG_DEST, fn)

                try {
                    fs.copyFileSync(src, dest);
                } catch (e) {
                    console.warn("Error copying file: " + e);
                    console.warn("Item Name: "+ item.attributes.name);
                    console.warn("Item ID: "+ item.attributes.itemId);
                }
            });
        });
    });
});

