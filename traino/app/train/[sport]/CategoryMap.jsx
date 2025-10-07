'use client';

import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { setCookie, getCookie, deleteCookie } from '@/app/functions/functions';
import ItemRepository from './ItemRepository.js';
import L from 'leaflet';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

export default function CategoryMap({ mapCtx, isLoading, setIsLoading }) {
  DEBUG && console.log('Rendering Map component', mapCtx.filter);

  // Rerender counter
  const [_, setRefreshCount] = useState(0);

  // Leaflet map
  const mapRef = useRef(null);

  // Markers in map
  const markersRef = useRef(new Map());

  // Current position marker
  const referenceMarkerRef = useRef(null);

  // Previous zoom level
  const preZoomLevelRef = useRef(-1);

  // Loaded clusters
  const loadedClusters = useRef(new Map());

  const mapState = {
    mapCtx,
    mapRef,
    markersRef,
    referenceMarkerRef,
    preZoomLevelRef,
    loadedClusters,
    setRefreshCount,
  };

  // Initialize map context (CategoryMap aspects)
  if (!mapCtx.needMarkerUpdateInfo) {
    mapCtx.needMarkerUpdateInfo = {
      lastFilterHashCode: 0,
      needUpdate: false,
      useEffectTriggerCounter: 0,

      needToRunUpdateMarker_useEffectDependent() {
        if (mapCtx.showType !== 'map') {
          return this.useEffectTriggerCounter; // No update!
        }
        if (this.needUpdate) {
          this.needUpdate = false;
          return ++this.useEffectTriggerCounter; // Update!
        }
        if (this.lastFilterHashCode !== (mapCtx.filter?.hashCode() ?? 0)) {
          return ++this.useEffectTriggerCounter; // Update!
        }
        return this.useEffectTriggerCounter; // No update!
      },
      updateRefresh(currentFilterHashCode) {
        this.lastFilterHashCode = currentFilterHashCode;
        this.needUpdate = false;
      },
    };

    mapCtx.reference = referenceMarkerRef.current?.getLatLng();
    mapCtx.center = mapRef.current?.getCenter(); // mapBounds.current?.getCenter();

    mapCtx.setMapView = (latLng, zoomLevel) => {
      mapRef.current.setView(latLng, zoomLevel);
    };
    mapCtx.setReferencePosition = (lat, lng /*, refresh = true*/) => {
      positionReferenceMarker(mapState, lat, lng, false);
    };
  }

  // Initialize Leaflet map
  useEffect(() => {
    // Check if the map container is not initialized
    if (!mapRef.current) {
      // Initialize the map
      const map = L.map('map');

      // Assign the map to the mapRef
      mapRef.current = map;

      // Set initial view
      const cookieMap = getCookie('current_area');
      if (cookieMap !== null && cookieMap !== undefined) {
        const mapInfo = JSON.parse(cookieMap);
        mapCtx.setMapView([mapInfo[1].lat, mapInfo[1].lng], mapInfo[0]);
      } else {
        mapCtx.setMapView([59.32, 18.07], 9); // ([62.0, 15.0], 5)
      }

      L.tileLayer(mapCnf.leafletTileUrlTemplate, {
        attribution: mapCnf.leafletAttribution,
      }).addTo(map);

      // Listen to "moveend" event from map. Should trigger after every change of displayed world part.
      map.on('moveend', () => {
        DEBUG && console.log('Leaflet event MOVEEND', mapCtx.showType, mapState);
        setCookie('current_area', JSON.stringify([mapState.mapRef.current._zoom, mapState.mapCtx.center]));
        mapCtx.center = mapRef.current.getCenter();
        mapCtx.itemRepo.setCurrentArea(getItemAreaFromMapArea(mapRef.current.getBounds(), mapRef.current.getZoom()));
        if (mapCtx.showType === 'map') {
          setIsLoading(true); // Start loading
          const result = updateMarkers(mapState);
          if (result && typeof result.then === 'function') {
            result
              .then(() => setIsLoading(false)) // Stop loading when done
              .catch(() => setIsLoading(false)); // Ensure loading stops on error
          } else {
            setIsLoading(false); // Stop loading if not a promise
          }
        } else {
          mapCtx.needMarkerUpdateInfo.needUpdate = true;
          if (mapCtx.showType === 'list' && mapCtx.rerenderListView) {
            mapCtx.rerenderListView((c) => c + 1);
          }
        }
      });

      // Init center
      mapCtx.center = mapRef.current.getCenter();
      // Init item repository area
      mapCtx.itemRepo.setCurrentArea(getItemAreaFromMapArea(mapRef.current.getBounds(), mapRef.current.getZoom()));
    }
  }, []);

  // Update markers if filter changed (also initial load)
  useEffect(() => {
    DEBUG &&
      console.log(
        'Map useEffect called (updateMarkers) category =',
        mapCtx.filter?.cat ?? '<no value>',
        'mapCtx:',
        mapCtx,
      );

    if (mapCtx.filter?.cat) {
      setIsLoading(true); // Start loading
      const result = updateMarkers(mapState);
      if (result && typeof result.then === 'function') {
        result
          .then(() => setIsLoading(false)) // Stop loading when done
          .catch(() => setIsLoading(false)); // Ensure loading stops on error
      } else {
        setIsLoading(false); // Stop loading if not a promise
      }
    }
  }, [mapCtx.needMarkerUpdateInfo.needToRunUpdateMarker_useEffectDependent()]);

  // MARK: Markup
  return (
    <>
      <div className="map" id="map"></div>
    </>
  );
}

// MARK: Functions

/***********************************************************************************/
/**************************** MAP CONFIGURATION ************************************/
/***********************************************************************************/

