export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function formatPercentage(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (!isNaN(num)) return `${num.toFixed(2)}%`;

  return '';
}

export function plurarize(count: number, str: string): string {
  return count === 1 ? str : `${str}s`;
}

export function formatToMZN(amount: number | string): string {
  const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(parsed)) {
    throw new Error('O valor fornecido não é um número válido.');
  }

  const formatted = new Intl.NumberFormat('pt-PT', {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);

  return `${formatted} MZN`;
}

export function transformToDecimal(
  value: string,
  originalValue: string,
): number | null {
  if (typeof originalValue === 'string') {
    const trimmed = originalValue.trim();

    if (!trimmed) return null;
    // Se contiver apenas vírgula (ex.: "80,50") e não ponto, substitui por ponto.
    if (trimmed.includes(',') && !trimmed.includes('.')) {
      return parseFloat(trimmed.replace(',', '.'));
    }
    // Se contiver tanto vírgula quanto ponto, decide com base na última ocorrência:
    if (trimmed.includes(',') && trimmed.includes('.')) {
      // Remove caracteres indesejados (se houver)
      const normalized = trimmed.replace(/[^0-9.,]/g, '');
      const lastComma = normalized.lastIndexOf(',');
      const lastDot = normalized.lastIndexOf('.');
      if (lastComma > lastDot) {
        // Supomos que a vírgula é o separador decimal (ex.: "80.000,50" → 80000.50)
        const noDots = normalized.replace(/\./g, '');
        return parseFloat(noDots.replace(',', '.'));
      } else {
        // Se o ponto for o separador decimal (ex.: "80,000.50" → 80000.50)
        const noCommas = normalized.replace(/,/g, '');
        return parseFloat(noCommas);
      }
    }
    // Caso contrário, tenta converter normalmente
    return parseFloat(trimmed);
  }

  return null;
}

export function formatDecimal(originalValue: string): number {
  const trimmed = originalValue.trim();

  // Se contiver apenas vírgula (ex.: "80,50") e não ponto, substitui por ponto.
  if (trimmed.includes(',') && !trimmed.includes('.')) {
    return parseFloat(trimmed.replace(',', '.'));
  }
  // Se contiver tanto vírgula quanto ponto, decide com base na última ocorrência:
  if (trimmed.includes(',') && trimmed.includes('.')) {
    // Remove caracteres indesejados (se houver)
    const normalized = trimmed.replace(/[^0-9.,]/g, '');
    const lastComma = normalized.lastIndexOf(',');
    const lastDot = normalized.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Supomos que a vírgula é o separador decimal (ex.: "80.000,50" → 80000.50)
      const noDots = normalized.replace(/\./g, '');
      return parseFloat(noDots.replace(',', '.'));
    } else {
      // Se o ponto for o separador decimal (ex.: "80,000.50" → 80000.50)
      const noCommas = normalized.replace(/,/g, '');
      return parseFloat(noCommas);
    }
  }
  // Caso contrário, tenta converter normalmente
  return parseFloat(trimmed);
}
