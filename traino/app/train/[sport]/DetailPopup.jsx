'use client';
import React from 'react';
import { useEffect, useRef, useState, useReducer } from 'react';
import { walkTime, shortenText, getCategoryImage, getCookie } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { itemDistance, mapReference } from './CategoryMap';
import { playSound } from '@/app/components/PlaySound';
import Link from 'next/link';
import Rating from '@/app/components/Rating/Rating';
import ReadReview from '@/app/components/Rating/ReadReview';
//import Loader from '@/app/components/Loader';
import Image from 'next/image';
import ReserveBuy from '@/app/components/ReserveBuy';
import UserInfoModal from '@/app/components/UserInfoModal';
import './DetailPopup.css';

const DetailPopup = React.memo(function DetailPopup({
  mapCtx,
  popupItem,
  profileOpen,
  setProfileOpen,
  profileSlug,
  setProfileSlug,
}) {
  const { DEBUG, traincategories, useTranslations, language } = useAppState();
  const { translate } = useTranslations('global', language);
  const [_, setRefreshCounter] = useState(0);
  const [openBooking, setOpenBooking] = useState(false);

  const componentId = useRef(-1);
  if (componentId.current < 0) componentId.current = ++glbDetailPopupComponentIdCounter;

  const currentSharedIndex = useRef(-1);
  const item = currentSharedIndex.current >= 0 ? popupItem.sharedMarkerWith[currentSharedIndex.current] : popupItem;
  const totalShared = popupItem?.sharedMarkerWith ? popupItem.sharedMarkerWith.length + 1 : 1;

  const [hasProfile, setHasProfile] = useState(false);
  const [hasCover, setHasCover] = useState(false);
  const [readReview, setReadReview] = useState(false);

  // Show more information in the showinfo box
  const handleShowMore = (event) => {
    event.stopPropagation();
    playSound('swipe', '0.5');
    const parent = event.target.closest('.showinfo');
    parent.classList.toggle('minimize');
  };
  const handleOpenModal = (slug) => {
    DEBUG && console.log('Modal triggered with slug:', slug);
    setProfileSlug(slug);
    setProfileOpen(true);
  };

  useEffect(() => {
    if (profileOpen && !profileSlug) {
      console.error('Modal opened without a valid slug.');
      setProfileOpen(false); // Close the modal or take corrective action
    }
  }, [profileOpen, profileSlug]);

  useEffect(() => {
    playSound('swish2', '0.2');
    DEBUG && console.log('useEffect dependent', popupItem?.id);
    DEBUG && console.log('Rendering DetailPopup ID:', componentId.current, popupItem);

    DEBUG && console.log('mapCtx:', mapCtx);
    DEBUG && console.log('popupItem:', popupItem);
    DEBUG && console.log('RUN useEffect, fetch all. details', popupItem?.id, popupItem?.sharedMarkerWith);
    (async () => {
      const items = [popupItem];

      if (Array.isArray(popupItem.sharedMarkerWith)) items.push(popupItem.sharedMarkerWith);

      let currentPromise = null;
      //const promises = [];
      for (let item of items) {
        const promise = mapCtx.itemRepo.getDetails(item);

        if (!currentPromise) {
          currentPromise = promise;
        }
      }

      await currentPromise;
      setRefreshCounter((c) => c + 1);
    })();
  }, [popupItem?.id]);

  const showOtherItem = (dir) => {
    const newSharedIndex = currentSharedIndex.current + dir;
    if (-1 <= newSharedIndex && (newSharedIndex < popupItem.sharedMarkerWith?.length ?? 0)) {
      currentSharedIndex.current = newSharedIndex;
      setRefreshCounter((c) => c + 1);
    }
  };

  useEffect(() => {
    const fetchProfileImages = async () => {
      if (item.thumbnail === 1) {
        const profile = await fetch(`/api/aws/fetch-imgs?folder=${encodeURIComponent(item.user_id)}&subfolder=profile`);

        if (profile.ok) {
          setHasProfile(true);
        }

        DEBUG && console.log('Profile:', profile);
      }

      if (item.coverimage === 1) {
        const cover = await fetch(`/api/aws/fetch-imgs?folder=${encodeURIComponent(item.user_id)}&subfolder=cover`);

        if (cover.ok) {
          setHasCover(true);
        }

        DEBUG && console.log('Cover:', cover);
      }
    };

    fetchProfileImages();
  }, [item]);

  const details = item.details;
  DEBUG && console.log('item:', item);
  DEBUG && console.log('details:', details);
  itemDistance(item, mapReference(mapCtx.center, mapCtx.reference));

  // Calculate distance from center marker if it exists
  const [distanceFromCenter, setDistanceFromCenter] = useState(null);

  useEffect(() => {
    // Check if there's a center marker position in mapCtx or get from sessionStorage
    const centerMarkerData = mapCtx.centerMarkerPosition || getCookie('centerMarkerPosition');
    if (centerMarkerData && item.latitude && item.longitude) {
      let centerPos;
      if (typeof centerMarkerData === 'string') {
        try {
          centerPos = JSON.parse(centerMarkerData);
        } catch (e) {
          centerPos = null;
        }
      } else {
        centerPos = centerMarkerData;
      }

      if (centerPos && centerPos.length === 2) {
        const distance = calculateDistanceFromCenter(
          centerPos[0],
          centerPos[1],
          parseFloat(item.latitude),
          parseFloat(item.longitude),
        );
        setDistanceFromCenter(distance);
      }
    }
  }, [item.latitude, item.longitude, mapCtx.centerMarkerPosition]);

  // Function to calculate distance using Haversine formula
  function calculateDistanceFromCenter(lat1, lng1, lat2, lng2) {
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

  const isTrainingProduct = mapCtx.filter.prod === 'trainingpass' || mapCtx.filter.prod === 'onlinetraining';
  const trainingType = mapCtx.filter.prod;
  const priceDisplay = `${item.price}kr`;
  const detailsDisplay =
    isTrainingProduct && details && details.duration
      ? `${details.duration}min ${translate('pass', language).toLowerCase()}`
      : null;

  const handleOpenBooking = (item) => {
    playSound('popclick', '0.5');
    setOpenBooking(true);
  };

  const handleOpenBuy = (item) => {
    playSound('popclick', '0.5');
    setOpenBooking(true);
  };

  const handleViewRatings = () => {
    setReadReview(true);
  };

  // Function to open Google Maps directions
  const handleGetDirections = () => {
    playSound('popclick', '0.5');

    const centerMarkerData = mapCtx.centerMarkerPosition || getCookie('centerMarkerPosition');
    let centerPos;

    if (typeof centerMarkerData === 'string') {
      try {
        centerPos = JSON.parse(centerMarkerData);
      } catch (e) {
        centerPos = null;
      }
    } else {
      centerPos = centerMarkerData;
    }

    if (centerPos && centerPos.length === 2 && item.latitude && item.longitude) {
      const origin = `${centerPos[0]},${centerPos[1]}`;
      const destination = `${item.latitude},${item.longitude}`;
      const googleMapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;

      // Open in new tab/window
      window.open(googleMapsUrl, '_blank');
    } else {
      // Fallback to just showing the destination location
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  // MARK: Markup
  DEBUG && console.log('Passing slug to modal:', popupItem.alias);
  DEBUG && console.log('profileSlug is !!!!!!!!!!!!!!!!!!!! :', profileSlug);
  return (
    <>
      {item && item.details && openBooking && <ReserveBuy popupData={item.details} onClose={setOpenBooking} />}
      {item && item.user_id && readReview && <ReadReview userId={item.user_id} onClose={setReadReview} />}
      <div className="showinfo show">
        <div className="content">
          <>
            <div className="detail-popup"></div>
            <div className="row-user">
              <div className={'user-header ' + (isTrainingProduct ? '' : 'largerHead')}>
                <div className={'thumb ' + (isTrainingProduct ? '' : 'largerThumb')}>
                  {details && details.coverimage === 0 ? (
                    <>
                      {mapCtx && mapCtx.filter && mapCtx.filter.cat && traincategories && (
                        <img
                          src={getCategoryImage(mapCtx.filter.cat, traincategories)}
                          alt=""
                          style={{ objectFit: 'cover' }}
                        />
                      )}
                    </>
                  ) : (
                    <img
                      src={`https://traino.s3.eu-north-1.amazonaws.com/${item.user_id}/cover/cover-image.webp`}
                      alt=""
                      style={{ objectFit: 'cover' }}
                    />
                  )}

                  {item && item.rating && <Rating userDetails={item} handleViewRatings={handleViewRatings} />}
                  <div className="btn-showmore" onClick={handleShowMore}></div>
                  <div className="information">
                    <div className="column2">
                      <div>
                        <div
                          className="thumbnail"
                          onClick={() => handleOpenModal(item.alias)}
                          style={{ cursor: 'pointer' }}
                        >
                          {hasProfile && (
                            <Image
                              src={`https://traino.s3.eu-north-1.amazonaws.com/${item.user_id}/profile/profile-image.webp`}
                              alt=""
                              width={100}
                              height={100}
                              priority
                              style={{ objectFit: 'cover' }}
                            />
                          )}
                        </div>
                        <div
                          className="alias"
                          onClick={() => handleOpenModal(item.alias)}
                          style={{ cursor: 'pointer' }}
                        >
                          @{item.alias}
                        </div>
                        <div className="name" onClick={() => handleOpenModal(item.alias)} style={{ cursor: 'pointer' }}>
                          {item.firstname + ' ' + item.lastname}
                        </div>
                        <div className="price">
                          {priceDisplay} <span>{detailsDisplay}</span>
                        </div>
                      </div>
                      <div>
                        {isTrainingProduct ? (
                          <div
                            className="button book-button"
                            onMouseOver={() => playSound('tickclick', '0.5')}
                            onClick={handleOpenBooking}
                          >
                            {translate('choosetime', language)}
                          </div>
                        ) : (
                          <div
                            className="button book-button"
                            onMouseOver={() => playSound('tickclick', '0.5')}
                            onClick={handleOpenBuy}
                          >
                            {translate('buy', language)}
                          </div>
                        )}
                      </div>
                    </div>
                    {details && details.description && (
                      <>
                        <div className="description">{shortenText(details.description, 100)}</div>
                        {!isTrainingProduct && (
                          <>
                            <div className="description">Konversation: {details.conversations} min</div>
                            <div className="description">
                              {trainingType === 'trainprogram'
                                ? `${translate('amountweeks', language)}:`
                                : `${translate('amountsessions', language)}:`}{' '}
                              {details.product_sessions}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {
                details ? (
                  <>
                    {/* More information, toggle view */}
                    <div className="moreinfo">
                      <div className="moreinfo-content">
                        {details && details.description && <div className="prodinfo">{details.description}</div>}

                        <div className="gender">
                          {details.gender &&
                            (details.gender === 'male'
                              ? translate('male', language)
                              : details.gender === 'female'
                              ? translate('female', language)
                              : '')}
                        </div>

                        <div className="address">
                          {details.adress && details.user_address.length > 37
                            ? `${details.user_address.substring(0, 37)}...`
                            : details.user_address}
                        </div>
                        {/*  <div className="distance">
                          <strong>{item.distance?.toFixed(2)}</strong>
                          km
                          <span>, {walkTime(item.distance ?? 0)}</span>
                        </div> */}

                        {/* Distance from center marker */}
                        {distanceFromCenter && (
                          <div className="distance-from-center">
                            <strong>{distanceFromCenter.toFixed(1)}</strong>
                            km
                            <span>, from center point</span>
                            <button className="directions-btn" onClick={handleGetDirections} title="Get directions">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        <ul className="training">
                          {details.training &&
                            details.training.map((trainItem, index) => (
                              <li className="trainitem" key={index}>
                                {translate(`cat_${trainItem.category_link}`, language)}
                              </li>
                            ))}
                        </ul>
                        <h3>{translate('aboutme', language)}</h3>
                        <p>{shortenText(details.user_about)}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <></>
                )
                // : (<Loader />)
              }
            </div>
            {totalShared > 1 ? (
              <div className="pagnation">
                <button onClick={() => showOtherItem(-1)} className="prevnext">
                  &lt;
                </button>
                {currentSharedIndex.current + 2}/{totalShared}{' '}
                <button onClick={() => showOtherItem(1)} className="prevnext">
                  &gt;
                </button>
              </div>
            ) : (
              <></>
            )}
          </>
        </div>
      </div>
    </>
  );
});

var glbDetailPopupComponentIdCounter = 0;

export default DetailPopup;
