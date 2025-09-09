import { useEffect, useState } from 'react';
import ButtonSetStatus from './ButtonSetStatus';
import './DisplayChallenge.css';

export default function DisplayChallengeBarbells({ challenge }) {

    const [challengeStatus, setChallengeStatus] = useState("");
    const [isStatusChoisesVisible, setIsStatusChoisesVisible] = useState(false);
    const [isStatusButtonVisible, setIsStatusButtonVisible] = useState(true);
    const [buttonEditStatus, setButtonEditStatus] = useState("invisible");
    const [isDarkDropdownVisible, setIsDarkDropdownVisible ] = useState("ended");

    const handleStatusButtonOnClick = () => {
        setIsStatusChoisesVisible(true);
        setIsStatusButtonVisible(false);
    }

    const handleSetStatus = (status) => {
        setChallengeStatus(status);
        setIsStatusChoisesVisible(false);
        setButtonEditStatus("visible");
    }

    const handleDeleteChallenge = (id) => {
        console.log('delete challenge with id:', id);
        // add logic to delete challenge from database
    }

    const handleEditStatus = () => {
        setIsStatusChoisesVisible(true);
        setIsStatusButtonVisible(false);
        setButtonEditStatus("invisible");
        setChallengeStatus("ended");

    }

    useEffect(() => {
        setChallengeStatus(Date.now() < new Date(challenge.endDate) ? "ongoing" : "ended");
    }, [challenge.endDate]);

    return (
        <div key={challenge.id} id="challenge-item" className={challengeStatus} data-status={challengeStatus}>
            <div className="header-challenges">
                <div className="header--left">
                    <strong>{challenge.title || 'Utmaning'}</strong>
                    <div className="end-date">Slutdatum: {challenge.endDate}</div>
                </div>
                <div className="header--right">
                    <button className={`icon icon__delete-challenge darkDropdown ${buttonEditStatus}`} onClick={handleEditStatus}>✎</button>
                    <button className="icon icon__delete-challenge" onClick={() => handleDeleteChallenge(challenge.id)}>✖</button>
                </div>
            </div>
            <div className='content-wrapper'>
                <div className="text-container">
                    <p>{challenge.text}</p>
                </div>
            </div>
            {challengeStatus === "ended" && isStatusButtonVisible && (
                <div className='selectChallengeStatus-container'>
                    <ButtonSetStatus buttonText="Set status" onClick={handleStatusButtonOnClick} />
                </div>
            )}
            {isStatusChoisesVisible && (
                <div className='selectChallengeStatus-container'>
                    <div className='selectChallengeStatus__item' onClick={() => handleSetStatus("incomplete")}>
                        <div className='selectChallengeStatus__item--icon incomplete'>
                            <div className='content'>✖</div>
                        </div>
                        <div className='selectChallengeStatus__item--text'>incomplete</div>
                    </div>
                    <div className='selectChallengeStatus__item' onClick={() => handleSetStatus("started")}>
                        <div className='selectChallengeStatus__item--icon started'>
                            <div className='content'>%</div>
                        </div>
                        <div className='selectChallengeStatus__item--text'>started</div>
                    </div>
                    <div className='selectChallengeStatus__item' onClick={() => handleSetStatus("almost")}>
                        <div className='selectChallengeStatus__item--icon almost'>
                            <div className='content'>✓</div>
                        </div>
                        <div className='selectChallengeStatus__item--text'>almost</div>
                    </div>
                    <div className='selectChallengeStatus__item' onClick={() => handleSetStatus("completed")}>
                        <div className='selectChallengeStatus__item--icon completed'>
                            <div className='content'>✓</div>
                        </div>
                        <div className='selectChallengeStatus__item--text'>completed</div>
                    </div>
                </div>
            )}
        </div>
    );
}