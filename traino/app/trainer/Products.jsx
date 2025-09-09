'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getCategoryName, getCategoryImage, formatMoney } from '@/app/functions/functions';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/components/PlaySound';
import { getProducts } from '@/app/functions/fetchDataFunctions.js';
import Navigation from '@/app/components/Menus/Navigation';
import Link from 'next/link';
import Loader from '@/app/components/Loader';
import Product from '@/app/trainer/Product';

import './Products.css';
import { Lexend_Tera } from 'next/font/google';

export default function ProductsPage({ params, onClose = null, nav = true, alias = null }) {
  const { DEBUG, isLoggedin, userData, sessionObject, baseUrl, traincategories } = useAppState();
  const [products, setProducts] = useState([]);
  const [headerText, setHeaderText] = useState('');
  const [heroImg, setHeroImg] = useState('');
  const [loading, setLoading] = useState(true);
  const [trainerName, setTrainerName] = useState('');

  const [showSelectedProduct, setShowSelectedProduct] = useState(null);
  const [showProduct, setShowProduct] = useState(false);

  let userAliasDecoded, userAlias, userAliasEncoded;
  if (!alias) {
    userAliasDecoded = decodeURIComponent(params.alias); // Decodes %40 to @
    userAlias = userAliasDecoded.substring(1); // Skips the first character (i.e., @)
    userAliasEncoded = encodeURIComponent(userAlias); // Encodes the alias without @
  } else {
    userAlias = alias;
  }
  const router = useRouter();

  useEffect(() => {
    DEBUG && console.log('Products params -----------: ', params);
    const fetchData = async () => {
      setLoading(true);

      try {
        const data = await getProducts(userAlias);
        DEBUG && console.log('Data:', data);

        // Process the data
        const sortedProducts = gatherAndSortProducts(data);

        const productsChosenSport = sortedProducts.find((item) => item.category_link === params.sport)?.products || [];

        const productBySportAndType = productsChosenSport
          .filter((item) => item.product_type === params.products)
          .sort((a, b) => new Date(b.registered) - new Date(a.registered));

        DEBUG && console.log('productBySportAndType:', productBySportAndType);

        setProducts(productBySportAndType);

        if (productBySportAndType.length > 0) {
          setTrainerName(productBySportAndType[0].firstname + ' ' + productBySportAndType[0].lastname);
        } else {
          setTrainerName(''); // or some fallback/default
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params, params.alias]);

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

  useEffect(() => {
    setHeader();
  }, [params, params.alias]);

  function setHeader() {
    switch (params.products) {
      case 'clipcard':
        setHeaderText('Klippkort');
        setHeroImg('');
        return;
      case 'dietprogram':
        setHeaderText('Kostprogram');
        setHeroImg(
          'https://plus.unsplash.com/premium_photo-1664908219934-61b5eeb7e8ba?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        );
        return;
      case 'onlinetraining':
        setHeaderText('Onlineträning');
        setHeroImg(
          'https://images.unsplash.com/photo-1604480133435-25b86862d276?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjJ8fHNwb3J0cyUyMHRyYWluaW5nfGVufDB8fDB8fHww',
        );
        return;
      case 'trainingpass':
        setHeaderText('Träningspass');
        setHeroImg(
          'https://images.unsplash.com/photo-1683509602596-f04aca698097?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Ym9keSUyMGJ1aWxkaW5nfGVufDB8MXwwfHx8MA%3D%3D',
        );
        return;
      case 'trainprogram':
        setHeaderText('Träningsprogram');
        setHeroImg('https://traino.nu/assets/athletes-7508975_1280.jpg');
        return;
      default:
        return;
    }
  }

  const handleBack = () => {
    if (onClose === null) {
      router.back();
    } else {
      onClose(false);
    }
  };

  const handleProductClick = (params) => {
    setShowSelectedProduct(params);
    setShowProduct(true);
    playSound('popclick', '0.5');
  };

  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState('');

  useEffect(() => {
    DEBUG && console.log('Params', userAlias, params.sport, showProduct);
    const sportsName = getCategoryName(params.sport, traincategories);
    const sportsImage = getCategoryImage(params.sport, traincategories);
    setCategoryImage(sportsImage);
    setCategoryName(sportsName);
  }, [params]);

  // MARK: Markup
  return (
    <>
      {showProduct && showSelectedProduct !== null && showSelectedProduct.sport !== '' && (
        <main className="sportproducts">
          <Product params={showSelectedProduct} onClose={setShowProduct} nav={false} />
        </main>
      )}

      {!showProduct && (
        <main id="trainer-products" className="trainer-products">
          {nav && <Navigation />}
          {loading ? (
            <>
              <div className="container" style={{ width: '100vw', height: '100vh' }}>
                <Loader />
              </div>
            </>
          ) : (
            <>
              <div className="categorytop">
                <div className="btn-back" onClick={handleBack}></div>
                {nav ? (
                  <h1>{trainerName && <Link href={`/trainer/@${userAlias}/`}>{trainerName}</Link>}</h1>
                ) : (
                  <h1>{trainerName}</h1>
                )}
                <div></div>
              </div>
              {nav ? (
                <Link
                  className="hero"
                  href={`/trainer/@${userAlias}/${params.sport}/`}
                  onMouseOver={() => playSound('tickclick', '0.5')}
                  onClick={() => playSound('popclick', '0.5')}
                >
                  <div className="hero-overlay">
                    <h2>{categoryName}</h2>
                    <h3>{headerText}</h3>
                  </div>
                  <img src={categoryImage} alt={categoryName} />
                </Link>
              ) : (
                <div className="hero">
                  <div className="hero-overlay">
                    <h2>{categoryName}</h2>
                    <h3>{headerText}</h3>
                  </div>
                  <img src={categoryImage} alt={categoryName} />
                </div>
              )}

              <div className="product-list">
                {nav ? (
                  <>
                    {products &&
                      products.map((item, index) => (
                        <Link
                          key={index} // Always use a unique `key`, like `item.id` if available
                          className="product"
                          href={`/trainer/@${userAlias}/${params.sport}/${params.products}/${item.id}`}
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() => playSound('popclick', '0.5')}
                        >
                          <h3
                            className={`category-name ${
                              item.product === 'trainingpass' || item.product === 'onlinetraining'
                                ? 'icon-train'
                                : item.product === 'dietprogram' || item.product === 'trainprogram'
                                ? 'icon-dietprogram'
                                : ''
                            }`}
                          >
                            {(item.product === 'trainingpass' || item.product === 'onlinetraining') &&
                              `${item.duration}min, `}
                            {item.category_name}
                          </h3>
                          <ul className="product-details">
                            <li className="product-detail">
                              <strong className="icon-card">
                                {formatMoney(item.price)}kr
                                {item.product === 'trainingpass' || item.product === 'onlinetraining' ? '/tim' : ''}
                              </strong>
                            </li>
                            <li className="product-detail">
                              <p className="small icon-positionpoint">{item.address}</p>
                            </li>
                            {(item.product_type === 'trainprogram' || item.product_type === 'dietprogram') && (
                              <>
                                <li className="product-detail">
                                  <strong className="detail-key">
                                    {item.product_type === 'trainprogram' ? 'Antal veckor' : 'Antal tillfällen'}
                                  </strong>
                                  <p>{item.product_sessions}</p>
                                </li>
                                <li className="product-detail">
                                  <strong className="detail-key">Konversationer</strong>
                                  <p>{item.conversations}min</p>
                                </li>
                              </>
                            )}
                            <li className="product-detail">
                              <p>{item.description}</p>
                            </li>
                          </ul>
                          <div className="button">Välj</div>
                        </Link>
                      ))}
                  </>
                ) : (
                  <>
                    {products &&
                      products.map((item, index) => (
                        <div
                          key={index} // Use `item.id` if possible
                          className="product"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() =>
                            handleProductClick({
                              slug: `%40${userAlias}`,
                              sport: params.sport,
                              products: params.products,
                              id: item.id,
                            })
                          }
                        >
                          <h3
                            className={`category-name ${
                              item.product === 'trainingpass' || item.product === 'onlinetraining'
                                ? 'icon-train'
                                : item.product === 'dietprogram' || item.product === 'trainprogram'
                                ? 'icon-dietprogram'
                                : ''
                            }`}
                          >
                            {(item.product === 'trainingpass' || item.product === 'onlinetraining') &&
                              `${item.duration}min, `}
                            {item.category_name}
                          </h3>
                          <ul className="product-details">
                            <li className="product-detail">
                              <strong className="icon-card">
                                {formatMoney(item.price)}kr
                                {item.product === 'trainingpass' || item.product === 'onlinetraining' ? '/tim' : ''}
                              </strong>
                            </li>
                            <li className="product-detail">
                              <p className="small icon-positionpoint">{item.address}</p>
                            </li>
                            {(item.product_type === 'trainprogram' || item.product_type === 'dietprogram') && (
                              <>
                                <li className="product-detail">
                                  <strong className="detail-key">
                                    {item.product_type === 'trainprogram' ? 'Antal veckor' : 'Antal tillfällen'}
                                  </strong>
                                  <p>{item.product_sessions}</p>
                                </li>
                                <li className="product-detail">
                                  <strong className="detail-key">Konversationer</strong>
                                  <p>{item.conversations}min</p>
                                </li>
                              </>
                            )}
                            <li className="product-detail">
                              <p>{item.description}</p>
                            </li>
                          </ul>
                          <div className="button">Välj</div>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </>
          )}
        </main>
      )}
    </>
  );
}
