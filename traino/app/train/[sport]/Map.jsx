// app/train/sport/Map.jsx
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { playSound } from '@/app/components/PlaySound';
import { setCookie, getCookie } from '@/app/functions/functions';
import { getProductsBounds } from '@/app/functions/fetchDataFunctions';
import { useAppState } from '@/app/hooks/useAppState';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvent } from 'react-leaflet';
import AlertModal from '@/app/components/AlertModal';
import { getBaseTileConfig } from '@/app/config/mapCnf';

import L from 'leaflet';
import Supercluster from 'supercluster';

// Add debounce utility function
function useDebounce(func, delay) {
  const timeoutRef = useRef(null);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay],
  );
}

export default function Map({
  mapCtx,
  filter,
  isLoading,
  setIsLoading,
  filteredMarkers,
  setFilteredMarkers,
  handleMarkerClick,
  showList,
  setMapInstance,
  userCenter,
  userZoom,
  tileConfig,
  styleKey: deprecatedStyleKey,
}) {
  const { DEBUG, openModal, useTranslations, language } = useAppState();
  const [allMarkers, setAllMarkers] = useState([]); // Stores all fetched markers
  const [clusters, setClusters] = useState([]);
  const [supercluster, setSupercluster] = useState(null);
  const [centerMarkerPosition, setCenterMarkerPosition] = useState(null);
  const [showDistances, setShowDistances] = useState(false);
  const [distanceLine, setDistanceLine] = useState(null); // For drawing lines to products
  const mapRef = useRef(null);
  const { translate } = useTranslations('global', language);

  // Add refs to track last operation timestamps to prevent rapid-fire operations
  const lastFetchTime = useRef(0);
  const lastFilterTime = useRef(0);
  const isCurrentlyFetching = useRef(false);

  // Function to create the Supercluster instance
  useEffect(() => {
    setSupercluster(
      new Supercluster({
        radius: 70, // Distance between clusters
        maxZoom: 15, // Max zoom level for clustering
      }),
    );
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 300);
    }
  }, [showList]);

  // Initialize center marker position when userCenter changes
  useEffect(() => {
    if (userCenter && !centerMarkerPosition) {
      setCenterMarkerPosition(userCenter);
      // Store in mapCtx for DetailPopup access
      mapCtx.centerMarkerPosition = userCenter;
      // Also store in cookie for persistence
      setCookie('centerMarkerPosition', JSON.stringify(userCenter));
    }
    loadInGeoLocation();
  }, [userCenter]);

  // Calculate distances when center marker position or filtered markers change
  useEffect(() => {
    if (centerMarkerPosition && filteredMarkers.length > 0) {
      calculateDistancesToMarkers();
    }
  }, [centerMarkerPosition, filteredMarkers]);

  function loadInGeoLocation() {
    if (mapRef.current && userCenter) {
      mapRef.current.setView(userCenter, userZoom);
    }
  }

  // Function to calculate distance between two points using Haversine formula
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  // Function to calculate distances to all filtered markers
  function calculateDistancesToMarkers() {
    if (!centerMarkerPosition) return;

    const markersWithDistance = filteredMarkers.map((marker) => {
      const distance = calculateDistance(
        centerMarkerPosition[0],
        centerMarkerPosition[1],
        parseFloat(marker.latitude),
        parseFloat(marker.longitude),
      );
      return {
        ...marker,
        distanceFromCenter: distance,
      };
    });

    // Sort by distance
    markersWithDistance.sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);

    DEBUG && console.log('Markers with distances:', markersWithDistance.slice(0, 5));
    return markersWithDistance;
  }

  // Get closest markers for display
  function getClosestMarkers() {
    if (!centerMarkerPosition || !filteredMarkers.length) return [];

    const markersWithDistance = calculateDistancesToMarkers();
    return markersWithDistance ? markersWithDistance.slice(0, 5) : []; // Show top 5 closest
  }

  // Function to handle center marker drag
  function handleCenterMarkerDrag(event) {
    const newPosition = [event.target.getLatLng().lat, event.target.getLatLng().lng];
    setCenterMarkerPosition(newPosition);
    // Store in mapCtx for DetailPopup access
    mapCtx.centerMarkerPosition = newPosition;
    // Also store in cookie for persistence
    setCookie('centerMarkerPosition', JSON.stringify(newPosition));

    // Clear distance line when center marker is moved
    setDistanceLine(null);

    DEBUG && console.log('Center marker moved to:', newPosition);
  }

  // Function to toggle distance display
  function toggleDistanceDisplay() {
    const newState = !showDistances;
    setShowDistances(newState);

    // Clear distance line when disabling distance mode
    if (!newState) {
      setDistanceLine(null);
    }

    playSound('tickclick', '0.5');
  }

  // Function to recenter marker to user's current location
  function recenterToUserLocation() {
    playSound('tickclick', '0.5');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = [position.coords.latitude, position.coords.longitude];
          setCenterMarkerPosition(newPosition);
          // Store in mapCtx for DetailPopup access
          mapCtx.centerMarkerPosition = newPosition;
          // Also store in cookie for persistence
          setCookie('centerMarkerPosition', JSON.stringify(newPosition));

          // Clear distance line when center marker is moved
          setDistanceLine(null);

          if (mapRef.current) {
            mapRef.current.setView(newPosition, 15);
          }
          DEBUG && console.log('Center marker recentered to user location:', newPosition);
        },
        (error) => {
          console.error("Error getting user's location:", error);

          // Set user-friendly error message based on error code
          let errorMessage = 'Could not get your location. ';
          if (error.code === 1) {
            errorMessage += 'Please enable location permissions in your browser settings and try again.';
          } else if (error.code === 2) {
            errorMessage += 'Location information is unavailable.';
          } else if (error.code === 3) {
            errorMessage += 'Location request timed out.';
          } else {
            errorMessage += 'Please try again.';
          }

          openModal(errorMessage);
        },
      );
    } else {
      console.error('Geolocation is not supported by your browser');
      openModal(
        'Geolocation is not supported by your browser. Please use a modern browser that supports location services.',
      );
    }
  }

  // Function to draw line to product
  function drawLineToProduct(productLat, productLng) {
    if (!centerMarkerPosition) return;

    const lineCoordinates = [centerMarkerPosition, [parseFloat(productLat), parseFloat(productLng)]];

    setDistanceLine(lineCoordinates);

    // Line stays permanent - no timeout removal
  }

  // Enhanced marker click handler
  const enhancedHandleMarkerClick = (event, markerData) => {
    // Draw line if distance mode is enabled
    if (showDistances && centerMarkerPosition) {
      drawLineToProduct(markerData.latitude, markerData.longitude);
    }

    // Call original handler
    handleMarkerClick(event, markerData);
  };

  const MapEvents = useCallback(() => {
    const map = useMap();

    useMapEvent('moveend', async () => {
      if (!supercluster || typeof supercluster.getClusters !== 'function') {
        DEBUG && console.warn('Supercluster not ready or getClusters is not a function');
        return;
      }

      const bounds = map.getBounds();
      const zoom = map.getZoom();

      try {
        const clusters = supercluster.getClusters(
          [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
          zoom,
        );
        setClusters(clusters);
      } catch (err) {
        console.error('Error while getting clusters:', err);
      }
    });

    return null;
  }, [supercluster]); // Memoize MapEvents

  const CELL_SIZE = 0.5;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const worldGrid = useRef({}); // Use a ref to persist the grid across renders
  const listState = useRef({}); // Use a ref to persist the listState across renders
  const totalCellsFetched = useRef({}); // Track all fetched cells with timestamp

  // MARK: handleMapCreated
  const handleMapCreated = (mapInstance) => {
    setMapInstance(mapInstance);
    mapRef.current = mapInstance;
  };

  // MARK: fetchMarkers - Optimized with performance checks
  const fetchMarkers = useCallback(async () => {
    // Prevent concurrent fetching and rate limiting
    const now = Date.now();
    if (isCurrentlyFetching.current || now - lastFetchTime.current < 500) {
      DEBUG && console.log('Skipping fetch - too soon or already fetching');
      return;
    }

    lastFetchTime.current = now;
    isCurrentlyFetching.current = true;

    function compressSequentialIds(ids) {
      if (!Array.isArray(ids) || ids.length === 0) return ids;

      ids.sort((a, b) => a - b); // Ensure the IDs are sorted
      const compressed = [];
      let start = ids[0];
      let prev = ids[0];
      let count = 1; // Track how many consecutive numbers we have

      for (let i = 1; i <= ids.length; i++) {
        if (ids[i] === prev + 1) {
          prev = ids[i];
          count++;
        } else {
          // Only compress if there are at least 3 consecutive numbers
          if (count >= 3) {
            compressed.push(`${start}-${prev}`);
          } else {
            // Add individual numbers if less than 3 consecutive
            for (let j = start; j <= prev; j++) {
              compressed.push(j);
            }
          }
          // Reset for the next potential sequence
          start = ids[i];
          prev = ids[i];
          count = 1;
        }
      }

      // Handle the last sequence
      if (count >= 3) {
        compressed.push(`${start}-${prev}`);
      } else {
        for (let j = start; j <= prev; j++) {
          compressed.push(j);
        }
      }

      return compressed;
    }

    // Example usage
    const ids = allMarkers.map((marker) => marker.id);
    const excludeIds = compressSequentialIds(ids);
    DEBUG && console.log('Compressed IDs:', excludeIds);

    function getCellsInBounds(grid, bounds, cellSize = CELL_SIZE) {
      const { lngMin, lngMax, latMin, latMax } = bounds;

      const xStart = Math.floor(lngMin / cellSize);
      const xEnd = Math.floor(lngMax / cellSize);
      const yStart = Math.floor(latMin / cellSize);
      const yEnd = Math.floor(latMax / cellSize);

      const cellsToFetch = [];
      const currentTime = Date.now();

      for (let x = xStart; x <= xEnd; x++) {
        for (let y = yStart; y <= yEnd; y++) {
          const cellKey = `x${x}y${y}`;

          const lastFetched = totalCellsFetched.current[cellKey];
          const isExpired = !lastFetched || currentTime - lastFetched > CACHE_DURATION;

          if (!lastFetched) {
            DEBUG && console.log(`Cell ${cellKey} has never been fetched`);
          } else if (isExpired) {
            DEBUG && console.log(`Cell ${cellKey} expired: ${(currentTime - lastFetched) / 1000}s old`);
          }

          if (isExpired) {
            const lngMin = x * cellSize;
            const lngMax = (x + 1) * cellSize;
            const latMin = y * cellSize;
            const latMax = (y + 1) * cellSize;

            cellsToFetch.push({
              bounds: { lngMin, lngMax, latMin, latMax },
              cellKey,
              lastFetched,
            });
          }
        }
      }

      DEBUG && console.log('Total cells checked:', (xEnd - xStart + 1) * (yEnd - yStart + 1));
      DEBUG &&
        console.log(
          'Cells to fetch:',
          cellsToFetch.map((c) => ({
            key: c.cellKey,
            lastFetched: c.lastFetched,
            bounds: c.bounds,
          })),
        );

      return cellsToFetch;
    }

    async function fetchMarkersForBounds(category, boundsArray, excludeIds, page, limit) {
      const flatBounds = boundsArray.map((b) => b.bounds); // flatten here

      const requestData = {
        bounds: flatBounds,
        excludeIds: excludeIds,
        page,
        limit,
      };

      try {
        // Simulated fetch; replace with actual API call
        DEBUG && console.log('Req Data:', requestData);
        const data = await getProductsBounds(category, requestData, page, limit); // Await the result from getProductsBounds

        DEBUG && console.log('Fetched data:', data); // Log the fetched data

        // Return the data wrapped in the expected format
        return { data };
      } catch (error) {
        console.error('Error fetching markers for bounds:', error);
        return { data: [] }; // Return empty data in case of an error
      } finally {
        setIsLoading(false); // Ensure loading state is reset
      }
    }

    const currentBounds = mapRef.current?.getBounds();
    if (!currentBounds) return;

    const bounds = {
      lngMin: currentBounds.getWest(),
      lngMax: currentBounds.getEast(),
      latMin: currentBounds.getSouth(),
      latMax: currentBounds.getNorth(),
    };

    const cellsToFetch = getCellsInBounds(worldGrid.current, bounds);

    if (cellsToFetch.length === 0) {
      DEBUG && console.log('No new cells to fetch');
      setIsLoading(false);
      return;
    }

    const newTimestamp = Date.now();

    for (const cell of cellsToFetch) {
      // Initialize cell metadata if needed
      if (!worldGrid.current[cell.cellKey]) {
        worldGrid.current[cell.cellKey] = {};
      }

      // Update worldGrid and totalCellsFetched
      worldGrid.current[cell.cellKey].lastFetched = newTimestamp;
      worldGrid.current[cell.cellKey].fetchCount = (worldGrid.current[cell.cellKey].fetchCount || 0) + 1;
      totalCellsFetched.current[cell.cellKey] = newTimestamp;

      DEBUG && console.log(`Updated cell ${cell.cellKey}:`, worldGrid.current[cell.cellKey]);
    }

    setIsLoading(true);

    let limit = 1000;
    let page = 1;
    let totalPages = 1;
    let fetchedMarkers = [];

    const category = filter.cat;
    DEBUG && console.log('CategoryId:', category);
    // Initial fetch to determine totalPages
    try {
      const { data } = await fetchMarkersForBounds(category, cellsToFetch, excludeIds, page, limit);
      fetchedMarkers = data.results;
      totalPages = data.totalPages;
    } catch (err) {
      console.error('Error fetching markers:', err.message || err);
      // Optional: show toast or fallback UI
    }
    DEBUG && console.log('Total Pages:', totalPages);

    // Update the markers and supercluster with the first page
    updateMarkersAndCluster(fetchedMarkers);

    // Fetch the rest of the pages with a 100ms delay between each fetch
    for (page = 2; page <= totalPages; page++) {
      DEBUG && console.log('Page:', page, ' of ', totalPages);

      try {
        // Wait for 100ms before fetching the next page
        await new Promise((resolve) => setTimeout(resolve, 100));

        const fetchResult = await fetchMarkersForBounds(category, cellsToFetch, excludeIds, page, limit);
        const {
          data: { results: fetchedMarkers },
        } = fetchResult;

        DEBUG && console.log(`Fetched markers for page ${page}:`, fetchedMarkers);

        // Update markers and supercluster progressively
        updateMarkersAndCluster(fetchedMarkers);
      } catch (error) {
        // Log the error and continue to the next page
        console.error(`Error fetching page ${page}:`, error);
      }
    }

    setIsLoading(false);
    isCurrentlyFetching.current = false;
  }, [filter.cat, allMarkers, supercluster]); // Add dependencies

  // MARK: updateMarkersAndCluster
  const updateMarkersAndCluster = (fetchedMarkers) => {
    if (!fetchedMarkers || fetchedMarkers.length === 0) return;
    // Remove duplicates based on .id
    const uniqueFetchedMarkers = Array.isArray(fetchedMarkers)
      ? fetchedMarkers.filter(
          (newMarker, index, self) => index === self.findIndex((marker) => marker.id === newMarker.id),
        )
      : [];

    // Deduplicate markers against allMarkers
    const uniqueMarkers = Array.isArray(uniqueFetchedMarkers)
      ? uniqueFetchedMarkers.filter(
          (newMarker) =>
            !allMarkers.some(
              (existingMarker) =>
                existingMarker.id === newMarker.id &&
                existingMarker.lat === newMarker.lat &&
                existingMarker.lng === newMarker.lng &&
                existingMarker.product_type === newMarker.product_type &&
                existingMarker.price === newMarker.price,
            ),
        )
      : [];

    // Update allMarkers state
    setAllMarkers((prev) => [...prev, ...uniqueMarkers]);

    // Save allMarkers to a cookie based on filter.cat
    if (filter.cat) {
      const cookieName = `allmarkers-${filter.cat}`;
      setCookie(cookieName, JSON.stringify(allMarkers));
      DEBUG && console.log(`Saved ${cookieName} cookie with ${allMarkers.length} markers`);

      const timestampCookieName = `allmarkers-lastfetch-${filter.cat}`;
      setCookie(timestampCookieName, new Date().toISOString());
      DEBUG && console.log(`Saved ${timestampCookieName} cookie with timestamp`);
    }

    // Load markers into Supercluster
    supercluster.load(
      allMarkers.map((marker) => ({
        type: 'Feature',
        properties: { cluster: false, ...marker },
        geometry: { type: 'Point', coordinates: [marker.lng, marker.lat] },
      })),
    );

    // Update clusters
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const zoom = mapRef.current.getZoom();
      setClusters(
        supercluster.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom),
      );
    }
  };

  // MARK: Fetch markers
  useEffect(() => {
    if (!supercluster) return;
    // Load allMarkers from a cookie based on filter.cat
    if (filter.cat) {
      const timestampCookieName = `allmarkers-lastfetch-${filter.cat}`;
      const lastFetchTimestamp = getCookie(timestampCookieName);

      if (lastFetchTimestamp) {
        const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
        const lastFetchDate = new Date(lastFetchTimestamp);
        const currentDate = new Date();

        if (currentDate - lastFetchDate > oneDayInMilliseconds) {
          DEBUG && console.log(`Last fetch for ${filter.cat} is older than one day. Clearing saved markers.`);
          const cookieName = `allmarkers-${filter.cat}`;
          setCookie(cookieName, JSON.stringify([]));
          setAllMarkers([]);
        } else {
          const cookieName = `allmarkers-${filter.cat}`;
          const savedMarkers = getCookie(cookieName);
          if (savedMarkers) {
            try {
              const parsedMarkers = JSON.parse(savedMarkers);
              setAllMarkers(parsedMarkers);
              DEBUG && console.log(`Loaded ${cookieName} cookie with ${parsedMarkers.length} markers`);
            } catch (error) {
              console.error(`Error parsing cookie ${cookieName}:`, error);
            }
          }
        }
      }
    }
    // Fetch markers when the map is created or supercluster is initialized
    fetchMarkers();
  }, [supercluster]);

  // MARK: filteringMarkers - Optimized with rate limiting
  const filteringMarkers = useCallback(
    (allMarkers) => {
      // Rate limit filtering operations
      const now = Date.now();
      if (now - lastFilterTime.current < 100) {
        DEBUG && console.log('Skipping filter - too soon');
        return;
      }
      lastFilterTime.current = now;

      if (!allMarkers.length) return;

      // Filter only markers within the current bounds
      const bounds = mapRef.current?.getBounds();
      const markersWithinBounds = bounds
        ? allMarkers.filter((marker) => {
            const lat = parseFloat(marker.latitude);
            const lng = parseFloat(marker.longitude);

            return (
              !isNaN(lat) &&
              !isNaN(lng) && // Check if the conversion was successful
              lat >= bounds.getSouth() &&
              lat <= bounds.getNorth() &&
              lng >= bounds.getWest() &&
              lng <= bounds.getEast()
            );
          })
        : allMarkers;

      DEBUG && console.log('Filtered Markers within bounds:', markersWithinBounds);

      // Now apply the other filters
      let filtered = markersWithinBounds;

      if (filter.prod === 'trainingpass' || filter.prod === 'onlinetraining') {
        // Filter by both `prod` and `dura` when applicable
        const filterValue = Number(filter.dura);
        const highestFilterValue = 60;
        const overHighestFilterValue  = 70;
        DEBUG && console.log('Filter Value:', filterValue);
        filtered = filterValue
          ? markersWithinBounds.filter(
              (marker) => Number(marker.duration > highestFilterValue ? overHighestFilterValue : marker.duration) === filterValue && marker.product_type === filter.prod,
            )
          : markersWithinBounds.filter((marker) => marker.product_type === filter.prod);
      } else {
        // Filter only by `prod`
        const filterValue = filter.prod;
        DEBUG && console.log('Filter Value:', filterValue);
        filtered = filterValue
          ? markersWithinBounds.filter((marker) => marker.product_type === filterValue)
          : markersWithinBounds;
      }

      DEBUG && console.log('Filtered Markers:', filtered);
      if (filter.gen !== '') {
        filtered = filtered.filter((marker) => marker.gender === filter.gen);
      }

      if (filter.prmin !== undefined && filter.prmax !== undefined) {
        filtered = filtered.filter((marker) => marker.price >= filter.prmin && marker.price <= filter.prmax);
      }

      DEBUG && console.log('Filtered Markers with gender and price:', filtered);

      // Remove duplicates based on .id
      const uniqueFilteredMarkers = filtered.filter(
        (marker, index, self) => index === self.findIndex((m) => m.id === marker.id),
      );

      DEBUG && console.log('Filtered Markers with unique IDs:', uniqueFilteredMarkers);

      // Force update by creating a new reference
      setFilteredMarkers([...uniqueFilteredMarkers]);
    },
    [filter.dura, filter.prod, filter.gen, filter.prmin, filter.prmax],
  ); // Add dependencies

  // MARK: Filter Markers
  useEffect(() => {
    filteringMarkers(allMarkers); // Filter markers when filter changes
  }, [filter.dura, filter.prod, filter.gen, filter.prmin, filter.prmax, allMarkers]);

  // MARK: Update markers in Supercluster when filtering changes
  useEffect(() => {
    if (!supercluster) return;

    // If there are no filtered markers, clear the supercluster and set clusters to an empty array
    if (filteredMarkers.length === 0) {
      supercluster.load([]);
      setClusters([]);
      return;
    }

    supercluster.load(
      filteredMarkers.map((marker) => ({
        type: 'Feature',
        properties: { cluster: false, ...marker },
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(marker.longitude), parseFloat(marker.latitude)], // Ensure these are floats
        },
      })),
    );

    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      const zoom = mapRef.current.getZoom();
      setClusters(
        supercluster.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom),
      );
    }
  }, [filteredMarkers, supercluster]); // Updates clusters when filtering changes

  // Create debounced versions of heavy operations
  const debouncedFetchMarkers = useDebounce(fetchMarkers, 300);
  const debouncedFilteringMarkers = useDebounce(filteringMarkers, 150);

  // MARK: When map moves or zooms - Optimized with debouncing
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const handleMapChange = () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();

      // Update context immediately for UI responsiveness
      mapCtx.setMapBounds(bounds);
      mapCtx.mapBounds = bounds;
      mapCtx.zoom = zoom;
      mapCtx.setZoom(zoom);

      // Update clusters immediately for visual feedback
      if (supercluster) {
        setClusters(
          supercluster.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom),
        );
      }

      // Debounce expensive operations
      debouncedFetchMarkers();
      debouncedFilteringMarkers(allMarkers);
    };

    map.on('moveend', handleMapChange);
    map.on('zoomend', handleMapChange);

    return () => {
      map.off('moveend', handleMapChange);
      map.off('zoomend', handleMapChange);
    };
  }, [supercluster, allMarkers, debouncedFetchMarkers, debouncedFilteringMarkers]);

  useEffect(() => {
    if (!mapCtx.mapBounds) return;

    const map = mapRef.current;

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const boundsData = {
      lngMin: bounds.getWest(),
      lngMax: bounds.getEast(),
      latMin: bounds.getSouth(),
      latMax: bounds.getNorth(),
      zoom,
    };

    const cookieName = 'mapBounds';
    setCookie(cookieName, JSON.stringify(boundsData));
    DEBUG && console.log(`Saved ${cookieName} cookie with data:`, boundsData);
  }, [mapCtx.mapBounds]);

  // Resolve tile provider configuration
  const resolvedStyleKey = deprecatedStyleKey || tileConfig?.styleKey || 'alidade_smooth';
  const baseTile = useMemo(() => {
    if (tileConfig?.url && tileConfig.styleKey === resolvedStyleKey) {
      return tileConfig;
    }
    return getBaseTileConfig(resolvedStyleKey);
  }, [tileConfig, resolvedStyleKey]);
  const tileLayerKey = `${baseTile.provider || 'custom'}-${resolvedStyleKey}-${baseTile.url || ''}`;


  // MARK: getIconClass
  const getIconClass = (product) => {
    switch (product) {
      case 'trainingpass':
      case 'onlinetraining':
        return 'point-icon-train';
      case 'dietprogram':
      case 'trainprogram':
        return 'point-icon-dietprogram';
      default:
        return 'point-icon-default';
    }
  };

  // MARK: HandleSameLocationClick
  const handleSameLocationClick = (markers) => {
    console.log('Markers at the same location:', markers);
    // Example: Zoom in slightly more
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setView(markers[0].geometry.coordinates.reverse(), currentZoom + 1);
    }
  };

  // MARK: CreateCustomIcon - Memoized for performance
  const createCustomIcon = useCallback(
    (marker) => {
      const distanceText =
        showDistances && marker.distanceFromCenter ? ` (${marker.distanceFromCenter.toFixed(1)}km)` : '';

      return L.divIcon({
        className: `markerid-${marker.id} mapmarker point-button point-user ${getIconClass(marker.product_type)}`,
        html: `<div class="markerthumb"><img src="${
          marker.thumbnail === 1
            ? `https://traino.s3.eu-north-1.amazonaws.com/${marker.user_id}/profile/profile-image.webp`
            : '/assets/icon-profile.svg'
        }" alt="" class="marker-thumbnail" /></div><span>${
          marker.price
        }kr<span class="distancetext">${distanceText}</span></span>`,
        iconAnchor: [5, 5],
      });
    },
    [showDistances],
  ); // Depend on showDistances for distance text

  // MARK: CreateCenterIcon - Memoized for performance
  const centerIcon = useMemo(
    () =>
      L.divIcon({
        className: 'center-marker',
        html: `<div class="center-icon" title="Drag to measure distances">
        <div class="center-icon-inner"></div>
        <div class="center-icon-pulse"></div>
      </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    [],
  ); // No dependencies, icon is static

  // MARK: HandleMouseOver
  const handleMouseOver = (e) => {
    playSound('tickclick', '0.5');
    const marker = e.target;
    // DEBUG && console.log(marker.options.icon.options.className);
    const markerId = Array.from(marker.options.icon.options.className.split(' '))
      .find((cls) => cls.startsWith('markerid-'))
      ?.split('-')[1];
    // DEBUG && console.log('Marker ID:', markerId);

    const listElements = document.querySelectorAll('[id^="listid-"].liston');
    listElements.forEach((element) => {
      element.classList.remove('liston');
    });

    const listElement = document.querySelector(`#listid-${markerId}`);
    if (listElement) {
      listElement.classList.add('liston');
    }
  };

  // MARK: HandleMouseOut
  const handleMouseOut = (e) => {
    const marker = e.target;
    const markerId = Array.from(marker.options.icon.options.className.split(' '))
      .find((cls) => cls.startsWith('markerid-'))
      ?.split('-')[1];
    // DEBUG && console.log('Marker ID:', markerId);

    const listElements = document.querySelectorAll('[id^="listid-"].liston');
    listElements.forEach((element) => {
      element.classList.remove('liston');
    });
  };

  // Function to slightly offset overlapping markers in a circular pattern - Optimized
  const spiderfyMarkers = useCallback((clusters) => {
    const grouped = {};

    // Group by rounded coordinates
    for (const cluster of clusters) {
      const [lng, lat] = cluster.geometry.coordinates.map(parseFloat);
      const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(cluster);
    }

    // Apply offsets
    const spiderfied = [];

    for (const key in grouped) {
      const group = grouped[key];

      if (group.length === 1) {
        spiderfied.push(group[0]);
      } else {
        const angleStep = (2 * Math.PI) / group.length;
        const radius = 0.00065; // Adjust for more/less separation

        group.forEach((cluster, i) => {
          const angle = i * angleStep;
          const offsetLat = parseFloat(cluster.geometry.coordinates[1]) + radius * Math.sin(angle);
          const offsetLng = parseFloat(cluster.geometry.coordinates[0]) + radius * Math.cos(angle);

          spiderfied.push({
            ...cluster,
            geometry: {
              ...cluster.geometry,
              coordinates: [offsetLng, offsetLat],
            },
          });
        });
      }
    }

    return spiderfied;
  }, []); // No dependencies needed

  // MARK: Markup
  return (
    <>
      <AlertModal />
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 7rem)' }}>
        {/* Distance Controls - Bottom Right */}
        <div className="distance-controls">
          {/* Distance Toggle Button */}
          <button
            className={`distance-control-btn ${showDistances ? 'active' : ''}`}
            onClick={toggleDistanceDisplay}
            title={showDistances ? 'Hide distance measurement' : 'Show distance measurement'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </button>

          {/* Recenter Button */}
          {showDistances && (
            <button
              className="distance-control-btn recenter-btn"
              onClick={recenterToUserLocation}
              title="Recenter to current location"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
              </svg>
            </button>
          )}
        </div>

        {/* Distance Panel - Mobile Friendly */}
        {showDistances && centerMarkerPosition && (
          <div className="distance-panel-mobile">
            <div className="distance-panel-header">
              <h4>Closest Products</h4>
              <button className="close-panel-btn" onClick={() => setShowDistances(false)}>
                ×
              </button>
            </div>
            {getClosestMarkers().length > 0 ? (
              <ul className="distance-list">
                {getClosestMarkers().map((marker, index) => (
                  <li
                    key={marker.id}
                    className="distance-item"
                    onClick={() => {
                      if (mapRef.current) {
                        mapRef.current.setView([parseFloat(marker.latitude), parseFloat(marker.longitude)], 16);
                        drawLineToProduct(marker.latitude, marker.longitude);
                      }
                    }}
                  >
                    <div className="distance-value">{marker.distanceFromCenter.toFixed(1)}km</div>
                    <div className="distance-details">
                      {translate(marker.product_type, language)} - {marker.price}kr
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-products">No products found in current view</div>
            )}
          </div>
        )}

        <MapContainer
          center={userCenter || [59.32, 18.07]}
          zoom={userZoom || 14}
          style={{ width: '100%', height: '100%' }}
          whenCreated={handleMapCreated}
          maxBounds={[[ -85, -180 ], [ 85, 180 ]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            key={tileLayerKey}
            url={baseTile.url}
            attribution={baseTile.attribution}
            maxZoom={baseTile.maxZoom}
            maxNativeZoom={baseTile.maxNativeZoom}
            detectRetina={baseTile.detectRetina}
          />
          <MapEvents />

          {/* Center Marker for Distance Measurement */}
          {centerMarkerPosition && (
            <Marker
              position={centerMarkerPosition}
              icon={centerIcon}
              draggable={true}
              eventHandlers={{
                dragend: handleCenterMarkerDrag,
              }}
            />
          )}

          {/* Distance Line */}
          {distanceLine && <Polyline positions={distanceLine} color="red" weight={3} opacity={0.8} dashArray="5, 10" />}

          {clusters &&
            clusters.length > 0 &&
            spiderfyMarkers(clusters)
              .slice(0, 1000) // Limit to 1000 markers to prevent performance issues when zoomed out
              .map((cluster, index) => {
                const [longitude, latitude] = cluster.geometry.coordinates;
                const { cluster: isCluster, point_count } = cluster.properties;

                // Convert to numbers if they are strings
                const lng = parseFloat(longitude);
                const lat = parseFloat(latitude);

                // Ensure the conversion is valid
                if (isNaN(lng) || isNaN(lat)) {
                  console.error('Invalid coordinates:', longitude, latitude);
                } else {
                  DEBUG && console.log('Longitude:', lng, 'Latitude:', lat);
                }

                if (isCluster) {
                  let clusterMarkers = [];

                  try {
                    if (supercluster && cluster.id) {
                      clusterMarkers = supercluster.getLeaves(cluster.id, Infinity);
                    }
                  } catch (error) {
                    console.error('Error fetching cluster leaves:', error);
                  }

                  const roundedLocations = new Set(
                    clusterMarkers.map(
                      (m) => `${m.geometry.coordinates[1].toFixed(6)},${m.geometry.coordinates[0].toFixed(6)}`,
                    ),
                  );

                  const zoom = mapRef.current.getZoom();
                  const isSameLocationCluster = roundedLocations.size === 1 && zoom >= 10;

                  return (
                    <Marker
                      key={`cluster-${index}`}
                      position={[lat, lng]}
                      icon={L.divIcon({
                        className: 'cluster-marker',
                        html: `<div class="cluster-icon ${isSameLocationCluster ? 'same-location-cluster' : ''}">
                          ${point_count}
                        </div>`,
                        iconSize: [30, 30],
                      })}
                      eventHandlers={{
                        click: () => {
                          if (isSameLocationCluster) {
                            handleSameLocationClick(clusterMarkers);
                          } else {
                            const newZoom = Math.min(zoom + 2, 16);
                            mapRef.current.setView([lat, lng], newZoom);
                          }
                        },
                      }}
                    />
                  );
                }

                // Calculate distance for this marker if center position exists
                const markerWithDistance = centerMarkerPosition
                  ? {
                      ...cluster.properties,
                      distanceFromCenter: calculateDistance(centerMarkerPosition[0], centerMarkerPosition[1], lat, lng),
                    }
                  : cluster.properties;

                return (
                  <Marker
                    key={`marker-${index}`}
                    position={[lat, lng]}
                    icon={createCustomIcon(markerWithDistance)}
                    eventHandlers={{
                      click: (event) => {
                        if (event.originalEvent?.stopPropagation) {
                          event.originalEvent.stopPropagation();
                        }
                        enhancedHandleMarkerClick(event, markerWithDistance);
                      },
                      mouseover: (e) => handleMouseOver(e),
                      mouseout: (e) => handleMouseOut(e),
                    }}
                  />
                );
              })}
        </MapContainer>
      </div>
    </>
  );
}
