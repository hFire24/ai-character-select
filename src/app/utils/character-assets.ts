export function iconAssetPath(path: string): string {
  return `assets/Icons/${path}`;
}

export function tallIconAssetPath(path: string): string {
  if (!path) return 'assets/Icons/tall/Unknown.png';
  return (typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches) ? 
    iconAssetPath(path) : useTallIconAssetPath(path);
}

export function useTallIconAssetPath(path: string): string {
  if (!path) return 'assets/Icons/tall/Unknown.png';

  const [, ...rest] = path.split('/');
  const filename = rest.join('/');

  return filename ? `assets/Icons/tall/${filename}` : iconAssetPath(path);
}