const mapCnf = {
  /*Zoom level for deciding Normal or Area-Cluser mode*/
  useAreaCountClusterForZoomLevel: 9,

  /*mergeVeryCloseItems: Make items that are too close in maximum zoomed-in state, merge into one marker.*/
  mergeVeryCloseItems: true,

  /*tweakCloseLimit: Don't merge items if not more than this limit. Tweak positions instead.*/
  tweakCloseLimit: 3,

  /*maxDiffX: Number deciding when to collect markers into cluster. Longitude direction. (Normal mode) */
  maxDiffX: 160,
  /*maxDiffY:  Number deciding when to collect markers into cluster. Latitude direction. (Normal mode)*/
  maxDiffY: 90,

  /*Fraction of extraLongitude() below. Shows marker on edge. (fraction! i.e. bigger => smaller edge*/
  fractionOfExtraForMarkers: 4,

  /*Leaflet URL Template for fetching map tiles*/
  leafletTileUrlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  /*Alternative: 'https://api.maptiler.com/maps/winter-v2/{z}/{x}/{y}.png?key=ZMq30pHFpvirOIN7LdHW'*/

  /*LeafLet attribution HTML*/
  leafletAttribution:
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a>',

  /*Get extra info around edges of map, (Used as base for latitude direction also)*/
  extraLongitude(zoomLevel) {
    return (this.maxDiffY * 2) / Math.pow(2, zoomLevel);
  },
  /*From how big map(-view-)area can a cluster be collected from. Normal mode. */
  collectionMaxWidth(mapSize, zoomPower) {
    return (this.maxDiffY / zoomPower) * Math.min(mapSize / 120, 10);
  },
};

/***********************************************************************************/
/****************************** ITEM CACHE *****************************************/
/***********************************************************************************/

function clearClusterAreaItems(state) {
  state.loadedClusters.current.clear();
}

/***********************************************************************************/
/***************************** HANDLE CLICK MARKERS ********************************/
/***********************************************************************************/

/* Normal marker click handled by Component paremeter function - handlePointClick */

function handleCollectionMarkerClick(state, itemCollection) {
  const bounds = getBoundsOfItems(itemCollection.collection, {
    north: 0.1,
    south: 0.05,
    east: 0.05,
    west: 0.05,
  });
  const mpBnds = state.mapRef.current.getBounds();
  if (
    (mpBnds.getEast() - mpBnds.getWest()) / 2.1 < bounds.getEast() - bounds.getWest() ||
    (mpBnds.getNorth() - mpBnds.getSouth()) / 2.1 < bounds.getNorth() - bounds.getSouth()
  ) {
    //state.mapRef.current.setView( itemCollection.center, state.mapRef.current.getZoom() + 1 );
    state.mapCtx.setMapView(itemCollection.center, state.mapRef.current.getZoom() + 1);
  } else {
    state.mapRef.current.fitBounds(bounds);
    state.mapCtx.itemRepo.setCurrentArea(
      getItemAreaFromMapArea(state.mapRef.current.getBounds(), state.mapRef.current.getZoom()),
    );
    //state.rerenderListOrMap();
  }
}

function handleClusterMarkerClick(state, clu) {
  //state.mapRef.current.setView(clu.center, state.mapRef.current.getZoom() + 1);
  state.mapCtx.setMapView(clu.center, state.mapRef.current.getZoom() + 1);
}

/***********************************************************************************/
/************************** PLACE MARKERS into MAP *********************************/
/***********************************************************************************/

function positionReferenceMarker(state, lat, lng) {
  DEBUG && console.log('positionReferenceMarker', lat, lng);
  if (!state.referenceMarkerRef.current) {
    state.referenceMarkerRef.current = L.marker(
      [lat, lng],
      // {
      //   icon: L.icon({
      //     iconUrl: 'leaflet/dist/images/marker-icon.png', //'../../assets/marker-icon.png',
      //   }),
      // },
      {
        icon: L.divIcon({
          html: `<div class="btn-mapposition marker-mapposition"></div>`,
          //iconAnchor: L.point(0, 0),
        }),
        draggable: true,
        autoPan: true,
      },
    ).addTo(state.mapRef.current);

    state.referenceMarkerRef.current.on('dragend', () => {
      state.mapCtx.reference = state.referenceMarkerRef.current.getLatLng();
      state.mapCtx.center = state.mapRef.current.getCenter();
      state.mapCtx.setPopupItem(null);
      DEBUG && console.log('REF Marker dragged to:', state.mapCtx.reference, state.mapCtx.center);
    });
  } else {
    const oldPos = state.referenceMarkerRef.current.getLatLng();
    if (Math.abs(oldPos.lat - lat) < 0.00001 && Math.abs(oldPos.lng - lng) < 0.00001) {
      //No change to speak of
      return;
    }
    state.referenceMarkerRef.current.setLatLng(L.latLng(lat, lng));
  }

  state.mapCtx.reference = state.referenceMarkerRef.current.getLatLng();
  state.mapCtx.center = state.mapRef.current.getCenter();
}

function positionMarkers(state, items, bounds) {
  //const mapBounds = state.mapRef.current.getBounds();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // let ll = new L.LatLng(item.latitude, item.longitude);
    // console.log('POSITION MARKER', mapBounds, ll);
    //if (!mapBounds.contains(new L.LatLng(item.latitude, item.longitude)))
    if (!isInArea([item.longitude, item.latitude], bounds)) continue;

    const icon = L.divIcon({
      html: makePositionMarkerHTML(state, item),
      iconAnchor: L.point(0, item.tweakPos ? item.tweakPos * 35 : 0),
    });
    const marker = L.marker([item.latitude, item.longitude], {
      icon: icon,
    }).addTo(state.mapRef.current);
    marker.on('click', (e) => state.mapCtx.handlePointClick(e.originalEvent, item));
    item.marker = marker;
    state.markersRef.current.set(item.id, item);
  }
}

