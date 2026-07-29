export function iconAssetPath(path: string): string {
  return `assets/Icons/${path}`;
}

export function tallIconAssetPath(path: string): string {
  if (!path) return '';
  return (typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches) ? 
    iconAssetPath(path) : useTallIconAssetPath(path);
}

export function useTallIconAssetPath(path: string): string {
  const [, ...rest] = path.split('/');
  const filename = rest.join('/');

  return filename ? `assets/Icons/tall/${filename}` : iconAssetPath(path);
}