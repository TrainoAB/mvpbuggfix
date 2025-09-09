'use client';
import GoBackButton from "./GoBackButton"
import { useRouter } from 'next/navigation';
import './HeaderMyTrainee.css'

export default function HeaderMyTrainee(props) {
    
    const router = useRouter();
    const handleOnClick = () => {
        router.back();
    }

    return (
            <div id="header-my-trainee"> 
                <div onClick={handleOnClick}>
                    <GoBackButton />
                </div>               
                <span className="header__title">{props.title}</span>
            </div>)
}