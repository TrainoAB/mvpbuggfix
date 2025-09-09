import { useEffect, useState } from 'react';
import './DisplayChallenge.css';
import { set } from 'date-fns';

export default function DisplayChallenge({ challenge, handleDeleteChallenge, handleSendMotivation }) {

    const [challengeStatus, setChallengeStatus] = useState("");

    const handleSetCompleted = () => {
        setChallengeStatus('completed')
    }

    const handleSetPartial = () => {
        setChallengeStatus('partial')
    }

    const handleSetIncomplete = () => {
        setChallengeStatus('incomplete')
    }

    useEffect(() => {
        setChallengeStatus(Date.now() < new Date(challenge.endDate) ? "ongoing" : "ended")
    }, [])

    return (
        <div key={challenge.id} id="challenge-item" 
        className={challengeStatus}>
        
            <div className="header">
                <div className="header--left">
                    <strong>{challenge.title || 'Utmaning'}</strong>
                    <div className="end-date">End date: {challenge.endDate}</div>
                </div>
                <div className="header--right">
                    <div className="motivation-icon-container">
                        <div
                            className="icon icon__send-motivation"
                            onClick={() => handleSendMotivation(challenge)}
                        />
                    </div>
                    <button className="icon icon__delete-challenge" onClick={() => handleDeleteChallenge(challenge.id)}>✖</button>
                </div>
            </div>
            <div className='content-wrapper'>
                <div className="text-container">
                    <p>{challenge.text}</p>
                </div>
            </div>
            {/* koden nedan visas om challengeStatus är avslutat och ger användaren möjlighet att välja om utmaningen är slutförd, delvis slutförd eller inte slutförd. */}
            {challengeStatus === "ended" && <div className='selectChallengeStatus-container'>
               Waiting for customer to set status...
            </div>}
        </div>
    )
}

