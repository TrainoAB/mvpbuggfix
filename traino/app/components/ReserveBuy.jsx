'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { generateDailyFreePasses } from '@/app/components/calendarfunctions';
import { shortenText, getCategoryName } from '@/app/functions/functions';
import { useRouter } from 'next/navigation';
import { playSound } from '@/app/components/PlaySound';
import {
  addBoughtProduct,
  getSchedule,
  getUserClipcards,
  addBooking,
  hasBoughtProduct,
  isBookedPass,
} from '@/app/functions/fetchDataFunctions.js';
import Loader from '@/app/components/Loader';
import Link from 'next/link';
import Image from 'next/image';
import CheckoutContainer from './Checkout/CheckoutContainer';
import LoginModal from './LoginModal/LoginModal';

import './ReserveBuy.css';

export default function ReserveBuy({ popupData, onClose, standAlone = false }) {
  const { DEBUG, useTranslations, language, userData, baseUrl, sessionObject, isLoggedin, traincategories } =
    useAppState();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [header, setHeader] = useState('');
  const [scheduleData, setScheduleData] = useState([]);
  const [extraData, setExtraData] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectPayment, setSelectPayment] = useState(false);
  const [showCheckoutContainer, setShowCheckoutContainer] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const [day, setDay] = useState(0);
  const [productClipcards, setProductClipcards] = useState([]);
  const [userClipcards, setUserClipcards] = useState([]);

  const [paymentDone, setPaymentDone] = useState(false);
  const [startBuy, setStartBuy] = useState(false);

  const [saveItem, setSaveItem] = useState(null);

  const { translate } = useTranslations('bookbuy', language);

  const router = useRouter();

  useEffect(() => {
    DEBUG && console.log('PopupData:', popupData);
    setModalType(popupData.product_type);
    setModalData(popupData);
    // setScheduleData(popupData.times);
  }, [popupData, popupData.product_type]);

  useEffect(() => {
    if (modalType === 'dietprogram' || modalType === 'trainprogram') {
      setHeader(translate('buy', language));
      setLoading(false);
      DEBUG && console.log('Dietprogram or trainprogram...');
    } else if (modalType === 'trainingpass' || modalType === 'onlinetraining') {
      setHeader(translate('book', language));
    }
  }, [modalType]);

  const months = {
    januari: 0,
    februari: 1,
    mars: 2,
    april: 3,
    maj: 4,
    juni: 5,
    juli: 6,
    augusti: 7,
    september: 8,
    oktober: 9,
    november: 10,
    december: 11,
  };

  function parseSwedishDate(str) {
    // Exempel: "onsdag 3 september"
    const parts = str.split(' ');
    const day = parseInt(parts[1], 10);
    const month = months[parts[2].toLowerCase()];
    const year = new Date().getFullYear(); // du kan byta om du vill ha specifikt år
    return new Date(year, month, day);
  }

  // MARK: Fetch Schedule
  const fetchSchedule = async () => {
    console.log('PopupData', popupData);
    setSelectedTime(null);
    const queryParams = new URLSearchParams({
      id: popupData.user_id,
      cat: popupData.category_link,
      prod: popupData.id,
      dur: popupData.duration,
    });

    DEBUG && console.log(queryParams.toString());

    setLoading(true);
    try {
      const data = await getSchedule(queryParams);
      DEBUG && console.log('ReserveBuy Fetch data (RAW from PHP):', data);
      DEBUG && console.log('ReserveBuy pass_booked sample:', data.pass_booked?.[0]);

      const newData = generateDailyFreePasses(data);
      DEBUG && console.log('New Schedule Data:', newData);
      setExtraData(newData.details);

      // Must sort it once again to correct the date order
      const sorted = newData.passes.sort((a, b) => {
        return parseSwedishDate(a.date) - parseSwedishDate(b.date);
      });

      // Must remove duplicates of dates and merge together available passes
      const merged = sorted.reduce((acc, curr) => {
        const found = acc.find((item) => item.date === curr.date);
        if (found) {
          // slå ihop data utan dubletter
          const set = new Set([...found.data, ...curr.data]);
          found.data = [...set];
        } else {
          acc.push({ ...curr, data: [...curr.data] });
        }
        return acc;
      }, []);

      // Set the new merged passes into schedule data
      setScheduleData(merged);
      DEBUG && console.log('Pass generated data:', newData);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      alert(translate('unexpectederror', language));
    } finally {
      setLoading(false);
    }

    // Get clipcards
    try {
      setLoading(true);

      const userIdParam = userData.current && userData.current.id ? `&user_id=${userData.current.id}` : '';
      const data = await getUserClipcards(popupData.id, userIdParam);
      DEBUG && console.log('Clipcards Data:', data);

      setUserClipcards(data.bought);
      setProductClipcards(data.clipcards);
    } catch (error) {
      console.error('Error fetching clipcards:', error);
      alert(translate('unexpectederror', language));
    } finally {
      setLoading(false);
    }
  };

  // MARK: Fetch schedule
  useEffect(() => {
    if (modalType === 'trainingpass' || modalType === 'onlinetraining') {
      fetchSchedule();
    }
  }, [modalType, onClose]);

  const handleLoginOpen = () => {
    setIsLoginOpen(true);
    DEBUG && console.log('LoginModal opened', isLoginOpen);
  };

  const handleLoginClose = () => {
    setIsLoginOpen(false);
    DEBUG && console.log('LoginModal closed');
  };

  const handleLoginSuccess = () => {
    if (modalType === 'trainingpass' || modalType === 'onlinetraining') {
      fetchSchedule();
    }
  };

  const handleSetProgram = (item) => {
    playSound('popclick', '0.5');
    setSelectedProgram(item);
    DEBUG && console.log(item);
  };

  const handleBookTime = () => {
    const userId = userData.current.id;

    // Convert dates to local time strings for consistent backend processing
    const startDate = new Date(selectedTime.start);
    const endDate = new Date(selectedTime.end);

    // Format dates as YYYY-MM-DD HH:MM:SS in local timezone
    const formatLocalDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const newSaveItem = {
      user_id: userId,
      booking: {
        ...selectedTime,
        // Override start and end with local datetime format
        start: formatLocalDateTime(startDate),
        end: formatLocalDateTime(endDate),
        price: popupData.price,
        product_id: popupData.id,
        product_type: popupData.product_type,
        trainer_id: popupData.user_id,
        category_link: popupData.category_link,
        duration: popupData.duration,
        // Ensure these fields are present from selectedTime or set defaults
        pass_set_id: selectedTime.pass_set_id || null,
        pass_repeat_id: selectedTime.pass_repeat_id || null,
        pass_amount: selectedTime.pass_amount || 1,
        category_id: selectedTime.category_id || null,
        category_name: selectedTime.category_name || null,
      },
    };

    setSaveItem(newSaveItem);

    DEBUG &&
      console.log('Created saveItem with formatted dates:', {
        start: formatLocalDateTime(startDate),
        end: formatLocalDateTime(endDate),
        originalStart: selectedTime.start,
        originalEnd: selectedTime.end,
      });

    // Use the actual selected training pass date instead of today's date
    const selectedDate = new Date(selectedTime.start);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    const seconds = String(selectedDate.getSeconds()).padStart(2, '0');
    const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const newSelectedProducts = [
      {
        name: `${popupData.alias} ${popupData.id} ${popupData.product_type} ${popupData.category_link} ${popupData.duration}`,
        priceId: popupData.priceId,
        product_type: popupData.product_type,
        amount: 1,
        price: popupData.price,
        date: dateString,
        time: popupData.duration,
        duration: popupData.duration,
        location: popupData.address,
        product_id: popupData.id,
        user_id: parseInt(userData.current.id),
        user_email: userData.current.email,
        currency: 'sek',
        trainer_id: popupData.user_id,
      },
    ];

    setSelectedProducts(newSelectedProducts);
  };

  // MARK: Handle Booking
  const handleBooking = async () => {
    if (isLoggedin.current && userData.current.usertype === 'trainer') {
      alert('Trainers can not book passes, they can only host them.');
      return;
    }

    DEBUG && console.log(isLoggedin.current, userData.current);
    if (!isLoggedin.current && (!userData.current || userData.current.usertype !== 'trainee')) {
      handleLoginOpen();
      return;
    }

    if (!selectedTime || !selectedTime.start) {
      alert(translate('book_mustchooseatimebeforebooking', language));
      setButtonLoading(false);
      return;
    }

    DEBUG && console.log('handleBooking');

    setButtonLoading(true);

    DEBUG && console.log(selectedTime);

    const productId = popupData.id;

    const selectedDate = new Date(selectedTime.start);
    // Use more robust date formatting instead of toLocaleDateString
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const bookedDate = `${year}-${month}-${day}`;
    DEBUG && console.log('Selected Date:', bookedDate);

    const getTimeFromDateTime = (dateTime) => {
      const date = new Date(dateTime);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };

    const startTime = getTimeFromDateTime(selectedTime.start);
    const endTime = getTimeFromDateTime(selectedTime.end);
    DEBUG && console.log('Selected Time Range (HH:MM:SS):', startTime, '-', endTime);

    const now = new Date();
    const selectedStart = new Date(selectedTime.start);
    if (selectedStart < now) {
      alert(
        language === 'sv'
          ? 'Passet har redan startat och kan inte bokas.'
          : 'The pass has already started and cannot be booked.',
      );
      setButtonLoading(false);
      return;
    }

    try {
      // Enhanced overlap checking - check if any booking conflicts with the time range
      const bookingCheck = await isBookedPass(productId, bookedDate, startTime, endTime);
      DEBUG && console.log('Booking check result:', bookingCheck);

      if (bookingCheck.is_booked) {
        const conflictInfo = bookingCheck.conflicting_booking;
        const overlapType = bookingCheck.overlap_type;

        // Handle multilingual messages from backend
        let alertMessage = '';
        if (bookingCheck.message && typeof bookingCheck.message === 'object') {
          // Use the user's language preference or fallback to English
          alertMessage = bookingCheck.message[language] || bookingCheck.message['en'] || 'Time slot is already booked.';
        } else if (overlapType === 'time_range_conflict') {
          const conflictMessage =
            language === 'sv'
              ? `Tidskonflikt! Din valda tid (${startTime} - ${endTime}) överlappar med en befintlig bokning (${conflictInfo.starttime} - ${conflictInfo.endtime}).`
              : `Time slot conflict! Your selected time (${startTime} - ${endTime}) overlaps with an existing booking (${conflictInfo.starttime} - ${conflictInfo.endtime}).`;
          alertMessage = conflictMessage;
        } else {
          const bookedMessage =
            language === 'sv'
              ? 'Passet är redan bokat vid denna exakta tid.'
              : 'The pass is already booked at this exact time.';
          alertMessage = bookedMessage;
        }
        alert(alertMessage);
        return;
      }
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
    } finally {
      setButtonLoading(false);
    }

    if (!selectedTime) {
      alert(translate('book_mustchooseatimebeforebooking', language));
      return;
    }

    handleBookTime();

    setSelectPayment(true);
    setShowCheckoutContainer(true);
  };

  // MARK: Choose Payment
  const handleChoosePayment = () => {
    DEBUG && console.log(isLoggedin.current, userData.current);
    if (!isLoggedin.current && (!userData.current || userData.current.usertype !== 'trainee')) {
      handleLoginOpen();
      // alert(translate('book_book_youmustbeloggedintobeabletobook', language));
      return;
    }
    if (!selectedTime) {
      alert(translate('book_mustchooseatimebeforebooking', language));
      return;
    }

    // Some payment logic here
    DEBUG && console.log('Choose payment');
    setSelectPayment(true);
  };

  function extractTimeRange(dateString1, dateString2) {
    const extractTime = (dateString) => {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const time1 = extractTime(dateString1);
    const time2 = extractTime(dateString2);

    return `${time1} - ${time2}`;
  }

  const handleSelectTime = (date) => {
    playSound('popclick', '0.5');
    const newDate = {
      ...date,
      ...extraData,
    };
    setSelectedTime(newDate);
    DEBUG && console.log('Selected Time:', newDate);
  };

  const handlePrevClick = () => {
    if (day > 0) {
      playSound('popclick', '0.5');
      setDay(day - 1);
    }
  };

  const handleNextClick = () => {
    if (day < scheduleData.length - 1) {
      playSound('popclick', '0.5');
      setDay(day + 1);
    }
  };

  const getProductType = (type) => {
    if (type === 'trainingpass') {
      return translate('trainingpass', language);
    } else if (type === 'onlinetraining') {
      return translate('onlinetraining', language);
    } else {
      return type;
    }
  };

  // MARK: Buy Clipcard
  const handleBuyClipcard = (item) => {
    playSound('popclick', '0.5');
    DEBUG && console.log(isLoggedin.current, userData.current);
    if (!isLoggedin.current && (!userData.current || userData.current.usertype !== 'trainer')) {
      setIsLoginOpen(true);
      return;
    }

    const newItem = { ...item };
    newItem.buyer_id = userData.current.id;
    newItem.buyer_email = userData.current.email;

    DEBUG && console.log('Buy clipcard newItem:', newItem);

    // Use more robust date formatting that works on all browsers
    const clipcardDate = new Date();
    const clipcardYear = clipcardDate.getFullYear();
    const clipcardMonth = String(clipcardDate.getMonth() + 1).padStart(2, '0');
    const clipcardDay = String(clipcardDate.getDate()).padStart(2, '0');
    const clipcardHours = String(clipcardDate.getHours()).padStart(2, '0');
    const clipcardMinutes = String(clipcardDate.getMinutes()).padStart(2, '0');
    const clipcardSeconds = String(clipcardDate.getSeconds()).padStart(2, '0');
    const clipcardDateString = `${clipcardYear}-${clipcardMonth}-${clipcardDay} ${clipcardHours}:${clipcardMinutes}:${clipcardSeconds}`;

    const clipcardSelectedProducts = [
      {
        name: `${popupData.alias} ${popupData.id} ${popupData.product_type} ${popupData.category_link} ${popupData.duration}`,
        priceId: popupData.priceId,
        product_type: 'clipcard',
        clipcard_amount: item.amount,
        total: item.total,
        product_id_link: item.item.product_id_link,
        amount: 1,
        price: item.total,
        date: clipcardDateString,
        duration: popupData.duration,
        // location: popupData.address,
        product_id: popupData.id,
        user_id: parseInt(userData.current.id),
        user_email: userData.current.email,
        currency: 'sek',
        trainer_id: popupData.user_id, // TODO: Make sure this is right and shouldnt be trainer_id
      },
    ];
    DEBUG && console.log(clipcardSelectedProducts);

    setSelectedProducts(clipcardSelectedProducts);
    setShowCheckoutContainer(true);
  };

  // MARK: Pay Clipcard
  const handleSelectPayClipcard = () => {
    DEBUG && console.log('Pay with clipcard');

    const payClipcard = async () => {
      setLoading(true);
      try {
        const clipcardItem = {
          clipcard_id: userClipcards.id,
          user_id: userClipcards.user_id,
          product_id: userClipcards.product_id,
          booking: {
            ...selectedTime,
            product_type: popupData.product_type,
          },
        };

        DEBUG && console.log('Using clipcard...', clipcardItem);

        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/clipcard/use`,
            method: 'POST',
            body: JSON.stringify(clipcardItem),
          }),
        });

        const data = await response.json();

        DEBUG && console.log('ReserveBuy use clipcard response:', data);
        const newClipcards = { ...userClipcards };
        newClipcards.bought.clipcard_amount -= 1;
        setUserClipcards(newClipcards);

        alert(translate('book_clipcardhasbeenusedsuccessfully', language));
      } catch (error) {
        console.error('ReserveBuy Error use clipcard:', error);
        alert(translate('book_erroroccuredwhiletryingtouseclipcard', language));
      } finally {
        setLoading(false);
      }
    };

    payClipcard();
  };

  // MARK: Pay Money
  const handleSelectPayMoney = () => {
    setLoading(true);
    DEBUG && console.log('Pay with money');

    // Implement actual payment logic here
    setTimeout(() => {
      setLoading(false);
      DEBUG && console.log('Payment processing completed.');
      // alert(translate('book_paymenthasbeencompleted', language));
      handleBookTime();
      setShowCheckoutContainer(true);
      setSelectPayment(false);
    }, 2000);
  };

  // MARK: Handle Buy
  const handleBuy = async () => {
    if (isLoggedin.current && userData.current.usertype === 'trainer') {
      alert('Trainers can not buy products, they can only sell them.');
      return;
    }

    setButtonLoading(true);
    DEBUG && console.log(isLoggedin.current, userData.current);

    if (!isLoggedin.current && (!userData.current || userData.current.usertype !== 'trainee')) {
      handleLoginOpen();
      setButtonLoading(false);
      return;
    }

    const userId = userData.current.id;
    const productId = popupData.id;

    if (!userId || !productId) {
      console.error('User ID or Product ID not found:', userId, productId);
      return;
    }

    try {
      // Check if the product is already bought
      const { has_bought } = await hasBoughtProduct(userId, productId);
      DEBUG && console.log('Has bought:', has_bought);

      if (has_bought) {
        alert('You have already bought this product, and can therefor not buy it again.');
        setButtonLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking if product is bought:', error);
    } finally {
      setButtonLoading(false);
    }

    // Proceed if the product has not been bought
    console.log('Proceeding with purchase...');

    DEBUG && console.log('Handle buy');
    setStartBuy(true);

    // Use more robust date formatting that works on all browsers
    const buyDate = new Date();
    const buyYear = buyDate.getFullYear();
    const buyMonth = String(buyDate.getMonth() + 1).padStart(2, '0');
    const buyDay = String(buyDate.getDate()).padStart(2, '0');
    const buyHours = String(buyDate.getHours()).padStart(2, '0');
    const buyMinutes = String(buyDate.getMinutes()).padStart(2, '0');
    const buySeconds = String(buyDate.getSeconds()).padStart(2, '0');
    const buyDateString = `${buyYear}-${buyMonth}-${buyDay} ${buyHours}:${buyMinutes}:${buySeconds}`;

    const buySelectedProducts = [
      {
        name: `${popupData.alias} ${popupData.id} ${popupData.product_type} ${popupData.category_link} ${popupData.duration}`,
        priceId: popupData.priceId,
        product_type: popupData.product_type,
        amount: 1,
        price: popupData.price,
        date: buyDateString,
        duration: popupData.duration,
        // location: popupData.address,
        product_id: popupData.id,
        user_id: parseInt(userData.current.id),
        user_email: userData.current.email,
        currency: 'sek',
        trainer_id: popupData.user_id, // TODO: Make sure this is right and shouldnt be trainer_id
      },
    ];
    DEBUG && console.log(buySelectedProducts);
    setSelectedProducts(buySelectedProducts);
    setShowCheckoutContainer(true);
    setButtonLoading(false);
  };

  const handleBack = () => {
    router.back();
  };

  // Create a NumberFormat instance for the locale you want
  const formatter = new Intl.NumberFormat('sv-SE'); // Changed to Swedish locale

  // Render correct content depending on product_type
  // MARK: Render content
  const renderContent = () => {
    DEBUG && console.log('modalType:', modalType);
    DEBUG && console.log('popupData in Render:', popupData);
    DEBUG && console.log('scheduleData:', scheduleData);
    DEBUG && console.log('catergory_link:', popupData.category_link);

    switch (modalType) {
      case 'dietprogram':
        return (
          <div>
            <div className="productinfo">
              <div className="details">
                <div className="sport">
                  {scheduleData && scheduleData.length > 0
                    ? getCategoryName(scheduleData[0].data[0].category_link, traincategories)
                    : getCategoryName(popupData.category_link, traincategories)}
                </div>
                <div className="producttype">
                  {popupData.product_type === 'dietprogram'
                    ? translate('dietprogram', language)
                    : popupData.product_type === 'trainprogram'
                    ? translate('trainprogram', language)
                    : popupData.product_type}
                </div>
                <div className="place">{popupData.address}</div>
                <div className="price">{formatter.format(popupData.price) + 'kr'}</div>
                <p>{shortenText(popupData.description, 200)}</p>
              </div>
              <p className="description">
                {scheduleData && scheduleData.length > 0 ? scheduleData[0].data[0].description : ''} {/* what? */}
              </p>
            </div>
            <br />

            <div className="buttons">
              <button className="button onlyborder" onClick={() => onClose(false)}>
                {translate('cancel', language)}
              </button>

              <button className="button" onClick={handleBuy}>
                {isLoggedin.current ? translate('buy', language) : translate('login', language)}
              </button>
            </div>
          </div>
        );
      //MARK: Trainprogram
      case 'trainprogram':
        return (
          <div>
            <div className="productinfo">
              <div className="details">
                <div className="sport">{getCategoryName(popupData.category_link, traincategories)}</div>

                <div className="producttype">
                  {popupData.product_type === 'dietprogram'
                    ? translate('dietprogram', language)
                    : popupData.product_type === 'trainprogram'
                    ? translate('trainprogram', language)
                    : popupData.product_type}
                </div>

                <div className="place">{popupData.address}</div>
                <div className="price">{formatter.format(popupData.price) + 'kr'}</div>
              </div>
              <p className="description">{popupData.description || ''}</p>
              <br />
            </div>
            <br />
            <div className="buttons">
              <button className="button onlyborder" onClick={() => onClose(false)}>
                {translate('cancel', language)}
              </button>
              {buttonLoading ? (
                <button className="button" disabled style={{ textTransform: 'capitalize' }}>
                  {translate('loading', language)}...
                </button>
              ) : (
                <button className="button" onClick={handleBuy}>
                  {isLoggedin.current ? translate('buy', language) : translate('login', language)}
                </button>
              )}
            </div>
          </div>
        );
      //MARK: Trainingpass and Onlinetraining
      case 'trainingpass':
      case 'onlinetraining':
        return (
          <div>
            <div className="productinfo">
              <div className="details">
                <div className="sport">
                  {(popupData &&
                    popupData.category_link &&
                    getCategoryName(popupData.category_link, traincategories)) ||
                    ''}
                </div>
                <div className="producttype">
                  {`${
                    popupData.product_type === 'trainingpass'
                      ? translate('trainingpass', language)
                      : popupData.product_type === 'onlinetraining'
                      ? translate('onlinetraining', language)
                      : popupData.product_type
                  }, ${popupData.duration}min`}
                </div>

                <div className="place">{popupData.address}</div>
                <div className="price">{formatter.format(popupData.price)}kr</div>
                <p>{shortenText(popupData.description, 200)}</p>
              </div>
              <p className="description">
                {scheduleData && scheduleData.length > 0 ? scheduleData[0].data[0].description : ''}
              </p>
              {/* {isLoggedin.current ? (
                <>
                  {userClipcards && userClipcards.clipcard_amount ? (
                    <div className="clipcards">
                      <strong>{userClipcards.clipcard_amount}x</strong>{' '}
                      {translate('book_clipcardsleftforthispass', language)}.
                    </div>
                  ) : (
                   
                     <div className="small">{translate('book_donthaveclipcardsforsexercise', language)}</div>
                  
                  )}
                </>
              ) : (
             
               <div className="small">{translate('book_loggedintoseeclipcards', language)}.</div> 
              
              )} 
              {productClipcards && productClipcards.length > 0 && (
                <div className="clipcardlist">
                  <div>
                    {productClipcards.map((item, index) => {
                      // Function to handle rendering clipcard price information
                      const renderClipcardInfo = (price, clipAmount) => {
                        if (price !== null) {
                          const priceDifference = popupData.price - price;
                          const totalSavings = (popupData.price - price) * clipAmount;
                          const total = price * clipAmount;

                          return (
                            <div
                              key={`${index}${clipAmount}`}
                              className="clipcarditem"
                              onMouseOver={() => playSound('tickclick', '0.5')}
                              onClick={() => handleBuyClipcard({ item, amount: clipAmount, price, total })}
                            >
                              <div className="icon-clipcard">
                                {clipAmount}
                                <span>x</span>
                              </div>
                              <div className="clipcardinfo">
                                <h4>{formatter.format(item[`clipcard_${clipAmount}_price`])} Konversation *</h4>
                                <div className="save">
                                  <span>
                                    {formatter.format(total)}kr {translate('total', language).toLowerCase()}
                                  </span>
                                  , {translate('save', language).toLowerCase()} ({formatter.format(priceDifference)}
                                  kr), ({formatter.format(totalSavings)}kr {translate('total', language).toLowerCase()})
                                </div>
                              </div>

                              <button className="button">{translate('buy', language)}</button>
                            </div>
                          );
                        }
                        return null;
                      };

                      return (
                        <>
                          <div key={index}>
                            {renderClipcardInfo(item.clipcard_5_price, 5)}
                            {renderClipcardInfo(item.clipcard_10_price, 10)}
                            {renderClipcardInfo(item.clipcard_20_price, 20)}
                          </div>
                          <p className="small">* {translate('book_valid24months', language)}</p>
                        </>
                      );
                    })}
                  </div>
                </div>
              )}
              */}
            </div>
            <br />
            <div className="text-center">
              <h3>{translate('book_availabletimes', language)}</h3>
              <p className="smaller">{translate('book_showavailabletimes', language)}</p>
            </div>
            {scheduleData && scheduleData.length > 0 ? (
              <div className="schedule">
                <div className="scheduleheader">
                  <button
                    className="prev"
                    onClick={handlePrevClick}
                    onMouseOver={() => playSound('tickclick', '0.5')}
                  ></button>
                  <div className="date">{scheduleData[day].date}</div>
                  <button
                    className="next"
                    onClick={handleNextClick}
                    onMouseOver={() => playSound('tickclick', '0.5')}
                  ></button>
                </div>
                <div className="passgrid">
                  {scheduleData[day].data.map((date, index) => (
                    <div
                      className={`passitem ${selectedTime?.start === date.start ? 'active' : ''}`}
                      key={index}
                      onMouseOver={() => playSound('tickclick', '0.5')}
                      onClick={() => handleSelectTime(date)}
                    >
                      <div className="time">{extractTimeRange(date.start, date.end)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-schedule">
                <p>{translate('book_noavailabletimes', language)}</p>
              </div>
            )}
            <div className="buttons">
              <button className="button onlyborder" onClick={() => onClose(false)}>
                {translate('cancel', language)}
              </button>
              {/* {userClipcards && userClipcards.clipcard_amount > 0 ? (
                <button className="button" onClick={handleChoosePayment}>
                  {isLoggedin.current ? translate('book', language) : translate('login', language)}
                </button>
              ) : (
                <button className="button" onClick={handleBooking}>
                  {isLoggedin.current ? translate('book', language) : translate('login', language)}
                </button>
              )} */}
              <button className="button" onClick={handleBooking}>
                {isLoggedin.current ? translate('book', language) : translate('login', language)}
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <h1>{translate('error', language)}</h1>
            <p>{translate('unexpectederror', language)}.</p>
          </div>
        );
    }
  };

  useEffect(() => {
    if (paymentDone) {
      onClose(false);
      setPaymentDone(false);
      setStartBuy(false);
    }
  }, [paymentDone]);

  // MARK: Markup
  return (
    <>
      {showCheckoutContainer && (
        <CheckoutContainer
          onClose={setShowCheckoutContainer}
          type="checkout"
          selectedProducts={selectedProducts}
          paymentDone={paymentDone}
          setPaymentDone={setPaymentDone}
          saveItem={saveItem}
        />
      )}
      {!startBuy && (
        <>
          {/*   {!loading && selectPayment && userClipcards && userClipcards.clipcard_amount > 0 && (
            <div className="choosepayment-container">
              <div className="choosepayment">
                <h2>{translate('book_paywith', language)}</h2>
                <div
                  className="selectpayment"
                  onMouseOver={() => playSound('tickclick', '0.5')}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSelectPayClipcard();
                  }}
                >
                  <div className="payment clipcard">
                    <h3>{translate('clipcard', language)}</h3>
                    <p>
                      <strong>{userClipcards.clipcard_amount}x</strong> {translate('book_left', language)}
                    </p>
                  </div>
                  <div
                    className="payment money"
                    onMouseOver={() => playSound('tickclick', '0.5')}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelectPayMoney();
                    }}
                  >
                    <h3>{translate('book_money', language)}</h3>
                    <p>{translate('book_cardpaypal', language)}</p>
                  </div>
                </div>
                <button
                  className="button onlyborder"
                  onClick={() => {
                    setSelectPayment(false);
                  }}
                >
                  {translate('cancel', language)}
                </button>
              </div>
              <div
                className="darkoverlay"
                onClick={() => {
                  setSelectPayment(false);
                }}
              ></div>
            </div>
          )} */}

          <main id="booking" className={!standAlone ? `` : `standalone`}>
            {/* MARK: Login Modal */}
            {isLoginOpen && (
              <LoginModal
                isOpen={isLoginOpen}
                onClose={handleLoginClose}
                onLoginSuccess={handleLoginSuccess}
                loginModalType="modal"
              />
            )}
            <div className="bookingcontainer">
              <div className="categorytop">
                <div className="btn-back" onClick={() => onClose(false)}></div>
                <h1>{header}</h1>
              </div>
              {loading ? (
                <div className="scrollcontain">
                  <div className="content">
                    <Loader />
                  </div>
                </div>
              ) : (
                <div className="scrollcontain">
                  <div className="content">
                    <Link
                      href={`/trainer/@${modalData.alias}`}
                      className="trainerinfo"
                      onMouseOver={() => playSound('tickclick', '0.5')}
                      onClick={() => playSound('popclick', '0.5')}
                    >
                      <div className="thumb">
                        <Image
                          src={
                            modalData.thumbnail === 1
                              ? `https://traino.s3.eu-north-1.amazonaws.com/${modalData.user_id}/profile/profile-image.webp`
                              : '/assets/icon-profile.svg'
                          }
                          alt=""
                          width={100}
                          height={100}
                          style={{ objectFit: 'cover' }}
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <div className="alias">@{modalData.alias}</div>
                        <div className="name">{`${modalData.firstname} ${modalData.lastname}`}</div>
                        {modalData.age !== null && modalData.age !== undefined && (
                          <div className="age">{`${modalData.age} ${translate('years', language).toLowerCase()}`}</div>
                        )}
                      </div>
                    </Link>
                    {modalType !== 'checkout' && renderContent()}
                  </div>
                </div>
              )}
            </div>
            {standAlone ? (
              <div className="darkoverlay" onClick={handleBack}></div>
            ) : (
              <div className="darkoverlay" onClick={() => onClose(false)}></div>
            )}
          </main>
          {modalType === 'checkout' && renderContent()}
        </>
      )}
    </>
  );
}