function positionCollections(state, collections, bounds) {
  for (let i = 0; i < collections.length; i++) {
    const coll = collections[i];
    //if (!mapBounds.contains(coll.center)) continue;
    if (!isInArea([coll.center[1], coll.center[0]], bounds)) continue;

    const nrMembers = coll.collection.reduce(
      (tot, item) => tot + (item.sharedMarkerWith ? item.sharedMarkerWith.length + 1 : 1),
      0,
    );
    const icon = L.divIcon({ html: makeCollectionMarkerHTML(nrMembers) });
    const marker = L.marker(coll.center, { icon: icon }).addTo(state.mapRef.current);
    marker.on('click', () => handleCollectionMarkerClick(state, coll));
    coll.marker = marker;
    state.markersRef.current.set(coll.id, coll);
  }
}

function positionClusters(state, clusters) {
  //console.log('positionClusters', clusters);
  let clusteridCounter = 0;
  for (let i = 0; i < clusters.length; i++) {
    const clu = clusters[i];
    if (!clu || !clu.product_count) continue;
    const icon = L.divIcon({
      html: makeCollectionMarkerHTML(clu.product_count),
    });
    clu.center = L.latLng(clu.lat_sum / clu.product_count, clu.lng_sum / clu.product_count);
    const marker = L.marker(clu.center, { icon: icon }).addTo(state.mapRef.current);
    marker.on('click', () => handleClusterMarkerClick(state, clu));
    clu.marker = marker;
    state.markersRef.current.set('cluster-' + clusteridCounter++, clu);
  }
  //console.log('positionClusters done', clusteridCounter, state.markersRef.current );
}

/***********************************************************************************/
/*************************** FETCH DATA from SERVER ********************************/
/***********************************************************************************/

async function fetchAreaCounts(state, grid) {
  const url = `${state.mapCtx.baseUrl}/api/proxy`;
  DEBUG && console.log('fetchAreaCounts', url);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${state.mapCtx.sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `${state.mapCtx.baseUrl}/api/map/gridcount${state.mapCtx.filter.urlFilterPart('?')}`,
        method: 'POST',
        body: JSON.stringify({ grid }),
      }),
    });

    const clusters = await resp.json();

    DEBUG && console.log('Clusters:', clusters);

    if (!Array.isArray(clusters)) {
      throw new Error(`Fetch respons error! Response-OK:${resp.ok} (No array returned) ${url}`);
    }

    //Post process
    clusters.forEach((c) => {
      c.lat_sum = Number(c.lat_sum);
      c.lng_sum = Number(c.lng_sum);
    });
    return clusters;
  } catch (err) {
    console.error('Error fetching data (fetchGridCounts):', err, url);
    return null;
  }
}

/***********************************************************************************/
/***************** CLUSTERS - AREA COUNT MODE (outer zoom levels) ******************/
/***********************************************************************************/

const latitudeSteps256 = [
  -90.1, -80, -79.8088, -79.6142, -79.4157, -79.2134, -79.0073, -78.7975, -78.5837, -78.3659, -78.1438, -77.9177,
  -77.6873, -77.4525, -77.2133, -76.9698, -76.7217, -76.469, -76.2113, -75.9489, -75.6817, -75.4094, -75.1323, -74.8499,
  -74.5622, -74.2693, -73.9708, -73.667, -73.3574, -73.0423, -72.7215, -72.3946, -72.0615, -71.7229, -71.3777, -71.0261,
  -70.6686, -70.3043, -69.9332, -69.5556, -69.1715, -68.78, -68.3821, -67.9767, -67.5642, -67.1442, -66.7169, -66.2822,
  -65.8397, -65.3892, -64.9313, -64.4653, -63.9913, -63.5087, -63.018, -62.5193, -62.0119, -61.4956, -60.9706, -60.4373,
  -59.8947, -59.3435, -58.7823, -58.2126, -57.6335, -57.0452, -56.447, -55.8395, -55.2228, -54.5955, -53.959, -53.312,
  -52.6557, -51.9895, -51.3128, -50.6262, -49.9292, -49.2222, -48.5047, -47.7767, -47.0389, -46.2905, -45.5316,
  -44.7628, -43.9829, -43.1932, -42.3929, -41.5827, -40.762, -39.9302, -39.0891, -38.2376, -37.3761, -36.5041, -35.6229,
  -34.7318, -33.8307, -32.9198, -31.9997, -31.0702, -30.1315, -29.1842, -28.2275, -27.2628, -26.2889, -25.3076,
  -24.3176, -23.3201, -22.3141, -21.3018, -20.2821, -19.2563, -18.2236, -17.1848, -16.1404, -15.0899, -14.0343,
  -12.9739, -11.9085, -10.84, -9.7666, -8.6907, -7.6111, -6.529, -5.4444, -4.358, -3.2704, -2.1802, -1.0901,

  0, 1.0901, 2.1802, 3.2704, 4.358, 5.4444, 6.529, 7.6111, 8.6907, 9.7666, 10.84, 11.9085, 12.9739, 14.0343, 15.0899,
  16.1404, 17.1848, 18.2236, 19.2563, 20.2821, 21.3018, 22.3141, 23.3201, 24.3176, 25.3076, 26.2889, 27.2628, 28.2275,
  29.1842, 30.1315, 31.0702, 31.9997, 32.9198, 33.8307, 34.7318, 35.6229, 36.5041, 37.3761, 38.2376, 39.0891, 39.9302,
  40.762, 41.5827, 42.3929, 43.1932, 43.9829, 44.7628, 45.5316, 46.2905, 47.0389, 47.7767, 48.5047, 49.2222, 49.9292,
  50.6262, 51.3128, 51.9895, 52.6557, 53.312, 53.959, 54.5955, 55.2228, 55.8395, 56.447, 57.0452, 57.6335, 58.2126,
  58.7823, 59.3435, 59.8947, 60.4373, 60.9706, 61.4956, 62.0119, 62.5193, 63.018, 63.5087, 63.9913, 64.4653, 64.9313,
  65.3892, 65.8397, 66.2822, 66.7169, 67.1442, 67.5642, 67.9767, 68.3821, 68.78, 69.1715, 69.5556, 69.9332, 70.3043,
  70.6686, 71.0261, 71.3777, 71.7229, 72.0615, 72.3946, 72.7215, 73.0423, 73.3574, 73.667, 73.9708, 74.2693, 74.5622,
  74.8499, 75.1323, 75.4094, 75.6817, 75.9489, 76.2113, 76.469, 76.7217, 76.9698, 77.2133, 77.4525, 77.6873, 77.9177,
  78.1438, 78.3659, 78.5837, 78.7975, 79.0073, 79.2134, 79.4157, 79.6142, 79.8088, 80, 90.1,
];

