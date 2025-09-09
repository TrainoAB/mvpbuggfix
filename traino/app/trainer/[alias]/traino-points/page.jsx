'use client';

import useFetchUserData from './custom-hooks/useFetchUserData'; // custom hook för att hämta användardata från databas
import { userList } from './mock-data.js'; // koppla på innan slutgiltig push
import { rewardProductListData } from './mock-data.js';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import OrderConfirmation from './components/OrderConfirmation';
import InfoCard from './components/InfoCard';
import RewardProductCard from './components/RewardProductCard';
import RewardProductCardMini from './components/RewardProductCardMini';
import GoBackButton from './components/GoBackButton';
import PillButton from './components/PillButton';
import './page.css';

export default function TrainoPointsHome(props) {
  const userData = userList[0]; // använd mock-data tills databasen är kopplad
  const [isTrainoPointsInfoCardVisible, setIsTrainoPointsInfoCardVisible] = useState(false);
  const [selectedProductForInfoCard, setSelectedProductForInfoCard] = useState(null);
  const [orderableProducts, setOrderableProducts] = useState([]);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);

  const handleSelectedProductForInfoCard = (clickedProductId) => {
    const clickedProduct = rewardProductListData.find((p) => p.id === clickedProductId);
    setSelectedProductForInfoCard(clickedProduct);
  };

  const handleToggleOverlay = () => {
    setIsConfirmationVisible(!isConfirmationVisible);
  };

  const handleInfoIconClick = () => {
    setIsTrainoPointsInfoCardVisible(!isTrainoPointsInfoCardVisible);
  };

  const updateAfterClaiming = () => {
    rewardProductListData.find((p) => p.id === productNextToClaim.id).alreadyClaimed = true;
  };

  // Lägg till en useEffect för att hantera klick utanför RewardProductCard (info-rutan
  // försvinner när man klickar utanför dess yta)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedProductForInfoCard && !event.target.closest('#reward-product-card')) {
        setSelectedProductForInfoCard(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [selectedProductForInfoCard]);

  const fillCircle = (degrees) => {
    const outerCircle = document.querySelector('#TrainoPointsHome .outer-circle');
    if (outerCircle) {
      outerCircle.style.setProperty('--degree', `${degrees}deg`);
    }
  };

  const addSparkleEffect = () => {
    const outerCircle = document.querySelector('#TrainoPointsHome .outer-circle');
    if (outerCircle) {
      outerCircle.classList.add('sparkle');
      setTimeout(() => {
        outerCircle.classList.remove('sparkle');
      }, 1000); // Ta bort sparkle-klassen efter 1 sekund
    }
  };

  //************************* FILTERING, SORTERING & HÄMTNING AV PRODUKTER ***************************

  // Metod som hittar "beställbara" produkter dvs som användarens totala poäng räcker till
  const findingOrderableProducts = (userData, rewardProductListData) => {
    console.log('findingOrderableProducts called');
    if (!userData) {
      console.error('userData is null or undefined');
      return [];
    }
    console.log('userData was now found!');
    const numericallyByPointsSortedProducts = rewardProductListData.sort((a, b) => a.pointsRequired - b.pointsRequired);
    const userPoints = userData.points;
    const orderableProducts = [];
    for (let p = 0; p < numericallyByPointsSortedProducts.length; p++) {
      if (numericallyByPointsSortedProducts[p].pointsRequired <= userPoints)
        orderableProducts.push(numericallyByPointsSortedProducts[p]);
    }
    return orderableProducts;
  };

  // Uppdaterar listan med beställningsbara produkter när 'userData' eller 'rewardProductListData' ändras för att säkerställa korrekt inhämtad data.
  useEffect(() => {
    if (userData) {
      const orderableProducts = findingOrderableProducts(userData, rewardProductListData);
      setOrderableProducts(orderableProducts);
      console.log('Orderable products after useEffect:', orderableProducts);
    }
  }, [userData, rewardProductListData]);

  //finding the product to show in the center of the circle
  const notAlreadyClaimedProducts = rewardProductListData.filter((product) => !product.alreadyClaimed);
  const productNextToClaim = notAlreadyClaimedProducts.sort((a, b) => a.pointsRequired - b.pointsRequired)[0];

  // Beräkna graden av cirkeln baserat på användarens poäng och den valda produktens pointsRequired
  useEffect(() => {
    if (productNextToClaim && userData) {
      const degrees = (userData.points / productNextToClaim.pointsRequired) * 100 * 3.6;
      fillCircle(degrees);
      if (degrees >= 360) addSparkleEffect();
    }
  }, [productNextToClaim, userData]);

  //hämta id:n för beställbara produkter så at vi sen kan sortera när vi mappar
  const orderableProductsIds = orderableProducts.map((p) => p.id);
  // Sortera produkterna efter krävda poäng
  const rewardsSortedByPoints = rewardProductListData.sort((a, b) => a.pointsRequired - b.pointsRequired);
  // mappa dem till RewardProductCardMini-komponenter som representerar belönings-produkterna
  const rewards = rewardsSortedByPoints.map((product, index) => {
    // Om index är jämnt, placera mha css produkten till vänster, annars till höger
    const positionClass = index % 2 === 0 ? 'left' : 'right';
    return (
      <div key={product.id} className={`reward-card-container ${positionClass}`}>
        <RewardProductCardMini
          isOrderable={orderableProductsIds.includes(product.id)}
          isAlreadyOrdered={product.alreadyClaimed}
          image={product.imgUrl}
          name={product.name}
          points={product.pointsRequired}
          alt={`Bild av ${product.name}`}
          onCardButtonClick={() => handleSelectedProductForInfoCard(product.id)}
        />
      </div>
    );
  });

  //**************************************************************************************************
  //********************************************* RETURN *********************************************
  //**************************************************************************************************

  return (
    <>
      <div id="TrainoPointsHome">
        <div className="container-nav-and-info">
          {/* Gåt tillbaka till huvudmenyn eller liknande */}
          <Link href="/train">
            <GoBackButton />
          </Link>
          {/* visar info-ruta om traino-points om man klickar på info ikonen*/}
          <Image
            className="info-icon"
            width={100}
            height={100}
            src="/assets/icon-info.jpg"
            alt="Info icon"
            onClick={handleInfoIconClick}
          />
          {isTrainoPointsInfoCardVisible && <InfoCard onClick={handleInfoIconClick} />}
        </div>

        <div className="container-main">
          <h1 className="main-header">TRAINO Points</h1>
          <h2 className="subheader">Samla poäng på varje bokning eller köp</h2>
          <div className="outer-circle">
            <div className="inner-circle">
              {productNextToClaim ? (
                <img src={productNextToClaim.imgUrl} alt="product next to claim" />
              ) : (
                <p className="text-select-a-product">Ingen produkt hittad</p>
              )}
              {/* info-ruta som syns när man klickar på en av produkterna längst ner på skärmen */}
              {selectedProductForInfoCard && (
                <RewardProductCard
                  imageSrc={selectedProductForInfoCard.imgUrl}
                  title={selectedProductForInfoCard.name}
                  subTitle={selectedProductForInfoCard.pointsRequired}
                  text={selectedProductForInfoCard.longDescribingText}
                />
              )}
            </div>
          </div>
          {productNextToClaim && (
            <div className="points-info">
              <h2 className="points-subheader">
                {userData.points}/{productNextToClaim.pointsRequired} poäng{' '}
              </h2>
            </div>
          )}
          {/* Om produkt går att claima kan man klicka vidare och OrderConfirmation komponenten hamnar längst fram (täcker skärmen) */}
          {productNextToClaim.pointsRequired <= userData.points ? (
            <div className="container-ready-to-claim-reward">
              <h1 className="header">Snyggt Jobbat!</h1>
              <PillButton text="Claima din belöning" onClick={handleToggleOverlay} />
              {/* confirmation page shows on top as an overlay component */}
              {isConfirmationVisible === true ? (
                <OrderConfirmation
                  productNextToClaim={productNextToClaim}
                  user={userData}
                  isConfirmationVisible={isConfirmationVisible}
                  setIsConfirmationVisible={setIsConfirmationVisible}
                  handleToggleOverlay={handleToggleOverlay}
                  updateAfterClaiming={updateAfterClaiming}
                />
              ) : null}
            </div>
          ) : (
            <div className="container-not-ready-to-claim-reward">
              <h1 className="header">Fortsätt samla poäng!</h1>
              <p className="text">Du har ännu inte tillräckligt med poäng för denna produkt.</p>
            </div>
          )}
        </div>
        <div className="container-all-reward-choises">
          <div className="background-img"></div>
          <div className="container-rewards-card">{rewards}</div>
        </div>
      </div>
    </>
  );
}
