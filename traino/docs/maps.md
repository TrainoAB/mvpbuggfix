# Map tiles: Stadia raster styles + provider fallback

This app supports Stadia Maps raster tiles with a runtime style switcher and an OSM fallback.

## Environment variables

Set in `.env`:

- `NEXT_PUBLIC_TILE_PROVIDER` — set to `stadia` to enable Stadia tiles, otherwise OSM fallback is used.
- `NEXT_PUBLIC_STADIA_KEY` — your Stadia API key. Required when provider is `stadia`.
- `NEXT_PUBLIC_STADIA_EU` — set to `1` to use the EU endpoint (tiles-eu.stadiamaps.com). Defaults to global.

See `.env.example` for a template.

## Runtime style switching

A small selector appears in the top-right of the Leaflet map. It lists Stadia raster styles:

- Alidade Smooth
- Alidade Smooth Dark
- OSM Bright
- Outdoors
- Alidade Satellite (jpg)

If provider is `stadia` but the key is missing/empty, the app falls back to OSM once and logs a console warning.
Attributions update automatically per style.

## EU endpoint toggle

Set `NEXT_PUBLIC_STADIA_EU=1` to use `https://tiles-eu.stadiamaps.com`. Otherwise the global host is used.

## Notes

- No changes were made to marker, clustering, or filtering logic.
- Tile configuration is centralized in `app/config/tileStyles.js` and consumed via `app/config/mapCnf.js`.
