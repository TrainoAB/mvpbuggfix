import { useState } from 'react';
import Image from 'next/image';
import GoBackButton from './GoBackButton';
import RectangleButton from './RectangleButton';
import EstimatedDeliveryDate from './EstimatedDeliveryDate';
import NotificationCard from './NotificationCard';
import './OrderConfirmation.css';

export default function OrderConfirmation(props) {
    //avgör om notifikationskortet, nästa steg i "navigeringen", ska visas eller inte
    const [isNotificationVisible, setIsNotificationVisible] = useState(false);

    const handleShowNotificationCard = () => {
        setIsNotificationVisible(true);
    };

    const handleOnBackClick = () => {
        setIsNotificationVisible(false);
        props.setIsConfirmationVisible(false);
        //uppdaterar produktens egenskaper och visar att den nu är "claimed" och därmed inte går att claima igen
        props.updateAfterClaiming();
    };

    return (
        <div id="order-confirmation" className={props.isConfirmationVisible ? 'visible' : 'hidden'}>
            <GoBackButton onClick={props.handleToggleOverlay} />
            <div className="container-main">
                <h3 className="main-header">Tack för att du använder Traino!</h3>
                <p className="main-subheader">Din belöning kommer att skickas till ett postombud nära dig.</p>
                <hr />
                <div className="container-reward-all-products">
                    <p className="subheader-category">Din belöning</p>
                    {props.productNextToClaim ? (
                        <div className="container-reward-single-product">
                            <div className="subcontainer-left">
                                <Image width={100} height={100} src={props.productNextToClaim.imgUrl} alt={props.productNextToClaim.name} />
                                <span className="product-text">{props.productNextToClaim.name}, {props.productNextToClaim.shortDescribingText}</span>
                            </div>
                            <div className="subcontainer-right">
                                <p className="product-quantity">&nbsp;1st</p>
                            </div>
                            <br />
                        </div>
                    ) : (
                        <p>Ingen produkt vald.</p>
                    )}
                </div>
                <hr />
                <div className="container-adress-and-delivery">
                    <div className="customer-adress">
                        <p className='subheader-adress-and-delivery'>Postadress</p>
                        <p>{props.user.firstName} {props.user.lastName}</p>
                        <p>{props.user.street_adress}</p>
                        <p>{props.user.zipcode} {props.user.city}</p>
                    </div>
                    <div className="estimated-delivery-date">
                        <EstimatedDeliveryDate daysFromNow={3} />
                    </div>
                </div>
                <RectangleButton text="Skicka" onClick={handleShowNotificationCard} />
            </div>
            {isNotificationVisible ? (
                <div className="container-notification-card-overlay">
                    <NotificationCard 
                        imageSrc={"/assets/checked-circle.jpg"}
                        title="Tack!"
                        subTitle=""
                        text="Du kommer få ett mail när din vara finns att hämta ut via ditt närmaste postombud."
                        linkUrl="../traino-points"
                        handleOnBackClick={handleOnBackClick}
                    />
                </div>
            ) : null}
        </div>
    );
}
