import {Item} from "./db";
import React from "react";
import styles from "./LedgerItem.module.css"

type Props = {
  data: Item,
  onClick: () => void,
  isCollected: boolean,
}

function LedgerItem({ data, isCollected, onClick }: Props) {
  const classNames = [
    styles.Artifact,
    isCollected ? styles.ArtifactCollected : null,
  ].filter(cn => cn !== null).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      <img className={styles.ArtifactImage} src={`icons/${data.icon}.webp`} alt={data.name}/>
      <div className={styles.ArtifactName}>{data.name}</div>
      <div className={styles.ArtifactTick} hidden={!isCollected}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="3 3 16 16">
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" y2="-2.623" x2="0" y1="986.67" id="0">
              <stop stop-color="#ffce3b"/>
              <stop offset="1" stop-color="#ffd762"/>
            </linearGradient>
            <linearGradient y2="-2.623" x2="0" y1="986.67" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ffce3b"/>
              <stop offset="1" stop-color="#fef4ab"/>
            </linearGradient>
          </defs>
          <g transform="matrix(1.99997 0 0 1.99997-10.994-2071.68)">
            <rect y="1037.36" x="7" height="8" width="8" rx="4"/>
            <path
              d="m123.86 12.966l-11.08-11.08c-1.52-1.521-3.368-2.281-5.54-2.281-2.173 0-4.02.76-5.541 2.281l-53.45 53.53-23.953-24.04c-1.521-1.521-3.368-2.281-5.54-2.281-2.173 0-4.02.76-5.541 2.281l-11.08 11.08c-1.521 1.521-2.281 3.368-2.281 5.541 0 2.172.76 4.02 2.281 5.54l29.493 29.493 11.08 11.08c1.52 1.521 3.367 2.281 5.54 2.281 2.172 0 4.02-.761 5.54-2.281l11.08-11.08 58.986-58.986c1.52-1.521 2.281-3.368 2.281-5.541.0001-2.172-.761-4.02-2.281-5.54"
              fill="#fff" transform="matrix(.0436 0 0 .0436 8.177 1039.72)" stroke="none" stroke-width="9.512"/>
          </g>
        </svg>
      </div>
      {/*<div>{data.description}</div>*/}
    </div>
  )
}

export default LedgerItem;
