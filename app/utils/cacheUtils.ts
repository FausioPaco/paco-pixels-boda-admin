export function cacheExpired(fetchedAt: Date, minutes: number = 1): boolean {
  const expirationDate = new Date(fetchedAt);
  expirationDate.setTime(expirationDate.getTime() + minutes * 60 * 1000);
  return expirationDate.getTime() < Date.now();
}
