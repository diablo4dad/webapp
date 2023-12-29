import React, {useEffect, useState} from 'react';
import fetchDb, {Item, StrapiHit, StrapiResultSet} from "./db"
import logo from "./d4ico.png"

import styles from './App.module.css';
import Ledger from "./Ledger";
import useStore from "./Store";
import ItemView from './ItemView';

function App() {
  const [db, setDb] = useState<StrapiResultSet<Item>>({data: []});
  const store = useStore();
  const [selectedItemId, setSelectedItemId] = useState(db.data[0]?.id ?? 'none');
  const selectedItem = db.data.filter(item => item.id === selectedItemId).pop();

  function onDoubleClickItem(item: StrapiHit<Item>) {
    store.toggle(item.id);
  }

  function onClickItem(item: StrapiHit<Item>) {
      setSelectedItemId(item.id);
  }

  useEffect(() => {
    fetchDb()
      .then(data => {
        console.log("DB Initialised...", data);
        if (Array.isArray(data.data)) {
            setDb(data)
        }
      })
     .catch(e => {
        console.error('Read DB error', e);
      });
  }, [setDb]);

  return (
    <div className={styles.App}>
        <section className={styles.AppContent}>
            <div className={styles.AppSideBar}>
                <div>
                    <header className={styles.AppHeader}>
                        <div className={styles.AppIconHolder}>
                            <img className={styles.AppIcon} src={logo} alt="Diablo 4"/>
                        </div>
                        <div className={styles.AppNameHolder}>
                            <div className={styles.AppName}>Diablo IV Collection Log</div>
                            <div className={styles.AppTagLine}>Bringing closure to the completionist in you</div>
                        </div>
                        <div className={styles.AppSettings}>
                            <div className={styles.AppSettingsBtn}>
                                <svg
                                    viewBox="0 -256 1792 1792"
                                    id="svg3025"
                                    version="1.1"
                                    width="100%"
                                    height="100%">
                                    <g
                                        transform="matrix(1,0,0,-1,121.49153,1285.4237)"
                                        id="g3027">
                                        <path
                                            d="m 1024,640 q 0,106 -75,181 -75,75 -181,75 -106,0 -181,-75 -75,-75 -75,-181 0,-106 75,-181 75,-75 181,-75 106,0 181,75 75,75 75,181 z m 512,109 V 527 q 0,-12 -8,-23 -8,-11 -20,-13 l -185,-28 q -19,-54 -39,-91 35,-50 107,-138 10,-12 10,-25 0,-13 -9,-23 -27,-37 -99,-108 -72,-71 -94,-71 -12,0 -26,9 l -138,108 q -44,-23 -91,-38 -16,-136 -29,-186 -7,-28 -36,-28 H 657 q -14,0 -24.5,8.5 Q 622,-111 621,-98 L 593,86 q -49,16 -90,37 L 362,16 Q 352,7 337,7 323,7 312,18 186,132 147,186 q -7,10 -7,23 0,12 8,23 15,21 51,66.5 36,45.5 54,70.5 -27,50 -41,99 L 29,495 Q 16,497 8,507.5 0,518 0,531 v 222 q 0,12 8,23 8,11 19,13 l 186,28 q 14,46 39,92 -40,57 -107,138 -10,12 -10,24 0,10 9,23 26,36 98.5,107.5 72.5,71.5 94.5,71.5 13,0 26,-10 l 138,-107 q 44,23 91,38 16,136 29,186 7,28 36,28 h 222 q 14,0 24.5,-8.5 Q 914,1391 915,1378 l 28,-184 q 49,-16 90,-37 l 142,107 q 9,9 24,9 13,0 25,-10 129,-119 165,-170 7,-8 7,-22 0,-12 -8,-23 -15,-21 -51,-66.5 -36,-45.5 -54,-70.5 26,-50 41,-98 l 183,-28 q 13,-2 21,-12.5 8,-10.5 8,-23.5 z"
                                            id="path3029" />
                                    </g>
                                </svg>
                            </div>
                        </div>
                    </header>
                    {selectedItem &&
                        <ItemView item={selectedItem} collected={store.isCollected(selectedItemId)}></ItemView>}
                </div>
            </div>
            <div className={styles.AppContentMain}>
                <Ledger db={db} store={store} onClickItem={onClickItem} onDoubleClickItem={onDoubleClickItem}></Ledger>
            </div>
        </section>
        <footer className={styles.AppFooter}>
            Not Affiliated with Blizzard.
        </footer>
    </div>
  );
}

export default App;
