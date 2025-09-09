import { getProductDetails } from '@/app/functions/fetchDataFunctions.js';
import Loader from '@/app/components/Loader';
import { setCookie, getCookie, deleteCookie } from '@/app/functions/functions';

export default class ItemRepository {
  mapCtx;
  allLoadedItems;
  loadedAreas;
  currentItems;
  currentArea;
  productTable;
  filter;
  filterVersion;
  DEBUG;

  /*********** API **************/

  async getItems(area) {
    const preCount = Array.isArray(this.currentItems) ? this.currentItems.length : 'null';
    if (Array.isArray(this.currentItems) && this.isSameArea(this.currentArea, area)) {
      return this.currentItems;
    }
    await this.selectCurrentItems(area);
    this.DEBUG &&
      console.log(
        'ItemRepository getItems',
        preCount,
        this.currentItems ? this.currentItems.length : 'null',
        area,
        this,
      );
    return this.currentItems.slice();
  }

  async getCurrentItemsAsync() {
    const preCount = Array.isArray(this.currentItems) ? this.currentItems.length : 'null';
    if (!Array.isArray(this.currentItems)) {
      if (!Array.isArray(this.currentArea)) {
        return null;
      }
      await this.selectCurrentItems(this.currentArea);
    }
    this.DEBUG &&
      console.log(
        'ItemRepository getCurrentItemsAsync',
        preCount,
        this.currentItems ? this.currentItems.length : 0,
        this,
      );
    return this.currentItems.slice();
  }

  getCurrentItems() {
    this.DEBUG &&
      console.log(
        'ItemRepository getCurrentItems',
        Array.isArray(this.currentItems) ? this.currentItems.length : '<null>',
      );
    return this.currentItems;
  }

  getCurrentArea() {
    this.DEBUG && console.log('ItemRepository getCurrentArea', this);
    return this.currentArea;
  }

  getCurrentProductTable() {
    this.DEBUG && console.log('ItemRepository getProductTable', this);
    return this.productTable;
  }

  setCurrentArea(area) {
    const preCount = Array.isArray(this.currentItems) ? this.currentItems.length : 'null';
    if (!this.isSameArea(this.currentArea, area) && Array.isArray(area)) {
      this.currentArea = area;
      this.currentItems = null;
    }
    this.DEBUG &&
      console.log(
        'ItemRepository setCurrentArea',
        preCount,
        Array.isArray(this.currentItems) ? this.currentItems.length : 'null',
        area,
        this,
      );
  }

  setFilter(filter) {
    const newFilterVersion = filter.hashCode();
    if (newFilterVersion !== this.filterVersion) {
      this.filterVersion = newFilterVersion;

      // If user has set search parameters before, load them
      const searchFileter = getCookie('search_filter');
      if (searchFileter !== null && searchFileter !== undefined) {
        const searchFilterObject = JSON.parse(searchFileter);
        filter.cat = searchFilterObject.cat;
        filter.prmin = searchFilterObject.prmin;
        filter.prmax = searchFilterObject.prmax;
        filter.dura = searchFilterObject.dura;
        filter.prod = searchFilterObject.prod;
        filter.gen = searchFilterObject.gen;
      }

      this.filter = filter;
      this.clearLoadedItems();
    }
    this.DEBUG && console.log('ItemRepository setFilter', filter, this);
  }

  async getDetails(item) {
    if (item.details) return;
    try {
      const details = await getProductDetails(item.id, this.productTable);
      item.details = details;
    } catch (error) {
      //itemInfo.error = error;
      console.error('Error fetching data:', error, item);
    }
  }

  initCtx(mapCtx) {
    this.mapCtx = mapCtx;
    this.DEBUG = mapCtx.DEBUG ? true : false;
  }

  constructor() {
    this.allLoadedItems = new Map();
    this.loadedAreas = [];
    this.DEBUG = false;
  }

