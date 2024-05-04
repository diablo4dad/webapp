import styles from "./ConfigSidebar.module.css"
import Toggle from "./Toggle";
import {Configuration, DEFAULT_CONFIG} from "./common";

type ConfigSidebarProps = {
    config: Configuration,
    onChange: (newConfig: Configuration) => void,
}

function ConfigSidebar({ config = DEFAULT_CONFIG, onChange }: ConfigSidebarProps) {
    return (
        <div className={styles.Panel}>
            <fieldset className={styles.Fieldset}>
                <legend>Items</legend>
                <Toggle name="mounts" checked={config.showMounts} flip={true} onChange={e => onChange({ ...config, showMounts: e.target.checked })}>Mounts</Toggle>
                <Toggle name="horseArmor" checked={config.showHorseArmor} flip={true} onChange={e => onChange({ ...config, showHorseArmor: e.target.checked })}>Horse Armor</Toggle>
                <Toggle name="trophies" checked={config.showTrophies} flip={true} onChange={e => onChange({ ...config, showTrophies: e.target.checked })}>Trophies</Toggle>
                <Toggle name="armor" checked={config.showArmor} flip={true} onChange={e => onChange({ ...config, showArmor: e.target.checked })}>Armor</Toggle>
                <Toggle name="weapons" checked={config.showWeapons} flip={true} onChange={e => onChange({ ...config, showWeapons: e.target.checked })}>Weapons</Toggle>
                <Toggle name="body" checked={config.showBody} flip={true} onChange={e => onChange({ ...config, showBody: e.target.checked })}>Body Markings</Toggle>
                <Toggle name="emotes" checked={config.showEmotes} flip={true} onChange={e => onChange({ ...config, showEmotes: e.target.checked })}>Emotes</Toggle>
                <Toggle name="townPortals" checked={config.showTownPortals} flip={true} onChange={e => onChange({ ...config, showTownPortals: e.target.checked })}>Town Portals</Toggle>
                <Toggle name="headstones" checked={config.showHeadstones} flip={true} onChange={e => onChange({ ...config, showHeadstones: e.target.checked })}>Headstones</Toggle>
                <Toggle name="emblem" checked={config.showEmblems} flip={true} onChange={e => onChange({ ...config, showEmblems: e.target.checked })}>Emblems</Toggle>
                <Toggle name="playerTitles" checked={config.showPlayerTitles} flip={true} onChange={e => onChange({ ...config, showPlayerTitles: e.target.checked })}>Player Titles</Toggle>
            </fieldset>
            <fieldset className={styles.Fieldset}>
                <legend>Filters</legend>
                <Toggle name="showPremium" checked={config.showPremium} flip={true} onChange={e => onChange({ ...config, showPremium: e.target.checked })}>Show Premium</Toggle>
                <Toggle name="showPromotional" checked={config.showPromotional} flip={true} onChange={e => onChange({ ...config, showPromotional: e.target.checked })}>Show Promotional</Toggle>
                <Toggle name="showOutOfRotation" checked={config.showOutOfRotation} flip={true} onChange={e => onChange({ ...config, showOutOfRotation: e.target.checked })}>Show Out of Rotation</Toggle>
                <Toggle name="showUnobtainable" checked={config.showUnobtainable} flip={true} onChange={e => onChange({ ...config, showUnobtainable: e.target.checked })}>Show Unobtainable</Toggle>
                <Toggle name="showExcludedItems" checked={config.showHiddenItems} flip={true} onChange={e => onChange({ ...config, showHiddenItems: e.target.checked })}>Show Hidden Items</Toggle>
                <Toggle name="hideCollectedItems" checked={config.hideCollectedItems} flip={true} onChange={e => onChange({ ...config, hideCollectedItems: e.target.checked })}>Hide Collected Items</Toggle>
                <Toggle name="hideCompleteCollections" checked={config.hideCompleteCollections} flip={true} onChange={e => onChange({ ...config, hideCompleteCollections: e.target.checked })}>Hide Complete Collections</Toggle>
            </fieldset>
            <fieldset className={styles.Fieldset}>
                <legend>Display Options</legend>
                <Toggle name="card" checked={config.view === 'card'} flip={true} onChange={e => onChange({ ...config, view: e.target.checked ? 'card' : 'list'})}>Use Card Layout</Toggle>
                <Toggle name="inverse" checked={config.inverseCardLayout} flip={true} onChange={e => onChange({ ...config, inverseCardLayout: e.target.checked })}>Inverse Card Layout</Toggle>
                <Toggle name="progress" checked={config.enableProgressBar} flip={true} onChange={e => onChange({ ...config, enableProgressBar: e.target.checked })}>Enable Progress Bar</Toggle>
            </fieldset>
        </div>
    );
}

export default ConfigSidebar;
