const STADIA_HOST_GLOBAL = 'https://tiles.stadiamaps.com';
const STADIA_HOST_EU = 'https://tiles-eu.stadiamaps.com';

const STADIA_ATTR_DEFAULT =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors';
const STADIA_ATTR_SATELLITE =
  'Imagery &copy; <a href="https://www.cnes.fr/en">CNES</a>/Airbus, <a href="https://www.planetobserver.com/">PlanetObserver</a>, &copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors';

const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function getHost() {
  return process.env.NEXT_PUBLIC_STADIA_EU === '1' ? STADIA_HOST_EU : STADIA_HOST_GLOBAL;
}

function buildStadiaUrl(path, ext, useRetinaToken) {
  const host = getHost();
  const retina = useRetinaToken ? '{r}' : '';
  const apiKey = process.env.NEXT_PUBLIC_STADIA_KEY || '';
  return `${host}/tiles/${path}/{z}/{x}/{y}${retina}.${ext}?api_key=${apiKey}`;
}

// Exported map of styles
export const stadiaStyles = {
  osm_bright: {
    label: 'OSM Bright',
    url: buildStadiaUrl('osm_bright', 'png', true),
    attribution: STADIA_ATTR_DEFAULT,
    maxZoom: 20,
    detectRetina: true,
  },
  alidade_satellite: {
    label: 'Alidade Satellite',
    url: buildStadiaUrl('alidade_satellite', 'jpg', true),
    attribution: STADIA_ATTR_SATELLITE,
    maxZoom: 20,
    detectRetina: true,
  },
};

// OSM fallback
export const osmFallback = {
  label: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: OSM_ATTR,
  maxZoom: 19,
  detectRetina: true,
};

export function getStadiaStyleKeysWithLabels() {
  return Object.entries(stadiaStyles).map(([key, cfg]) => ({ key, label: cfg.label }));
}

export default {
  stadiaStyles,
  osmFallback,
};