const placesOfInterest = [
  [59.32, 18.07] /*Stockholm*/,
  [57.71, 11.97] /*Götegorg*/,
  [55.61, 13] /*Malmö*/,
  [59.86, 17.64] /*Uppsala*/,
  [58.41, 15.62] /*Linköping*/,
  [59.61, 16.55] /*Västerås*/,
  [59.27, 15.22] /*Örebro*/,
  [56.05, 12.7] /*Helsingborg*/,
  [57.78, 14.17] /*Jönköping*/,
  [58.59, 16.19] /*Norrköping*/,
  [63.83, 20.26] /*Umeå*/,
  [55.7, 13.19] /*Lund*/,
  [57.72, 12.94] /*Borås*/,
  [59.37, 16.51] /*Eskilstuna*/,
  [56.67, 12.86] /*Halmstad*/,
  [60.67, 17.14] /*Gävle*/,
  [59.19, 17.62] /*Södertälje*/,
  [62.39, 17.31] /*Sundsvall*/,
  [56.88, 14.81] /*Växjö*/,
  [59.38, 13.5] /*Karlstad*/,
  [56.03, 14.16] /*Kritianstad*/,
  [57.49, 12.07] /*Kungsbacka*/,
  [65.58, 22.15] /*Luleå*/,
  [64.75, 20.95] /*Skellefteå*/,
  [56.16, 15.59] /*Karlskrona*/,
  [63.18, 14.64] /*Östersund*/,
  [58.75, 17] /*Nyköping*/,
  [63.29, 18.72] /*Örnsköldsvik*/,
  [65.32, 21.48] /*Piteå*/,
  [67.85, 20.23] /*Kiruna*/,
  //[] /**/,
];

function findClosestValue(origVal, ascVals, step, higher = true) {
  for (let i = 0; i < ascVals.length - 1; i += step) {
    if (ascVals[i] >= origVal) {
      if (higher) return i;
      return ascVals[i] === origVal ? i : i - step >= 0 ? i - step : 0;
    }
  }
  return ascVals.length - 1;
}

function findGridPart(point, parts) {
  for (let p = 0; p < parts.length; p++) {
    if (parts[p][0] <= point[0] && point[0] <= parts[p][2] && parts[p][1] <= point[1] && point[1] <= parts[p][3]) {
      return p;
    }
  }
  return -1;
}

function isInMiddleOfGridPart(point, part) {
  if (Math.abs(point[0] - (part[2] + part[0]) / 2) > (part[2] - part[0]) / 4) return false;
  if (Math.abs(point[1] - (part[3] + part[1]) / 2) > (part[3] - part[1]) / 4) return false;
  return true;
}

function getQuarterGridPart(point, part) {
  let qp, rest1, rest2;
  const latMid = (part[2] + part[0]) / 2;
  const lngMid = (part[3] + part[1]) / 2;
  if (point[0] < latMid) {
    if (point[1] < lngMid) {
      qp = [part[0], part[1], latMid, lngMid];
      rest1 = [latMid, part[1], part[2], part[3]];
      rest2 = [part[0], lngMid, latMid, part[3]];
    } else {
      qp = [part[0], lngMid, latMid, part[3]];
      rest1 = [latMid, part[1], part[2], part[3]];
      rest2 = [part[0], part[1], latMid, lngMid];
    }
  } else {
    if (point[1] < lngMid) {
      qp = [latMid, part[1], part[2], lngMid];
      rest1 = [part[0], part[1], latMid, part[3]];
      rest2 = [latMid, lngMid, part[2], part[3]];
    } else {
      qp = [latMid, lngMid, part[2], part[3]];
      rest1 = [part[0], part[1], latMid, part[3]];
      rest2 = [latMid, part[1], part[2], lngMid];
    }
  }
  return [qp, rest1, rest2];
}

function adjustForPlacesOfInterest(gridParts) {
  const partsAdjusted = new Set();
  const toAdjust = [];
  for (let p = 0; p < placesOfInterest.length; p++) {
    const poi = placesOfInterest[p];
    const pIx = findGridPart(poi, gridParts);
    if (pIx < 0 || partsAdjusted.has(pIx)) continue;
    partsAdjusted.add(pIx);
    const part = gridParts[pIx];
    if (isInMiddleOfGridPart(poi, part)) continue;
    const [qp, rest1, rest2] = getQuarterGridPart(poi, part);
    toAdjust.push([pIx, qp, rest1, rest2]);
  }
  toAdjust.sort((a1, a2) => a2[0] - a1[0]); //descending parts index
  DEBUG && console.log('adjustForPlacesOfInterest', toAdjust);
  for (let a = 0; a < toAdjust.length; a++) {
    const adj = toAdjust[a];
    gridParts.splice(adj[0], 1, adj[1]);
    gridParts.push(adj[2], adj[3]);
  }
  return gridParts.length - 2 * toAdjust.length; //First adjust pair index
}

function isSameGrid(g1, g2) {
  return (
    typeof g1 === 'object' &&
    typeof g2 === 'object' &&
    Math.abs(g1.latmin - g2.latmin) < 0.001 &&
    Math.abs(g1.latmax - g2.latmax) < 0.001 &&
    Math.abs(g1.lngmin - g2.lngmin) < 0.001 &&
    Math.abs(g1.lngmax - g2.lngmax) < 0.001
  );
  // return (
  //   g1.latmin < g2.latmax &&
  //   g2.latmin < g1.latmax &&
  //   g1.lngmin < g2.lngmax &&
  //   g2.lngmin < g1.lngmax
  // );
}

