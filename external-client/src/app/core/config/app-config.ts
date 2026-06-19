export const APP_CONFIG = {
  appName: 'Solanist',
  tagline: 'Solar Care',
  supportWhatsApp: '27821234567',
  supportPhone: '082 123 4567',
  supportEmail: 'hello@solanist.co.za',
  apiBaseUrl: '/api/v1',
  mockMode: false,
  currency: 'ZAR',
  locale: 'en-ZA',
  minPanelCount: 1,
  maxPanelCount: 1000,
} as const;

export function clampPanelCount(value: number): number {
  const n = Math.round(Number(value));
  if (Number.isNaN(n)) return APP_CONFIG.minPanelCount;
  return Math.min(APP_CONFIG.maxPanelCount, Math.max(APP_CONFIG.minPanelCount, n));
}
