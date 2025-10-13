import { stadiaStyles, osmFallback } from '@/app/config/tileStyles';

let warnedOnce = false;

function shouldUseStadia() {
  const provider = process.env.NEXT_PUBLIC_TILE_PROVIDER;
  const key = process.env.NEXT_PUBLIC_STADIA_KEY;
  return provider === 'stadia' && !!key;
}

export function getBaseTileConfig(styleKey) {
  const validKey = styleKey && stadiaStyles[styleKey] ? styleKey : 'alidade_smooth';

  if (shouldUseStadia()) {
    return { provider: 'stadia', styleKey: validKey, ...stadiaStyles[validKey] };
  }

  // Fallback to OSM and warn once if provider configured for Stadia but key missing
  if (process.env.NEXT_PUBLIC_TILE_PROVIDER === 'stadia' && !warnedOnce) {
    console.warn('[maps] Falling back to OSM: Stadia provider selected but key is missing.');
    warnedOnce = true;
  }

  return { provider: 'osm', styleKey: 'osm', ...osmFallback };
}

export default { getBaseTileConfig };
