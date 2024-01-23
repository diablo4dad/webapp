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
    showHidden: boolean,
    showCollected: boolean,
    view: 'card' | 'list',
    inverseCards: boolean,
    showProgress: boolean,
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
    showHidden: false,
    showCollected: true,
    view: 'card',
    showProgress: true,
    inverseCards: false,
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
                <Toggle name="premium" checked={config.showPremium} flip={true} onChange={e => onChange({ ...config, showPremium: e.target.checked })}>Show Premium</Toggle>
                <Toggle name="promotional" checked={config.showPromotional} flip={true} onChange={e => onChange({ ...config, showPromotional: e.target.checked })}>Show Promotional</Toggle>
                <Toggle name="outOfRotation" checked={config.showOutOfRotation} flip={true} onChange={e => onChange({ ...config, showOutOfRotation: e.target.checked })}>Show Out of Rotation</Toggle>
                <Toggle name="hidden" checked={config.showHidden} flip={true} onChange={e => onChange({ ...config, showHidden: e.target.checked })}>Show Hidden</Toggle>
                <Toggle name="collected" checked={config.showCollected} flip={true} onChange={e => onChange({ ...config, showCollected: e.target.checked })}>Show Collected</Toggle>
            </fieldset>
            <fieldset>
                <legend>Display Options</legend>
                <Toggle name="card" checked={config.view === 'card'} flip={true} onChange={e => onChange({ ...config, view: e.target.checked ? 'card' : 'list'})}>Card Layout</Toggle>
                <Toggle name="inverse" checked={config.inverseCards} flip={true} onChange={e => onChange({ ...config, inverseCards: e.target.checked })}>Inverse Cards</Toggle>
                <Toggle name="progress" checked={config.showProgress} flip={true} onChange={e => onChange({ ...config, showProgress: e.target.checked })}>Progress Bar</Toggle>
            </fieldset>
        </div>
    );
}

export default ConfigSidebar;
export { DEFAULT_CONFIG };
export type { Configuration };
