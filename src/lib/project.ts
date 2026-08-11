export function getProjectNameFromFolderPath(folderPath: string): string {
  const trimmedPath = folderPath.trim().replace(/[\\/]+$/, '');
  if (!trimmedPath || /^[A-Za-z]:$/.test(trimmedPath)) return '';

  const segments = trimmedPath.split(/[\\/]+/).filter(Boolean);
  return segments.at(-1) ?? '';
}
