import './NotificationCard.css';
import PillButton from './PillButton';

export default function NotificationCard(props) {
    
    return (
        <div id="notification-card">
            <img className="notification-card-image" src={props.imageSrc} alt="card picture" />
            <h3 className="notification-card-title">{props.title}</h3>
            <h3>{props.subTitle}</h3>
            <p className="notification-card-text">{props.text}</p>
            <PillButton onClick={props.handleOnBackClick} text="tillbaka"/>
        </div>
    )
}

