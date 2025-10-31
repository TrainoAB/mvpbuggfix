'use client';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import {
  getUserDetailsAlias,
  shortenText,
  getCategoryImage,
  getCategoryName,
  saveNewUserInfo,
} from '@/app/functions/functions';

import CreateProduct from '../../trainer/[alias]/CreateProduct';
import ProductModal from '../../trainer/[alias]/ProductModal';
import Navigation from '@/app/components/Menus/Navigation';
import EditCoverImage from '@/app/components/EditCoverImage';
import YoutubeCoverVideo from '@/app/components/YoutubeCoverVideo';
import ReadReview from '@/app/components/Rating/ReadReview';
import RateTrainer from '@/app/components/Rating/RateTrainer';
import Rating from '@/app/components/Rating/Rating';
import Image from 'next/image';
import Link from 'next/link';

import Loader from '@/app/components/Loader';
import ImageGallery from '@/app/components/ImageGallery';
import EditProfileImageModal from '@/app/components/EditProfileImageModal';
import SportProducts from '@/app/trainer/SportProducts';

import { Header_DisplayButton } from '@/app/components/Header_DisplayButton';
import { useRouter } from 'next/navigation';
import { InformationModal } from '@/app/components/InformationModal';
import { playSound } from '@/app/components/PlaySound';
import { deleteImage } from '@/app/api/aws/delete';
import { getProductsCount, getProducts } from '@/app/functions/fetchDataFunctions.js';

import './ProfileTrainer.css';

