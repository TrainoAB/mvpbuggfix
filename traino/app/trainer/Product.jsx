'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCategoryImage } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { getProducts } from '@/app/functions/fetchDataFunctions.js';
import Navigation from '@/app/components/Menus/Navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReserveBuy from '@/app/components/ReserveBuy';
import Loader from '@/app/components/Loader';

import './Product.css';

export default function IdPage({ params, onClose = null, nav = true }) {
  const { baseUrl, traincategories, sessionObject, DEBUG } = useAppState();
  const [popupData, setPopupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Access dynamic segments from params
  const userAliasDecoded = decodeURIComponent(params.alias); // e.g., "fredrikberglund"
  const userAlias = userAliasDecoded.substring(1);
  const sport = params.sport; // e.g., "cs2"
  const productType = params.products; // e.g., "dietprogram"
  const productId = params.id; // e.g., "24575"

  useEffect(() => {
    DEBUG && console.log('Params:', params);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getProducts(userAlias);
        DEBUG && console.log('API Data:', data);

        DEBUG && console.log('Params productId:', productId);

        // Log product data to inspect structure
        if (data.product_dietprogram?.data) {
          DEBUG && console.log('product_dietprogram data:', data.product_dietprogram.data);
          data.product_dietprogram.data.forEach((p) => {
            DEBUG && console.log('dietprogram Product ID:', p.id);
          });
        }

        if (data.product_onlinetraining?.data) {
          DEBUG && console.log('product_onlinetraining data:', data.product_onlinetraining.data);
          data.product_onlinetraining.data.forEach((p) => {
            DEBUG && console.log('onlinetraining Product ID:', p.id);
          });
        }
        if (data.product_trainingpass?.data) {
          DEBUG && console.log('product_trainingpass data:', data.product_trainingpass.data);
          data.product_trainingpass.data.forEach((p) => {
            DEBUG && console.log('trainingpass Product ID:', p.id);
          });
        }

        if (data.product_trainprogram?.data) {
          DEBUG && console.log('product_trainprogram data:', data.product_trainprogram.data);
          data.product_trainprogram.data.forEach((p) => {
            DEBUG && console.log('trainprogram Product ID:', p.id);
          });
        }

        // Ensure the productId matches correctly by converting both to string for comparison
        let selectedProduct = null;

        // Check the productType and find the corresponding product
        if (productType === 'trainingpass') {
          selectedProduct = data.product_trainingpass?.data.find((p) => {
            DEBUG && console.log(`Comparing ${String(p.id)} with ${String(productId)}`);
            return String(p.id) === String(productId);
          });
        } else if (productType === 'onlinetraining') {
          selectedProduct = data.product_onlinetraining?.data.find((p) => {
            DEBUG && console.log(`Comparing ${String(p.id)} with ${String(productId)}`);
            return String(p.id) === String(productId);
          });
        } else if (productType === 'trainprogram') {
          selectedProduct = data.product_trainprogram?.data.find((p) => {
            DEBUG && console.log(`Comparing ${String(p.id)} with ${String(productId)}`);
            return String(p.id) === String(productId);
          });
        } else if (productType === 'dietprogram') {
          selectedProduct = data.product_dietprogram?.data.find((p) => {
            DEBUG && console.log(`Comparing ${String(p.id)} with ${String(productId)}`);
            return String(p.id) === String(productId);
          });
        }

        // Log selected product details
        if (selectedProduct) {
          DEBUG && console.log('Selected Product:', selectedProduct);
        } else {
          DEBUG && console.log('No matching product found.');
        }

        if (selectedProduct) {
          setPopupData({
            product_type: selectedProduct.product_type,
            alias: selectedProduct.alias,
            firstname: selectedProduct.firstname,
            lastname: selectedProduct.lastname,
            age: selectedProduct.age,
            user_id: selectedProduct.user_id,
            category_link: selectedProduct.category_link,
            category_name: selectedProduct.category_name,
            id: selectedProduct.id,
            product_id: selectedProduct.product_id,
            duration: selectedProduct.duration,
            price: selectedProduct.price,
            description: selectedProduct.description || '',
            address: selectedProduct.address,
            clipcard_5_price: selectedProduct.clipcard_5_price,
            clipcard_10_price: selectedProduct.clipcard_10_price,
            clipcard_20_price: selectedProduct.clipcard_20_price,
            thumbnail: selectedProduct.thumbnail,
            conversations: selectedProduct.conversations || 0,
            product: selectedProduct.product,
            times: selectedProduct.times,
            priceId: selectedProduct.priceId,
          });
        } else {
          console.error('No product found for the given criteria. Product ID:', productId);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userAlias, productId, baseUrl, sessionObject, DEBUG]);
  if (loading) return <Loader />;

  // Fallback UI if popupData is null
  if (!popupData) {
    return (
      <div id="fourofour">
        <div className="icon-fourofour"></div>
        <h2>Produkten hittades inte</h2>
        <br />
        <Link className="button" href={`/trainer/@${userAliasDecoded}`}>
          Tillbaka
        </Link>
      </div>
    );
  }

  const handleBack = () => {
    if (onClose === null) {
      router.back();
    } else {
      onClose(false);
    }
  };

  // MARK: Markup
  return (
    <>
      <main id="trainer-productid">
        {nav && <Navigation />}
        <div className="categorytop">
          <div className="btn-back" onClick={handleBack}></div>
          <h1>{popupData.firstname + ' ' + popupData.lastname}</h1>
          <div></div>
        </div>
        <ReserveBuy popupData={popupData} onClose={handleBack} standAlone={true} />
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
          <Image
            src={getCategoryImage(sport, traincategories)}
            alt=""
            layout="fill"
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      </main>
    </>
  );
}