function findFetchedCluster([expectedIndex, grid, id], fetched) {
  if (fetched.length > expectedIndex && isSameGrid(grid, fetched[expectedIndex]?.grid)) return fetched[expectedIndex];
  for (let i = 0; i < fetched.length; i++) {
    if (isSameGrid(grid, fetched[i]?.grid)) return fetched[i];
  }
  return null;
}

async function getClustersForMapView(state) {
  const zoom = state.mapRef.current.getZoom();
  const latStep = Math.pow(2, 9 - zoom);
  const lngStep = latStep; //

  const mapBnds = state.mapRef.current.getBounds();
  let [s, w, n, e] = [mapBnds.getSouth(), mapBnds.getWest(), mapBnds.getNorth(), mapBnds.getEast()];
  let sLatIx = findClosestValue(s, latitudeSteps256, latStep, false);
  let nLatIx = findClosestValue(n, latitudeSteps256, latStep, true);

  let wLng = Math.floor(w / lngStep) * lngStep;
  let eLng = Math.floor((e + lngStep) / lngStep) * lngStep;

  let gridParts = [];
  for (let lt = sLatIx; lt < nLatIx; lt += latStep) {
    for (let lg = 0; wLng + lg * lngStep + 0.0001 < eLng; lg++) {
      gridParts.push([
        latitudeSteps256[lt],
        wLng + lg * lngStep,
        latitudeSteps256[lt + latStep],
        wLng + (lg + 1) * lngStep,
      ]);
    }
  }

  //console.log('Original parts', gridParts.slice());
  const firstAdjustPairIx = adjustForPlacesOfInterest(gridParts);
  //console.log('Adjusted parts', gridParts.slice(), firstAdjustPairIx);

  const grid = [];
  const resultSrc = [];
  gridParts.forEach((p) => {
    const id = `clu|${p[0]}|${p[1]}|${p[2]}|${p[3]}`;
    if (!state.loadedClusters.current.has(id)) {
      let gridSpec = {
        latmin: p[0],
        latmax: p[2],
        lngmin: p[1],
        lngmax: p[3],
      };
      resultSrc.push([grid.length, gridSpec, id]);
      grid.push(gridSpec);
    } else {
      resultSrc.push(id);
    }
  });

  //console.log('getClustersForMapView', parts, grid, sLatIx, nLatIx, wLng, eLng, s, n, latStep, lngStep );

  let clusters0 = grid.length === 0 ? [] : await fetchAreaCounts(state, grid);
  if (!clusters0) {
    //Error
    return [];
  }

  const clusters = [];
  resultSrc.forEach((rs) => {
    if (typeof rs === 'string') {
      let cachedCluster = state.loadedClusters.current.get(rs);
      if (!cachedCluster) {
        cachedCluster = null;
        DEBUG && console.log('ERROR - Cached cluser not found', rs);
      }
      clusters.push(cachedCluster);
    } else {
      let fetchedCluster = findFetchedCluster(rs, clusters0);
      if (!fetchedCluster) {
        DEBUG && console.log('ERROR - Missing fetched cluster', rs);
      } else {
        state.loadedClusters.current.set(rs[2], fetchedCluster);
      }
      clusters.push(fetchedCluster);
    }
  });

  //console.log('Loaded clusters:', clusters0, clusters);

  //Handle adjusted...
  if (firstAdjustPairIx < clusters.length) {
    DEBUG && console.log('Merge adjusted', firstAdjustPairIx, clusters.length, clusters, gridParts);
    const mergedClusters = [];
    for (let p = firstAdjustPairIx; p < clusters.length - 1; p += 2) {
      if (!clusters[p] || !clusters[p + 1]) {
        if (clusters[p]) mergedClusters.push(clusters[p]);
        if (clusters[p + 1]) mergedClusters.push(clusters[p + 1]);
        continue;
      }
      const mergedCluster = {};
      mergedCluster.product_count = clusters[p].product_count + clusters[p + 1].product_count;
      mergedCluster.lat_sum = clusters[p].lat_sum + clusters[p + 1].lat_sum;
      mergedCluster.lng_sum = clusters[p].lng_sum + clusters[p + 1].lng_sum;
      mergedClusters.push(mergedCluster);
    }
    clusters.splice(firstAdjustPairIx);
    clusters.push(...mergedClusters);
    DEBUG && console.log('Adjusted clusters', clusters);
  }

  //Remove nulls
  for (let c = clusters.length - 1; c >= 0; c--) {
    if (!clusters[c]) clusters.splice(c, 1);
  }

  return clusters;
}

/***********************************************************************************/
/***************** GROUPING (CLUSTERING) METHODS - NORMAL MODE *********************/
/***********************************************************************************/

function findSubGroup(items, axis, maxWidth) {
  let bestStartIx = 0;
  let bestCount = 0;
  let curStartIx = 0;

  for (let i = 1; i < items.length; i++) {
    if (items[i].xy[axis] - items[curStartIx].xy[axis] <= maxWidth) {
      continue;
    }
    if (i - 1 - curStartIx > bestCount) {
      bestCount = i - curStartIx;
      bestStartIx = curStartIx;
    }

    for (let j = 1; curStartIx + j <= i; j++) {
      if (items[i].xy[axis] - items[curStartIx + j].xy[axis] <= maxWidth) {
        curStartIx = curStartIx + j;
        break;
      }
    }
  }
  if (items.length - curStartIx > bestCount) {
    bestStartIx = curStartIx;
    bestCount = items.length - curStartIx;
  }
  return [
    bestStartIx >= 4 ? bestStartIx : 0,
    bestStartIx + bestCount < items.length - 4 ? bestStartIx + bestCount : items.length,
  ];
}

