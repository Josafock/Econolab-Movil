export function validateApiUrl(value: string | undefined, allowHttp = false): string {
  if (!value?.trim()) throw new Error('Configura EXPO_PUBLIC_API_URL para conectar con ECONOLAB.');
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error('La dirección del servicio no es válida.'); }
  if (url.username || url.password || url.search || url.hash || !['https:', 'http:'].includes(url.protocol)) {
    throw new Error('La dirección del servicio debe ser una URL sin credenciales ni parámetros.');
  }
  if (url.protocol !== 'https:' && !allowHttp) throw new Error('La conexión publicada requiere HTTPS.');
  return url.toString().replace(/\/$/, '');
}

export function getApiUrl() {
  return validateApiUrl(process.env.EXPO_PUBLIC_API_URL, typeof __DEV__ !== 'undefined' && __DEV__);
}
