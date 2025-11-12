export function generateThemeColors(colorObject?: Record<string, string> | undefined | null) {
  if (!colorObject || typeof colorObject !== 'object') {
    return {};
  }
  return Object.fromEntries(
    Object.entries(colorObject).filter(([_, value]) => typeof value === 'string'),
  );
}
