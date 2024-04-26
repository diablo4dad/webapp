import {MasterGroup} from "./src/common";
import {StrapiCollection, StrapiResp, StrapiResultSet} from "./src/data";

import {getCollectionUri} from "./src/server";

const fs = require('fs');
const path = require('path');

const IMG_SRC_MISSING = 'C:\\Users\\Sam\\Documents\\d4log\\missing_icons';
const IMG_SRC = 'C:\\Users\\Sam\\Documents\\d4-texture-extractor\\webp';
const IMG_DEST = 'C:\\Users\\Sam\\Documents\\d4log\\public\\icons';

const CATEGORIES = ["General", "Cash Shop", "Promotional"];

const PAGE_SIZE = 15;
const FETCH_MODE = 'live';

function removeMetaFields<T extends StrapiResp>(entity: T): T {
    const updatedEntity = { ...entity };

    delete updatedEntity.updatedAt;
    delete updatedEntity.createdAt;
    delete updatedEntity.publishedAt;

    return updatedEntity;
}

async function downloadJson(category: MasterGroup) {
    const url = getCollectionUri(category, 0, PAGE_SIZE, FETCH_MODE);
    const resp = await fetch(url);
    const json = await resp.json() as StrapiResultSet<StrapiCollection>;

    const db = {
        data: [],
        meta: {
            pagination: {
                page: 1,
                pageSize: json.meta.pagination.total,
                pageCount: 1,
                total: 0, // replace this with total collection item count
            }
        },
    };

    for (let i = 1; i <= json.meta.pagination.pageCount; i++) {
        console.log("Fetching " + category + " page " + i);

        const url = getCollectionUri(category, i, PAGE_SIZE, FETCH_MODE);
        const resp = await fetch(url);
        const json = await resp.json() as StrapiResultSet<StrapiCollection>;
        // db.meta.pagination.page = 1;
        // db.meta.pagination.pageCount = 1;
        // db.meta.pagination.pageSize += json.meta.pagination.pageSize;
        db.meta.pagination.total += json.data.reduce((a, c) => c.attributes.collectionItems.data.length + a, 0);
        db.meta.pagination.pageSize = db.meta.pagination.total;
        db.data.push(...json.data.map(d => {
            if (!d.attributes.collectionItems?.data) {
                return d;
            }

            return {
                ...d,
                attributes: removeMetaFields({
                    ...d.attributes,
                    collectionItems: {
                        ...d.attributes.collectionItems,
                        data: d.attributes.collectionItems.data.map(ci => ({
                            ...ci,
                            attributes: removeMetaFields({
                                ...ci.attributes,
                                items: {
                                    ...ci.attributes.items,
                                    data: ci.attributes.items.data.map(i => ({
                                        ...i,
                                        attributes: removeMetaFields({
                                            ...i.attributes,
                                            icon: {
                                                data: {
                                                    attributes: {
                                                        url: i.attributes.icon.data?.attributes.url,
                                                    }
                                                }
                                            }
                                        }),
                                    }))
                                }
                            })
                        }))
                    }
                })
            }
        }));
    }

    fs.writeFileSync(path.join("public", category.toLowerCase() + '.json'), JSON.stringify(db));
}

Object.values(MasterGroup).forEach(mg => {
    downloadJson(mg).then(() => console.log("Done " + mg));
})

//
// fetch("http://localhost:1337/api/collections?populate[collectionItems][populate][items][populate][0]=icon&sort[0]=order&pagination[pageSize]=50").then((resp) => {
//     resp.json().then(json => {
//         fs.writeFileSync('public/collection.json', JSON.stringify(json));
//
//         console.log("Wrote collection.json");
//
//         json.data.forEach(collection => {
//             collection.attributes.collectionItems.data.forEach((collectionItem) => {
//                 collectionItem.attributes.items.data.forEach((item) => {
//                     const fn = item.attributes.iconId + '.webp';
//                     const src = path.join(IMG_SRC, fn);
//                     const dest = path.join(IMG_DEST, fn)
//
//                     try {
//                         fs.copyFileSync(src, dest);
//                     } catch (e) {
//                         console.warn("Error copying file: " + e);
//                         console.warn("Item Name: "+ item.attributes.name);
//                         console.warn("Item ID: "+ item.attributes.itemId);
//                     }
//                 });
//             });
//         });
//
//         fs.cpSync(IMG_SRC_MISSING, IMG_DEST, {recursive: true});
//     });
// });
