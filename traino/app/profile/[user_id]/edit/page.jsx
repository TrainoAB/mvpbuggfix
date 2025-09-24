'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  shortenText,
  adminUserDetails,
  getCategories,
  isValidEmail,
  ifEmailExist,
  ifAliasExist,
  logout,
  debounce,
  sanitizeInput,
  saveNewPassword,
  saveNewUserInfo,
  validatePassword,
  validateNewSport,
  saveToDB,
  setCookie,
  deleteCookie,
} from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { playSound } from '@/app/components/PlaySound';
import Loader from '../../../components/Loader';
import ModalSport from './ModalSport';
import Modal from './Modal';
import ModalName from './ModalName';
import ModalAboutMe from './ModalAboutMe';
import ModalPassword from './ModalPassword';
import ModalEducation from './ModalEducation';
import ModalPlace from './ModalPlace';
import ModalDeleteAccount from './ModalDeleteAccount';
import Confirmation from '../../../components/Confirmation';
import Link from 'next/link';
import { getStripeId } from '@/app/functions/fetchDataFunctions.js';

import Navigation from '../../../components/Menus/Navigation';
import { deleteImage } from '@/app/api/aws/delete';
import { getLicenses } from '@/app/functions/fetchDataFunctions';

import './page.css';
import { set } from 'date-fns';