export default function ProfileTrainer({ alias, nav = true }) {
  const {
    DEBUG,
    userDataVersion,
    useTranslations,
    language,
    isLoggedin,
    userData,
    sessionObject,
    baseUrl,
    traincategories,
  } = useAppState();
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [display, setDisplay] = useState('steg1');
  const [modal, setModal] = useState('closed');
  const [selectedSport, setSelectedSport] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setProduct] = useState([]);
  const [readReview, setReadReview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const userAliasDecoded = decodeURIComponent(alias);
  const userAlias = userAliasDecoded.startsWith('@') ? userAliasDecoded.substring(1) : userAliasDecoded;

  const userAliasEncoded = encodeURIComponent(userAlias);

  const [editCoverImageModal, setEditCoverImageModal] = useState(false);
  const [profileImageModal, setProfileImageModal] = useState(false);
  const [render, setRender] = useState(Date.now());

  const [hasProfile, setHasProfile] = useState(false);
  const [hasCover, setHasCover] = useState(false);

  const [rateTrainer, setRateTrainer] = useState(false);

  const [hasBought, setHasBought] = useState(false);
  const [hasRated, setHasRated] = useState('');

  const router = useRouter();

  const { translate } = useTranslations('profile', language);

  useEffect(() => {
    DEBUG && console.log('ProfileTrainer received alias:', alias);
  }, [alias]);

  const openProfileImageModal = () => {
    playSound('popclick', '0.5');
    setProfileImageModal(true);
  };

  const closeProfileImageModal = () => {
    setProfileImageModal(false);
  };

  const closeEditCoverImageModal = () => {
    setEditCoverImageModal(false);
  };

  const forceRender = async () => {
    try {
      // Handle profile image upload/update (both new and existing)
      if (profileImageModal) {
        await saveNewUserInfo({ id: userData.current.id, thumbnail: 1 });
        setHasProfile(true);
      }
      // Handle cover image upload/update (both new and existing)
      else if (editCoverImageModal) {
        await saveNewUserInfo({ id: userData.current.id, coverimage: 1 });
        setHasCover(true);
      }

      // Update render state with timestamp to force image refresh and bypass cache
      const timestamp = Date.now();
      setRender(timestamp);
      setProfileImageModal(false);
      setEditCoverImageModal(false);
      setLoading(false);
      // ✅ Now works for both new uploads AND updates to existing images
    } catch (error) {
      console.error('Error updating profile:', error);
      setLoading(false);
    }
  };

  // Function to gather, group, and count products by category_link
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
            total_trainprograms: 0,
            total_trainingpasses: 0,
            total_dietprograms: 0,
          };
        }

        grouped[categoryIdentifier].products.push(product);

        // Count specific product types for the current category
        if (product.product === 'clipcard') {
          grouped[categoryIdentifier].total_clipcards++;
        } else if (product.product === 'trainprogram') {
          grouped[categoryIdentifier].total_trainprograms++;
        } else if (product.product === 'dietprogram') {
          grouped[categoryIdentifier].total_dietprograms++;
        } else if (product.product === 'trainingpass' || product.product === 'onlinetraining') {
          grouped[categoryIdentifier].total_trainingpasses++;
        }
      }
    }

    // Convert the grouped object to an array
    return Object.values(grouped);
  }

  useEffect(() => {
    // Log userDetails when it changes (so it isn't null)
    DEBUG && console.log('userDetails: ', userDetails);
  }, [userDetails]);

  useEffect(() => {
    DEBUG &&
      console.log('Loggedin', isLoggedin.current, 'Params', alias, 'Alias', userAlias, 'UserData', userData.current);

    // MARK: Fetch Data
    const fetchData = async () => {
      setLoading(true);
      try {
        if (userAliasDecoded.startsWith('@')) {
          // Handle the case where alias starts with "@"
          // For example:
          DEBUG && console.log('alias starts with "@"');
        } else {
          // Handle other cases
          // For example:
          DEBUG && console.log('alias does not start with "@"');
        }

        // Get user details for the trainer
        const userDetails = await getUserDetailsAlias(userAliasEncoded, sessionObject.token);

        // Check if the user is a trainee and redirect if necessary
        if (userDetails && userDetails.usertype === 'trainee') {
          router.push(`/trainee/${userDetails.id}`);
          return;
        }

        // Set user details state
        setUserDetails(userDetails);
        const alias = userDetails.alias;

        let data = null;

        if (
          isLoggedin.current &&
          userDetails &&
          userDetails.usertype &&
          userData &&
          userData.current &&
          userDetails.id == userData.current.id &&
          userDetails.usertype === 'trainer'
        ) {
          data = await getProducts(alias);
        } else {
          data = await getProductsCount(alias);
        }

        DEBUG && console.log('Data:', data);

        if (
          isLoggedin.current &&
          userDetails &&
          userData &&
          userData.current &&
          userDetails.id == userData.current.id &&
          userData.current.usertype === 'trainer'
        ) {
          // Process the data
          const sortedProducts = gatherAndSortProducts(data);

          DEBUG && console.log('Sorted Products:', sortedProducts);

          // Display the sorted products
          setProducts(sortedProducts);
        } else {
          DEBUG && console.log('Products:', data);
          setProducts(data);
        }

        if (userData.current) {
          const responseHasBought = await fetch(`${baseUrl}/api/proxy`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sessionObject.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: `${baseUrl}/api/products/bought/check?id=${userData.current.id}&trainer_id=${userDetails.id}`,
              method: 'GET',
            }),
          });

          // Check if the response is ok (status code 200-299)
          if (!responseHasBought.ok) {
            throw new Error(`HTTP error! Status: ${responseHasBought.status}`);
          }

          // Parse the JSON response
          const hasBoughtData = await responseHasBought.json();
          DEBUG && console.log('Has Bought Data:', hasBoughtData);

          if (hasBoughtData.product_count > 0) {
            setHasBought(true);
          } else {
            setHasBought(false);
          }

          if (hasBoughtData && hasBoughtData.user_rated && hasBoughtData.user_rated.rating) {
            setHasRated(hasBoughtData.user_rated.rating);
          }
        }
      } catch (error) {
        // Handle errors
        console.error('Error fetching data:', error);
        alert(translate('unexpectederror', language));
      } finally {
        setLoading(false);
      }
    };

    // Call fetchData function
    if (sessionObject !== null) {
      DEBUG && console.log('Running fetchData with sessionObject:', sessionObject);
      fetchData();
    }
  }, [isLoggedin.current, alias, sessionObject]);

  useEffect(() => {
    const fetchProfileImages = async () => {
      if (userDetails === null) {
        return;
      }

      // Only fetch if we haven't already confirmed the image exists
      if (userDetails.thumbnail === 1 && !hasProfile) {
        try {
          const profile = await fetch(
            `/api/aws/fetch-imgs?folder=${encodeURIComponent(userDetails.id)}&subfolder=profile`,
          );

          if (profile.ok) {
            setHasProfile(true);
          }

          DEBUG && console.log('Profile:', profile);
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
      }

      // Only fetch if we haven't already confirmed the image exists
      if (userDetails.coverimage === 1 && !hasCover) {
        try {
          const cover = await fetch(`/api/aws/fetch-imgs?folder=${encodeURIComponent(userDetails.id)}&subfolder=cover`);

          if (cover.ok) {
            setHasCover(true);
          }

          DEBUG && console.log('Cover:', cover);
        } catch (error) {
          console.error('Error fetching cover image:', error);
        }
      }
    };

    fetchProfileImages();
  }, [userDetails, render, hasProfile, hasCover]);

  // Your onClick handler
  const handleClick = (e, item) => {
    if (e.target.classList.contains('btn-addproduct')) {
      return;
    }

    // Step 1: Create a new object (example object)
    const newObject = {};

    // Step 2: Find the product with the matching category_link
    const foundProduct = products.find((selectedProduct) => selectedProduct.category_link === item.category_link);
    DEBUG && console.log('Found Product', foundProduct);

    if (foundProduct) {
      // Combine the new object with the found product
      const combinedObject = {
        ...foundProduct,
      };

      // Step 3: Set the combined object as the new product state
      setProduct(combinedObject);
      DEBUG && console.log('Combined Object', combinedObject);
    }
    playSound('popclick', '0.5');
    setModal('products');
  };

  const handleViewRatings = () => {
    setReadReview(true);
  };

  const firstTime = {
    header: translate('trainer', language),
    text: translate('first_trainerprofile', language),
  };

  function findObjectById(arr, id) {
    const obj = arr.find((obj) => obj.id === id);
    return obj ? obj : null;
  }

  function countProductType(products, type) {
    if (!Array.isArray(products)) {
      return 0;
    }

    return products.filter((product) => product.product === type).length;
  }

  const handleChangeCover = () => {
    playSound('popclick', '0.5');
    setEditCoverImageModal(true);
  };
  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // MARK: Merge Training Items
  const mergedTrainingItems = useMemo(() => {
    // Safeguard for when data isn't loaded yet
    if (!products || !userDetails?.training?.length || userDetails?.usertype !== 'trainer') return [];

    return userDetails.training.map((userTrainingItem) => {
      const productItems = products.filter((product) => product.category_link === userTrainingItem.category_link);

      DEBUG && console.log('Product Items', productItems);
      // Count products of each type inside the products array

      const total_clipcards = productItems
        .flatMap((item) => item.products)
        .filter((product) => product?.product_type === 'clipcard').length;
      const totaltrainingpasses = productItems
        .flatMap((item) => item.products)
        .filter((product) => product?.product_type === 'trainingpass').length;
      const total_trainingpassesonline = productItems
        .flatMap((item) => item.products)
        .filter((product) => product?.product_type === 'onlinetraining').length;
      const total_trainprograms = productItems
        .flatMap((item) => item.products)
        .filter((product) => product?.product_type === 'trainprogram').length;
      const total_dietprograms = productItems
        .flatMap((item) => item.products)
        .filter((product) => product?.product_type === 'dietprogram').length;

      const total_trainingpasses = parseInt(totaltrainingpasses) + parseInt(total_trainingpassesonline);
      DEBUG && console.log(totaltrainingpasses, total_trainingpassesonline, total_trainingpasses);
      return {
        ...userTrainingItem,
        total_clipcards,
        total_trainingpasses,
        total_trainprograms,
        total_dietprograms,
      };
    });
  }, [products, userDetails?.training]);

  const [showSelectedSportProducts, setShowSelectedSportProducts] = useState(null);
  const [showSportProducts, setShowSportProducts] = useState(false);

  // Function to refresh products data
  const refreshProducts = useCallback(async () => {
    if (!userDetails?.alias) return;

    try {
      let data = null;

      if (
        isLoggedin.current &&
        userDetails &&
        userDetails.usertype &&
        userData &&
        userData.current &&
        userDetails.id == userData.current.id &&
        userDetails.usertype === 'trainer'
      ) {
        data = await getProducts(userDetails.alias);
      } else {
        data = await getProductsCount(userDetails.alias);
      }

      DEBUG && console.log('Refreshed Data:', data);

      if (
        isLoggedin.current &&
        userDetails &&
        userData &&
        userData.current &&
        userDetails.id == userData.current.id &&
        userData.current.usertype === 'trainer'
      ) {
        // Process the data
        const sortedProducts = gatherAndSortProducts(data);
        DEBUG && console.log('Refreshed Sorted Products:', sortedProducts);
        setProducts(sortedProducts);
      } else {
        DEBUG && console.log('Refreshed Products:', data);
        setProducts(data);
      }
    } catch (error) {
      console.error('Error refreshing products:', error);
    }
  }, [userDetails?.alias, isLoggedin.current, userData.current, userDetails?.id, userDetails?.usertype]);

  const handleSportClick = useCallback((params) => {
    setShowSelectedSportProducts(params);
    playSound('popclick', '0.5');
    setShowSportProducts(true);
  }, []);

  if (loading) {
    return <Loader />;
  } else if (userDetails !== null) {
    // MARK: Markup
    return (
      <>
        {showSportProducts && showSelectedSportProducts !== null && (
          <div className="sportproducts">
            <SportProducts params={showSelectedSportProducts} onClose={setShowSportProducts} nav={false} />
          </div>
        )}

        {!showSportProducts && (
          <main id="profile" className="profile_trainer">
            {isLoggedin.current &&
              userDetails &&
              userDetails.id &&
              userData.current &&
              userData.current.id != userDetails.id &&
              hasBought &&
              rateTrainer && <RateTrainer userinput={userDetails} onClose={setRateTrainer} />}

            {userDetails && userDetails.id && readReview && (
              <ReadReview userId={userDetails.id} onClose={setReadReview} />
            )}
            <InformationModal data={firstTime} pageName="trainer" />
            {nav && <Navigation />}
            {selectedSport !== null && (
              <CreateProduct
                sport={selectedSport}
                products={products}
                setProducts={setProducts}
                toggle={setSelectedSport}
                refreshProducts={refreshProducts}
              />
            )}

            {/* Show created products modal */}
            {modal === 'products' && (
              <ProductModal
                data={selectedProduct}
                onClose={setModal}
                allData={products}
                setAllData={setProducts}
                refreshProducts={refreshProducts}
              />
            )}

            {/* Edit cover image modal */}
            {editCoverImageModal && userDetails && (
              <EditCoverImage
                data={userDetails}
                onClose={closeEditCoverImageModal}
                hasCover={hasCover}
                onDelete={async () => {
                  setDeleteLoading(true);
                  try {
                    await deleteImage({ user: userDetails.id, type: 'cover' });
                    setHasCover(false);
                    setRender(Date.now());
                    setDeleteLoading(false);
                    // ✅ Removed location.reload() - using state updates instead
                  } catch (e) {
                    console.error(e);
                    setDeleteLoading(false);
                  }
                }}
                uploaded={forceRender}
                deleteLoading={deleteLoading}
              />
            )}

            {loading ? (
              <Loader />
            ) : userDetails && !userDetails.usertype ? (
              <div className="fourofour">
                <div className="icon-fourofour"></div>
                <h2>{translate('couldnotfindtrainer', language)}</h2>
                <br />
                <Link className="button" href="/train">
                  {translate('back', language)}
                </Link>
              </div>
            ) : (
              <>
                <div className="profiletop">
                  {userDetails && userDetails.id && (
                    <Rating userDetails={userDetails} handleViewRatings={handleViewRatings} />
                  )}
                  <div className="thumb">
                    {isLoggedin.current &&
                      userData.current &&
                      userData.current.id &&
                      userDetails &&
                      userDetails.id &&
                      parseInt(userData.current.id) === parseInt(userDetails.id) && (
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
                            src={`https://traino.s3.eu-north-1.amazonaws.com/${
                              userDetails.id
                            }/profile/profile-image.webp?t=${render || Date.now()}`}
                            alt={''}
                            priority={true}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  {/* Edit profile image modal */}
                  {profileImageModal && (
                    <EditProfileImageModal
                      onClose={closeProfileImageModal}
                      uploaded={forceRender}
                      hasProfile={hasProfile}
                      deleteLoading={deleteLoading}
                      onDelete={async () => {
                        setDeleteLoading(true);
                        try {
                          await deleteImage({ user: userDetails.id, type: 'profile' });
                          setHasProfile(false);
                          setRender(Date.now());
                          setDeleteLoading(false);
                          // ✅ Removed location.reload() - using state updates instead
                        } catch (e) {
                          console.error(e);
                          setDeleteLoading(false);
                        }
                      }}
                    />
                  )}
                  <div className={`coverimage ${isFullscreen ? 'fullscreen' : ''}`} id="coverimage">
                    {isLoggedin.current &&
                      userData.current &&
                      parseInt(userData.current.id) == parseInt(userDetails.id) && (
                        <>
                          <div
                            className="btn-changecover"
                            onClick={handleChangeCover}
                            onMouseOver={() => playSound('tickclick', '0.5')}
                          ></div>
                          {/* Only show fullscreen button if there's content to display (YouTube video or cover image) */}
                          {((userDetails &&
                            userDetails.youtube_id !== null &&
                            userDetails.youtube_id !== undefined &&
                            userDetails.youtube_id !== '') ||
                            hasCover) && (
                            <div
                              className={`${isFullscreen ? 'fullscreen-on' : 'fullscreen-off'}`}
                              // className="notfullscreen"
                              onClick={handleToggleFullscreen}
                              onMouseOver={() => playSound('tickclick', '0.5')}
                            ></div>
                          )}
                        </>
                      )}
                    {userDetails &&
                    userDetails.youtube_id !== null &&
                    userDetails.youtube_id !== undefined &&
                    userDetails.youtube_id !== '' &&
                    userData.current.youtube_id !== '' ? (
                      <YoutubeCoverVideo
                        videoId={userData.current.youtube_id ?? userDetails.youtube_id}
                        uniqueKey={userDataVersion}
                      />
                    ) : (
                      hasCover && (
                        <>
                          <div className="image-background"></div>
                          <Image
                            key={render}
                            width={900}
                            height={160}
                            src={`https://traino.s3.eu-north-1.amazonaws.com/${
                              userDetails.id
                            }/cover/cover-image.webp?t=${render || Date.now()}`}
                            alt={''}
                            priority={true}
                            onError={(e) => (e.target.style.visibility = 'hidden')}
                          />
                        </>
                      )
                    )}
                  </div>
                  <div className="trainer-name-wrap">
                    <h1>
                      {(userDetails.firstname.length > 20
                        ? userDetails.firstname.slice(0, 20) + '...'
                        : userDetails.firstname) +
                        ' ' +
                        (userDetails.lastname.length > 20
                          ? userDetails.lastname.slice(0, 20) + '...'
                          : userDetails.lastname)}
                    </h1>
                    {userDetails.verified === 1 && <span className="icon-verified"></span>}
                  </div>
                  {userDetails && userDetails.milestone && <h4>{`"${userDetails.milestone}"`}</h4>}
                  <span className="membersince">
                    {translate('membersince', language)} {userDetails.registered}
                  </span>
                </div>

                {/** User logged in and watching his own page 
                <Header_DisplayButton
                  value={setDisplay}
                  links={[translate('trainer', language), translate('gallery', language)]}
                />

                {display === translate('trainer', language) && (
                  <>
                  */}
                <div className="myproducts">
                  {isLoggedin.current &&
                    userDetails &&
                    userDetails.id &&
                    userData.current &&
                    userData.current.id != userDetails.id &&
                    hasBought && (
                      <>
                        <div className="profiledetails">
                          <button className="button" onClick={() => setRateTrainer(true)}>
                            {translate('ratetrainer', language)} {hasRated && hasRated != '' && `(${hasRated})`}
                          </button>
                        </div>
                      </>
                    )}
                  <div className="profiledetails">
                    <div className="griddetails">
                      <div className="gender">
                        {userDetails.gender &&
                          (userDetails.gender === 'male'
                            ? translate('male', language)
                            : userDetails.gender === translate('female', language)
                            ? translate('female', language)
                            : '')}
                      </div>
                      <div className="address">
                        {userDetails.user_address &&
                          userDetails.user_address
                            .split(',')
                            .map((part) => part.trim())
                            .filter((part) => part.length > 0)
                            .join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="training-container">
                    <h3>{translate('sports', language)}</h3>
                    <ul className="training">
                      {isLoggedin.current &&
                      userData.current &&
                      parseInt(userData.current.id) === parseInt(userDetails.id)
                        ? // Logged-in user view
                          products &&
                          userDetails &&
                          userDetails.training &&
                          mergedTrainingItems.map((mergedItem, index) => {
                            const productItem = products.find(
                              (product) => product.category_link === mergedItem.category_link,
                            );
                            DEBUG && console.log(mergedItem);

                            return (
                              <li
                                className="trainitem"
                                key={index} // Ensure unique key
                                data-link={mergedItem.category_link}
                                onClick={(e) => productItem && handleClick(e, productItem)}
                                onMouseOver={() => playSound('tickclick', '0.5')}
                              >
                                <div className="image">
                                  <div
                                    className="btn-addproduct"
                                    onMouseOver={() => playSound('popclick', '0.5')}
                                    onClick={() => {
                                      playSound('popclick', 0.5);
                                      setSelectedSport({
                                        id: mergedItem.id,
                                        name: mergedItem.category_name,
                                        link: mergedItem.category_link,
                                      });
                                    }}
                                  >
                                    +
                                  </div>

                                  <h3>{translate(`cat_${mergedItem.category_link}`, language)}</h3>
                                  <Image
                                    className="product-image"
                                    width={460}
                                    height={120}
                                    src={getCategoryImage(mergedItem.category_link, traincategories)}
                                    alt={translate(`cat_${mergedItem.category_link}`, language)}
                                    priority={true}
                                  />
                                </div>
                                <div className="product-text">
                                  <div className="product-info">
                                    {/* Display product information */}
                                    <div className="product-icon">
                                      <span>{translate('pass', language)}</span>
                                      {mergedItem.total_trainingpasses ?? 0}
                                    </div>
                                    <div className="product-icon">
                                      <span>{translate('clipcard', language)}</span>
                                      {mergedItem.total_clipcards ?? 0}
                                    </div>
                                    <div className="product-icon">
                                      <span>{translate('program', language)}</span>
                                      {mergedItem.total_trainprograms ?? 0}
                                    </div>
                                    <div className="product-icon">
                                      <span>{translate('diet', language)}</span>
                                      {mergedItem.total_dietprograms ?? 0}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })
                        : // Logged-out user view
                          products &&
                          userDetails &&
                          userDetails.training &&
                          userDetails.training.map((userTrainingItem, index) => {
                            // Find the corresponding product item
                            const productItem = products?.find(
                              (product) => product.category_link === userTrainingItem.category_link,
                            );

                            // Merge userDetails.training and products details, defaulting to 0 for missing values
                            const item = {
                              ...userTrainingItem,
                              total_onlinetraining: productItem?.onlinetraining_count || 0,
                              total_trainingpasses: productItem?.trainingpass_count || 0,
                              total_trainprograms: productItem?.trainprogram_count || 0,
                              total_dietprograms: productItem?.dietprogram_count || 0,
                            };

                            DEBUG && console.log(productItem, item);

                            const categoryName = getCategoryName(item.category_link, traincategories);
                            const categoryImage = getCategoryImage(item.category_link, traincategories);

                            return (
                              <>
                                {nav ? (
                                  <Link
                                    href={`/trainer/@${userDetails.alias}/${item.category_link}`}
                                    key={index}
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                    onClick={() => playSound('popclick', '0.5')}
                                  >
                                    <li className="trainitem">
                                      <div className="image">
                                        <h3>{categoryName}</h3>
                                        <Image
                                          className="product-image"
                                          width={460}
                                          height={120}
                                          src={categoryImage}
                                          alt={categoryName}
                                          priority={true}
                                        />
                                      </div>
                                      <div className="product-text">
                                        <div className="product-info">
                                          <div className="icon-train product-icon">
                                            <span>{translate('pass', language)}</span>
                                            {item.total_trainingpasses ?? 0}
                                          </div>
                                          <div className="icon-clipcard product-icon">
                                            <span>{translate('online', language)}</span>
                                            {item.total_onlinetraining ?? 0}
                                          </div>
                                          <div className="icon-train product-icon">
                                            <span>{translate('program', language)}</span>
                                            {item.total_trainprograms ?? 0}
                                          </div>
                                          <div className="icon-dietprogram product-icon">
                                            <span>{translate('diet', language)}</span>
                                            {item.total_dietprograms ?? 0}
                                          </div>
                                        </div>
                                      </div>
                                    </li>
                                  </Link>
                                ) : (
                                  <div
                                    key={index}
                                    onMouseOver={() => playSound('tickclick', '0.5')}
                                    onClick={() =>
                                      handleSportClick({
                                        alias: `%40${userDetails.alias}`,
                                        sport: `${item.category_link}`,
                                      })
                                    }
                                  >
                                    <li className="trainitem">
                                      <div className="image">
                                        <h3>{categoryName}</h3>
                                        <Image
                                          className="product-image"
                                          width={460}
                                          height={120}
                                          src={categoryImage}
                                          alt={categoryName}
                                          priority={true}
                                        />
                                      </div>
                                      <div className="product-text">
                                        <div className="product-info">
                                          <div className="icon-train product-icon">
                                            <span>{translate('pass', language)}</span>
                                            {item.total_trainingpasses ?? 0}
                                          </div>
                                          <div className="icon-clipcard product-icon">
                                            <span>{translate('online', language)}</span>
                                            {item.total_onlinetraining ?? 0}
                                          </div>
                                          <div className="icon-train product-icon">
                                            <span>{translate('program', language)}</span>
                                            {item.total_trainprograms ?? 0}
                                          </div>
                                          <div className="icon-dietprogram product-icon">
                                            <span>{translate('diet', language)}</span>
                                            {item.total_dietprograms ?? 0}
                                          </div>
                                        </div>
                                      </div>
                                    </li>
                                  </div>
                                )}
                              </>
                            );
                          })}
                    </ul>
                  </div>

                  {userDetails.education !== null && (
                    <div className="education-container">
                      <h3>{translate('education', language)}</h3>
                      <ul className="education">
                        {userDetails.education.map((item, index) => (
                          <li className="education-item" key={index}>
                            <span dangerouslySetInnerHTML={{ __html: item.trim() }} />
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
                {/** </>
                )}

            {display === translate('gallery', language) && <ImageGallery userDetails={userDetails} />}
            */}
              </>
            )}
          </main>
        )}
      </>
    );
  } else {
    alert(translate('unexpectederror', language));
  }
}
