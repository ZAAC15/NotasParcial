export const Colors = {
  paper: '#FBF8F2',
  card: '#FFFFFF',
  ink: '#26352E',
  muted: '#788078',
  green: '#466B52',
  paleGreen: '#E8EFE7',
  gold: '#D69A4B',
  line: '#E9E4DA',
  danger: '#B85C50',
};

export function formatDateTime(value: string | number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
