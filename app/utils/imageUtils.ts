export function getCloudImage(url: string) {
  return url.replace('https://res.cloudinary.com/dwdlzepds/image/upload/', '');
}

export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}
