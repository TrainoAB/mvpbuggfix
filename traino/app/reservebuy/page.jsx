// THIS IS A TEMPORARY PAGE TO SHOW COMPONENT RESERVEBUY

'use client';
import { useState, useEffect } from 'react';
import ReserveBuy from '@/app/components/ReserveBuy';
import styles from './page.css';

export default function Booking() {
  const [reservebuyModal, setReservebuyModal] = useState(true);
  const popupData = {
    alias: 'fredrikberglund',
    distance: 0,
    firstname: 'Fredrik',
    id: 8193,
    age: 41,
    lastname: 'Berglund',
    address: 'Stockholm',
    latitude: 59.28325863,
    longitude: 17.8161746,
    price: 1500,
    product_id: 8193,
    rating: 2.9,
    reference: null,
    product_type: 'trainingpass', // Change here to affect the ReserveBuy layout/design
    thumbnail: `https://traino.s3.eu-north-1.amazonaws.com/${175}/profile/profile-image.webp`,
    user_id: 175,
  };

  return <main>{reservebuyModal && <ReserveBuy popupData={popupData} onClose={setReservebuyModal} />}</main>;
}
