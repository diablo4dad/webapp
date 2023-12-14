import React, {useEffect, useState} from 'react';
import fetchDb, {Item} from "./db"
import logo from "./d4ico.png"

import styles from './App.module.css';
import Ledger from "./Ledger";
import useStore from "./Store";

function App() {
  const [db, setDb] = useState<Item[]>([]);
  const store = useStore();

  useEffect(() => {
    fetchDb()
      .then(data => {
        console.log("DB Initialised...", data);
        setDb(data)
      });
  }, [setDb]);

  return (
    <div className={styles.App}>
      <header className={styles.AppHeader}>
        <div className={styles.AppIconHolder}>
          <img className={styles.AppIcon} src={logo} alt="Diablo 4" />
        </div>
        <div className={styles.AppNameHolder}>
          <div className={styles.AppName}>Diablo IV Collection Log</div>
          <div className={styles.AppTagLine}>Bringing closure to the completionist in you</div>
        </div>
      </header>
      <section className={styles.AppContent}>
        <Ledger db={db} store={store}></Ledger>
      </section>
      <footer className={styles.AppFooter}>
        Not Affiliated with Blizzard.
      </footer>
    </div>
  );
}

export default App;
