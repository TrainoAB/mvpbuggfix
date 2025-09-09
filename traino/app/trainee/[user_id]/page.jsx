'use client';
import { useEffect, useRef, useState } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { getUserDetails } from '@/app/functions/functions';
import { getUserDetailsAlias, shortenText, getCategoryImage, saveNewUserInfo } from '@/app/functions/functions';
import { Header_DisplayButton } from '@/app/components/Header_DisplayButton';
import { useRouter } from 'next/navigation';
import { InformationModal } from '@/app/components/InformationModal';
import { playSound } from '@/app/components/PlaySound';
import { deleteImage } from '@/app/api/aws/delete';

import ProductModal from './ProductModal';
import ListProductsModal from './ListProductsModal';
import Navigation from '@/app/components/Menus/Navigation';
import ProfileMenu from '@/app/components/Menus/ProfileMenu';
import Link from 'next/link';
import Loader from '@/app/components/Loader';

import ImageGallery from '@/app/components/ImageGallery';
import EditProfileImageModal from '@/app/components/EditProfileImageModal';
import Image from 'next/image';

import './page.css';

export default function ProfileTrainee({ params }) {
  const { DEBUG, useTranslations, language, isLoggedin, userData, sessionObject, baseUrl } = useAppState();

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [display, setDisplay] = useState('steg1');
  const [modal, setModal] = useState('closed');
  const [listProductModal, setListProductModal] = useState(false);
  const [selectedProduct, setSelectedProductProduct] = useState([]);
  const [boughtProducts, setBoughtProducts] = useState([]);
  const [boughtTrainprograms, setBoughtTrainprograms] = useState([]);
  const [boughtDietprograms, setBoughtDietprograms] = useState([]);
  const [boughtTrainingpasses, setBoughtTrainingpasses] = useState([]);
  const [boughtOnlinetrainings, setBoughtOnlinetrainings] = useState([]);
  const [boughtClipcards, setBoughtClipcards] = useState([]);
  const [chosenData, setChosenData] = useState([]);
  const router = useRouter();
  const [profileImageModal, setProfileImageModal] = useState(false);
  const [render, setRender] = useState(0);
  const [namestring, setNamestring] = useState('');

  const [hasProfile, setHasProfile] = useState(false);
  const [hasCover, setHasCover] = useState(false);

  const { translate } = useTranslations('profile', language);

  const openProfileImageModal = () => {
    playSound('popclick', '0.5');
    setProfileImageModal(true);
  };

  const closeProfileImageModal = () => {
    setProfileImageModal(false);
  };

  const forceRender = async () => {
    if (!hasProfile && sessionObject?.token) {
      await saveNewUserInfo({ id: userData.current.id, thumbnail: 1 }, sessionObject.token);
    }

    /* setRender(render + Math.random()); */
    setProfileImageModal(false);
    location.reload();
  };

  useEffect(() => {
    DEBUG && console.log('chosenData: ', chosenData);
  }, [chosenData]);

  DEBUG && console.log(params);
  DEBUG && console.log('Trainee Page: sessionObject:', sessionObject);

  useEffect(() => {
    DEBUG && console.log('Trainee Page: Effect triggered, sessionObject:', sessionObject, 'params:', params);
    if (!params?.user_id) {
      DEBUG && console.log('Trainee Page: Early return - missing user_id');
      return;
    }

    if (!sessionObject?.token) {
      DEBUG && console.log('Trainee Page: Early return - missing token');
      return; // Ensure user_id and token exist
    }

    const fetchData = async () => {
      DEBUG && console.log(params);
      DEBUG && console.log('Loggedin', isLoggedin.current, 'Params', params.user_id);
      if (userData.current) {
        DEBUG && console.log('UserID', userData.current.id);
      }

      try {
        // Prepare all fetch requests at once
        const userDetailsPromise = getUserDetails(params.user_id, sessionObject?.token);

        const profilePromise = fetch(
          `/api/aws/fetch-imgs?folder=${encodeURIComponent(params.user_id)}&subfolder=profile`,
        ).then((res) => res.ok && setHasProfile(true));

        // const coverPromise = fetch(
        //   `/api/aws/fetch-imgs?folder=${encodeURIComponent(params.user_id)}&subfolder=cover`,
        // ).then((res) => res.ok && setHasCover(true));

        const boughtProductsPromise = fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject?.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/products/bought?id=${params.user_id}`,
            method: 'GET',
          }),
        })
          .then((res) => {
            if (!res.ok) throw new Error('Failed to fetch bought products');
            return res.json();
          })
          .then(setBoughtProducts);

        // Execute all fetches in parallel
        const [userDetails] = await Promise.all([
          userDetailsPromise,
          profilePromise,
          // coverPromise,
          boughtProductsPromise,
        ]);

        // Check if user is a trainer before proceeding
        if (userDetails?.usertype === 'trainer') {
          router.push(`/trainer/@${userDetails.alias}`);
          return;
        }

        setUserDetails(userDetails);

        DEBUG && console.log('Fetched all data:', { userDetails });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [params.user_id, router, setUserDetails, sessionObject?.token]);

  useEffect(() => {
    // Log the state when it changes
    DEBUG && console.log('Bought Products:', boughtProducts);
  }, [boughtProducts]);

  useEffect(() => {
    const sortBoughtProducts = async () => {
      if (boughtProducts.products) {
        const trainprograms = boughtProducts.products.filter((obj) => obj.product_type === 'trainprogram');
        const dietprograms = boughtProducts.products.filter((obj) => obj.product_type === 'dietprogram');
        const trainingpasses = boughtProducts.products.filter((obj) => obj.product_type === 'trainingpass');
        const onlinetrainings = boughtProducts.products.filter((obj) => obj.product_type === 'onlinetraining');
        const clipcards = boughtProducts.clipcards;
        setBoughtTrainprograms(trainprograms);
        setBoughtDietprograms(dietprograms);
        setBoughtTrainingpasses(trainingpasses);
        setBoughtOnlinetrainings(onlinetrainings);
        setBoughtClipcards(clipcards);
      }
    };

    sortBoughtProducts();
  }, [boughtProducts]);

  // Your onClick handler
  const handleClick = (item) => {
    // Extract the product key and data
    const productNameData = item.data[0].product;

    // Remove the 'product_' prefix
    const productName = productNameData.replace('product_', '');

    // Construct the new object
    const newProduct = {
      product: productName,
      products: item.data,
    };

    // Update the state with the new product object
    setSelectedProductProduct(newProduct);

    DEBUG && console.log('Selected', newProduct);

    // Set the modal state
    setModal('products');
  };

  const data = {
    header: 'Welcome Trainee!',
    text: 'This is an explanation about how to use this page.',
  };

  const handleProductClick = (e, arr) => {
    setChosenData(arr);
    toggleListProductModal();
  };
  const toggleListProductModal = () => {
    setListProductModal(!listProductModal);
  };

  // MARK: Markup

  return (
    <main id="profile" className="profile_trainee">
      <Navigation />
      {listProductModal && <ListProductsModal data={chosenData} onClose={toggleListProductModal}></ListProductsModal>}
      <InformationModal data={data} pageName="trainee" />
      {modal === 'products' && <ProductModal data={selectedProduct} onClose={setModal} />}
      {!sessionObject?.token || !userDetails ? (
        <Loader />
      ) : userDetails && !userDetails.usertype ? (
        <div className="fourofour">
          <div className="icon-fourofour"></div>
          <h2>{translate('apprentice_not_found', language)}</h2>
          <br />
          <Link className="button" href="/train">
            {translate('back_button', language)}
          </Link>
        </div>
      ) : (
        <>
          {isLoggedin.current &&
            userData.current &&
            parseInt(userData.current.id) === parseInt(params.user_id) &&
            userDetails.firstname && <ProfileMenu userDetails={userDetails} />}
          <div className="profiletop">
            <div className="thumb">
              {isLoggedin.current && userData.current && parseInt(userData.current.id) === parseInt(params.user_id) && (
                <div
                  className="btn-changephoto"
                  onClick={openProfileImageModal}
                  onMouseOver={() => playSound('tickclick', '0.5')}
                ></div>
              )}
              <div className="image">
                {hasProfile && (
                  <>
                    <div className="image-background"></div>
                    <Image
                      key={render}
                      width={150}
                      height={150}
                      src={`https://traino.s3.eu-north-1.amazonaws.com/${params.user_id}/profile/profile-image.webp`}
                      alt={''}
                      priority={true}
                    />
                  </>
                )}
              </div>
            </div>
            {profileImageModal && (
              <EditProfileImageModal
                onClose={closeProfileImageModal}
                hasProfile={hasProfile}
                uploaded={forceRender}
                deleteLoading={deleteLoading}
                onDelete={async () => {
                  setDeleteLoading(true);
                  try {
                    await deleteImage({ user: userDetails.id, type: 'profile' });
                    location.reload();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              />
            )}
            <h1>
              {(userDetails.firstname.length > 10
                ? userDetails.firstname.slice(0, 10) + '...'
                : userDetails.firstname) +
                ' ' +
                (userDetails.lastname.length > 20 ? userDetails.lastname.slice(0, 20) + '...' : userDetails.lastname)}
            </h1>
          </div>
          {/*  <Header_DisplayButton
            value={setDisplay}
            links={[translate('aboutme', language), translate('gallery', language)]}
          />

          {(display === translate('aboutme', language) || display === translate('aboutme', language)) && (
            <>*/}
          {isLoggedin.current && userData.current && parseInt(userData.current.id) === parseInt(params.user_id) && (
            <>
              {/** Check if any product is bought */}
              {boughtTrainprograms?.length > 0 ||
              boughtDietprograms?.length > 0 ||
              boughtTrainingpasses?.length > 0 ||
              boughtOnlinetrainings?.length > 0 ||
              boughtClipcards?.length > 0 ? (
                <ul id="productlist">
                  {boughtTrainprograms?.length > 0 && (
                    <li
                      className="listed-products"
                      onClick={(e) => {
                        playSound('popclick', '0.5');
                        handleProductClick(e, boughtTrainprograms);
                      }}
                      onMouseOver={() => playSound('tickclick', '0.5')}
                    >
                      <h3>Träningsprogram</h3>
                      <p>{boughtTrainprograms.length}</p>
                    </li>
                  )}
                  {boughtDietprograms?.length > 0 && (
                    <li
                      className="listed-products"
                      onClick={(e) => {
                        playSound('popclick', '0.5');
                        handleProductClick(e, boughtDietprograms);
                      }}
                      onMouseOver={() => playSound('tickclick', '0.5')}
                    >
                      <h3>Kostprogram</h3>
                      <p>{boughtDietprograms.length}</p>
                    </li>
                  )}
                  {boughtTrainingpasses?.length > 0 && (
                    <li
                      className="listed-products"
                      onClick={(e) => {
                        playSound('popclick', '0.5');
                        handleProductClick(e, boughtTrainingpasses);
                      }}
                      onMouseOver={() => playSound('tickclick', '0.5')}
                    >
                      <h3>Träningspass</h3>
                      <p>{boughtTrainingpasses.length}</p>
                    </li>
                  )}
                  {boughtOnlinetrainings?.length > 0 && (
                    <li
                      className="listed-products"
                      onClick={(e) => {
                        playSound('popclick', '0.5');
                        handleProductClick(e, boughtOnlinetrainings);
                      }}
                      onMouseOver={() => playSound('tickclick', '0.5')}
                    >
                      <h3>Onlineträning</h3>
                      <p>{boughtOnlinetrainings.length}</p>
                    </li>
                  )}
                  {boughtClipcards?.length > 0 && (
                    <li
                      className="listed-products"
                      onClick={(e) => {
                        playSound('popclick', '0.5');
                        handleProductClick(e, boughtClipcards);
                      }}
                      onMouseOver={() => playSound('tickclick', '0.5')}
                    >
                      <h3>Klippkort</h3>
                      <p>{boughtClipcards.length}</p>
                    </li>
                  )}
                </ul>
              ) : (
                <>
                  <h3 style={{ padding: '1rem' }}>{translate('header_noproductsbought', language)}</h3>
                  <p
                    style={{
                      width: 'calc(100% - 2rem)',
                      maxWidth: '30rem',
                      textAlign: 'center',
                      paddingBottom: '2rem',
                    }}
                  >
                    {translate('explaintext_noproductsbought', language)}
                  </p>
                </>
              )}
            </>
          )}
          <div className="mycontent">
            <div className="profiledetails">
              <div className="griddetails">
                <div className="gender">
                  {userDetails.gender &&
                    (userDetails.gender === 'male' ? (
                      <p>{translate('male', language)}</p>
                    ) : userDetails.gender === 'female' ? (
                      <p>{translate('female', language)}</p>
                    ) : (
                      ''
                    ))}
                </div>
              </div>
            </div>

            {userDetails.training !== null && (
              <div className="training-container">
                <h3>{translate('training', language)}</h3>
                <ul>
                  {userDetails.training.map((item, index) => (
                    <li className="trainitem" key={index}>
                      {translate(`cat_${item.category_link}`, language)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="profileabout">
              <h3>{translate('aboutme', language)}</h3>
              <p>{userDetails.user_about}</p>
            </div>
          </div>
          {/* </> 
          )}*/}
          {/* 
          {display === translate('gallery', language) && <ImageGallery userDetails={userDetails} />} */}
        </>
      )}
    </main>
  );
}
