import Image from 'next/image';
import './RewardProductCard.css';

export default function RewardProductCard(props) {
    return (
        <div id="reward-product-card">
            <Image width={200} height={200} className="reward-product-card-image" src={props.imageSrc} alt="card picture" />
            <p className="reward-header">{props.title}</p>
            <p className="reward-subheader">{props.subTitle} Poäng</p>
            <div className="container-describing-text">
                <p>{props.text}</p>
            </div>
        </div>
    )
}