export default function Edit({ params }) {
  const {
    DEBUG,
    useTranslations,
    language,
    isLoggedin,
    sessionObject,
    baseUrl,
    userData: contextUserData,
    contextDataLoaded,
    API_KEY,
    loginUpdate,
    setloginUpdate,
    userData: contextUserDataRef,
  } = useAppState();

  const [stripeId, setStripeId] = useState(null);
  const [userData, setUserData] = useState({});
  const [isEditing, setIsEditing] = useState({});
  const [userType, setUserType] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingbtn, setLoadingbtn] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [modalError, setModalError] = useState(null);
  const [reload, setReload] = useState(false);
  const [userLicense, setUserLicense] = useState(null);
  const [userVerified, setUserVerified] = useState(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [isProcessingRefunds, setIsProcessingRefunds] = useState(false);

  const router = useRouter();

  const userId = useRef(0);

  const { translate } = useTranslations('editaccount', language);
  const { translate: translateGlobal } = useTranslations('global', language);

  const handleBack = () => {
    if (router && router.back) {
      router.back();
    } else {
      window.history.back();
    }
  };

  useEffect(() => {
    if (!contextDataLoaded) {
      DEBUG && console.log('Context data not loaded yet');
      return;
    }

    async function fetchData() {
      setLoading(true);
      const userid = parseInt(params.user_id);
      DEBUG && console.log('Fetching data for user ID:', userid);
      const validate = validateUser(userid);
      DEBUG && console.log('Validate' + validate);

      if (validate) {
        userId.current = userid;
        const userData = await adminUserDetails(userid, sessionObject, baseUrl);
        if (userData) {
          setUserData(userData);
          setUserType(userData.usertype);
          fetchStripeId(userId.current);

          if (userData.verified !== 1) {
            const files = await fetch(
              `/api/aws/fetch-imgs?folder=${encodeURIComponent(userid)}&subfolder=certificates`,
            );
            const data = await files.json();

            if (files.ok) {
              setCertificates(data.imageUrls);
            } else if (files.status === 404) {
              setCertificates(translate('no_uploaded_licenses', language));
            } else {
              console.error('Error:', data.error);
            }

            console.log('User verified:', userData.verified);

            const licenseData = await getLicenses();
            if (Array.isArray(licenseData)) {
              const userLicenseObject = licenseData.find((license) => license.user_id === userId.current) || null;

              setUserLicense(userLicenseObject);
              setUserVerified(false);
            }
          } else {
            setUserVerified(true);
          }

          DEBUG && console.log('User data fetched:', userData);
        }
      } else {
        DEBUG && console.log('User validation failed, redirecting to login');
        router.push('/login');
      }
      setLoading(false);
      setReload(false);
    }

    fetchData();
  }, [params.user_id, contextUserData, isLoggedin, contextDataLoaded, reload]);

  useEffect(() => {
    DEBUG && console.log('userLicense:', userLicense);
  }, [userLicense]);

  const handleSave = () => {
    setLoadingbtn(true);
    DEBUG && console.log('User data to save:', userData);
    setLoadingbtn(false);
  };

  const fetchStripeId = async (user_id) => {
    try {
      DEBUG && console.log('Checking user status...');
      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/stripe/gettrainerstripe_id`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trainer_id: user_id,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      DEBUG && console.log('stripeId inside page:', data.stripeId);
      DEBUG && console.log('stripe status:', data);
      setStripeId(data.stripeId);
    } catch (error) {
      DEBUG && console.log(error.message);
    }
  };

  const deleteStripeAccount = async (stripe_id) => {
    try {
      DEBUG && console.log('Deleting user status...');
      DEBUG && console.log('stripeId:', stripe_id);

      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/stripe/deleteStripe_acc`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stripeId: stripeId,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      DEBUG && console.log('Response:', response);
      DEBUG && console.log('stripe status:', data);
    } catch (error) {
      DEBUG && console.log('Error:', error.message);
    }
  };

  const savePasswordToDB = async (newData) => {
    try {
      newData.id = userId.current;

      let response = await saveNewPassword(newData);

      if (response === 'Incorrect password!') {
        setModalError(`${translate('current_password_wrong', language)}`);
      } else {
        setIsEditing({ ...isEditing, ['password']: false });
      }
    } catch (error) {
      setModalError(error);
      console.log(`savePasswordToDB Error: ${error}`);
    }
  };

  const validateUser = (userid) => {
    if (contextUserData && contextUserData.current) {
      const contextUserId = parseInt(contextUserData.current.id);
      DEBUG && console.log('Context user ID:', contextUserId, 'Provided user ID:', userid);
      DEBUG && console.log('Is logged in:', isLoggedin.current);
      if (isLoggedin.current && contextUserId === userid) {
        DEBUG && console.log('User validation succeeded');
        return true;
      } else {
        DEBUG && console.log('User validation failed');
        return false;
      }
    } else {
      DEBUG && console.log('No user ID found in context');
      return false;
    }
  };

  const handleEdit = (fieldName) => {
    setIsEditing({ ...isEditing, [fieldName]: true });
  };

  const handleChangeModal = (fieldName, value) => {
    setUserData({ ...userData, [fieldName]: value });
    setIsEditing({ ...isEditing, [fieldName]: false });
    saveToDB(fieldName, value, userId.current).then((response) => {
      if (response && response.error) {
        alert(response.error);
      } else {
        // Update global userData if the field changed successfully
        if (contextUserData && contextUserData.current) {
          contextUserData.current[fieldName] = value;
          // Update the encrypted cookie with new user data
          setCookie('enudata', JSON.stringify(contextUserData.current), 365);
          DEBUG && console.log(`Updated global userData.${fieldName}:`, value);

          // Trigger navigation update for alias changes
          if (fieldName === 'alias') {
            setloginUpdate(!loginUpdate);
            DEBUG && console.log('Triggered navigation update for alias change');
          }
        }
      }
    });
  };

  const handleChangeModalPassword = async (newData) => {
    let newPwSavedOK = await savePasswordToDB(newData);
  };

  const handleChangeModalDeleteAccount = async (newData) => {
    try {
      newData.id = userId.current;

      DEBUG && console.log('Deleting account:', newData);

      await handleDeleteAccount(newData.id, newData.currentPassword);
      await deleteStripeAccount(stripeId);
      setIsEditing({ ...isEditing, ['account']: false });
    } catch (error) {
      // Error handling is done in handleDeleteAccount
      DEBUG && console.error('Error in handleChangeModalDeleteAccount:', error);
    }
  };

  const handleChangeModalTraining = (fieldName, value, addedSports) => {
    setUserData({ ...userData, [fieldName]: value });
    setIsEditing({ ...isEditing, [fieldName]: false });
    const saveData = addedSports.map((cat) => ({
      id: cat.id,
      category_name: cat.category_name,
      category_link: cat.category_link,
      category_image: cat.category_image,
    }));
    saveToDB(fieldName, saveData, userId.current).then((response) => {
      if (response && response.error) {
        alert(response.error);
      }
    });
  };

  const handleChangeModalPlace = (fieldName, newData) => {
    setUserData({
      ...userData,
      ['user_address']: newData.user_address,
      ['user_areacode']: newData.user_areacode,
    });
    setIsEditing({ ...isEditing, [fieldName]: false });
    saveToDB(fieldName, newData, userId.current).then((response) => {
      if (response && response.error) {
        alert(response.error);
      }
    });
  };

  const handleChangeModalName = (fieldName, newData) => {
    setUserData({
      ...userData,
      ['firstname']: newData.firstname,
      ['lastname']: newData.lastname,
    });
    setIsEditing({ ...isEditing, [fieldName]: false });
    saveToDB(fieldName, newData, userId.current).then((response) => {
      if (response && response.error) {
        alert(response.error);
      } else {
        // Update global userData if the names changed successfully
        if (contextUserData && contextUserData.current) {
          contextUserData.current.firstname = newData.firstname;
          contextUserData.current.lastname = newData.lastname;
          // Update the encrypted cookie with new user data
          setCookie('enudata', JSON.stringify(contextUserData.current), 365);
          DEBUG && console.log('Updated global userData names:', newData);
        }
      }
    });
  };

  const handleSaveEducation = async (fieldName, educations, addedEducations, uploadedFileNames) => {
    userData.education = educations;
    setIsEditing({ ...isEditing, [fieldName]: false });

    if (addedEducations && addedEducations.length > 0) {
      const response = await saveToDB(fieldName, addedEducations, userId.current);
      if (response && response.error) {
        alert(response.error);
      }
    }

    if (uploadedFileNames && uploadedFileNames.length > 0) {
      const response = await saveToDB('user_files', uploadedFileNames, userId.current);
      if (response && response.error) {
        alert(response.error);
      }

      setReload(true);
    }
  };

  const handleDeleteAccount = async (id, currentPassword) => {
    DEBUG && console.log('Deleting account with body:', JSON.stringify({ id }));

    const stripeId = await getStripeId(id);
    DEBUG && console.log('Stripe ID:', stripeId);

    try {
      // First, check for bookings that need refunds
      const checkResponse = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/users/delete`,
          method: 'POST',
          body: JSON.stringify({ id, check_only: true }),
        }),
      });

      const checkData = await checkResponse.json();
      DEBUG && console.log('Bookings check result:', checkData);

      // Process refunds for eligible bookings
      if (checkData.refundable_bookings && checkData.refundable_bookings.length > 0) {
        setIsProcessingRefunds(true);
        DEBUG && console.log('Processing refunds for', checkData.refundable_bookings.length, 'bookings');

        for (const booking of checkData.refundable_bookings) {
          if (booking.payment_intent_id) {
            try {
              DEBUG &&
                console.log('Processing refund for booking:', booking.id, 'payment intent:', booking.payment_intent_id);

              const refundResponse = await fetch(`${baseUrl}/api/stripe/refund-payment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paymentIntentId: booking.payment_intent_id,
                  reason: 'requested_by_customer',
                  // Include booking details for 24-hour validation
                  booked_date: booking.booked_date,
                  starttime: booking.starttime,
                  metadata: {
                    user_id: id,
                    booking_id: booking.id,
                    reason: 'Account deletion',
                    product_type: booking.product_type,
                  },
                }),
              });

              const refundResult = await refundResponse.json();
              DEBUG && console.log('Refund result for booking', booking.id, ':', refundResult);

              if (!refundResult.success) {
                console.warn('Refund failed for booking', booking.id, ':', refundResult.error);
              }
            } catch (refundError) {
              console.error('Error processing refund for booking', booking.id, ':', refundError);
              // Continue with account deletion even if refund fails
            }
          }
        }
        setIsProcessingRefunds(false);
      }

      // Now proceed with account deletion
      const response = await fetch(`${baseUrl}/api/proxy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionObject.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${baseUrl}/api/users/delete`,
          method: 'POST',
          body: JSON.stringify({ id, currentPassword }),
        }),
      });

      const data = await response.json();

      setIsEditing({ ...isEditing, ['account']: false });

      if (data.error) {
        if (data.error === 'Incorrect password') {
          alert('Felaktigt lösenord.');
          return;
        } else {
          alert(data.error);
          DEBUG && console.error(data.error);
        }
        DEBUG && console.error('Delete account error:', data.error);
        throw new Error(data.error);
      } else {
        // Show success modal when account is deleted
        setShowDeleteSuccess(true);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsProcessingRefunds(false); // Make sure to clear the loading state on error
    }
  };

  const handleDeleteSuccessClose = async () => {
    setShowDeleteSuccess(false);

    // Clear session state immediately
    contextUserData.current = null;
    isLoggedin.current = false;
    if (contextUserDataRef && contextUserDataRef.current) {
      contextUserDataRef.current = null;
    }

    DEBUG && console.log('Clearing session state for deleted user');

    // Explicitly clear all cookies immediately
    deleteCookie('enudata');
    deleteCookie('timestamp');
    deleteCookie('user_id');
    deleteCookie('user');
    deleteCookie('session_id');
    deleteCookie('loginSessionId');

    // Trigger context update to refresh login state
    setloginUpdate((prev) => !prev);

    // Logout and redirect to login page
    // Pass true for the check parameter to prevent automatic redirect in logout function
    logout(isLoggedin, contextUserDataRef, null, true);

    // Add a small delay to ensure logout completes, then redirect
    setTimeout(() => {
      DEBUG && console.log('Redirecting to login page after account deletion');

      // Clear the URL to prevent any cached state issues
      window.history.replaceState({}, '', '/login');
      router.replace('/login');
    }, 200);
  };

  const handleDeleteEducations = async (deleteIds, educations) => {
    DEBUG && console.log('Attempting to delete the following ID:s...', deleteIds);

    for (const id of deleteIds) {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/users/edit/education/delete`,
            method: 'POST',
            body: JSON.stringify({id: id, user_id: userId.current}),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        } else {
          setIsEditing({ ...isEditing, ['education']: false });
          userData.education = educations;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  };

  const handleDeleteSports = async (deletedSports, sports) => {
    DEBUG && console.log('Attempting to delete the following Sports...', deletedSports);

    for (const sport of deletedSports) {
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/users/edit/sport/delete`,
            method: 'POST',
            body: JSON.stringify(sport),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        } else {
          setIsEditing({ ...isEditing, ['training']: false });
          userData.training = sports;
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  };

  const closeModal = (fieldName) => {
    setModalError('');
    setIsEditing({ ...isEditing, [fieldName]: false });
  };

  const printUserType = (usertype) => {
    if (usertype === 'trainer') {
      return translate('trainer', language);
    } else if (usertype === 'trainee') {
      return translate('trainee', language);
    }
  };

  const renderTrainingData = () => {
    DEBUG && console.log(userData.training);
    let trainingData = [];

    if (typeof userData.training === 'string') {
      trainingData = userData.training.split(',').map((name) => ({ category_name: name.trim() }));
    } else if (Array.isArray(userData.training)) {
      trainingData = userData.training;
    }

    return (
      <div className="data-list page-data">
        {trainingData.length > 0 ? (
          trainingData.map((data, index) => (
            <div key={index} className="modal-list-item">
              <span className="data-item">
                {data.category_link ? translateGlobal(`cat_${data.category_link}`, language) : data.category_name}
              </span>
            </div>
          ))
        ) : (
          <div className="empty-data"></div>
        )}
      </div>
    );
  };

  if (!contextUserData || !isLoggedin.current) {
    return (
      <div className="loader-container">
        <Loader />
      </div>
    );
  }
  // MARK: Markup
  return (
    <>
      <Navigation />
      {loading ? (
        <div className="loader-container">
          <Loader />
        </div>
      ) : (
        <>
          <main id="profile-edit">
            <div className="categorytop">
              <div className="btn-back" onClick={handleBack}></div>

              <h1>{translate('editaccount', language)}</h1>
              <div></div>
            </div>

            {/*MARK:NAMN --- firstname and lastname  (uses firstname to open/close the modal) */}
            {userData && userData.firstname && (
              <>
                <div className="page-content">
                  <div className="container-content">
                    <h2 className="header2">{translate('edit_accountdetails', language)}</h2>
                    <p className="value-type">{translate('edit_accounttype', language)}</p>
                    <div className="edit-row">
                      <span className={`value-text type ${userType}`}>{printUserType(userData.usertype)}</span>
                    </div>
                    <p className="value-type">{translate('name', language)}</p>
                    <div className="edit-row">
                      <p>
                        {userData.firstname} {userData.lastname}
                      </p>
                      <button
                        className="edit-btn"
                        onMouseOver={() => playSound('tickclick', '0.5')}
                        onClick={() => {
                          playSound('popclick', '0.5');
                          handleEdit('firstname');
                        }}
                      ></button>
                    </div>

                    {isEditing.firstname && (
                      <ModalName
                        onClose={closeModal}
                        onSave={handleChangeModalName}
                        buttonText={translate('edit_changename', language)}
                        title={translate('edit_changename', language)}
                        text={translate('firstname', language)}
                        text2={translate('lastname', language)}
                        data={userData.firstname}
                        data2={userData.lastname}
                      ></ModalName>
                    )}

                    {/*MARK:PERSONNUMMER*/}
                    {userData.personalnumber !== null && (
                      <div className="personalnumber">
                        <p className="value-type">{translate('personalnumber', language)}</p>
                        <div className="edit-row">
                          <p className="value-text">{userData.personalnumber}</p>
                        </div>
                      </div>
                    )}

                    {/*MARK:MOBILEPHONE*/}
                    <p className="value-type">{translate('mobilephone', language)}</p>
                    <div className="edit-row">
                      <p>{userData.mobilephone}</p>
                      <button
                        className="edit-btn"
                        onMouseOver={() => playSound('tickclick', '0.5')}
                        onClick={() => {
                          playSound('popclick', '0.5');
                          handleEdit('mobilephone');
                        }}
                      ></button>
                    </div>

                    {isEditing.mobilephone && (
                      <Modal
                        onClose={closeModal}
                        onSave={handleChangeModal}
                        field="mobilephone"
                        buttonText={translate('edit_changemobilephone', language)}
                        title={translate('edit_changemobilephone', language)}
                        text={translate('mobilephone', language)}
                        data={userData.mobilephone}
                      ></Modal>
                    )}

                    {/*MARK:EMAIL*/}
                    <p className="value-type">{translate('email', language)}</p>
                    <div className="edit-row">
                      <p>{userData.email}</p>
                      <button
                        className="edit-btn"
                        onMouseOver={() => playSound('tickclick', '0.5')}
                        onClick={() => {
                          playSound('popclick', '0.5');
                          handleEdit('email');
                        }}
                      ></button>
                    </div>

                    {isEditing.email && (
                      <Modal
                        onClose={closeModal}
                        onSave={handleChangeModal}
                        field="email"
                        buttonText={translate('change_email', language)}
                        title={translate('change_email', language)}
                        text={translate('email', language)}
                        data={userData.email}
                      ></Modal>
                    )}

                    {/*MARK:OM MIG*/}
                    <p className="value-type">{translate('aboutme', language)}</p>
                    <div className="edit-row-textarea">
                      {isEditing.user_about ? (
                        <>
                          <p className="about-text">{userData.user_about}</p>

                          <button className="save-btn" onClick={() => handleSave('user_about')}></button>
                        </>
                      ) : (
                        <>
                          <div className="textarea-content">{userData.user_about}</div>
                          <button
                            className="edit-btn textarea-btn"
                            onMouseOver={() => playSound('tickclick', '0.5')}
                            onClick={() => {
                              playSound('popclick', '0.5');
                              handleEdit('user_about');
                            }}
                          ></button>
                        </>
                      )}
                    </div>
                    {isEditing.user_about && (
                      <ModalAboutMe
                        onClose={closeModal}
                        onSave={handleChangeModal}
                        field="user_about"
                        buttonText={translate('change_aboutme', language)}
                        title={translate('change_aboutme', language)}
                        text={translate('aboutme', language)}
                        data={userData.user_about}
                      ></ModalAboutMe>
                    )}

                    {/*MARK:ALIAS*/}
                    {userData.usertype === 'trainer' && (
                      <>
                        <p className="value-type">{translate('alias', language)}</p>
                        <div className="edit-row">
                          <p>{userData.alias}</p>
                          <button
                            className="edit-btn"
                            onMouseOver={() => playSound('tickclick', '0.5')}
                            onClick={() => {
                              playSound('popclick', '0.5');
                              handleEdit('alias');
                            }}
                          ></button>
                        </div>

                        {isEditing.alias && (
                          <Modal
                            onClose={closeModal}
                            onSave={handleChangeModal}
                            field="alias"
                            buttonText={translate('change_alias', language)}
                            title={translate('change_alias', language)}
                            text={translate('alias', language)}
                            data={userData.alias}
                          ></Modal>
                        )}
                      </>
                    )}

                    {/*MARK:LÖSENORD*/}
                    <p className="value-type">{translate('password', language)}</p>
                    <div className="edit-row">
                      <p>{'********'}</p>
                      <button
                        className="edit-btn"
                        onMouseOver={() => playSound('tickclick', '0.5')}
                        onClick={() => {
                          playSound('popclick', '0.5');
                          handleEdit('password');
                        }}
                      ></button>
                    </div>

                    {isEditing.password && (
                      <ModalPassword
                        onClose={closeModal}
                        onSave={handleChangeModalPassword}
                        field="password"
                        buttonText={translate('change_password', language)}
                        title={translate('change_password', language)}
                        text={translate('password', language)}
                        error={modalError}
                      ></ModalPassword>
                    )}

                    <h2 className="header2">{translate('profile_info', language)}</h2>

                    {/*MARK:VERKSAMHETSPLATS*/}
                    {userData.usertype === 'trainer' && (
                      <>
                        <div className="edit-row multirow">
                          <p className="value-type" id="workplace">
                            {translate('workplace', language)}
                          </p>
                          <button
                            className="edit-btn"
                            onMouseOver={() => playSound('tickclick', '0.5')}
                            onClick={() => {
                              playSound('popclick', '0.5');
                              handleEdit('workplace');
                            }}
                          ></button>
                        </div>
                        <div className="edit-row address">
                          <div>{userData.user_address}</div>
                          <div>{userData.user_areacode}</div>
                        </div>
                        {isEditing.workplace && (
                          <ModalPlace
                            onClose={closeModal}
                            onSave={handleChangeModalPlace}
                            field="workplace"
                            title={translate('add_workplace_title', language)}
                            text={translate('add_workplace_text', language)}
                            data={userData.user_address}
                            buttonText={translate('change_workplace', language)}
                          ></ModalPlace>
                        )}
                      </>
                    )}

                    {/*MARK:UTBILDNING*/}
                    {userData.usertype === 'trainer' && (
                      <>
                        <div className="edit-row multirow">
                          <p className="value-type" id="education">
                            {translate('education', language)}
                          </p>
                          <button
                            className="edit-btn"
                            onMouseOver={() => playSound('tickclick', '0.5')}
                            onClick={() => {
                              playSound('popclick', '0.5');
                              handleEdit('education');
                            }}
                          ></button>
                        </div>

                        <div className="page-data">
                          <p className="value-type">{translate('educations', language)}</p>
                          <div className="data-list">
                            {userData.education && userData.education.length > 0 ? (
                              userData.education.map((item, index) => (
                                <div key={index} className="modal-list-item">
                                  <span className="data-item">{item}</span>
                                </div>
                              ))
                            ) : (
                              // Render an empty div to ensure the border-bottom is always visible
                              <div className="empty-data">{translate('no_educations', language)}</div>
                            )}
                          </div>
                          <div className="certificate-wrap">
                            <p className="value-type">{translate('licenses', language)}</p>
                            <div className="education-items">
                              {userVerified === true ? (
                                <p>{translate('verified', language)}</p>
                              ) : (
                                <>
                                  {certificates.length > 0 && Array.isArray(certificates) ? (
                                    <div className="education-item">{`${certificates.length} väntande på granskning`}</div>
                                  ) : (
                                    <p>{translate('no_licenses', language)}</p>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {isEditing.education && (
                          <ModalEducation
                            onClose={closeModal}
                            onSave={handleSaveEducation}
                            onDelete={handleDeleteEducations}
                            field="education"
                            title={translate('add_education', language)}
                            text={translate('add_education_info', language)}
                            data={userData.education}
                            buttonText={translate('save_changes', language)}
                            userId={userId}
                            certificates={certificates}
                            setCertificates={setCertificates}
                            verified={userVerified}
                          ></ModalEducation>
                        )}
                      </>
                    )}

                    {/*MARK:SPORT*/}

                    <>
                      <div className="edit-row  multirow">
                        <p className="value-type" id="sport">
                          {translate('sports', language)}
                        </p>
                        <button
                          className="edit-btn"
                          onMouseOver={() => playSound('tickclick', '0.5')}
                          onClick={() => {
                            playSound('popclick', '0.5');
                            handleEdit('training');
                          }}
                        ></button>
                      </div>

                      <div>{renderTrainingData()}</div>
                    </>

                    <h2 className="header2">{translate('account_settings', language)}</h2>

                    {loadingbtn ? (
                      <div className="buttonloader">
                        <Loader />
                      </div>
                    ) : (
                      <button className="button" id="delete-btn" onClick={() => handleEdit('account')}>
                        {translate('edit_deleteaccount', language)}
                      </button>
                    )}

                    {isEditing.account && (
                      <ModalDeleteAccount
                        onClose={closeModal}
                        onSave={handleChangeModalDeleteAccount}
                        field="account"
                        buttonText={translate('delete_account', language)}
                        title={translate('confirm_account_delete', language)}
                        error={modalError}
                      ></ModalDeleteAccount>
                    )}
                  </div>
                </div>{' '}
                {isEditing.training && (
                  <ModalSport
                    onClose={closeModal}
                    onSave={handleChangeModalTraining}
                    onDelete={handleDeleteSports}
                    field="training"
                    title={translate('add_sport_title', language)}
                    text={translate('add_sport_text', language)}
                    dropdownText={translate('choose_sport', language)}
                    data={userData.training}
                    buttonText={translate('change_sports', language)}
                  ></ModalSport>
                )}
              </>
            )}
          </main>
        </>
      )}

      {/* Delete Account Success Modal */}
      {showDeleteSuccess && (
        <Confirmation
          onClose={handleDeleteSuccessClose}
          onCloseText={translateGlobal('close', language)}
          title={translate('account_deleted_success', language)}
          text={translate('account_deleted_redirect', language)}
        />
      )}

      {/* Processing Refunds Modal */}
      {isProcessingRefunds && (
        <div className="modal">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '25rem' }}>
            <div className="loading-container">
              <Loader />
            </div>
            <h3>{translate('processing_refunds', language)}</h3>
            <p>{translate('processing_refunds_desc', language)}</p>
          </div>
          <div className="darkoverlay"></div>
        </div>
      )}
    </>
  );
}
