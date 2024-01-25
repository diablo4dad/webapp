import styles from "./ConfigSidebar.module.css"
import Toggle from "./Toggle";

type Configuration = {
    showMounts: boolean,
    showHorseArmor: boolean,
    showTrophies: boolean,
    showArmor: boolean,
    showWeapons: boolean,
    showPremium: boolean,
    showPromotional: boolean,
    showOutOfRotation: boolean,
    showHiddenItems: boolean,
    hideCollectedItems: boolean,
    hideCompleteCollections: boolean,
    view: 'card' | 'list',
    inverseCardLayout: boolean,
    enableProgressBar: boolean,
}

const DEFAULT_CONFIG: Configuration = {
    showMounts: true,
    showHorseArmor: true,
    showTrophies: true,
    showArmor: true,
    showWeapons: true,
    showPremium: false,
    showPromotional: false,
    showOutOfRotation: false,
    showHiddenItems: false,
    hideCollectedItems: true,
    hideCompleteCollections: false,
    view: 'card',
    enableProgressBar: true,
    inverseCardLayout: false,
}

type ConfigSidebarProps = {
    config: Configuration,
    onChange: (newConfig: Configuration) => void,
}

function ConfigSidebar({ config = DEFAULT_CONFIG, onChange }: ConfigSidebarProps) {
    return (
        <div className={styles.Panel}>
            <fieldset>
                <legend>Items</legend>
                <Toggle name="mounts" checked={config.showMounts} flip={true} onChange={e => onChange({ ...config, showMounts: e.target.checked })}>Mounts</Toggle>
                <Toggle name="horseArmor" checked={config.showHorseArmor} flip={true} onChange={e => onChange({ ...config, showHorseArmor: e.target.checked })}>Horse Armor</Toggle>
                <Toggle name="trophies" checked={config.showTrophies} flip={true} onChange={e => onChange({ ...config, showTrophies: e.target.checked })}>Trophies</Toggle>
                <Toggle name="armor" checked={config.showArmor} flip={true} onChange={e => onChange({ ...config, showArmor: e.target.checked })}>Armor</Toggle>
                <Toggle name="weapons" checked={config.showWeapons} flip={true} onChange={e => onChange({ ...config, showWeapons: e.target.checked })}>Weapons</Toggle>
            </fieldset>
            <fieldset>
                <legend>Filters</legend>
                <Toggle name="showPremium" checked={config.showPremium} flip={true} onChange={e => onChange({ ...config, showPremium: e.target.checked })}>Show Premium</Toggle>
                <Toggle name="showPromotional" checked={config.showPromotional} flip={true} onChange={e => onChange({ ...config, showPromotional: e.target.checked })}>Show Promotional</Toggle>
                <Toggle name="showOutOfRotation" checked={config.showOutOfRotation} flip={true} onChange={e => onChange({ ...config, showOutOfRotation: e.target.checked })}>Show Out of Rotation</Toggle>
                <Toggle name="showExcludedItems" checked={config.showHiddenItems} flip={true} onChange={e => onChange({ ...config, showHiddenItems: e.target.checked })}>Show Hidden Items</Toggle>
                <Toggle name="hideCollectedItems" checked={config.hideCollectedItems} flip={true} onChange={e => onChange({ ...config, hideCollectedItems: e.target.checked })}>Hide Collected Items</Toggle>
                <Toggle name="hideCompleteCollections" checked={config.hideCompleteCollections} flip={true} onChange={e => onChange({ ...config, hideCompleteCollections: e.target.checked })}>Hide Complete Collections</Toggle>
            </fieldset>
            <fieldset className={styles.ViewOptions}>
                <legend>Display Options</legend>
                <Toggle name="card" checked={config.view === 'card'} flip={true} onChange={e => onChange({ ...config, view: e.target.checked ? 'card' : 'list'})}>Use Card Layout</Toggle>
                <Toggle name="inverse" checked={config.inverseCardLayout} flip={true} onChange={e => onChange({ ...config, inverseCardLayout: e.target.checked })}>Inverse Card Layout</Toggle>
                <Toggle name="progress" checked={config.enableProgressBar} flip={true} onChange={e => onChange({ ...config, enableProgressBar: e.target.checked })}>Enable Progress Bar</Toggle>
            </fieldset>
        </div>
    );
}

export default ConfigSidebar;
export { DEFAULT_CONFIG };
export type { Configuration };
