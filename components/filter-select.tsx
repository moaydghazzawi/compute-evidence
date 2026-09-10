import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
  name,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  allLabel?: string;
  name?: string;
}) {
  const id = name ?? 'filter-' + label.toLowerCase().replaceAll(' ', '-');
  return (
    <label className="filter-field" htmlFor={id}>
      <span>{label}</span>
      <NativeSelect
        className="w-full"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <NativeSelectOption value="all">{allLabel}</NativeSelectOption>
        {options.map(([value, text]) => (
          <NativeSelectOption key={value} value={value}>
            {text}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}
