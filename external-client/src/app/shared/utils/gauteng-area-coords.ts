/** Approximate map positions (% of viewBox) for Gauteng service areas. */
const GAUTENG_AREAS: Record<string, { x: number; y: number }> = {
  sandton: { x: 68, y: 28 },
  fourways: { x: 62, y: 22 },
  bryanston: { x: 64, y: 26 },
  randburg: { x: 52, y: 32 },
  rosebank: { x: 58, y: 38 },
  parkhurst: { x: 54, y: 36 },
  hurlingham: { x: 60, y: 34 },
  kyalami: { x: 66, y: 20 },
  midrand: { x: 58, y: 48 },
  centurion: { x: 62, y: 58 },
  pretoria: { x: 66, y: 68 },
  'kempton park': { x: 78, y: 38 },
  benoni: { x: 82, y: 44 },
  boksburg: { x: 76, y: 48 },
  germiston: { x: 70, y: 52 },
  johannesburg: { x: 48, y: 44 },
  'johannesburg cbd': { x: 46, y: 46 },
  roodepoort: { x: 38, y: 38 },
  krugersdorp: { x: 28, y: 42 },
  meyerton: { x: 42, y: 72 },
  vanderbijlpark: { x: 34, y: 78 },
  alberton: { x: 64, y: 62 },
  waterfall: { x: 60, y: 52 },
  edenvale: { x: 72, y: 42 },
  bedfordview: { x: 70, y: 46 },
};

export function resolveGautengAreaPosition(area: string): { x: number; y: number } {
  const key = area.toLowerCase().trim();
  if (GAUTENG_AREAS[key]) return GAUTENG_AREAS[key];

  for (const [name, pos] of Object.entries(GAUTENG_AREAS)) {
    if (key.includes(name) || name.includes(key)) return pos;
  }

  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + _m(key.charCodeAt(i))) % 360;
  const angle = (hash / 360) * Math.PI * 2;
  const radius = 18 + (hash % 12);
  return {
    x: 52 + Math.cos(angle) * radius,
    y: 46 + Math.sin(angle) * radius,
  };
}

function _m(n: number): number {
  return ((n % 360) + 360) % 360;
}
