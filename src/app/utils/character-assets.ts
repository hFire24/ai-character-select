export function iconAssetPath(path: string): string {
  return `assets/Icons/${path}`;
}

export function tallIconAssetPath(path: string): string {
  if (!path) return 'assets/Icons/tall-extended/Unknown.png';
  return (typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches) ? 
    iconAssetPath(path) : useTallIconAssetPath(path);
}

export function useTallIconAssetPath(path: string): string {
  if (!path) return 'assets/Icons/tall-extended/Unknown.png';

  const [folder, ...rest] = path.split('/');
  const filename = rest.join('/');

  const tallFolder = folder === 'main' || folder === 'tall' ? 'tall' : 'tall-extended';
  return filename ? `assets/Icons/${tallFolder}/${filename}` : iconAssetPath(path);
}
