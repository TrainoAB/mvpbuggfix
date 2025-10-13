'use client';
// app/train/sport/page.jsx
import React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/components/PlaySound';
import { walkTime, shortenText, getCategories } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { InformationModal } from '@/app/components/InformationModal';
import Link from 'next/link';
import DetailPopup from './DetailPopup';
import ListView from './ListView';
import Image from 'next/image';
import Map from './Map';
import List from './List';
import LocationInput from './LocationInput';
import MapStyleSwitcher from '@/app/components/MapStyleSwitcher';
import { getStadiaStyleKeysWithLabels } from '@/app/config/tileStyles';
import { getBaseTileConfig } from '@/app/config/mapCnf';
import Filter, { getDefaultFilter } from './Filter';
import Navigation from '../../components/Menus/Navigation';
import ItemRepository from './ItemRepository';
import Loader from '@/app/components/Loader';
import UserInfoModal from '@/app/components/UserInfoModal';
import AlertModal from '@/app/components/AlertModal';
import { getCookie, setCookie } from '@/app/functions/functions';
import { getProduct, getProductsMapCount } from '@/app/functions/fetchDataFunctions.js';

import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
// import './leaflet.css';
import './page.css';

export default function Category({ params }) {
  const {
    useTranslations,
    language,
    isLoggedin,
    userData,
    baseUrl,
    traincategories,
    setTraincategories,
    sessionObject,
    DEBUG,
    openModal,
  } = useAppState();
  const { translate } = useTranslations('train', language);

  DEBUG && console.log('Rendering Category component', params);

  // Decide map or list view
  const [showType, setShowType] = useState('map');
  const [showList, setShowList] = useState(() => {
    if (window.innerWidth < 800) return false;
    const saved = getCookie('showList');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [userCenter, setUserCenter] = useState(null);
  const [userZoom, setUserZoom] = useState(14); // To store zoom level
  // Decide map or list class on button
  const [btnClass, setBtnClass] = useState('btn-list');
  // Decide the info to show inside the showinfo box
  const [popupItem, setPopupItem] = useState(null);
  // Show filter
  const [showFilter, setShowFilter] = useState(false);
  //const [categoryHeader, setCategoryHeader] = useState('');
  const [category, setCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkersLoading, setMarkersIsLoading] = useState(false); // Loading state for markers
  const [mapProductsCount, setMapProductsCount] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [filteredMarkers, setFilteredMarkers] = useState([]); // Stores filtered markers
  const [styleKey, setStyleKey] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('traino:mapStyle') || 'alidade_smooth';
      } catch (_) {}
    }
    return 'alidade_smooth';
  });

  const router = useRouter();

  const itemRepoRef = useRef(null);

  // Map context (not React Context)
  const mapCtxRef = useRef(null);

  useEffect(() => {
    if (showList) {
      setShowType('list');
      setBtnClass('btn-map');
    } else {
      setShowType('map');
      setBtnClass('btn-list');
    }
  }, []);

  // Redirect if the user is logged in as a trainer
  useEffect(() => {
    if (isLoggedin.current && userData.current && userData.current.usertype === 'trainer') {
      router.push(`/trainer/@${userData.current.alias}`); // TODO: Later update to /stats
    }
  }, [isLoggedin.current, userData.current]);

  useEffect(() => {
    if (!sessionObject?.token && sessionObject.token === null) return; // Vänta tills token är satt

    const fetchData = async () => {
      try {
        setIsLoading(true); // Startar loading

        let trainCats = traincategories;

        // Hämta kategorier om de inte redan finns
        if (trainCats.length === 0) {
          trainCats = await getCategories(setTraincategories);
        }

        // Hämta kategori från URL (slug)
        const slugSegments = params?.sport?.split('/');
        const categoryName = slugSegments?.[slugSegments.length - 1];

        // Hitta rätt kategori
        const category = trainCats.find((c) => c.category_link === categoryName);

        if (!category) {
          router.push('/train'); // Om ingen kategori hittas, gå tillbaka
          return;
        }

        setCategory(category);
        mapCtxRef.current.filter.cat = category.id;
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false); // Avslutar loading
      }
    };

    fetchData();
  }, [params?.sport]);

  useEffect(() => {
    if (!sessionObject?.token && sessionObject.token === null) return; // Vänta tills token är satt

    const fetchData2 = async () => {
      try {
        setIsLoading(true); // Startar loading

        // TODO: DENNA ÄR FEL, visar 0, när den ska vara tex 14?
        const categoryId = mapCtxRef.current.filter.cat;

        const mapProductCount = await getProductsMapCount(categoryId);

        DEBUG && console.log('Map product count:', mapProductCount);
        setMapProductsCount(mapProductCount);

        // Auto-select duration with items if current selection has zero items
        const currentProduct = mapCtxRef.current.filter.prod;
        const currentDuration = mapCtxRef.current.filter.dura;

        if (
          (currentProduct === 'trainingpass' || currentProduct === 'onlinetraining') &&
          mapProductCount &&
          mapProductCount[currentProduct] &&
          typeof mapProductCount[currentProduct] === 'object'
        ) {
          const productCounts = mapProductCount[currentProduct];
          const currentCount = productCounts[currentDuration] || 0;

          // If current duration has zero items, find first duration with items
          if (currentCount === 0) {
            const durationsWithItems = Object.entries(productCounts)
              .filter(([key, value]) => value > 0)
              .sort(([a], [b]) => {
                // Sort by duration: 15, 30, 60, 70 (Over 60)
                const order = { 15: 1, 30: 2, 60: 3, 70: 4 };
                return (order[a] || 999) - (order[b] || 999);
              });

            if (durationsWithItems.length > 0) {
              const newDuration = durationsWithItems[0][0];
              DEBUG &&
                console.log(
                  `Auto-selecting duration ${newDuration} (${durationsWithItems[0][1]} items) instead of ${currentDuration} (0 items)`,
                );
              updateFilterValue('dura', newDuration);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false); // Avslutar loading
      }
    };

    fetchData2();
  }, [params?.sport, sessionObject, sessionObject?.token]);

  useEffect(() => {
    if (!mapCtxRef.current.mapBounds) {
      const cookieName = 'mapBounds';
      const mapBoundsCookie = getCookie(cookieName);

      if (mapBoundsCookie) {
        const boundsData = JSON.parse(mapBoundsCookie);
        const { latMin, latMax, lngMin, lngMax, zoom } = boundsData;
        const center = [(latMin + latMax) / 2, (lngMin + lngMax) / 2];
        setUserCenter(center);
        setUserZoom(zoom);
        DEBUG && console.log(`Loaded ${cookieName} cookie with data:`, boundsData);
      } else if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newCenter = [position.coords.latitude, position.coords.longitude];
            setUserCenter(newCenter);
            setUserZoom(14);
            // Clear any previous geolocation error
            DEBUG && console.log('Using user geographic position:', newCenter);
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
        const stockholmCenter = [59.3293, 18.0686]; // Stockholm coordinates
        setUserCenter(stockholmCenter);
        setUserZoom(14);
        openModal(
          'Geolocation is not supported by your browser. Please use a modern browser that supports location services.',
        );
        DEBUG && console.log('Geolocation not supported, using Stockholm as default center:', stockholmCenter);
      }
    }
  }, []);

  // Toggle/set map or list view and button icons
  const handleToggleList = () => {
    const newState = !showList;
    setShowList(newState);
    setCookie('showList', JSON.stringify(newState));
    // Update related states if needed
    setShowType(newState ? 'list' : 'map');
    setBtnClass(newState ? 'btn-map' : 'btn-list');
    removeActiveItem();
  };

  const removeActiveItem = () => {
    // Remove active class on all point-buttons
    const allItems = document.querySelectorAll('.point-button');
    allItems.forEach((item) => {
      item.classList.remove('active');
    });
    setPopupItem(null);
  };

  // Map item buttons
  const handlePointClick = (event, item) => {
    setPopupItem((prevItem) => {
      // Compute the new state based on the previous state
      const newItem = prevItem && prevItem.id === item.id ? null : item;

      // Perform side effects after state update
      requestAnimationFrame(() => {
        const parent = document.querySelector('.markerid-' + item.id);
        if (parent) {
          parent.classList.toggle('active', newItem !== null);
        }
      });

      return newItem;
    });
  };

  // Any point-button click, group, user or number
  const handleMapClick = (event) => {
    event.stopPropagation();
    if (event.target.classList.contains('listitem')) {
      return;
    }

    setCookie('clicked_item', null);

    if (event.target.closest('.showinfo')) {
      // If clicked inside .showinfo, return without further execution
      return;
    }

    mapCtxRef.current.setStreetSuggestions && mapCtxRef.current.setStreetSuggestions([]);

    // Remove active class on all point-buttons and close popup
    if (!event.target.closest('#booking')) {
      removeActiveItem();
    }

    // Remove minimize and show class on showinfo box
    const element = document.querySelector('.showinfo');
    if (!element) {
      return;
    }
    element.classList.remove('minimize');
    element.classList.remove('show');
  };

  // MARK: handleOpenFilter
  const handleOpenFilter = () => {
    playSound('popclick', '0.5');
    setShowFilter(true);
  };

  // MARK: handleCloseFilter
  const handleCloseFilter = () => {
    itemRepoRef.current.setFilter(mapCtxRef.current.filter);
    DEBUG && console.log('Filter:', mapCtxRef.current.filter);
    setShowFilter(false);
  };

  const styleOptions = useMemo(() => getStadiaStyleKeysWithLabels(), []);
  const tileCfg = useMemo(() => getBaseTileConfig(styleKey), [styleKey]);
  const stadiaActive = tileCfg.provider === 'stadia';
  useEffect(() => {
    try {
      localStorage.setItem('traino:mapStyle', styleKey);
    } catch (_) {}
  }, [styleKey]);
  const handleStyleChange = (key) => {
    setStyleKey(key);
  };

  // MARK: handleUserPosition
  const handleUserPosition = () => {
    playSound('tickclick', '0.5');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = [position.coords.latitude, position.coords.longitude];
          DEBUG && console.log('User Coordinates:', newCenter);
          // Update the center state...
          setUserCenter(newCenter);
          // And update userZoom to 15 as soon as the button is clicked.
          setUserZoom(15);
          // Clear any previous geolocation error
          DEBUG && console.log('Map context:', mapCtxRef.current);
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
  };

  const productTranslations = {
    trainingpass: 'trainingpass',
    grouptraining: 'grouptraining',
    onlinetraining: 'onlinetraining',
    clipcard: 'clipcard',
    trainprogram: 'trainprogram',
    dietprogram: 'dietprogram',
    // Add more product types here
  };

  const getProductText = (selectedProduct) => {
    const translationKey = productTranslations[selectedProduct];
    return translationKey ? translate(translationKey, language) : selectedProduct;
  };

  //Init item repository
  if (!itemRepoRef.current) {
    itemRepoRef.current = new ItemRepository();
  }

  const [mapBounds, setMapBounds] = useState(null); // To store map bounds

  //MARK: mapCtcRef Init
  if (!mapCtxRef.current) {
    const ctx = {
      baseUrl,
      sessionObject,
      filter: getDefaultFilter(),
      itemRepo: itemRepoRef.current,
      showType,
      setCenter: setUserCenter,
      center: userCenter,
      setZoom: setUserZoom,
      zoom: userZoom,
      setMapBounds,
      mapBounds,
      setMapInstance,
      mapInstance,
      closeFilter: handleCloseFilter,
      handlePointClick,
      setPopupItem, //For resetting popup
      DEBUG,
    };
    itemRepoRef.current.setFilter(ctx.filter); //Init filter of item repo
    itemRepoRef.current.initCtx(ctx);

    mapCtxRef.current = ctx;
  }
  mapCtxRef.current.showType = showType;

  const filterCount = mapCtxRef.current.filter.nrOfFilters ? mapCtxRef.current.filter.nrOfFilters() : 0;

  // MARK: firstTime
  const firstTime = {
    header: translate('first_trainslug_title', language),
    text: translate('first_trainslug_text', language),
  };

  const handleBack = () => {
    router.push('/train');
  };

  // MARK: productFromCookie
  async function productFromCookie() {
    const itemId = getCookie('clicked_item');
    if (!itemId) {
      return;
    }
    if (itemId) {
      const item = await getProduct(itemId);

      const parent = document.getElementById('marker-' + item?.id);

      // Find the .showinfo element
      const showinfo = document.querySelector('.showinfo');
      // if (!showinfo) {
      //   return;
      // }
      showinfo?.classList.remove('minimize');

      // Remove "active" class from all items except the parent
      document.querySelectorAll('.point-button').forEach((btn) => {
        if (btn !== parent) {
          btn.classList.remove('active');
        }
      });

      showinfo?.classList.add('show');
      setPopupItem(item);
    }
  }
  useEffect(() => {
    productFromCookie();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState(null);

  useEffect(() => {
    DEBUG && console.log('isLoading', isLoading);
  }, [isLoading]);

  const [selectedDuration, setSelectedDuration] = useState(mapCtxRef.current.filter.dura || null);
  const [refreshCount, setRefreshCount] = useState(0);

  const [filter, setFilter] = useState(mapCtxRef.current.filter); // or use mapCtx if it's from context

  // Helper function to auto-select duration with items for a given product
  const autoSelectDurationForProduct = (productType) => {
    if (
      (productType === 'trainingpass' || productType === 'onlinetraining') &&
      mapProductsCount &&
      mapProductsCount[productType] &&
      typeof mapProductsCount[productType] === 'object'
    ) {
      const productCounts = mapProductsCount[productType];
      const durationsWithItems = Object.entries(productCounts)
        .filter(([key, value]) => value > 0)
        .sort(([a], [b]) => {
          // Sort by duration: 15, 30, 60, 70 (Over 60)
          const order = { 15: 1, 30: 2, 60: 3, 70: 4 };
          return (order[a] || 999) - (order[b] || 999);
        });

      if (durationsWithItems.length > 0) {
        const newDuration = durationsWithItems[0][0];
        DEBUG &&
          console.log(
            `Auto-selecting duration ${newDuration} (${durationsWithItems[0][1]} items) for product ${productType}`,
          );
        return newDuration;
      }
    }
    return null;
  };

  // MARK: updateFilterValue
  const updateFilterValue = (filterName, value) => {
    if (mapCtxRef.current.filter[filterName] !== value) {
      mapCtxRef.current.filter[filterName] = value;
      DEBUG && console.log('Filter:', mapCtxRef.current.filter);
      setCookie('search_filter', JSON.stringify(mapCtxRef.current.filter));
    }
    const updatedFilter = { ...filter, [filterName]: value };

    // Only update if the value has changed
    if (filter[filterName] !== value) {
      setFilter(updatedFilter); // Update state so React can trigger re-render
      DEBUG && console.log('Filter:', updatedFilter);
      setCookie('search_filter', JSON.stringify(updatedFilter));
    }

    // If product type is changing, auto-select appropriate duration
    if (filterName === 'prod' && (value === 'trainingpass' || value === 'onlinetraining') && mapProductsCount) {
      const autoDuration = autoSelectDurationForProduct(value);
      if (autoDuration && autoDuration !== mapCtxRef.current.filter.dura) {
        // Update duration in mapCtx and state
        mapCtxRef.current.filter.dura = autoDuration;
        const updatedFilterWithDuration = { ...updatedFilter, dura: autoDuration };
        setFilter(updatedFilterWithDuration);
        setCookie('search_filter', JSON.stringify(mapCtxRef.current.filter));
        DEBUG && console.log('Updated filter with auto-selected duration:', updatedFilterWithDuration);
      }
    }

    // Trigger the refresh count
    setRefreshCount((c) => c + 1);
  };

  const handleChangeDuration = (key) => {
    updateFilterValue('dura', key);
  };

  // MARK: Markup
  return (
    <>
      {isLoading && <Loader containerId="mapcontainer" />}
      <UserInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} alias={selectedSlug} />
      <AlertModal />
      <main id="traincategory">
        <div className="container">
          <Filter
            mapCtx={mapCtxRef.current}
            isFilterShown={showFilter}
            updateFilterValue={updateFilterValue}
            setRefreshCount={setRefreshCount}
            filteredMarkers={filteredMarkers}
          />

          <div className="categorytop">
            <div className="btn-back" onClick={handleBack}></div>
            <div className="topic">
              <h1>
                <Link href="/train">
                  {category ? translate(`cat_${category.category_link}`) : '' /*categoryHeader*/}
                </Link>
              </h1>
            </div>

            <div className={'btn-showlisttype ' + btnClass} onClick={handleToggleList}></div>
          </div>

          <div className={`containermap ${!showList ? 'full' : ''}`}>
            {showList ? (
              <List
                filteredMarkers={filteredMarkers}
                handleMapClick={handleMapClick}
                handleListClick={handlePointClick}
                showList={showList}
              />
            ) : null}

            <div id="mapview">
              {/* Show map view */}
              <div className="mapbuttons">
                <LocationInput mapCtx={mapCtxRef.current} />
                {/*                 <div
                  className="btn-mapposition"
                  onMouseOver={() => playSound('tickclick', '0.5')}
                  onClick={handleUserPosition}
                ></div> */}
                <div
                  className="btn-mapfilter"
                  onMouseOver={() => playSound('tickclick', '0.5')}
                  onClick={handleOpenFilter}
                >
                  {filterCount > 0 && <span className="amount">{filterCount}</span>}
                </div>
                <MapStyleSwitcher
                  value={styleKey}
                  onChange={handleStyleChange}
                  options={styleOptions}
                  disabled={!stadiaActive}
                  disabledReason={
                    stadiaActive ? undefined : 'Map style unavailable: using OpenStreetMap fallback'
                  }
                  variant="toolbar"
                  onMouseOver={() => playSound('tickclick', '0.5')}
                />
              </div>

              <div className={`categoryselectedmenu ${showList ? '' : 'phoneHide'}`}>
                {(filter.prod === 'trainingpass' || filter.prod === 'onlinetraining') &&
                  typeof mapProductsCount === 'object' &&
                  mapProductsCount !== null &&
                  mapProductsCount[filter.prod] && // Ensure the product exists
                  typeof mapProductsCount[filter.prod] === 'object' && (
                    <>
                      <div
                        className="categoryselected"
                        onMouseOver={() => playSound('tickclick', '0.5')}
                        onClick={handleOpenFilter}
                      >
                        {getProductText(filter.prod)}
                      </div>

                      {Object.entries(mapProductsCount[filter.prod]) // Safely access the relevant product data
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className={
                              filter.dura === key ? `${key} categoryselected selected` : `${key} categoryselected`
                            }
                            onMouseOver={() => playSound('tickclick', '0.5')}
                            onClick={() => handleChangeDuration(key)} // Update selected duration on click
                          >
                            {key === '70' ? 'Over 60' : `${key}min`}: {value}
                          </div>
                        ))}
                    </>
                  )}

                {(filter.prod === 'trainprogram' || filter.prod === 'dietprogram') &&
                  typeof mapProductsCount === 'object' &&
                  mapProductsCount !== null &&
                  filter.prod in mapProductsCount &&
                  mapProductsCount[filter.prod] &&
                  typeof mapProductsCount[filter.prod].total !== 'undefined' && (
                    <div
                      className="categoryselected"
                      onMouseOver={() => playSound('tickclick', '0.5')}
                      onClick={handleOpenFilter}
                    >
                      Total {getProductText(filter.prod)}: {mapProductsCount[filter.prod].total}
                    </div>
                  )}
              </div>

              {/* {showType === 'list' && <ListView mapCtx={mapCtxRef.current} sport={params.sport} />}
            <CategoryMap mapCtx={mapCtxRef.current} isLoading={isLoading} setIsLoading={setIsLoading} /> */}
              {isMarkersLoading && (
                <div className="markersloading">
                  <Loader onlyT={true} />
                </div>
              )}
              <div id="mapcontainer" onClick={handleMapClick}>
                {/* React version of the map */}
                <Map
                  mapCtx={mapCtxRef.current}
                  filter={filter}
                  isLoading={isMarkersLoading}
                  setIsLoading={setMarkersIsLoading}
                  filteredMarkers={filteredMarkers}
                  setFilteredMarkers={setFilteredMarkers}
                  handleMarkerClick={handlePointClick}
                  showList={showList}
                  setMapInstance={setMapInstance}
                  userCenter={userCenter}
                  userZoom={userZoom}
                  tileConfig={tileCfg}
                  styleKey={styleKey}
                />
              </div>
            </div>
          </div>
        </div>
        <Navigation props={'mapPage'} />
        {popupItem && (
          <DetailPopup
            mapCtx={mapCtxRef.current}
            popupItem={popupItem}
            profileOpen={isModalOpen}
            setProfileOpen={setIsModalOpen}
            profileSlug={selectedSlug}
            setProfileSlug={setSelectedSlug}
          />
        )}
        <InformationModal data={firstTime} pageName="map" />
      </main>
    </>
  );
}