  /************ PRIVATE ******************/
  async selectCurrentItems(area) {
    const resultItems = [];

    let areaToLoad = this.getNeedToLoadArea(area);
    //let cacheNotUsed = this.isSameArea(area, areaToLoad);
    //console.log('ItemRepository selectCurrentItems AREAs:', areaToLoad, area);

    let loadPromise = null;
    if (areaToLoad) {
      loadPromise = this.fetchItems(areaToLoad, this.filter);
    }
    this.DEBUG && console.log(areaToLoad ? 'Loading...' : 'Skip load!', areaToLoad);

    this.allLoadedItems.forEach((i) => {
      if (
        i.latitude >= area[1] &&
        i.longitude >= area[0] &&
        i.latitude <= area[3] &&
        i.longitude <= area[2]
      ) {
        //if (i.sharedMarkerWith) i.sharedMarkerWith = null;
        resultItems.push(i);
      }
    });
    //console.log('updateMarkers From CACHE:', resultItems.length);

    if (loadPromise) {
      const loadResult = await loadPromise;
      //const loadedItems = await loadPromise;
      if (typeof loadResult?.product_table === 'string') {
        this.productTable = loadResult.product_table;
        //this.mapCtx.productTable = this.productTableRef;
        //this.updateExportedInfo();
      }
      const loadedItems = loadResult?.results;
      if (Array.isArray(loadedItems)) {
        loadedItems.forEach((item) => {
          if (!this.allLoadedItems.has(item.id)) {
            this.allLoadedItems.set(item.id, item);
          }
          if (!resultItems.find((ri) => ri.id === item.id)) {
            resultItems.push(item);
          }
        });
        this.areaLoaded(areaToLoad, loadedItems);
        //console.log('updateMarkers CACHE + LOADED:', resultItems.length);
      }
    }

    this.currentItems = resultItems;
    this.currentArea = area;
  }

