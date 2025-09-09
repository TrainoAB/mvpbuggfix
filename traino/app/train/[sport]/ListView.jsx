'use client';
import React, { useEffect, useRef, useState } from 'react';
import { walkTime, shortenText } from '@/app/functions/functions';
import { itemDistance, mapReference } from './CategoryMap';
import { useAppState } from '@/app/hooks/useAppState';
import Loader from '@/app/components/Loader';
import Link from 'next/link';
import { getProduct } from '@/app/functions/fetchDataFunctions.js';

import './page.css';
import './ListView.css';
import { DEBUG } from '@/app/api/secretcontext';

let globalListViewInstanceId = 0;

export default function ListView({ mapCtx, sport }) {
  const { useTranslations, language } = useAppState();
  const [refreshCount, setRefreshCount] = useState(0);
  const [openItemId, setOpenItemId] = useState(-1);

  const { translate } = useTranslations('global', language);

  const componetId = useRef(-1);
  if (componetId.current < 0) componetId.current = ++globalListViewInstanceId;

  const listEntries = useRef([]);
  const subsetRef = useRef([]);
  const isLoadingRef = useRef(false); // Initialize as false
  const more = subsetRef.current.length < listEntries.current.length;
  const batchSize = 20;

  // Init map context rerender ListView function
  mapCtx.rerenderListView = setRefreshCount;

  DEBUG &&
    console.log(
      'Render ListView component id:',
      componetId.current,
      mapCtx,
      'refreshCount:',
      refreshCount,
      'Subset size:',
      subsetRef.current.length,
    );

  useEffect(() => {
    const fetchItems = async () => {
      isLoadingRef.current = true; // Set loading state to true
      DEBUG && console.log('ListView get items:', mapCtx.itemRepo.getCurrentItems());
      listEntries.current = await mapCtx.itemRepo.getCurrentItemsAsync();
      if (Array.isArray(listEntries.current)) {
        const reference = mapReference(mapCtx.center, mapCtx.reference);
        listEntries.current.forEach((e) => itemDistance(e, reference));
      }
      sortList(sortButtonIx.current >= 0 ? sortButtonIx.current : 0, true);
      isLoadingRef.current = false; // Set loading state to false
      DEBUG && console.log('ListView got RESULT:', listEntries.current, subsetRef.current);
    };

    fetchItems();
  }, [mapCtx.itemRepo.getCurrentArea(), mapCtx.filter.hashCode()]);

  const sortButtonIx = useRef(-1);
  const sortButtons = [
    translate('distance', language),
    translate('name', language),
    translate('rating', language),
    translate('price', language),
  ];
  const sortList = async (sortIndex, forceSort = false) => {
    DEBUG && console.log('Sort', sortIndex, sortButtonIx.current);
    if (!forceSort && sortIndex === sortButtonIx.current) return;
    let refresh = true;
    switch (sortIndex) {
      case 0:
        listEntries.current.sort((e1, e2) => e1.distance - e2.distance);
        break;
      case 1:
        listEntries.current.forEach((e) => {
          if (!e.nameForSort) e.nameForSort = `${e.lastname.toUpperCase()} ${e.firstname.toUpperCase()}`;
        });
        listEntries.current.sort((e1, e2) => e1.nameForSort.localeCompare(e2.nameForSort));
        break;
      case 2:
        listEntries.current.sort((e1, e2) => (e2.rating ?? 0) - (e1.rating ?? 0));
        break;
      case 3:
        listEntries.current.sort((e1, e2) => (e1.price ?? 900000) - (e2.price ?? 900000));
        break;
      default:
        refresh = false;
        break;
    }
    if (refresh) {
      sortButtonIx.current = sortIndex;
      subsetRef.current = listEntries.current.slice(0, batchSize);
      setRefreshCount((c) => c + 1);
    }
  };

  const loadMore = async () => {
    if (subsetRef.current.length >= listEntries.current.length) return;
    subsetRef.current = listEntries.current.slice(0, subsetRef.current.length + batchSize);
    setRefreshCount((c) => c + 1);
  };

  const [isGrid, setIsGrid] = useState(true);

  // MARK: Markup

  return (
    <div id="listcontainer" className={isGrid ? 'gridlist' : ''}>
      <div className="content">
        <div className="sortbuttons">
          {sortButtons.map((sb, ix) => (
            <div
              key={ix}
              className={ix === sortButtonIx.current ? 'sortbutton sortactive' : 'sortbutton'}
              onClick={() => sortList(ix)}
            >
              {sb}
            </div>
          ))}
          <div className="listing">
            <div className={`icon-showgrid ${isGrid ? 'sortactive' : ''}`} onClick={() => setIsGrid(true)}></div>
            <div className={`icon-showlist ${!isGrid ? 'sortactive' : ''}`} onClick={() => setIsGrid(false)}></div>
          </div>
        </div>
        <div className="list">
          {isLoadingRef.current ? (
            <Loader />
          ) : (
            subsetRef.current.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                mapCtx={mapCtx}
                isOpen={item.id === openItemId}
                setOpenItemId={setOpenItemId}
                isGrid={isGrid}
                sport={sport}
              />
            ))
          )}
        </div>
        {more ? (
          <div className="loadmorecontainer">
            <div className="button loadmore" onClick={loadMore}>
              {translate('loadmore', language)}
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

/***********************************************************************************/
/************************** ListItem Component *************************************/
/***********************************************************************************/

function ListItem({ item, mapCtx, isOpen, setOpenItemId, isGrid, sport }) {
  const { useTranslations, language } = useAppState();
  const { translate } = useTranslations('global', language);

  const [refreshCount, setRefreshCount] = useState(0);

  DEBUG && console.log('List Item', item);

  const [product, setProduct] = useState('');
  useEffect(() => {
    async function getDescription() {
      const data = await getProduct(item.id);
      DEBUG && console.log('!!!!!!!!  Product', data);
      await setProduct(data);
    }
    getDescription();
  }, []);

  const handleOpenRow = async (event) => {
    setOpenItemId((preOpenId) => (preOpenId === item.id ? -1 : item.id));
    if (!item.details) {
      await mapCtx.itemRepo.getDetails(item);
      setRefreshCount((c) => c + 1);
    }
  };

  const distDisplay = (distKm) => {
    if (distKm > 0.955) {
      return distKm.toFixed(distKm >= 10 ? 0 : 1) + ' km';
    }
    return Math.round(distKm * 100) * 10 + ' m';
  };

  let user = item;
  let details = item.details;

  const getProductIconClass = (product) => {
    switch (product) {
      case 'trainpass':
        return 'icon-train';
      case 'onlinetraining':
        return 'icon-onlinetraining';
      case 'clipcard':
        return 'icon-clipcard';
      case 'dietprogram':
      case 'trainprogram':
        return 'icon-dietprogram';
      default:
        return '';
    }
  };

  if (!user) return <div className="row-user"></div>;

  // MARK: Markup
  return (
    <div className={`row-user ${isOpen ? 'rowopen' : ''}`}>
      <div className="row">
        {isGrid && <div className={`producticon ${getProductIconClass(mapCtx.filter.prod)}`}></div>}
        <Link href={'/trainer/@' + user.alias} className="thumb">
          {isGrid && (
            <>
              {user.rating !== 'null' && <div className="rating">{user.rating ? user.rating : ''}</div>}
              <Link
                href={`/trainer/@${user.alias}/${sport}/${mapCtx.filter.prod}/${user.product_id}`}
                className={`button ${
                  ['onlinetraining', 'trainingpass'].includes(mapCtx.filter.prod) ? 'book-button' : ''
                }`}
              >
                {translate('buy', language)}
              </Link>
            </>
          )}
          <img
            src={
              user.thumbnail === 1
                ? `https://traino.s3.eu-north-1.amazonaws.com/${user.id}/profile/profile-image.webp`
                : '/assets/icon-profile.svg'
            }
            alt=""
          />
        </Link>
        <Link href={'/trainer/@' + user.alias} className="userinfo">
          <div className="name">{`${user.firstname ? user.firstname : ''} ${user.lastname ? user.lastname : ''}`}</div>

          {product.product_type === 'dietprogram' || product.product_type === 'trainprogram' ? (
            <>
              <div className="price">{user.price} kr</div>
              <div className="price">
                {product.conversations} {translate('calls_in', language)} {product.duration}{' '}
                {translate('minutes', language)}
              </div>
            </>
          ) : (
            <>
              <div className="price">
                {product.price} kr för {product.duration} min
                {/* TODO: Hitta sätt att översätta ovan */}
              </div>
            </>
          )}
          {product.description && product.description.length > 45 ? (
            <div className="description">{product.description.substring(0, 45)}...</div>
          ) : (
            <div className="description">{product.description}</div>
          )}
        </Link>
        {!isGrid && (
          <>
            <div className="rating list-rating">{user.rating ? user.rating : ''}</div>
            <Link
              href={`/trainer/@${user.alias}/${sport}/${mapCtx.filter.prod}/${user.product_id}`}
              className={`button ${
                ['onlinetraining', 'trainingpass'].includes(mapCtx.filter.prod) ? 'book-button' : ''
              }`}
            >
              {translate('buy', language)}
            </Link>
          </>
        )}
        <div className="openrow" onClick={handleOpenRow}></div>
      </div>
      <div className="moreinfo">
        <div className="moreinfo-content">
          {['onlinetraining', 'trainingpass'].includes(mapCtx.filter.prod) && (
            <>
              <div className="infoitem">
                {details?.address?.length > 37 ? `${details.address?.substring(0, 37)}...` : details?.address ?? ''}
              </div>
              <div className="infoitem">
                {distDisplay(user.distance)} {translate('distance', language)}
              </div>
            </>
          )}

          {details?.duration && (
            <div className="infoitem">
              {translate('traintime', language)}: {details.duration} min
            </div>
          )}
          {details?.conversations && (
            <div className="infoitem">
              {translate('conversations', language)}: {details.conversations} min
            </div>
          )}
          {details?.product_sessions && (
            <div className="infoitem">
              {mapCtx.filter.prod === 'trainprogram'
                ? `${translate('amountweeks', language)}: `
                : mapCtx.filter.prod === 'dietprogram'
                ? `${translate('amountweeks', language)}: `
                : ''}{' '}
              {details.product_sessions}
            </div>
          )}
          {details?.description && <div className="infoitem">{details.description}</div>}
        </div>
        <div className="openrow" onClick={handleOpenRow}></div>
      </div>
    </div>
  );
}
