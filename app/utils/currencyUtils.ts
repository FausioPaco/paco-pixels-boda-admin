type CurrencyCode = 'MZN' | 'ZAR' | 'USD' | 'EUR' | string;

type FormatMoneyOptions = {
  locale?: string;
  showCurrency?: boolean; // default: true
  minimumFractionDigits?: number; // default: 2
  maximumFractionDigits?: number; // default: 2
};

/**
 * Converte inputs como:
 * - "4,915.06" -> 4915.06
 * - "1.470.682,80" -> 1470682.8
 * - "4915.06" -> 4915.06
 * - "4915,06" -> 4915.06
 */
export function parseDecimal(value: number | string): number {
  if (typeof value === 'number') return value;

  const trimmed = value.trim();
  if (!trimmed) return NaN;

  // remove espaços e símbolos estranhos
  const normalized = trimmed.replace(/\s/g, '').replace(/[^0-9.,-]/g, '');

  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  // só vírgula -> vírgula decimal
  if (hasComma && !hasDot) {
    return Number.parseFloat(normalized.replace(',', '.'));
  }

  // vírgula e ponto -> decide pelo último separador (o último é decimal)
  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');

    if (lastComma > lastDot) {
      // decimal é vírgula, ponto é milhar: "1.470.682,80"
      const noDots = normalized.replace(/\./g, '');
      return Number.parseFloat(noDots.replace(',', '.'));
    } else {
      // decimal é ponto, vírgula é milhar: "4,915.06"
      const noCommas = normalized.replace(/,/g, '');
      return Number.parseFloat(noCommas);
    }
  }

  // só ponto ou nenhum separador -> parse normal
  return Number.parseFloat(normalized);
}

const currencyToLocale: Record<string, string> = {
  MZN: 'pt-PT', // podes trocar para 'pt-MZ' se preferires
  ZAR: 'en-ZA',
  USD: 'en-US',
  EUR: 'pt-PT',
};

export function formatMoney(
  amount: number | string,
  currency: CurrencyCode = 'MZN',
  opts: FormatMoneyOptions = {},
): string {
  const parsed = parseDecimal(amount);

  if (Number.isNaN(parsed)) {
    throw new Error('O valor fornecido não é um número válido.');
  }

  const locale = opts.locale ?? currencyToLocale[currency] ?? 'pt-PT';
  const showCurrency = opts.showCurrency ?? true;

  const minimumFractionDigits = opts.minimumFractionDigits ?? 2;
  const maximumFractionDigits = opts.maximumFractionDigits ?? 2;

  const formatted = new Intl.NumberFormat(locale, {
    useGrouping: true,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(parsed);

  return showCurrency ? `${formatted} ${currency}` : formatted;
}

/**
 * Mantém compatibilidade com código antigo.
 * Se quiseres, podes remover mais tarde quando fizeres refactor.
 */
export function formatToMZN(amount: number | string): string {
  return formatMoney(amount, 'MZN');
}
