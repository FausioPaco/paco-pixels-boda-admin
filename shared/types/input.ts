export interface IInputProps {
  id: string;
  label?: string;
  placeholder?: string;
  modelValue: string | number | undefined | null;
  helperText?: string;
  errorMessage?: string;
  success?: boolean;
  info?: boolean;
  warning?: boolean;
  disableEmpty?: boolean;
  disableMargins?: boolean;
}