function splitWideGroup(grp, axis, maxWidth) {
  const [startIx, endIx] = findSubGroup(grp, axis, maxWidth);
  if (startIx < 0) {
    return [grp];
  }

  const subGroups = [];
  if (startIx > 6) {
    const subGroups1 = splitWideGroup(grp.slice(0, startIx), axis, maxWidth);
    subGroups.push(...subGroups1);
  } else if (startIx > 0) {
    subGroups.push(grp.slice(0, startIx));
  }

  subGroups.push(grp.slice(startIx, endIx));

  if (endIx < grp.length - 6) {
    const subGroups2 = splitWideGroup(grp.slice(endIx), axis, maxWidth);
    subGroups.push(...subGroups2);
  } else if (endIx < grp.length) {
    subGroups.push(grp.slice(endIx));
  }
  return subGroups;
}

function groupCloseOnAxis(items, axis, maxDiff, maxWidth) {
  items.sort((i1, i2) => i1.xy[axis] - i2.xy[axis]);

  const groups = [];
  const addIfMems = (g) => {
    if (g.length) {
      if (g[g.length - 1].xy[axis] - g[0].xy[axis] > maxWidth) {
        const manyGroups = splitWideGroup(g, axis, maxWidth);
        groups.push(...manyGroups);
      } else {
        groups.push(g);
      }
      return true;
    }
    return false;
  };

  let grp = [];
  for (let i = 1; i < items.length; i++) {
    if (items[i].xy[axis] - items[i - 1].xy[axis] <= maxDiff) {
      if (grp.length === 0) grp.push(items[i - 1]);
      grp.push(items[i]);
    } else {
      if (addIfMems(grp)) grp = [];
    }
  }
  addIfMems(grp);

  return groups;
}

function groupClose(items, maxDiff, maxWidth = 0, level = 1) {
  const axis = level % 2;
  const groups = groupCloseOnAxis(items, axis, maxDiff[axis], maxWidth);
  if ((level > 1 && groups.length === 1 && groups[0].length === items.length) || level > 9 /*Should never happen*/) {
    return groups;
  }

  const finalGroups = [];
  for (let g = 0; g < groups.length; g++) {
    const nextLevelGroups = groupClose(groups[g], maxDiff, maxWidth, level + 1);
    finalGroups.push(...nextLevelGroups);
  }

  return finalGroups;
}

function mergeCloseItems(state, items) {
  const z = Math.pow(2, state.mapRef.current.getMaxZoom());
  const maxDiff = [mapCnf.maxDiffX / z, mapCnf.maxDiffY / z];

  const mergeGroups = groupClose(items, maxDiff);

  for (let g = 0; g < mergeGroups.length; g++) {
    const mg = mergeGroups[g];
    if (mg.length <= mapCnf.tweakCloseLimit) continue; //Use tweak position instead
    //const item0 = items.find((i) => i.id === mg[0].id); ???
    const item0 = mg[0];
    item0.sharedMarkerWith = [];
    for (let m = 1; m < mg.length; m++) {
      const itemIx = items.findIndex((it) => it.id === mg[m].id);
      item0.sharedMarkerWith.push(items[itemIx]);
      items.splice(itemIx, 1);
    }
  }
}

function assembleItemCollections(state, items) {
  const currentZoomLevel = state.mapRef.current.getZoom();
  const z = Math.pow(2, currentZoomLevel);
  const maxDiff = [mapCnf.maxDiffX / z, mapCnf.maxDiffY / z];

  const mpBnds = state.mapRef.current.getBounds();
  const mapSize =
    Math.min(
      mpBnds.getEast() - mpBnds.getWest(),
      mpBnds.getNorth() / Math.cos(mpBnds.getNorth() * (Math.PI / 180)) -
        mpBnds.getSouth() / Math.cos(mpBnds.getSouth() * (Math.PI / 180)),
    ) * z;

  const maxWidth = mapCnf.collectionMaxWidth(mapSize, z); //Math.min(...maxDiff) * Math.min(mapSize / 120, 10);
  const finalGroups = groupClose(items, maxDiff, maxWidth);

  if (
    //mergeVeryCloseItems ||
    currentZoomLevel !== state.mapRef.current.getMaxZoom()
  ) {
    const collections = finalGroups.map((fg) => {
      const coll = fg.map((p) => items.find((i) => i.id === p.id));
      return {
        id: getCollectionId(coll),
        center: getCollectionCoordinates(coll),
        collection: coll,
      };
    });
    return [collections, finalGroups.flat().map((ip) => ip.id) /*all grouped item ids*/];
  } else {
    //Keep too close items apart, tweak their position
    for (let g = 0; g < finalGroups.length; g++) {
      const grp = finalGroups[g];
      grp.sort((i1, i2) => i1.latitude - i2.latitude);
      const [avgLat, _] = getCollectionCoordinates(grp);
      const midIx = grp.length / 2 - 0.5;
      for (let i = 0; i < grp.length; i++) {
        grp[i].latitude = avgLat;
        grp[i].tweakPos = -midIx + i;
      }
      // console.log(
      //   'Tweaked positions group',
      //   g,
      //   ...grp.map((i) => `${i.id}-tweak:${i.tweakPos}`),
      // );
    }
    return [[], []];
  }
}

/***********************************************************************************/
/****************************** UPDATE MARKERS *************************************/
/***********************************************************************************/

function clearAllMarkers(state) {
  state.markersRef.current.forEach((itemOrColl) => {
    //if (itemOrColl.marker) state.mapRef.current.removeLayer(itemOrColl.marker);
    itemOrColl.marker?.remove();
  });
  state.markersRef.current.clear();
}

