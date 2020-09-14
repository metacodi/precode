
export function capitalize(s: any): string {
  if (typeof s !== 'string') { return ''; }
  if (s.length < 2) { return s.toUpperCase(); }
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
