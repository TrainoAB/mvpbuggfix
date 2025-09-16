'use client';
import React, { useEffect, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { Header_DisplayButton } from '@/app/components/Header_DisplayButton';
import { InformationModal } from '@/app/components/InformationModal';
import { useRouter } from 'next/navigation';
import UpdateStripeID from '@/app/components/UpdateStripeID';
import { getUserDetailsAlias, formatDateSwedish } from '@/app/functions/functions';
import { set } from 'date-fns';

import Loader from '@/app/components/Loader';
import Navigation from '@/app/components/Menus/Navigation';

import ScheduleProduct from '@/app/components/Calendar/ScheduleProduct/ScheduleProduct';
import Bookings from './Bookings';

import './page.css';
import { getStripeId } from '@/app/functions/fetchDataFunctions';

export default function Schedule({ params }) {
  const { sessionObject, baseUrl, DEBUG, userData, useTranslations, language } = useAppState();
  const [createStripeLoading, setCreateStripeLoading] = useState(false);
  const [display, setDisplay] = useState('Dagar');
  const [bookedData, setBookedData] = useState([]);
  const [originalBookedData, setOriginalBookedData] = useState([]); // Maybe not using anymore?
  const [loading, setLoading] = useState(true);

  const [stripeId, setStripeId] = useState(null);
  const router = useRouter();

  const { translate } = useTranslations('schedule', language);

  const firstTime = {
    header: translate('first_title', language),
    text: translate('first_text', language),
  };

  useEffect(() => {
    setLoading(true);

    const getUserStatus = async () => {
      const userAlias = decodeURIComponent(params.alias).startsWith('@')
        ? decodeURIComponent(params.alias).slice(1)
        : decodeURIComponent(params.alias);

      try {
        const userDetails = await getUserDetailsAlias(userAlias);
        DEBUG && console.log('UserDetails User ID:', userDetails.id);

        return userDetails.id; // return the user ID to be used in the next steps
      } catch (error) {
        DEBUG && console.log('Error fetching user details:', error.message);
        setLoading(false); // Stop loading in case of error
      }
    };

    const checkUserStatus = async (user_id) => {
      try {
        DEBUG && console.log('Checking user status...');

        const responseStripeId = await getStripeId(user_id);
        DEBUG && console.log('Raw Response from getStripeId:', responseStripeId);

        DEBUG && console.log('User status:', responseStripeId);
        setStripeId(responseStripeId);
      } catch (error) {
        DEBUG && console.log('Error in checkUserStatus:', error.message);
      }
    };

    const fetchSchedule = async (user_id) => {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/schedule/?bookedonly=true&id=${user_id}`,
            method: 'GET',
          }),
        });

        DEBUG && console.log('ScheduleResponse:', response);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        DEBUG && console.log('Schedule data:', data);

        if (data.error) {
          throw new Error(data.error);
        } else if (data.message) {
          alert(data.message);
        } else {
          const updatedData = data.map((booking) => ({
            ...booking,
            userShowedUp: false,
            showCancelMenu: false,
          }));
          setBookedData(updatedData);
          DEBUG && console.log('Fetched bookings', updatedData);
          DEBUG &&
            console.log('Raw booking time data sample:', {
              starttime: updatedData[0]?.starttime,
              endtime: updatedData[0]?.endtime,
              starttime_type: typeof updatedData[0]?.starttime,
              endtime_type: typeof updatedData[0]?.endtime,
            });
        }
      } catch (error) {
        DEBUG && console.log(error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchData = async () => {
      try {
        const userId = await getUserStatus();
        if (!userId) throw new Error('User ID is undefined');

        DEBUG && console.log('User ID: ', userId);

        await checkUserStatus(parseInt(userId));
        await fetchSchedule(userId);
      } catch (error) {
        DEBUG && console.log('Error in fetchData:', error.message);
        setLoading(false); // Ensure loading state is updated
      }
    };

    fetchData();
  }, []);

  // async function handleCreateStripe() {
  //   setCreateStripeLoading(true);
  //   try {
  //     const data = await getStripeUrl(userData.current.email, userData.current.id);

  //     if (data) {
  //       DEBUG && console.log('Opening URL:', data);
  //       window.open(data, '_blank');
  //     } else {
  //       DEBUG && console.log('No URL found in response:', data);
  //     }
  //     // Then, check if data.url exists and open it in a new tab
  //     if (data) {
  //       window.open(data, '_blank'); // Open the URL in a new tab with '_blank'
  //     }

  //     DEBUG && console.log('API call succeeded:', data);
  //   } catch (error) {
  //     DEBUG && console.log('API call failed:', error.message);
  //   } finally {
  //     setCreateStripeLoading(false);
  //   }
  // }

  const showLatestCreatedProduct = false;

  useEffect(() => {
    DEBUG && console.log('bookedData:', bookedData);
  }, [bookedData]);

  const handleBack = () => {
    router.back();
  };

  // MARK: Markup
  return (
    <main id="schedulepage">
      <Navigation />
      <InformationModal data={firstTime} pageName="schedulepage" />
      <div className="categorytop">
        <div className="btn-back" onClick={handleBack}></div>
        <h1>{translate('schedule', language)}</h1>
        <div></div>
      </div>
      <Header_DisplayButton
        value={setDisplay}
        links={[translate('bookings', language), translate('schedule_calendar', language)]}
      />
      <div className="scrollcontainer">
        <div className="container">
          {loading ? (
            <Loader />
          ) : (
            <>
              {display === translate('bookings', language) && (
                <Bookings bookedData={bookedData} setBookedData={setBookedData} />
              )}

              {/* Calendar view - If you have StripeID */}
              {display === translate('schedule_calendar', language) && stripeId !== null && (
                <ScheduleProduct user_id={userData.current.id} />
              )}
              {/* Calendar view - If you do not have StripeID */}
              {display === translate('schedule_calendar', language) && stripeId === null && (
                // <div className="stripe-info">
                //   <button
                //     className="button"
                //     name="createstripe"
                //     onClick={handleCreateStripe}
                //     disabled={createStripeLoading}
                //   >
                //     {translate('schedule_createstripeaccount', language)}
                //   </button>
                //   <p style={{ marginTop: '1rem' }}>{translate('schedule_createstripeaccounttext', language)}</p>
                // </div>
                <div class="stripeinfo">
                  <UpdateStripeID />
                  <p style={{ marginTop: '1rem' }}>{translate('schedule_createstripeaccounttext', language)}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
