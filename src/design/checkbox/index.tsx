import './index.css';

type MDCheckboxProps = {
  checked: boolean;
  setChecked: (checked: boolean) => void;
};

export const MDCheckbox = (props: MDCheckboxProps) => {
  const { checked, setChecked } = props;

  return (
    <div>
      <input
        className={`md-switch ${checked ? 'md-switch-checked' : ''}`}
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
      ></input>
    </div>
  );
};
