'use client';

import GoBackButton from '../components/GoBackButton';
import NotificationCard from '../components/NotificationCard';
import Image from 'next/image';
import Link from 'next/link';
import { rewardProductListData } from '../mock-data.js';
import { userList } from '../mock-data.js';

import RectangleButton from '../components/RectangleButton';
import { useState, useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import './page.css';

export default function OrderConfirmation() {
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [isAllDataFoundYet, setIsAllDataFoundYet] = useState(false);

  const searchParams = useSearchParams();
  const selectedProductId = searchParams.get('selectedProductId');
  const userId = searchParams.get('userId');

  const handleButtonClick = () => {
    setIsNotificationVisible(true);
  };

  const checkIfallDataIsFound = () => {
    if (selectedProductId && userId) {
      setIsAllDataFoundYet(true);
    }
  };

  useEffect(() => {
    console.log('useEffect for selectedProductId and userId');
    console.log('selectedProductId:', selectedProductId);
    console.log('userId:', userId);
    if (selectedProductId && userId) {
      const product = rewardProductListData.find((p) => p.id === parseInt(selectedProductId));
      setSelectedProduct(product);
      const foundUser = userList.find((u) => u.id === parseInt(userId));
      setUser(foundUser);
    }
    checkIfallDataIsFound();
  }, [selectedProductId, userId]);

  useEffect(() => {
    console.log('Notification visibility changed:', isNotificationVisible);
  }, [isNotificationVisible]);

  if (!isAllDataFoundYet) {
    return <div>Laddar...</div>;
  }

  return (
    <div id="order-confirmation">
      <Link href="../traino-points">
        <GoBackButton />
      </Link>
      <div className="container-main">
        <h3 className="main-header">Tack för att du använder Traino!</h3>
        <p className="main-subheader">Din belöning kommer att skickas till ett postombud nära dig.</p>
        <hr />
        <div className="container-reward-all-products">
          <p className="subheader-category">Din belöning</p>
          {selectedProduct ? (
            <div className="container-reward-single-product">
              <div className="subcontainer-left">
                <Image width={100} height={100} src={selectedProduct.imgUrl} alt={selectedProduct.name} />
                <span className="product-text">
                  {selectedProduct.name}, {selectedProduct.shortDescribingText}
                </span>
              </div>
              <div className="subcontainer-right">
                <p className="product-quantity">&nbsp;1st</p>
              </div>
              <br />
            </div>
          ) : (
            <p>Ingen produkt vald.</p>
          )}
          <hr />
        </div>
        <div className="container-adress-and-delivery">
          <div className="customer-adress">
            <p className="subheader-adress-and-delivery">Postadress</p>
            <p>{user.streetAdress}</p>
            <p>
              {user.zipCode} {user.city}
            </p>
          </div>
          <div className="estimated-delivery-date">
            <p className="subheader-adress-and-delivery">Beräknad leverans</p>
            <p>Om en minut</p>
          </div>
        </div>
        <RectangleButton text="Skicka" onClick={handleButtonClick} />
      </div>
      {isNotificationVisible && (
        <div className="container-notification-card-overlay">
          <NotificationCard
            imageSrc={'/assets/checked-circle.jpg'}
            title="Tack!"
            subTitle=""
            text="Du kommer få ett mail när din
                                vara finns att hämta ut via ditt
                                närmaste postombud."
            linkUrl="../traino-points"
          />
        </div>
      )}
    </div>
  );
}