function updateMarkers(state) {
  if (!state.mapRef.current) return;

  const zoomLevel = state.mapRef.current.getZoom();
  const preZoomLevel = state.preZoomLevelRef.current;
  state.preZoomLevelRef.current = zoomLevel;

  const filterVersion = state.mapCtx.filter.hashCode();
  const filterChanged = filterVersion !== state.mapCtx.needMarkerUpdateInfo.lastFilterHashCode;
  if (filterChanged) {
    clearClusterAreaItems(state);
    clearAllMarkers(state);
  }
  state.mapCtx.needMarkerUpdateInfo.updateRefresh(filterVersion);

  if (zoomLevel <= mapCnf.useAreaCountClusterForZoomLevel) {
    DEBUG && console.log('updateMarkers AREA CLUSTER LEVEL');
    updateClusterMarkers(state);
  } else {
    clearAllClusterMarkers(state);
    updateMarkers_Normal(state, filterChanged, zoomLevel, zoomLevel === preZoomLevel);
  }
}

/***********************************************************************************/
/********************** UPDATE MARKERS - CLUSTER AREA MODE *************************/
/***********************************************************************************/

async function updateClusterMarkers(state) {
  const clusters = await getClustersForMapView(state);
  if (!clusters || clusters.length === 0) return;

  clearAllMarkers(state);
  positionClusters(state, clusters);
}

function clearAllClusterMarkers(state) {
  for (let [mrkId, item] of state.markersRef.current) {
    if (typeof mrkId === 'string' && mrkId.startsWith('cluster-')) {
      item.marker?.remove();
      state.markersRef.current.delete(mrkId);
    }
  }
}

/***********************************************************************************/
/************************ UPDATE MARKERS - NORMAL MODE *****************************/
/***********************************************************************************/

async function updateMarkers_Normal(state, filterChanged, zoomLevel, sameZoomLevel) {
  DEBUG && console.log('updateMarkers_Normal', filterChanged, zoomLevel, sameZoomLevel);
  const mapBounds = state.mapRef.current.getBounds();

  const areaToShow = getItemAreaFromMapArea(mapBounds, zoomLevel); //(state.mapRef.current);

  const itemsToShow = await state.mapCtx.itemRepo.getItems(areaToShow);

  if (itemsToShow.length === 0) return;

  if (!filterChanged && sameZoomLevel) {
    //Keep markers mostly same if map is dragged a bit on same zoom level.
    const itemsInMarkers = getItemsInMarkers(state, true);
    const itemsInMarkersIds = new Set();
    itemsInMarkers.forEach((i) => itemsInMarkersIds.add(i.id));
    for (let i = itemsToShow.length - 1; i >= 0; i--) {
      if (itemsInMarkersIds.has(itemsToShow[i].id)) itemsToShow.splice(i, 1);
    }
  }

  prepareGrouping(itemsToShow);

  if (mapCnf.mergeVeryCloseItems) {
    mergeCloseItems(state, itemsToShow);
  }
  const [collections, allGroupedItemIds] = assembleItemCollections(state, itemsToShow);
  removeItems(itemsToShow, allGroupedItemIds);

  if (!filterChanged) {
    //console.log('updateMarkers - SAME filter');
    keepOrRemoveMarkers(state, itemsToShow, collections, allGroupedItemIds, areaToShow);
  }

  const markerBounds = getItemAreaFromMapArea(mapBounds, zoomLevel, true);
  positionCollections(state, collections, markerBounds);
  positionMarkers(state, itemsToShow, markerBounds);
}

function keepOrRemoveMarkers(state, items, collections, allGroupedItemIds, area) {
  //Remove single markers that have now been grouped
  allGroupedItemIds.forEach((id) => {
    const marker = state.markersRef.current.get(id)?.marker;
    if (marker) {
      //state.mapRef.current.removeLayer(marker);
      marker.remove();
      state.markersRef.current.delete(id);
    }
  });

  const allItemIds = items.map((i) => i.id);
  allItemIds.push(...allGroupedItemIds);
  const allCollIds = collections.map((c) => c.id);
  for (let [collId, coll] of state.markersRef.current) {
    if (typeof collId === 'number') continue;

    if (allCollIds.includes(collId)) {
      //Same collection already in map, remove
      collections.splice(
        collections.findIndex((c) => c.id === collId),
        1,
      );
    } else {
      const oldIds = collId.split('|').map((id) => Number(id));
      //let found = false;
      for (let i = 0; i < oldIds.length; i++) {
        if (allItemIds.includes(oldIds[i])) {
          //Remove obsolete previously grouped marker
          //state.mapRef.current.removeLayer(coll.marker);
          coll.marker?.remove();
          state.markersRef.current.delete(collId);
          break;
        }
      }
    }
  }

  for (let i = items.length - 1; i >= 0; i--) {
    if (state.markersRef.current.has(items[i].id)) {
      //Already in map, remove
      items.splice(i, 1);
    }
  }

  //Remove out-of-bounds markers
  for (let [mrkId, item] of state.markersRef.current) {
    const mrkLatLng = item.marker.getLatLng();
    if (mrkLatLng.lat < area[1] || mrkLatLng.lat > area[3] || mrkLatLng.lng < area[0] || mrkLatLng.lng > area[2]) {
      //Remove out-of-bounds marker
      //state.mapRef.current.removeLayer(item.marker);
      item.marker.remove();
      state.markersRef.current.delete(mrkId);
    }
  }
}

/***********************************************************************************/
/********************************** MARKER HTML ************************************/
/***********************************************************************************/

function makeCollectionMarkerHTML(count) {
  const markerSizeClass =
    count <= 4
      ? ''
      : count <= 9
      ? 'point-number-medium'
      : count <= 29
      ? 'point-number-big'
      : count <= 99
      ? 'point-number-bigger'
      : 'point-number-biggest';
  return `<div class="point-button point-number ${markerSizeClass}">${count}</div>`;
}

