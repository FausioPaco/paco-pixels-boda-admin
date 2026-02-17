export interface SelectOption {
  id: string | number;
  name: string;
  value?: string | number | boolean | null;
}

export interface ISelectProps {
  id: string;
  options: SelectOption[];
  label?: string;
  modelValue: string | number | boolean | undefined | null;
  helperText?: string;
  errorMessage?: string;
  success?: boolean;
  info?: boolean;
  warning?: boolean;
  disableEmpty?: boolean;
  emptyMessage?: string;
  background?: 'white' | 'dark';
  disableMargins?: boolean;
  asNumber?: boolean;
}
