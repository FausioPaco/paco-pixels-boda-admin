export type ButtonType = 'primary' | 'outline-primary' | 'white';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IButtonProps {
  btnSize?: ButtonSize;
  btnType?: ButtonType;
  icon?: string;
  iconSize?: number;
  loading?: boolean;
  onlyIcon?: boolean; 
}

export interface IButtonExternalLinkProps {
  to?: string;
  href?: string;
  btnSize?: ButtonSize;
  btnType?: 'whatsapp' | 'instagram' | 'youtube';
  icon?: string;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
    onlyIcon?: boolean; 
}