function makePositionMarkerHTML(state, item) {
  let iconClass = 'point-icon-profile';
  switch (state.mapCtx.filter.prod) {
    case 'trainingpass':
    case 'onlinetraining':
      iconClass = 'point-icon-train';
      break;
    //case 'grouptraining':
    case 'clipcard':
      iconClass = 'point-icon-clipcard';
      break;
    case 'trainprogram':
    case 'dietprogram':
      iconClass = 'point-icon-dietprogram';
      break;
  }

  let pricePart = `${item.price}kr`;
  const isShared = Array.isArray(item.sharedMarkerWith) && item.sharedMarkerWith.length > 0;
  if (isShared) {
    let miPr = item.price,
      mxPr = item.price;
    item.sharedMarkerWith.forEach((i) => {
      if (i.price < miPr) miPr = i.price;
      else if (i.price > mxPr) mxPr = i.price;
    });
    pricePart = `${miPr}kr - ${mxPr}kr`;
  }

  itemDistance(item, mapReference(state.mapCtx.center, state.mapCtx.reference));

  let classes = item.members ? 'point-button point-group' : 'point-button point-user';
  classes += ` ${iconClass}`;
  return `<div id="marker-${item.id}" class="mapmarker ${classes}" data-id="${item.id}" data-distance="${
    item.distance
  }"> <div class="markerthumb">
      <img src="${`https://traino.s3.eu-north-1.amazonaws.com/${item.user_id}/profile/profile-image.webp`}" alt="" />
  </div>
              ${item.members && !isShared ? 'fr ' : ''}
              <span>${pricePart}</span>
          </div>`;
}

/***********************************************************************************/
/******************************* HELPER FUNCTIONS **********************************/
/***********************************************************************************/

function getItemAreaFromMapArea(mapBounds, zoomLevel, isForMarkerArea = false) {
  if (mapBounds) {
    //const zoomLevel = theMap.getZoom();
    let extraLng = mapCnf.extraLongitude(zoomLevel);
    let extraLat = extraLng * Math.cos(mapBounds.getNorth() * (Math.PI / 180));
    if (isForMarkerArea) {
      extraLat /= 4;
      extraLng /= 4;
    }
    //console.log('Map extra', extraLat, extraLng);

    const itemArea = [
      mapBounds.getWest() - extraLng,
      mapBounds.getSouth() - extraLat,
      mapBounds.getEast() + extraLng,
      mapBounds.getNorth() + extraLat,
    ];

    return itemArea;
  }
  return [];
}

function getItemsInMarkers(state, includeShared = false) {
  const items = [];
  for (let [id, itemOrColl] of state.markersRef.current) {
    if (typeof id === 'number') items.push(itemOrColl);
    else if (typeof id === 'string' && !id.startsWith('cluster-') && itemOrColl.collection) {
      items.push(...itemOrColl.collection);
    }
  }

  if (includeShared) {
    const sharedMarkerItems = [];
    items.forEach((i) => {
      if (i.sharedMarkerWith) sharedMarkerItems.push(...i.sharedMarkerWith);
    });
    items.push(...sharedMarkerItems);
  }

  return items;
}

function getBoundsOfItems(items, extra) {
  let minLat = 10000;
  let minLng = 10000;
  let maxLat = -10000;
  let maxLng = -10000;
  items.forEach((i) => {
    if (i.latitude < minLat) minLat = i.latitude;
    if (i.latitude > maxLat) maxLat = i.latitude;
    if (i.longitude < minLng) minLng = i.longitude;
    if (i.longitude > maxLng) maxLng = i.longitude;
  });
  //console.log('Bounds  ', minLat, maxLat, minLng, maxLng);
  if (extra) {
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    if (extra.north) maxLat += latDiff * extra.north;
    if (extra.south) minLat -= latDiff * extra.south;
    if (extra.east) maxLng += lngDiff * extra.east;
    if (extra.west) minLng -= lngDiff * extra.west;
    //console.log('Bounds +', minLat, maxLat, minLng, maxLng);
  }
  return L.latLngBounds(L.latLng(minLat, minLng), L.latLng(maxLat, maxLng));
}

function getCollectionId(coll) {
  return !coll || coll.length === 0
    ? ''
    : coll
        .map((m) => m.id)
        .sort((id1, id2) => id1 - id2)
        .reduce((bigId, id) => (bigId += '|' + id));
}

function getCollectionCoordinates(coll) {
  if (!coll || coll.length === 0) return [0, 0];
  const coordSums = [0, 0];
  coll.forEach((m) => {
    coordSums[0] += m.latitude;
    coordSums[1] += m.longitude;
  });
  return [coordSums[0] / coll.length, coordSums[1] / coll.length];
}

function postFetchItemManipulation(items) {
  Array.isArray(items) &&
    items.forEach((i) => {
      i.latitude = Number(i.latitude);
      i.longitude = Number(i.longitude);
      if (typeof i.product_id !== 'undefined') i.id = i.product_id;
    });
}

function removeItems(items, toRemoveIds) {
  for (let i = items.length - 1; i >= 0; i--) {
    if (toRemoveIds.includes(items[i].id)) {
      items.splice(i, 1);
    }
  }
}

function prepareGrouping(items) {
  items.forEach((i) => {
    i.xy = [i.longitude, i.latitude / Math.cos(i.latitude * (Math.PI / 180))];
    if (i.sharedMarkerWith) i.sharedMarkerWith = null;
  });
}

function isInArea(point, area) {
  return area[0] <= point[0] && point[0] <= area[2] && area[1] <= point[1] && point[1] <= area[3];
}

export function itemDistance(item, reference) {
  if (!item || !reference || item.latitude == null || item.longitude == null) {
    return Infinity; // eller -1 om du föredrar det som felvärde
  }

  if (reference !== item.reference) {
    item.reference = reference;
    item.distance = reference.distanceTo(L.latLng(item.latitude, item.longitude)) / 1000;
  }

  return item.distance;
}

export function mapReference(center, location) {
  if (location) return location;
  return center;
}

/***********************************************************************************/
/******************************* END of FILE ***************************************/
/***********************************************************************************/