  async fetchItems(area, filter) {
    // Show the loader before fetching
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex'; // Show the loader

    try {
      const resp = await fetch(`${this.mapCtx.baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.mapCtx.sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${this.mapCtx.baseUrl}/api/map/areaproducts?minlat=${area[1]}&minlng=${
            area[0]
          }&maxlat=${area[3]}&maxlng=${area[2]}${filter.urlFilterPart()}`,
          method: 'GET',
        }),
      });

      const result = await resp.json();
      this.postFetchItemManipulation(result?.results);
      this.DEBUG && console.log('fetchItems result', result);
      return result;
    } catch (err) {
      console.error('Error fetching data (getItemsForMapView):', err);
      return null;
    } finally {
      // Hide the loader after fetching
      if (loader) loader.style.display = 'none'; // Hide the loader
    }
  }

  postFetchItemManipulation(items) {
    Array.isArray(items) &&
      items.forEach((i) => {
        i.latitude = Number(i.latitude);
        i.longitude = Number(i.longitude);
        i.rating = Number(i.rating);
        i.distance = 0; //Init value, set correct later
        i.reference = null;
        if (typeof i.product_id !== 'undefined') i.id = i.product_id;
        //i.productTable = result.product_table;
      });
  }

  clearLoadedItems() {
    this.allLoadedItems.clear();
    this.loadedAreas.splice(0);
    this.currentItems = null;
  }

  getNeedToLoadArea(area) {
    const nonCovered = this.getNonCovered(area.slice(), this.loadedAreas);
    const needToLoad = this.getLeastCover(nonCovered);
    this.DEBUG && console.log('NeedToLoad', this.loadedAreas, area, nonCovered, needToLoad);
    return needToLoad;
  }

  areaLoaded(area, items) {
    //Insert new items in cache
    items.forEach((item) => {
      if (!this.allLoadedItems.has(item.id)) this.allLoadedItems.set(item.id, item);
    });

    //Remove redundant areas:
    for (let i = this.loadedAreas.length - 1; i >= 0; i--) {
      const la = this.loadedAreas[i];
      const xOverlapType = this.overlapType(area[0], area[2], la[0], la[2]);
      if (xOverlapType === 0) continue;
      const yOverlapType = this.overlapType(area[1], area[3], la[1], la[3]);
      if (yOverlapType === 0) continue;

      if (xOverlapType === 1 && yOverlapType === 1) {
        this.loadedAreas.splice(i, 1);
        continue;
      }
      if (xOverlapType === 2 && yOverlapType === 2) {
        //Should not happen!
        return;
      }
    }

    //Store new area:
    let aSz = this.areaSize(area);
    for (let i = this.loadedAreas.length - 1; i >= 0; i--) {
      if (aSz > this.areaSize(this.loadedAreas[i])) {
        this.loadedAreas.splice(i, 0, area);
        return;
      }
    }
    this.loadedAreas.push(area);
  }

  getNonCovered(area, coverList, startIx = 0) {
    let nonCovered = [];
    for (let i = startIx; i < coverList.length; i++) {
      const extraPart = this.reduceCoveredParts(area, coverList[i]);
      if (extraPart === 0) {
        return nonCovered;
      }
      if (extraPart) {
        nonCovered.push(...this.getNonCovered(extraPart, coverList, i + 1));
      }
    }
    nonCovered.push(area);
    return nonCovered;
  }

  getLeastCover(areas) {
    const lc = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];
    areas.forEach((a) => {
      if (a[0] < lc[0]) lc[0] = a[0];
      if (a[1] < lc[1]) lc[1] = a[1];
      if (a[2] > lc[2]) lc[2] = a[2];
      if (a[3] > lc[3]) lc[3] = a[3];
    });
    return lc[0] >= lc[2] || lc[1] >= lc[3] ? null : lc;
  }

  overlapType(i1Beg, i1End, i2Beg, i2End) {
    if (i1Beg >= i2End || i2Beg >= i1End) return 0; //Disjoint
    if (i1Beg >= i2Beg) {
      if (i1End <= i2End) return 2; //Interval 2 covers 1
      return 4; //[i1Beg, i2End]; //Intersection second lower
    }
    if (i2End <= i1End) return 1; //Interval 1 covers 2
    return 3; //[i2Beg, i1End]; //Intersection first lower
  }

  reduceCoveredParts(area, coverArea) {
    const xOverlapType = this.overlapType(area[0], area[2], coverArea[0], coverArea[2]);
    if (xOverlapType === 0) return null; //Disjoint
    const yOverlapType = this.overlapType(area[1], area[3], coverArea[1], coverArea[3]);
    if (yOverlapType === 0) return null; //Disjoint

    //X covered
    if (xOverlapType === 2) {
      if (yOverlapType === 2) return 0; //Fully covered
      //X covered, Y subset
      if (yOverlapType === 1) {
        const nonCovered1 =
          area[3] > coverArea[3] ? [area[0], coverArea[3], area[2], area[3]] : null;
        // area[0] = area[0];
        // area[1] = area[1];
        // area[2] = area[2];
        area[3] = coverArea[1];
        if (area[1] >= area[3]) {
          if (nonCovered1 === null) return 0;
          area.splice();
          area.push(...nonCovered1);
          return null;
        }
        return nonCovered1;
      }
      //X covered, Y intersecting
      if (area[3] > coverArea[3]) {
        area[1] = coverArea[3];
      } else {
        area[3] = coverArea[1];
      }
      return null;
    }

    //Y covered
    if (yOverlapType === 2) {
      if (xOverlapType === 1) {
        const nonCovered1 =
          area[2] > coverArea[2] ? [coverArea[2], area[1], area[2], area[3]] : null;
        area[2] = coverArea[0];

        if (area[0] >= area[2]) {
          if (nonCovered1 === null) return 0;
          area.splice(0);
          area.push(...nonCovered1);
          return null;
        }
        return nonCovered1;
      }
      //X intersecting, Y covered
      if (area[2] > coverArea[2]) {
        area[0] = coverArea[2];
      } else {
        area[2] = coverArea[0];
      }
      return null;
    }

    if (xOverlapType === 1 || yOverlapType === 1) {
      //Too complicated, ignore
      return null;
    }

    //X intersecting, Y intersecting
    let nonCovered = null;
    if (xOverlapType === 4) {
      if (yOverlapType === 4) {
        nonCovered = [coverArea[2], area[1], area[2], coverArea[3]];
      } else {
        nonCovered = [coverArea[2], coverArea[1], area[2], area[3]];
      }
    } else {
      if (yOverlapType === 4) {
        nonCovered = [area[0], area[1], coverArea[0], coverArea[3]];
      } else {
        nonCovered = [area[0], coverArea[1], coverArea[0], area[3]];
      }
    }
    if (yOverlapType === 4) {
      area[1] = coverArea[3];
    } else {
      area[3] = coverArea[1];
    }

    return nonCovered;
  }
  areaSize(a) {
    return (a[2] - a[0]) * (a[3] - a[1]);
  }

  isSameArea(a1, a2) {
    return (
      Array.isArray(a1) &&
      Array.isArray(a2) &&
      a1[0] === a2[0] &&
      a1[1] === a2[1] &&
      a1[2] === a2[2] &&
      a1[3] === a2[3]
    );

    // return Array.isArray(a1) && Array.isArray(a2) &&
    //   Math.abs(a1[0] - a2[0]) < 0.0001 &&
    //   Math.abs(a1[1] - a2[1]) < 0.0001 &&
    //   Math.abs(a1[2] - a2[2]) < 0.0001 &&
    //   Math.abs(a1[3] - a2[3]) < 0.0001;
  }
}
