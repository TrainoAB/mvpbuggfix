'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getUserDetailsAlias, shortenText, getCategoryName } from '@/app/functions/functions';
import { Header_DisplayButton } from '@/app/components/Header_DisplayButton';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/components/PlaySound';
import Navigation from '@/app/components/Menus/Navigation';
import Loader from '@/app/components/Loader';
import Products from '@/app/trainer/Products';
import Link from 'next/link';

import { getSportProductCount } from '@/app/functions/fetchDataFunctions.js';

import './SportProducts.css';

const SportProducts = React.memo(({ params, onClose = null, nav = true, alias = null }) => {
  const { DEBUG, isLoggedin, userData, sessionObject, baseUrl, traincategories } = useAppState();

  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [fullname, setFullname] = useState('');
  const [trainingpasses, setTrainingpasses] = useState([]);
  const [onlinetrainings, setOnlinetrainings] = useState([]);
  const [trainprograms, setTrainprograms] = useState([]);
  const [dietprograms, setDietprograms] = useState([]);
  const [trainingpassesVisible, setTrainingpassesVisible] = useState(true);
  const [onlinetrainingsVisible, setOnlinetrainingsVisible] = useState(false);
  const [trainprogramsVisible, setTrainprogramsVisible] = useState(false);
  const [dietprogramsVisible, setDietprogramsVisible] = useState(false);

  const [showSelectedProducts, setShowSelectedProducts] = useState(null);
  const [showProducts, setShowProducts] = useState(false);
  const [categoryObject, setCategoryObject] = useState('');
  const [categoryName, setCategoryName] = useState('');

  let userAliasDecoded, userAlias, userAliasEncoded;
  if (!alias) {
    userAliasDecoded = decodeURIComponent(params.alias); // Decodes %40 to @
    userAlias = userAliasDecoded.substring(1); // Skips the first character (i.e., @)
    userAliasEncoded = encodeURIComponent(userAlias); // Encodes the alias without @
  } else {
    userAlias = alias;
  }

  const router = useRouter();

  const userDetails = useRef();

  useEffect(() => {
    DEBUG && console.log('SportProducts params: ', params);

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSportProductCount(userAlias, params.sport);
        DEBUG && console.log('Data:', data);

        // Display the sorted products
        setProducts(data);
        setFullname(data.firstname + ' ' + data.lastname);

        // Filter and set state based on product_type
        const newOnlinetrainings = data.products.filter((item) => item.product_type === 'onlinetraining');
        const newTrainingpasses = data.products.filter((item) => item.product_type === 'trainingpass');
        const newDietprograms = data.products.filter((item) => item.product_type === 'dietprogram');
        const newTrainprograms = data.products.filter((item) => item.product_type === 'trainprogram');

        setOnlinetrainings(newOnlinetrainings);
        setTrainingpasses(newTrainingpasses);
        setDietprograms(newDietprograms);
        setTrainprograms(newTrainprograms);

        DEBUG && console.log(newTrainprograms, newTrainingpasses, newOnlinetrainings, newDietprograms);
      } catch (error) {
        // Handle errors
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl, params, userAlias]);

  const [trainingpassCount, setTrainingpassCount] = useState(0);
  const [onlinetrainingCount, setOnlinetrainingCount] = useState(0);
  const [trainProgramCount, setTrainProgramCount] = useState(0);
  const [dietProgramCount, setDietProgramCount] = useState(0);

  useEffect(() => {
    if (trainprograms && trainprograms[0]) {
      setTrainProgramCount(trainprograms[0].count);
    }
    if (dietprograms && dietprograms[0]) {
      setDietProgramCount(dietprograms[0].count);
    }
    if (trainingpasses && trainingpasses[0]) {
      setTrainingpassCount(trainingpasses[0].count);
    }
    if (onlinetrainings && onlinetrainings[0]) {
      setOnlinetrainingCount(onlinetrainings[0].count);
    }
  }, [trainingpasses, onlinetrainings, trainprograms, dietprograms]);

  function gatherAndSortProducts(data) {
    const grouped = {};

    // Gather and group products from all tables by category_link or category_id
    for (const tableData of Object.values(data)) {
      for (const product of tableData.data) {
        const categoryLink = product.category_link;
        const categoryId = product.category_id;
        const categoryName = product.category_name;

        // Determine the category identifier (either category_link or category_id)
        const categoryIdentifier = categoryLink || categoryId;

        if (!grouped[categoryIdentifier]) {
          grouped[categoryIdentifier] = {
            category_link: categoryLink,
            category_id: categoryId,
            category_name: categoryName,
            products: [],
            total_clipcards: 0,
            total_programs: 0,
            total_trainingpasses: 0,
          };
        }

        grouped[categoryIdentifier].products.push(product);

        // Count specific product types for the current category
        if (product.product === 'clipcard') {
          grouped[categoryIdentifier].total_clipcards++;
        } else if (product.product === 'trainprogram' || product.product === 'dietprogram') {
          grouped[categoryIdentifier].total_programs++;
        } else if (product.product === 'trainingpass' || product.product === 'onlinetraining') {
          grouped[categoryIdentifier].total_trainingpasses++;
        }
      }
    }

    // Convert the grouped object to an array
    return Object.values(grouped);
  }

  function findObjectByName(arr, name) {
    const obj = arr.find((obj) => obj.category_link === name);
    return obj ? obj : '';
  }

  const handleBack = () => {
    DEBUG && console.log('handleBack - SportProducts.jsx');
    if (onClose === null) {
      router.back();
    } else {
      DEBUG && console.log("onClose isn't null");
      onClose(false);
    }
  };

  const handleProductClick = (params) => {
    DEBUG && console.log('handleProductClick', params);
    setShowSelectedProducts(params);
    setShowProducts(true);
    playSound('popclick', '0.5');
  };

  useEffect(() => {
    const categoryObj = findObjectByName(traincategories, params.sport);
    const categoryName = getCategoryName(params.sport, traincategories);
    setCategoryObject(categoryObj);
    setCategoryName(categoryName);
  }, [params, params.sport]);

  // MARK: Markup
  return (
    <>
      {showProducts && showSelectedProducts !== null && (
        <main className="sportproducts">
          <Products params={showSelectedProducts} onClose={setShowProducts} nav={false} alias={userAlias} />
        </main>
      )}

      {!showProducts && (
        <main id="trainer-sports" className="sports">
          {nav && <Navigation />}

          {loading ? (
            <div className="container" style={{ width: '100vw', height: '100vh' }}>
              <Loader />
            </div>
          ) : (
            <>
              <div className="categorytop">
                <div className="btn-back" onClick={handleBack}></div>
                {nav ? (
                  <h1>{fullname && <Link href={`/trainer/@${userAlias}/`}>{fullname}</Link>}</h1>
                ) : (
                  <h1>{fullname}</h1>
                )}
                <div></div>
              </div>
              {nav ? (
                <Link
                  className="hero"
                  href={`/trainer/@${userAlias}/`}
                  onMouseOver={() => playSound('tickclick', '0.5')}
                  onClick={() => playSound('popclick', '0.5')}
                >
                  <div className="hero-overlay">
                    <h2>{categoryName}</h2>
                  </div>
                  <img src={categoryObject?.category_image} alt="Hero Image" />
                </Link>
              ) : (
                <div className="hero">
                  <div className="hero-overlay">
                    <h2>{categoryName}</h2>
                  </div>
                  <img src={categoryObject?.category_image} alt="Hero Image" />
                </div>
              )}

              <div className="full-width-container">
                {trainingpassCount > 0 ? (
                  <>
                    <div className="dropdown-container">
                      {nav ? (
                        <Link
                          className="choose-sport"
                          href={`/trainer/@${userAlias}/${params.sport}/trainingpass`}
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() => playSound('popclick', '0.5')}
                        >
                          <div className="card-container item-trainingpass">
                            <div className="count-item">{trainingpasses[0].count}</div>
                            <div className="text">Träningspass</div>
                          </div>
                        </Link>
                      ) : (
                        <div
                          className="choose-sport"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() =>
                            handleProductClick({
                              slug: `%40${userAlias}`,
                              sport: params.sport,
                              products: 'trainingpass',
                            })
                          }
                        >
                          <div className="card-container item-trainingpass">
                            <div className="count-item">{trainingpasses[0].count}</div>
                            <div className="text">Träningspass</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <></>
                )}

                {onlinetrainingCount > 0 ? (
                  <>
                    <div className="dropdown-container">
                      {nav ? (
                        <Link
                          className="choose-sport"
                          href={`/trainer/@${userAlias}/${params.sport}/onlinetraining`}
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() => playSound('popclick', '0.5')}
                        >
                          <div className="card-container item-onlinetraining">
                            <div className="count-item">{onlinetrainings[0].count}</div>
                            <div className="text">Onlineträning</div>
                          </div>
                        </Link>
                      ) : (
                        <div
                          className="choose-sport"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() =>
                            handleProductClick({
                              slug: `%40${userAlias}`,
                              sport: params.sport,
                              products: 'trainingpass',
                            })
                          }
                        >
                          <div className="card-container item-onlinetraining">
                            <div className="count-item">{onlinetrainings[0].count}</div>
                            <div className="text">Onlineträning</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <></>
                )}

                {trainProgramCount > 0 ? (
                  <>
                    <div className="dropdown-container">
                      {nav ? (
                        <Link
                          className="choose-sport"
                          href={`/trainer/@${userAlias}/${params.sport}/trainprogram`}
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() => playSound('popclick', '0.5')}
                        >
                          <div className="card-container item-trainprogram">
                            <div className="count-item">{trainprograms[0].count}</div>
                            <div className="text">Träningsprogram</div>
                          </div>
                        </Link>
                      ) : (
                        <div
                          className="choose-sport"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() =>
                            handleProductClick({
                              slug: `%40${userAlias}`,
                              sport: params.sport,
                              products: 'trainprogram',
                            })
                          }
                        >
                          <div className="card-container item-trainprogram">
                            <div className="count-item">{trainprograms[0].count}</div>
                            <div className="text">Träningsprogram</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <></>
                )}

                {dietProgramCount > 0 ? (
                  <>
                    <div className="dropdown-container">
                      {nav ? (
                        <Link
                          className="choose-sport"
                          href={`/trainer/@${userAlias}/${params.sport}/dietprogram`}
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() => playSound('popclick', '0.5')}
                        >
                          <div className="card-container item-dietprogram">
                            <div className="count-item">{dietprograms[0].count}</div>
                            <div className="text">Kostprogram</div>
                          </div>
                        </Link>
                      ) : (
                        <div
                          className="choose-sport"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() =>
                            handleProductClick({
                              slug: `%40${userAlias}`,
                              sport: params.sport,
                              products: 'dietprogram',
                            })
                          }
                        >
                          <div className="card-container item-dietprogram">
                            <div className="count-item">{dietprograms[0].count}</div>
                            <div className="text">Kostprogram</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <></>
                )}
              </div>

              <div className="end-margin"></div>
            </>
          )}
        </main>
      )}
    </>
  );
});

export default SportProducts;
