'use client';
import React from 'react';
import { useRef, useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { Slider_MinMax } from '@/app/components/Inputs/Slider_MinMax';
import { stringHashCode } from '@/app/functions/functions';
import { setCookie, getCookie, deleteCookie } from '@/app/functions/functions';
import { playSound } from '@/app/components/PlaySound';

import './page.css';

const globalMaxPrice_ToBeChanged = 10000;

export default function Filter({ mapCtx, isFilterShown, updateFilterValue, setRefreshCount, filteredMarkers }) {
  const { DEBUG, useTranslations, language } = useAppState();
  const [count, setCount] = useState(0);

  const sliderKey = useRef(1);

  const { translate } = useTranslations('global', language);

  function countMarkers() {
    const mapMarkers = filteredMarkers.length;
    setCount(mapMarkers);
  }

  useEffect(() => {
    countMarkers();
  }, [isFilterShown, updateFilterValue, setRefreshCount]);

  // Set states for radio buttons pass length in filter menu
  const handleRadioChangeDuration = (event) => {
    updateFilterValue('dura', event.target.value);
  };

  // Set states for radio buttons product in filter menu
  const handleRadioChangeProduct = (event) => {
    updateFilterValue('prod', event.target.value);
  };

  // Set states for radio buttons gender in filter menu
  const handleRadioChangeGender = (event) => {
    updateFilterValue('gen', event.target.value);
  };

  const updateFilterPriceRange = (priceRange) => {
    if (mapCtx.filter) {
      mapCtx.filter.prmin = priceRange.min;
      mapCtx.filter.prmax = priceRange.max;
      setCookie('search_filter', JSON.stringify(mapCtx.filter));
    }
  };

  const handleFilterPriceRange = (priceRange) => {
    updateFilterValue('prmin', priceRange.min);
    updateFilterValue('prmax', priceRange.max);
  };

  // Update the value based on whether the checkbox is checked or not
  const handleClipcardCheckbox = (event) => {
    playSound('check', '0.5');
    updateFilterValue('hasclipcard', event.target.checked);
  };

  const showDurationFilter = mapCtx.filter?.prod === 'trainingpass' || mapCtx.filter?.prod === 'onlinetraining';
  // MARK: Markup
  return (
    <>
      <div id="filtercontainer" className={isFilterShown ? 'showfilter' : ''}>
        <div className="categorytop secondarytop">
          <div className="btn-back" onClick={mapCtx.closeFilter}>
            {'<'}
          </div>
          <h1>{translate('filter', language)}</h1>
        </div>
        <div className="content">
          <form action="">
            <div className="filter-group">
              <h3>{translate('price', language)}</h3>
              <Slider_MinMax
                key={sliderKey.current}
                value={updateFilterPriceRange}
                onMouseUp={handleFilterPriceRange}
                startMin={mapCtx.filter.prmin}
                startMax={mapCtx.filter.prmax}
                min={0}
                max={globalMaxPrice_ToBeChanged}
                prefix={true}
                suffix={'kr'}
                step={5}
                minRange={0}
              />
            </div>
            <div className="filter-group columns-two">
              <div>
                <h3>{translate('product', language)}</h3>
                <div className="checkboxes">
                  <div className="input-group">
                    <input
                      type="radio"
                      id="check-trainpass"
                      name="product"
                      value="trainingpass"
                      checked={mapCtx.filter?.prod === 'trainingpass'}
                      onChange={handleRadioChangeProduct}
                    />
                    <label htmlFor="check-trainpass">{translate('trainingpass', language)}</label>
                  </div>
                  <div className="input-group">
                    <input
                      type="radio"
                      id="check-onlinetrain"
                      name="product"
                      value="onlinetraining"
                      checked={mapCtx.filter?.prod === 'onlinetraining'}
                      onChange={handleRadioChangeProduct}
                    />
                    <label htmlFor="check-onlinetrain">{translate('onlinetraining', language)}</label>
                  </div>

                  <div className="input-group">
                    <input
                      type="radio"
                      id="check-trainprogram"
                      name="product"
                      value="trainprogram"
                      checked={mapCtx.filter?.prod === 'trainprogram'}
                      onChange={handleRadioChangeProduct}
                    />
                    <label htmlFor="check-trainprogram">{translate('trainprogram', language)}</label>
                  </div>
                  <div className="input-group">
                    <input
                      type="radio"
                      id="check-dietprogram"
                      name="product"
                      value="dietprogram"
                      checked={mapCtx.filter?.prod === 'dietprogram'}
                      onChange={handleRadioChangeProduct}
                    />
                    <label htmlFor="check-dietprogram">{translate('dietprogram', language)}</label>
                  </div>
                </div>
                {/*{(mapCtx.filter?.prod === 'trainingpass' || mapCtx.filter?.prod === 'onlinetraining') && (
                  <div className="checkboxes">
                    <div className="input-group">
                      <label htmlFor="clipcard" className="clipcard">
                        <input
                          className="hiddencheckbox"
                          type="checkbox"
                          id="clipcard"
                          onChange={handleClipcardCheckbox}
                        />
                        <span className="customcheckbox"></span>
                        {translate('hasclipcard', language)}
                      </label>
                    </div> 
                  </div>
                )}*/}
              </div>
              {showDurationFilter ? (
                <div>
                  <h3> {translate('length', language)}</h3>
                  <div className="checkboxes">
                    <div className="input-group">
                      <input
                        type="radio"
                        id="radio-15"
                        name="duration"
                        value="15"
                        checked={mapCtx.filter.dura === '15'}
                        onChange={handleRadioChangeDuration}
                      />
                      <label htmlFor="radio-15">15 min</label>
                    </div>
                    <div className="input-group">
                      <input
                        type="radio"
                        id="radio-30"
                        name="duration"
                        value="30"
                        checked={mapCtx.filter.dura === '30'}
                        onChange={handleRadioChangeDuration}
                      />
                      <label htmlFor="radio-30">30 min</label>
                    </div>
                    <div className="input-group">
                      <input
                        type="radio"
                        id="radio-60"
                        name="duration"
                        value="60"
                        checked={mapCtx.filter.dura === '60'}
                        onChange={handleRadioChangeDuration}
                      />
                      <label htmlFor="radio-60">60 min</label>
                    </div>
                    <div className="input-group">
                      <input
                        type="radio"
                        id="radio-602"
                        name="duration"
                        value="70"
                        checked={mapCtx.filter.dura === '70'}
                        onChange={handleRadioChangeDuration}
                      />
                      <label htmlFor="radio-602">Över 60 min</label>
                    </div>
                  </div>
                </div>
              ) : (
                <></>
              )}

              <div>
                <h3>
                  {translate('male', language)} / {translate('female', language)}
                </h3>
                <div className="checkboxes">
                  <div className="input-group">
                    <input
                      type="radio"
                      id="radio-male"
                      name="gender"
                      value="male"
                      checked={mapCtx.filter.gen === 'male'}
                      onChange={handleRadioChangeGender}
                    />
                    <label htmlFor="radio-male">{translate('male', language)}</label>
                  </div>
                  <div className="input-group">
                    <input
                      type="radio"
                      id="radio-female"
                      name="gender"
                      value="female"
                      checked={mapCtx.filter.gen === 'female'}
                      onChange={handleRadioChangeGender}
                    />
                    <label htmlFor="radio-female">{translate('female', language)}</label>
                  </div>
                  <div className="input-group">
                    <input
                      type="radio"
                      id="radio-anygender"
                      name="gender"
                      value=""
                      checked={mapCtx.filter.gen === ''}
                      onChange={handleRadioChangeGender}
                    />
                    <label htmlFor="radio-anygender">{translate('doesnotmatter', language)}</label>
                  </div>
                </div>
              </div>
            </div>
            {/* 
            <div className="filter-group">
              <h3>Övrigt</h3>

              <div className="checkboxes">
                <div className="input-group">
                  <label htmlFor="date">Datum</label>
                  <input type="date" id="date" />
                </div>
              </div>
              <br />
            </div> 
            */}
            <div className="filterbuttons">
              <div className="filterbuttons-content">
                <div
                  className="button onlyborder"
                  onClick={() => {
                    const defaultFilter = getDefaultFilter(mapCtx.filter.cat);

                    // Update all filter values through the proper update function
                    updateFilterValue('prmin', defaultFilter.prmin);
                    updateFilterValue('prmax', defaultFilter.prmax);
                    updateFilterValue('dura', defaultFilter.dura);
                    updateFilterValue('prod', defaultFilter.prod);
                    updateFilterValue('gen', defaultFilter.gen);
                    updateFilterValue('hasclipcard', defaultFilter.hasclipcard);

                    // Update the mapCtx.filter object
                    mapCtx.filter = defaultFilter;

                    // Update cookie to persist the cleared state
                    setCookie('search_filter', JSON.stringify(mapCtx.filter));

                    // Force slider to re-render with new values
                    sliderKey.current++;
                    setRefreshCount((c) => c + 1);
                  }}
                >
                  {translate('clear', language)}
                </div>
                <div className="button" onClick={mapCtx.closeFilter}>
                  {translate('show', language)} {count}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className={isFilterShown ? 'darkoverlay' : 'darkoverlay hide'} onClick={mapCtx.closeFilter}></div>
    </>
  );
}

export function getDefaultFilter(category = 0) {
  return {
    cat: category,
    prmin: 0,
    hasclipcard: false,
    prmax: globalMaxPrice_ToBeChanged,
    dura: '60',
    prod: 'trainingpass',
    gen: '',
    hashCode() {
      const hash = stringHashCode(`${this.cat}_${this.prmin}_${this.prmax}_${this.dura}_${this.prod}_${this.gen}`);
      //console.log('Filter hash code:', hash);
      return hash;
    },
    urlFilterPart(prefix = '&') {
      const priceMin = this.prmin ? this.prmin : 0;
      const priceMax = this.prmax ? this.prmax : globalMaxPrice_ToBeChanged;
      const isPriceFilterSet = 0 < priceMin || priceMax !== globalMaxPrice_ToBeChanged;

      let url = `${this.cat ? `&cat=${this.cat}` : ''}${
        isPriceFilterSet ? `&prmin=${priceMin}&prmax=${priceMax}` : ''
      }${this.dura && (this.prod === 'onlinetraining' || this.prod === 'trainingpass') ? `&dura=${this.dura}` : ''}${
        this.prod ? `&prod=${this.prod}` : ''
      }${this.gen ? `&gen=${this.gen}` : ''}`;
      if (url.length > 0) {
        if (url[0] !== prefix) {
          url = prefix + url.slice(1);
        }
      }
      return url;
    },
    nrOfFilters() {
      return (
        ((this.prmin && this.prmin > 0) || (this.prmax && this.prmax < globalMaxPrice_ToBeChanged) ? 1 : 0) +
        (this.dura && (this.prod === 'onlinetraining' || this.prod === 'trainingpass') ? 1 : 0) +
        (this.prod ? 1 : 0) +
        (this.gen ? 1 : 0)
      );
    },
  };
}
