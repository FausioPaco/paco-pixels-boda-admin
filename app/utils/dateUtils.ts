export function formatDate(
  input: string | Date | undefined,
  delimiter: '/' | '.' = '/',
): string {
  if (!input) return '';

  const date = typeof input === 'string' ? new Date(input) : input;

  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}${delimiter}${month}${delimiter}${year}`;
}

export function formatTime(input: string | Date | undefined): string {
  if (!input) return '';

  const date = typeof input === 'string' ? new Date(input) : input;

  if (isNaN(date.getTime())) {
    return 'Hora inválida';
  }

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function formatDateWithTime(input: string | Date | undefined): string {
  if (!input) return '';

  const date = typeof input === 'string' ? new Date(input) : input;

  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatDDMMYYYY(d: Date | null): string {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatRangeInput(
  dates: [Date | null, Date | null] | null,
): string {
  const fmt = (x: Date | null) =>
    x
      ? `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`
      : '';
  if (!dates) return '';
  const [start, end] = dates;
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  if (start && !end) return `${fmt(start)} - __/__/____`;
  return '';
}

export function getMonthKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function getMonthYearLabel(date: Date) {
  return `${MONTHS_PT[date.getMonth()]} (${date.getFullYear()})`;
}

export const datePickerOptions = {};
