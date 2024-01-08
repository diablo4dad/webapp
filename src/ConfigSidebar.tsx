import Select from "react-select";
import styles from "./ConfigSidebar.module.css"

type ConfigSidebarProps = {
    options: string[],
    value: string[],
    onChange: (value: string[]) => void,
}

type OptionType = {
    value: string,
    label: string,
}

function ConfigSidebar({ options, value, onChange }: ConfigSidebarProps) {
    const labeledOptions = options.map<OptionType>(i => ({ value: i, label: i }));
    const values = labeledOptions.filter(o => value.includes(o.value));

    return (
        <div className={styles.Panel}>
            <Select
                isMulti={true}
                value={values}
                options={labeledOptions}
                onChange={newValue => onChange(newValue.map(v => v.value))}
            ></Select>
        </div>
    );
}

export default ConfigSidebar;
