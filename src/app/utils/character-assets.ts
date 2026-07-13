export function iconAssetPath(path: string): string {
  return `assets/Icons/${path}`;
}

export function tallIconAssetPath(path: string): string {
  if (!path) return '';
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches) {
    return iconAssetPath(path);
  }

  const [, ...rest] = path.split('/');
  const filename = rest.join('/');

  return filename ? `assets/Icons/tall/${filename}` : iconAssetPath(path);
}
