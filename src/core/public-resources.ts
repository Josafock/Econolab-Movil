export function publicResources(values: { privacyUrl?: string; supportEmail?: string }) {
  let privacyUrl: string | undefined;
  try {
    const url = new URL(values.privacyUrl?.trim() ?? '');
    if (url.protocol === 'https:' && !url.username && !url.password) privacyUrl = url.toString();
  } catch { /* Un recurso sin configurar no se muestra como un enlace roto. */ }
  const email = values.supportEmail?.trim();
  const supportEmail = email && /^[^\s@?&#%]+@[^\s@?&#%]+\.[^\s@?&#%]+$/.test(email) ? email : undefined;
  return { privacyUrl, supportEmail };
}

export function getPublicResources() {
  return publicResources({
    privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL,
    supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL,
  });
}
